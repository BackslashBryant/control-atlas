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

Atlas is three altitudes over one route and one navigation state, all semantic
DOM. No canvas renderer and no flow-graph bundle loads before a visitor asks
for a relationship view.

- Groups: the landing is a board of five to eight groups, never the whole
  corpus at once. Three lenses group the same publications by what each
  document is (`atlasLanding=""`), who issues it (`publishers`), or what the
  reader is trying to get done (`job`). Every group names its members at rest;
  nothing is hover-gated, and no group is a box that must be opened to learn
  what is in it. Anything a lens cannot file is named in a strip beneath the
  groups rather than dropped.
- Group contents: opening a group shows what it holds. Kind and job open the
  dependency picture over that group's frameworks, drawn from the curated
  spine, because those groupings are about how documents relate. A publisher
  opens its own columns, because that is an inventory question.
- Publisher structure: semantic DOM renders publication-native levels and
  immediate children.

Position must never imply a claim the data cannot support. The landing may not
rank frameworks by dependency depth across unlike documents, and any ordering
that does rank must be the quantity already stated on the card.

The structural sidebar contains the current path, immediate parent, immediate children with counts, and publication-scoped search. It is open by default at 1200 pixels and wider, collapsible from 768 through 1199 pixels, and a slide-over Browse drawer below 768 pixels. Mobile shows one structural level at a time with a sticky path control. The main pane contains selected details and immediate children. A local-connections view is optional and never changes structural ancestry. It must be a visible workspace destination or immediately focused after navigation; no task-critical connection result may begin below an unexplained Atlas canvas. Do not render a permanent right inspector below publication level or a native select containing a large catalog.

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
