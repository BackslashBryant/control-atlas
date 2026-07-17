# STATE

## Goal
Complete `docs/plans/newbie-reframe-execution-plan.md` phase-by-phase. Implementation and owner review are complete across Phases 1-7.

## Now
Phase 7 — Compliance artifact and template nexus — is the current release. It routes ten common tasks through 40 official artifacts, 11 supporting tools, and 12 Control Atlas companions. All companions earned an A professional-utility grade after structured generation, Office-package parsing, print-PDF rendering, and page-by-page visual review.

Official artifacts remain distinct from Control Atlas companions. FedRAMP structured rules `2026.07.14.01`, their official dataset schema, all 11 current artifact schemas, 27 official legacy downloads, the historical GSA OSCAL archive, public eMASS v3.22 schema evidence, STIG Viewer CSV guidance, DCSA baselines, and PPSM policy/training are cataloged with provenance, dates, formats, access, and limitations. Ten legacy artifact families resolve to exact current rule IDs, schemas, paths, and next actions. No companion claims FedRAMP approval or current eMASS import compatibility.

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
- Phase 7 local verification includes 12 regenerated Office outputs, 12 print-QA PDFs / 72 pages, independent XLSX parsing, OOXML structure checks, registry/interoperability contracts, official FedRAMP schema validation, and page-by-page visual review.
- An ignored local Tenable workflow referenced scripts and artifacts that no longer exist; it is not part of the tracked repository automation.
- `refresh:data` now includes framework, OLIR, CCI, STIG observation, approved DISA STIG/SRG, and MITRE fetchers before freshness reconciliation and static-bundle generation.
- Source freshness is evaluated from date-only UTC values so the warning boundary is deterministic across browsers and time zones.
- `groupRelationships` in `src/app/relationship-groups.mjs` is the source of record-detail connection groups.
- `src/ui/graph/sourceViews.ts` defines the three source lenses; `src/ui/graph/sourceSeedManifest.ts` remains the one source inventory.
- `runtime.getGraphHealth()` provides the dynamic Sources-page gap explanation. Current generated data: 45 sources, 11,486 nodes, 16,207 edges, 11 findings.
- Current low-coverage examples: DoD RAI 0/11, ATT&CK ICS 0/97, AI RMF 0/72, SSDF 0/42, SP 800-172 1/116, SP 800-171 Rev. 3 98/131 (75%).

## Done
- Phases 1-4 shipped.
- Phase 5 base work shipped as `caac425`: named CSF 2.0 / SP 800-171 connection groups, inclusive `<= 75` coverage boundary, dynamic known-gap explanation.
- Phase 5 spikes shipped as `129a0e0`: three source views over one manifest, purpose hierarchy relabel/order, shareable `sourceView` route state, purpose-aligned matrix labels, sidebar connection-group jump navigation, unit and E2E contract updates, phase/reference documentation.
- Phase 6 shipped as `74b1ddb`: per-source freshness models and metadata, weekly human-reviewed refresh PR automation, fail-closed scheduled synchronization, newcomer-facing current/stale wording, refreshed public artifacts, and full contract/E2E coverage.
- Phase 7 completed and FedRAMP-hardened: official-first task/artifact/tool catalogs, official 2026 rules ingestion, complete legacy-file access, explicit legacy-to-current transitions, 12 A-grade companions, honest compatibility boundaries, Office/print polish, and full contract coverage.

## Open items
- No remaining Newbie-Reframe execution phases.
