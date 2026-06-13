# Testing Strategy

## Current Gates

The federal graph runtime and generated contracts use these required regression gates:

- `npm run test:data`
- `npm run test:runtime`
- `npm run test:browser`
- `npm run smoke:dom`
- `npm run verify:public`
- `npm run precommit`

## Release 1 Contract Tests

Issue 9 contract tests enforce:

- Separate relationship semantics, federal provenance, confidence, and evidence quality.
- `inferred` is never a source class.
- `excluded` is never a source provenance class.
- Every displayable node has a defining eligible source.
- Every displayable edge has evidence and a valid provenance class.
- Blocked relationships appear only in graph-health.
- Search, browse, source inspection, evidence-first detail, onboarding, and accessible alternatives remain usable.

Issue 10 must add tests for FIPS 199, FIPS 200, RMF steps, 800-53 controls, and 800-53B baseline membership.

Issue 11 must add tests for 800-53A assessment objectives, canonical OSCAL ingest, source manifests, duplicate IDs, orphaned edges, unknown sources, restricted-content leakage, missing evidence, and reproducible graph-health output.

## Manual Release 1 Smoke

1. Search `AC-2` and open its federal context.
2. Confirm the defining federal source is visible.
3. Confirm baseline membership and RMF context are source-backed.
4. Confirm assessment objectives and evidence references are visible after Issue 11.
5. Confirm inferred candidates are visibly distinct from federal-published relationships.
6. Confirm a blocked relationship cannot appear in the user-facing graph.
7. Confirm graph or relationship views have a keyboard-accessible text alternative.
8. Confirm Sources shows provenance, owner, version, retrieval date, lifecycle, access, and eligibility.

## Release Audit

Static marker tests are not sufficient evidence for accessibility or release completion. Every release requires native keyboard-only, screen-reader, responsive, zoom, performance, and live GitHub Pages verification.
