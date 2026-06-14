# Issue 11 / FEDGRAPH-002B - Assessment and OSCAL Backbone

| Field | Value |
| --- | --- |
| Status | IN PROGRESS |
| Branch | `agent/forge/issue-11-assessment-oscal-backbone` |
| Lead | Forge |
| Review | Scout -> Pixel -> Sentinel -> Nexus |

## Outcome

Complete Release 1 by adding source-backed SP 800-53A assessment context, establishing canonical OSCAL ingestion, and enforcing reproducible graph-quality governance.

## Scope

- Revalidate and register official public SP 800-53A Rev. 5 and OSCAL artifacts.
- Import assessment objectives, methods, objects, procedures, and control relationships.
- Establish canonical OSCAL catalog/profile/component/assessment normalization boundaries needed by Release 1.
- Add per-source manifests and a build artifact manifest.
- Add graph-health gates for duplicate IDs, orphaned edges, unknown sources, invalid provenance/status, missing evidence, restricted-content leakage, and inferred relationships shown as official.
- Add reproducible source and graph diff summaries.
- Add assessment context to the current static UI.

## Relationship Ownership

- SP 800-53A assessment nodes and `assesses` relationships belong only to Issue 11.
- Canonical OSCAL ingest boundaries and Release 1 import governance belong only to Issue 11.
- FIPS, RMF, and baseline context remain Issue 10 responsibilities.
- Later program, implementation, vulnerability, threat, defense, validation, graph UX, citation, and export work remains outside Release 1.

## Out of Scope

- Full OSCAL SSP, assessment-results, or POA&M product workflows.
- CUI, CMMC, FedRAMP, implementation checks, vulnerability, threat, defense, and validation sources.
- JSON graph export, which belongs to Release 6.

## Implementation Plan

1. Revalidate SP 800-53A and OSCAL source versions, public access, licenses, and artifact formats.
2. Add failing assessment, OSCAL, manifest, restricted-content, and reproducibility tests.
3. Implement SP 800-53A adapter and assessment graph normalization.
4. Consolidate Release 1 OSCAL ingestion behind one canonical normalizer boundary.
5. Implement source/build manifests and diff summaries.
6. Expand graph-health validators and make trust-model violations fail the build.
7. Add runtime assessment queries and UI assessment context.
8. Rebuild artifacts and complete automated and live browser verification.

## Acceptance Mapping

| Release 1 requirement | Issue 11 acceptance |
| --- | --- |
| SP 800-53A context | Assessment objectives, methods, objects, procedures, and control edges are source-backed |
| Canonical OSCAL ingestion | Release 1 OSCAL inputs use one validated normalization boundary |
| Import governance | Every Release 1 source and build has a reproducible manifest and diff |
| Graph-quality gates | Trust, evidence, orphan, duplicate, restricted-content, and provenance violations fail validation |
| Release 1 completion | `AC-2` shows source, baseline, RMF, assessment, and evidence context in the deployable static app |

## Verification

- Targeted assessment, OSCAL, manifest, and graph-health tests.
- `npm run build:data`
- `npm run audit:coverage`
- `npm run check:data-size`
- `npm run precommit`
- Live smoke: search `AC-2`, inspect assessment procedures and evidence, and confirm graph-health failures are not user-facing edges.

## Done

- All acceptance rows pass.
- Release 1 automated gates and required live audits pass.
- Release 2 can add federal program context without changing the graph contract.
