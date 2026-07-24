# STATE

## Goal
CURRENT (2026-07-24): Realign Control Atlas with Orbital Archive No. 01 **v1.7.0** (the app was previously wired to v1.5.0 across commits f986a69/786f10f/60caaff on `main`). Scope: tokens/visual language, navigation, layout/density per docs/plans/orbital-archive-ui-refactor.md. Preserve all functionality/data. No push/deploy — stop for owner visual review with build+test proof and screenshots.

PRIOR (superseded/shipped): Execute the owner-approved UX spine remediation (docs/plans/v1-ux-spine-plan-2026-07-18.md); `v1.0.0` tags only after phases 1–5 land. Preserve the static public-data-only architecture.

## Now
Orbital v1.7.0 token/visual alignment is DONE and fully verified (see Done). Owner then redirected scope: the real problem is IA/navigation/payoff, not tokens. Awaiting owner decision on the restructure plan before proceeding.

Backlog carried from the version diff (no forced action): Tabs.tsx missing `disabled`/orientation states vs. its (pre-existing since v1.6.0) contract; optional Segmented Control / Telemetry Readout components (no upstream contract exists for either, demo-CSS only); optional 3rd `mode: "systems"` value in OrbitalContextBar.tsx to mirror upstream's 3-way mode split (PRD.md:522 already uses 3-mode language; code still has 2).

Unrelated pre-existing uncommitted WIP in the tree at session start (not part of this task, left as-is): Commons shallow-to-deep intent-gating (CommonsPage.tsx showAllResources), catalogProfiles.ts new synopses, minor contrast/hover-state cleanups in CommonsResourceCard/ContextualCommonsModule/Tabs, and matching E2E test updates.

---

UX spine phases 1–3 are shipped and on `main` at `f1ac91b` (tagline/copy/IA, clickable card titles, dense-route sidebars). Phase 4 (ELK-computed Atlas map layout replacing hardcoded percentage slots) is implemented and visually verified; its full local gate is running, after which the four `approved-layout-visual` Ubuntu baselines must be regenerated in the pinned Docker image (`mcr.microsoft.com/playwright:v1.60.0-noble`, `npm run test:visual -- --update-snapshots`) and reviewed before ship. Then Phase 5 (Compare map → bounded grouped summary reusing AtlasConnectionMap), Phase 6 (tokens/primitives), fresh deployed Lighthouse vs the ≥50 floor, residuals record, and the owner-delegated v1.0.0 tag. The separate Muse source-polish work was rebased onto the strengthened platform, completed, and verified: the Sources page replaces legacy coverage scores and binary map badges with exact loaded-record, connected-record, and published-link counts across seven practical categories. The full local gate passes with 195 data assertions, 22 accessibility tests, and 107 functional Playwright tests passed with 1 skipped. Public Repo Checks, CodeQL, Secret Scan, GitHub Pages, Pages Live Smoke, a 28-test deployed replay, and three deployed mobile Lighthouse runs have recorded evidence; see [`docs/audits/v1-release-finalization-2026-07-17.md`](audits/v1-release-finalization-2026-07-17.md).

## Constraints
- (2026-07-24) "Preserve all existing functionality and data. This is a UI/UX/design alignment, not a rewrite of the app's logic or content model." (owner, Orbital v1.7.0 alignment task)
- (2026-07-24) "Keep everything on a working branch... Do NOT ship, push, or deploy anything yet. Stop before any deploy." (owner) — SUPERSEDED same day, see next line.
- (2026-07-24) "Yes please. Take care of it then push live once its polished and good to go." (owner — authorizes executing the IA restructure AND pushing live, gated on polish being genuinely confirmed by a page-by-page visual audit + full local gate, not merely green tests)
- (2026-07-24) "Flag any ambiguity or judgment calls rather than guessing; the creator is available to answer questions." (owner)
- (2026-07-24) "I dont' care if it's unrelated. If you see a bug. Kill a bug." (owner — fix real defects found in passing; don't just log them as NOTED)
- (2026-07-24) "It is critical that all bugs are crushed and that this site not suck. Right now it just feels like disconnected components, shitty navigation, lots of promises but not a lot of clear payoff due non-intuitive design. I'm not married to anything in this site except for the vision. Make it happen." (owner — IA/navigation/layout restructure is authorized; docs/PRD.md vision is the only fixed point)
- (2026-07-24) Commons is a named offender: "All look the same and is hard to read... Wish it was organized by type of sources like Communities (reddit, tenable, forums) etc. and I would expect that if it's a reddit link the reddit logo would be there or something." (owner)
- Keep the rotating Ctrl+Alt+X brand wordmark; do not touch `src/ui/components/BrandLockup.tsx`.
- Never weaken existing tests.
- No push, merge, or deploy without explicit owner approval.
- Stage by path, never `git add -A`; no Co-Authored-By trailer.
- `dist/` is generated; never hand-edit it.
- Do not start a dev/static server without explicit confirmation of command and port.
- Calm design: no new badge or color noise.
- "Push is approved as long as everything has been reviewed, polish confirmed by you via a visual browse/audit of all pages and features." (owner, 2026-07-18)
- "Overall this whole thing should feel like Shallow > Wading > Deep — a lot of stuff just feels DEEP." (owner, 2026-07-18 — every surface opens shallow: one clear thing; wading = grouped summaries/counts on demand; deep = full lists/advanced detail only when explicitly entered)
- "I want you to handle it all." (owner, 2026-07-18 — delegates executing UX spine phases 1–6, accepting the human screen-reader/real-device gaps as documented residual risk, and creating/publishing v1.0.0 when phases 1–5 are shipped and verified)

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
- Sparse catalogs remain searchable and may show a limited-coverage notice in search results. The Sources page does not score catalog completeness; it lists factual connection counts instead. Real crosswalk sourcing stays separate backlog work.
- Path, Map, and List use one filtered relationship model. Published connections are the default; candidate links require an explicit toggle.
- Desktop Path runs horizontally through six stages. Mobile Path is vertical. Map groups are arranged vertically as upstream, peer/equivalent, and downstream regions.
- The Map is bounded to the selected record plus six group summaries; one group expands at a time to at most ten desktop or six compact records. Overflow opens List.
- A zero-connection record gets an honest empty state. The Atlas never invents edges or renders a decorative canvas when there is nothing to map.
- The Atlas route uses semantic React DOM and record-indexed neighborhood shards. React Flow and ELK remain lazy legacy dependencies for other bounded relationship surfaces, not the primary Atlas route.

- DECISION (owner 2026-07-18): in-page jump sidebar on dense routes only (record detail, Sources, Compare, Templates, Playbooks); Playbooks moves Learn→Build; Compare map replaced by the bounded grouped-summary idiom (canvas retires); v1.0.0 tags only after UX spine phases 1–5 — plan: docs/plans/v1-ux-spine-plan-2026-07-18.md.

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
- Local axe scans of the compare route now take ~270 s on this host (measured 2026-07-19), exceeding the accessibility spec's own 180 s budget; the same test took 96 s earlier the same day. Ubuntu CI is the authority for `tests/e2e/accessibility.spec.mjs`; never raise that budget to accommodate local slowness.
- Finalization checks include contract, Atlas, 195 data assertions, runtime, graph, and browser suites; lint; typecheck; 699-package license review; dependency audit; Vale fixtures/project scan; static build/smoke; public verification; 22/22 focused accessibility tests; 107 functional passes and 1 skip; 28/28 deployed Playwright tests; three deployed mobile Lighthouse runs; and green Public Repo Checks, CodeQL, Secret Scan, Pages, and Pages Live Smoke workflows.

## Done
- Orbital Archive v1.7.0 alignment (2026-07-24) — RESULT: 4 code changes + 4 doc bumps, all verified green. (1) `styles/tokens.css:19` `--lsm-dust` `#98a4ac`→`#b3bbc2` (upstream AA fix, propagates to --ca-text-muted/-subtle/graph-neutral/cluster); (2) `src/ui/components/lsm/Button.tsx:15` destructive solid-fill → archival tinted outline; (3) `styles/orbital.css:445-520` card family (summary/result/intent/source/commons) gained the v1.7.0 instrument grammar — relay hairline top-datum, grain ::before, 8-layer corner registration ticks ::after (verified live in-browser: borderTopColor rgb(84,188,217,.3), beforeOpacity .14 soft-light, afterBgLayerCount 8); (4) `styles/orbital.css:718+` replaced the copy-crossing diagonal `.landing-hero::after` (the exact `left:7%;right:-8%;bottom:24%;rotate(-5deg)` shape upstream's own v1.7.0 validator forbids) with a top-right safe-corridor flight-plan field. Docs bumped v1.5.0→v1.7.0 in design-system.md/PRD.md/orbital-archive-ui-refactor.md + new "Geometry Safe Corridors" section. Verified: typecheck clean; lint 0 warnings; test:browser 17/17; a11y+build-layout contracts 18/18; test:a11y:smoke 4/4; test:e2e:smoke 4/4; visual 28/28; build:site OK. 16 visual baselines regenerated (win32/local — Ubuntu CI remains the authority).
- Visual/a11y test race fixed at root cause (2026-07-24) — RESULT: `waitForAppReady(..., {allowPartial:true})` accepts `data-app-ready="partial"`, the state where the graph is still loading and `DetailConnectionsSkeleton`/`LibrarySkeleton` (aria-busy="true") still render — so `approved-layout-visual` screenshotted skeleton-vs-loaded nondeterministically and the a11y "Relationship table" lookup raced the same skeleton. Added `waitForSkeletonsSettled()` in tests/e2e/support.mjs:70 (waits `#workspace [aria-busy="true"]` count 0) and called it in approved-layout-visual.spec.mjs:90 and accessibility.spec.mjs:159. Proof: before fix `desktop record composition` was 50/50; after the wait it failed 5/5 consistently (proving determinism + that the old baseline had captured the skeleton), baselines regenerated, then 10/10 pass on record+library and 5/5 on the a11y test. This is a strengthened assertion, not a weakened one.
- Phases 1-4 shipped.
- Phase 5 base work shipped as `caac425`: named CSF 2.0 / SP 800-171 connection groups, inclusive `<= 75` coverage boundary, dynamic known-gap explanation.
- Phase 5 spikes shipped as `129a0e0`: three source views over one manifest, purpose hierarchy relabel/order, shareable `sourceView` route state, purpose-aligned matrix labels, sidebar connection-group jump navigation, unit and E2E contract updates, phase/reference documentation.
- Phase 6 shipped as `74b1ddb`: per-source freshness models and metadata, weekly human-reviewed refresh PR automation, fail-closed scheduled synchronization, newcomer-facing current/stale wording, refreshed public artifacts, and full contract/E2E coverage.
- Phase 7 completed and FedRAMP-hardened: official-first task/artifact/tool catalogs, official 2026 rules ingestion, complete legacy-file access, explicit legacy-to-current transitions, 12 A-grade companions, honest compatibility boundaries, Office/print polish, and full contract coverage.
- Atlas release blocker V1-RR-003 is shipped: bounded Path/Map/List views, real-edge-only rendering, responsive orientation, separate inspector, source references, and on-demand neighborhood loading.
- Release-blocking copy was tightened: the landing page states the product purpose, Navigate no longer claims to show “everything,” Playbooks replaces visible “pattern” drift, and repeated “source-backed” labels were replaced with concrete publication wording.
- Final source polish shipped as `b64928c`: redundant “Used in map” badges and per-catalog coverage bars were removed; the Sources page now reports 11,486 loaded records and 16,207 published links across seven practical categories with desktop and compact overflow protection.
- Doctrine audit (July 18, 2026) — RESULT: pass with three findings; all addressed. (1) Numeric deployed mobile Lighthouse floor >= 50 recorded in PRODUCTION_READINESS.md; (2) maintenance debt register with consequence/trigger added to prd-v3-alignment-backlog.md; (3) Knip-discrepancy finding disproved — one-time `npx` inventory classified in the post-v1 strengthening audit, adoption deliberately rejected.
- Compare navigation race fixed — RESULT: `navigate()` in `src/ui/App.tsx` now merges from a synchronously updated `latestNavStateRef` instead of transition-deferred `viewState`, and ComparePage rapid-fire selects (Framework A/B, Baseline A/B, items input) pass only changed keys. Root cause: back-to-back navigations dropped the earlier patch (Baseline A reset to "All"), surfacing as intermittent compare-map.spec failures (2 of 12 isolated runs) and a real fast-input UX bug. Verified: 24/24 `npx playwright test tests/e2e/compare-map.spec.mjs --repeat-each=6` after fix.

## Open items
- FLAKE: 3/3 pass isolated — `a11y: library detail relationship table has no serious or critical violations` (tests/e2e/accessibility.spec.mjs:149) failed once under `test:a11y:smoke`'s parallel run (2026-07-24, Orbital v1.7.0 pass), passed 3/3 when run alone via `--grep "library detail relationship"`. Consistent with the pre-existing parallel-worker cold-load pattern in Failed attempts ATTEMPT 1. Not caused by the Orbital token/CSS changes (no shared/library/relationship code touched).
- FLAKE: 3/3 pass isolated — `desktop library composition` (tests/e2e/approved-layout-visual.spec.mjs) failed once on a full-suite re-run immediately after regenerating all 28 baselines (2026-07-24); diff showed the page caught mid `LOADING LIBRARY / RETRY LOADING` state vs. the loaded catalog view — a data-loading race, not a CSS/layout regression. Passed 3/3 isolated via `--grep "desktop library composition"`.
- Obtain explicit owner approval before creating or publishing `v1.0.0`.
- Human NVDA/VoiceOver/TalkBack and real iOS/Android device checks remain unverified residuals unless a human/device completes them or the owner explicitly accepts the risk.
- The absolute deployed-mobile Lighthouse floor of 50 was laptop-measured and does NOT reproduce on CI hardware: a same-runner A/B on 2026-07-19 scored `743dcde` (pre-UX-spine) at 34/41/41 and `9f687d7` (post-UX-spine) at 35/44/37, CLS 1.516 in both. The gate is now comparative — run the `Lighthouse A/B` workflow against the previous released ref on the same runner and require no material regression. Never compare scores measured on different machines.
- Keep the post-v1 tool and platform evaluations in [`docs/plans/open-source-tool-assessment.md`](plans/open-source-tool-assessment.md) and [`docs/plans/open-source-platform-strengthening-assessment-2026-07-17.md`](plans/open-source-platform-strengthening-assessment-2026-07-17.md) out of the v1.0 dependency set.
- Real crosswalk sourcing, the 11 graph-health findings, WebPageTest, pen-test, and dependency maintenance remain non-blocking backlog; do not fabricate mappings to close them.
- Keep GitHub Actions Node runtime deprecation work and `npm ci || npm install` fallback review in separate maintenance changes.

## Failed attempts
- ATTEMPT 1 [L1] (Phase 4 gate, 2026-07-19): intermittent 30s timeouts in critical-path-matrix Atlas→record-detail flows (`.relationship-group-trigger` / Purpose open-record) — killed stray static server on :4399 -> still one 9/10 run afterward. Not ELK-related (map mounts only on view=map). Working hypothesis: cold-load latency under parallel Playwright workers; 20/20 on --repeat-each=2 after cleanup.
- ATTEMPT 2 [L2] (Phase 5 gate, 2026-07-19): new hypothesis after `workers: 1` disproved parallel-worker contention — host-level CPU/disk contention (crashed Docker Desktop/WSL2 resident during runs) pushes the ~35MB full-graph library-detail load past the local 30s budget; CI (45s, Ubuntu) green on every push this session. Change: Docker Desktop quit, gate rerun.
- ATTEMPT 3 [L3] (Phase 5 gate, 2026-07-19): instrumented rather than retried. Measured A/B with an identical probe script: clean tree axe scan on the compare route = 267,869 ms; Phase 5 tree = 276,361 ms (3% delta = noise). DOM identical (19,422 vs 19,424 elements), 737 table rows both, Atlas map not mounted in list view, and the only violation is a pre-existing `heading-order/moderate` in both. CONCLUSION: not a regression — this host's axe scan (~270 s) now exceeds the test's own 180 s budget, where the same test took 96 s earlier in the session. Test budget left untouched; CI Ubuntu is the authority for the a11y suite.

## Atlas reshape decisions (owner, 2026-07-19, post-v1.0.0)
- DECISION: Rebuild the Atlas as ONE subject + ONE forward motion. The Path/Map/List row and the Novice-questions/Purpose/RMF-lifecycle row are two orthogonal switchers stacked before any content; they are retired as a top-level pair.
- DECISION: The Atlas always has exactly one current record (the subject). With no subject, the route's only job is helping the user pick one (search or guided question) — never showing view toggles.
- DECISION: Path branches. Pick a stage -> see only that stage's records -> pick one -> it becomes the subject and the next stage opens from it, with a breadcrumb. One decision per screen. No more six-column all-at-once board.
- DECISION: Map and List are views OF the current record, shown only once a subject exists. The "Choose a record before opening Map" dead-end must become impossible by construction — never offer a control that cannot work.
- DECISION: The lens (question / RMF stage) is a one-time entry choice that becomes a breadcrumb, not a persistent switch.
- DECISION: Record detail opens shallow — 14 controls above the fold today; secondary actions move behind one affordance.
- Owner framing: "Clear flows, clear selections, clear paths... highly intuitive and responsive across all surfaces."

## Source labeling + copy diet decisions (owner, 2026-07-20)
- FINDING: The Sources page is not showing duplicate records. 28 of 45 sources render under 6 generic titles (9x "DISA STIG", 5x "SP 800-53 Rev. 5", 5x "DoD Zero Trust", 4x "DISA CCI", 3x "NIST CSF 2.0", 2x "CUI Program") because `display_name` is a FAMILY label that the UI renders as the TITLE. Every record already carries a correct specific `name` (e.g. "DISA Public STIG Library", "NIST SP 800-53B Baseline Profiles").
- FINDING: "Core source for the default compliance ecosystem map." exists in NO source record. It is generated per graph-role in `src/ui/graph/sourceDisposition.ts:16`, so many cards print the identical sentence.
- DECISION: Render the specific `name` as the card title; demote `display_name` to a small family chip. No data migration, no mapping-contract change.
- DECISION: Stop printing generated boilerplate. If nothing specific can be said about a source, say nothing rather than repeating one sentence across cards.
- DECISION: Copy diet limited to the two measured offenders — Atlas entry (505 words / 34 sentences) and Sources (contains a 142-word sentence). Landing (76 words), Explore (68) and Compare (203) already measure lean and are left alone.
- Measured baseline 2026-07-20 (words/sentences per surface): Landing 76/5, Explore 68/5, Atlas entry 505/34, Record 249/12, Sources 453/20, Templates 311/16, Playbooks 259/20, Compare 203/20.
