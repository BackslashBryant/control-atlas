# Data Sources And Evidence

`data/source-registry.json` is the source policy contract (schema `3.0`).

## Tier vs authority_type

GovFrame may register many sources. `tier` describes trust level; `authority_type` describes what a source is allowed to do.

| Tier | Typical authority_type | Can publish catalog items | Can publish direct mappings |
| --- | --- | --- | --- |
| Gold | `catalog_authority` | Yes | No |
| Gold | `mapping_authority` | No | Yes |
| Silver | `corroboration` | No | No (corroborate only) |
| Bronze | `research_candidate` | No | No (candidate only) |

- Gold sources are official issuing-authority artifacts and decide canonical truth for their lane.
- Silver sources are credible maintained crosswalks or alternate representations that corroborate or warn.
- Bronze sources support discovery and research leads only.
- Gold-supported claims may publish with visible silver or bronze evidence gaps.
- Conflicting gold evidence blocks a mapping.
- Conflicting silver evidence publishes with warnings.

## Publication states

- **Direct** — a published mapping backed by at least one gold `mapping_authority` source.
- **Calculated** — a multi-hop path composed from published direct mappings; each hop exposes evidence.
- **Candidate** — bronze-only or manual research leads exported to `data/generated/candidates.json`, never `mappings.json`.
- **Blocked** — assertions that fail publication rules (for example `catalog_source_used_for_crosswalk`, missing mapping authority, or conflicting gold evidence).

Every published assertion records source artifact, locator, snapshot date, checksum when available, agreement status, authority type, and evidence gaps.

## Source-count policy

- Many gold catalog sources are fine.
- Gold catalog sources create items, not crosswalks.
- Gold mapping-authority sources publish direct mappings.
- Silver sources corroborate or warn.
- Bronze sources create candidate leads only.

## Catalog Scope

- NIST SP 800-53 Rev. 5, NIST SP 800-171 Rev. 3, NIST CSF 2.0, NIST AI RMF Playbook, NIST SSDF tasks, and DISA CCIs are normalized from official machine-readable artifacts.
- FedRAMP publishes four official Rev. 5 baseline identities. GovFrame does not claim that these identities are complete baseline control profiles.
- CMMC publishes the three official program levels from 32 CFR 170.14. GovFrame does not substitute NIST SP 800-171 Rev. 3 for CMMC Level 2's referenced Revision 2 requirements.
- DoD RAI publishes the eleven publicly described toolkit focus principles and SHIELD activities.
- Items remain searchable even when no gold-supported direct mapping exists.

## CCI Source Contract

Control Correlation Identifiers are imported from the official DISA CCI List as their own complete catalog. CCI-to-NIST SP 800-53 Revision 5 mappings are derived from references inside that list via the `disa-cci-nist-references` mapping authority. STIG catalogs are neither required for those mappings nor treated as a synonym for CCI.

## OLIR preference

Owner-authority NIST OLIR and supplemental mappings (`nist-csf-53-supplemental`, `nist-csf11-csf20-crosswalk`, `nist-800-171-oscal-mappings`) replace manual seed crosswalks. Manual seeds must not appear in published mappings.

Generated dataset schema version: `2.1`.
