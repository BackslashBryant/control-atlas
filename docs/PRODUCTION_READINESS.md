# Production Readiness

## Issue 8 Status

GovFrame is under comprehensive refactor. Previous v1.0, accessibility, performance, coverage, and browser-audit completion claims are superseded.

## Required Before Release

- [x] Complete intended first-class source adapters with explicit limited-public-scope boundaries.
- [x] Reconcile direct mappings and remove unsupported seed assertions.
- [x] Confirm generated coverage matches normalized authoritative snapshots.
- [x] Pass `npm run precommit`.
- [ ] Pass strict keyboard, screen-reader, responsive, zoom, performance, and live GitHub Pages browser audits.
- [x] Confirm documentation claims match generated coverage artifacts.

## Current Evidence

Use `data/generated/coverage.json` for current catalog and mapping coverage. `limited-public-scope` entries are intentional and must remain visible.

The June 9, 2026 live browser audit is recorded in `docs/audits/live-browser-audit-2026-06-09.md`. It validates expert and junior-assessor journeys, educational copy, mobile and 200%-equivalent reflow, stable asset deployment, and console health. Native keyboard-only, screen-reader, and browser-controlled 200% zoom proof remain open.
