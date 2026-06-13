# GovFrame Federal Security Control Integration Directory

GovFrame is a static, public directory for understanding how U.S. federal security controls connect to mandates, baselines, programs, assessment procedures, implementation checks, vulnerability operations, threat-informed context, validation paths, and evidence.

Live site: https://backslashbryant.github.io/GovFrame/

## Product Contract

- Federal provenance determines primary graph eligibility.
- Every displayable relationship separates semantics, federal provenance, confidence, and evidence quality.
- Federal-published and inferred relationships are never conflated.
- Restricted or authenticated content is not redistributed or scraped around access controls.
- Search, browse, source inspection, evidence-first detail, and accessible text alternatives remain core journeys.
- Delivery remains static, browser-only, no-auth, no-backend, and no-telemetry.

## Current Delivery

Release 1 establishes the federal graph contract and RMF/control backbone through:

1. Issue 9 - federal graph contract vertical migration.
2. Issue 10 - FIPS, RMF, and baseline context.
3. Issue 11 - assessment and OSCAL backbone.

See `docs/PRD.md`, `docs/roadmap.md`, `docs/FEDERAL_SOURCE_POLICY.md`, and `docs/Plan.md`.

## Commands

```text
npm run build:data
npm test
npm run test:browser
npm run audit:coverage
npm run verify:public
npm run precommit
```

Issue 9 establishes the breaking graph contract under `data/generated/`: `sources.json`, `nodes.json`, `edges.json`, `evidence.json`, and `graph-health.json`.
