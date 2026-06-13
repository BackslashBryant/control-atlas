# Architecture

GovFrame is a static, provenance-aware federal security control integration graph.

## Build Flow

1. Independent source adapters retrieve or read approved public artifacts.
2. Source manifests record version, retrieval date, method, checksum, access, license, and files produced.
3. Normalizers emit canonical sources, nodes, edges, and evidence.
4. Validators enforce federal eligibility, provenance, relationship semantics, confidence, evidence, and restricted-content rules.
5. The build emits static graph artifacts and a graph-health report.
6. The browser runtime queries validated artifacts without a backend.

## Canonical Contracts

### Source

A `Source` records identity, owner, federal provenance class, mandate basis, version, retrieval metadata, access/license status, lifecycle status, artifact type, and graph eligibility.

Primary graph source classes are:

- `mandated`
- `federal_published`
- `federal_program`
- `federal_utilized`
- `federal_referenced`

`excluded` is an eligibility status, not a source class. `inferred` is never a source class.

```json
{
  "id": "nist-sp-800-53-r5",
  "name": "NIST SP 800-53 Rev. 5",
  "owner": "NIST",
  "provenance_class": "federal_published",
  "mandate_basis": ["FISMA", "FIPS 200"],
  "version": "Rev. 5",
  "retrieved_at": "YYYY-MM-DD",
  "retrieval_method": "download",
  "artifact_url": "https://example.gov/artifact",
  "artifact_type": "oscal_json",
  "checksum": "sha256:...",
  "access_status": "public",
  "license_or_use": "public federal publication",
  "lifecycle_status": "active",
  "eligibility_status": "eligible",
  "federal_referenced_by": []
}
```

Allowed values:

- `retrieval_method`: `download`, `api`, `committed_artifact`, or `manual_review`.
- `artifact_type`: `publication`, `spreadsheet`, `oscal_json`, `oscal_xml`, `api`, `stix`, `xccdf`, or `other`.
- `access_status`: `public`, `restricted`, or `authenticated`.
- `eligibility_status`: `eligible`, `limited`, `excluded`, or `pending_review`.
- `lifecycle_status`: `active`, `archived`, `deprecated`, `draft`, or `restricted`.

### Node

A `Node` records a stable ID, type, label, defining source ID, lifecycle status, and type-specific metadata. Node types may include controls, requirements, baselines, programs, RMF steps, assessment objectives, checks, vulnerabilities, threat context, defensive techniques, validation paths, and evidence sources.

```json
{
  "id": "nist-800-53:AC-2",
  "node_type": "control",
  "label": "AC-2 Account Management",
  "source_id": "nist-sp-800-53-r5",
  "lifecycle_status": "active",
  "metadata": {
    "family": "Access Control"
  }
}
```

Allowed `node_type` values are `control`, `control_enhancement`, `requirement`, `family`, `impact_category`, `baseline`, `program`, `rmf_step`, `assessment_objective`, `assessment_procedure`, `implementation_check`, `vulnerability`, `weakness`, `product`, `threat_context`, `defensive_technique`, `validation_path`, and `evidence_source`.

### Edge

An `Edge` records source and target node IDs, `relationship_type`, `provenance_class`, `confidence`, publication status, evidence IDs, display label, and warning.

- `relationship_type` describes semantics, such as `defines`, `maps_to`, `includes`, `implements`, `assesses`, `validates`, `mitigates`, `detects`, or `references`.
- `provenance_class` describes why GovFrame may display the relationship: `mandated`, `federal_published`, `federal_program`, `federal_utilized`, `federal_referenced`, or `inferred`.
- `confidence` describes support strength: `direct`, `derived`, `inferred_high`, `inferred_medium`, or `inferred_low`.
- Blocked relationships are graph-health findings and are not displayable graph edges.

```json
{
  "id": "edge:fedramp-moderate-includes-ac-2",
  "source_node_id": "fedramp:moderate",
  "target_node_id": "nist-800-53:AC-2",
  "relationship_type": "includes",
  "provenance_class": "federal_program",
  "confidence": "direct",
  "publication_status": "published",
  "evidence_ids": ["evidence:fedramp-moderate-ac-2"],
  "display_label": "FedRAMP Moderate includes AC-2",
  "warning": null,
  "inference_rule_id": null
}
```

Allowed `relationship_type` values are `mandates`, `defines`, `drives`, `uses`, `selects`, `includes`, `customizes`, `maps_to`, `related_control`, `inherits`, `implements`, `assesses`, `validates`, `mitigates`, `detects`, `references`, `applies_to`, and `represented_by`.

Allowed `publication_status` values are `published` and `candidate`. Candidate edges must use `provenance_class: inferred`, an inferred confidence value, a warning, and an `inference_rule_id`. Blocked relationships are not edges.

### Evidence

`Evidence` records source ID, source version, locator, retrieval date, checksum, and evidence quality. Existing gold/silver/bronze values may migrate into internal evidence-quality values, but they are not the primary user-facing federal trust model.

```json
{
  "id": "evidence:fedramp-moderate-ac-2",
  "source_id": "fedramp-rev5-baselines",
  "source_version": "Rev. 5",
  "locator": "Moderate baseline / AC-2",
  "retrieved_at": "YYYY-MM-DD",
  "checksum": "sha256:...",
  "evidence_quality": "primary"
}
```

Allowed `evidence_quality` values are `primary`, `corroborating`, `contextual`, and `candidate`.

## Generated Contract

Issue 9 replaces the current generated schema with:

- `sources.json`
- `nodes.json`
- `edges.json`
- `evidence.json`
- `graph-health.json`

The source registry remains at `data/source-registry.json` and moves to `schema_version: "4.0"`. Every generated graph artifact uses `schema_version: "1.0"` and a top-level `generated_at` timestamp. Collection fields are named `sources`, `nodes`, `edges`, `evidence`, and `findings` respectively.

Every graph-health finding records `id`, `finding_type`, `severity`, `source_id`, `subject_id`, and `message`. Allowed severity values are `error`, `warning`, and `info`.

The replacement is intentionally breaking. Issue 9 must migrate the build, runtime, current UI journeys, tests, and generated artifacts together so the static site remains deployable.

## Runtime Boundaries

- Search and browse operate on nodes and source metadata.
- Detail views group edges by federal context and expose evidence-first explanations.
- Graph projections derive only from publishable edges.
- Inferred candidates are queried separately and clearly labeled.
- No runtime path may upgrade evidence quality or infer federal provenance.

## Non-Functional Constraints

- Static GitHub Pages, no backend or user storage.
- Lazy-load large graph projections.
- Provide text alternatives for visual graph content.
- Preserve lawful access and redistribution boundaries.
