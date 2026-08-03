# Resources ecosystem acceptance matrix

Date: 2026-08-03
Status: implementation evidence in progress until merged and live-verified

| Requirement | Current evidence | Final gate |
|---|---|---|
| Eight collection-first starting points | Eight dataset collections; landing renders collection cards before any result wall | Browser screenshot and E2E |
| Resource/Library boundary | Publication candidates are routed to Library or rejected; portal/tool/service records stay distinct | Dataset and disposition tests |
| No paywalled product cards | I-Assure limited to its no-cost templates; Tenable product entries and paid Platform One services rejected | `commons-quality.test.mjs` |
| Current official destinations | `cyber.mil`, `dowcio.war.gov`, CISA Learning, exact Platform One/Common Criteria/NIAP/CMVP routes | Source evidence plus link report |
| Honest access labels | Public, free account, CAC, restricted/variable, and no-cost government workflows represented explicitly | Schema and detail-page tests |
| Ecosystem relationships | Parent and child IDs validate bidirectionally enough for navigation; no Atlas parentage implied | Index builder and detail E2E |
| Identity system | Central registry, meaningful type fallbacks, no remote image dependency | Brand manifest and presentation tests |
| Search aliases and filters | Aliases, collection/type/owner/access/cost/audience/work-stage filters, result count, and sorting | Directory/search unit tests and E2E |
| Community safety | Exact CUI/credential/system-detail warning appears once on community details | Browser assertion |
| Health and maintenance | Bounded real checks, redirect capture, expected restricted boundaries, no fake fast mode | Health report and contract test |
| Responsive and accessible | Keyboard targets, labels, empty/error states, 320px and desktop rendering | E2E, axe, screenshot inspection |
| Release | Latest `main` reconciled, precommit and CI green, merged, Pages live smoke complete | GitHub and live browser evidence |

This matrix must not be changed to “complete” based only on local tests. The release row closes only after the deployed Pages route is inspected.
