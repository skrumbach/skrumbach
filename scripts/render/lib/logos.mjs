// Company logo badges for the career section (monochrome, tinted to the palette).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { C } from './svg.mjs';

const DIR = fileURLToPath(new URL('../../../assets/logos/', import.meta.url));
const cache = new Map();
function load(file) {
  if (!cache.has(file)) {
    const svg = readFileSync(DIR + file, 'utf8');
    const vb = svg.match(/viewBox="([^"]+)"/)?.[1];
    const body = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/)?.[1];
    if (!vb || !body) throw new Error(`logo ${file}: missing viewBox or body`);
    if (/<script|\son\w+=|href="(?!#)/i.test(body)) throw new Error(`logo ${file}: contains scripts, handlers or external refs`);
    cache.set(file, { vb: vb.split(/\s+/).map(Number), body: body.replace(/\s+/g, ' ').trim() });
  }
  return cache.get(file);
}

// cfg.logos: [{ match: 'BMW', file: 'bmw.svg' }, ...]
export const logoKey = (cfg, company) => (cfg.logos || []).find(l => company.toLowerCase().includes(l.match.toLowerCase()))?.file ?? null;

export function logoBadge(file, x, y, w, h, o = {}) {
  const L = load(file), [, , vw, vh] = L.vb, sc = Math.min((w - 22) / vw, (h - 13) / vh), lw = vw * sc, lh = vh * sc;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${C.bg2}" stroke="${o.now ? 'rgba(34,216,240,.6)' : C.line}"/>` +
    `<g transform="translate(${(x + (w - lw) / 2).toFixed(2)} ${(y + (h - lh) / 2).toFixed(2)}) scale(${sc.toFixed(5)})" fill="${o.color || C.lav}" opacity=".88">${L.body}</g>`;
}
