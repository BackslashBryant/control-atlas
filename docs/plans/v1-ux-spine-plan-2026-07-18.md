# v1.0 UX Spine Plan — 2026-07-18

Owner-driven UX/IA remediation. **Gates `v1.0.0`: the tag waits until phases 1–5 land** (owner decision 2026-07-18). One phase per session; run `npm run precommit` and a designer-grade visual browse before each ship. Static public-data-only architecture and mapping contracts unchanged.

## Context

Owner visual review (2026-07-18) rejected "polish confirmed": tagline too long, "blank templates" copy, info overload with no visual path, "Open record" buttons everywhere, Atlas Map card overlaps, unusable Compare map, padding drift, unclear Playbooks placement. Exploration traced all findings to four root causes: no unified wayfinding layer, four competing "open" idioms, position-by-hardcoded-percentages maps, spacing/copy drift.

## Locked decisions (owner, 2026-07-18)

- In-page sidebar on **dense routes only**: record detail, Sources, Compare, Templates, Playbooks.
- Playbooks moves from Learn to **Build**.
- Compare map is replaced by the **bounded grouped-summary idiom** (Atlas style); the 200-node canvas retires.
- **v1.0.0 tags only after this pass** (phases 1–5).

## Status (2026-07-19)

Phases 1–5 are shipped to `main` and CI-verified — the `v1.0.0` gate is satisfied:
`a7b61f0` (1), `e82bd79` (2), `f1ac91b` (3), `2a89a32` (4 + Ubuntu re-baseline), `2a4601a` (5).
Phase 6 (tokens + primitives) is in flight and is not a tag gate.

## Phases

### 1. Copy + IA (small, contract-bounded)
- Tagline → "The public map for federal cyber compliance." Supporting line shortened/cut in: `src/ui/pages/HomePage.tsx:24-28`, `src/index.html:9-10`, `src/content/copy.mjs:61-68`, `src/ui/lib/recordTitle.ts:73`.
- "blank … documents" → "starter documents" wording in: HomePage.tsx:26, index.html:9, `src/ui/App.tsx:646`, TemplatesPage.tsx:923/1146/1173, `src/app/app.mjs:373/970/1075`, `src/app/help-data.mjs:35`, `src/ui/lib/startHereRecommendations.mjs:45/351`. (`blankRows()` in template-engine.mjs is code, not copy — leave.)
- Playbooks Learn→Build: `src/ui/lib/navigation.ts` NAV_GROUPS only (auto-propagates to TopNav, mobile sheet, SiteFooter).
- Update in lockstep: `tests/browser-contract.test.mjs` (lines ~32-33, 47-54, 197-230), `tests/content-review.test.mjs`, `tests/alignment-contract.test.mjs:47-51`, `tests/prd-alignment.test.mjs`, `tests/e2e/navigation-fidelity.spec.mjs:12-24` — quote old vs new expectations in the PR/commit body.

### 2. One card idiom
- New shared result card in `src/ui/components/pagePrimitives.tsx`: **title is the click target** (link-styled button), secondary actions in one quiet `<details>`-style affordance.
- Retire standalone "Open record"/"Open template"/"Open term details" buttons: `ExplorePage.tsx:494-614/335-359/410-471`, `SourceSummaryCard` (pagePrimitives.tsx:184-243), `StartHereResult.tsx:85/112/138/164`, `RelationshipExplorer.tsx:517-540`, `AtlasMapPage.tsx:845/867`.
- Keep whole-card-button idiom for intent cards (`QuickIntentCard.tsx`) and connection lists (`ExpandableRelationshipGroup.tsx:118`) — already title-clickable.

### 3. Page spine + sidebar
- Adopt shared `PageHeader` in the two outliers: `AtlasMapPage.tsx` (currently no pagePrimitives import), `ComparePage.tsx:44-51` (delete local duplicate).
- Promote `RelationshipGroupRollupNav` (`ExpandableRelationshipGroup.tsx:180-207`) + `jumpToRelationshipGroup` (`ObjectDetailPage.tsx:250-268`) into a general `PageJumpNav` (section label + count, current-section highlight via scroll observation) rendered on the five dense routes. Mobile: sticky chip row (reuse `StickyDetailBar` pattern).
- No routing changes (sidebar is a rendering concern; confirmed in exploration).

### 4. Atlas Map collision-aware layout
- Acquire, don't invent (owner, 2026-07-19): compute placement with **elkjs** (already a repo dependency, lazy-imported so the Atlas route stays canvas-free) — radial/layered layout over measured card sizes gives overlap-free positions by construction. Rendering stays semantic DOM buttons positioned from ELK output.
- `src/ui/components/AtlasConnectionMap.tsx`: replace hardcoded `atlas-spatial-slot-*` percentage classes (`styles/surfaces.css:3118-3141`) with ELK-computed `left/top` inline positions from ref-measured card boxes; derive SVG wire endpoints from the same coordinates (retire hand-tuned `OVERVIEW_POINTS`/`EXPANDED_POINTS`, :37-53).
- Keep bounded-map invariants: `release-readiness-visual.spec.mjs` geometry asserts (map ≤ inspector edge, no page overflow) must stay green as-is.
- Re-baseline the 4 `approved-layout-visual.spec.mjs` snapshots in the pinned Ubuntu image; owner reviews new baselines before accept.

### 5. Compare map → grouped summary
- Replace `RelationshipGraph` canvas path in `CompareResultsPanel.tsx` with the bounded grouped-summary idiom (groups + counts, expand one at a time, List for overflow), reusing the AtlasConnectionMap component from phase 4.
- Retire the first-200 slice (`buildCompareGraph.ts:50/163-194`) with grouped rollups; React Flow/ELK remain lazy legacy deps for any remaining surfaces or get pruned if unused (check before delete, C14 greps).

### 6. Tokens + primitives cleanup
- `styles/tokens.css:124-137`: collapse to one linear spacing scale (fix `--space-5/6/7` skip-step aliases); sweep `ComparePage.tsx:461` inline override.
- Extract shared `EmptyState`/`Notice` components (currently hand-rolled per page); one disclosure primitive owning its `Accordion.Root`; delete dead `PRODUCT_DISCLAIMER` imports (ObjectDetailPage/PlaybooksPage/SourcesPage).

## Verification (every phase)

`npm run precommit` (build, lint, typecheck, data/runtime/browser contracts, 22 a11y + functional Playwright) → designer-grade visual browse (overlap/redundancy/path/padding per screenshot, desktop + 375px) → ship via branch → Public Repo Checks → main → Pages → Live Smoke. Phases 4–5 additionally: Ubuntu visual re-baseline + owner review of new baselines. After phase 5: fresh deployed Lighthouse vs the recorded ≥50 floor.

## Cross-cutting design law: Shallow > Wading > Deep (owner, 2026-07-18)

Every surface opens **Shallow** (one headline, one primary action, minimal orientation), reveals **Wading** on one interaction (grouped summaries, counts, category rollups), and reaches **Deep** (full lists, tables, advanced metadata) only behind an explicit step. Apply to each phase:

- Phase 2 (cards): a card's shallow face = title + one-line gloss; per-card action clusters and metadata move behind the wading affordance.
- Phase 3 (spine/sidebar): the sidebar IS the wading layer — section names + counts; sections default collapsed so the first screenful stays shallow.
- Phase 4 (Atlas Map): overview = shallow (record + 6 group summaries); one expanded group = wading; List = deep. Already matches — preserve during layout rewrite.
- Phase 5 (Compare): summary tiles = shallow; grouped map = wading; full List/export = deep.
- Phase 6 (primitives): the shared disclosure/EmptyState primitives default to collapsed/shallow states.
- Review rule: for every screenshot in a phase's visual audit, ask "what does the first screenful demand of a newcomer?" — a page that opens deep is a defect even if tests pass.
