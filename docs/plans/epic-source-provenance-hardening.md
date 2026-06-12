## Backlog: GovFrame source coverage, evidence quality, and mapping correctness hardening

### Context

GovFrame has the right skeleton: a static build pipeline, normalized framework items, mapping assertions, evidence reconciliation, calculated paths, and coverage artifacts. But the backend currently feels half done because source ingestion and crosswalk completeness are too narrow.

Today, `build-framework-data.mjs` defines nine supported frameworks but only loads three direct map files into the published mapping pipeline: `800-53-to-csf.json`, `800-53-to-800-171.json`, and `cci-to-800-53.json`.  The map builder also attaches a single source ID from the static `MAPS` array when relationship-level evidence is missing, which can make hand-seeded mappings look more authoritative than they really are. 

The evidence engine is strict in a good way: mappings without gold evidence are blocked, and published mappings show missing silver/bronze tiers as evidence gaps.  But the source registry and adapters need to catch up, because right now several “gold” mappings are really manual seeds with weak provenance.

This work should follow the project’s core engineering principles: keep responsibilities separated, avoid duplicated source logic, prefer simple ingestion adapters over custom one-off parsing, and add only the data pathways we can verify. 

---

## Source research findings

### Primary / Gold candidates

Use **Gold** only when the source is the issuing authority for the catalog or the issuing/owner authority for the mapping.

NIST’s OLIR / Informative Reference program is the biggest missing source. NIST says the OLIR catalog contains all Reference Data, including Informative References and Derived Relationship Mappings, and that final versions have completed public comment. It also explicitly tells federal civilian users to prefer government-authored “Owner Authority” mappings first, then other agency mappings, then third-party mappings. ([NIST Computer Security Resource Center][1])

The NIST CSF 2.0 Informative References page exposes downloadable CSF 2.0 reference data, browse/catalog tools, comparison reports, and recent mappings including CSF 2.0 to SP 800-53 Rev. 5.2.0 and CSF 2.0 to SP 800-171 Rev. 3. ([NIST][2])

NIST SP 800-53 Rev. 5 is a gold catalog source and also has official supplemental mappings/crosswalks. NIST warns that mappings are not always one-to-one and should not be treated as direct equivalence, which should become a backend rule. ([NIST Computer Security Resource Center][3])

NIST SP 800-53B is the gold source for federal low/moderate/high/privacy baselines and includes a control baselines spreadsheet plus OSCAL material. ([NIST Computer Security Resource Center][4])

NIST SP 800-171 Rev. 3 is the gold source for CUI requirements in nonfederal systems; the current publication page also links supplemental material such as the Rev. 2 to Rev. 3 change analysis, CUI overlay, and CPRT dataset. ([NIST Computer Security Resource Center][5])

NIST AI RMF and the official AI RMF Playbook are gold sources for AI RMF outcomes and actions. The AIRC page states that the AI RMF core is organized around Govern, Map, Measure, and Manage, and the playbook JSON provides structured outcome records. ([NIST AI Resource Center][6])

NIST SSDF SP 800-218 is the gold source for SSDF practices and includes an official table in Excel. ([NIST Computer Security Resource Center][7])

DoD CIO is a gold source for CMMC program structure. It currently states that CMMC Level 1 aligns to FAR 52.204-21, Level 2 verifies compliance with 110 NIST SP 800-171 Rev. 2 requirements, and Level 3 includes 24 selected NIST SP 800-172 requirements. ([Defense CIO][8])

FedRAMP Rev. 5 documents and templates are a gold source for FedRAMP baselines and package artifacts. ([FedRAMP][9])

DISA CCI is already a good gold source for CCI identity and CCI-to-NIST references, but the current regex XML parser should be hardened before we rely on it as a long-term ingestion path.  

### Silver candidates

Use **Silver** for recognized maintainers, standards bodies, nonprofits, and government-adjacent references that corroborate or enrich gold sources but are not the issuing authority for both sides of a mapping.

CIS Controls are a strong silver source for control context and external corroboration. CIS says the Controls are mapped to and referenced by multiple legal, regulatory, and policy frameworks, and CIS v8.1 is the current download called out on their page. ([CIS][10])

MITRE’s `cis-cci-mappings` repository is a useful silver source for CIS Controls to DISA CCI / NIST SP 800-53 Rev. 5 mappings. It should corroborate CCI paths, not override DISA or NIST. ([GitHub][11])

Third-party OLIR mappings should normally be silver, not gold, unless the submitter is the owner authority for that mapping. NIST explicitly says it does not conduct correctness testing on non-NIST submitted mappings and listing does not imply NIST endorsement. ([NIST][2])

### Bronze candidates

Use **Bronze** for research leads only: community GitHub issues, Reddit posts, manual seeds, blogs, old spreadsheets, LLM-generated suggestions, and internal notes. Bronze should never create a published direct mapping by itself.

---

# Proposed backlog item

## Title

Harden GovFrame backend source ingestion, evidence tiering, and crosswalk completeness

## Priority

P0 for provenance correctness. P1 for expanded coverage.

## Goal

Make GovFrame trustworthy by expanding official source ingestion, fixing mapping evidence attribution, and preventing manual or weakly sourced mappings from appearing as gold-backed direct matches.

## Scope

Backend/data pipeline only:

* `data/source-registry.json`
* `scripts/fetch-*`
* `scripts/lib/*-adapter.mjs`
* `scripts/lib/framework-engine.mjs`
* `maps/*.json`
* `data/generated/*.json`
* tests and audits

No product redesign in this ticket.

---

## Work items

### 1. Redesign source registry semantics

Current tiering is too coarse. Add fields that distinguish **who owns the catalog**, **who owns the mapping**, and **what validation level the source has**.

Add fields like:

```json
{
  "id": "nist-olir-csf2-to-sp800-53",
  "tier": "gold",
  "authority_type": "owner_authority_mapping",
  "issuer": "NIST",
  "status": "final",
  "artifact": "...",
  "license_notes": "...",
  "frameworks": ["csf-2", "nist-800-53"],
  "refresh_strategy": "download",
  "parser": "olir-xlsx"
}
```

Acceptance criteria:

* No source can be tiered gold without an explicit `authority_type`.
* Manual seed files must be `bronze` or `candidate` by default.
* Third-party OLIR mappings are silver unless the submitter is the owner authority.
* Source metadata includes artifact URL, snapshot date, checksum, status, parser name, and license/use notes.
* Tests fail if a source lacks required provenance fields.

Principles: SRP, DRY, KISS.

---

### 2. Implement NIST OLIR / CSF Informative Reference ingestion

Build a new adapter for NIST OLIR / CSF 2.0 Informative References.

Minimum datasets to ingest first:

* CSF 2.0 to SP 800-53 Rev. 5.2.0
* CSF 2.0 to SP 800-171 Rev. 3
* Any owner-authority NIST CSF 2.0 mappings available through OLIR
* Final government-authored OLIR mappings before third-party mappings

Acceptance criteria:

* Adapter downloads source files instead of relying on hand-seeded relationships.
* Records OLIR status: final, draft, preliminary draft, work-in-progress.
* Records owner/submitter and authority type.
* Preserves relationship direction and relationship type.
* Does not treat OLIR relationships as equivalence unless the source explicitly says so.
* Adds tests using fixture XLSX/CSV samples.
* Generated coverage report includes mapping counts by OLIR source and status.

Principles: OCP, DRY, Convention over Configuration.

---

### 3. Correct current mapping evidence attribution

Audit every file in `maps/`.

Immediate issue: `800-53-to-800-171.json` has only three manual relationships and the build script assigns `nist-oscal` as the evidence source for that map.   OSCAL is a catalog format/source, not automatically a crosswalk authority.

Acceptance criteria:

* Remove any default that upgrades a map to gold because the catalog came from a gold source.
* Require relationship-level evidence or a map-level `source_artifact` that actually supports the mapping.
* Convert unsupported manual maps to `candidate` status until corroborated.
* Keep candidate maps available for research export, but do not publish them as direct official mappings.
* Add a test that fails if a mapping source is a catalog-only source but the assertion is a crosswalk.

Principles: correctness over convenience, SRP, Law of Demeter.

---

### 4. Expand framework catalog coverage from official sources

Add or improve adapters for:

* NIST SP 800-53 Release 5.2.0 catalog and supplemental changes
* NIST SP 800-53B baselines
* NIST SP 800-171 Rev. 3 and related supplemental datasets
* NIST SP 800-172 / 172A where useful for CMMC Level 3 context
* FedRAMP Rev. 5 baselines
* CMMC Level 1 / 2 / 3 structures from DoD sources
* NIST AI RMF Playbook
* NIST SSDF SP 800-218 table and OSCAL catalog

Acceptance criteria:

* Every supported framework has a first-class catalog adapter or is explicitly marked `limited-public-scope`.
* Limited-scope frameworks show why they are limited.
* CMMC backend clearly distinguishes Rev. 2 vs Rev. 3 dependencies.
* FedRAMP baselines include actual baseline membership where public files allow it, not only high-level names.
* Coverage reports distinguish catalog coverage from mapping coverage.

Principles: KISS, YAGNI, explicit boundaries.

---

### 5. Harden relationship semantics and path logic

The engine already avoids `related_to` in calculated paths and caps paths at three hops.  Keep that, but add relationship compatibility rules.

Acceptance criteria:

* Define which relationship types can compose in multi-hop paths.
* Do not compose relationships that would imply false equivalence.
* Add directionality rules.
* Add confidence labels for paths: direct, derived, candidate, blocked.
* Matrix export must include every hop’s source, not just the item chain.
* Tests cover examples like:

  * CSF → 800-53 → CCI
  * 800-171 → 800-53 → CSF
  * CMMC Level 2 → 800-171 Rev. 2, with no fake Rev. 3 implication

Principles: correctness, Law of Demeter, least surprise.

---

### 6. Replace regex XML parsing for DISA CCI

Current `cci-adapter.mjs` parses XML with regular expressions.  This is fragile for a source GovFrame treats as gold.

Acceptance criteria:

* Replace regex parsing with a real XML parser.
* Validate CCI count, publish date, version, and checksum.
* Preserve all NIST references, not only the current normalized target.
* Add fixtures for:

  * control enhancements
  * multiple references
  * retired/draft statuses
  * malformed XML
* Add a diff report when DISA publishes a new CCI list.

Principles: robustness, KISS, explicit validation.

---

### 7. Upgrade coverage audit from smoke test to quality gate

Current `audit-coverage.mjs` only verifies that coverage exists, at least one framework has catalog items, and at least one mapping is published.  That is too weak.

Acceptance criteria:

* Fail build if any active framework has zero catalog items.
* Fail build if any gold source has missing checksum/snapshot.
* Warn, not fail, on intentionally limited-public-scope frameworks.
* Report:

  * catalog item count by framework
  * direct mapping count by framework pair
  * calculated path count by framework pair
  * blocked assertion count by reason
  * candidate assertion count by source
  * stale source count
* Add a generated `source-health.json`.

Principles: feedback loops, DRY, operational reliability.

---

### 8. Add source abundance without source confusion

We want many sources, but the backend must keep them separated.

Rules:

* Gold can publish direct mappings.
* Silver can corroborate, enrich, or challenge.
* Bronze can suggest candidates only.
* Conflicting gold blocks publication.
* Conflicting silver creates a warning.
* Bronze never upgrades a mapping.

Acceptance criteria:

* Evidence model supports multiple evidence entries per assertion.
* Conflict handling is tested across all tiers.
* UI/export data can explain why a mapping is official, corroborated, candidate, or blocked.
* No mapping is published with only bronze or manual evidence.

Principles: SRP, correctness, transparency.

---

## Candidate source backlog

### Gold

* NIST OSCAL content
* NIST SP 800-53 Rev. 5.2.0
* NIST SP 800-53B baselines
* NIST CSF 2.0 Informative References / OLIR owner-authority mappings
* NIST SP 800-171 Rev. 3
* NIST SP 800-172 / 172A
* DISA CCI List
* FedRAMP Rev. 5 baselines
* DoD CIO CMMC sources
* NIST AI RMF / AIRC Playbook
* NIST SSDF SP 800-218

### Silver

* MITRE CIS/CCI mappings
* CIS Controls official resources
* Government-authored OLIR that is not the owner authority
* Third-party final OLIR with clear submitter metadata
* CSA CCM, OWASP, SAFECode, and similar sources where licensing permits

### Bronze

* Manual seed mappings
* Community GitHub issues
* Reddit posts
* Blog posts
* LLM-generated suggestions
* Analyst notes without official citations

---

## Definition of done

* `npm run refresh:data` fetches official catalogs and crosswalks, records checksums, and builds reproducible generated artifacts.
* No hand-seeded relationship is published as gold without real source evidence.
* Coverage artifacts show source freshness, blocked mappings, evidence gaps, and mapping counts by framework pair.
* Tests cover catalog adapters, source tiering, reconciliation, path composition, matrix export, and source-health reporting.
* Documentation explains exactly what Gold, Silver, Bronze, Candidate, Direct, and Calculated mean.
* Backward-compatible generated JSON is maintained or a schema migration note is added.

## Suggested sequencing

1. Fix source registry semantics and provenance validation.
2. Downgrade weak manual mappings to candidates.
3. Add NIST OLIR ingestion.
4. Expand 800-53B, FedRAMP, CMMC, and 800-171 source adapters.
5. Harden CCI parsing.
6. Upgrade coverage audit.
7. Rebuild generated data and review coverage deltas.

[1]: https://csrc.nist.gov/projects/olir/informative-reference-catalog "National Online Informative References Program | CSRC"
[2]: https://www.nist.gov/cyberframework/informative-references "CSF 2.0 Informative References | NIST"
[3]: https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final "SP 800-53 Rev. 5, Security and Privacy Controls for Information Systems and Organizations | CSRC"
[4]: https://csrc.nist.gov/pubs/sp/800/53/b/upd1/final "SP 800-53B, Control Baselines for Information Systems and Organizations | CSRC"
[5]: https://csrc.nist.gov/pubs/sp/800/171/r3/final "SP 800-171 Rev. 3, Protecting Controlled Unclassified Information in Nonfederal Systems and Organizations | CSRC"
[6]: https://airc.nist.gov/AI_RMF_Knowledge_Base/AI_RMF "AI RMF - AIRC"
[7]: https://csrc.nist.gov/pubs/sp/800/218/final "SP 800-218, Secure Software Development Framework (SSDF) Version 1.1: Recommendations for Mitigating the Risk of Software Vulnerabilities | CSRC"
[8]: https://dodcio.defense.gov/CMMC/About/ "CIO - About CMMC"
[9]: https://www.fedramp.gov/rev5/documents-templates/ "Rev5 Documents Templates"
[10]: https://www.cisecurity.org/controls/v8 "CIS Critical Security Controls Version 8"
[11]: https://github.com/mitre/cis-cci-mappings "GitHub - mitre/cis-cci-mappings: Authoritative mappings from CIS Controls to DISA CCI and NIST SP 800-53 Rev 5 for compliance automation · GitHub"
