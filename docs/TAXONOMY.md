# Control Atlas Taxonomy Contract

- **Owner:** Control Atlas data stewardship
- **Status:** Canonical contract; coverage remains partial
- **Contract version:** 1.2.0
- **Last reviewed:** 2026-08-13
- **Supersession:** A later contract version must migrate stable tag IDs and update the generated coverage report in the same change.

## Purpose and boundary

The governed taxonomy supports discovery. It does not create relationships, endorsements, or applicability claims from incidental prose. Publisher classifications, Control Atlas evidence-backed facets, and editorial navigation concepts remain separate layers.

The executable vocabulary is `src/shared/taxonomy-contract.mjs`. The reproducible corpus report is `data/generated/taxonomy-coverage.json`.

## Layers

| Layer | Meaning | May establish record applicability? |
| --- | --- | --- |
| `publisher` | A publisher-declared family, catalog scope, classification, or identifier. | Yes, when the declared source field and rule are retained. |
| `atlas_evidence` | A Control Atlas facet derived from a reviewed structured field and an approved deterministic rule. | Yes, within the rule's stated scope. |
| `editorial` | A navigation or orientation concept. | No. Editorial concepts require a separate governed evidence rule before becoming record tags. |

Assignment provenance remains explicit. A `publisher` assignment belongs to the publisher layer. An `inferred` assignment belongs to the `atlas_evidence` layer and must retain the exact structured field and deterministic rule that produced it.

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

The generated 2026-08-13 corpus contains 30,365 records and six governed dimensions, producing 182,190 record-dimension decisions.

| Measure | Count | Interpretation |
| --- | ---: | --- |
| Records with at least one governed tag | 17,750 | 58.5% of records have one or more positive decisions. |
| `applicable` decisions | 31,418 | 17.2% of all record-dimension decisions have positive source-backed evidence. |
| `not_applicable` decisions | 0 | No explicit negative decision has yet been recorded; this is not a claim that every dimension applies. |
| `unreviewed` decisions | 150,772 | 82.8% of record-dimension decisions remain unreviewed. |

Dimension detail, all 27 publication rows, 40 record-type rows, source fields, assignment rules, and decision reconciliation are generated in `data/generated/taxonomy-coverage.json`. The taxonomy is therefore usable for the supported evidence-backed filters, but its overall applicability review is **partial**, not complete.

## Change gate

A taxonomy change must preserve stable IDs or provide an explicit migration; identify the layer, dimension, aliases, hierarchy, entity scope, applicability rule, source basis, confidence, validation state, owner, and review date; regenerate coverage; and pass URL, filter-semantics, contextual-count, unavailable-value, alias, export, and source-basis contracts.
