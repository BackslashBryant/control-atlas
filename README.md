# Control Atlas

**Public maps and templates for federal cyber compliance**

Control Atlas is a static, open-source, public-data-only reference and template workbench. It helps practitioners browse federal cyber sources, inspect provenance-aware relationships, compare public baselines and mappings, and eventually generate blank reference templates locally in the browser.

The repository and deployment URL retain the legacy name **GovFrame** for compatibility. GovFrame is an internal/repository identifier, not the public product direction. Broad path, package, import, or deployment renames require a separate migration plan.

Live site: https://backslashbryant.github.io/GovFrame/

## Product Boundary

Control Atlas may use and normalize public sources at build time, display public controls and mappings, and generate blank/public-reference exports in the browser.

Control Atlas does not ingest evidence, accept user uploads, connect to operational systems, store user/organization/system data, score compliance, track real assets or packages, make authorization decisions, or require login. It has no backend.

## Current Reusable Foundation

- Public source registry with access, lifecycle, provenance, and eligibility metadata
- Build-time importers and normalizers for public federal data
- Validated static `sources`, `nodes`, `edges`, `evidence`, and `graph-health` bundles
- Browser-only search, browse, comparison, source inspection, and CSV export
- Provenance, confidence, evidence-quality, accessibility, and graph-health tests
- GitHub Pages deployment and nightly public-data refresh

See `docs/PRD.md`, `docs/architecture/ARCHITECTURE.md`, `docs/roadmap.md`, and `docs/inventory/repository-inventory.md`.

## Commands

```text
npm run build:data
npm test
npm run test:browser
npm run audit:coverage
npm run verify:public
npm run precommit
```

## Disclaimer

Control Atlas is an open-source reference and template-generation tool based on public sources. It is not an official government system and does not make authorization, compliance, assessment, or risk acceptance decisions. Mappings and templates are reference aids only. Official decisions remain with the applicable Authorizing Official, agency, assessor, program office, or governing authority.
