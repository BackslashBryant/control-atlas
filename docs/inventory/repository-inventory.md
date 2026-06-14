# Repository Reuse Inventory

Inventory date: 2026-06-14

## Keep As-Is

| Asset | Reason |
| --- | --- |
| `data/source-registry.json` | Adopted schema `4.0` file stays in place for compatibility during the Phase 0 rename-to-Provenance transition |
| `data/generated/` contracts | Static `sources`, `nodes`, `edges`, `evidence`, and `graph-health` bundles are the current runtime backbone |
| Build-time adapters and validators under `scripts/` | Reusable public-data import, normalization, relationship, and validation pipeline |
| `app/runtime.mjs` | Browser-only query and export APIs with no backend or user-data storage |
| Graph/source/runtime/browser contract tests | Enforce provenance, public-data-only access, and stable contracts |
| `.github/workflows/ci.yml`, `nightly-refresh.yml`, `pages.yml`, `codeql.yml`, `secret-scan.yml` | Existing CI, refresh, deployment, and security baseline workflows should be extended rather than replaced |

## Reuse With Rename Or Refactor

| Asset | Recommended change |
| --- | --- |
| `index.html` and `app/app.mjs` | Use Control Atlas, Ctrl+Alt+Comply, and Provenance copy while preserving routes, query state, and bundle loads |
| Search, browse, compare, sources, and detail views | Evolve into Library, Crosswalks, and Provenance experiences without breaking runtime contracts |
| Existing D3 relationship surface | Reuse for Phase 0 while adding provenance-facing labels and deferring graph-library migration |
| Evidence panels | Reframe consistently as public relationship support/reference context |
| Existing content modules | Reuse for Pattern Library, Start Here, and glossary guidance |
| README and active docs | Replace old GovFrame-era or Federal Integration Directory framing with Control Atlas v2.1 direction |

## Reuse Later

| Asset | Future use |
| --- | --- |
| Browser CSV export pattern | Template Factory and broader public-reference exports |
| `lib/d3.min.js` | Relationship graph iteration after table fallback and provenance filter work are defined |
| Graph-health and manifests | Provenance governance, diff review, and release hardening |
| Historical Issue 8-12 plans and audits | Delivery evidence and implementation history |
| Current app content/help modules | Pattern Library and Start Here copy scaffolding once public IA expands |

## Deprecate

| Asset | Disposition |
| --- | --- |
| Former Release 1-6 Federal Integration Directory roadmap | Historical only; replaced by Epic 0 through Epic 8 in the Control Atlas roadmap |
| Old public-facing GovFrame/Federal Integration Directory copy | Replace with Control Atlas public brand and provenance language |
| Historical docs that read like active backlog items | Retain as delivery evidence, but mark as historical only |
| Stale “Sources” product framing | Reframe publicly as Provenance while retaining `data/source-registry.json` internally for now |
| PRD technology recommendations that conflict with the working repo | Superseded by adopted architecture and ADR decisions |

## Remove

No reusable tracked production code or data is removed in this alignment pass. Removal candidates require a separate review with evidence that they are unused, out of scope, and safe to detach from tests, workflows, and deployment.
