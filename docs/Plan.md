# Plan Index

This index tracks delivery of the U.S. Federal Security Control Integration Directory defined in `docs/PRD.md` and `docs/roadmap.md`.

## Active Release

| Issue | Status | Plan | Branch | Lead |
| --- | --- | --- | --- | --- |
| Issue 9 / FEDGRAPH-001 - Federal graph contract vertical migration | DONE | [Issue 9 plan](plans/Issue-9-plan-status-DONE.md) | `agent/forge/issue-9-federal-graph-contract` | Forge |
| Issue 10 / FEDGRAPH-002A - RMF, categorization, and baseline context | READY | [Issue 10 plan](plans/Issue-10-plan-status-READY.md) | `agent/forge/issue-10-rmf-baseline-context` | Forge |
| Issue 11 / FEDGRAPH-002B - Assessment and OSCAL backbone | IN PROGRESS | [Issue 11 plan](plans/Issue-11-plan-status-IN-PROGRESS.md) | `agent/forge/issue-11-assessment-oscal-backbone` | Forge |

## Superseded Work

| Issue | Status | Plan | Disposition |
| --- | --- | --- | --- |
| Issue 8 - Junior assessor UX | SUPERSEDED | [Issue 8 plan](plans/Issue-8-plan-status-SUPERSEDED.md) | Preserve useful shipped UX; replace framework-neutral contract and terminology in Issue 9 |
| Source provenance hardening backlog | SUPERSEDED AS CONTRACT | [Historical backlog](plans/epic-source-provenance-hardening.md) | Useful implementation findings are inputs to Issues 9-11; federal provenance is now the primary trust model |

## Release 1 Requirement Ownership

| Requirement | Owning issue |
| --- | --- |
| Federal inclusion policy and source registry migration | Issue 9 |
| Source, node, edge, evidence, and graph-health contracts | Issue 9 |
| Breaking runtime/UI vertical migration | Issue 9 |
| FIPS 199 and FIPS 200 context | Issue 10 |
| SP 800-37 RMF lifecycle context | Issue 10 |
| SP 800-53B baseline context | Issue 10 |
| SP 800-53A assessment context | Issue 11 |
| Canonical OSCAL ingest boundary | Issue 11 |
| Release 1 manifests, reproducibility, and graph-quality gates | Issue 11 |

Each Release 1 requirement has one owning issue. Supporting work may occur elsewhere only when its owning plan explicitly requires it.

## Later Releases

Releases 2-6 remain milestone-level roadmap entries. Implementation plans are created only after Release 1 establishes the graph contract.

## Issue Workflow

1. Work on the branch named in the issue plan.
2. Revalidate official source versions and access before implementing importers.
3. Keep the static application deployable after every issue.
4. Run the issue-specific checks and `npm run precommit`.
5. Complete required live audits before marking the issue or release complete.
