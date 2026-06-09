# Live Browser Audit - 2026-06-09

Target: `https://backslashbryant.github.io/GovFrame/`

Commit: `51febac`

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

## Open

- CSV content is covered by runtime tests, but download completion could not be validated because the in-app browser does not support downloads.
- Complete keyboard-only, screen-reader, and 200% zoom audits remain open.
- Partial and source-gap framework adapters remain visible and must not be described as complete.
