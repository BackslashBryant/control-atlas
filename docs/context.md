# Control Atlas Context Handoff

## Product Identity

- Public product name: **Control Atlas**
- Campaign line: **Ctrl+Alt+Comply**
- Tagline: **The public map for federal cyber compliance.**
- Supporting line: Open-source reference workbench for mapping controls, tracing frameworks, and generating blank RMF/ATO templates - no login, no evidence upload, no organizational data required.

## Current Objective

Prepare the repository for controlled Phase 0 development against the v2.1 PRD. This means aligning docs, ADRs, inventories, shell copy, and readiness guidance around a static, open-source, public-data-only product direction before major new feature work begins.

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

1. Execute Epic 0: branding/docs migration, design-token application, provenance-ready shell updates, and CI/CD gap closure.
2. Harden the source/provenance registry and normalization pipeline without changing the adopted runtime artifact contract.
3. Extend the Library Browser and Crosswalk Workbench using current static bundles and browser runtime patterns.
4. Add client-side blank template generation.
5. Build Start Here, glossary, and pattern surfaces.
6. Finish accessibility, release, and SecDevOps hardening.
