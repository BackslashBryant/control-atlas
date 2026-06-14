# Control Atlas Roadmap

The replacement PRD defines the complete product direction. Existing working components are reused; each epic closes only its remaining gaps.

## Epic 1: Project Foundation

**Goal:** Keep a coherent, secure, static public product baseline.

**Key stories:** Align product docs and branding; enforce product boundaries; close CI/security gaps; maintain GitHub Pages deployment.

**Acceptance:** Canonical docs agree, prohibited runtime capabilities fail tests, `npm run precommit` passes, and Pages deploys.

**Reuse:** Static shell, tests, Pages workflow, package scripts.
**Dependencies:** None.
**SecDevOps:** Dependency audit, secret scanning, CodeQL, SBOM, accessibility automation, branch protection.

## Epic 2: Source Registry

**Goal:** Maintain the public-source trust backbone.

**Key stories:** Improve registry validation, source freshness, filtering, lifecycle warnings, and license/use review.

**Acceptance:** Every displayed object and relationship traces to eligible public source metadata.

**Reuse:** Schema `4.0`, registry validator, Sources view.
**Dependencies:** Epic 1.
**SecDevOps:** Validate URLs, licenses, access status, and restricted-content handling.

## Epic 3: Data Normalization Pipeline

**Goal:** Convert public sources into reproducible normalized bundles.

**Key stories:** Extend build-time importers, validators, relationship building, manifests, and graph-health reporting.

**Acceptance:** Builds are reproducible; invalid, unsupported, or non-public records are blocked.

**Reuse:** OSCAL/CCI/OLIR adapters, federal graph builder, manifests, graph-health.
**Dependencies:** Epic 2.
**SecDevOps:** Parser fixtures, schema validation, source integrity, dependency controls.

## Epic 4: Library Browser

**Goal:** Provide searchable public reference objects.

**Key stories:** Improve search, filters, stable object views, STIG/SRG references, and source context.

**Acceptance:** Users can find public objects by identifier or topic and inspect source-backed details.

**Reuse:** Search, browse, detail, source views.
**Dependencies:** Epic 3.
**SecDevOps:** No runtime ingestion or unsafe external content.

## Epic 5: Crosswalk Workbench

**Goal:** Expose public relationships and baseline comparisons.

**Key stories:** Relationship tables, provenance filters, STIG-to-CCI-to-NIST views, baseline deltas, public-reference exports.

**Acceptance:** Official and inferred mappings remain distinct and exportable.

**Reuse:** Matrix runtime/API, CSV export, graph contracts.
**Dependencies:** Epics 3-4.
**SecDevOps:** Export only public/reference data; validate relationship provenance.

## Epic 6: Template Factory

**Goal:** Generate blank reference-driven templates locally in the browser.

**Key stories:** Client-side template engine, blank starters, reference metadata, disclaimers, Markdown/CSV/JSON/YAML exports.

**Acceptance:** No user/org/system data is required, transmitted, or stored; outputs are blank/reference-only.

**Reuse:** Browser export patterns and static public bundles.
**Dependencies:** Epics 3-5.
**SecDevOps:** No network submission, storage, scoring, or completed artifact generation.

## Epic 7: Pattern Library

**Goal:** Explain common public-reference authorization patterns.

**Key stories:** Inheritance, reciprocity, shared responsibility, RMF/ATO/ATC, and failure-pattern pages.

**Acceptance:** Content is source-linked, generic, disclaimed, searchable, and avoids organization-specific decisions.

**Reuse:** Content modules, glossary, detail-card patterns.
**Dependencies:** Epics 4 and 6.
**SecDevOps:** SME review and prohibited-claim checks.

## Epic 8: Relationship Graph

**Goal:** Visualize public relationships accessibly.

**Key stories:** Object-local graph projections, filters, provenance labels, and table fallback.

**Acceptance:** Visual and text views use the same validated public graph and remain keyboard accessible.

**Reuse:** Graph bundles, D3 asset, relationship lists.
**Dependencies:** Epics 3-5.
**SecDevOps:** No runtime inference upgrades; performance and accessibility gates.

## Epic 9: QA, Accessibility, and Release Hardening

**Goal:** Deliver a stable, accessible, secure public MVP.

**Key stories:** End-to-end coverage, accessibility audit, source/content review, dependency hardening, release evidence.

**Acceptance:** Automated gates, live Pages audit, accessibility review, and security checks are green.

**Reuse:** Current contract tests, smoke checks, audit records.
**Dependencies:** All prior epics.
**SecDevOps:** Release-blocking CI/security controls and documented exceptions.

## Recommended Next Sequence

1. Close Epic 1 gaps: enforceable boundaries and missing CI/security controls.
2. Reconcile and harden the Source Registry and normalization pipeline.
3. Extend the Library Browser and Crosswalk Workbench using current runtime contracts.
4. Build the client-only Template Factory.
5. Add patterns and graph UX.
6. Complete release hardening and live audits.
