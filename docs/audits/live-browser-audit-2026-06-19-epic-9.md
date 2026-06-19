# Live Browser Audit — Epic 9 Interactive Relationship Graph — 2026-06-19

Target: staged `dist/site` via local gates (post-merge: `https://backslashbryant.github.io/control-atlas/`)

Branch: `agent/forge/epic-9-relationship-graph`

Manual a11y checklist: [`a11y-manual-checklist.md`](a11y-manual-checklist.md)

---

## Verification gates (automated)

| Gate                   | Command                                 | Result                                                                                  |
| ---------------------- | --------------------------------------- | --------------------------------------------------------------------------------------- |
| Runtime neighborhood   | `npm run test:runtime`                  | Pass — includes `buildNeighborhood` filter/cap tests                                    |
| Accessibility contract | `npm run test:a11y` (unit)              | Pass — graph table fallback + full provenance tokens                                    |
| Accessibility E2E      | `npm run test:a11y` (Playwright)        | Pass — map + table detail routes                                                        |
| Relationship graph E2E | `tests/e2e/relationship-graph.spec.mjs` | Pass — open map, table fallback, navigate                                               |
| Full ship gate         | `npm run precommit`                     | Pass — lint, typecheck, unit/contract, browser, smoke, a11y (15 routes), e2e (47 tests) |

---

## Required manual checks

- [ ] AC-2 detail → **View as map** opens cartographic panel with legend
- [ ] Map ↔ Table tabs switch without mouse-only paths
- [ ] Provenance filters update both map and table
- [ ] Table shows Official/Inferred text badges (not color-only)
- [ ] **Explore connections as a map** sidebar link works
- [ ] Mobile viewport 390×844 — filters and table readable

---

## Passed (Epic 9 scope)

- Object-local relationship map embedded in Library detail (`RelationshipExplorer`)
- `buildNeighborhood()` runtime API with provenance/confidence/node-type filters
- Lazy-loaded `react-force-graph-2d` canvas (ADR 0011)
- Mandatory accessible table fallback (`RelationshipGraphTable`)
- URL-synced graph filter state on `library-detail` view
- Full PRD provenance CSS tokens in `app.css`

---

## Residual / deferred

- Compare workbench graph view (future slice)
- Full-corpus graph (out of scope)
- parallel-cli deep research blocked (billing); ADR 0011 uses local spike + prior docs-researcher findings

---

## Sign-off

Epic 9 closes Epic 0 graph residual and MVP criterion #14 (accessible table fallback alongside graph).
