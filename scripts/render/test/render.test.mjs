import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DOMParser } from '@xmldom/xmldom';
import cfg from '../../../profile.config.mjs';
import { renderProfile, buildModel } from '../render.mjs';
import { parseKromgo, mergeHomelab, topLangs } from '../fetch.mjs';
import { tenure } from '../sections.mjs';
import { TextRenderer, SYMBOLS } from '../lib/fonts.mjs';

const fx = n => JSON.parse(readFileSync(new URL(`../fixtures/${n}.json`, import.meta.url), 'utf8'));
const data = () => ({ github: fx('github'), homelab: fx('homelab') });
const NOW = new Date('2026-11-04T06:00:00Z');
const render = (d = data(), o = {}) => renderProfile(cfg, d, { now: NOW, ...o });

function parse(svg) {
  const errors = [];
  const doc = new DOMParser({ onError: (lvl, msg) => lvl !== 'warning' && errors.push(msg) }).parseFromString(svg, 'image/svg+xml');
  assert.deepEqual(errors, [], 'SVG must be well-formed XML');
  return doc;
}

test('renders well-formed SVG with fixture data', () => {
  const svg = render(), doc = parse(svg);
  assert.equal(doc.documentElement.tagName, 'svg');
  assert.equal(doc.documentElement.getAttribute('width'), '880');
});

test('contains no live text, scripts or external references (GitHub CSP blocks fonts; README images must be self-contained)', () => {
  const svg = render();
  assert.doesNotMatch(svg, /<text[\s>]/, 'all text must be converted to paths');
  assert.doesNotMatch(svg, /<script|\son[a-z]+=/i);
  assert.doesNotMatch(svg, /@font-face|@import/);
  for (const m of svg.matchAll(/href="([^"]+)"/g)) assert.ok(m[1].startsWith('#'), `external href ${m[1]}`);
});

test('every internal reference resolves to a defined id', () => {
  const svg = render();
  const ids = new Set([...svg.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  const refs = [...svg.matchAll(/url\(#([^)]+)\)|href="#([^"]+)"/g)].map(m => m[1] || m[2]);
  const missing = [...new Set(refs.filter(r => !ids.has(r)))];
  assert.deepEqual(missing, []);
  assert.equal(ids.size, [...svg.matchAll(/\sid="([^"]+)"/g)].length, 'ids must be unique');
});

test('stays within the size budget', () => {
  const kb = render().length / 1024;
  assert.ok(kb < 450, `profile.svg is ${kb.toFixed(0)} KB`);
});

test('output is deterministic for the same input', () => {
  assert.equal(render(), render());
});

test('static mode has no animation', () => {
  const svg = render(data(), { anim: false });
  assert.doesNotMatch(svg, /<animate|@keyframes|class="[^"]*\b(fade|grow|pulse|blink|hc|tw|ring|spin)\b/);
});

test('animated mode respects prefers-reduced-motion', () => {
  assert.match(render(), /@media \(prefers-reduced-motion:reduce\)/);
});

test('homelab states: live, alerts, stale, never synced', () => {
  const live = data();
  assert.equal(buildModel(cfg, live, NOW).H.stale, false);

  const alerts = data(); alerts.homelab.values.alerts = 2;
  assert.ok(render(alerts).length > 0);

  const stale = data();
  const m = buildModel(cfg, stale, new Date('2026-11-10T00:00:00Z'));
  assert.equal(m.H.stale, true);
  assert.equal(m.H.updatedDate, '2026-11-04');

  const never = { github: fx('github'), homelab: { updated: null, values: {} } };
  const n = buildModel(cfg, never, NOW);
  assert.equal(n.H.never, true);
  parse(render(never)); // empty homelab must still render
});

test('GPU detail chips only appear for the configured model', () => {
  const d = data();
  assert.deepEqual(buildModel(cfg, d, NOW).G.chips, ['Q3_K_M', '262K CTX', 'MoE · 3B ACTIVE']);
  d.homelab.values.model = 'SomeOther-7B';
  assert.deepEqual(buildModel(cfg, d, NOW).G.chips, []);
});

test('featured repos keep config order and description overrides', () => {
  const r = buildModel(cfg, data(), NOW).Gh.repos;
  assert.deepEqual(r.map(x => x.name), cfg.featured.map(f => f.name));
  assert.equal(r[0].desc, cfg.featured[0].description);
});

test('parseKromgo handles numbers, suffixes, versions and empty results', () => {
  assert.equal(parseKromgo({ message: '17.5%' }, false), 17.5);
  assert.equal(parseKromgo({ message: '212w' }, false), 212);
  assert.equal(parseKromgo({ message: '48213345' }, false), 48213345);
  assert.equal(parseKromgo({ message: '4.8e+07' }, false), 4.8e7);
  assert.equal(parseKromgo({ message: 'v1.34.1' }, true), '1.34.1');
  assert.equal(parseKromgo({ message: 'Qwen3.8-35B-A3B-Distill' }, true), 'Qwen3.8-35B-A3B-Distill');
  assert.equal(parseKromgo({ message: 'no data' }, false), undefined);
  assert.equal(parseKromgo({ message: 'abc' }, false), undefined);
  assert.equal(parseKromgo({}, false), undefined);
});

test('parseKromgo reads the /badges/<id>?format=json shape', () => {
  assert.equal(parseKromgo({ id: 'ai_tokens_7d', value: '24.32M', result: 24318375 }, false), 24318375);
  assert.equal(parseKromgo({ id: 'gpu_temp_celsius', value: '52°C', result: 52 }, false), 52);
  assert.equal(parseKromgo({ id: 'talos_version', value: '1.14.5', result: 1, labels: { version_id: '1.14.5' } }, true), '1.14.5');
  assert.equal(parseKromgo({ id: 'llm_model', value: 'Qwen3.8-35B-A3B-Distill', result: 0 }, true), 'Qwen3.8-35B-A3B-Distill');
  assert.equal(parseKromgo({ id: 'cluster_alert_count', value: '0', result: 0 }, false), 0);
  assert.equal(parseKromgo({ schemaVersion: 1, label: 'x', message: 'Not Found', isError: true }, false), undefined);
});

test('mergeHomelab keeps last known values and only advances `updated` when data arrived', () => {
  const prev = { updated: '2026-11-01T00:00:00Z', values: { cpu: 10, pods: 100 } };
  const now = new Date('2026-11-04T00:00:00Z');
  const a = mergeHomelab(prev, { values: { cpu: 20 }, missing: ['pods (cluster_pod_count): HTTP 500'] }, now);
  assert.deepEqual(a.values, { cpu: 20, pods: 100 });
  assert.equal(a.updated, now.toISOString());
  assert.deepEqual(a.missing, ['pods']);
  const b = mergeHomelab(prev, { values: {}, missing: [] }, now);
  assert.equal(b.updated, prev.updated);
});

test('topLangs sums sizes across repos and returns top-N percentages', () => {
  const repos = [
    { languages: { edges: [{ size: 300, node: { name: 'Python' } }, { size: 100, node: { name: 'Go' } }] } },
    { languages: { edges: [{ size: 100, node: { name: 'Python' } }] } },
  ];
  assert.deepEqual(topLangs(repos), [['Python', 80], ['Go', 20]]);
  assert.deepEqual(topLangs([]), []);
});

test('tenure counts inclusive months like LinkedIn', () => {
  assert.equal(tenure('Aug 2002', 'Feb 2021', NOW), '18 yrs 7 mos');
  assert.equal(tenure('May 2024', 'Present', new Date('2026-11-04T00:00:00Z')), '2 yrs 7 mos');
  assert.equal(tenure('Jan 2020', 'Dec 2020', NOW), '1 yr');
});

test('fonts: symbols fall back to vectors, unknown glyphs fail loudly', () => {
  const r = new TextRenderer();
  for (const ch of Object.keys(SYMBOLS)) assert.ok(r.measure(ch, { f: 'body', size: 14 }) > 0, ch);
  assert.ok(r.measure('Rheinböllen — Arden', { f: 'body', size: 14 }) > 100);
  assert.throws(() => r.measure('漢', { f: 'body' }), /missing/);
});
