# Profile renderer

Builds `profile/profile.svg`: the single animated image the profile README shows.
Design: seamless canvas, live homelab (k9s view, AI gateway, GPU), GitHub heatmap,
featured repos, grouped career, connect.

```bash
npm ci
npm run sample   # render fixtures → build/profile.sample.svg (no network)
npm run build    # fetch real data → data/*.json, then render → profile/profile.svg
npm test
open preview.html                                  # profile/profile.svg as GitHub shows it
open "preview.html?src=build/profile.sample.svg"   # the fixture render
```

- **Content** (hero, about, jobs, featured repos, logos, kromgo metric ids, GPU details)
  lives in `profile.config.mjs`. Edit that, never the renderer.
- **Text is converted to glyph outlines** (`lib/fonts.mjs`). GitHub serves README images
  with `default-src 'none'`, which blocks web fonts inside SVGs. Fonts come from the pinned
  `@fontsource/*` packages; `→ ● ✓ ★` are drawn as vectors because the Latin subsets lack them.
  A glyph that is missing from the fonts fails the render on purpose.
- **Animation** is CSS where possible (so `prefers-reduced-motion` stops it). SMIL is used
  only for the two one-shot reveals: tagline typing and CPU/MEM bar fill.
  `--static` renders without animation.
- **Data never disappears**: `fetch.mjs` falls back to the last committed snapshot per value.
  Homelab data older than `homelab.staleAfterHours` renders as "last seen".

## Secrets (repo settings → Actions)

| Secret | Needed for |
|---|---|
| `GITHUB_TOKEN` | provided automatically; public GitHub stats |
| `KROMGO_URL` | base URL of the public kromgo instance (homelab, AI and GPU stats) |

The kromgo metric ids the renderer expects are listed in `profile.config.mjs` under
`homelab.metrics`; the queries live in `skrumbach/home-ops`
(`kubernetes/apps/base/monitoring/kromgo/app/resources/config.yaml`).
