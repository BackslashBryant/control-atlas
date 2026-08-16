# Orbital Alignment — Complete Execution Spec

**Status:** Active. At most one temporary `docs/Plan.md` may exist while work is active. Delete it in the shipping change.

Control Atlas (`github.com/BackslashBryant/control-atlas`) — a public research tool
for federal cybersecurity requirements, deployed via GitHub Pages from `main`.

---

## Objectives

### O1 — Unblock CI and merge the task-header branch
Get `feat/orbital-task-headers` (commit `d06b656e`) to CI-green and merged to
`main`. This branch contains the task-header rebuild and Compare dead-end fix but
is blocked by 163 color-contrast violations.

### O2 — Replace the Atlas graph paradigm
Swap the rigid ELK tree layout (React Flow + `elkjs`) for Cytoscape.js with
force-directed layout, node sizing by importance, edge weight encoding,
clustering, progressive disclosure, and semantic edge labels. The current tree
violates network-graph best practices and the owner rejected it.

### O3 — Eliminate decorative teal saturation
Teal (`--ca-primary` = `#5ca3a6`) is used ~322× across `orbital.css` and
`surfaces.css` for decorative purposes (card borders, datum lines, tabs, table
headers, badges). Per Orbital rules, teal is state-only — active, focus, link,
selected. Replace decorative uses with the correct neutral/action tokens.

### O4 — Rebuild every page from its Orbital example
Each page must be derived from the actual Orbital Archive reference HTML, not
from memory or prose docs. Fetch the reference, match its composition, verify
with a live screenshot.

### O5 — Apply the Orbital texture and grammar system
Blueprint grid, CRT/scanline, paper grain, film grain at documented opacities.
Silkscreen font for CRT/telemetry micro-labels. Calibration rails, measurement
ticks, datum marks per page. Nothing is optional.

### O6 — Polish, migrate, and ship
Tracking token migration, incremental `surfaces.css` retirement, dead
interaction sweep, style system friction cleanup, visual baseline regeneration.

---

## Tasks

### Phase 0 — Unblock CI (prerequisite)

- [ ] **T0.1** Audit `styles/orbital.css`, `styles/surfaces.css`,
  `styles/components.css` for small-text rules using `--ca-primary` /
  `--ca-accent` / `--ca-secondary` at `--ca-text-xs` (13px) or
  `--ca-text-micro`.
- [ ] **T0.2** Repoint those rules to `--lsm-teal-text: #74ccbe` (AA-compliant
  on `#2d3a42`). Do NOT change `--ca-link`/`--ca-accent` values — pinned by
  `tests/graph/areaVisualLanguage.test.ts:112`.
- [ ] **T0.3** Push fix on `feat/orbital-task-headers`, poll CI until green.
- [ ] **T0.4** Verify Compare dead-end fix works with real graph data (locally
  requires `npm run build:data`; otherwise verify against CI/live).
- [ ] **T0.5** Fast-forward merge to `main`, delete branch.

---

### Phase 1 — Graph Paradigm Change

- [ ] **T1.1** Install `cytoscape`, `cytoscape-cose-bilkent`,
  `react-cytoscapejs`. Follow lockfile insertion procedure (gotcha #3).
- [ ] **T1.2** Delete `src/ui/lib/atlasTreeLayout.ts` (ELK wrapper). Remove
  `elkjs` dependency.
- [ ] **T1.3** Create `src/ui/lib/atlasGraphLayout.ts` — Cytoscape layout
  config + visual mapping:
  - Node size scales with `descendantRecordCount` or connection degree
  - Edge thickness: structural (thick), organizing (medium), cross-framework
    mapping (thin dashed)
  - Color by area (existing palette via `areaVisualLanguage.ts`, preserved)
  - Clustering via compound/parent nodes — areas become containers
- [ ] **T1.4** Rewrite `src/ui/components/AtlasTree.tsx` rendering from React
  Flow to Cytoscape. Keep `AtlasTreeNodeView` data logic.
- [ ] **T1.5** Implement interaction model:
  - Click node → expand children (progressive disclosure) + highlight neighbors
  - Hover → tooltip (name, type, record count, mandate classification)
  - Search → highlight + zoom to match
  - Filter → hide/show by node type, area, publication
  - Semantic edge labels on hover/zoom-in (`contains`, `organizes`, `maps_to`)
  - Zoom-level semantic detail transitions
- [ ] **T1.6** Update `src/ui/pages/AtlasMapPage.tsx` integration.
- [ ] **T1.7** Update `tests/e2e/epic14-ws4-atlas-canvas.spec.mjs` for
  Cytoscape DOM structure.
- [ ] **T1.8** Remove React Flow styles from `styles/surfaces.css`
  (`.atlas-tree-node--*`, `.react-flow__node`). Add Cytoscape styles in
  `styles/orbital.css`.

**Keep:** `atlasTreeModel.ts`, `atlasTreeAggregation.ts`, `atlasTreeOverlay.ts`,
`areaVisualLanguage.ts`.

---

### Phase 2 — Systematic Teal Sweep

Surfaces, not a single blast. For each page during Phase 3:

| Current decorative usage | Correct token |
|---|---|
| Card top-datum hairline | `--ca-border` or `--lsm-gridline` |
| Registration tick marks | `--lsm-gridline` |
| Tab active indicator | `--ca-action-primary` (orange) |
| Table header accent | `--ca-border-strong` |
| Badge borders | `--ca-border` |
| Filter control borders | `--ca-border` |
| Non-state icon fill | `currentColor` or `--ca-text-muted` |

**Keep teal for:** focus rings, hover wash, link color, selected state, active
nav indicator.

- [ ] **T2.1** `styles/orbital.css` — card datum, registration ticks,
  focus/hover fills (~35 `--ca-primary` + ~20 `--ca-priority` uses).
- [ ] **T2.2** `styles/surfaces.css` — ~287 occurrences, page by page.
- [ ] **T2.3** `styles/components.css` — badge/tag borders, button secondary
  states.

---

### Phase 3 — Page-by-Page Orbital Redesign

For each page: fetch reference HTML from
`raw.githubusercontent.com/BackslashBryant/orbital-archive-no-01/main/examples/`,
match its composition, sweep teal, migrate CSS, verify with live screenshot.

- [ ] **T3.1 Atlas Map** (`AtlasMapPage.tsx`) — Recipes: `dashboard.html` +
  `deep-systems.html`. Cytoscape graph (Phase 1). Inspector as Orbital
  `.system-stat` panel. Custom header → shared `PageHeader`.
- [ ] **T3.2 Sources** (`SourcesPage.tsx`) — Recipe: `data-admin.html`. Collapse
  4 tabs into a single filterable register. Detail as slide-out inspector.
  Rename data-engineer labels to audience-appropriate terms.
- [ ] **T3.3 Compare** (`ComparePage.tsx`) — Recipe: `staged-flow.html`. Visual
  step progression. Orange primary for compare action. Fix "Browse the full
  Library" → real link. Kill dead space.
- [ ] **T3.4 Explore / Library** (`ExplorePage.tsx` +
  `WorkspaceTemplate.tsx`) — Recipe: `data-admin.html`. Clean filter/result
  separation. One orange primary action (search). Shared template also affects
  CommonsPage.
- [ ] **T3.5 Resources / Commons** (`CommonsPage.tsx`,
  `CommonsDetailPage.tsx`) — Recipe: `catalog.html`. Cards with Orbital anatomy.
  `CommonsDetailPage` → `PageHeader`. Confirm current name (owner rejected
  "Commons").
- [ ] **T3.6 Templates / Build** (`TemplatesPage.tsx`) — Recipes:
  `staged-flow.html` + `settings.html`. Download = orange primary. Orbital
  select styling. Surface Documents discoverability.
- [ ] **T3.7 About** (`AboutPage.tsx`) — Recipe: `knowledge-base.html`. Add side
  nav/TOC guide rail. Visual section separation. Kill dead space.

---

### Phase 4 — Texture & Grammar System

Fetch `docs/AEROSPACE-GRAMMAR.md` from the Orbital repo for the full spec.

- [ ] **T4.1** Apply texture layers at documented opacities: blueprint `.22`,
  scanline `.19`, paper `.15`, film `.14`. Max one dominant + one supporting per
  surface. Signal surfaces richer than Mission.
- [ ] **T4.2** Activate Silkscreen font (`--ca-font-pixel`) as CRT/telemetry
  micro-label accent: system-stat labels, calibration rail text, datum metadata.
- [ ] **T4.3** Compose calibration rails, measurement ticks, datum/registration
  marks per page in safe corridors only (margins, gutters, panel edges).
  `aria-hidden`, non-interactive.

---

### Phase 5 — Polish & Migration

- [ ] **T5.1** Tracking token migration: grep ~81 hardcoded `letter-spacing`
  values → `--ca-tracking-*` tokens (`tight`, `label` 0.11em, `button` 0.07em,
  `eyebrow` 0.18em, `signal` 0.28em).
- [ ] **T5.2** Incremental `surfaces.css` retirement: as each page redesigned,
  move rules to Tailwind utilities from `@theme` tokens + `@layer components`.
  Track line count per phase. Never big-bang.
- [ ] **T5.3** Dead interaction sweep: click every nav link, filter, button, tag,
  disclosure on each page. Verify all "View in Atlas" / "Open in Atlas Map"
  links navigate. Verify all export/download buttons produce output. Check for
  plain text that should be links.
- [ ] **T5.4** `data-visual-identity` activation: 7 pages set these attributes
  but only 2 CSS rules exist. Wire real CSS rules or remove the attributes.
- [ ] **T5.5** Style system friction cleanup: remove inline Tailwind arbitrary
  values from `TopNav.tsx`, remove Tailwind class overrides in `orbital.css`
  L1510-1528.

---

### Phase 6 — Visual Baselines & Ship

- [ ] **T6.1** Regenerate visual baselines:
  `npx playwright test --config playwright.visual.config.mjs --update-snapshots`
  (produces `-win32`). Linux/CI run needed for `-linux` set.
- [ ] **T6.2** Full gate:
  ```
  npm run verify:quality
  npm run test:a11y:smoke
  npm run test:e2e:smoke
  ```
- [ ] **T6.3** Ship per established flow: branch → push → CI green →
  fast-forward to `main` → delete branch. Stage by path, never `git add -A`.
  Revert `data/generated/**` build churn before committing.

---

## Measures

### M1 — CI Health
- `feat/orbital-task-headers` merged; 0 color-contrast violations on CI.
- All subsequent phase branches pass `verify:quality`, `test:a11y:smoke`,
  `test:e2e:smoke` (77 tests) before merge.

### M2 — Graph Quality
- Atlas renders with Cytoscape.js using `cose-bilkent` layout.
- Node sizes vary by `descendantRecordCount` — visible size difference between
  high-record pubs (DISA STIG ~600+) and low-record pubs.
- The 3 "Federal Policy or Regulation" nodes are visually distinct (different
  sizes, different area clusters, tooltip reveals publication name).
- Progressive disclosure works: click expands children, hover shows tooltip.
- `elkjs` removed from `package.json`.
- `tests/e2e/epic14-ws4-atlas-canvas.spec.mjs` passes with Cytoscape DOM.

### M3 — Teal Elimination
- Zero decorative teal on any non-state element across all pages.
- `--ca-primary`/`--ca-accent` values unchanged (test-pinned to `#5ca3a6`).
- Only usage: focus rings, hover wash, link color, selected state, active nav.

### M4 — Page Fidelity
- Per page: live Playwright screenshot at 1440px width matches the
  corresponding Orbital example composition.
- Every page uses shared `PageHeader` primitive (no custom headers).
- Copy passes read-aloud test. No first person. No data-engineer jargon
  outside Sources.

### M5 — Texture Coverage
- Every page has at least one texture layer at documented opacity.
- Silkscreen font appears on at least one micro-label per page.
- Calibration/grammar marks in safe corridors only; all `aria-hidden`.

### M6 — CSS Health
- `surfaces.css` line count decreases with each phase (tracked).
- Zero hardcoded `letter-spacing` outside `tokens.css`.
- Zero inline Tailwind arbitrary values (`[...]` syntax) in component files.
- Zero Tailwind class overrides in `orbital.css`.

### M7 — Ship
- Visual baselines regenerated (both `-win32` and `-linux`).
- `npm run verify:quality` + `test:a11y:smoke` + `test:e2e:smoke` all green.
- All branches merged and deleted; `main` clean.
- Live site matches the spec at `controlatlas.org`.

---

## Gotchas (each cost real time — read before touching anything)

1. **`orbital.css` is imported LAST** and wins every cascade tie. Edit it, not
   `surfaces.css`, when both define the same selector.
2. **React NEVER boots on Home.** Home changes go in
   `vite.config.ts renderStaticHome()` + `main.tsx` vanilla JS.
3. **Never let npm rewrite the lockfile.** Node version mismatch prunes
   `puppeteer-core` proxy-agent entries; CI dies at `npm ci`. To add a dep:
   `git checkout <last-green-main-sha> -- package-lock.json`, inject only the
   new entries with a node script, validate with
   `cp package.json package-lock.json /tmp/x && cd /tmp/x && npm ci`.
4. **`serve:static` caches `index.html` at startup.** Restart after every
   `npm run build:site`.
5. **No color literals outside `styles/tokens.css`.** Use
   `color-mix(in srgb, var(--ca-shadow-color) 24%, transparent)` instead of
   `rgb(0 0 0 / .24)`.
6. **`*/` inside a CSS comment** silently closes it and breaks the Tailwind
   build.
7. **Home copy must live in `src/shared/site-copy.mjs`** — test enforced.
8. **Local data is incomplete.** Some routes need `npm run build:data` for the
   full graph. Cannot reproduce all CI failures locally without it.
9. **Never `git add -A`.** Stage by path. `git checkout -- data/generated/`
   after builds.
10. **`--ca-primary`/`--ca-secondary`/`--ca-accent` are pinned** to `#5ca3a6` by
    tests. Change WHERE they're used, not WHAT they resolve to.

---

## Orbital References (public, no auth)

Base URL: `https://raw.githubusercontent.com/BackslashBryant/orbital-archive-no-01/main/`

| Path | Use |
|---|---|
| `examples/example.css` | Authoritative component CSS |
| `examples/landing-page.html` | Landing / editorial split (already shipped) |
| `examples/data-admin.html` | Filters → table → inspector |
| `examples/dashboard.html` | Metrics then active work |
| `examples/sidebar-application.html` | Persistent rail + detail |
| `examples/catalog.html` | Browse/catalog cards |
| `examples/knowledge-base.html` | Reading column + guide rail |
| `examples/staged-flow.html` | Progress + form + review |
| `examples/settings.html` | Settings |
| `examples/deep-systems.html` | Deep systems |
| `docs/LAYOUT-UX.md` | Page anatomy, depth model, composition recipes |
| `docs/AEROSPACE-GRAMMAR.md` | 12 mark families, texture stacking |
| `tokens/tokens.json` | Palette source of truth |

---

## Critical Files

| File | Role | Phases |
|---|---|---|
| `styles/tokens.css` | Token source of truth | 0, 2 |
| `styles/orbital.css` | Last CSS import, wins cascade | 0, 2, 3, 4 |
| `styles/surfaces.css` | 249KB legacy, migrate incrementally | 2, 3, 5 |
| `styles/components.css` | Target for migrated rules | 2, 3, 5 |
| `styles/tailwind.css` | @theme inline mapping to tokens | 3, 5 |
| `src/ui/components/AtlasTree.tsx` | Graph rendering (React Flow → Cytoscape) | 1 |
| `src/ui/lib/atlasTreeLayout.ts` | ELK wrapper (delete) | 1 |
| `src/ui/lib/atlasTreeModel.ts` | Tree model builder (keep) | 1 |
| `src/ui/lib/atlasTreeAggregation.ts` | Node selection/aggregation (keep) | 1 |
| `src/ui/lib/areaVisualLanguage.ts` | Area color palette (keep, extend) | 1 |
| `src/ui/lib/pagePrimitives.tsx` | Shared PageHeader primitive | 3 |
| `src/ui/pages/*.tsx` | Individual page components | 3 |
| `vendor/orbital-archive/tokens.palette.json` | Vendored palette snapshot | — |
| `tests/orbital-token-drift.test.mjs` | Drift guard | — |
| `tests/graph/areaVisualLanguage.test.ts` | Visual token pins (don't change values) | 1 |

---

## Verification Discipline

Per page, per phase:
1. `npm run build:site` → restart `serve:static`
2. Live Playwright screenshot at 1440px width
3. **Judge the screenshot with your own eyes** — green tests ≠ good design
4. Run targeted test suite (`test:data` / `test:graph` / `test:browser` /
   `test:e2e:smoke`)
5. Final: `npm run verify:quality` + visual baseline regen + full-site
   walkthrough

---

## Ship Flow

1. Commit on a branch.
2. `git push origin <branch>` (triggers CI checks on the SHA).
3. Poll CI: `gh api repos/BackslashBryant/control-atlas/commits/<sha>/check-runs --jq '.check_runs[]|select(.name=="checks")|"\(.status) \(.conclusion)"'`
4. `git push origin <branch>:main` (fast-forward; direct push of unchecked
   commits rejected by `main` ruleset).
5. Delete the branch. Never modify branch protection.

**Local gate before pushing:**
```
npm run verify:quality
npm run test:a11y:smoke
npm run test:e2e:smoke
```
