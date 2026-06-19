# Control Atlas Testing Strategy

## Current Gates

- `npm run test:data`
- `npm run test:runtime`
- `npm run test:browser`
- `npm run smoke:dom`
- `npm run verify:public`
- `npm run precommit`

## Contract Coverage

- Source registry and public-access rules
- Generated graph schema, provenance, evidence, and graph-health rules
- Build-time normalization and reproducibility
- Runtime search, browse, detail, source, comparison, and export behavior
- Control Atlas shell branding, disclaimer, and accessibility markers
- Product boundary: no prohibited operational capability, user upload, user-data storage, or write request
- Required alignment documents and roadmap epics

Documentation may name prohibited concepts to explain the boundary. Tests must reject their implementation in runtime/config surfaces rather than banning explanatory language.

## Release Audit

Automated marker tests are not enough for release completion. Runtime/public-shell changes require a fresh live GitHub Pages audit. MVP release also requires native keyboard-only, screen-reader, responsive, zoom, performance, and accessibility verification.

**Manual a11y playbook:** [`docs/audits/a11y-manual-checklist.md`](../audits/a11y-manual-checklist.md) — complete before public-shell release; cite completion in the live audit doc.

**Live Pages audit template:** [`docs/audits/live-pages-audit-template.md`](../audits/live-pages-audit-template.md) — copy for each release or epic closeout.
