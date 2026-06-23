# Control Atlas Context Handoff

## Product Identity

- Public product name: **Control Atlas**
- Campaign line: **Ctrl+Alt+Comply**
- Tagline: **The public map for federal cyber compliance.**
- Supporting line: Open-source reference workbench for mapping controls, tracing frameworks, and generating blank RMF/ATO templates - no login, no evidence upload, no organizational data required.
- Design principle: **Build for translation, not complexity.** See [`docs/DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md).

## Current Objective

**Maintenance** — Map Foundation Source Manifest v4.0 completed June 22, 2026. Atlas Map now starts from a nine-tier compliance source hierarchy, gates optional sources by disposition, centralizes canonical source links, and uses a controlled AC-2 focused model before Cytoscape layout. Optional next: RC promotion, Dependabot PR review (Nexus).

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
- Epic 10: Atlas Map-first UX + **Frontend Overhaul** — HashRouter (`#/…` routes + legacy `?view=` shim), split `styles/` design system, `TopNav`/`SearchOverlay`/`SiteFooter`/`BrandEntranceOverlay`, extracted pages (`ObjectDetailPage`, `SourcesPage`, `TemplatesPage`, `PlaybooksPage`, `AboutPage`, `StartHerePage`), dagre layout for STIG/threat compare maps, map stabilization (controlled fCoSE, user fit-to-screen)
- UI and Brand Correction v2.2: first-run entrance, fCoSE graph, route-aware cached loading, and Explore card/accordion hierarchy
- Frontend Full Review: mobile search access, named dialogs and complete glossary tabs, Start Here completion safeguards, canonical copied links, template form improvements, WCAG AA text contrast, 44-pixel touch targets, responsive route coverage, secondary-route code splitting, and repaired port status reporting ([`docs/audits/frontend-full-review-2026-06-22.md`](audits/frontend-full-review-2026-06-22.md))
- Frontend Overhaul correction pass: view-state footer navigation, three-column responsive footer, hero and detail surface completion, sequential Start Here steps, normalized card hierarchy, translated template labels, shared Explore primitives, tokenized badge colors, and removal of unused `AppRoutes.tsx`
- Map Foundation Source Manifest v4.0: stable source IDs, canonical links, nine hierarchy tiers, source dispositions and warnings, graph roles/ranks, nine-node dagre starter map, twelve-node AC-2 concentric focus, fCoSE cluster expansion, and Cytoscape Popper/Tippy tooltips

## Adopted Baseline

- React shell in `src/ui/App.tsx` is the active UI; legacy `src/app/app.mjs` is not mounted
- Build-time importers and `data/generated/*` bundles are the runtime contract
- Cytoscape is lazy-loaded for Atlas Map surfaces: dagre renders hierarchy and chains, concentric renders focused maps, fCoSE renders expanded dense clusters, and Popper/Tippy positions tooltips
- Control Atlas is the active repo and deployment identity

## Product Boundary

Control Atlas is public-data-only and has no backend. It may normalize public sources at build time, serve static bundles from GitHub Pages, and generate blank/public-reference exports locally in the browser.

It must not ingest evidence, accept uploads, connect to operational systems, store user, organization, or system data, score compliance, track real assets or packages, or require login.

## Next

1. Maintenance CI and optional RC promotion to `v1.0.0`

## Status Docs

Canonical delivery state lives in [`docs/Plan.md`](Plan.md). Open PRD gaps only in [`docs/plans/prd-v3-alignment-backlog.md`](plans/prd-v3-alignment-backlog.md).
