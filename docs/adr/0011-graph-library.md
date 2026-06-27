# ADR 0011: Relationship Graph Library — react-force-graph-2d

**Status:** Superseded — see section "Superseded 2026-06" below.

**Date:** June 19, 2026

**Supersedes:** Extends [ADR 0010](0010-d3-phase-0-baseline.md) — keeps `d3-force` physics; defers Cytoscape.js.

## Context

Epic 9 ships an object-local relationship map embedded in Library detail. Requirements:

- 50–200 nodes typical (1-hop ego network from a control or STIG)
- Provenance-colored edges with text labels (not color-only)
- Mandatory accessible table fallback (canvas is decorative for AT)
- Static GitHub Pages bundle; lazy-load preferred
- ADR 0010 deferred Cytoscape unless scale or maintenance forces migration

Prior recon confirmed no D3 canvas renderer exists in the repo today — this is greenfield UI work.

## Options evaluated

| Option                   | Bundle (approx.)          | Force layout           | Canvas perf   | React fit            | Notes                                           |
| ------------------------ | ------------------------- | ---------------------- | ------------- | -------------------- | ----------------------------------------------- |
| **react-force-graph-2d** | ~45 KB gzip (lazy chunk)  | d3-force               | Good 100–500  | Native props/ref API | Zoom, highlight, labels built-in                |
| Pure D3 (canvas/SVG)     | d3-force + d3-zoom ~30 KB | d3-force               | Good (canvas) | useRef/useEffect     | Full control; more build time                   |
| Cytoscape.js             | ~150+ KB                  | Built-in               | Excellent     | Wrapper needed       | PRD names it; ADR 0010 deferred; heavier bundle |
| @visx/network            | Small                     | None (external layout) | SVG only      | Composable           | Wrong tool — no simulation                      |

Parallel deep research via `parallel-cli` was blocked (billing); evaluation used prior docs-researcher findings, official react-force-graph docs, and ADR 0010 constraints.

## Decision

Adopt **`react-force-graph-2d`** (^1.25.x), lazy-loaded from `RelationshipGraph.tsx`.

Rationale:

1. Uses the same **d3-force** engine ADR 0010 assumed — not a Cytoscape migration.
2. Canvas rendering handles object-local subgraphs without custom paint loops.
3. Built-in zoom/pan, `linkLabel`, neighbor highlight, `zoomToFit` reduce time-to-ship for Epic 9.
4. Lazy import keeps initial detail-page bundle unchanged until user opens the map.
5. Accessibility remains on the **table fallback** (WCAG 2.2 SC 1.1.1 two-part alternative).

## Consequences

- Add one npm dependency: `react-force-graph-2d`.
- Vendored `lib/d3.min.js` stays for legacy static copy; React bundle uses npm transitive d3-force.
- Cytoscape re-evaluation deferred until full-corpus graph or native a11y APIs are required.
- `prefers-reduced-motion`: disable force simulation; render settled positions.

## Rollback

Remove `react-force-graph-2d`, replace `RelationshipGraph.tsx` with pure D3 canvas via `useRef`/`useEffect` using the same `buildNeighborhood()` runtime API. Table fallback and filters unchanged.

---

## Superseded 2026-06 — Now Cytoscape.js

**`react-force-graph-2d` was never shipped.** Before Epic 9 landed, the Atlas Map scope expanded to a full-corpus relationship graph (hundreds of nodes, 9-category source hierarchy, cluster expansion, multi-layout support). That scale, combined with native dagre/fCoSE layout plugins and built-in a11y event hooks, made `react-force-graph-2d` the wrong fit.

The app migrated to **Cytoscape.js** (`cytoscape` + `cytoscape-dagre` + `cytoscape-fcose` + `cytoscape-popper`/`tippy.js`). See `src/ui/graph/GRAPH_REFERENCES.md` for the canonical graph documentation and layout constraints.

Rationale:
- Full-corpus graph requires pre-computed layout positions and efficient batch DOM updates — Cytoscape handles both via its internal model.
- Built-in `dagre` (LR/TB hierarchy) and `fCoSE` (force-directed clusters) cover all Atlas Map use cases without extra dependencies.
- Cytoscape's stylesheet system supports provenance-colored edges, role-based node sizing, and cluster compound nodes natively.
- `cytoscape-popper` + `tippy.js` provides tooltip support without custom paint loops.

The D3-force physics path from ADR 0010/0011 is closed. Do not re-introduce `react-force-graph-2d` or raw `d3-force` for the Atlas Map.

---

## Superseded 2026-06 - Now React Flow + ELK.js

The Cytoscape migration is now superseded. Control Atlas needs bounded, guided relationship diagrams rather than an open-ended graph/network analysis surface, so the app now uses **React Flow + ELK.js** for the interactive map. React Flow owns the node-based UI, selection model, minimap, pan, and zoom behavior. ELK.js owns automatic layout for hierarchy, focus, and expanded relationship modes.

Current direction:
- Keep tables, search, filters, and curated pathways as the main user journey.
- Use diagrams only for bounded relationship views, such as a focused control, a selected comparison path, or a selected Atlas Map slice.
- Do not re-introduce Cytoscape, fCoSE, dagre, raw D3-force, or a single giant graph canvas for the main product experience.
