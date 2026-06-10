# Issue 8 - Comprehensive Refactor & Single Consolidated Canvas (Junior Assessor UX)

| Field | Value |
|---|---|
| Status | IN PROGRESS |
| Branch | `agent/muse/issue-8-junior-assessor-ux` |
| Owner | Forge -> Muse -> Pixel |

## Outcome

Replace the generic vulnerability concepts with a framework-neutral mapper refactor, and expand it into a "Single Consolidated Canvas" that simplifies vocabulary, guides junior assessors via onboarding mode and glossary widgets, displays readable evidence summaries, and provides D3 visualizations alongside selective matrix comparisons.

## Acceptance

- Retired vulnerability-oriented product concepts are removed. (Completed)
- Empty landing state does not render the complete catalog. (Completed)
- Search, item exploration, matrix, browse, and sources workflows function. (Completed)
- Gold-supported direct mappings and bounded calculated paths remain distinct. (Completed)
- Coverage and source gaps are visible. (Completed)
- Full local gates and strict live browser audit pass before completion.
- Novice Mode onboarding toggle choice added (`I'm new to mapping` vs `I know what I need`), delivering concise helper copy throughout all views.
- Guided step-by-step walkthrough interactive tour runs from the help menu.
- Keyboard-accessible Glossary panel with core definitions (e.g. mapping, official match, possible connection).
- Renamed concepts across the app: Direct mapping -> Official match; Calculated path -> Possible connection; Evidence gap -> Needs supporting source; Unmapped -> No known match.
- Copy Reuse System in `app/content/` to eliminate hardcoded duplicate explanations.
- Shortened homepage, search, detail, browse, and matrix intro copy.
- Clickable search example chips and clear no-results states.
- Search filters (Framework, Match type, Source type) with immediate counts.
- Plain-language Evidence Summary panel preceding raw JSON details.
- Framework availability labels updated on cards and Browse sorting/filtering added.
- Matrix statuses updated with next-action guidance; selective control comparison built.
- Optional relationship visualizations (Node-link, Sunburst, Adjacency matrix) using SVG/D3.
- Readable CSV exports and GitHub prefilled contribution links.
