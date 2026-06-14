# Contributing to Control Atlas

## Product Identity

- Public product name: **Control Atlas**
- Campaign line: **Ctrl+Alt+Comply**
- Tagline: **The public map for federal cyber compliance.**
- Supporting line: Open-source reference workbench for mapping controls, tracing frameworks, and generating blank RMF/ATO templates - no login, no evidence upload, no organizational data required.

Control Atlas is a static, public-data-only reference workbench. Contributions must preserve that boundary and the active Control Atlas implementation baseline unless an ADR says otherwise.

No backend or user, organization, or system data may be introduced.

## Before Starting

1. Read `docs/PRD.md`, `docs/architecture/ARCHITECTURE.md`, `docs/roadmap.md`, and the relevant ADRs.
2. Work on a branch, not `main`.
3. Prefer existing runtime, data, shell, and test patterns.
4. Use public, lawfully usable sources and document provenance.
5. Treat historical Issue 8-12 plans as implementation evidence, not the active backlog.

## Prohibited Contributions

Do not add backend services, authentication, user uploads, evidence or scan ingestion, operational-system integrations, user, organization, or system data storage, compliance scoring, real asset/package tracking, authorization decisions, or stored generated templates.

## Verification

Run the strongest relevant checks and finish with:

```text
npm run precommit
```

Runtime/public-shell changes also require a fresh live GitHub Pages audit. Keep changes minimal, document data-contract changes, and verify the staged build plus deployed Pages output stay aligned.
