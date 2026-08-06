# Live Browser Audit — v1.0 Release Readiness — 2026-07-16

## Header

- **Target URL:** `https://backslashbryant.github.io/control-atlas/`
- **Audited deployment:** `main` / `origin/main` at `ad0ddde`
- **Working branch:** `agent/pixel/v1-0-release-readiness`
- **Audit order:** The deployed site was exercised before any source edit.
- **Related evidence:** [`fedramp-2026-transition-hardening-2026-07-16.md`](fedramp-2026-transition-hardening-2026-07-16.md), [`a11y-manual-checklist.md`](a11y-manual-checklist.md), [`../plans/atlas-recovery-options.md`](../plans/atlas-recovery-options.md)

## Verification gates

| Gate | Command / method | Result |
| --- | --- | --- |
| Live end-to-end, responsive, and axe suite | `$env:PLAYWRIGHT_BASE_URL='https://backslashbryant.github.io/control-atlas'; npm run test:e2e:live` | **Pass before edits:** 24 passed in 5.7 minutes; zero serious or critical axe findings on covered routes |
| Mobile and tablet viewport contracts | Included in the live suite at 390×844 and 768×1024 | **Pass on covered routes:** no document-level horizontal overflow |
| 200% zoom spot check | In-app browser on landing and live product routes | **Pass:** no document-level horizontal overflow observed |
| Mobile Lighthouse — landing | `lighthouse@12.8.2` against the deployed root | **Concern:** Performance 72, Accessibility 100; FCP 1.60s, LCP 1.83s, TBT 1.68s, CLS 0.00005, TTI 4.14s |
| Mobile Lighthouse — focused Atlas | `lighthouse@12.8.2` against `#/atlas-map?node=nist-800-53%3AAC-2` | **Fail / blocker:** Performance 12, Accessibility 100; FCP 1.64s, LCP 17.24s, TBT 5.42s, CLS 1.45, TTI 20.93s |
| Focused search tests | `node --test tests/explore-resource-search.test.mjs` | **Pass after local fix:** 2 passed |
| Runtime regression | `node --test tests/framework-runtime.test.mjs` | **Pass after local fix:** 22 passed |
| Data, content, accessibility contracts | `npm run test:data` | **Pass after local fix:** 192 passed |
| Type and lint gates | `npm run typecheck`; `npm run lint` | **Pass after local fix** |
| Production build and static smoke | `npm run build:site`; `npm run smoke:static` | **Pass after local fix:** 45 sources, 11,486 nodes, 16,207 edges, 11 findings |
| Full local ship gate | `npm run precommit` | **Pass after final browser fixes:** 120 Playwright tests passed, 1 skipped; all preceding build, lint, type, license, unit/data/runtime/graph, browser-contract, DOM, public-build, and accessibility gates passed |

## Workflows exercised on the deployed site

### Complete novice

1. Opened **Click to start** from the landing page.
2. Selected **Cloud SaaS**, **Moderate**, and **Federal civilian**.
3. Received the FedRAMP authorization path and opened the FedRAMP Moderate baseline.
4. Confirmed that the record exposes its connections and current source support.

Result: the workflow completes, but the landing page does not explain the product before asking for action. The selected baseline's “What this is” copy is also too thin to orient a newcomer.

### Expert

1. Searched `AC-2` from the header and opened the Account Management record.
2. Opened relationship-list mode and reviewed connection rationales.
3. Opened Compare for NIST CSF 2.0 → NIST SP 800-53 and reviewed the 737-row mapping.
4. Opened the Atlas around `AC-2`, searched within the map for `CCI-000225`, and switched to the list fallback.
5. Searched `FedRAMP 2026` and `POA&M`; reviewed Sources and Templates to locate the expected current resources.

Result: direct-ID lookup and expert deep links work. Topic/resource search and the Atlas visualization do not meet release quality.

## Findings

### Release blockers

| ID | Finding | Evidence | Disposition |
| --- | --- | --- | --- |
| V1-RR-001 | The landing page lacks an immediate product explanation. | The first screen shows the name, campaign flourish, search, and action orbits, but no visible answer to “What is Control Atlas?” | Fixed locally with the canonical tagline and a one-sentence task description. Not deployed. |
| V1-RR-002 | Explore promises templates and sources but searches only graph records; default OR matching produces misleading results. | `FedRAMP 2026` ranked DISA SRGs and legacy FedRAMP baselines. `POA&M` ranked the glossary followed by unrelated SRGs while the POA&M companion existed in Templates. | Fixed locally: all-term record matching, POA&M normalization, and dedicated Template/Official resource groups. Not deployed. |
| V1-RR-003 | The deployed focused Atlas is not usable as a map. | The deployed PL-2 and AC-2 views render a tiny graph in a large canvas; the fixed 20rem Leverage panel covers useful canvas; filter chrome dominates; search is below the graph. Mobile Lighthouse scored the focused Atlas **12** with 17.24s LCP, 5.42s TBT, 1.45 CLS, and 20.93s TTI. | **Implemented locally; deployment gate open.** The replacement Path/Map/List experience passes targeted desktop/mobile, axe, keyboard, and boundary checks. Full precommit, focused Atlas Lighthouse, CI, and live Pages verification remain. |

### Product-quality findings to carry with the Atlas redesign

- The product repeats trust labels and provenance boilerplate—especially “Source-backed,” “Federal published,” “Official link,” and row-level source explanations—after the trust state is already established. This makes expert result sets longer without adding clarity.
- Compare repeats essentially the same source/provenance explanation across large result sets. Trust should be explained once at the group or table level, with row-level detail only when the evidence differs.
- The baseline record's opening explanation can be a truncated catalog label instead of a useful description of what the user is looking at and what to do next.
- “See how everything connects” overpromises what the current Atlas can communicate at readable scale.

These findings are real, but broad copy cleanup is intentionally not mixed into this blocker-only sprint. They should be acceptance criteria for the approved Atlas course rather than a page-by-page synonym pass.

## Accessibility, mobile, download, and performance boundaries

- Automated axe and responsive contracts passed on the deployed routes covered by the 24-test live suite.
- The browser-driven 200% zoom spot check found no page-level overflow.
- Keyboard focus movement could not be independently confirmed with the in-app browser's control layer after both page-level and body-level Tab attempts; existing automated keyboard coverage remains the evidence boundary.
- Hands-on NVDA, VoiceOver, or TalkBack verification of the Atlas map/list fallback remains pending human QA (`SPR-A11Y-001`). NVDA is not installed on the audit workstation. Source inspection or an ARIA tree is not a screen-reader sign-off.
- Formal Lighthouse 12.8.2 mobile runs are complete. The ignored raw reports are `artifacts/lighthouse-v1-readiness-mobile-2026-07-16.json` and `artifacts/lighthouse-v1-readiness-atlas-mobile-2026-07-16.json`; the metrics are recorded above so the evidence persists in this audit. The first root run wrote a valid report but returned a Windows temp-profile cleanup `EBUSY`; the Atlas run completed with exit code 0.
- Real iOS/Android device testing and WebPageTest remain unverified (`SPR-UNVERIFIED`). `adb devices -l` returned no connected Android device; no iOS test device is available through this environment. Passing emulated viewport tests and Lighthouse mobile emulation is not real-device evidence.
- A POA&M XLSX generation action reported that the download started, but the in-app browser did not emit a native download event and no downloaded file was found in the inspected download/temp locations. The file's transport is therefore unverified in this environment; template-generation contracts remain separate evidence.
- Fresh observed route completion was about 4.1 seconds for the 737-row Compare view and 4.4 seconds for the focused Atlas. Lighthouse's throttled mobile trace is materially worse on the Atlas, confirming the performance failure is part of V1-RR-003 rather than a subjective visual complaint.

## Assessment

**NO-GO for v1.0 publication.** The deployed release candidate is operational and its automated live checks pass, but the primary Atlas experience fails the product's clarity standard. Search and landing identity have local, focused remediations; the Atlas requires an approved information architecture before implementation. No v1.0 tag, release, merge, push, or deployment is authorized by this audit.

## Post-audit implementation — branch evidence

The owner selected a hybrid of the proposed courses and subsequently authorized implementation, review, and shipping while retaining the separate approval gate for publishing `v1.0.0`.

Implemented on `agent/pixel/v1-0-release-readiness`:

- Path is the default Atlas view with six working stages. It is horizontal on desktop and vertical on compact/mobile.
- Map is a semantic, bounded neighborhood: selected record plus at most six group summaries; one group expands at a time to ten desktop or six compact records; overflow opens List.
- Map renders only real visible edges. A record with no published connections gets an explicit empty state and no decorative canvas. Candidate relationships require an explicit toggle.
- Path, Map, and List derive from the same filtered relationship set. List carries source references and mobile labels.
- The inspector has its own column on wide screens and moves below the view on smaller screens; it never overlays navigation.
- The primary Atlas route no longer imports React Flow/ELK or downloads monolithic `nodes.json`, `edges.json`, and `evidence.json`. The build emits a compact 11,486-record index and 128 deterministic incident-edge shards; a focused record loads one shard.
- The fabricated AC-2 focused rings were removed. Source-path projections are explicitly non-published navigation projections.
- Landing/search fixes remain. User-facing copy no longer promises to show “everything,” visible Playbook copy is consistent, and repeated “source-backed” labels were replaced with concrete publication wording.

Local evidence recorded before browser execution:

| Gate | Result |
| --- | --- |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm run test:browser` | Pass — 15/15 |
| `npm run test:runtime` | Pass — 30/30 |
| `npm run test:graph` | Pass — 18/18 |
| `npm run test:atlas` | Pass — shard integrity 2/2; shared model/bounds/stage routing 4/4 |
| `npm run build:site` | Pass — Atlas page chunk 40.69 kB raw / 10.86 kB gzip |
| `npm run smoke:static` | Pass — 45 sources, 11,486 nodes, 16,207 edges, 11 findings |
| `npm run smoke:dom` | Pass |
| `npm run verify:public` | Pass |
| `npm run check:data-size` | Pass — 201 files, 83,096,957 bytes within 80 MiB budget |
| `npm run license:check` | Pass — 407 package entries validated |
| `npm run audit:deps` | Pass — no exceptions |

Browser evidence completed on the working branch:

- The first complete local Playwright run exposed six regressions and completed with 112 passed, 1 skipped, and 6 failed. Fixes were applied rather than waiving failures.
- The next complete run completed with 117 passed, 1 skipped, and one order-dependent header-search focus failure. The focus race was fixed, and the affected navigation suite then passed 7/7.
- The targeted Atlas filter and critical-path matrix passed 11/11; the previously slow direct STIG chain completed in 4.2 seconds after replacing repeated global edge scans with indexed lookups.
- The release-readiness visual suite passed 2/2 at 1440x1000 and 390x844. It asserts no document overflow, a bounded desktop Map that cannot overlap its inspector, and a mobile inspector below the Map. The first screenshot exposed an overlap and the regenerated evidence passed after the layout fix.
- Automated accessibility coverage passed for landing, Atlas overview, focused Path/Map/List, a zero-connection state, and the relationship table with no serious or critical axe findings on covered routes.

Still required before this audit can change the code/deployment decision to GO:

1. CI, merge, Pages deployment, and post-deploy desktop/mobile workflow replay.
2. Focused Atlas mobile Lighthouse against the same baseline configuration and recorded acceptance threshold.
3. Final commit and live Pages evidence in this audit.

Final local ship-gate evidence: `npm run precommit` completed successfully in 814.5 seconds. The complete Playwright matrix finished with 120 passed and 1 intentionally skipped in 7.0 minutes.

Hands-on NVDA/VoiceOver/TalkBack, real iOS/Android devices, WebPageTest, and a pen-test remain human/external evidence. They are not silently converted to passes by automation or emulation.

The v1.0 publication decision remains **NO-GO pending owner approval**, even if the code and Pages deployment gates pass.

### July 17 static review additions

- The six-group Map overview now reserves a representative group for every available direction (upstream, lateral, downstream) before filling remaining slots.
- Atlas List rows use relationship-specific guidance instead of repeating a generic “review both records” disclaimer. Source identifiers are humanized in the disclosure, and the Atlas omits the redundant “Official link” badge from every published row.
- View, Path-stage, and source-stage tabs now implement roving tab focus plus Arrow, Home, and End keyboard behavior with associated tab panels.
- When no stage is specified, Path opens the first stage that contains a real connection. Explicitly selected empty stages remain visible as known gaps. This prevents sparse STIG records from appearing disconnected when their only connection belongs to Implement.
- Federated search contracts now cover exact IDs, exact titles, and plain topic language (“manage system accounts”).
