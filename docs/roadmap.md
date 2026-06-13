# Federal Integration Directory Roadmap

## Active: Release 1 - Trust and RMF Backbone

Release 1 replaces the framework-neutral mapper contract with the federal integration graph while keeping the static application deployable after every issue.

1. **Issue 9 / FEDGRAPH-001 - Federal Graph Contract Vertical Migration**
   - Replace generated and runtime contracts with federal `sources`, `nodes`, `edges`, `evidence`, and `graph-health`.
   - Migrate current user journeys and federal terminology atomically.
2. **Issue 10 / FEDGRAPH-002A - RMF, Categorization, and Baseline Context**
   - Add FIPS 199, FIPS 200, SP 800-37 RMF lifecycle, and SP 800-53B baseline context.
3. **Issue 11 / FEDGRAPH-002B - Assessment and OSCAL Backbone**
   - Add SP 800-53A assessment context, canonical OSCAL ingestion, and Release 1 quality gates.

Release 1 exits when source provenance, RMF context, baseline membership, assessment procedures, and graph-health validation are source-backed and usable through the static application.

## Release 2 - Federal Program Context

Add CUI, SP 800-171, SP 800-172, CMMC, and FedRAMP program relationships. Program labels and relationships must remain distinct and source-backed.

## Release 3 - Implementation and Vulnerability Context

Add federal vulnerability and known-exploited enrichment, SCAP and National Checklist Program metadata, and lawful public DISA STIG/SRG/CCI implementation context. GovFrame will not become a general vulnerability search engine.

## Release 4 - Threat, Defense, and Validation Context

Add ATT&CK, D3FEND, and Caldera only as federal-utilized threat, defensive, and validation context. These relationships must never be presented as compliance or audit evidence by themselves.

## Release 5 - Integration Graph and Discovery UX

Deliver layered integration graph projections, federal catalogue discovery, actionable empty states, source-backed insights, and federal-context detail sections.

## Release 6 - Citation, Export, and Governance

Standardize relationship citations, add audit-friendly CSV and JSON graph exports, add import manifests and reproducible diffs, and enforce graph-quality governance.

JSON graph export is intentionally reopened for Release 6 and is not part of Release 1.

## Cross-Cutting Exit Criteria

- Every node and displayed edge has source-backed provenance.
- Inferred relationships cannot be mistaken for federal-published relationships.
- Restricted content is not redistributed.
- Static artifact size and first-interaction performance remain documented.
- Graph and relationship views have keyboard-accessible text equivalents.
- Native keyboard-only, screen-reader, responsive, zoom, performance, and live-site browser audits are completed before a release is called complete.
