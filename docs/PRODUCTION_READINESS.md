# Control Atlas Production Readiness

## Product Identity

- Public product name: **Control Atlas**
- Campaign line: **Ctrl+Alt+Comply**
- Tagline: **The public map for federal cyber compliance.**
- Supporting line: Open-source reference workbench for mapping controls, tracing frameworks, and generating blank RMF/ATO templates - no login, no evidence upload, no organizational data required.

## Current Status

The static public reference application is deployable and provides a reusable Control Atlas foundation. The full MVP is not production-ready until Epic 0 through Epic 8 are complete and the remaining security, accessibility, and release gates are closed.

## Phase 0 Development Readiness

- [x] Canonical PRD adopted
- [x] Static GitHub Pages baseline retained
- [x] Public-data-only boundary documented
- [x] Historical GovFrame delivery records reframed as non-active guidance
- [x] Design-token implementation completed
- [x] Node and edge provenance extensions completed
- [x] Provenance renderer updates completed
- [x] Missing CI/CD and SecDevOps controls addressed or explicitly deferred
- [ ] New Control Atlas live Pages audit completed

## Required Before MVP Release

- [x] Static GitHub Pages delivery with no backend or login
- [x] Public source registry and validated graph bundles
- [x] Search, browse, provenance, relationship comparison, and public-reference CSV export
- [x] Product boundary documented and enforced in runtime tests
- [ ] Missing SecDevOps controls from `docs/SECDEVOPS_GAP_ANALYSIS.md`
- [ ] Required Library, Crosswalk Workbench, Template Factory, Pattern Library, Start Here, and QA scope
- [ ] Native keyboard-only, screen-reader, responsive, zoom, performance, and live Pages audits
- [ ] Content, disclaimer, source-license, and prohibited-claim review

## Historical Evidence

Dated files under `docs/audits/` remain historical evidence for prior GovFrame-era deployments. New runtime changes require new Control Atlas audit evidence rather than rewriting old records.

## Recommended Next Implementation Task

Complete Epic 0 closeout with a fresh live Pages audit against the renamed deployment path. Preserve the existing runtime bundle contract and keep all changes static, public-data-only, and deployable.

## Runtime Boundary

Control Atlas remains static and public-data-only with no backend, authentication, user uploads, user, organization, or system data, scoring, operational integrations, or stored generated templates.
