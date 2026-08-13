# Control Atlas Data and Publisher-Structure Policy

- **Owner:** Forge and Sentinel
- **Status:** Canonical
- **Last reviewed:** 2026-08-12
- **Supersession:** Approved source or schema changes update this document, schemas, migration code, and reconciliation tests together.

## Boundary

Control Atlas ingests only lawfully usable public material. It does not accept user, organization, system, asset, scan, finding, or evidence data. Importers run at build time; the browser consumes deterministic static bundles.

Use discovery in this order: official documented API, stable official JSON, official page data, official download artifact, and explicitly invoked rendered discovery last. Required-fresh work may not silently fall back to stale data.

Every included source records owner, version, canonical URL, access status, lifecycle, use or license notes, retrieval method, provenance, checksum, byte length, and actual record count where available. Unknown upstream facts are `null` with a reason, never estimates.

## Shared ingestion lifecycle

Every catalog artifact and every Resource entry uses the same ordered lifecycle: discover, acquire, attest, parse, normalize, structure, relationships, presentation, reconcile, and publish. A source-specific adapter may combine operations, but it cannot remove a stage. Each stage must end as `complete`, `not_applicable` with a concrete reason, or `failed`.

Format-specific behavior stays inside adapters. Prefer structured official inputs such as APIs, JSON, STIX, OSCAL, XML, Excel, or CSV over extracting the same facts from PDF or prose. PDF, HTML, README, and manually reviewed locator adapters still emit the same normalized contracts and stage evidence. A manually curated external locator may mark byte acquisition and parsing not applicable, but it must still pass source attestation, normalization, presentation, reconciliation, and publication checks.

The catalog ledger covers acquired artifacts and publisher catalogs. The Resource ledger covers every Commons entry, including source-backed overview text, an explicit compatibility disposition, and attributable media or an explicit unavailable reason. `npm run verify:ingestion` must pass both ledgers.

## Containment versus relationships

Each publication has one `CatalogStructureProfile` in `src/shared/catalog-structure.mjs`. Every record has one or more acyclic containment paths rooted in its own publication. Multiple paths are allowed only when the publisher explicitly assigns the same record to multiple structural parents, such as an ATT&CK technique used by more than one tactic. Examples:

- DISA STIG: catalog → benchmark → V-ID.
- MITRE ATT&CK: catalog → tactic → technique → sub-technique.
- NIST SP 800-53: catalog → family → control → enhancement.
- NIST SP 800-53A: catalog → family → assessment procedure.

Containment is publisher-native ownership only. Baselines, applicability, assessment targets, CCIs, crosswalks, mappings, references, implementation aids, evidence expectations, and Control Atlas organization remain typed relationships. They cannot supply `parent`, `ancestors`, structural level, or depth.

Four relationship classes remain distinct:

- `structural`: publisher containment; the only class used for breadcrumbs.
- `applicability`: selections, baselines, and overlays.
- `correlation`: mappings, assessments, implementations, references, and crosswalks.
- `organizing`: Control Atlas editorial navigation above publications.

Official published relationships are visually and semantically distinct from inferred suggestions or editorial guidance.

## Source presentation

Presentation is a required ingestion stage, not a browser-only cleanup. Every generated record type has a declared presentation profile. Publisher strings remain untouched. `StructuredContentBlock` stores presentation-only offsets for paragraphs, ordered lists, unordered lists, and exact code or configuration. Explicit upstream markup wins. Deterministic detection is permitted only at high confidence; ambiguity stays prose. Copy operations use the exact source slice, not visually reconstructed text. Content without a record page must carry an explicit not-applicable presentation outcome in its ingestion ledger.

## Semantic and currentness review

`data/source-review-manifest.json` is the governed human-review register for every publication profile. Its JSON Schema is validated with the repository's existing AJV 2020 runtime. The generator requires an exact match with the catalog coverage inventory, at least three source-linked samples per profile, official currentness sources, and explicit dispositions for semantic content, locator-only content, and upstream currency. A reviewed sample proves only the named comparison; it does not promote structural or count reconciliation into whole-corpus semantic proof.

The disposition vocabulary is intentionally bounded:

- Semantic: `reviewed_no_known_mismatch`, `remediation_required`, or `blocked`.
- Locator-only: `none`, `justified`, `remediation_required`, or `blocked`.
- Currentness: `current_as_checked`, `refresh_required`, `superseded`, or `blocked`.

Known remediation remains in the generated audit and must not be converted to a passing state merely to satisfy a gate. Publisher landing pages establish publication identity; direct structured artifacts establish parser input. When those are different, both are retained and labeled.

The platform gate considered OSCAL assessment-results for this register, but rejected it because that model represents system assessment findings rather than publication-source review. JSON Schema 2020-12 plus AJV is the existing MIT-licensed, maintained, repository-native validation path and avoids a semantically false OSCAL document.

## Reconciliation gates

Builds fail on invalid or abbreviated checksums, byte or record-count disagreement, missing discovery artifacts, duplicate releases or canonical IDs, missing containment parents, undeclared duplicate parents, cycles, undeclared levels, foreign-catalog ancestors, invalid structured-content offsets, or relationship edges appearing in ancestry. `verify:discovery`, `verify:manifests`, AJV internal-schema validation, and the independent NIST OSCAL check remain separate scopes.
