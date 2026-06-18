# Control Atlas

**Ctrl+Alt+Comply**

The public map for federal cyber compliance.

Open-source reference workbench for mapping controls, tracing frameworks, and generating blank RMF/ATO templates. This is a public-data-only application.

Control Atlas translates federal security frameworks, controls, STIGs, and
RMF artifacts into plain language — connecting what things mean, how they
relate, and what to do next. Built for small teams without dedicated
compliance staff.

Uses public NIST, DISA, FedRAMP, MITRE, and CISA data only.
No login. No evidence upload. No organizational data stored.

## What it does

- Translates controls, STIGs, and compliance terms into plain language
- Shows how frameworks, baselines, and requirements connect
- Traces every mapping back to its public source
- Generates blank RMF/ATO planning templates in your browser
- Guides you to the right starting point for your system type

## What it does not do

- Ingest evidence or process authorization packages
- Store user, organization, or system data
- Connect to eMASS, STIG Manager, or any operational system
- Determine compliance status or recommend authorization decisions
- Replace an assessor, ISSO, or AO

## Not an official government system. All mappings and templates are reference aids based on public sources.

This application has no backend.

---

## Live Site
Live site target: https://backslashbryant.github.io/control-atlas/

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
