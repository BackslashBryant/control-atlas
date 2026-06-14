# Control Atlas Context Handoff

## Current Objective

Align and extend Control Atlas as a static, open-source, public-data-only reference and template workbench. The current priority is Epic 1 foundation hardening before major new features.

## Adopted Baseline

- The current static JavaScript app, build-time public-data importers, source registry schema `4.0`, and generated graph contract are retained.
- Public-facing branding is Control Atlas. GovFrame remains a legacy repository/internal/deployment identifier until a separately planned migration.
- Existing search, browse, source inspection, comparison, provenance, evidence, and accessibility behavior is reusable.
- Historical Issue 8-12 plans document prior deliveries but no longer define the active roadmap.

## Product Boundary

Control Atlas is public-data-only and has no backend. It may normalize public sources at build time and generate blank/public-reference exports locally in the browser.

It must not ingest evidence, accept uploads, connect to operational systems, store user/org/system data, score compliance, track real assets or packages, make authorization decisions, or require login.

## Next Sequence

1. Close missing CI/security and boundary-enforcement gaps.
2. Harden source registry and normalization.
3. Extend library and crosswalk experiences.
4. Add client-only blank template generation.
5. Add pattern and graph experiences.
6. Complete release hardening.
