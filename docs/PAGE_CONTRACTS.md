# Control Atlas Page Contracts

- **Owner:** Product owner and Muse
- **Status:** Canonical
- **Last reviewed:** 2026-08-11
- **Supersession:** New owner-approved page direction replaces the affected section here and its tests in the same change.

Every route uses one of six shared jobs. A route renders one `<main>` and must not mount another page beneath it.

## Shared shell

The header provides Atlas, Library, Resources, Search, and one overflow menu. Body content uses the shared spacing and width tokens. Interactive targets are at least 44 pixels, focus is visible, color is never the only signal, and layouts must reflow without page-level horizontal overflow.

## A. Landing

Home presents the product purpose, one primary search action, and concise entrances to Atlas, Library, and Resources. It does not duplicate legal, source, or provenance boilerplate already owned by About or the footer.

## B. Workspace

Library and Resources share search, visible desktop facets, a compact responsive filter drawer, result count, sorting, and incrementally rendered results. Empty search presents useful browse choices rather than the full corpus.

## C. Adaptive Explorer

Atlas has two modes over one route and one navigation state:

- Overview: React Flow and ELK render only the bounded area and publication map.
- Publisher structure: semantic DOM renders publication-native levels and immediate children.

The structural sidebar contains the current path, immediate parent, immediate children with counts, and publication-scoped search. It is open by default at 1200 pixels and wider, collapsible from 768 through 1199 pixels, and a slide-over Browse drawer below 768 pixels. Mobile shows one structural level at a time with a sticky path control. The main pane contains selected details and immediate children. A local-connections view is optional and never changes structural ancestry. Do not render a permanent right inspector below publication level or a native select containing a large catalog.

## D. Record detail

Order is fixed:

1. Identity and primary source action.
2. Complete official text in publisher order.
3. Source and freshness facts.
4. Publisher hierarchy.
5. Supporting material.
6. Related records.
7. Advanced metadata only when genuinely useful.

Commands and exact configuration render as copyable snippets. Explicit sequences render as ordered lists; independent actions render as bullets; ambiguous source text remains prose. `Related records` is a full-width final section grouped by publication and relationship type. Its description is “Formal published links to other publications.” Structural parents never appear in it.

## E. Directory

Guides and other small curated directories use typed entries, a clear sequence or grouping, and direct destinations. They do not invent another search-workspace pattern.

## F. Focused workbench

Compare, Templates, and other task flows present scope, working controls, results, and next action in that order. Dense controls progressively disclose on compact screens.

## Responsive verification widths

All page contracts are checked at 320, 375, 390, 768, 1024, and 1440 pixels. Required assertions cover visible primary content, document height, useful-space utilization, DOM size, overflow, focus order, keyboard operation, and preserved back/forward and deep-link state.
