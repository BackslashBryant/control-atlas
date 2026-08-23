# Control Atlas Taxonomy Contract

- **Owner:** Control Atlas data stewardship
- **Status:** Canonical contract; coverage remains partial
- **Contract version:** 2.0.0
- **Last reviewed:** 2026-08-23
- **Supersession:** A later contract version must migrate stable tag IDs and update the generated coverage report in the same change.

## Purpose and boundary

The governed taxonomy supports discovery. It does not create relationships, endorsements, or applicability claims from incidental prose. Publisher classifications, Control Atlas evidence-backed facets, and editorial navigation concepts remain separate layers.

Term definitions are governed in `data/curated/taxonomy-terms.json`. Behavioral rules (source_basis, filter semantics, applicability resolution) remain in `src/shared/taxonomy-contract.mjs`. The reproducible corpus report is `data/generated/taxonomy-coverage.json`.

## Layers

| Layer | Meaning | May establish record applicability? |
| --- | --- | --- |
| `publisher` | A publisher-declared family, catalog scope, classification, or identifier. | Yes, when the declared source field and rule are retained. |
| `atlas_evidence` | A Control Atlas facet derived from a reviewed structured field and an approved deterministic rule. | Yes, within the rule's stated scope. |
| `editorial` | A navigation or orientation concept. | No. Editorial concepts require a separate governed evidence rule before becoming record tags. |

Assignment provenance remains explicit. A `publisher` assignment belongs to the publisher layer. An `inferred` assignment belongs to the `atlas_evidence` layer and must retain the exact structured field and deterministic rule that produced it.

## Dimensions

| Dimension | Label | Entity scope | Assignment status |
| --- | --- | --- | --- |
| `asset_class` | Asset Class | record, resource, template, playbook, export | Active — rules in record-taxonomy.mjs |
| `environment` | Environment | record, resource, template, playbook, export | Active — rules in record-taxonomy.mjs |
| `technology` | Technology | record, resource, template, playbook, export | Active — rules in record-taxonomy.mjs |
| `vendor_brand` | Vendor / Brand | record, resource, template, playbook, export | Active — rules in record-taxonomy.mjs |
| `product` | Product | record, resource, template, playbook, export | Active — rules in record-taxonomy.mjs |
| `domain` | Security Domain | record, resource, template, playbook, export | Active — rules in record-taxonomy.mjs |
| `organization` | Organization | record, resource, template, playbook, intel, export | Seed terms defined; assignment rules pending (WS3) |
| `tool` | Tool | record, resource, template, playbook, intel, export | Seed terms defined; assignment rules pending (WS3) |
| `framework` | Framework | record, resource, template, playbook, intel, export | Seed terms defined; assignment rules pending (WS3) |
| `program` | Program | record, resource, template, playbook, intel, export | Seed terms defined; assignment rules pending (WS3) |
| `artifact` | Artifact | record, resource, template, playbook, intel, export | Seed terms defined; assignment rules pending (WS3) |
| `topic` | Topic | record, resource, template, playbook, intel, export | Seed terms defined; assignment rules pending (WS3) |

## Taxonomy relationships

Cross-term relationships are governed in `data/curated/taxonomy-relationships.json`. Each relationship has a source URL, validation state, and a `propagate_for_discovery` flag that controls whether the relationship surfaces related content during discovery.

Relationship types: `operated_by`, `developed_by`, `published_by`, `part_of`.

Cycles in discovery-propagation edges are validated at build time and rejected.

## Identity registry

The identity registry (`data/curated/identity-registry.json`) maps taxonomy terms to verified source identity marks. Each entry records:

- `key` — stable identity key
- `term_ids` — linked taxonomy terms
- `mark_kind` — current mark type (monogram, icon, or official)
- `verification_status` — `verified_official` (approved asset on file) or `fallback_only` (monogram/initials only)
- `fallback` — always present; used when no verified asset exists

The identity registry boundary: identity marks are decorative when text already names the entity. Marks never imply endorsement. The existing `resourceBrands.mjs` system coexists with the identity registry; migration is planned for WS4.

The shared resolver lives at `src/shared/identity-registry.mjs` and exports `resolveIdentity(termId)`, `resolveIdentityByKey(key)`, and `IDENTITY_REGISTRY`.

## Source-text non-interference rule

Tags are never inferred from incidental prose, advisory text, or document titles. A tag requires an explicit publisher field or catalog classification named in the tag's `source_basis`. This prevents false matches from documents that merely mention a concept.

## Applicability decisions

Every record-and-dimension decision has one of three states:

| State | Required evidence |
| --- | --- |
| `applicable` | At least one approved tag in the dimension with a declared source field and rule. |
| `not_applicable` | An explicit reviewed decision containing `state=not_applicable`, `source_field`, and `rule`. |
| `unreviewed` | No positive tag and no explicit negative decision. |

Absence never means `not_applicable`. This prevents sparse metadata from being presented as a reviewed exclusion.

## Discovery behavior

- Stable IDs use the `<dimension>.<value>` form and travel in repeatable `tag` URL parameters.
- Values within one dimension use OR semantics. Different dimensions use AND semantics.
- Contextual counts are recomputed after filters from other dimensions.
- Zero-result values are suppressed.
- Aliases help search the governed vocabulary but do not replace stable URL values.
- Vendor and product choices remain bounded to the approved vocabulary and current nonzero context.
- Record and Resource tags link back to the filtered Library. Relationship exports retain endpoint tag IDs.
- Templates and Compare derive contextual tags from the current record-backed publication scope. Guides expose only explicitly declared editorial handoffs, labeled so they cannot be mistaken for record or guide applicability. Every handoff has a focused route contract; `entity_scope` alone is never proof of implementation.

## Current coverage verdict

The current generated corpus contains 30,365 records and twelve governed dimensions (six with active assignment rules, six with seed terms pending assignment rules in WS3). Coverage statistics below reflect the six active dimensions only; new dimensions contribute zero `applicable` decisions until WS3 adds assignment rules.

| Measure | Count | Interpretation |
| --- | ---: | --- |
| Records with at least one governed tag | 22,663 | 74.6% of records have one or more positive decisions. |
| `applicable` decisions | 36,331 | Positive source-backed evidence across the six active dimensions. |
| `not_applicable` decisions | 0 | No explicit negative decision has yet been recorded. |
| `unreviewed` decisions | 328,057 | Includes all record-dimension decisions for the six new dimensions. |

Dimension detail, all 27 publication rows, 40 record-type rows, source fields, assignment rules, and decision reconciliation are generated in `data/generated/taxonomy-coverage.json`. The taxonomy is therefore usable for the supported evidence-backed filters, but its overall applicability review is **partial**, not complete.

## Change gate

A taxonomy change must preserve stable IDs or provide an explicit migration; identify the layer, dimension, aliases, hierarchy, entity scope, applicability rule, source basis, confidence, validation state, owner, and review date; regenerate coverage; and pass URL, filter-semantics, contextual-count, unavailable-value, alias, export, and source-basis contracts.
