# Control Atlas Architecture

## Product Identity

- Public product name: **Control Atlas**
- Campaign line: **Ctrl+Alt+Comply**
- Tagline: **The public map for federal cyber compliance.**
- Supporting line: Open-source reference workbench for mapping controls, tracing frameworks, and generating blank RMF/ATO templates - no login, no evidence upload, no organizational data required.

## Adopted Architecture

Control Atlas adopts a `src/`-based React + Vite static application and staged static deployment as its public-data-only baseline. The repository does not need a backend, database, or authentication layer to continue product delivery.

```text
Public Sources
  -> Build-Time Importers
  -> Raw Source Cache or Lawful Committed Artifacts
  -> Normalization Pipeline
  -> Schema Validation
  -> Relationship Builder
  -> Static Data Bundles
  -> Static Web App
  -> Client-Side Search / Template Generation / Export
```

## Runtime Boundary

- GitHub Pages serves static HTML, CSS, JavaScript, and generated public-data bundles.
- Search, browsing, relationship comparison, and exports run in the browser.
- No backend, database, authentication, login, telemetry, or user, organization, or system data exists.
- No user uploads, evidence ingestion, runtime scan parsing, operational-system connections, or server-side template generation are allowed.
- Generated templates must remain local to the browser and must not be transmitted or stored.

## Translation-First Product Standard

Control Atlas is not a data explorer first. It is a public reference workbench that translates complex cybersecurity guidance into clear, traceable user action.

Future work must preserve this order:

1. User intent
2. Plain-language meaning
3. Visible relationships
4. Source trust
5. Recommended next action
6. Raw technical detail only on demand

## Adopted Contracts

The source registry remains `data/source-registry.json` at schema version `4.0`.

Generated runtime graph artifacts remain:

- `data/generated/sources.json`
- `data/generated/nodes.json`
- `data/generated/edges.json`
- `data/generated/evidence.json`
- `data/generated/graph-health.json`

Every displayable relationship separates:

- `relationship_type`: what the relationship means
- `provenance_class`: why the relationship may be trusted
- `confidence`: strength of support
- evidence references: public-source support for the claim

Blocked relationships remain graph-health findings and never become displayable edges.

## Technology Baseline

- `src/` is the source-of-truth application tree and `tools/build-static-site.mjs` stages the deployable site into `dist/site`.
- React + Vite render the translation-first UI while existing runtime/data contracts remain reusable.
- Existing D3 graph engine is reused for Phase 0 artifacts and later roadmap work.
- Cytoscape.js may be evaluated later if graph complexity demands it, but no graph-library migration is part of this pass.
- GitHub Pages remains the deployment target.
- MiniSearch is the target search pattern.
- Zod + JSON Schema is the target validation pattern.
- JSON/JSONL runtime bundles and YAML curated registry files are the target data format pattern.

## Component Boundaries

- `src/ui/`: translation-first page shell, reusable components, and query-state adapters.
- `src/app/`, `src/content/`, and `src/styles/`: reusable runtime/data helpers, shared content, and tokens.
- `scripts/`: fetch and orchestrate public-data refresh/build flows.
- `tools/importers/`, `tools/normalizers/`, `tools/validators/`, and `tools/relationship-builders/`: product pipeline modules for public data ingestion, normalization, validation, and relationship assembly.
- `data/source-registry.json`: canonical source registry file retained under the new public-facing Provenance Registry naming.
- `data/generated/`: validated static runtime bundles and build-governance artifacts.
- `src/app/runtime.mjs`: pure browser query and export APIs over static bundles.
- `dist/site/`: generated deploy surface used by Pages and public sync.
- `tests/`: graph, source, runtime, browser-contract, and product-boundary gates.

## Compatibility

The hosted repository, package metadata, workflow labels, and Pages path now use Control Atlas. Existing runtime APIs and the five generated graph artifacts remain stable while future epics add capabilities.
