# Epic 9: Interactive Relationship Graph

**Status:** Shipped (June 19, 2026)

**Ship evidence:** [`docs/audits/live-browser-audit-2026-06-19-epic-9.md`](../audits/live-browser-audit-2026-06-19-epic-9.md), ADR [`0011-graph-library.md`](../adr/0011-graph-library.md)

**Goal:** Ship the PRD Relationship Graph in the active React shell with mandatory accessible table fallback.

**User confusion reduced:** ΓÇ£How do controls, STIGs, and CCIs connect?ΓÇ¥ without forcing users through visual-only paths.

**PRD gaps addressed:** Interactive graph from object detail; Cytoscape/D3 decision; MVP criterion #14 (table fallback alongside graph).

**Branch pattern:** `agent/forge/epic-9-relationship-graph`

**Dependencies:** Epic 1 bundles; Epic 2 library detail; Epic 3 Compare table patterns. Epic 7 recommended first (trust surface).

**Lead personas:** Forge (implementation), Scout (library ADR), Muse (UX/copy), Pixel (E2E/a11y), Vector (doc closeout).

**ADR:** Supersede or extend [`docs/adr/0010-d3-phase-0-baseline.md`](../adr/0010-d3-phase-0-baseline.md) with `docs/adr/0011-graph-library.md`.

---

## Current baseline

- React shell ([`src/ui/App.tsx`](../../src/ui/App.tsx)) uses relationship **cards** on detail pages and **Compare tables** for row-level trace
- Legacy [`src/app/app.mjs`](../../src/app/app.mjs) is not mounted; vendored D3 at [`lib/d3.min.js`](../../lib/d3.min.js)
- [`ProvenanceBadge`](../../src/ui/lib/compareHelpers.tsx) already enforces text labels for provenance

---

## Stories

### Story 9.1 ΓÇö Graph library spike (D3 vs Cytoscape)

PRD Technical Architecture names Cytoscape.js; ADR 0010 deferred migration from D3.

**Scope:**

- Spike on object-local subgraph (50ΓÇô200 nodes typical for one control/STIG)
- Compare: bundle size on GitHub Pages, filter API, keyboard focus, screen-reader path, maintenance
- Write ADR 0011 with decision and rollback

**Acceptance criteria:**

- ADR documents chosen library with measurable rationale
- Spike proves acceptable performance on staged `dist/site`
- Rejected option tradeoffs recorded

**Research (before spike):** Run `parallel-cli research run` (`pro-fast`):

> Cytoscape.js vs D3 force graph for static federal compliance subgraphs: accessibility table fallback patterns, bundle size on GitHub Pages, keyboard navigation, and provenance edge labeling at 100ΓÇô500 nodes.

Poll: `parallel-cli research poll "$RUN_ID" -o epic-9-graph-library-research --timeout 540`

### Story 9.2 ΓÇö Object-local graph view

PRD: user can open graph from any object detail page.

**Scope:**

- New component (e.g. `src/ui/components/RelationshipGraph.tsx`)
- Entry from Library detail ΓÇ£What it connects toΓÇ¥ and/or ΓÇ£What to do nextΓÇ¥
- Load edges from existing runtime bundle; object-local filtering (neighbors of selected node)
- Plain-language panel: what this view shows, why it matters, what to do next

**Acceptance criteria:**

- Graph opens from detail page when published edges exist
- Empty state explains no connections (no dead button)
- Deep link or restore state via query params where practical

### Story 9.3 ΓÇö Provenance filters

PRD graph filters: node type, relationship type, provenance, confidence; exclude inferred.

**Scope:**

- Reuse Compare filter patterns and `displayNameFor` mappings
- ΓÇ£Include inferred linksΓÇ¥ checkbox mirrors Compare workbench
- Legend text: Official link vs Inferred link (not color alone)

**Acceptance criteria:**

- Filtering updates graph and table fallback in sync
- FedRAMP provenance uses teal token (`--ca-provenance-fedramp`)

### Story 9.4 ΓÇö Accessible table fallback

PRD: table fallback always available; graph is enhancement only.

**Scope:**

- Toggle or tab: Graph | Table
- Table mirrors graph dataset with `aria-label` (pattern from Compare ΓÇ£Relationship mappingsΓÇ¥)
- Same columns as Compare detailed mappings where applicable

**Acceptance criteria:**

- Table reachable without mouse from graph view
- axe serious/critical = 0 on graph and table states
- `prefers-reduced-motion` disables graph animation

### Story 9.5 ΓÇö E2E and a11y gates

**Scope:**

- `tests/e2e/relationship-graph.spec.mjs`: open from AC-2 detail, filter, switch to table
- Extend `tests/e2e/accessibility.spec.mjs` for graph routes
- Extend `tests/a11y-contract.test.mjs` if new graph-specific contracts needed

**Acceptance criteria:**

- Critical-path matrix documents graph + fallback
- `npm run precommit` green

### Story 9.6 ΓÇö Doc closeout

**Scope:**

- Remove ΓÇ£graph deferredΓÇ¥ from blocking backlog when shipped
- Update Epic 0 residual note in Plan.md (legacy `app.mjs` graph superseded by React graph)

---

## Epic acceptance criteria (PRD Relationship Graph + MVP #14)

1. User opens graph from object detail with published edges
2. User can filter out inferred relationships
3. Table fallback always available and accessible
4. Provenance/status never color-only (text + badges)
5. Static site only; no backend
6. Live Pages audit after deploy

## Verification commands

```text
npm run build:site
npm run test:e2e
npm run test:a11y
npm run precommit
```

## Out of scope

- Full-corpus graph (entire 8k+ node map at once)
- Backend graph API
- Replacing Compare workbenches (graph complements them)

## Risk

| Risk               | Mitigation                                         |
| ------------------ | -------------------------------------------------- |
| Bundle bloat       | Object-local subgraph only; lazy-load graph module |
| a11y regression    | Table fallback mandatory; per-route axe            |
| ADR drift from PRD | ADR 0011 required before Story 9.2 merge           |
