# GovFrame Framework Mapper

GovFrame is a static, public mapper for federal and DoD cybersecurity frameworks. It helps practitioners start from any supported requirement or control, inspect direct sourced mappings, and follow clearly labeled calculated paths without losing provenance.

Live site: https://backslashbryant.github.io/GovFrame/

## Product Contract

- Search any supported framework catalog by identifier, title, or text.
- Explore direct mappings before calculated multi-hop paths.
- Treat Control Correlation Identifiers as granular bridge requirements where sourced mappings exist.
- Import CCI identity and CCI-to-NIST references from the official DISA CCI List, independently of STIG catalogs.
- Build and export source-to-target mapping matrices.
- Keep complete catalogs searchable where authoritative public data is available, including unmapped items.
- Show honest catalog coverage, evidence gaps, conflicts, and source freshness.
- Remain static, browser-only, no-auth, and no-telemetry.

## Evidence Rules

- Gold issuing-authority sources decide canonical records and publishable mappings.
- Silver and bronze sources corroborate, enrich, and identify discrepancies.
- Gold-supported mappings publish with visible evidence gaps when corroboration is unavailable.
- Calculated paths preserve every direct hop and never imply direct equivalence.

## Commands

```text
npm run build:data
npm test
npm run test:browser
npm run audit:coverage
npm run verify:public
npm run precommit
```

Generated public artifacts live under `data/generated/`. The source registry is `data/source-registry.json`.
