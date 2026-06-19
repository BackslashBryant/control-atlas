# Control Atlas Production Readiness

## Product Identity

- Public product name: **Control Atlas**
- Campaign line: **Ctrl+Alt+Comply**
- Tagline: **The public map for federal cyber compliance.**
- Supporting line: Open-source reference workbench for mapping controls, tracing frameworks, and generating blank RMF/ATO templates - no login, no evidence upload, no organizational data required.

## Current Status

The static public reference application is deployable. MVP Epics 0–6 are complete. Release candidate `v1.0.0-rc.1` was tagged June 19, 2026 after full `npm run precommit`, content review, accessibility, and E2E gates passed.

## Phase 0 Development Readiness

- [x] Canonical PRD adopted
- [x] Static GitHub Pages baseline retained
- [x] Public-data-only boundary documented
- [x] Historical GovFrame delivery records reframed as non-active guidance
- [x] Design-token implementation completed
- [x] Node and edge provenance extensions completed
- [x] Provenance renderer updates completed
- [x] Missing CI/CD and SecDevOps controls addressed or explicitly deferred
- [x] New Control Atlas live Pages audit completed

## Required Before MVP Release

- [x] Static GitHub Pages delivery with no backend or login
- [x] Public source registry and validated graph bundles
- [x] Search, browse, provenance, relationship comparison, and public-reference CSV export
- [x] Product boundary documented and enforced in runtime tests
- [x] Library, Crosswalk Workbench, Template Factory, Pattern Library, Start Here, and QA scope
- [x] Accessibility automation (axe per-route + contract tests) and keyboard smoke E2E
- [x] Content, disclaimer, source-license, and prohibited-claim review (`tests/content-review.test.mjs`)
- [x] Release candidate tag `v1.0.0-rc.1` with live audit evidence [`docs/audits/live-browser-audit-2026-06-19-epic-6.md`](audits/live-browser-audit-2026-06-19-epic-6.md)

## Public-shell release gate (Epic 7+)

- [ ] Manual a11y checklist completed — [`docs/audits/a11y-manual-checklist.md`](audits/a11y-manual-checklist.md)
- [ ] Live Pages audit filed from [`docs/audits/live-pages-audit-template.md`](audits/live-pages-audit-template.md)

## Historical Evidence

Dated files under `docs/audits/` remain historical evidence for prior GovFrame-era deployments. New runtime changes require new Control Atlas audit evidence rather than rewriting old records.

## Recommended Next Implementation Task

Operate in maintenance mode: scheduled CI, dependency/security gates, and actionable issues for failures. Scope new features only through an explicit Plan.md update.

## Residual (non-blocking)

- Graph UI in React shell (Epic 0 residual; Epic 9 planned)
- Branch protection API verification pending authenticated `gh` session — policy documented in [`docs/audits/branch-protection-verification-2026-06-19.md`](audits/branch-protection-verification-2026-06-19.md)
- Action SHA pinning deferred per [`docs/adr/0012-defer-github-actions-sha-pinning.md`](adr/0012-defer-github-actions-sha-pinning.md)

## Runtime Boundary

Control Atlas remains static and public-data-only with no backend, authentication, user uploads, user, organization, or system data, scoring, operational integrations, or stored generated templates.
