# Issue 9 / FEDGRAPH-001 - Federal Graph Contract Vertical Migration

| Field | Value |
| --- | --- |
| Status | DONE |
| Branch | `agent/forge/issue-9-federal-graph-contract` |
| Lead | Forge |
| Review | Pixel -> Sentinel -> Muse -> Nexus |

## Outcome

Replace the current framework-mapper generated-data, runtime, and user-facing trust contracts with the federal graph contract in one deployable vertical migration. Existing user journeys remain usable after the breaking replacement.

## Scope

- Implement canonical `Source`, `Node`, `Edge`, and `Evidence` contracts.
- Emit `sources.json`, `nodes.json`, `edges.json`, `evidence.json`, and `graph-health.json`.
- Migrate current eligible source, catalog, mapping, evidence, candidate, and health data.
- Replace current runtime APIs and tests with graph-based equivalents.
- Update current UI journeys and terminology enough to preserve search, browse, source inspection, evidence-first detail, onboarding, help, and accessible relationship alternatives.
- Implement federal eligibility and provenance validation from `docs/FEDERAL_SOURCE_POLICY.md`.

## Contract Decisions

- Relationship semantics use `relationship_type`.
- Federal trust uses `provenance_class`.
- Support strength uses `confidence`.
- Evidence support uses evidence-quality fields.
- `inferred` is edge provenance/confidence only.
- `excluded` is source eligibility/status only.
- Blocked relationships are graph-health findings and cannot appear in displayable edges.
- Existing gold/silver/bronze values may migrate into internal evidence-quality values but are not primary user-facing trust labels.
- This is a breaking replacement; no schema `2.1` compatibility layer is required.

## Out of Scope

- New FIPS, RMF, 800-53B, or 800-53A imports.
- New contractor, implementation, vulnerability, threat, defense, or validation sources.
- Layered integration graph redesign.
- Relationship citations and JSON graph export.

## Implementation Plan

1. Add failing contract tests for federal source eligibility, graph contracts, blocked-edge isolation, and generated artifact names.
2. Implement the source registry and validation contract.
3. Implement node, edge, evidence, and graph-health normalization and validation.
4. Migrate current eligible generated data; route unsupported or excluded relationships to graph-health.
5. Replace runtime APIs and update runtime tests.
6. Migrate current UI journeys and federal trust terminology while preserving retained Issue 8 capabilities.
7. Replace stale browser/static assertions and documentation references.
8. Rebuild generated artifacts and run the full gate plus live browser audit.

## Acceptance Mapping

| Release 1 requirement | Issue 9 acceptance |
| --- | --- |
| Federal source registry and inclusion policy | Registry enforces provenance, eligibility, lifecycle, access, license, and mandate/reference metadata |
| Provenance-aware node, edge, and evidence contracts | Generated graph artifacts validate and runtime consumes them |
| Breaking contract replacement | No active runtime or generated artifact depends on schema `2.1` or registry schema `3.0` |
| Deployable vertical migration | Current search, browse, sources, detail, onboarding, and accessible alternatives work after migration |
| Trust separation | Semantics, provenance, confidence, and evidence quality remain separate in schema, UI, and tests |
| Blocked relationship handling | Blocked relationships appear only in graph-health |

## Verification

- `npm test`
- `npm run test:browser`
- `npm run smoke:dom`
- `npm run check:data-size`
- `npm run smoke:static`
- `npm run audit:coverage`
- `npm run precommit`
- Live smoke of retained Issue 8 journeys and federal trust labels.

## Done

- All acceptance rows pass.
- The static site is deployable and usable.
- Issue 10 can add RMF context without another contract migration.
- `npm run precommit` passed on the feature branch and merged `main`.
- The June 13, 2026 live GitHub Pages audit passed the retained journeys and federal graph trust checks.
