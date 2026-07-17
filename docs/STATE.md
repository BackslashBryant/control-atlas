# STATE

## Goal
Ship a release-ready Control Atlas branch with a bounded, readable, responsive Atlas and evidence-backed release review. Do not create or publish the `v1.0.0` release without owner approval.

## Now
The v1.0 release-readiness sprint is active on `agent/pixel/v1-0-release-readiness`. Landing identity and federated search fixes are retained. The Atlas now defaults to Path, offers a bounded Map only when published connections exist, and keeps List as an equal accessible view. Full local precommit is green with 120 Playwright tests passed and 1 skipped. Lighthouse, CI, and live Pages verification remain before ship.

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
- Path, Map, and List use one filtered relationship model. Published connections are the default; candidate links require an explicit toggle.
- Desktop Path runs horizontally through six stages. Mobile Path is vertical. Map groups are arranged vertically as upstream, peer/equivalent, and downstream regions.
- The Map is bounded to the selected record plus six group summaries; one group expands at a time to at most ten desktop or six compact records. Overflow opens List.
- A zero-connection record gets an honest empty state. The Atlas never invents edges or renders a decorative canvas when there is nothing to map.
- The Atlas route uses semantic React DOM and record-indexed neighborhood shards. React Flow and ELK remain lazy legacy dependencies for other bounded relationship surfaces, not the primary Atlas route.

## Facts
- Phase 7 local verification includes 12 regenerated Office outputs, 12 print-QA PDFs / 72 pages, independent XLSX parsing, OOXML structure checks, registry/interoperability contracts, official FedRAMP schema validation, and page-by-page visual review.
- An ignored local Tenable workflow referenced scripts and artifacts that no longer exist; it is not part of the tracked repository automation.
- `refresh:data` now includes framework, OLIR, CCI, STIG observation, approved DISA STIG/SRG, and MITRE fetchers before freshness reconciliation and static-bundle generation.
- Source freshness is evaluated from date-only UTC values so the warning boundary is deterministic across browsers and time zones.
- `groupRelationships` in `src/app/relationship-groups.mjs` is the source of record-detail connection groups.
- `src/ui/graph/sourceViews.ts` defines the three source lenses; `src/ui/graph/sourceSeedManifest.ts` remains the one source inventory.
- `runtime.getGraphHealth()` provides the dynamic Sources-page gap explanation. Current generated data: 45 sources, 11,486 nodes, 16,207 edges, 11 findings.
- Current low-coverage examples: DoD RAI 0/11, ATT&CK ICS 0/97, AI RMF 0/72, SSDF 0/42, SP 800-172 1/116, SP 800-171 Rev. 3 98/131 (75%).
- Generated Atlas data includes an 11,486-record compact index and 128 deterministic incident-edge shards. Opening one record no longer requires `nodes.json`, `edges.json`, or `evidence.json`.
- Current local checks: 192 data tests, 30 runtime tests, 18 graph tests, 6 Atlas tests, browser contracts, lint, typecheck, license review, dependency audit, static build/smoke, public verification, and the 80 MiB data budget all pass.

## Done
- Phases 1-4 shipped.
- Phase 5 base work shipped as `caac425`: named CSF 2.0 / SP 800-171 connection groups, inclusive `<= 75` coverage boundary, dynamic known-gap explanation.
- Phase 5 spikes shipped as `129a0e0`: three source views over one manifest, purpose hierarchy relabel/order, shareable `sourceView` route state, purpose-aligned matrix labels, sidebar connection-group jump navigation, unit and E2E contract updates, phase/reference documentation.
- Phase 6 shipped as `74b1ddb`: per-source freshness models and metadata, weekly human-reviewed refresh PR automation, fail-closed scheduled synchronization, newcomer-facing current/stale wording, refreshed public artifacts, and full contract/E2E coverage.
- Phase 7 completed and FedRAMP-hardened: official-first task/artifact/tool catalogs, official 2026 rules ingestion, complete legacy-file access, explicit legacy-to-current transitions, 12 A-grade companions, honest compatibility boundaries, Office/print polish, and full contract coverage.
- Atlas release blocker V1-RR-003 has a local implementation: bounded Path/Map/List views, real-edge-only rendering, responsive orientation, separate inspector, source references, and on-demand neighborhood loading.
- Release-blocking copy was tightened: the landing page states the product purpose, Navigate no longer claims to show “everything,” Playbooks replaces visible “pattern” drift, and repeated “source-backed” labels were replaced with concrete publication wording.

## Open items
- Run post-deploy desktop/mobile workflows and focused Atlas Lighthouse against GitHub Pages.
- Keep the post-v1 tool evaluation in [`docs/plans/open-source-tool-assessment.md`](plans/open-source-tool-assessment.md) out of the v1.0 dependency set.
- Human screen-reader and real-device checks remain explicitly unverified unless a human/device completes them.
- Real crosswalk sourcing, the 11 graph-health findings, WebPageTest, pen-test, and dependency maintenance remain non-blocking backlog; do not fabricate mappings to close them.
- Do not publish `v1.0.0` without owner approval.
