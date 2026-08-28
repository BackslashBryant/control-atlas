# Control Atlas Taxonomy Contract

- **Owner:** Control Atlas data stewardship
- **Status:** Canonical contract; coverage remains partial
- **Contract version:** 2.0.0
- **Last reviewed:** 2026-08-28
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
| `organization` | Organization | record, resource, template, playbook, intel, export | Active — catalog-publisher rules in record-taxonomy.mjs |
| `tool` | Tool | record, resource, template, playbook, intel, export | Active for resources and templates; no record-level rule yet |
| `framework` | Framework | record, resource, template, playbook, intel, export | Active — catalog-scope rules in record-taxonomy.mjs |
| `program` | Program | record, resource, template, playbook, intel, export | Active — catalog-scope and benchmark-title rules |
| `artifact` | Artifact | record, resource, template, playbook, intel, export | Seed terms defined; assignment rules pending |
| `topic` | Topic | record, resource, template, playbook, intel, export | Seed terms defined; assignment rules pending |

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

The identity registry boundary: identity marks are decorative when text already names the entity. Marks never imply endorsement. Every current entry is `fallback_only`; no publisher asset has been verified, licensed, and committed yet, so tags render text-only wherever a monogram would merely repeat the label. The existing `resourceBrands.mjs` system coexists with the identity registry and still owns Commons card marks.

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

## Direct and derived assignments

A **direct** assignment comes from the content itself: a publisher field, a catalog identity, or a reviewed structured resource field named in the tag's `source_basis`.

A **derived** assignment comes from one approved taxonomy relationship applied to a direct tag. `deriveTags` in `src/shared/record-taxonomy.mjs` expands a direct tag across relationships in `data/curated/taxonomy-relationships.json` that carry `propagate_for_discovery: true` and an approved validation state. Propagation is limited to **one hop**; derived tags never propagate further and never become a second direct assignment.

Example: a template tagged `tool.emass` gains `organization.disa` for discovery because `tool.emass operated_by organization.disa` is approved for propagation. The template still has no publisher evidence naming DISA, and the derived tag never establishes applicability.

Derived tags retain the originating tag, relationship type, and rule. Only direct assignments count toward `applicable` decisions in the coverage report.

## Lifecycle

Taxonomy terms carry `status`: `active`, `deprecated`, `superseded`, or `retired`. A term that leaves `active` keeps its ID, aliases, and hierarchy so historical URLs resolve and past assignments stay auditable. Superseding a term never rewrites the source history that produced an assignment.

Identity entries carry their own state through `verification_status` and `usage_status`. Removing an asset degrades an identity to its fallback; it never breaks the tag, its URL, or its filter behavior.

## Current coverage verdict

The current generated corpus contains 30,979 records across twelve governed dimensions. Nine dimensions have active record-level assignment rules; `tool` is assigned on resources and templates only, and `artifact` and `topic` have seed terms with no assignment rule yet.

| Measure | Count | Interpretation |
| --- | ---: | --- |
| Records with at least one governed tag | 30,798 | 99.4% of records have one or more positive decisions. |
| `applicable` decisions | 90,634 | Positive source-backed evidence across the dimensions with active rules. |
| `not_applicable` decisions | 0 | No explicit negative decision has yet been recorded. |
| `unreviewed` decisions | 281,114 | Includes every record-dimension pair with no rule and no reviewed exclusion. |

High tag coverage is not high review coverage. Nearly every record carries a catalog-scope publisher tag, while the asset, environment, technology, product, and domain dimensions remain sparse and `not_applicable` has never been recorded. Dimension detail, all 28 publication rows, 44 record-type rows, source fields, assignment rules, and decision reconciliation are generated in `data/generated/taxonomy-coverage.json`. The taxonomy is usable for the supported evidence-backed filters, but its overall applicability review is **partial**, not complete.

## Change gate

A taxonomy change must preserve stable IDs or provide an explicit migration; identify the layer, dimension, aliases, hierarchy, entity scope, applicability rule, source basis, confidence, validation state, owner, and review date; regenerate coverage; and pass URL, filter-semantics, contextual-count, unavailable-value, alias, export, and source-basis contracts.
