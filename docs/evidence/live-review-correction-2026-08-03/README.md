# Control Atlas correction-pass evidence

## Implementation

- Product correction implementation commit: `acc4a5c`
- Authority-rooted semantic Atlas implementation commit: `c5e2c5a`
- Branch: `agent/forge/live-review-correction-pass`
- Findings matrix: `docs/plans/live-review-correction-findings-2026-08-03.md`

## Penpot design workspace

- File ID: `3be9e5e1-190f-8090-8008-6dde29eb7086`
- Page: `Control Atlas correction pass`
- Workspace metadata: `Control Atlas - 2026-08-03 Correction Pass`
- Imported project tokens and existing visual language before drawing; no reusable connected component library was exposed by the Penpot session.
- Frames cover Atlas desktop/mobile, Search desktop/mobile, Start Here, shared shell/density, and the circuit-tree direction.
- The initial radial Atlas concept was rejected during owner review. Frame 09 is the doctrine-correct replacement: authority roots, Cybersecurity trunk, nine-area canopy, publication aggregation, and publisher-native structural zoom.
- Atlas annotations include the no-collision contract and semantic-zoom/drill-down contract.

Frame IDs:

- `e3981b0a-a691-8015-8008-6dee04076092`
- `e3981b0a-a691-8015-8008-6dee059708f6`
- `e3981b0a-a691-8015-8008-6dee06f59e74`
- `e3981b0a-a691-8015-8008-6dee07cd46c4`
- `e3981b0a-a691-8015-8008-6dee08ef2eaf`
- `e3981b0a-a691-8015-8008-6dee09d91b93`
- `e3981b0a-a691-8015-8008-6def5a188b45`
- `e3981b0a-a691-8015-8008-6e05ace78bd2` - authority-rooted semantic zoom v3 (accepted implementation direction)
- Collision annotation: `e3981b0a-a691-8015-8008-6deeb766a390`
- Semantic zoom annotation: `e3981b0a-a691-8015-8008-6def04234a07`

## Open-source platform gate

The existing graph stack was retained instead of introducing another renderer:

- React Flow (`MIT`) powers the bounded semantic-zoom tree and the focused relationship graph. Its official accessibility, layout, viewport and fit-view APIs cover keyboard semantics and bounded navigation.
- ELK / elkjs (`EPL-2.0`) remains the maintained automatic-layout engine for many-to-many graphs; existing spacing options provide node separation.
- The new Atlas overview is a deterministic project-specific aggregation projection, not a replacement graph engine. Landscape geometry is validated before render; selected branches split from areas to publications to publisher-native units. URL state preserves semantic level across reload, Back, and Forward. Mobile uses a circuit spine in normal flow. No fabricated publisher hierarchy or decorative particles were added.

Sources:

- https://reactflow.dev/learn/advanced-use/accessibility
- https://reactflow.dev/learn/layouting/layouting
- https://reactflow.dev/examples/layout/elkjs-multiple-handles
- https://reactflow.dev/api-reference/types/react-flow-instance
- https://reactflow.dev/api-reference/types/fit-view-options
- https://github.com/xyflow/xyflow
- https://eclipse.dev/elk/reference/options.html
- https://eclipse.dev/elk/documentation/tooldevelopers/graphdatastructure/spacingdocumentation.html
- https://github.com/kieler/elkjs

## Verification evidence

- Fast Guardian: `guardian-fast-report.json` (28 states, zero findings; generated 2026-08-04T04:58:26Z).
- Rendered Guardian: `guardian-rendered-report.json` (28 states at desktop and mobile, 56/56 rendered checks passed; generated 2026-08-04T05:01:49Z).
- Correction E2E: `tests/e2e/live-review-correction.spec.mjs`.
- Tracked screenshot subset: `screenshots/` in this directory.
- Accepted Atlas evidence: `screenshots/after-atlas-authority-tree-1440.png`, `screenshots/after-atlas-publications-1440.png`, and `screenshots/after-atlas-native-structure-1440.png`.
- Original owner screenshots are retained as `screenshots/before-start-here-cramped.png` and `screenshots/before-hierarchy-spacing.png`.

Final local verification on the production build:

- `npm run precommit` with isolated `PLAYWRIGHT_PORT=4327`: passed. The first unisolated attempt attached to an unrelated pre-existing server on 4317 and exercised stale code; the same 12 workflow checks passed on 4327 before the full rerun.
- Full E2E: 181 scenarios, 179 passed, 2 repository-declared skips, 0 failures.
- Full accessibility: 32/32 passed.
- Visual regression: 28/28 passed after deliberate inspection and acceptance of the two corrected Search baselines.
- Experience Guardian: 28 static states with zero findings; 56/56 rendered desktop/mobile checks passed.
- Lighthouse: 16 routes, five runs each, evaluated by the repository's latest-three-after-warmup median rule. Every route stayed within unchanged budgets of LCP <= 2500 ms, TBT <= 200 ms, and CLS <= 0.1. Exact Search measured 1905/161/0.069; broad Search 1650/160/0.069; Atlas landing 2354/23/0.026.
- Production build completed with the existing classic progressive-shell warning and the existing large `RelationshipGraph` chunk warning; neither budget was weakened.

PR, merge, Pages deployment, and deployed-smoke identifiers are recorded in the release report and pull request after those remote steps complete.
