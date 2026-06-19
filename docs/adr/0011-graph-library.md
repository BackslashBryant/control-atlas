# ADR 0011: Relationship Graph Library — react-force-graph-2d

**Status:** Accepted

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
