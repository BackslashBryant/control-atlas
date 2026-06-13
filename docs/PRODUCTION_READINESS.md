# Production Readiness

## Current Status

The existing static mapper remains deployed, but its product contract is superseded. Release 1 of the Federal Security Control Integration Directory is not production-ready until Issues 9-11 ship and the required audits pass.

## Release 1 Required Before Completion

- [ ] Issue 9 replaces the generated-data and runtime contracts while preserving current user journeys.
- [ ] Issue 10 publishes source-backed FIPS, RMF, and baseline context.
- [ ] Issue 11 publishes source-backed assessment context and canonical OSCAL ingestion.
- [ ] Every displayable node and edge passes federal eligibility and provenance validation.
- [ ] Blocked relationships appear only in graph-health reporting.
- [ ] Source manifests and graph-health artifacts are reproducible and reviewable.
- [ ] `npm run precommit` passes for every issue and the merged release.
- [ ] Native keyboard-only, screen-reader, responsive, zoom, performance, and live GitHub Pages audits pass.

## Retained Evidence

The June 9, 2026 audit in `docs/audits/live-browser-audit-2026-06-09.md` remains evidence for retained search, browse, evidence-first detail, onboarding, responsive, and accessible-name behavior. It is not Release 1 federal graph acceptance evidence.

## Open Audit Requirements

- Validate downloadable exports in a browser environment that supports downloads when export work resumes.
- Complete native keyboard-only and screen-reader audits.
- Complete browser-controlled 200% zoom and release performance audits.
- Re-run live-site journeys after every Release 1 issue that changes runtime behavior.

## Performance and Data Strategy

The application remains static and browser-only. Large federal graph artifacts and projections must lazy-load, initial interaction must not wait for the complete graph, and every release must document artifact sizes and performance evidence.
