// Text → SVG paths.
//
// GitHub serves README images with `Content-Security-Policy: default-src 'none'`, which blocks
// web fonts (even data: URIs) inside the SVG. So every string is converted to glyph outlines:
// each glyph is defined once in <defs> and placed with <use>, which keeps the file small.
import opentype from 'opentype.js';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const PKG = { disp: 'saira', body: 'barlow', label: 'barlow-semi-condensed', mono: 'jetbrains-mono' };
const fontCache = new Map();

export function loadFont(fam, weight) {
  const key = `${fam}:${weight}`;
  if (!fontCache.has(key)) {
    const pkg = PKG[fam];
    if (!pkg) throw new Error(`unknown font family "${fam}"`);
    const dir = dirname(require.resolve(`@fontsource/${pkg}/package.json`));
    const buf = readFileSync(join(dir, 'files', `${pkg}-latin-${weight}-normal.woff`));
    fontCache.set(key, opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)));
  }
  return fontCache.get(key);
}

// Glyphs the Latin subsets do not have, drawn as vectors (font units, y down, baseline at 0).
const circle = (cx, cy, r) => { const k = r * 0.5523; return `M${cx - r} ${cy}C${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r}C${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy}C${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r}C${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy}Z`; };
const star = (cx, cy, R, r) => 'M' + Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; return `${(cx + rr * Math.cos(a)).toFixed(0)} ${(cy + rr * Math.sin(a)).toFixed(0)}`; }).join('L') + 'Z';
export const SYMBOLS = {
  '→': { adv: 780, d: 'M80 -365H585L430 -520L480 -570L720 -330L480 -90L430 -140L585 -295H80Z' },
  '●': { adv: 800, d: circle(400, -340, 270) },
  '✓': { adv: 800, d: 'M100 -360L180 -440L320 -300L620 -620L700 -540L320 -140Z' },
  '★': { adv: 840, d: star(420, -360, 360, 150) },
};

const parseLs = ls => (ls == null ? 0 : typeof ls === 'number' ? ls : parseFloat(String(ls)) || 0); // em

export class TextRenderer {
  constructor(prefix = 'g') { this.prefix = prefix; this.defs = new Map(); this.clipN = 0; }

  glyphRef(fam, weight, font, ch) {
    const key = `${fam}:${weight}:${ch}`;
    if (this.defs.has(key)) return this.defs.get(key);
    let d, adv, dx = 0;
    const idx = font.charToGlyphIndex(ch);
    if (idx === 0 && SYMBOLS[ch]) {
      const s = SYMBOLS[ch];
      d = s.d; adv = s.adv;
      if (fam === 'mono') { adv = font.charToGlyph('M').advanceWidth; dx = (adv - s.adv) / 2; } // keep the monospace grid
    } else {
      if (idx === 0 && ch.trim()) throw new Error(`glyph "${ch}" (U+${ch.codePointAt(0).toString(16)}) missing from ${fam} ${weight}`);
      const g = font.glyphs.get(idx);
      adv = g.advanceWidth;
      d = g.getPath(0, 0, font.unitsPerEm).toPathData(0);
    }
    const ref = { id: d ? `${this.prefix}${this.defs.size.toString(36)}` : null, d, adv, dx, idx };
    this.defs.set(key, ref);
    return ref;
  }

  // Lays out a string: glyph refs with x positions in font units.
  layout(s, { f = 'body', w = 400, ls } = {}) {
    const font = loadFont(f, w), lsU = parseLs(ls) * font.unitsPerEm;
    const out = []; let x = 0, prev = null;
    for (const ch of String(s)) {
      const ref = this.glyphRef(f, w, font, ch);
      if (prev && prev.idx && ref.idx) x += font.getKerningValue(font.glyphs.get(prev.idx), font.glyphs.get(ref.idx));
      out.push({ ref, x });
      x += ref.adv + lsU;
      prev = ref;
    }
    return { glyphs: out, width: out.length ? x - lsU : 0, font };
  }

  measure(s, o = {}) { const l = this.layout(s, o); return l.width * (o.size || 14) / l.font.unitsPerEm; }

  // Greedy word wrap to a pixel width.
  wrap(s, maxPx, o = {}) {
    const lines = []; let line = '';
    for (const word of String(s).split(/\s+/)) {
      const t = line ? line + ' ' + word : word;
      if (line && this.measure(t, o) > maxPx) { lines.push(line); line = word; } else line = t;
    }
    if (line) lines.push(line);
    return lines;
  }

  // Truncates with an ellipsis to fit maxPx.
  fit(s, maxPx, o = {}) {
    if (this.measure(s, o) <= maxPx) return s;
    let t = String(s);
    while (t.length > 1 && this.measure(t + '…', o) > maxPx) t = t.slice(0, -1).trimEnd();
    return t + '…';
  }

  // Draws text. Options mirror the mockup's T(): f, size, w, fill, ls, anchor, extra (attributes for a wrapper <g>).
  T(x, y, s, o = {}) {
    const size = o.size || 14, l = this.layout(s, o), k = size / l.font.unitsPerEm;
    const wPx = l.width * k, x0 = o.anchor === 'end' ? x - wPx : o.anchor === 'middle' ? x - wPx / 2 : x;
    const fill = o.fill || '#CDD2E6';
    let body;
    if (String(fill).startsWith('url(')) {
      // Gradient text: a gradient rect clipped to the glyph outlines, so the gradient spans the whole string.
      const id = `${this.prefix}c${(this.clipN++).toString(36)}`;
      const uses = l.glyphs.filter(g => g.ref.id).map(g => `<use href="#${g.ref.id}" transform="translate(${r2(x0 + (g.x + g.ref.dx) * k)} ${r2(y)}) scale(${r5(k)})"/>`).join('');
      const asc = l.font.ascender * k, desc = -l.font.descender * k;
      body = `<clipPath id="${id}">${uses}</clipPath><rect x="${r2(x0)}" y="${r2(y - asc)}" width="${r2(wPx)}" height="${r2(asc + desc)}" fill="${fill}" clip-path="url(#${id})"/>`;
    } else {
      const uses = l.glyphs.filter(g => g.ref.id).map(g => `<use href="#${g.ref.id}"${g.x + g.ref.dx ? ` x="${Math.round(g.x + g.ref.dx)}"` : ''}/>`).join('');
      body = `<g transform="translate(${r2(x0)} ${r2(y)}) scale(${r5(k)})" fill="${fill}"${o.opacity != null ? ` opacity="${o.opacity}"` : ''}>${uses}</g>`;
    }
    return o.extra ? `<g ${o.extra}>${body}</g>` : body;
  }

  // A clipPath shaped like the text (for effects such as a moving sheen). Returns the def and the text box.
  clipText(x, y, s, o = {}) {
    const size = o.size || 14, l = this.layout(s, o), k = size / l.font.unitsPerEm, wPx = l.width * k;
    const id = `${this.prefix}c${(this.clipN++).toString(36)}`, asc = l.font.ascender * k, desc = -l.font.descender * k;
    const uses = l.glyphs.filter(g => g.ref.id).map(g => `<use href="#${g.ref.id}" transform="translate(${r2(x + (g.x + g.ref.dx) * k)} ${r2(y)}) scale(${r5(k)})"/>`).join('');
    return { id, def: `<clipPath id="${id}">${uses}</clipPath>`, x, y: y - asc, w: wPx, h: asc + desc };
  }

  // Several differently coloured runs on one baseline (replaces <tspan>). runs: [[text, fill, weight?], ...]
  TS(x, y, runs, o = {}) {
    let out = '', cx = x;
    for (const [s, fill, w] of runs) {
      const oo = { ...o, fill, w: w || o.w || 400, anchor: undefined };
      out += this.T(cx, y, s, oo);
      cx += this.measure(s, oo) + parseLs(o.ls) * (o.size || 14);
    }
    return out;
  }

  defsSvg() { return [...this.defs.values()].filter(g => g.id).map(g => `<path id="${g.id}" d="${g.d}"/>`).join(''); }
}

const r2 = v => +v.toFixed(2);
const r5 = v => +v.toFixed(5);
