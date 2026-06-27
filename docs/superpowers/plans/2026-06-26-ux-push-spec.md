# Control Atlas — UX Push Spec ("Legible, Beginner-First, Consolidated")

**Date:** 2026-06-26
**Author:** Opus 4.8 (review + fixes already landed); execution intended for Sonnet 4.6
**Branch base:** `agent/forge/map-visual-fix`
**Status:** READY FOR EXECUTION

---

## 0. Read this first — mission & guardrails

**Mission (the why).** Control Atlas exists to *demystify and "decrappify" federal cyber compliance for people new to it.* Build for a confused beginner, not an expert. Every decision answers: *"Would this have helped someone seeing 800-53, CCIs, STIGs, and baselines for the first time?"* Lead with plain language; reveal depth on demand.

**The graph is a flagship feature, but NOT everywhere.** Keep the relationship graph as the hero of the **Atlas Map** page (orientation / "wow"). On record-detail and lookup flows it stays a secondary *"Open in Atlas Map"* destination — it already is; do not change that.

**Locked decisions — do NOT relitigate (ADRs in `docs/adr/`):**
- `0001` Static-first GitHub Pages. **No backend. No Supabase. No SSR.** No server, no auth, no user data.
- `0002`/`0003` Public data only; no user/org/system data.
- `0004` Client-side template generation only.
- `0006` Build-time imports, not runtime ingestion.
- Graph library is **Cytoscape.js** (cytoscape + `cytoscape-dagre` + `cytoscape-fcose` + popper/tippy). NOTE: `docs/adr/0011-graph-library.md` is **stale** (it still names `react-force-graph-2d`). `src/ui/graph/GRAPH_REFERENCES.md` is the canonical graph doc. **Task 7.3 below fixes the stale ADR — do not act on the stale ADR's library claim.**

**Graph constraints from `src/ui/graph/GRAPH_REFERENCES.md` (honor these):**
- Layouts allowed: **concentric, dagre (LR/TB), fCoSE only.** Do **not** add cola, cose-bilkent, elk, expand-collapse, or a custom/worker force layout.
- `cytoscape-navigator` (minimap) is "later only" — out of scope here.
- The map foundation is the **9 source categories**: Authority → Governance/Risk Framework → Control Catalog/Requirement Set → Baseline/Overlay/Profile → Assessment/Scoping → Implementation/Configuration → Control Mapping/Crosswalk → Threat/Defensive Mapping → Supporting Reference.

**Design system (honor `docs/design/design-system.md` + `styles/tokens.css`):**
- Fonts: Space Grotesk (display), Public Sans (body), JetBrains Mono (identifiers + the **rotating brand flourish**).
- The rotating hero word is an **intentional brand element** ("rotating flourish") — do NOT delete it. Task 4.1 makes it CSS-driven instead of JS-timer-driven.
- Colors via tokens only. Provenance colors must always pair with a text label (never color-only).
- Single-column narrative for reading; multi-column only for scannable cards/comparison. Disclosure for raw metadata. **Visible focus rings are a release gate.** Respect `prefers-reduced-motion`.

**Stack reality (verify against `package.json`, do not change):** Vite 8 + React 19 + TypeScript, hash routing, lazy pages, staged data loader, code-split graph chunk (~653 kB / 203 kB gz — keep it route-split, never import into the shell bundle). CSS is hand-written: `styles/tokens.css`, `styles/base.css`, `styles/components.css` (`.ca-*`), `styles/surfaces.css` (1981-line legacy).

---

## 1. Already done this session (do NOT redo)

Landed on `agent/forge/map-visual-fix`:
- `src/ui/components/RelationshipGraph.tsx` — added `always-label` style + `ALWAYS_LABEL_MAX_NODES = 28`; sparse maps now label every node by default. (Fixed the "9 unlabeled dots" flagship failure.)
- `src/ui/pages/AtlasMapPage.tsx` — removed the duplicated "Authority flows left-to-right…" paragraph; non-focused intro now reads "Each node is a category of compliance source. Select one to see what it contributes and where to go next."
- `src/ui/components/RelationshipExplorer.tsx` — Map/List toggle moved above Fit/Zoom controls; zoom controls hidden in List view.

Verified: `tsc` clean, `npm run build:site` OK, `npm run test:graph` 19/19.

---

## 2. Scope of this push

Five workstreams, ordered by impact-for-beginners. Each is independently shippable.

| # | Workstream | Why it serves the mission |
|---|-----------|---------------------------|
| 3 | **Atlas Map chrome → modern, calm, above-the-fold** | The flagship currently buries a tiny canvas under a wall of legend/controls/intro. A beginner should *see the map immediately* and not be intimidated. |
| 4 | **Home polish** | First impression; remove friction (double search, JS-timer flourish) without losing brand. |
| 5 | **Mobile map** | "Left-to-right authority flow" is meaningless on a phone. |
| 6 | **Beginner onboarding on Atlas Map** | A "What am I looking at?" layer that teaches the 9 categories in plain English. |
| 7 | **Design-system consolidation (incremental)** | Kill the two-CSS-system inconsistency that makes everything feel rough; fix global anti-patterns. |

**Out of scope (explicitly):** backend/Supabase; replacing Cytoscape; new graph layout libs; minimap; rewriting all of `surfaces.css` in one pass; new data sources; auth; any record-detail restructuring (it already follows the mission).

---

## 3. Workstream A — Atlas Map chrome redesign

**Goal:** On load, a beginner sees a clean header, then the **map canvas itself** (≥ 60% of the viewport height on desktop), with controls and legend tucked into unobtrusive, modern affordances. No wall of text, no 12-swatch legend bar above the graph.

### 3.1 Move map controls into a floating canvas toolbar
- **Files:** `src/ui/components/RelationshipExplorer.tsx`, `styles/surfaces.css` (`.relationship-map-controls` ~L1572) or new rules in `styles/components.css`.
- **Do:** Replace the row of text buttons (Fit to screen / Reset view / Zoom in / Zoom out / Copy map link) with a compact **icon toolbar overlaid on the canvas** (bottom-left), using `@tabler/icons-react` (`IconMaximize`, `IconRefresh`, `IconPlus`, `IconMinus`, `IconLink`). Glassy surface: `background: color-mix(in srgb, var(--ca-surface) 80%, transparent); backdrop-filter: blur(6px); border: 1px solid var(--ca-border); border-radius: var(--ca-radius-md);`. Each button is an icon button with an `aria-label` and a tooltip (title attr is fine). Keep "Open selected record" / "Compare selected item" as **text** buttons but move them into the right-hand `SelectedItemPanel` context, not the canvas toolbar.
- **Acceptance:** Controls no longer consume a full text-button row above the canvas; they float over the canvas; every control has an `aria-label`; keyboard-focusable in logical order; disabled state during layout still works (`layoutRunning`).

### 3.2 Collapse the legend into a popover
- **Files:** `src/ui/components/RelationshipExplorer.tsx` (`.relationship-map-legend` block), `styles/surfaces.css` (~L1369).
- **Do:** Replace the always-visible 12-item legend with a single **"Legend ▾"** trigger (top-right of the canvas) that opens a popover/disclosure listing item-type shapes and provenance colors. Use the existing Radix dependency pattern (`@radix-ui/react-accordion` is present; or a simple `<details>`/button + absolutely-positioned panel — keep it lightweight, no new deps). Legend content unchanged (`ITEM_TYPE_LEGEND`, `PROVENANCE_LEGEND`, `ProvenanceTerm`). Default **collapsed**.
- **Acceptance:** Legend is one chip by default; opening it shows the full key; closes on outside-click/Esc; still screen-reader labeled (`aria-label="Map legend"`).

### 3.3 Give the canvas real height, above the fold
- **Files:** `styles/surfaces.css` (`.relationship-graph-canvas`/`-wrap`/`-stage` ~L1396–1433, currently `min-height: 22rem`).
- **Do:** Make the canvas responsive-tall: `min-height: clamp(28rem, 62vh, 46rem);` on desktop. Ensure the `.atlas-map-layout` two-column grid lets the map column fill available height. Trim the intro `<p>` in `RelationshipExplorer` to one line on the Atlas Map (the counts line is useful; keep "N items and M links are visible. Use the list view for full screen-reader access." but drop redundant lead-ins).
- **Acceptance:** At 1440×900 with default zoom, the graph canvas is visible without scrolling (header + map fit in the first viewport). Cytoscape still `fit()`s on layoutstop.

### 3.4 Node visual language polish (tokens + role sizing)
- **Files:** `src/ui/components/RelationshipGraph.tsx` (`buildGraphStylesheet`), `src/ui/lib/graphTheme.ts`.
- **Do:** Keep existing shapes per type (ellipse/triangle/diamond/hexagon) and `always-label`. Add subtle **size-by-role** so the eye finds the spine: center/control nodes largest, supporting-reference smallest (supporting already `opacity: 0.46`). Ensure all colors come from `--ca-*` tokens (no hard-coded hex in new code; fallbacks ok). Increase selected-node contrast using `--ca-graph-selected`.
- **Acceptance:** Visual hierarchy reads at a glance; no new hard-coded colors; `npm run test:graph` still green.

---

## 4. Workstream B — Home polish

### 4.1 Convert the rotating brand flourish to CSS-only
- **Files:** `src/ui/App.tsx` (HERO_WORDS, `heroWordIndex` state, the `setInterval` effect ~L201–216, the `heroWord` memo), `src/ui/pages/HomePage.tsx` (`.ca-hero-word`), `styles/surfaces.css`/`components.css`.
- **Do:** Remove the JS `setInterval` that drives `heroWordIndex` (it never lets the page settle — it broke screenshot tooling and wastes a render every 2.5s). Reimplement the rotating word as a **pure CSS keyframe animation** cycling the 8 words (`Comply, Map, Assess, Crosswalk, Navigate, Inherit, Audit, Authorize`) via stacked `<span>`s or a CSS steps animation. Gate the animation behind `@media (prefers-reduced-motion: no-preference)`; show a single static word ("Comply") when reduced motion. Keep `--ca-font-mono` styling and the `aria-label="Ctrl Alt Comply"` / `aria-hidden` on the animated text.
- **Acceptance:** Hero word still cycles visually; **no JS timer**; reduced-motion shows a static word; the page reaches network-idle/stable (a Playwright `networkidle` screenshot succeeds without a forced timeout). `App.tsx` no longer imports/uses `heroWordIndex`.

### 4.2 Single search affordance in the header
- **Files:** `src/ui/components/TopNav.tsx`.
- **Do:** Today the header shows BOTH an inline `header-search` form AND a search-icon button (`onOpenSearch`). Pick **one** primary: keep the inline field on wide desktop (≥ ~1100px) and the icon-only trigger below that; do NOT show both simultaneously. Also: on static views where `bundle` is null the field shows "Loading…" — hide the inline field (or show the icon trigger only) until `bundle` is ready instead of showing a dead "Loading…" input.
- **Acceptance:** At any viewport width, exactly one search entry point is visible; no "Loading…" dead input on first paint of static pages; ⌘/Ctrl-K still opens the overlay.

### 4.3 Hero primary CTA = "Start here"
- **Files:** `src/ui/pages/HomePage.tsx` (`.hero-actions`).
- **Do:** Swap emphasis: **"Start here"** becomes the `primary` button, **"Atlas Map →"** becomes `secondary`. Rationale: the guided 3-question flow is the gentlest on-ramp for a beginner; the Atlas Map is one click away and now legible. Keep both buttons.
- **Acceptance:** "Start here" renders with `className="primary"`; "Atlas Map →" with `className="secondary"`.

---

## 5. Workstream C — Mobile map

### 5.1 Vertical flow under the tablet breakpoint
- **Files:** `src/ui/pages/AtlasMapPage.tsx` (passes `layoutEngine`/builds model), `src/ui/lib/graphLayout.ts` (`buildDagreOptions`), `src/ui/components/RelationshipGraph.tsx`.
- **Do:** The default source-hierarchy uses dagre `rankDir: "LR"`. Under ~700px wide, switch to `rankDir: "TB"` (top-to-bottom) so the 9-category flow reads vertically on a phone. Implement by detecting viewport (e.g., a `window.matchMedia("(max-width: 700px)")` read passed as a prop/option into the layout builder, or a `direction` param on `buildDagreOptions`). Re-run layout on breakpoint cross (debounced). Keep LR on desktop.
- **Acceptance:** At 375px the default Atlas Map renders a vertical top-to-bottom chain with readable labels; at ≥ 700px it stays left-to-right; rotating between sizes re-lays out without breaking selection.

### 5.2 Mobile chrome stacking
- **Files:** `styles/surfaces.css` (`.atlas-map-layout`, `.atlas-source-filters` ~L1765).
- **Do:** Ensure the two-column `.atlas-map-layout` collapses to single column on mobile with the map first, the selected-item panel below. Source filter chips wrap cleanly. Canvas `min-height` on mobile ~ `clamp(24rem, 70vh, 36rem)`.
- **Acceptance:** No horizontal scroll at 375px; map is the first substantial element; filters wrap without overflow.

---

## 6. Workstream D — Beginner onboarding on Atlas Map

### 6.1 "What am I looking at?" plain-language layer
- **Files:** `src/ui/pages/AtlasMapPage.tsx` (`FoundationSidePanel` and/or a new inline help), optionally `src/ui/graph/sourceHierarchy.ts` for category copy.
- **Do:** For the **default (non-focused)** map, make the right panel teach the 9 categories in plain English by default — a short "How federal compliance fits together" explainer (one sentence per category, beginner tone) instead of only reacting to selection. When a category node is selected, expand that category's plain-language description + examples (data already exists in the source hierarchy). Add one **"New here? Start with the guided path"** link to `start-here`.
- **Acceptance:** A first-time visitor to `#/atlas-map` can read what each of the 9 categories means without clicking; selecting a node deepens that category; a path to Start Here is present. Copy is jargon-light (define terms inline or link the glossary).

### 6.2 Trim duplicate/again-redundant intros
- **Files:** `src/ui/pages/AtlasMapPage.tsx`, `src/ui/components/RelationshipExplorer.tsx`.
- **Do:** Audit remaining duplicate copy between `PageHeader.summary`, `introCopy`, and the side panel. One idea stated once.
- **Acceptance:** No sentence appears twice on the page (desktop or mobile).

---

## 7. Workstream E — Design-system consolidation (incremental)

> Bold but smart: do **not** rewrite all of `surfaces.css` at once — that risks regressions across a working app. Freeze it, fix the global anti-patterns, and migrate the Atlas Map + Home surfaces onto `.ca-*` tokens. Leave the rest for follow-up.

### 7.1 Kill global anti-patterns
- **Files:** `styles/surfaces.css`.
- **Do:**
  - Remove/scope the jarring hover lift `transform: translateY(-1px);` at **`surfaces.css:1218`** (and the duplicate `.intent-card-button:hover` rule at ~L719/L1214). Replace with a non-layout-shifting hover (border/background/shadow change). Respect `prefers-reduced-motion`.
  - Confirm interior page `h1` cap holds: `.panel h1` is `clamp(1.5rem, 2.5vw, 2rem)` (`surfaces.css:344`) — ensure interior pages (Explore, Templates, Start Here, Sources) actually inherit it; the global `h1` at `surfaces.css:339` is `clamp(2.5rem, 6vw, 5rem)` (hero scale). If any interior `h1` escapes the `.panel` cap, wrap it or add a `.page-header h1` cap at ~`var(--ca-text-3xl)`.
- **Acceptance:** No hover causes layout shift; interior page titles render ≤ ~2rem; hero stays large.

### 7.2 Freeze `surfaces.css`; new work on tokens
- **Do:** Add a header comment at the top of `styles/surfaces.css`: `/* LEGACY — do not add new rules here. New components use .ca-* tokens in components.css. Migrate incrementally. */`. Any *new* CSS this push goes in `components.css` using `--ca-*` tokens (spacing/radii/type/color). Migrate the Atlas Map rules touched in Workstream A onto tokens as you edit them.
- **Acceptance:** No new selectors added to `surfaces.css` except deletions/edits of existing ones; new rules use tokens.

### 7.3 Fix the stale graph ADR
- **Files:** `docs/adr/0011-graph-library.md`.
- **Do:** Add a status note that the decision was **superseded**: the app migrated to **Cytoscape.js** (see `src/ui/graph/GRAPH_REFERENCES.md` and the map-foundation work). Do not delete history; append a "Superseded 2026-06 — now Cytoscape.js" section with one-paragraph rationale (full-corpus graph + built-in layouts/clustering). Keep it short.
- **Acceptance:** ADR 0011 no longer misleads a reader into thinking `react-force-graph-2d` is in use.

---

## 8. Design tokens & conventions (quick reference for execution)

- Spacing: `--ca-space-1..16`. Radii: `--ca-radius-sm/md/lg`. Type: `--ca-text-xs..4xl`, fonts `--ca-font-display/body/mono`.
- Colors: backgrounds `--ca-bg/surface/surface-raised/border`; text `--ca-text/-muted/-subtle`; actions `--ca-primary(/-hover)`, `--ca-secondary(/-hover)`; provenance `--ca-prov-*` (+ matching `-text` for on-dark labels); graph `--ca-graph-*`.
- Motion: `--motion-ease`; always wrap motion in `@media (prefers-reduced-motion: no-preference)`.
- Icons: `@tabler/icons-react` only. Dialogs/drawers: `@radix-ui/*` (already installed). **Add no new dependencies.**

---

## 9. Verification & Definition of Done

Run from project root (`D:\DevOps\1. Projects\GovFrame`). PowerShell or Bash tool.

**Per-change loop:**
```
npm run build:site
npx tsc --project tsconfig.app.json --noEmit
npm run test:graph
```

**Before PR (full gate):**
```
npm run lint
npm run typecheck
npm test
npm run test:a11y        # builds + runs axe via Playwright
npm run test:e2e         # builds + Playwright; includes atlas-map specs
```

**Manual browser check (use the static server + a reduced-motion Playwright harness — the rotating word historically blocked naive screenshots; after Task 4.1 this should no longer be needed):**
```
node ./tools/serve-static-site.mjs    # serves dist/site on :4173
```
Check at **1440×900** and **375×812**, light + dark is dark-only (`color-scheme: dark`):
- `#/` — one search affordance; CSS-only flourish; "Start here" primary; page settles.
- `#/atlas-map` — canvas above the fold; floating icon toolbar; collapsed legend; labeled 9-node LR flow; beginner category explainer in side panel.
- `#/atlas-map?node=AC-2` — focused tree legible; selected-record actions in side panel.
- `375px #/atlas-map` — vertical (TB) flow, no horizontal scroll, map first.

**DoD checklist:**
- [ ] All five workstreams' acceptance criteria met.
- [ ] No new npm dependencies; graph chunk still route-split.
- [ ] No new rules in `surfaces.css`; new CSS uses `--ca-*` tokens.
- [ ] Focus rings visible on every new interactive element; all icon buttons have `aria-label`.
- [ ] `prefers-reduced-motion` honored on flourish + hovers + layout.
- [ ] Full gate (lint/typecheck/test/test:a11y/test:e2e) green.
- [ ] No duplicate copy on any page.
- [ ] e2e atlas-map specs updated if selectors/DOM changed (see `tests/e2e/atlas-map-*.spec.mjs`).

---

## 10. Risks & traps

- **e2e/a11y specs are strict** (`--max-warnings=0` lint; axe a11y). Moving DOM (toolbar, legend popover, view tabs) WILL break selectors in `tests/e2e/atlas-map-*.spec.mjs` and `tests/e2e/accessibility.spec.mjs`. **Update specs in the same change**; don't weaken assertions to pass.
- **Cytoscape `fit()` + custom canvas height:** after changing `min-height`, confirm `layoutstop` still `fit()`s and the floating toolbar doesn't overlap nodes at min zoom. Test Fit/Reset.
- **Breakpoint relayout (5.1):** re-running dagre on every resize is expensive — debounce and only relayout when crossing the 700px boundary, not on every pixel.
- **Don't import the graph into the shell bundle** while refactoring `RelationshipExplorer` — keep `RelationshipGraphWithHandle` lazy.
- **Legend popover must stay keyboard/AT accessible** — it currently has `role="list"`; preserve semantics inside the popover.
- **Scope creep into `surfaces.css`:** resist rewriting it wholesale. Freeze + migrate-on-touch only.

---

## 11. Suggested commit / PR structure

One PR per workstream (or grouped A+D since both touch the Atlas Map), each independently green:
1. `feat(atlas-map): modern canvas chrome — floating toolbar, popover legend, taller canvas` (WS A)
2. `feat(home): CSS-only brand flourish, single search, Start-here primary` (WS B)
3. `feat(atlas-map): vertical mobile flow + responsive chrome` (WS C)
4. `feat(atlas-map): beginner category explainer + copy dedupe` (WS D)
5. `refactor(styles): freeze surfaces.css, kill hover-lift, migrate atlas-map to tokens; docs: correct ADR 0011` (WS E)

End each commit message with the project's Co-Authored-By trailer if committing.

---

## 12. Stretch (only if time remains — NOT required)

- Per-node click-to-expand cluster affordance hint on the canvas (data already supports clusters).
- Subtle entrance animation on map load (reduced-motion gated).
- "Copy map link" → toast confirmation instead of silent clipboard write.
