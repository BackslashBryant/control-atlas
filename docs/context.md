# Control Atlas Context Handoff

## Product Identity

- Public product name: **Control Atlas**
- Campaign line: **Ctrl+Alt+Comply**
- Tagline: **The public map for federal cyber compliance.**
- Supporting line: Open-source reference workbench for mapping controls, tracing frameworks, and generating blank RMF/ATO templates - no login, no evidence upload, no organizational data required.
- Design principle: **Build for translation, not complexity.** See [`docs/DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md).

## Current Objective

Post-MVP maintenance and optional `v1.0.0` promotion. UI and Brand Correction v2.2 is shipped.

**Active sprint:** None — see [`docs/Plan.md`](Plan.md).

## Shipped on `main` (do not re-plan)

- Epics 0–1 baseline: React shell, schema/provenance on generated bundles, Sources registry, CI/Pages parity
- Epic 2: Library search, facets, detail pages, deep links
- Epic 3: Compare workbenches (relationships, STIG chain, baseline delta, provenance exports)
- Epic 4: Template Factory — nine PRD-aligned templates, artifact-first UI, export contract tests, generation E2E
- Epic 5: Start Here actionable recommendations (Library, Compare, Patterns, Templates deep links); header glossary search; inline glossary on library detail and pattern pages
- Epic 6: Critical-path E2E matrix, per-route a11y, content-review contracts, `npm run precommit` green, live audit evidence, RC tag
- Epic 7: About/trust page (`/?view=about`), manual a11y checklist, live Pages audit template, SecDevOps docs (branch protection policy; action pinning ADR deferral)
- Epic 8: MITRE Threat Lens — ATT&CK Enterprise + ICS, D3FEND countermeasures, Compare threat chain ([`docs/audits/live-browser-audit-2026-06-19-epic-8.md`](audits/live-browser-audit-2026-06-19-epic-8.md))
- Epic 9: Interactive relationship map in Library detail — provenance filters, lazy canvas graph, accessible table fallback ([`docs/audits/live-browser-audit-2026-06-19-epic-9.md`](audits/live-browser-audit-2026-06-19-epic-9.md))
- Epic 10: Atlas Map-first UX — homepage, standalone Atlas Map, compare-map on all workbenches, provenance tooltips, Explore/Compare page extraction ([`docs/plans/epic-10-atlas-map-ux.md`](plans/epic-10-atlas-map-ux.md))
- UI and Brand Correction v2.2: first-run entrance, fCoSE graph, route-aware cached loading, and Explore card/accordion hierarchy

## Adopted Baseline

- React shell in `src/ui/App.tsx` is the active UI; legacy `src/app/app.mjs` is not mounted
- Build-time importers and `data/generated/*` bundles are the runtime contract
- Cytoscape fCoSE graph renderer is lazy-loaded for Atlas Map surfaces; legacy `src/app/app.mjs` is not mounted
- Control Atlas is the active repo and deployment identity

## Product Boundary

Control Atlas is public-data-only and has no backend. It may normalize public sources at build time, serve static bundles from GitHub Pages, and generate blank/public-reference exports locally in the browser.

It must not ingest evidence, accept uploads, connect to operational systems, store user, organization, or system data, score compliance, track real assets or packages, or require login.

## Next

1. Maintenance CI and optional RC promotion to `v1.0.0`

## Status Docs

Canonical delivery state lives in [`docs/Plan.md`](Plan.md). Open PRD gaps only in [`docs/plans/prd-v3-alignment-backlog.md`](plans/prd-v3-alignment-backlog.md).
