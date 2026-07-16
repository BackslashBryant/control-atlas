# STATE

## Goal
Execute `docs/plans/newbie-reframe-execution-plan.md` phase-by-phase. Phases 1-6 are shipped to `main`; Phase 7 is next.

## Now
Phase 6 — Freshness — shipped to `main` in `74b1ddb` after owner approval.

The release classifies all 44 sources as auto-synced, curated, or link-out; schedules the existing build-time refresh weekly through a standing human-reviewed draft PR; adds MITRE to `refresh:data`; fails scheduled refreshes that fall back to committed DISA/MITRE snapshots; and surfaces version plus trustworthy current/stale wording on Sources and record-detail pages.

Protected Public Repo Checks, CodeQL, Secret Scan, GitHub Pages, and Pages Live Smoke passed on `main`. Live verification at `https://backslashbryant.github.io/control-atlas/?view=sources` confirmed the deployed Sources page shows update models, source versions, and `Current as of 2026-07-16` for refreshed sources.

## Constraints
- Keep the rotating Ctrl+Alt+X brand wordmark; do not touch `src/ui/components/BrandLockup.tsx`.
- Never weaken existing tests.
- No push, merge, or deploy without explicit owner approval.
- Stage by path, never `git add -A`; no Co-Authored-By trailer.
- `dist/` is generated; never hand-edit it.
- Do not start a dev/static server without explicit confirmation of command and port.
- Calm design: no new badge or color noise.

## Decisions
- Source freshness is additive to registry schema 4.0: `sync_model`, `last_checked`, `last_imported`, `hash`, and a 45-day stale threshold coexist with legacy `retrieved_at` and `checksum` fields.
- A source is stale beginning on day 46 after `last_checked`. Stale UI never says "current" and directs the newcomer to verify the official source.
- Auto-synced sources refresh weekly on Wednesday at 07:17 UTC into the standing `automation/source-refresh` draft PR. No refresh workflow pushes data directly to `main` or auto-merges.
- Curated sources require a monthly human review. Link-out sources may receive automated availability observations but never claim imported content.
- DISA STIG/SRG synchronization remains limited to the approved generic technology-class subset; the full volatile product/vendor library remains link-out.
- Purpose is the underlying source hierarchy: Rules → Frameworks → Controls → Baselines → Implementation → Assessment → Mappings → Threat / Defense → Supporting Sources.
- Novice Questions is the default Atlas source interface. RMF Lifecycle is an alternate guided view using Prepare → Categorize → Select → Implement → Assess → Authorize → Monitor.
- Source records keep one canonical purpose plus explicit novice-question and RMF memberships. Managerial / Operational / Technical are not document categories; they remain available for control-level tagging.
- Connection lists stay in the main column. The sidebar contains only compact group names and counts; selecting one opens, scrolls to, and focuses the corresponding accordion.
- Sparse catalogs remain visible with the existing Preview badge rather than being suppressed from search. Real crosswalk sourcing stays separate backlog work.

## Facts
- Local verification is green: a live `npm run refresh:data` completed without fallback, the focused freshness/workflow tests passed, and `npm run precommit` passed with 111 Playwright tests plus one existing skip.
- An ignored local Tenable workflow referenced scripts and artifacts that no longer exist; it is not part of the tracked repository automation.
- `refresh:data` now includes framework, OLIR, CCI, STIG observation, approved DISA STIG/SRG, and MITRE fetchers before freshness reconciliation and static-bundle generation.
- Source freshness is evaluated from date-only UTC values so the warning boundary is deterministic across browsers and time zones.
- `groupRelationships` in `src/app/relationship-groups.mjs` is the source of record-detail connection groups.
- `src/ui/graph/sourceViews.ts` defines the three source lenses; `src/ui/graph/sourceSeedManifest.ts` remains the one source inventory.
- `runtime.getGraphHealth()` provides the dynamic Sources-page gap explanation. Current generated data: 44 sources, 11,486 nodes, 16,117 edges, 11 findings.
- Current low-coverage examples: DoD RAI 0/11, ATT&CK ICS 0/97, AI RMF 0/72, SSDF 0/42, SP 800-172 1/116, SP 800-171 Rev. 3 98/131 (75%).

## Done
- Phases 1-4 shipped.
- Phase 5 base work shipped as `caac425`: named CSF 2.0 / SP 800-171 connection groups, inclusive `<= 75` coverage boundary, dynamic known-gap explanation.
- Phase 5 spikes shipped as `129a0e0`: three source views over one manifest, purpose hierarchy relabel/order, shareable `sourceView` route state, purpose-aligned matrix labels, sidebar connection-group jump navigation, unit and E2E contract updates, phase/reference documentation.
- Phase 6 shipped as `74b1ddb`: per-source freshness models and metadata, weekly human-reviewed refresh PR automation, fail-closed scheduled synchronization, newcomer-facing current/stale wording, refreshed public artifacts, and full contract/E2E coverage.

## Open items
- Begin Phase 7 templates professionalism work from its execution-plan kickoff.
