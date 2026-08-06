# Atlas Recovery Courses of Action

**Status:** Hybrid decision selected and implemented locally; verification pending

**Release effect:** v1.0 remains NO-GO until local browser and live Pages evidence closes V1-RR-003

**Evidence:** [`../audits/live-browser-audit-2026-07-16-v1-release-readiness.md`](../audits/live-browser-audit-2026-07-16-v1-release-readiness.md)

## Problem to solve

The current Atlas technically exposes relationships but does not translate them into a readable answer. Focused records render as tiny nodes inside a large canvas, the Leverage panel obscures useful space, controls dominate the page, and the mobile experience shifts substantially while the full graph loads.

The performance failure is structural, not cosmetic. The deployed focused Atlas scored 12 in Lighthouse mobile testing: 17.24s LCP, 5.42s TBT, 1.45 CLS, and 20.93s TTI. It loads the full graph and large library shards before the interface settles; `nodes.json` alone transfers about 1.83 MB.

All three courses retain the Atlas, preserve record deep links, and keep the accessible list fallback.

## Course 1 — Decomposition Atlas (recommended)

Replace the free-canvas neighborhood with an expandable decomposition tree.

### User model

1. Start with the selected record or a plain-language question.
2. Show its top-level relationship categories as readable branches.
3. Expand one branch at a time.
4. Keep the selected item's explanation in a docked panel that never covers the tree.
5. Show provenance once for the branch; expose row-level evidence only when it differs.

### Categorization

Use the existing presentation categories as projections over the same relationship data:

- **Purpose:** Rules, Frameworks, Controls, Baselines, Implementation, Assessment, Mappings, Threat/Defense, Supporting Sources.
- **RMF:** Prepare, Categorize, Select, Implement, Assess, Authorize, Monitor.

No source record, edge, or provenance classification needs to be migrated. A small projection layer assigns each relationship to Purpose and RMF views at render/build time. Users may switch category lenses without changing the underlying truth.

### Delivery shape

- Search and current context above the tree.
- One branch expanded by default; clear counts on collapsed branches.
- Branch-summary shards loaded first; node details and children loaded only on expansion.
- Stable tree/list geometry reserves space before data arrives, preventing footer and canvas shifts.
- Desktop detail dock; inline detail disclosure on mobile.

### Tradeoff

This is the largest UI change, but it directly addresses clarity, mobile performance, and the product's translation-first standard.

## Course 2 — Compliance Lanes

Arrange relationships into a left-to-right working sequence:

`Requirement → Control → Implementation → Evidence → Assessment → Decision`

### User model

- Each lane answers one question and shows a limited set of cards.
- Selecting a card highlights its upstream basis and downstream consequence.
- Purpose/RMF categories determine lane placement and optional filters.

### Delivery shape

- Strong for explaining a compliance workflow and identifying missing handoffs.
- Load lane summaries first and card details on demand.
- Preserve an “Other relationships” disclosure for links that do not fit the primary sequence.

### Tradeoff

The workflow is clearer than the current graph, but relationships that are not sequential can feel forced or hidden.

## Course 3 — Progressive Neighborhood

Keep React Flow, but reduce the initial view to the selected record and its nearest relationship groups.

### User model

- Show the center record plus a small number of readable group nodes.
- Expand a group or individual relationship intentionally.
- Move filters and search above the canvas; move Leverage into a non-overlapping dock.

### Delivery shape

- Lowest migration cost and retains familiar pan/zoom behavior.
- Use summary nodes and lazy expansion to avoid loading/rendering the entire neighborhood.
- Fit only visible nodes; never shrink labels below readable size.

### Tradeoff

This can repair the worst defects, but users still have to interpret a graph. It has the highest risk of becoming a cleaner version of the same unclear product.

## Decision comparison

| Criterion | Decomposition Atlas | Compliance Lanes | Progressive Neighborhood |
| --- | --- | --- | --- |
| Novice clarity | **High** | High | Medium |
| Expert relationship exploration | High | Medium | **High** |
| Fits Purpose/RMF categories | **High** | High | Medium |
| Mobile usability | **High** | High | Medium |
| Performance recovery potential | **High** | High | Medium |
| Implementation change | High | Medium | Low |
| Risk of repeating current failure | **Low** | Medium | High |

## Acceptance criteria for any course

- The selected record and first-level choices are readable without zoom at 390×844 and desktop widths.
- Search appears before the visualization and keeps the current deep-link context.
- No panel or legend covers navigable content.
- Initial rendering does not load the complete graph; deeper data loads only when requested.
- Focused-Atlas mobile Lighthouse reaches at least 90 Performance with LCP below 2.5s, TBT below 200ms, CLS below 0.1, and TTI below 3.5s in the same test configuration.
- Keyboard users can reach search, category controls, every expanded branch/card, details, and the Map/List switch in a logical order.
- The list fallback carries the same categories, relationship rationales, and evidence links as the visual view.
- Trust terminology is explained once per group or view. Repeated “Source-backed,” “Federal published,” or “Official link” copy appears only when it distinguishes one result from another.
- Existing Atlas and record URLs continue to resolve.
- AC-2, PL-2, CCI-000225, a baseline, a STIG rule, and a source-only item pass desktop and mobile scenario tests.

## Recommendation

Choose **Course 1 — Decomposition Atlas**. It uses the current categorization system without rewriting source data, gives newcomers a controlled path, preserves expert depth through expansion, and creates the strongest architectural boundary against another unreadable all-at-once graph.

## Owner decision and implemented hybrid

The selected direction combines the best parts of Courses 1, 2, and 3 without exposing three competing products:

- **Path is the default.** It uses six working stages — Understand, Decide, Implement, Evidence, Assess, Monitor — as a decomposition/progression view.
- **Map is optional and bounded.** It starts with the selected record plus no more than six real relationship groups. One group expands at a time; desktop shows at most ten records and compact/mobile shows at most six. Overflow opens List.
- **List is equal, not a fallback afterthought.** Path, Map, and List derive from the same filtered edge set and preserve source references.
- **Orientation is responsive and semantic.** Desktop stage progression is horizontal. Mobile stage progression is vertical. Map regions use a vertical upstream / peer / downstream axis so lateral equivalence is not confused with workflow progression.
- **Zero means zero.** If no published connections exist, Map shows an explicit empty state and no canvas. Candidate links appear only after an explicit toggle.
- **Details never cover navigation.** Desktop uses a separate inspector column; smaller screens place details below the active view.
- **The Atlas no longer loads the full graph.** A compact record index and one incident-edge shard are loaded for the selected record.

The implementation replaces React Flow/ELK on the primary Atlas route with semantic React DOM. The existing graph stack remains lazy for other bounded relationship surfaces until those are separately reviewed.
