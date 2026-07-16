# STATE

## Goal
Execute `docs/plans/newbie-reframe-execution-plan.md` phase-by-phase. Phases 1-5 are shipped to `main`; Phase 6 is next.

## Now
Phase 5 — Trust & connection labeling — shipped to `main` in `caac425` and `129a0e0`. The release includes named crosswalk groups, inclusive low-coverage labeling, the Sources known-gaps note, one canonical Purpose source hierarchy with Novice Questions as the default Atlas interface and RMF Lifecycle as an alternate guided view, and a compact connection-group rollup in the record-detail sidebar that opens and jumps to the full main-column accordion.

Protected Public Repo Checks and the GitHub Pages production workflow passed on clean GitHub runners. Live review at `https://backslashbryant.github.io/control-atlas/` passed for the default Novice Questions view, the Purpose and RMF Lifecycle alternatives, and AC-2's eight-group sidebar rollup and focus-preserving jump behavior. The owner waived screenshot artifacts.

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
- Phase 5 base work shipped as `caac425`: named CSF 2.0 / SP 800-171 connection groups, inclusive `<= 75` coverage boundary, dynamic known-gap explanation.
- Phase 5 spikes shipped as `129a0e0`: three source views over one manifest, purpose hierarchy relabel/order, shareable `sourceView` route state, purpose-aligned matrix labels, sidebar connection-group jump navigation, unit and E2E contract updates, phase/reference documentation.

## Open items
- Begin Phase 6 freshness work from its execution-plan kickoff after reading ADR-0006, the existing fetch scripts, and the source registry.
