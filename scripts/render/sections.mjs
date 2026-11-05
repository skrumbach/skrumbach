// Page sections (ported from the approved mockup "N"). Each returns p => ({ h, out, mark }).
import { C, F, LANG_TINT, ctx, T, TS, measure, wrap, fit, clipText, css, uid, fmtInt, fmtBig, tone, isNum, hdr, termWin, icon, langBar, statusPill, pulseRing, typer } from './lib/svg.mjs';
import { logoBadge, logoKey } from './lib/logos.mjs';

const A = () => ctx.anim;
const dash = '—';
const num = (v, f = String) => (isNum(v) ? f(v) : dash);
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WDN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/* ---------------- hero ---------------- */
export const hero = (cfg, H) => p => {
  const h = cfg.hero;
  let out = T(48, 70, h.eyebrow, { f: F.label, size: 13, w: 600, fill: C.cyan, ls: '.24em' });
  h.tags.forEach((t, i) => (out += T(832, 70 + i * 18, t, { f: F.mono, size: 11, fill: C.dim, anchor: 'end', ls: '.1em' })));
  out += T(44, 150, h.first, { f: F.disp, size: 70, w: 800, fill: C.white, ls: '.01em' });
  out += T(44, 222, h.last, { f: F.disp, size: 70, w: 800, fill: `url(#${p}word)`, ls: '.01em' });
  if (A()) { // sheen sweeping across the last name
    const c = clipText(44, 222, h.last, { f: F.disp, size: 70, w: 800, ls: '.01em' });
    css(`.${p}sheen{animation:${p}sheen 7s cubic-bezier(.4,0,.2,1) 1.4s infinite}@keyframes ${p}sheen{0%{transform:translateX(0)}32%,100%{transform:translateX(${Math.round(c.w + 220)}px)}}`);
    out += c.def + `<g clip-path="url(#${c.id})"><rect class="${p}sheen" x="${(c.x - 210).toFixed(1)}" y="${c.y.toFixed(1)}" width="200" height="${c.h.toFixed(1)}" fill="url(#${p}sheen)"/></g>`;
  }
  const tag = { f: F.body, size: 19, w: 400 };
  if (A()) { const t = typer(48, 244, 30, h.tagline, { ...tag, begin: 0.8, cps: 0.042 }); out += t.clip + T(48, 266, h.tagline, { ...tag, fill: C.text, extra: `clip-path="url(#${t.id})"` }) + t.cursor; }
  else out += T(48, 266, h.tagline, { ...tag, fill: C.text });
  out += pulseRing(53, 303, C.green) + `<circle cx="53" cy="303" r="4.5" fill="${C.green}" filter="url(#${p}glow)"/>` + T(68, 308, h.currently, { f: F.label, size: 13, w: 600, fill: C.white, ls: '.12em' });
  // live chip: right-aligned, sized to its text
  const chip = H.never ? 'HOMELAB · CONNECTING' : H.stale ? `HOMELAB · LAST SEEN ${H.updatedDate}` : `HOMELAB · ${num(H.nodes)} NODES · ${num(H.pods)} PODS · ${num(H.uptime)}D UP`;
  const cw = measure(chip, { f: F.mono, size: 11, w: 500 }) + 40, cc = H.stale ? C.amber : C.green;
  out += `<rect x="${(832 - cw).toFixed(1)}" y="288" width="${cw.toFixed(1)}" height="30" rx="4" fill="rgba(3,5,15,.6)" stroke="${C.line}"/><circle cx="${(848 - cw).toFixed(1)}" cy="303" r="3.5" fill="${cc}" filter="url(#${p}glow)"${A() ? ' class="pulse"' : ''}/>`;
  out += T(860 - cw, 307, chip, { f: F.mono, size: 11, w: 500, fill: H.stale ? C.amber : C.cyan });
  return { h: 340, out };
};

/* ---------------- about ---------------- */
export const about = (cfg, o = {}) => p => {
  const hy = o.hy ?? 70, top = hy + 44, body = { f: F.body, size: 17, w: 400, ls: '.01em' };
  let out = hdr(p, hy, 'ABOUT', '', { num: o.num }), y = top + 8;
  cfg.about.forEach((para, i) => {
    wrap(para, 740, body).forEach(l => { out += T(48, y, l, { ...body, fill: C.text }); y += 27; });
    if (i < cfg.about.length - 1) y += 16;
  });
  y += 12;
  out += icon.pin(48, y) + T(70, y + 13, cfg.location.toUpperCase(), { f: F.label, size: 12, w: 600, fill: C.muted, ls: '.18em' });
  return { h: y + 50, out, mark: hy - 9 };
};

/* ---------------- homelab: k9s terminal + AI gateway + GPU ---------------- */
function k9sBody(p, x, y, w, H) {
  let out = '';
  const kv = [['Context:', H.context], ['Nodes:', `${num(H.nodes)} × control-plane`], ['Talos Rev:', H.talos ? 'v' + H.talos : dash], ['K8s Rev:', H.kubernetes ? 'v' + H.kubernetes : dash], ['Flux Rev:', H.flux ? 'v' + H.flux : dash]];
  kv.forEach(([k, v], i) => (out += T(x, y + i * 20, k, { f: F.mono, size: 13, w: 700, fill: C.amber }) + T(x + 108, y + i * 20, v, { f: F.mono, size: 13, fill: C.white })));
  const bx = x + w * 0.52, n = 24, cw = measure('|', { f: F.mono, size: 13 });
  const bar = (yy, label, v) => {
    const on = isNum(v) ? Math.max(0, Math.min(n, Math.round((n * v) / 100))) : 0;
    let s = T(bx, yy, label, { f: F.mono, size: 13, w: 700, fill: C.amber }) + TS(bx + 52, yy, [['[' + ' '.repeat(n) + '] ', C.dim], [isNum(v) ? v.toFixed(1).padStart(5) + '%' : '    ' + dash, C.white]], { f: F.mono, size: 13 });
    if (!on) return s;
    const pipes = T(bx + 52 + cw, yy, '|'.repeat(on), { f: F.mono, size: 13, fill: tone(v, 75, 90) });
    if (!A()) return s + pipes;
    const id = uid('bar');
    return s + `<clipPath id="${id}"><rect x="${(bx + 52 + cw).toFixed(1)}" y="${yy - 13}" height="17" width="0"><animate attributeName="width" values="${Array.from({ length: on + 1 }, (_, i) => (i * cw).toFixed(1)).join(';')}" dur="${(on * 0.07).toFixed(2)}s" begin="1.2s" fill="freeze" calcMode="discrete"/></rect></clipPath><g clip-path="url(#${id})">${pipes}</g>`;
  };
  out += bar(y, 'CPU:', H.cpu) + bar(y + 20, 'MEM:', H.mem);
  const gpu = [isNum(H.gpuPower) && `${Math.round(H.gpuPower)} W`, isNum(H.gpuTemp) && `${Math.round(H.gpuTemp)}°C`].filter(Boolean).join(' · ') || dash;
  out += T(bx, y + 40, 'GPU:', { f: F.mono, size: 13, w: 700, fill: C.amber }) + T(bx + 52, y + 40, gpu, { f: F.mono, size: 13, fill: C.white });
  out += T(bx, y + 60, 'ALRT:', { f: F.mono, size: 13, w: 700, fill: C.amber }) + T(bx + 52, y + 60, !isNum(H.alerts) ? dash : H.alerts ? `${H.alerts} firing` : '0 firing ✓', { f: F.mono, size: 13, fill: !isNum(H.alerts) ? C.dim : H.alerts ? C.red : C.green });
  // summary table
  const ty = y + 104;
  out += `<rect x="${x - 8}" y="${ty - 4}" width="${w + 16}" height="1" fill="${C.cyan}" opacity=".45"/><rect x="${x + w / 2 - 92}" y="${ty - 14}" width="184" height="20" fill="#03050F"/>` + T(x + w / 2, ty + 1, 'Cluster(all)[summary]', { f: F.mono, size: 12, w: 700, fill: C.cyan, anchor: 'middle' });
  const cols = [0, 0.3, 0.5, 0.72].map(f => x + f * w);
  ['METRIC', 'VALUE', 'STATUS', 'SOURCE'].forEach((h, i) => (out += T(cols[i], ty + 28, h, { f: F.mono, size: 12, w: 700, fill: C.white })));
  const ready = isNum(H.nodesReady) && isNum(H.nodes) ? (H.nodesReady >= H.nodes ? 'Ready' : 'Degraded') : dash;
  const rows = [
    ['nodes/ready', isNum(H.nodesReady) ? `${H.nodesReady}/${num(H.nodes)}` : num(H.nodes), ready],
    ['pods/running', num(H.pods), isNum(H.pods) ? 'Running' : dash],
    ['uptime', isNum(H.uptime) ? H.uptime + 'd' : dash, isNum(H.uptime) ? 'Healthy' : dash],
    ['cluster/age', isNum(H.age) ? H.age + 'd' : dash, isNum(H.age) ? 'Healthy' : dash],
    ['alerts/active', num(H.alerts), !isNum(H.alerts) ? dash : H.alerts ? 'Firing' : 'Clear'],
  ];
  const r0 = ty + 52;
  if (A()) css(`.${p}sel{animation:${p}sel 9.6s steps(1,end) 2s infinite}@keyframes ${p}sel{${[0, 1, 2, 3, 4, 3, 2, 1].map((r, i) => `${(i * 12.5).toFixed(1)}%{transform:translateY(${r * 22}px)}`).join('')}}`);
  out += `<rect${A() ? ` class="${p}sel"` : ''} x="${x - 6}" y="${r0 - 15}" width="${w + 12}" height="21" fill="rgba(34,216,240,.13)"/>`;
  rows.forEach((r, i) => {
    const yy = r0 + i * 22, sc = r[2] === dash ? C.dim : ['Firing', 'Degraded'].includes(r[2]) ? C.red : C.green;
    out += T(cols[0], yy, r[0], { f: F.mono, size: 13, fill: C.cyan }) + T(cols[1], yy, r[1], { f: F.mono, size: 13, fill: C.white }) + T(cols[2], yy, r[2], { f: F.mono, size: 13, fill: sc }) + T(cols[3], yy, 'kromgo', { f: F.mono, size: 13, fill: C.dim });
  });
  return out;
}

function aiStrip(p, y, AI) {
  let out = T(48, y + 14, 'AI GATEWAY', { f: F.label, size: 13, w: 700, fill: C.white, ls: '.16em' }) + T(160, y + 14, AI.caption, { f: F.mono, size: 11, fill: C.dim });
  const ty = y + 30, tw = 187.33, th = 78;
  const tiles = [['TOKENS', num(AI.tokens7d, fmtBig)], ['REQUESTS', num(AI.requests7d, fmtBig)], ['SERVED LOCALLY', num(AI.localShare, v => Math.round(v) + '%')], ['CACHE HIT RATE', num(AI.cacheHit, v => Math.round(v) + '%')]];
  tiles.forEach(([k, v], i) => {
    const x = 48 + i * 199.33;
    out += (A() ? `<g class="fade" style="animation-delay:${(0.6 + i * 0.14).toFixed(2)}s">` : '') + `<rect x="${x}" y="${ty}" width="${tw}" height="${th}" rx="6" fill="${C.bg2}" stroke="${C.line}"/>`;
    out += T(x + 16, ty + 22, k, { f: F.label, size: 11, w: 700, fill: C.dim, ls: '.16em' }) + T(x + 16, ty + 56, v, { f: F.disp, size: 28, w: 700, fill: `url(#${p}word)` });
    if (k === 'SERVED LOCALLY' && isNum(AI.localShare)) {
      const bx = x + 96, bw = 76, by = ty + 46;
      out += `<rect x="${bx}" y="${by}" width="${bw}" height="6" rx="3" fill="rgba(217,70,230,.35)"/><g${A() ? ' class="grow"' : ''}><rect x="${bx}" y="${by}" width="${((bw * Math.min(AI.localShare, 100)) / 100).toFixed(1)}" height="6" rx="3" fill="${C.cyan}"/></g>`;
      out += T(bx, by - 6, 'GPU', { f: F.mono, size: 9, fill: C.cyan }) + T(bx + bw, by - 6, 'CLOUD', { f: F.mono, size: 9, fill: C.magenta, anchor: 'end' });
    }
    if (k === 'TOKENS' && A() && isNum(AI.tokens7d)) { // token "stream": dots flowing right
      css(`.${p}tok{opacity:0;animation:${p}tok 1.8s linear infinite}@keyframes ${p}tok{0%{opacity:0;transform:translateX(0)}50%{opacity:.9}100%{opacity:0;transform:translateX(${Math.round(tw - 142)}px)}}`);
      for (let d = 0; d < 5; d++) out += `<circle class="${p}tok" cx="${x + 128}" cy="${ty + 50}" r="2" fill="${C.cyan}" style="animation-delay:${(d * 0.36).toFixed(2)}s"/>`;
    }
    out += A() ? '</g>' : '';
  });
  return { out, h: 30 + th };
}

function fanIcon(p, cx, cy, r, c, rpm) {
  const blade = a => `<path d="M0 0 C ${r * 0.2} ${-r * 0.9}, ${r * 0.9} ${-r * 0.7}, ${r * 0.55} ${-r * 0.15} Z" transform="rotate(${a})" fill="${c}" opacity=".85"/>`;
  const dur = isNum(rpm) && rpm > 0 ? Math.max(0.4, Math.min(4, (60 / rpm) * 40)) : 0;
  return `<g transform="translate(${cx} ${cy})"><circle r="${r + 2}" fill="none" stroke="${C.line}"/><g${A() && dur ? ` class="spin" style="--d:${dur.toFixed(2)}s"` : ''}>${blade(0) + blade(120) + blade(240)}</g><circle r="2" fill="${C.bg}"/></g>`;
}

function gpuCard(p, y, G) {
  const x = 48, w = 784, h = 150;
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${C.bg2}" stroke="${C.line}"/><rect x="${x}" y="${y}" width="3" height="${h}" rx="1.5" fill="url(#${p}neon)"/>`;
  const nameO = { f: F.disp, size: 18, w: 700, ls: '.08em' };
  out += icon.chip(x + 20, y + 16, C.violet) + T(x + 50, y + 34, G.name, { ...nameO, fill: C.white }) + T(x + 64 + measure(G.name, nameO), y + 33, G.sub, { f: F.mono, size: 11, fill: C.dim });
  out += T(x + w - 20, y + 33, G.engine.toUpperCase(), { f: F.mono, size: 11, w: 700, fill: C.lav, anchor: 'end' });
  // loaded model (+ detail chips only when they describe the model that is actually loaded)
  const mo = { f: F.mono, size: 14, w: 700 };
  const busy = isNum(G.slotsBusy) && G.slotsBusy > 0, status = !G.model ? 'OFFLINE' : busy ? `SERVING · ${G.slotsBusy} ACTIVE` : 'IDLE · READY';
  const sc = !G.model ? C.amber : C.green, statusW = measure(status, { f: F.mono, size: 10, w: 700 }) + 34;
  const model = fit(G.model || dash, w - 96 - statusW - 40, mo);
  out += T(x + 20, y + 64, 'MODEL', { f: F.label, size: 11, w: 700, fill: C.dim, ls: '.16em' }) + T(x + 76, y + 64, model, { ...mo, fill: C.cyan });
  let cx = x + 76 + measure(model, mo) + 14;
  for (const t of G.chips || []) {
    const tw = measure(t, { f: F.mono, size: 10, w: 700 }) + 16;
    if (cx + tw > x + w - statusW - 16) break;
    out += `<rect x="${cx.toFixed(1)}" y="${y + 51}" width="${tw.toFixed(1)}" height="18" rx="9" fill="rgba(108,92,255,.14)" stroke="rgba(140,120,255,.35)"/>` + T(cx + 8, y + 64, t, { f: F.mono, size: 10, w: 700, fill: C.lav });
    cx += tw + 6;
  }
  out += `<circle cx="${x + w - 26}" cy="${y + 60}" r="3.5" fill="${sc}" filter="url(#${p}glow)"${A() ? ' class="pulse"' : ''}/>` + T(x + w - 36, y + 64, status, { f: F.mono, size: 10, w: 700, fill: sc, anchor: 'end' });
  // telemetry
  out += `<rect x="${x + 20}" y="${y + 84}" width="${w - 40}" height="1" fill="rgba(140,120,255,.14)"/>`;
  const cy = y + 104, cells = [x + 20, x + 290, x + 430, x + 550, x + 670], vw = 250;
  const pct = isNum(G.vramUsed) && isNum(G.vramTotal) && G.vramTotal > 0 ? G.vramUsed / G.vramTotal : null;
  out += T(cells[0], cy, 'VRAM', { f: F.label, size: 11, w: 700, fill: C.dim, ls: '.16em' }) + T(cells[0] + vw, cy, isNum(G.vramUsed) ? `${G.vramUsed.toFixed(1)} / ${num(G.vramTotal, v => v.toFixed(1))} GiB` : dash, { f: F.mono, size: 12, w: 700, fill: C.white, anchor: 'end' });
  out += `<rect x="${cells[0]}" y="${cy + 12}" width="${vw}" height="8" rx="4" fill="rgba(140,120,255,.16)"/>`;
  if (pct != null) out += `<g${A() ? ' class="grow"' : ''}><rect x="${cells[0]}" y="${cy + 12}" width="${(vw * Math.min(pct, 1)).toFixed(1)}" height="8" rx="4" fill="url(#${p}neonh)"/></g>`;
  out += T(cells[0], cy + 36, pct != null ? `${Math.round(pct * 100)}% · ${G.vramNote}` : G.vramNote, { f: F.mono, size: 10, fill: C.dim });
  const cell = (cx0, label, val, unit) => {
    let s = T(cx0, cy, label, { f: F.label, size: 11, w: 700, fill: C.dim, ls: '.16em' }) + T(cx0, cy + 28, val, { f: F.disp, size: 22, w: 700, fill: `url(#${p}word)` });
    if (val !== dash) s += T(cx0 + measure(val, { f: F.disp, size: 22, w: 700 }) + 5, cy + 28, unit, { f: F.mono, size: 11, fill: C.muted });
    return s;
  };
  out += cell(cells[1], 'DECODE', num(G.decode, v => String(Math.round(v))), 'tok/s');
  out += cell(cells[2], 'GPU TEMP', num(G.temp, v => String(Math.round(v))), '°C');
  out += cell(cells[3], 'POWER', num(G.power, v => String(Math.round(v))), 'W');
  out += cell(cells[4], 'FAN', num(G.fan, fmtInt), 'rpm') + fanIcon(p, cells[4] + 84, cy - 3, 9, C.cyan, G.fan);
  return { out, h };
}

export const homelab = (cfg, H, AI, G, o = {}) => p => {
  const hy = o.hy ?? 70, top = hy + 40;
  const state = H.never ? { kind: 'stale', text: 'AWAITING FIRST SYNC' } : H.stale ? { kind: 'stale', text: `OFFLINE · LAST SEEN ${H.updatedDate}` } : isNum(H.alerts) && H.alerts > 0 ? { kind: 'alert', text: `${H.alerts} ACTIVE ALERT${H.alerts > 1 ? 'S' : ''}` } : { kind: 'ok' };
  let out = hdr(p, hy, 'HOMELAB', '', { num: o.num }) + statusPill(p, 832, hy - 3, state);
  out += termWin(p, 48, top, 784, 350, cfg.homelab.terminalTitle, { active: true });
  if (A()) {
    css(`.${p}scan{animation:${p}scan 5.5s linear infinite}@keyframes ${p}scan{from{transform:translateY(-40px)}to{transform:translateY(350px)}}`);
    out += `<clipPath id="${p}twc"><rect x="49" y="${top + 31}" width="782" height="318" rx="5"/></clipPath><g clip-path="url(#${p}twc)"><rect class="${p}scan" x="49" y="${top}" width="782" height="70" fill="url(#${p}scan)"/></g>`;
  }
  out += k9sBody(p, 68, top + 58, 744, H);
  out += `<rect x="49" y="${top + 316}" width="782" height="1" fill="${C.line}"/>`;
  out += T(68, top + 337, H.never ? 'waiting for the first kromgo sync' : `${H.stale ? 'last seen' : 'last sync'} ${H.updated} · via kromgo`, { f: F.mono, size: 11, fill: H.stale ? C.amber : C.dim }) + T(812, top + 337, cfg.homelab.repoLink + ' →', { f: F.mono, size: 11, fill: C.cyan, anchor: 'end' });
  let y = top + 350 + 30;
  const ai = aiStrip(p, y, AI); out += ai.out; y += ai.h;
  const g = gpuCard(p, y + 16, G); out += g.out; y += 16 + g.h;
  return { h: y + 34, out, mark: hy - 9 };
};

/* ---------------- GitHub: heatmap + totals + languages ---------------- */
function heatStats(days) {
  let longest = 0, run = 0;
  for (const x of days) { run = x.v > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) { if (days[i].v > 0) current++; else if (i === days.length - 1) continue; else break; }
  const wd = [0, 0, 0, 0, 0, 0, 0]; days.forEach(x => (wd[x.d.getUTCDay()] += x.v));
  return { longest, current, busiest: WDN[wd.indexOf(Math.max(...wd))], active: days.filter(x => x.v > 0).length };
}
const RAMP = ['rgba(140,120,255,.10)', '#123F5A', '#1683A8', '#22D8F0', '#D946E6'];
function heatGrid(p, days, x, y, fitW) {
  const SW = days[0].d.getUTCDay(), cols = Math.ceil((days.length + SW) / 7), gap = 3;
  const cell = (fitW - 30 + gap) / cols - gap, step = cell + gap, gx = x + 30, gy = y + 18;
  const nz = days.filter(d => d.v > 0).map(d => d.v).sort((a, b) => a - b), q = f => nz[Math.floor((nz.length - 1) * f)] ?? 0;
  const Q = [q(0.35), q(0.65), q(0.9)], lvl = v => (v === 0 ? 0 : v <= Q[0] ? 1 : v <= Q[1] ? 2 : v <= Q[2] ? 3 : 4);
  let out = '';
  days.forEach((d, i) => {
    const k = i + SW, col = Math.floor(k / 7), row = k % 7, L = lvl(d.v);
    const anim = A() ? ` class="${L === 4 ? 'tw' : 'hc'}" style="animation-delay:${(0.2 + col * 0.03 + row * 0.015).toFixed(3)}s${L === 4 ? `,${(2.4 + ((i * 7919) % 23) / 10).toFixed(2)}s` : ''}"` : '';
    out += `<rect x="${(gx + col * step).toFixed(1)}" y="${(gy + row * step).toFixed(1)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" rx="2" fill="${RAMP[L]}"${L === 4 ? ` filter="url(#${p}glow)"` : ''}${anim}/>`;
  });
  let prev = -1, last = -9;
  for (let c = 0; c < cols; c++) {
    const d = new Date(days[0].d.getTime() + (c * 7 - SW) * 864e5), m = d.getUTCMonth();
    if (m !== prev && c - last >= 3 && c < cols - 2) { out += T(gx + c * step, y + 10, MON[m], { f: F.mono, size: 10, fill: C.dim }); last = c; }
    prev = m;
  }
  [['Mon', 1], ['Wed', 3], ['Fri', 5]].forEach(([n, r]) => (out += T(x, gy + r * step + cell - 2, n, { f: F.mono, size: 10, fill: C.dim })));
  return { out, h: 18 + 7 * step - gap };
}
function heatLegend(xr, y) {
  const x0 = xr - (5 * 14 + 70);
  let out = T(x0, y, 'Less', { f: F.mono, size: 10, fill: C.dim });
  RAMP.forEach((c, i) => (out += `<rect x="${x0 + 32 + i * 14}" y="${y - 9}" width="11" height="11" rx="2" fill="${c}"/>`));
  return out + T(x0 + 32 + 5 * 14 + 4, y, 'More', { f: F.mono, size: 10, fill: C.dim });
}
export const github = (cfg, Gh, o = {}) => p => {
  const hy = o.hy ?? 70, top = hy + 44;
  const days = Gh.days.map(([d, v]) => ({ d: new Date(d + 'T00:00:00Z'), v }));
  let out = hdr(p, hy, 'GITHUB ACTIVITY', `${fmtInt(Gh.contributions)} CONTRIBUTIONS · LAST 12 MONTHS`, { num: o.num });
  const hm = heatGrid(p, days, 48, top, 784);
  out += hm.out;
  if (A()) {
    css(`.${p}band{animation:${p}band 8s linear 3s infinite}@keyframes ${p}band{0%{transform:translateX(0)}55%,100%{transform:translateX(830px)}}`);
    out += `<clipPath id="${p}hmc"><rect x="78" y="${top + 18}" width="754" height="${hm.h - 18}"/></clipPath><g clip-path="url(#${p}hmc)"><rect class="${p}band" x="10" y="${top + 14}" width="70" height="${hm.h}" fill="url(#${p}band)"/></g>`;
  }
  const st = heatStats(days);
  let y = top + hm.h + 26;
  out += T(78, y, `LONGEST STREAK ${st.longest}D  ·  CURRENT ${st.current}D  ·  ${st.active} ACTIVE DAYS  ·  BUSIEST: ${st.busiest.toUpperCase()}`, { f: F.mono, size: 11, fill: C.muted }) + heatLegend(832, y);
  y += 24;
  const k = [['COMMITS', fmtInt(Gh.commits)], ['PULL REQUESTS', fmtInt(Gh.prs)], ['ISSUES', fmtInt(Gh.issues)], ['STARS EARNED', fmtInt(Gh.stars)]];
  k.forEach(([l, v], i) => {
    const x = 48 + i * 199.33;
    out += (A() ? `<g class="fade" style="animation-delay:${(0.5 + i * 0.14).toFixed(2)}s">` : '') + `<rect x="${x}" y="${y}" width="187.33" height="76" rx="6" fill="${C.bg2}" stroke="${C.line}"/>`;
    out += T(x + 18, y + 24, l, { f: F.label, size: 11, w: 700, fill: C.dim, ls: '.16em' }) + T(x + 171, y + 24, 'ALL TIME', { f: F.mono, size: 9, fill: 'rgba(124,131,165,.7)', anchor: 'end' });
    out += T(x + 18, y + 60, v, { f: F.disp, size: 30, w: 700, fill: `url(#${p}word)` }) + (A() ? '</g>' : '');
  });
  y += 100;
  out += A() ? `<g class="grow">${langBar(p, Gh.langs, 48, y, 784, 10)}</g>` : langBar(p, Gh.langs, 48, y, 784, 10);
  Gh.langs.slice(0, 8).forEach(([n, pct], i) => {
    const x = 48 + (i % 4) * 199.33, yy = y + 34 + Math.floor(i / 4) * 22;
    out += `<rect x="${x}" y="${yy - 9}" width="10" height="10" rx="2" fill="${LANG_TINT[i]}"/>` + T(x + 18, yy, fit(n, 110, { f: F.body, size: 14 }), { size: 14, fill: C.text }) + T(x + 182, yy, pct.toFixed(1) + '%', { f: F.mono, size: 12, fill: C.dim, anchor: 'end' });
  });
  y += 34 + Math.ceil(Math.min(Gh.langs.length, 8) / 4) * 22 + 14;
  return { h: y + 18, out, mark: hy - 9 };
};

/* ---------------- featured repos ---------------- */
export const repos = (cfg, Gh, o = {}) => p => {
  const hy = o.hy ?? 70, top = hy + 44, desc = { f: F.body, size: 14 };
  let out = hdr(p, hy, 'FEATURED REPOS', `ALL ${Gh.publicRepos} REPOSITORIES →`, { num: o.num });
  Gh.repos.slice(0, 2).forEach((r, i) => {
    const x = 48 + i * 400, y = top, w = 384, h = 132;
    out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${C.bg2}" stroke="${C.line}"/><rect x="${x}" y="${y}" width="3" height="${h}" rx="1.5" fill="url(#${p}neon)"/>`;
    out += icon.repo(x + 22, y + 20, C.violet) + T(x + 48, y + 36, fit(r.name, w - 70, { f: F.disp, size: 20, w: 600 }), { f: F.disp, size: 20, w: 600, fill: C.cyan });
    const lines = wrap(r.desc || 'No description yet.', w - 44, desc);
    lines.slice(0, 2).forEach((l, j) => (out += T(x + 22, y + 66 + j * 20, j === 1 && lines.length > 2 ? fit(l + ' ' + lines.slice(2).join(' '), w - 44, desc) : l, { ...desc, fill: C.text })));
    const sx = r.lang ? x + 22 + 18 + measure(r.lang, { f: F.mono, size: 12 }) + 22 : x + 22;
    if (r.lang) out += `<circle cx="${x + 28}" cy="${y + 109}" r="5" fill="${r.langColor || C.dim}"/>` + T(x + 40, y + 114, r.lang, { f: F.mono, size: 12, fill: C.muted });
    out += icon.star(sx, y + 102, C.violet) + T(sx + 20, y + 114, String(r.stars), { f: F.mono, size: 12, fill: C.muted }) + T(x + w - 20, y + 114, 'UPDATED ' + r.pushed, { f: F.mono, size: 11, fill: C.dim, anchor: 'end' });
  });
  return { h: top + 132 + 34, out, mark: hy - 9 };
};

/* ---------------- career: single-role employers left, multi-role employer grouped right ---------------- */
export function tenure(from, to, now) {
  const m = s => { if (/present/i.test(s)) return now.getUTCFullYear() * 12 + now.getUTCMonth(); const [mo, y] = s.split(' '); return +y * 12 + MON.indexOf(mo); };
  const n = m(to) - m(from) + 1, y = Math.floor(n / 12), r = n % 12;
  return [y && `${y} yr${y > 1 ? 's' : ''}`, r && `${r} mo${r > 1 ? 's' : ''}`].filter(Boolean).join(' ');
}
export const career = (cfg, o = {}) => p => {
  const hy = o.hy ?? 70, top = hy + 56, step = 80, now = o.now || new Date();
  let out = hdr(p, hy, 'EXPERIENCE', 'FULL PROFILE ON LINKEDIN →', { num: o.num });
  const groups = [];
  for (const e of cfg.experience) { const g = groups.find(g => g.company === e.company); g ? g.roles.push(e) : groups.push({ company: e.company, roles: [e] }); }
  const single = groups.filter(g => g.roles.length === 1), multi = groups.filter(g => g.roles.length > 1);
  const titleO = { f: F.label, size: 17, w: 600, ls: '.06em' }, coO = { f: F.body, size: 14 };
  const col = (x, list) => list.forEach((g, i) => {
    const e = g.roles[0], y = top + i * step, isNow = /present/i.test(e.date);
    if (i) out += `<rect x="${x}" y="${y - 20}" width="384" height="1" fill="rgba(140,120,255,.14)"/>`;
    out += (isNow ? pulseRing(x + 5, y - 4, C.cyan, 4, 0.6) : '') + `<circle cx="${x + 5}" cy="${y - 4}" r="4" fill="${isNow ? C.cyan : C.bg}" stroke="${C.cyan}" stroke-width="1.6" filter="url(#${p}glow)"/>`;
    out += T(x + 20, y, e.date, { f: F.mono, size: 12, fill: C.cyan }) + (isNow ? T(x + 32 + measure(e.date, { f: F.mono, size: 12 }), y, '● NOW', { f: F.mono, size: 10, w: 700, fill: C.green }) : '');
    out += T(x, y + 26, fit(e.title.toUpperCase(), 270, titleO), { ...titleO, fill: C.white }) + T(x, y + 47, fit(`${e.company} • ${e.location}`, 384, coO), { ...coO, fill: C.lav });
    const k = logoKey(cfg, e.company); if (k) out += logoBadge(k, x + 280, y - 12, 104, 36, { now: isNow });
  });
  // Multi-role employers: one block with total tenure, then the roles as a sub-timeline.
  const block = (x, g, y) => {
    const first = g.roles[g.roles.length - 1].date.split(' — ')[0], last = g.roles[0].date.split(' — ')[1];
    const places = [...new Set(g.roles.slice().reverse().map(r => r.location.split(',')[0]))];
    out += `<circle cx="${x + 5}" cy="${y - 4}" r="4" fill="${C.bg}" stroke="${C.cyan}" stroke-width="1.6" filter="url(#${p}glow)"/>`;
    const range = `${first} — ${last}`;
    out += T(x + 20, y, range, { f: F.mono, size: 12, fill: C.cyan }) + T(x + 32 + measure(range, { f: F.mono, size: 12 }), y, tenure(first, last, now).toUpperCase(), { f: F.mono, size: 10, w: 700, fill: C.violet });
    out += T(x, y + 26, g.company.toUpperCase(), { ...titleO, fill: C.white }) + T(x, y + 47, fit(`${g.roles.length} roles • ${places.join(' → ')}`, 270, coO), { ...coO, fill: C.lav });
    const k = logoKey(cfg, g.company); if (k) out += logoBadge(k, x + 280, y - 12, 104, 36, {});
    const r0 = y + 84, rs = 52;
    out += `<rect x="${x + 4.5}" y="${r0 - 5}" width="1" height="${(g.roles.length - 1) * rs}" fill="rgba(140,110,255,.35)"/>`;
    g.roles.forEach((r, i) => {
      const ry = r0 + i * rs;
      out += `<circle cx="${x + 5}" cy="${ry - 5}" r="3" fill="${C.bg}" stroke="${C.violet}" stroke-width="1.4"/>` + T(x + 20, ry, fit(r.title.toUpperCase(), 360, { f: F.label, size: 15, w: 600, ls: '.06em' }), { f: F.label, size: 15, w: 600, fill: C.white, ls: '.06em' });
      out += T(x + 20, ry + 19, fit(`${r.date}  ·  ${r.location}`, 360, { f: F.mono, size: 11 }), { f: F.mono, size: 11, fill: C.dim });
    });
    return r0 + (g.roles.length - 1) * rs + 19;
  };
  col(48, single);
  let bottom = top + Math.max(0, single.length - 1) * step + 47, by = top;
  for (const g of multi) { const end = block(448, g, by); bottom = Math.max(bottom, end); by = end + 60; }
  return { h: bottom + 52, out, mark: hy - 9 };
};

/* ---------------- connect ---------------- */
export const connect = (cfg, o = {}) => p => {
  const hy = o.hy ?? 70, h = o.h ?? 136, tl = cfg.connect.tagline, tO = { f: F.label, size: 13, w: 600, ls: '.24em' };
  let out = `<rect width="880" height="${h}" fill="url(#${p}panel)"/>` + hdr(p, hy, 'CONNECT', '', { num: o.num });
  out += T(48, hy + 32, tl, { ...tO, fill: C.muted });
  if (A()) out += `<rect class="blink" x="${(48 + measure(tl, tO) + 13 * 0.24 + 4).toFixed(1)}" y="${hy + 20}" width="9" height="15" fill="${C.cyan}"/>`;
  return { h, out, mark: hy - 9 };
};
