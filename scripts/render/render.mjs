#!/usr/bin/env node
// Renders profile/profile.svg from profile.config.mjs + data/{github,homelab}.json.
//   node scripts/render/render.mjs            → profile/profile.svg from data/
//   node scripts/render/render.mjs --sample   → build/profile.sample.svg from fixtures/
//   flags: --static (no animation), --out <file>, --data <dir>
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { beginDoc, canvas } from './lib/svg.mjs';
import * as S from './sections.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const pad = n => String(n).padStart(2, '0');
const stamp = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;

// Shapes fetched data + config into what the sections draw.
export function buildModel(cfg, data, now = new Date()) {
  const v = data.homelab?.values || {};
  const updatedAt = data.homelab?.updated ? new Date(data.homelab.updated) : null;
  const stale = !updatedAt || now - updatedAt > (cfg.homelab.staleAfterHours ?? 24) * 3600e3;
  const H = {
    context: cfg.homelab.context, stale,
    never: !updatedAt, updated: updatedAt ? stamp(updatedAt) : 'never', updatedDate: updatedAt ? stamp(updatedAt).slice(0, 10) : 'NEVER',
    talos: v.talos, kubernetes: v.kubernetes, flux: v.flux, nodes: v.nodes, nodesReady: v.nodesReady, pods: v.pods,
    cpu: v.cpu, mem: v.mem, gpuPower: v.gpuPower, gpuTemp: v.gpuTemp, age: v.age, uptime: v.uptime, alerts: v.alerts,
  };
  const AI = { caption: cfg.ai.caption, tokens7d: v.tokens7d, requests7d: v.requests7d, localShare: v.localShare, cacheHit: v.cacheHit };
  const m = cfg.gpu.models?.[v.model] || {};
  const G = {
    name: cfg.gpu.name, sub: cfg.gpu.sub, engine: cfg.gpu.engine, model: v.model, chips: m.chips || [], vramNote: m.vramNote || cfg.gpu.vramNote,
    vramUsed: v.vramUsed, vramTotal: v.vramTotal, temp: v.gpuTemp, power: v.gpuPower, fan: v.fan, decode: v.decode, slotsBusy: v.slotsBusy,
  };
  const gh = data.github;
  const byName = new Map((gh.repos || []).map(r => [r.name, r]));
  const repos = cfg.featured.map(f => { const r = byName.get(f.name) || { name: f.name, stars: 0, pushed: '' }; return { ...r, desc: f.description || r.description }; });
  return { H, AI, G, Gh: { ...gh, repos } };
}

export function renderProfile(cfg, data, { anim = true, now = new Date() } = {}) {
  beginDoc({ anim });
  const { H, AI, G, Gh } = buildModel(cfg, data, now);
  const sec = (n, name) => ({ hy: 70, num: `0${n} / ${name}` });
  return canvas([
    S.hero(cfg, H),
    S.about(cfg, sec(1, 'WHO')),
    S.homelab(cfg, H, AI, G, sec(2, H.stale ? 'HOMELAB' : 'HOMELAB · LIVE')),
    S.github(cfg, Gh, sec(3, 'GITHUB')),
    S.repos(cfg, Gh, sec(4, 'BUILDING')),
    S.career(cfg, { ...sec(5, 'CAREER'), now }),
    S.connect(cfg, { ...sec(6, 'SAY HI'), h: 136 }),
  ], {
    divider: true, rail: true, border: 'neon',
    title: `${cfg.hero.first} ${cfg.hero.last} — ${cfg.hero.eyebrow}`,
    desc: `${cfg.hero.tagline} Homelab, GitHub activity, featured repositories and career. Updated ${stamp(now)}.`,
    glows: [[780, 0, 420, '#8B55F5', 0.3], [0, 340, 380, '#22D8F0', 0.12], [880, 1100, 460, '#6C5CFF', 0.14], [0, h => h - 700, 420, '#22D8F0', 0.1], [880, h => h - 150, 480, '#D946E6', 0.12]],
  });
}

const readJson = f => JSON.parse(readFileSync(f, 'utf8'));

async function main(argv) {
  const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
  const sample = argv.includes('--sample');
  const dataDir = arg('--data', join(ROOT, sample ? 'scripts/render/fixtures' : 'data'));
  const out = arg('--out', join(ROOT, sample ? 'build/profile.sample.svg' : 'profile/profile.svg'));
  const cfg = (await import(pathToFileURL(join(ROOT, 'profile.config.mjs')).href)).default;
  for (const f of ['github.json', 'homelab.json']) if (!existsSync(join(dataDir, f))) throw new Error(`missing ${join(dataDir, f)} — run "npm run fetch" first, or use --sample`);
  const data = { github: readJson(join(dataDir, 'github.json')), homelab: readJson(join(dataDir, 'homelab.json')) };
  // Fixtures are frozen in time; render them "as of" their fetch date so they never look stale.
  const now = sample && data.homelab.updated ? new Date(data.homelab.updated) : new Date();
  const svg = renderProfile(cfg, data, { anim: !argv.includes('--static'), now });
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, svg);
  console.log(`wrote ${out} (${(svg.length / 1024).toFixed(0)} KB)`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2)).catch(e => { console.error(e.message); process.exit(1); });
