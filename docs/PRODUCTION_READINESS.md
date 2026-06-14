# Control Atlas Production Readiness

## Current Status

The static public reference application is deployable and provides a reusable Control Atlas foundation. The full Control Atlas MVP is not production-ready until the nine roadmap epics and release-hardening requirements are complete.

## Required Before MVP Release

- [x] Static GitHub Pages delivery with no backend or login
- [x] Public source registry and validated graph bundles
- [x] Search, browse, sources, relationship comparison, and public-reference CSV export
- [x] Product boundary documented and enforced in runtime tests
- [ ] Missing SecDevOps controls from `docs/SECDEVOPS_GAP_ANALYSIS.md`
- [ ] Required Library, Crosswalk, Template Factory, Pattern Library, and Relationship Graph scope
- [ ] Native keyboard-only, screen-reader, responsive, zoom, performance, and live Pages audits
- [ ] Content, disclaimer, source-license, and prohibited-claim review

## Historical Evidence

Dated files under `docs/audits/` remain historical evidence for the GovFrame-era implementation they tested. New runtime changes require new Control Atlas audit evidence rather than rewriting old records.

## Runtime Boundary

Control Atlas remains static and public-data-only with no backend, authentication, user uploads, user/org/system data, scoring, operational integrations, or stored generated templates.
