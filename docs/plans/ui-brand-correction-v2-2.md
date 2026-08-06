# UI and Brand Correction v2.2 Implementation Plan

**Goal:** Close the remaining gaps between the shipped Epic 10 interface and the approved UI and Brand Correction Spec v2.2.

**Architecture:** Preserve the static React/Vite application and query-string routing. Replace the force-directed canvas with a lazily loaded Cytoscape/fCoSE component, keep the existing accessible list fallback, add a first-run CSS/SVG entrance overlay, cache static artifact requests in memory, and finish the Explore interaction hierarchy without changing graph semantics.

**Tech stack:** React 19, TypeScript, Vite, Cytoscape, cytoscape-fcose, Radix Accordion, Playwright, Node test runner.

---

## Task 1: Lock the residual contract with failing tests

- Add browser-contract assertions for the first-run overlay, `ca_intro_seen`, fCoSE dependencies, lazy graph import, exact footer disclaimer, and in-memory artifact cache.
- Add E2E coverage for first-run dismissal, repeat-visit bypass, reduced-motion bypass, Explore accordions, the connections-only filter, and zero-connection text.
- Run the focused tests and confirm they fail for the missing behavior.

## Task 2: Add the first-run brand entrance

- Create a focused `BrandEntrance` component using inline SVG and CSS only.
- Initialize visibility from `localStorage` and `prefers-reduced-motion`.
- Dismiss on click, Enter, or Escape; persist `ca_intro_seen`; hide header/navigation while visible.
- Keep application data loading active beneath the overlay.
- Run the focused browser and E2E tests.

## Task 3: Replace the graph renderer with lazy fCoSE

- Add `cytoscape` and `cytoscape-fcose`; remove `react-force-graph-2d`.
- Rebuild `RelationshipGraph` around Cytoscape with the required fCoSE layout:
  `nodeDimensionsIncludeLabels: true`, `quality: "default"`,
  `packComponents: true`, and `animationDuration: 400`.
- Preserve selected-node emphasis, cluster expansion, zoom controls, label rules, keyboard selection, provenance styling, and reduced-motion behavior.
- Lazy-load the graph renderer from `RelationshipExplorer` so non-map routes do not include Cytoscape in the initial bundle.
- Run typecheck, focused contracts, and relationship-map E2E coverage.

## Task 4: Make static loading route-aware and cached

- Add a module-level `Map` cache for fetched static JSON artifacts.
- Stop starting the full graph phase on routes that only need static/search content.
- Trigger the full graph phase when navigation reaches a graph-dependent route, reusing cached search/template artifacts and all previously fetched graph artifacts.
- Add determinate map status text based on visible node and edge counts and announce completion through `aria-live`.
- Run runtime, browser, loading-resilience, and landing-performance tests.

## Task 5: Finish Explore grouping and action hierarchy

- Render result categories as count-labeled accordions with the first non-empty group open.
- Add “Show only items with connections” and update visible group counts.
- Render “No connections yet” as non-interactive text.
- Keep one visible primary action per result; move map, compare, and copy-link actions into a keyboard-accessible disclosure.
- Remove missing-source boilerplate when no source record exists.
- Run focused Explore E2E and accessibility tests.

## Task 6: Align footer, docs, and release evidence

- Use the approved persistent footer sentence exactly once in the shell.
- Update the Epic 10 plan, delivery index, context, and alignment backlog with the v2.2 correction status.
- Run `npm run precommit`.
- Review `git status` and the touched-file diff summary.
- Commit and push the task branch, merge it to `main`, rerun the merge verification gate, and push `main`.
