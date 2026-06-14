# Control Atlas

**Ctrl+Alt+Comply**

**The public map for federal cyber compliance.**

Open-source reference workbench for mapping controls, tracing frameworks, and generating blank RMF/ATO templates - no login, no evidence upload, no organizational data required.

Control Atlas is a static, open-source, public-data-only reference workbench built on the adopted Control Atlas implementation baseline. It helps practitioners browse public federal and DoD compliance references, inspect provenance-aware relationships, compare frameworks and baselines, and prepare blank planning templates locally in the browser.

The repository and package identity now align with Control Atlas. Epic 0 preserves the current static runtime contract while removing the old GovFrame compatibility stance from active product surfaces.

Live site target: https://backslashbryant.github.io/control-atlas/

## Product Boundary

Control Atlas may normalize public sources at build time, publish static public data bundles, surface provenance-aware mappings, and generate blank/public-reference outputs entirely in the browser.

Control Atlas does not ingest evidence, accept user uploads, connect to operational systems, store user, organization, or system data, score compliance, track real assets or packages, or require login. It has no backend.

## Current Reusable Foundation

- Static JavaScript shell already deployed to GitHub Pages
- Build-time public-data importers, normalizers, and validators under `scripts/`
- Stable public runtime bundles: `sources`, `nodes`, `edges`, `evidence`, and `graph-health`
- Browser-only search, browse, comparison, source inspection, and CSV export behavior
- Current D3-based relationship visualization foundation for the Epic 0 provenance filter surface and later roadmap work
- Contract, browser, runtime, and data tests enforcing the public-data-only boundary

See `docs/PRD.md`, `docs/architecture/ARCHITECTURE.md`, `docs/roadmap.md`, `docs/inventory/repository-inventory.md`, and `docs/PRODUCTION_READINESS.md`.

## Commands

```text
npm run build:data
npm run audit:deps
npm run sbom:generate
npm test
npm run test:browser
npm run audit:coverage
npm run verify:public
npm run precommit
```

## Disclaimer

Control Atlas is an open-source reference tool. It is not an official government system and does not make authorization, compliance, assessment, or risk acceptance decisions. Mappings and templates are reference aids only. Official decisions remain with the applicable Authorizing Official, agency, or program office.
