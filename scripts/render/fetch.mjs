#!/usr/bin/env node
// Fetches profile data into data/github.json and data/homelab.json.
//   GITHUB_TOKEN  required — GraphQL + search API (the Actions token is enough for public data)
//   KROMGO_URL    optional — base URL of the public kromgo instance, e.g. https://kromgo.example.com
// A failed source never wipes data: every value falls back to the last committed snapshot.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const UA = 'skrumbach-profile-renderer (+https://github.com/skrumbach/skrumbach)';
const readJson = (f, d = null) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : d);

/* ---------------- GitHub ---------------- */
const Q = `query($login: String!, $after: String) {
  user(login: $login) {
    contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } } }
    publicRepos: repositories(privacy: PUBLIC, ownerAffiliations: OWNER) { totalCount }
    repositories(first: 100, after: $after, privacy: PUBLIC, ownerAffiliations: OWNER) {
      pageInfo { hasNextPage endCursor }
      nodes { name description isFork stargazerCount pushedAt primaryLanguage { name color } languages(first: 20, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name } } } }
    }
  }
}`;

async function gh(token, path, body) {
  const res = await fetch(`https://api.github.com${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { authorization: `bearer ${token}`, 'user-agent': UA, accept: 'application/vnd.github+json', ...(body && { 'content-type': 'application/json' }) },
    body: body && JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.errors) throw new Error(`GitHub ${path}: ${res.status} ${JSON.stringify(json.errors || json.message || '')}`);
  return json;
}

// Top languages by bytes across repos, as percentages of the top `n` (same as github-readme-stats).
export function topLangs(repos, n = 8) {
  const sizes = new Map();
  for (const r of repos) for (const e of r.languages?.edges || []) sizes.set(e.node.name, (sizes.get(e.node.name) || 0) + e.size);
  const top = [...sizes].sort((a, b) => b[1] - a[1]).slice(0, n), total = top.reduce((s, [, v]) => s + v, 0) || 1;
  return top.map(([name, v]) => [name, +((v / total) * 100).toFixed(2)]);
}

export async function fetchGitHub(login, token, featured, prev) {
  const nodes = []; let after = null, user;
  do {
    user = (await gh(token, '/graphql', { query: Q, variables: { login, after } })).data.user;
    nodes.push(...user.repositories.nodes);
    after = user.repositories.pageInfo.hasNextPage ? user.repositories.pageInfo.endCursor : null;
  } while (after);
  // All-time totals via search with is:public, so the numbers never include private work,
  // whatever the token can see (a personal token would otherwise leak private counts).
  const count = async (key, path) => {
    try { return (await gh(token, `${path}&per_page=1`)).total_count; }
    catch (e) { console.warn(`! ${key} unavailable, keeping ${prev?.[key] ?? 0}: ${e.message}`); return prev?.[key] ?? 0; }
  };
  const who = encodeURIComponent(login);
  const commits = await count('commits', `/search/commits?q=author:${who}+is:public`);
  const prs = await count('prs', `/search/issues?q=author:${who}+type:pr+is:public`);
  const issues = await count('issues', `/search/issues?q=author:${who}+type:issue+is:public`);
  const cal = user.contributionsCollection.contributionCalendar;
  const byName = new Map(nodes.map(n => [n.name, n]));
  return {
    login, fetchedAt: new Date().toISOString(),
    contributions: cal.totalContributions,
    days: cal.weeks.flatMap(w => w.contributionDays.map(d => [d.date, d.contributionCount])),
    commits, prs, issues,
    stars: nodes.reduce((s, n) => s + n.stargazerCount, 0),
    publicRepos: user.publicRepos.totalCount,
    langs: topLangs(nodes.filter(n => !n.isFork)), // stars count forks (like the old card), languages do not
    repos: featured.map(f => byName.get(f.name)).filter(Boolean).map(n => ({
      name: n.name, description: n.description, lang: n.primaryLanguage?.name ?? null, langColor: n.primaryLanguage?.color ?? null, stars: n.stargazerCount, pushed: n.pushedAt.slice(0, 10),
    })),
  };
}

/* ---------------- homelab (kromgo) ---------------- */
// kromgo's default response is a shields.io endpoint: { schemaVersion, label, message, color }.
export function parseKromgo(json, isText) {
  const msg = json && typeof json.message === 'string' ? json.message.trim() : null;
  if (!msg || /^(no data|error|n\/a|nan)$/i.test(msg)) return undefined;
  if (isText) return msg.replace(/^v(?=\d)/, '');
  const v = parseFloat(msg.replace(/,/g, ''));
  return Number.isFinite(v) ? v : undefined;
}

export async function fetchKromgo(base, metrics, textKeys, { timeout = 10_000 } = {}) {
  const out = {}, missing = [];
  await Promise.all(Object.entries(metrics).map(async ([key, id]) => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(`${base.replace(/\/$/, '')}/${id}`, { headers: { 'user-agent': UA, accept: 'application/json' }, signal: AbortSignal.timeout(timeout) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const v = parseKromgo(await res.json(), textKeys.includes(key));
        if (v === undefined) throw new Error('no value');
        out[key] = v; return;
      } catch (e) { if (attempt) missing.push(`${key} (${id}): ${e.message}`); }
    }
  }));
  return { values: out, missing };
}

// Fresh values win; anything missing keeps its last known value. `updated` only moves when something arrived.
export function mergeHomelab(prev, fetched, now = new Date()) {
  const got = Object.keys(fetched.values).length;
  return {
    updated: got ? now.toISOString() : prev?.updated ?? null,
    values: { ...(prev?.values || {}), ...fetched.values },
    missing: fetched.missing.map(m => m.split(' ')[0]),
  };
}

/* ---------------- main ---------------- */
async function main() {
  const cfg = (await import(pathToFileURL(join(ROOT, 'profile.config.mjs')).href)).default;
  const dir = join(ROOT, 'data');
  mkdirSync(dir, { recursive: true });
  let failed = false;

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const prevGh = readJson(join(dir, 'github.json'));
  if (!token) { console.warn('! GITHUB_TOKEN not set — keeping data/github.json'); failed = !prevGh; }
  else {
    try {
      const g = await fetchGitHub(cfg.login, token, cfg.featured, prevGh);
      writeFileSync(join(dir, 'github.json'), JSON.stringify(g, null, 1) + '\n');
      console.log(`github: ${g.contributions} contributions, ${g.publicRepos} public repos, ${g.langs.length} languages`);
    } catch (e) { console.error(`! GitHub fetch failed, keeping previous data: ${e.message}`); failed = !prevGh; }
  }

  const prevH = readJson(join(dir, 'homelab.json'), { updated: null, values: {} });
  if (!process.env.KROMGO_URL) { console.warn('! KROMGO_URL not set — homelab data unchanged'); if (!existsSync(join(dir, 'homelab.json'))) writeFileSync(join(dir, 'homelab.json'), JSON.stringify(prevH, null, 1) + '\n'); }
  else {
    const f = await fetchKromgo(process.env.KROMGO_URL, cfg.homelab.metrics, cfg.homelab.textMetrics);
    const merged = mergeHomelab(prevH, f);
    writeFileSync(join(dir, 'homelab.json'), JSON.stringify(merged, null, 1) + '\n');
    console.log(`homelab: ${Object.keys(f.values).length}/${Object.keys(cfg.homelab.metrics).length} metrics`);
    for (const m of f.missing) console.warn(`  ! ${m}`);
  }
  // Only fail the job when there is nothing at all to render.
  if (failed) process.exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(e => { console.error(e); process.exit(1); });
