# Context Handoff

## Current Objective

The active product objective is Release 1 of the U.S. Federal Security Control Integration Directory. Issue 9 will replace the framework-neutral generated-data and runtime contracts with the federal graph contract through an atomic vertical migration.

## Current State

- The current static application on `main` remains usable and must stay usable through each Release 1 issue.
- Existing source registry, evidence reconciliation, search, browse, source inspection, evidence-first detail, onboarding, and accessibility work are reusable foundations.
- Existing generated schema `2.1`, source registry schema `3.0`, mapper terminology, and gold/silver/bronze user-facing trust model are superseded implementation contracts.
- Issue 8 is superseded by the federal directory mission; retained capabilities are recorded in its superseded plan.

## Active Build Order

1. Issue 9 / FEDGRAPH-001 - federal graph contract vertical migration.
2. Issue 10 / FEDGRAPH-002A - FIPS, RMF, and baseline context.
3. Issue 11 / FEDGRAPH-002B - assessment and OSCAL backbone.

## Important Product Rules

- Federal provenance determines primary graph eligibility.
- `inferred` is edge provenance/confidence, not a source class.
- `excluded` is eligibility/status, not a source class.
- Relationship semantics, federal provenance, confidence, and evidence quality are separate fields.
- Blocked relationships appear only in graph-health reporting.
- Restricted or authenticated source content is not redistributed or scraped around access controls.
- Later releases own program expansion, implementation/vulnerability context, threat/defense/validation context, graph UX, citations, and exports.

## Hard Constraints

- Static GitHub Pages.
- No login, telemetry, cookies, backend, or user-data storage.
- No dev server without explicit user approval.
- Each implementation issue must pass `npm run precommit` and leave the application deployable.
