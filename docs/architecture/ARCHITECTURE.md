# Control Atlas Architecture

## Decision

Control Atlas adopts the existing static JavaScript application and federal graph contract as its public-data-only implementation baseline. The repository does not need a framework, TypeScript, backend, database, authentication, or broad rename migration before continuing product delivery.

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
- No backend, database, authentication, login, telemetry, or user/org/system data exists.
- No user uploads, evidence ingestion, runtime scan parsing, operational-system connections, or server-side template generation are allowed.
- Generated templates must remain local to the browser and must not be transmitted or stored.

## Adopted Contracts

The source registry remains `data/source-registry.json` at schema version `4.0`.

Generated graph artifacts remain:

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

## Component Boundaries

- `scripts/` and `scripts/lib/`: fetch, normalize, validate, relate, and build public data.
- `data/source-registry.json`: canonical public-source trust registry.
- `data/generated/`: validated static runtime bundles and build-governance artifacts.
- `app/runtime.mjs`: pure browser query and export APIs over static bundles.
- `app/app.mjs`, `index.html`, and `styles/`: static public interface.
- `tests/`: graph, source, runtime, browser-contract, and product-boundary gates.

## Compatibility

GovFrame remains the repository name, deployment path, package identifier, and selected internal naming until a separate migration is justified. Public-facing copy uses Control Atlas. Existing runtime APIs and graph contracts remain stable while future epics add capabilities.
