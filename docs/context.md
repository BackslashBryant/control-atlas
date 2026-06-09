# Context Handoff

## Current Objective

Issue 8 rebuilds GovFrame as a framework-neutral federal and DoD mapper.

## Current Architecture

- `scripts/build-framework-data.mjs` normalizes retained catalogs and mapping assertions.
- `scripts/lib/framework-engine.mjs` reconciles evidence, builds bounded paths, and creates matrices.
- `data/generated/` contains the public static catalog, evidence, paths, mappings, and coverage.
- `app/runtime.mjs` exposes the public behavioral API.
- `app/app.mjs` renders Search, Map Frameworks, Browse, Sources, and item exploration.

## Important Product Rules

- Control Correlation Identifiers are bridge requirements, not a synonym for STIGs.
- The complete official CCI List is a first-class catalog; its NIST references are direct CCI-to-control mappings.
- Full STIG ingestion is not a product goal; technical requirements appear only when mappable and evidenced.
- Gold sources decide publishable mappings.
- Silver and bronze gaps remain visible.
- Direct mappings and calculated paths must never be conflated.

## Current Limitations

Several registry entries are explicitly partial or source-gap status. Coverage reports are authoritative; do not claim full framework coverage until adapters and source evidence support it.
