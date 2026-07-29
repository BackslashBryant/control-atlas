# Control Atlas

**Ctrl+Alt+Trace · Search · Explore · Compare · Build**

Control Atlas is a public, no-account workbench for finding, reading, comparing, and tracing federal cybersecurity material back to its source.

Uses public NIST, DISA, FedRAMP, MITRE, and CISA data only.
No login. No evidence upload. No organizational data stored.

Control Atlas organizes the material. The team doing the work decides applicability and baseline selection, and owns compliance, inheritance, authorization, and ATO conclusions.

## Source-First Product Standard

Future work must preserve this order:

1. Exact publication identity and official source text
2. Publisher-declared hierarchy
3. Labeled, source-traceable relationships
4. Concrete retrieval, comparison, navigation, or document action
5. Product-authored notes and limitations
6. Raw technical detail on demand

## What it does

- Finds published records by identifier or topic
- Shows exact publisher, publication, official text, and declared structure
- Traces published and candidate relationships with their provenance
- Compares records through explicitly selected published mapping sources
- Generates blank starter documents from explicitly selected inputs
- Lists external tools, templates, data, training, and communities with owner and provenance

## What it does not do

- Ingest evidence or process authorization packages
- Store user, organization, or system data
- Connect to eMASS, STIG Manager, or any operational system
- Determine applicability, baselines, compliance, inheritance, authorization, or ATO outcomes
- Replace a practitioner, assessor, ISSO, responsible authority, or AO

## Independent, open-source, and not an official government system

Mappings and starter documents are based on public sources, with their owners
and limitations attached.

This application has no backend.

---

## Live Site
Live site target: https://backslashbryant.github.io/control-atlas/

## Current Reusable Foundation

- Static GitHub Pages deployment with a React + Vite translation-first shell
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
