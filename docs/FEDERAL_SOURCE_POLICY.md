# Federal Source Policy

## Purpose

This policy decides whether a source, node, or relationship may enter GovFrame's primary federal integration graph.

## Inclusion Criteria

A source is eligible when at least one condition is true:

1. It is mandated by U.S. federal law, regulation, OMB policy, FISMA/RMF, FAR/DFARS, a CISA directive, a DoD program, or a federal authorization process.
2. It is published or operated by a U.S. federal agency or program.
3. It is used by federal cyber programs for authorization, assessment, configuration, vulnerability management, threat-informed defense, or validation.
4. It is referenced through an official federal artifact or program.

The registry must record the eligibility reason and the federal source or mandate that supports it.

## Exclusion Criteria

The following are excluded from the primary graph unless an official federal source references them:

- Generic OWASP, SLSA, OpenSSF, PCI, ISO, CIS, or CSA imports.
- Generic Atomic Red Team imports.
- Vendor-authored or consulting-firm crosswalks.
- Blog-post, community, or unofficial GitHub mappings.
- Commercial GRC mappings.
- Restricted content GovFrame lacks rights to redistribute.

An excluded source may be retained as a graph-health or research record, but it cannot publish graph nodes or edges.

## Source Eligibility and Provenance

Sources record a provenance class and a separate eligibility status.

- Provenance: `mandated`, `federal_published`, `federal_program`, `federal_utilized`, or `federal_referenced`.
- Eligibility status: `eligible`, `limited`, `excluded`, or `pending_review`.
- Lifecycle status: `active`, `archived`, `deprecated`, `draft`, or `restricted`.

`inferred` is not a source class. `excluded` is not a source provenance class.

## Relationship Rules

- Relationship semantics, federal provenance, confidence, and evidence quality are separate fields.
- Published federal relationships require direct source evidence.
- Federal-referenced relationships must identify the official federal reference that admits the non-federal source.
- Inferred relationships must identify the transparent rule used and display an inference warning.
- Inferred relationships never become federal-published solely because confidence is high.
- Blocked or unsupported relationships appear only in graph-health reporting.
- A mapping must not be represented as equivalence unless the source explicitly states equivalence.

## Evidence Rules

Each evidence record includes source ID, source version, locator, retrieval date, checksum where available, and evidence quality. Evidence quality may support, corroborate, challenge, or identify a candidate, but it does not replace federal provenance.

## Licensing and Access

- Record access and license/use terms for every source.
- Import only public official releases or lawfully committed artifacts.
- Do not bypass authentication or access controls.
- Do not redistribute restricted text; store metadata, citations, or lawful references instead.
- Flag restricted and archived sources in the registry and UI.

## Examples

- NIST SP 800-53 is `federal_published` and eligible.
- FedRAMP is `federal_program` and eligible.
- ATT&CK may be included as `federal_utilized` threat-informed context when the federal use relationship is evidenced.
- OWASP is excluded unless admitted through an official federal reference, in which case it is `federal_referenced`.
- DISA CCI or STIG content is eligible only from public official artifacts or lawful committed artifacts; GovFrame does not scrape authenticated sources.

## Proposal Review

Every new source proposal must document:

- Eligibility criterion and provenance class.
- Federal mandate, publisher, program, use, or reference.
- Version, lifecycle, access, and license status.
- Canonical artifact and retrieval method.
- Intended node and relationship types.
- Evidence and confidence rules.
- Restricted-content handling.
