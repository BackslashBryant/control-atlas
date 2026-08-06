# Live Browser Audit - 2026-06-09

Target: `https://backslashbryant.github.io/GovFrame/`

Latest audited commit: `14c5047`

## Passed

- Empty landing renders one `h1`, no result articles, and no console errors.
- Exact CCI search opens official CCI canonical evidence and a direct CCI-to-NIST mapping.
- Pivoting from CCI to NIST resets scroll, focuses the item heading, and shows the CCI assertion as incoming.
- Calculated paths remain labeled and preserve intermediate items.
- Optional graph renders a text-equivalent path list.
- NIST-to-CCI matrix discovers incoming direct assertions while preserving direction.
- Matrix display caps at 200 rows and states that CSV contains the complete matrix.
- Sources presents source names and tier/issuer context instead of raw URLs as primary text.
- Retired identifier queries show a clear scope explanation.
- Landing and matrix views have no horizontal overflow at 320 px.
- Live console produced no errors or warnings during tested journeys.
- The landing page teaches a new assessor how to start from an assigned ID or topic, review direct mappings, and treat calculated paths as research leads.
- Plain-language search can be narrowed by framework; `account management` narrowed from 34 mixed-framework results to two NIST SP 800-171 results.
- AC-2 defines direct mapping, incoming, outgoing, calculated path, and evidence gap before the user interprets results.
- Large direct-mapping sets are progressively disclosed; AC-2 displays eight mappings before offering all 39.
- The matrix explains source, target, direct, calculated, and unmapped classifications while retaining selected-ID and CSV workflows.
- Sources defines gold, silver, bronze, and evidence gaps in plain language.
- Exact CCI, AI RMF, and SSDF query links resolve to the intended canonical items.
- Browse visibly distinguishes active catalogs from `limited-public-scope` catalogs.
- Asset URLs are versioned so a successful Pages deployment does not leave users on stale CSS or JavaScript.
- The 320 px mobile view and a 640 px effective viewport used to model 200% reflow had no horizontal overflow.
- Focusable controls expose usable names and the item explorer moves programmatic focus to the opened item heading.

## Open

- CSV content is covered by runtime tests, but download completion could not be validated because the in-app browser does not support downloads.
- Native keyboard-only, screen-reader, and browser-controlled 200% zoom audits remain open because the in-app Browser surface could not execute those assistive-technology interactions directly.
- FedRAMP, CMMC, and DoD RAI remain intentionally `limited-public-scope` and must not be described as complete control catalogs.
