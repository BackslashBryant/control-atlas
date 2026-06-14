# Control Atlas Delivery Index

## Product Identity

- Public product name: **Control Atlas**
- Campaign line: **Ctrl+Alt+Comply**
- Tagline: **The public map for federal cyber compliance.**
- Supporting line: Open-source reference workbench for mapping controls, tracing frameworks, and generating blank RMF/ATO templates - no login, no evidence upload, no organizational data required.

## Active Direction

`docs/PRD.md` is the canonical source of truth. `docs/roadmap.md` defines the active backlog through Epic 0 to Epic 8. Epic 0 now executes the full Control Atlas rename, `src/` source-tree adoption, staged static deployment, and CI hardening baseline.

No backend or user, organization, or system data is part of this product direction.

## Current Baseline

- Static GitHub Pages application
- Public-data-only build pipeline
- Source registry schema `4.0`
- Stable `sources`, `nodes`, `edges`, `evidence`, and `graph-health` bundles
- Search, browse, comparison, provenance, and CSV export behavior
- Existing contract, runtime, and deployment gates

## Development Readiness Checklist

- [x] Canonical PRD updated to Control Atlas v2.1
- [x] Static, public-data-only baseline retained
- [x] Historical delivery docs reframed as non-active guidance
- [x] Epic 0 design-token and shell-hardening work executed
- [x] Node and edge schema extensions for expanded provenance metadata executed
- [x] Provenance-facing renderer updates executed
- [x] Missing CI/CD and SecDevOps controls closed or explicitly deferred
- [ ] Live Pages audit completed against the new shell copy

## Historical Delivery Records

Plans for Issues 8-12, older source-hardening proposals, and dated browser audits remain historical evidence of reusable work. They should inform implementation details, not redefine the active Control Atlas backlog.

## Recommended Next Implementation Sequence

1. Complete Epic 0 closeout with a fresh live Pages audit against `https://backslashbryant.github.io/control-atlas/`.
2. Extend the source/provenance registry and normalization pipeline using the adopted five-artifact runtime contract.
3. Expand Library and Crosswalk experiences without introducing backend behavior.
4. Add client-side blank template generation and export surfaces.
5. Build Start Here, glossary, and pattern content.
6. Finish accessibility, release evidence, and live deployment hardening.

## Delivery Rules

1. Work on a task branch.
2. Preserve the adopted graph and runtime contracts unless a separately approved migration requires change.
3. Keep every increment static, public-data-only, and deployable.
4. Run task-specific checks and `npm run precommit`.
5. Complete a live Pages audit for runtime/public-shell changes before closeout.
