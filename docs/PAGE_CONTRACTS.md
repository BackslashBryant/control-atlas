# Control Atlas Page Contracts

- **Owner:** Product owner and Muse
- **Status:** Canonical
- **Last reviewed:** 2026-08-14
- **Supersession:** New owner-approved page direction replaces the affected section here and its tests in the same change.

Every route uses one of six shared jobs. A route renders one `<main>` and must not mount another page beneath it.

## Shared shell

The desktop header provides Start Here, Atlas, Library, Compare, Resources, Templates, and Search. Guides, Sources, and About remain available in the overflow menu. Compact navigation preserves every destination, with Compare before editorial links. Body content uses the shared spacing and width tokens. Interactive targets are at least 44 pixels, focus is visible, color is never the only signal, and layouts must reflow without page-level horizontal overflow.

## A. Landing

Home presents the product purpose, one primary search action, and concise entrances to Atlas, Library, and Resources. It does not duplicate legal, source, or provenance boilerplate already owned by About or the footer.

## B. Workspace

Library and Resources share search, visible desktop facets, a compact responsive filter drawer, result count, sorting, and incrementally rendered results. Empty search presents useful browse choices rather than the full corpus.

## C. Adaptive Explorer

Atlas is one map over one route and one navigation state, all semantic DOM. No
canvas renderer and no flow-graph bundle loads before a visitor asks for a
relationship view.

The map column is roughly seventy per cent of the width and the detail panel
thirty, stacking below 1100px. Everything is drawn the same way at every depth:
a cell per thing, its area the quantity it holds, a trail above it for the way
back. Opening something never leaves the page — the map goes a level deeper and
the panel becomes about what was opened.

- Groups: the landing. Three lenses group the same publications by what each
  document is (`atlasLanding=""`), who issues it (`publishers`), or what the
  reader is trying to get done (`job`), five to eight groups each. Anything a
  lens cannot file is named beneath the map rather than dropped.
- Publications: the members of one group.
- Sections: what one publication contains.
- Records: where every child holds one record, area says nothing, so the panel
  lists them and each one opens.

Two rules the drawing must keep:

- Area may only encode a quantity whose units are the same across the cells
  being compared. Records are not comparable across publications — a STIG rule
  is not an 800-53 control — so groups are sized by publications and records
  take over one level down.
- Layout may not assert a claim the data cannot support. The curated dependency
  spine is hand-written because crosswalks carry no direction, so it appears as
  a sentence in the panel and never as the shape of the map. Relationship is
  shown by selection: choosing a cell lights the ones it genuinely crosswalks
  to and dims the rest.

Publisher-native columns remain addressable by URL beneath the map
(`atlasLimb`, `atlasFramework`, `atlasFamily` without a lens group) and render
publication-native levels and immediate children.

## D. Record detail

Every supported catalog/type resolves to one of six roles: atomic record, container, publication/document, entity/contributor, assessment/question, or implementation artifact. All roles share identity, official source action, source facts, publisher hierarchy, and a bounded relationship handoff; role composers control only the source-native middle of the page.

- Atomic records lead with official content, then implementation or assessment material and important governed relationships.
- Containers lead with publisher description when one exists, hierarchy, child inventory, counts/facets, and an external relationship summary. Missing optional publisher prose is an honest absence, not a record error.
- Publications/documents lead with publisher/version/status, summary, structure/content, contained objects, and related publications.
- Entities/contributors lead with publisher context and participation.
- Assessments/questions lead with subject, procedure/question, objectives/options, methods, and related requirement.
- Implementation artifacts lead with what they implement, architecture/function, guidance, mappings, and source.

Commands and exact configuration render as copyable snippets. Explicit sequences render as ordered lists; independent actions render as bullets; ambiguous source text remains prose. `Related records` is grouped by publication and relationship type. Structural parents and children never appear in it. Presentation policy may promote, summarize, collapse, or route valid relationships to Atlas only; the underlying graph remains exhaustive.

Publisher-native identifiers remain identity-led in record headings and browse results. When Control Atlas generates a stable record key, the publisher-authored title becomes the primary identity and the human record type plus governed publication name supplies nearby context. The generated key remains unchanged in routes and data, and appears only as a labeled, copyable `Control Atlas stable ID` detail rather than primary or accessible copy.

## E. Directory

Guides and other small curated directories use typed entries, a clear sequence or grouping, and direct destinations. They do not invent another search-workspace pattern.

## F. Focused workbench

Compare, Templates, and other task flows present scope, working controls, results, and next action in that order. Dense controls progressively disclose on compact screens.

## Responsive verification widths

All page contracts are checked at 320, 375, 390, 768, 1024, and 1440 pixels. Required assertions cover visible primary content, document height, useful-space utilization, DOM size, overflow, focus order, keyboard operation, and preserved back/forward and deep-link state. Atlas mobile is list-first; it never presents a shrunken canvas as the only way to reach evidence.
