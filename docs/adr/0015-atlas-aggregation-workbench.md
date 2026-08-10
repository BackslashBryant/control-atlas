# ADR 0015: Aggregated Atlas Workbench

**Status:** Accepted

**Date:** August 10, 2026

## Context

The Epic 12 Atlas skill tree preserved a truthful curated spine, but its fixed
L0-L2 coordinates spread authority and area nodes across a canvas that `fitView`
then shrank. Semantic zoom changed node copy but did not change aggregation.
The result passed collision and node-cap tests while remaining difficult to
read and leaving much of the viewport unused.

The product needs an ecosystem overview, publisher-native drilldown, and a
persistent explanation workbench. It must not restore a full-corpus graph.

## Open-source platform gate

| Candidate | License | Fit | Decision |
| --- | --- | --- | --- |
| Existing semantic React DOM | Project code | Strong accessibility, weak spatial overview | Retain as compact/table alternative |
| React Flow | MIT | Existing pan, zoom, focus, custom-node, and viewport support | Retain for the interactive map |
| `d3-hierarchy` | ISC | Existing deterministic tree, cluster, and pack layout functions | Adopt for all data-driven Atlas placement |
| ELK.js | EPL-2.0 | Strong compound graph routing but materially more configuration and async work | Retain only for bounded relationship diagrams |
| Bespoke SVG/canvas runtime | Project code | Maximum control but rebuilds viewport, focus, and interaction infrastructure | Reject |

No dependency is added.

## Decision

Use React Flow as the interactive viewport over the compact generated Atlas
spine. Use deterministic `d3-hierarchy` projections to place aggregated nodes
within the measured viewport. Representation changes with semantic zoom:

1. Ecosystem: authority groups, trunk, nine area aggregates.
2. Area: selected area and publication groups; siblings become compact context.
3. Publication: publisher-native summaries and technology gates.
4. Record: focused record with bounded structural and mapping context.

Selection updates a persistent inspector. Drilldown updates route scope.
Mappings remain overlays and never become structural parents. A synchronized
semantic tree/list remains the accessible alternative and the compact layout.

## Consequences

- The generated Atlas spine and canonical relationships do not change.
- The fixed L0-L2 position snapshot is replaced by deterministic viewport-fit,
  aggregation, collision, and space-utilization contracts.
- React Flow remains route-scoped and never receives the full record corpus.
- Density encoding may use compact clusters or proportional markers, but exact
  counts remain visible and structural zero-count areas remain present.

## Rollback

Revert the Atlas presentation commit. The unchanged spine, routing state,
semantic tree alternative, and record workspaces remain valid.
