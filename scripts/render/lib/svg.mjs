// Shared drawing primitives (ported from the approved mockup "N").
import { TextRenderer } from './fonts.mjs';

export const C = {
  bg: '#060818', bg2: '#090C22', line: 'rgba(140,120,255,.28)', white: '#FFFFFF', text: '#CDD2E6', muted: '#A9AFCB', dim: '#7C83A5',
  cyan: '#22D8F0', blue: '#2F9BFF', indigo: '#6C5CFF', magenta: '#D946E6', violet: '#A57BFF', lav: '#C4B0FF', green: '#2EE08A', amber: '#FFB547', red: '#FF4D6D',
};
export const F = { disp: 'disp', body: 'body', label: 'label', mono: 'mono' };
export const LANG_TINT = ['#22D8F0', '#2F9BFF', '#6C5CFF', '#A57BFF', '#D946E6', '#FF6FB5', '#7C83A5', '#4A5070'];

// One document is rendered at a time; sections read the shared context.
export const ctx = { r: null, anim: true, p: 'x-', id: 0, css: [] };
export function beginDoc({ anim = true } = {}) { ctx.r = new TextRenderer('g'); ctx.anim = anim; ctx.id = 0; ctx.css = []; return ctx; }
// Sections can register extra CSS (per-document keyframes); emitted once in <style>.
export const css = rule => { if (ctx.anim) ctx.css.push(rule); };
export const uid = tag => `${ctx.p}${tag}${(ctx.id++).toString(36)}`;
export const T = (x, y, s, o) => ctx.r.T(x, y, s, o);
export const TS = (x, y, runs, o) => ctx.r.TS(x, y, runs, o);
export const measure = (s, o) => ctx.r.measure(s, o);
export const wrap = (s, px, o) => ctx.r.wrap(s, px, o);
export const fit = (s, px, o) => ctx.r.fit(s, px, o);
export const clipText = (x, y, s, o) => ctx.r.clipText(x, y, s, o);

export const fmt = n => (n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n));
export const fmtInt = n => Math.round(n).toLocaleString('en-US');
export const fmtBig = n => (n >= 1e9 ? (n / 1e9).toFixed(1) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : String(Math.round(n)));
export const tone = (v, warn, crit) => (v > crit ? C.red : v > warn ? C.amber : C.green);
export const isNum = v => typeof v === 'number' && Number.isFinite(v);

export function defs(p) {
  return `<radialGradient id="${p}gv" cx="88%" cy="0%" r="70%"><stop offset="0" stop-color="#8B55F5" stop-opacity=".30"/><stop offset="1" stop-color="#8B55F5" stop-opacity="0"/></radialGradient>
<linearGradient id="${p}word" x1="0" x2="1"><stop offset="0" stop-color="#22D8F0"/><stop offset=".55" stop-color="#2F9BFF"/><stop offset="1" stop-color="#3A6BFF"/></linearGradient>
<linearGradient id="${p}neon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22D8F0"/><stop offset=".5" stop-color="#6C5CFF"/><stop offset="1" stop-color="#D946E6"/></linearGradient>
<linearGradient id="${p}neonh" x1="0" x2="1"><stop offset="0" stop-color="#22D8F0"/><stop offset=".5" stop-color="#6C5CFF"/><stop offset="1" stop-color="#D946E6"/></linearGradient>
<linearGradient id="${p}neonv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22D8F0"/><stop offset=".5" stop-color="#6C5CFF"/><stop offset="1" stop-color="#D946E6"/></linearGradient>
<linearGradient id="${p}panel" x1="0" x2="1" y1="0" y2=".3"><stop offset="0" stop-color="#28145A" stop-opacity=".55"/><stop offset=".6" stop-color="#0E0E30" stop-opacity=".55"/><stop offset="1" stop-color="#3C186E" stop-opacity=".45"/></linearGradient>
<filter id="${p}glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<linearGradient id="${p}streak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22D8F0" stop-opacity="0"/><stop offset="1" stop-color="#9FF3FF"/></linearGradient>
<linearGradient id="${p}sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#E9FDFF" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="${p}band" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#22D8F0" stop-opacity="0"/><stop offset=".5" stop-color="#22D8F0" stop-opacity=".22"/><stop offset="1" stop-color="#22D8F0" stop-opacity="0"/></linearGradient>
<linearGradient id="${p}scan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22D8F0" stop-opacity="0"/><stop offset=".5" stop-color="#22D8F0" stop-opacity=".07"/><stop offset="1" stop-color="#22D8F0" stop-opacity="0"/></linearGradient>`;
}

// Loops that matter are CSS (so prefers-reduced-motion can stop them); SMIL is used only where CSS cannot animate the attribute.
export function animStyle(p) {
  const R = `.${p}R`;
  return `<style>
${R} .hc{opacity:0;transform-box:fill-box;transform-origin:center;animation:${p}pop .45s cubic-bezier(.2,.8,.2,1) forwards}
${R} .tw{opacity:0;transform-box:fill-box;transform-origin:center;animation:${p}pop .45s cubic-bezier(.2,.8,.2,1) forwards,${p}tw 3.4s ease-in-out infinite}
${R} .grow{transform-box:fill-box;transform-origin:left center;animation:${p}grow 1.6s cubic-bezier(.2,.8,.2,1) .3s both}
${R} .fade{animation:${p}fade .8s cubic-bezier(.2,.8,.2,1) both}
${R} .pulse{animation:${p}pulse 1.8s ease-in-out infinite}
${R} .blink{animation:${p}blink 1.05s steps(1,end) infinite}
${R} .ring{transform-box:fill-box;transform-origin:center;animation:${p}ring 2.4s ease-out infinite}
${R} .spin{transform-box:fill-box;transform-origin:center;animation:${p}spin var(--d,1.6s) linear infinite}
@keyframes ${p}pop{from{opacity:0;transform:scale(.2)}to{opacity:1;transform:scale(1)}}
@keyframes ${p}tw{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes ${p}grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes ${p}fade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes ${p}pulse{50%{opacity:.25}}
@keyframes ${p}blink{50%{opacity:0}}
@keyframes ${p}ring{from{opacity:.9;transform:scale(1)}to{opacity:0;transform:scale(3.2)}}
@keyframes ${p}spin{to{transform:rotate(360deg)}}
${ctx.css.join('\n')}
@media (prefers-reduced-motion:reduce){${R} *{animation:none!important}${R} .hc,${R} .tw{opacity:1}}
</style>`;
}

// Expanding ring around "live" dots (CSS, so reduced-motion stops it).
export const pulseRing = (cx, cy, c, r0 = 4.5, delay = 0) => (ctx.anim ? `<circle class="ring" cx="${cx}" cy="${cy}" r="${r0}" fill="none" stroke="${c}" stroke-width="1.2" style="animation-delay:${delay}s"/>` : '');

// Discrete "typing" reveal: a clip rect whose width steps through each prefix width.
export function typer(x, yTop, h, text, o) {
  const id = uid('ty'), ws = [0];
  for (let i = 1; i <= text.length; i++) ws.push(measure(text.slice(0, i), o));
  const dur = (text.length * (o.cps || 0.045)).toFixed(2), begin = o.begin ?? 0.6;
  return {
    id,
    clip: `<clipPath id="${id}"><rect x="${x - 2}" y="${yTop}" height="${h}" width="0"><animate attributeName="width" values="${ws.map(w => (w + 4).toFixed(1)).join(';')}" dur="${dur}s" begin="${begin}s" fill="freeze" calcMode="discrete"/></rect></clipPath>`,
    cursor: `<rect class="blink" x="${(x + ws[ws.length - 1] + 3).toFixed(1)}" y="${yTop + 4}" width="2" height="${h - 8}" fill="${C.cyan}"><animate attributeName="x" values="${ws.map(w => (x + w + 3).toFixed(1)).join(';')}" dur="${dur}s" begin="${begin}s" fill="freeze" calcMode="discrete"/></rect>`,
  };
}

export function hdr(p, hy, title, right, o = {}) {
  let s = '';
  if (o.num) s += T(48, hy - 30, o.num, { f: F.mono, size: 11, w: 500, fill: C.magenta, ls: '.14em' });
  s += T(48, hy, title, { f: F.disp, size: o.size || 26, w: 700, fill: C.white, ls: '.09em' });
  if (right) s += T(832, hy - 1, right, { f: F.label, size: 12, w: 700, fill: o.rightFill || C.cyan, ls: '.16em', anchor: 'end' });
  return s;
}

export function termWin(p, x, y, w, h, title, o = {}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#03050F" stroke="${o.active ? 'rgba(34,216,240,.55)' : C.line}"/>
<path d="M${x + 6} ${y + 0.5}H${x + w - 6}A5.5 5.5 0 0 1 ${x + w - 0.5} ${y + 6}V${y + 30}H${x + 0.5}V${y + 6}A5.5 5.5 0 0 1 ${x + 6} ${y + 0.5}Z" fill="#0B0F26"/>
<rect x="${x}" y="${y + 30}" width="${w}" height="1" fill="${C.line}"/>
<circle cx="${x + 18}" cy="${y + 15.5}" r="5" fill="#FF5F57"/><circle cx="${x + 35}" cy="${y + 15.5}" r="5" fill="#FEBC2E"/><circle cx="${x + 52}" cy="${y + 15.5}" r="5" fill="#28C840"/>` +
    T(x + w / 2, y + 20, title, { f: F.mono, size: 11, fill: C.dim, anchor: 'middle' });
}

export const icon = {
  repo: (x, y, c, s = 0.75) => `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/></g>`,
  star: (x, y, c, s = 0.6) => `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></g>`,
  pin: (x, y, c = C.violet) => `<g transform="translate(${x} ${y}) scale(0.625)" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></g>`,
  chip: (x, y, c) => `<g transform="translate(${x} ${y}) scale(.8)" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/></g>`,
};

export function langBar(p, langs, x, y, w, h = 10) {
  const id = uid('lb');
  let cx = x, out = `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}"/></clipPath><g clip-path="url(#${id})">`;
  langs.forEach(([, pct], i) => { const lw = (w * pct) / 100; out += `<rect x="${cx.toFixed(1)}" y="${y}" width="${(lw + 0.5).toFixed(1)}" height="${h}" fill="${LANG_TINT[i % LANG_TINT.length]}"/>`; cx += lw; });
  return out + `<rect x="${cx.toFixed(1)}" y="${y}" width="${Math.max(0, x + w - cx).toFixed(1)}" height="${h}" fill="rgba(140,120,255,.18)"/></g>`;
}

export function statusPill(p, xr, y, state) {
  const map = { ok: ['ALL SYSTEMS NOMINAL', C.green, 'rgba(46,224,138,.10)', 'rgba(46,224,138,.45)'], alert: [state.text, C.red, 'rgba(255,77,109,.12)', 'rgba(255,77,109,.5)'], stale: [state.text, C.amber, 'rgba(255,181,71,.10)', 'rgba(255,181,71,.45)'] };
  const [t, c, bg, st] = map[state.kind];
  const w = Math.max(180, measure(t, { f: F.label, size: 12, w: 700, ls: '.12em' }) + 52);
  return `<rect x="${xr - w}" y="${y - 19}" width="${w}" height="28" rx="14" fill="${bg}" stroke="${st}"/>` + pulseRing(xr - w + 20, y - 5, c, 4) +
    `<circle cx="${xr - w + 20}" cy="${y - 5}" r="4" fill="${c}" filter="url(#${p}glow)"/>` + T(xr - w + 32, y, t, { f: F.label, size: 12, w: 700, fill: c, ls: '.12em' });
}

export function ring(p, cx, cy, r, pct) {
  const len = 2 * Math.PI * r, on = (len * Math.min(pct, 100)) / 100;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(140,120,255,.16)" stroke-width="6"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#${p}neon)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${on} ${len}" transform="rotate(-90 ${cx} ${cy})" filter="url(#${p}glow)"/>`;
}

// Stacks sections on one canvas with dividers, drifting glows and the signal rail on the left.
export function canvas(sections, o = {}) {
  const p = ctx.p, w = 880;
  let y = 0, body = '';
  const marks = [];
  sections.forEach((s, i) => {
    const r = s(p);
    if (i && o.divider) body += `<rect x="48" y="${y}" width="784" height="1" fill="url(#${p}neonh)" opacity=".28"/>`;
    body += `<g transform="translate(0 ${y})">${r.out}</g>`;
    if (r.mark != null) marks.push(y + r.mark);
    y += r.h;
  });
  const h = y, glows = (o.glows || []).map(([cx, cy, rr, c, op]) => [cx, typeof cy === 'function' ? cy(h) : cy, rr, c, op]);
  let rail = '';
  if (o.rail && marks.length > 1) {
    const a = marks[0], b = marks[marks.length - 1], span = b - a;
    rail = `<rect x="23.5" y="${a}" width="1" height="${span}" fill="url(#${p}neonv)" opacity=".55"/>` + marks.map(m => `<circle cx="24" cy="${m}" r="4" fill="${C.bg}" stroke="${C.cyan}" stroke-width="1.6" filter="url(#${p}glow)"/>`).join('');
    if (ctx.anim) {
      // A signal travels down the rail (like a rung going true); each marker flashes as it passes. Pure CSS.
      const dur = 9, move = 0.7;
      css(`.${p}streak{animation:${p}streak ${dur}s linear infinite}@keyframes ${p}streak{0%{transform:translateY(0);opacity:1}${move * 100 - 2}%{opacity:1}${move * 100}%{transform:translateY(${span}px)}${move * 100 + 4}%,100%{transform:translateY(${span}px);opacity:0}}`);
      css(`.${p}flash{opacity:0;transform-box:fill-box;transform-origin:center;animation:${p}flash ${dur}s linear infinite}@keyframes ${p}flash{0%{opacity:1;transform:scale(1.8)}5%,100%{opacity:0;transform:scale(1)}}`);
      rail += `<clipPath id="${p}railc"><rect x="14" y="${a}" width="20" height="${span}"/></clipPath><g clip-path="url(#${p}railc)"><rect class="${p}streak" x="22.5" y="${a - 90}" width="3" height="90" fill="url(#${p}streak)"/></g>`;
      rail += marks.map(m => `<circle class="${p}flash" cx="24" cy="${m}" r="4" fill="${C.cyan}" filter="url(#${p}glow)" style="animation-delay:${((((m - a) / span) * move) * dur).toFixed(2)}s"/>`).join('');
    }
  }
  const glowDefs = glows.map(([cx, cy, rr, c, op], i) => `<radialGradient id="${p}gl${i}" cx="${cx}" cy="${cy}" r="${rr}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${c}" stop-opacity="${op}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`).join('');
  glows.forEach((g, i) => css(`.${p}gd${i}{animation:${p}gd${i} ${16 + i * 3}s ease-in-out infinite alternate}@keyframes ${p}gd${i}{to{transform:translate(${i % 2 ? -90 : 90}px,50px)}}`));
  const stroke = o.border === 'neon' ? `url(#${p}neon)" stroke-opacity=".7` : C.line;
  const meta = o.title ? `<title>${esc(o.title)}</title>${o.desc ? `<desc>${esc(o.desc)}</desc>` : ''}` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"${ctx.anim ? ` class="${p}R"` : ''}>${meta}${ctx.anim ? animStyle(p) : ''}
<defs>${defs(p)}${glowDefs}${ctx.r.defsSvg()}<clipPath id="${p}clip"><rect width="${w}" height="${h}" rx="6"/></clipPath></defs>
<g clip-path="url(#${p}clip)"><rect width="${w}" height="${h}" fill="${C.bg}"/>${glows.map((g, i) => `<rect${ctx.anim ? ` class="${p}gd${i}"` : ''} width="${w}" height="${h}" fill="url(#${p}gl${i})"/>`).join('')}
${body}${rail}</g>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="6" fill="none" stroke="${stroke}"/></svg>`;
}

export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
