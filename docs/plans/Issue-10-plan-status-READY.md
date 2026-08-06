# Issue 10 / FEDGRAPH-002A - RMF, Categorization, and Baseline Context

> **Historical status:** The implementation represented by this plan is present on `main`. This document is retained as delivery history; it is not an active Control Atlas backlog item.

| Field | Value |
| --- | --- |
| Status | READY |
| Branch | `agent/forge/issue-10-rmf-baseline-context` |
| Lead | Forge |
| Review | Scout -> Pixel -> Sentinel -> Nexus |

## Outcome

Add source-backed federal categorization, minimum requirement, RMF lifecycle, and baseline context to the graph so a control such as `AC-2` shows how federal programs select and use it.

## Scope

- Revalidate and register official public FIPS 199, FIPS 200, SP 800-37 Rev. 2, SP 800-53 Rev. 5, and SP 800-53B artifacts.
- Import FIPS 199 impact categories and categorization concepts.
- Import FIPS 200 minimum requirement areas and supported control-family alignments.
- Import RMF steps and their source-backed relationships to controls, baselines, and artifacts.
- Import SP 800-53B low, moderate, high, and privacy baseline membership.
- Add source manifests, graph-health coverage, runtime queries, and current-UI federal context sections for these objects.

## Relationship Ownership

- FIPS 199 categorization and baseline-selection context belongs only to Issue 10.
- FIPS 200 minimum requirements and supported family relationships belong only to Issue 10.
- RMF lifecycle nodes and relationships belong only to Issue 10.
- SP 800-53B baseline nodes and membership edges belong only to Issue 10.
- SP 800-53A assessment objectives and canonical OSCAL governance belong to Issue 11.

## Out of Scope

- SP 800-53A assessment procedures.
- CUI, CMMC, FedRAMP, implementation checks, vulnerability, threat, defense, and validation context.
- New graph visualization or export formats.

## Implementation Plan

1. Revalidate official source versions, public access, licenses, and artifact formats.
2. Add failing adapter and graph-contract fixtures for FIPS, RMF, and baseline relationships.
3. Implement independent source adapters and manifests.
4. Normalize nodes, edges, and evidence without inference.
5. Add graph-health coverage and orphan/source validation.
6. Add runtime queries and federal context sections using existing Issue 9 UI patterns.
7. Rebuild artifacts and complete automated and live browser verification.

## Acceptance Mapping

| Release 1 requirement | Issue 10 acceptance |
| --- | --- |
| FIPS 199 context | Categorization and impact nodes/edges are source-backed |
| FIPS 200 context | Minimum requirement nodes and supported relationships are source-backed |
| SP 800-37 context | RMF lifecycle nodes and relationships are source-backed |
| SP 800-53B context | Low, moderate, high, and privacy membership is source-backed |
| Source-backed coverage | Manifests and graph-health report counts, gaps, and invalid relationships |
| Deployable increment | Existing journeys work and federal context appears without breaking Issue 9 contracts |

## Verification

- Targeted adapter and graph-contract tests.
- `npm run build:data`
- `npm run audit:coverage`
- `npm run precommit`
- Live smoke: search `AC-2`, inspect defining source, RMF context, and baseline membership.

## Done

- All acceptance rows pass.
- No FIPS, RMF, or baseline relationship is inferred without explicit provenance and warning.
- Issue 11 can attach assessment context to the same graph contract.
