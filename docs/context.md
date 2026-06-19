# Control Atlas Context Handoff

## Product Identity

- Public product name: **Control Atlas**
- Campaign line: **Ctrl+Alt+Comply**
- Tagline: **The public map for federal cyber compliance.**
- Supporting line: Open-source reference workbench for mapping controls, tracing frameworks, and generating blank RMF/ATO templates - no login, no evidence upload, no organizational data required.
- Design principle: **Build for translation, not complexity.** See [`docs/DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md).

## Current Objective

**Epic 7 shipped** on branch `agent/muse/epic-7-platform-trust` (June 19, 2026). MVP remains at tag `v1.0.0-rc.1`; Epic 7 adds About/trust surface and release hardening playbooks.

**Active sprint:** None — Epic 9 shipped June 19, 2026. Next build when scoped: Epic 8 (MITRE Threat Lens).

## Shipped on `main` (do not re-plan)

- Epics 0–1 baseline: React shell, schema/provenance on generated bundles, Sources registry, CI/Pages parity
- Epic 2: Library search, facets, detail pages, deep links
- Epic 3: Compare workbenches (relationships, STIG chain, baseline delta, provenance exports)
- Epic 4: Template Factory — nine PRD-aligned templates, artifact-first UI, export contract tests, generation E2E
- Epic 5: Start Here actionable recommendations (Library, Compare, Patterns, Templates deep links); header glossary search; inline glossary on library detail and pattern pages
- Epic 6: Critical-path E2E matrix, per-route a11y, content-review contracts, `npm run precommit` green, live audit evidence, RC tag
- Epic 7: About/trust page (`/?view=about`), manual a11y checklist, live Pages audit template, SecDevOps docs (branch protection policy; action pinning ADR deferral)
- Epic 9: Interactive relationship map in Library detail — provenance filters, lazy canvas graph, accessible table fallback ([`docs/audits/live-browser-audit-2026-06-19-epic-9.md`](audits/live-browser-audit-2026-06-19-epic-9.md))

## Adopted Baseline

- React shell in `src/ui/App.tsx` is the active UI; legacy `src/app/app.mjs` is not mounted
- Build-time importers and `data/generated/*` bundles are the runtime contract
- D3 graph renderer ships in React Library detail (Epic 9); legacy `src/app/app.mjs` is not mounted
- Control Atlas is the active repo and deployment identity

## Product Boundary

Control Atlas is public-data-only and has no backend. It may normalize public sources at build time, serve static bundles from GitHub Pages, and generate blank/public-reference exports locally in the browser.

It must not ingest evidence, accept uploads, connect to operational systems, store user, organization, or system data, score compliance, track real assets or packages, or require login.

## Next (post–Epic 9)

1. Epic 8 (MITRE Threat Lens) when scoped in Plan.md
2. Maintenance CI and dependency gates
3. Optional RC promotion to `v1.0.0`

## Status Docs

Canonical delivery state lives in [`docs/Plan.md`](Plan.md). Open PRD gaps only in [`docs/plans/prd-v3-alignment-backlog.md`](plans/prd-v3-alignment-backlog.md).
