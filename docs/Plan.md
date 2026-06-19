# Control Atlas Delivery Index

## Product Identity

- Public product name: **Control Atlas**
- Campaign line: **Ctrl+Alt+Comply**
- Tagline: **The public map for federal cyber compliance.**
- Supporting line: Open-source reference workbench for mapping controls, tracing frameworks, and generating blank RMF/ATO templates - no login, no evidence upload, no organizational data required.

## Active Direction

`docs/PRD.md` is the canonical source of truth. `docs/roadmap.md` defines the active backlog through Epic 0 to Epic 6. Epic 0 baseline and live Pages audit evidence are now in place, and Epic 1 Provenance Registry behavior is deployed on the adopted static runtime baseline.

## Translation-First Product Standard

Build for translation, not complexity.

Control Atlas is not a data explorer first. It is a public reference workbench that translates complex cybersecurity guidance into clear, traceable user action.

Future work must preserve this order:

1. User intent
2. Plain-language meaning
3. Visible relationships
4. Source trust
5. Recommended next action
6. Raw technical detail only on demand

No roadmap item may be accepted unless it identifies the user confusion it reduces and the action it enables.

No backend or user, organization, or system data is part of this product direction.

## Current Baseline

- Static GitHub Pages application
- Public-data-only build pipeline
- Source registry schema `4.0`
- Stable `sources`, `nodes`, `edges`, `evidence`, and `graph-health` bundles
- Search, browse, comparison, provenance, and CSV export behavior
- Existing contract, runtime, and deployment gates

## Development Readiness Checklist

- [x] Canonical PRD updated to Control Atlas v3.0
- [x] Static, public-data-only baseline retained
- [x] Historical delivery docs reframed as non-active guidance
- [x] Epic 0 design-token and shell-hardening work executed
- [x] Node and edge schema extensions for expanded provenance metadata executed
- [x] Provenance-facing renderer updates executed
- [x] Epic 1 Provenance filtering, source detail views, lifecycle warnings, and source traceability executed
- [x] Missing CI/CD and SecDevOps controls closed or explicitly deferred
- [x] Live Pages audit completed against the new shell copy

## Historical Delivery Records

Plans for Issues 8-12, older source-hardening proposals, and dated browser audits remain historical evidence of reusable work. They should inform implementation details, not redefine the active Control Atlas backlog.

## Recommended Next Implementation Sequence

1. Extend the data normalization pipeline (Epic 1) using the adopted runtime contract.
2. Expand Library Browser (Epic 2) and the Compare workspace (Epic 3).
3. Add Template Factory (Epic 4), then Patterns, Glossary, and Start Here (Epic 5).
4. Finish release hardening and live audits (Epic 6).

## Delivery Rules

1. Work on a task branch.
2. Preserve the adopted graph and runtime contracts unless a separately approved migration requires change.
3. Keep every increment static, public-data-only, and deployable.
4. Run task-specific checks and `npm run precommit`.
5. Complete a live Pages audit for runtime/public-shell changes before closeout.
