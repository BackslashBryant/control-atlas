# Control Atlas Public Source Policy

## Purpose

This policy decides whether a source, node, relationship, or reference may enter Control Atlas. The product is public-data-only.

## Inclusion

Sources must be public and lawfully usable. Priority goes to federal, DoD, NIST, DISA, CISA, FedRAMP, MITRE, and other open sources relevant to federal cyber compliance. Every included record must identify its owner, version, URL, access status, lifecycle, use/license notes, retrieval method, and provenance.

## Exclusion

- Restricted or authenticated content that cannot be lawfully redistributed
- User, organization, system, asset, package, finding, evidence, or scan data
- Operational-system exports or connections
- Unsupported mappings presented as official
- Vendor/community mappings without clear provenance and eligibility

## Relationship Rules

- `relationship_type` describes meaning.
- `provenance_class` describes trust basis.
- Confidence and evidence quality remain separate.
- Inferred relationships must be labeled and reproducible.
- Blocked or unsupported relationships remain graph-health findings.
- A relationship is never represented as equivalence unless the public source explicitly states equivalence.

## Access Boundary

Importers run at build time against approved public sources or lawful committed artifacts. Control Atlas does not bypass authentication, scrape around access controls, ingest runtime user artifacts, or connect to operational systems.

## Review

Every new source proposal documents eligibility, provenance, access/license status, version, canonical artifact, retrieval method, intended records, validation rules, and restricted-content handling.
