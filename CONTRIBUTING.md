# Contributing to Control Atlas

Control Atlas is a static, public-data-only reference and template workbench. Contributions must preserve that boundary.

## Before Starting

1. Read `docs/PRD.md`, `docs/architecture/ARCHITECTURE.md`, and the relevant ADRs.
2. Work on a branch, not `main`.
3. Prefer existing runtime, data, and test patterns.
4. Use public, lawfully usable sources and document provenance.

## Prohibited Contributions

Do not add backend services, authentication, user uploads, evidence or scan ingestion, operational-system integrations, user/org/system data storage, compliance scoring, real asset/package tracking, authorization decisions, or stored generated templates.

## Verification

Run the strongest relevant checks and finish with:

```text
npm run precommit
```

Runtime/public-shell changes also require a fresh live GitHub Pages audit. Keep changes minimal, document data-contract changes, and do not perform broad GovFrame path/import renames without an approved migration plan.
