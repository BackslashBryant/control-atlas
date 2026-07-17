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
| Full local ship gate | `npm run precommit` | Pending until the Atlas release blocker has an approved course of action |

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
| V1-RR-003 | The focused Atlas is not usable as a map. | The PL-2 and AC-2 views render a tiny graph in a large canvas; the fixed 20rem Leverage panel covers useful canvas; filter chrome dominates; search is below the graph. Mobile Lighthouse scored the focused Atlas **12** with 17.24s LCP, 5.42s TBT, 1.45 CLS, and 20.93s TTI. The list fallback is usable, but it does not rescue the map's primary promise. | **Open. Release NO-GO.** Product owner selection required among the three proposed redesign courses; no redesign was started without that direction. |

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
- Hands-on NVDA, VoiceOver, or TalkBack verification of the Atlas map/list fallback remains pending human QA (`SPR-A11Y-001`). Source inspection or an ARIA tree is not a screen-reader sign-off.
- Formal Lighthouse 12.8.2 mobile runs are complete. The ignored raw reports are `artifacts/lighthouse-v1-readiness-mobile-2026-07-16.json` and `artifacts/lighthouse-v1-readiness-atlas-mobile-2026-07-16.json`; the metrics are recorded above so the evidence persists in this audit. The first root run wrote a valid report but returned a Windows temp-profile cleanup `EBUSY`; the Atlas run completed with exit code 0.
- Real iOS/Android device testing and WebPageTest remain unverified (`SPR-UNVERIFIED`). Passing emulated viewport tests and Lighthouse mobile emulation is not real-device evidence.
- A POA&M XLSX generation action reported that the download started, but the in-app browser did not emit a native download event and no downloaded file was found in the inspected download/temp locations. The file's transport is therefore unverified in this environment; template-generation contracts remain separate evidence.
- Fresh observed route completion was about 4.1 seconds for the 737-row Compare view and 4.4 seconds for the focused Atlas. Lighthouse's throttled mobile trace is materially worse on the Atlas, confirming the performance failure is part of V1-RR-003 rather than a subjective visual complaint.

## Assessment

**NO-GO for v1.0 publication.** The deployed release candidate is operational and its automated live checks pass, but the primary Atlas experience fails the product's clarity standard. Search and landing identity have local, focused remediations; the Atlas requires an approved information architecture before implementation. No v1.0 tag, release, merge, push, or deployment is authorized by this audit.
