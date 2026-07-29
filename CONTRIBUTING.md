# Contributing to Control Atlas

## Product Identity

- Public product name: **Control Atlas**
- Protected brand item: **the rotating Ctrl+Alt flourish**, using real Control Atlas actions from `src/shared/brand-rotation.ts`
- Product definition: **Control Atlas is a public, no-account workbench for finding, reading, comparing, and tracing federal cybersecurity material back to its source.**
- Decision boundary: **Control Atlas organizes the material. The team doing the work decides applicability and baseline selection, and owns compliance, inheritance, authorization, and ATO conclusions.**

Control Atlas is a static, public-data-only reference workbench. Contributions must preserve that boundary and the active Control Atlas implementation baseline unless an ADR says otherwise.

No backend or user, organization, or system data may be introduced.

## Source-First Product Standard

Build for translation, not complexity.

Future work must preserve this order:

1. Exact publication identity and official source text
2. Publisher-declared hierarchy
3. Labeled, source-traceable relationships
4. Concrete retrieval, comparison, navigation, or document action
5. Product-authored notes and limitations
6. Raw technical detail on demand

No roadmap item may be accepted unless it identifies the user confusion it reduces and the action it enables.

## Before Starting

1. Read `docs/PRD.md`, `docs/architecture/ARCHITECTURE.md`, `docs/roadmap.md`, and the relevant ADRs.
2. Work on a branch, not `main`.
3. Prefer existing runtime, data, shell, and test patterns.
4. Use public, lawfully usable sources and document provenance.
5. Treat historical Issue 8-12 plans as implementation evidence, not the active backlog.
6. Keep default UI language plain and action-oriented; raw schema, registry, and graph terms belong only in advanced details, tests, or exports.

## Prohibited Contributions

Do not add backend services, authentication, user uploads, evidence or scan ingestion, operational-system integrations, user, organization, or system data storage, compliance scoring, real asset/package tracking, applicability or baseline selection, inheritance conclusions, authorization or ATO decisions, or stored generated templates.

## Verification

Run the strongest relevant checks and finish with:

```text
npm run precommit
```

Runtime/public-shell changes also require a fresh live GitHub Pages audit. Keep changes minimal, document data-contract changes, and verify the staged build plus deployed Pages output stay aligned.
