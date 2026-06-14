# Repository Reuse Inventory

Inventory date: 2026-06-14

## Keep As-Is

| Asset | Reason |
| --- | --- |
| `data/source-registry.json` | Public-source trust registry at adopted schema `4.0` |
| `data/generated/` contracts | Static source, node, edge, evidence, and graph-health foundation |
| Build-time adapters and validators under `scripts/` | Reusable public-data import, normalization, relationship, and validation pipeline |
| `app/runtime.mjs` | Browser-only query and CSV export APIs with no backend |
| Graph/source/runtime contract tests | Enforce provenance, public access, and stable contracts |
| `.github/workflows/ci.yml`, `nightly-refresh.yml`, `pages.yml` | Working verification, public-data refresh, and Pages deployment |

## Reuse With Rename Or Refactor

| Asset | Recommended change |
| --- | --- |
| `index.html` and `app/app.mjs` | Use Control Atlas public branding while preserving routes and APIs |
| Search, browse, compare, sources, detail views | Evolve into Library and Crosswalk experiences without breaking runtime contracts |
| Evidence panels | Reframe consistently as public relationship support/reference context |
| Existing content modules | Reuse for Pattern Library and practitioner guidance |
| README and active docs | Replace old Federal Integration Directory release framing |

## Reuse Later

| Asset | Future use |
| --- | --- |
| Browser CSV export pattern | Template Factory and broader public-reference exports |
| `lib/d3.min.js` | Accessible Relationship Graph after table fallback is defined |
| Graph-health and manifests | Source governance and release hardening |
| Historical Issue 8-12 plans and audits | Delivery evidence and implementation history |

## Deprecate

| Asset | Disposition |
| --- | --- |
| Former Release 1-6 Federal Integration Directory roadmap | Historical only; replaced by nine Control Atlas epics |
| Old public-facing GovFrame/Federal Integration Directory copy | Replace with Control Atlas copy |
| Stale Issue 10/11 active-status documents | Historical implementation records |
| PRD technology recommendations conflicting with working repository | Superseded by architecture and ADR decisions |

## Remove

No reusable tracked production code or data is removed in this alignment pass. Removal candidates require a separate review with evidence that they are unused and out of scope.
