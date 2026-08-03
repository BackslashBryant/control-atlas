# Resources ecosystem acceptance matrix

Date: 2026-08-03
Status: complete — merged and live-verified

| Requirement | Current evidence | Final gate |
|---|---|---|
| Eight collection-first starting points | Eight dataset collections; live landing renders all eight collection cards before results | Live browser plus E2E |
| Resource/Library boundary | Publication candidates are routed to Library or rejected; portal/tool/service records stay distinct | Dataset and disposition tests |
| No paywalled product cards | I-Assure limited to its no-cost templates; Tenable product entries and paid Platform One services rejected | `commons-quality.test.mjs` |
| Current official destinations | `cyber.mil`, `dowcio.war.gov`, CISA Learning, exact Platform One/Common Criteria/NIAP/CMVP routes | Source evidence plus link report |
| Honest access labels | Public, free account, CAC, restricted/variable, and no-cost government workflows represented explicitly | Schema and detail-page tests |
| Ecosystem relationships | Parent and child IDs validate bidirectionally enough for navigation; no Atlas parentage implied | Index builder and detail E2E |
| Identity system | Central registry, meaningful type fallbacks, no remote image dependency | Brand manifest and presentation tests |
| Search aliases and filters | Aliases, collection/type/owner/access/cost/audience/work-stage filters, result count, and sorting | Directory/search unit tests and E2E |
| Community safety | Exact CUI/credential/system-detail warning appears once on community details | Browser assertion |
| Health and maintenance | 113 of 114 destinations reachable or expected restricted; the remaining NSA CSfC HTTP 403 is recorded honestly | Health report and contract test |
| Responsive and accessible | Keyboard targets, labels, empty/error states, 320px and desktop rendering | 32/32 axe, 28/28 visual, 153/154 E2E with one intentional skip, and screenshot inspection |
| Release | Merge `bb6a033` on `main`; Public Repo Checks 567, CodeQL 222, Secret Scan 496, Pages 306, and Pages Live Smoke 179 succeeded | GitHub and live browser evidence |

Live verification on 2026-08-03 covered [Home](https://backslashbryant.github.io/control-atlas/), the [Resources directory](https://backslashbryant.github.io/control-atlas/#/resources), split published/resource/community search results, the I-Assure free-template-only record, the DISA DoD-network boundary, and the CIS community disclosure. No browser console errors were present.

This matrix must not be changed to “complete” based only on local tests. The release row closes only after the deployed Pages route is inspected.
