# STATE

## Goal
Execute `docs/plans/newbie-reframe-execution-plan.md` phase-by-phase. Phases 1-4 are shipped to `main`. Phase 5 is implemented on `reframe/phase-5-trust-labeling` and approved for shipping after final verification.

## Now
Phase 5 — Trust & connection labeling — implementation complete locally. The branch contains the earlier `caac425` commit for named crosswalk groups, inclusive low-coverage labeling, and the Sources known-gaps note. The working tree adds two owner-directed spikes: (1) one canonical Purpose source hierarchy with Novice Questions as the default Atlas interface and RMF Lifecycle as an alternate guided view; (2) a compact connection-group rollup in the record-detail sidebar that opens and jumps to the full main-column accordion.

The complete browser suite is green: 111 passed, 1 deployment-only check skipped. Manual browser review passed for the default Novice Questions view, the Purpose and RMF Lifecycle alternatives, and AC-2's eight-group sidebar rollup and focus-preserving jump behavior. The owner waived screenshot artifacts and approved shipping after the spec review.

## Constraints
- Keep the rotating Ctrl+Alt+X brand wordmark; do not touch `src/ui/components/BrandLockup.tsx`.
- Never weaken existing tests.
- No push, merge, or deploy without explicit owner approval.
- Stage by path, never `git add -A`; no Co-Authored-By trailer.
- `dist/` is generated; never hand-edit it.
- Do not start a dev/static server without explicit confirmation of command and port.
- Calm design: no new badge or color noise.

## Decisions
- Purpose is the underlying source hierarchy: Rules → Frameworks → Controls → Baselines → Implementation → Assessment → Mappings → Threat / Defense → Supporting Sources.
- Novice Questions is the default Atlas source interface. RMF Lifecycle is an alternate guided view using Prepare → Categorize → Select → Implement → Assess → Authorize → Monitor.
- Source records keep one canonical purpose plus explicit novice-question and RMF memberships. Managerial / Operational / Technical are not document categories; they remain available for control-level tagging.
- Connection lists stay in the main column. The sidebar contains only compact group names and counts; selecting one opens, scrolls to, and focuses the corresponding accordion.
- Sparse catalogs remain visible with the existing Preview badge rather than being suppressed from search. Real crosswalk sourcing stays separate backlog work.

## Facts
- `groupRelationships` in `src/app/relationship-groups.mjs` is the source of record-detail connection groups.
- `src/ui/graph/sourceViews.ts` defines the three source lenses; `src/ui/graph/sourceSeedManifest.ts` remains the one source inventory.
- `runtime.getGraphHealth()` provides the dynamic Sources-page gap explanation. Current generated data: 44 sources, 11,486 nodes, 16,117 edges, 11 findings.
- Current low-coverage examples: DoD RAI 0/11, ATT&CK ICS 0/97, AI RMF 0/72, SSDF 0/42, SP 800-172 1/116, SP 800-171 Rev. 3 98/131 (75%).

## Done
- Phases 1-4 shipped.
- Phase 5 base work committed locally as `caac425`: named CSF 2.0 / SP 800-171 connection groups, inclusive `<= 75` coverage boundary, dynamic known-gap explanation.
- Phase 5 spikes implemented locally: three source views over one manifest, purpose hierarchy relabel/order, shareable `sourceView` route state, purpose-aligned matrix labels, sidebar connection-group jump navigation, unit and E2E contract updates, phase/reference documentation.

## Open items
- Run the final `npm run precommit` mirror after the browser-review display corrections.
- Commit, push, merge, wait for Pages, and verify the live build under the owner's explicit ship approval.
