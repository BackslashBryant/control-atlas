# Plan Index

This index tracks development against the **full GovFrame Navigator v1.0** release. Phases in `docs/roadmap.md` define scope and exit criteria; per-issue plans under `docs/plans/` hold implementation detail.

## Active Issues

| Issue | Status | Plan | Research | Branch | Owner |
| --- | --- | --- | --- | --- | --- |
| Issue 8 - Refactor & UX | IN PROGRESS | [Issue-8 plan](plans/Issue-8-plan-status-IN-PROGRESS.md) | [Issue-8 research](research/Issue-8-research.md) | `agent/muse/issue-8-junior-assessor-ux` | Forge -> Muse -> Pixel |

## Completed Issues

| Issue | Status | Plan | Research | Branch | Owner |
| --- | --- | --- | --- | --- | --- |
| Issue 1 - Phase 1 foundation | COMPLETE | [Issue-1 plan](plans/Issue-1-plan-status-COMPLETE.md) | [Issue-1 research](research/Issue-1-research.md) | shipped: `agent/forge/issue-1-phase-1-foundation` | Forge -> Nexus |
| Issue 2 - GitHub Pages and CI smoke gates | COMPLETE | [Issue-2 plan](plans/Issue-2-plan-status-COMPLETE.md) | [Issue-2 research](research/Issue-2-research.md) | shipped: `agent/nexus/issue-2-pages-ci-smoke` | Nexus -> Pixel |
| Issue 3 - Phase 2 framework expansion | COMPLETE | [Issue-3 plan](plans/Issue-3-plan-status-COMPLETE.md) | [Issue-3 research](research/Issue-3-research.md) | shipped: `571e9f8` on `main` | Forge -> Pixel |
| Issue 4 - Phase 3 data automation | COMPLETE | [Issue-4 plan](plans/Issue-4-plan-status-COMPLETE.md) | [Issue-4 research](research/Issue-4-research.md) | `agent/nexus/issue-4-phase-3-data-automation` | Nexus -> Forge |
| Issue 5 - Phase 4 Tenable integration | COMPLETE | [Issue-5 plan](plans/Issue-5-plan-status-COMPLETE.md) | [Issue-5 research](research/Issue-5-research.md) | `agent/forge/issue-5-tenable` | Forge -> Nexus |
| Issue 6 - Phase 5 emerging frameworks | COMPLETE | [Issue-6 plan](plans/Issue-6-plan-status-COMPLETE.md) | [Issue-6 research](research/Issue-6-research.md) | shipped: `078e52f` on `main` | Forge -> Nexus |
| Issue 7 - Phase 6 polish and release quality | COMPLETE | [Issue-7 plan](plans/Issue-7-plan-status-COMPLETE.md) | [Issue-7 research](research/Issue-7-research.md) | shipped: `6280440` on `main` | Vector -> Muse -> Forge -> Pixel |

## v1.0 Build Order (Roadmap Phases)

1. **Phase 1 - Foundation** (Issues 1-2) - **COMPLETE**
2. **Phase 2 - Framework expansion** (Issue 3) - **COMPLETE**
3. **Phase 3 - Data automation** (Issue 4) - **COMPLETE**
4. **Phase 4 - Tenable integration** (Issue 5) - **COMPLETE**
5. **Phase 5 - AI and emerging frameworks** (Issue 6) - **COMPLETE**
6. **Phase 6 - Polish and release quality** (Issue 7) - **COMPLETE**

## How to Work a New Issue

1. Create the plan file using `.cursor/templates/Issue-plan-status.md` and name it `Issue-<id>-plan-status-<STATUS>.md`.
2. Create the matching `docs/research/Issue-<id>-research.md`.
3. Link roadmap phase exit criteria in the plan acceptance section.
4. Add a row to the Active Issues table (move to Completed when shipped on `main`).
5. Update `docs/context.md` and `docs/PRODUCTION_READINESS.md` when exit criteria are met.
