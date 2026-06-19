# Control Atlas Context Handoff

## Product Identity

- Public product name: **Control Atlas**
- Campaign line: **Ctrl+Alt+Comply**
- Tagline: **The public map for federal cyber compliance.**
- Supporting line: Open-source reference workbench for mapping controls, tracing frameworks, and generating blank RMF/ATO templates - no login, no evidence upload, no organizational data required.
- Design principle: **Build for translation, not complexity.** See [`docs/DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md).

## Current Objective

Carry the repository from the Phase 0 baseline into the next roadmap slice. The static runtime, renamed shell, and Provenance Registry behavior are in place; the remaining near-term gap is live Pages audit evidence before broader feature expansion.

## Adopted Baseline

- The existing static JavaScript app, now migrated into the Control Atlas `src/` source tree, is the implementation baseline.
- The current build-time public-data importers, source registry schema `4.0`, and generated graph artifacts stay in place.
- The current D3 graph engine is reused for Phase 0; graph-library migration is deferred.
- Control Atlas is now the active repository, package, and deployment identity; only historical evidence retains GovFrame-era references.
- Historical Issue 8-12 plans and dated audits remain delivery evidence, not the active roadmap.

## Product Boundary

Control Atlas is public-data-only and has no backend. It may normalize public sources at build time, serve static bundles from GitHub Pages, and generate blank/public-reference exports locally in the browser.

It must not ingest evidence, accept uploads, connect to operational systems, store user, organization, or system data, score compliance, track real assets or packages, or require login.

## Next Sequence

1. Complete Epic 0 closeout with a fresh live Pages audit against the deployed shell.
2. Extend the data normalization pipeline (Epic 1) without changing the adopted runtime artifact contract.
3. Extend the Library Browser (Epic 2) and Compare workspace (Epic 3) using current static bundles and browser runtime patterns.
4. Add client-side blank template generation (Epic 4).
5. Build Start Here, glossary, and pattern surfaces (Epic 5).
6. Finish QA, accessibility, release, and SecDevOps hardening (Epic 6).
