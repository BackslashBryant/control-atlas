# Epic 14 — Page Template System & Visual Language

**Date opened:** 2026-08-10
**Status:** Shipped
**Owner:** Bryant

## Why

A live-site sniff test (first-time-user stance) found the app "feels like we threw
up information on a page." Root cause: **there is no shared page-template system** —
Library, Resources, and Guides are three different layouts for the same job, the
Record page stacks nine sections in ad-hoc order with content printed twice and four
links to the same CSV, and every deep route renders the entire home landing stacked
on top of its real content. This epic makes every page conform to one of six
canonical templates, introduces a meaningful color language, and ratifies the
plain-language copy standard — so the UI reaches a stable, scalable state before any
new features land.

## Source docs (read before building)

- **Design reference (LOCKED):** [page-layout-spec-2026-08-10.md](page-layout-spec-2026-08-10.md)
  — exact layouts, tokens, area hues, wireframes, route→template map.
- **Findings/backlog:** [live-site-sniff-test-2026-08-10.md](live-site-sniff-test-2026-08-10.md)
  — the P0/P1 bug + data findings this epic resolves.
- **Approved mockup:** interactive prototype of all six templates
  (Home, Library, Resources, Atlas, Record, Guides) reviewed and approved
  2026-08-10. Build to match its structure, color, and copy voice.

## Definition of done (epic-level acceptance)

- Every route renders exactly **one** `<main>` and maps to exactly **one** of the
  six templates (B–F + simple content).
- No page prints the same content or link twice; no internal ID, filename, or state
  name (`*.json`, `#id`, `mode=`, "Atlas structure") appears in the main flow.
- The area color system and bucket-tags are applied consistently across Library,
  Record, Atlas, Home, Resources, Guides.
- Records lead with their complete published text and publisher-supplied supporting fields.
- Atlas is a click-to-drill tree with a live breadcrumb.
- A first-time user can click any primary nav item and land directly on that page's
  real content, above the fold.

## Completion

WS0–WS7 are complete. The six-template system, area-color discipline, publisher-text-first
records, drillable Atlas, Home and Guides updates, copy reset, and URL hygiene are all
covered by the Epic 14 browser smoke suite. Public focused Atlas links now use
`/atlas/{record-id}` and Compare links use `/compare/{comparison}`; old query links
remain readable and normalize to those routes.

## Locked design decisions

Carried from the spec's "Locked decisions" section — do not re-litigate:
meaningful area color as bucket-tags · publisher + source-native category + official ID titles
(`NIST AC 3.1.1`) · publisher-text-first records · classification and publication facts in `About This Record` ·
click-to-drill Atlas graph · typed icons on Guides/Resources · plain
librarian-not-salesperson copy.

---

## Workstreams

Ordered by dependency and impact. Each is a shippable increment.

### WS0 — App Shell fix  · P0 · shipped
The single highest-impact fix: kill the route-stacking bug and slim the header.
- One `<main>` per route; deep routes must not mount the home landing above their
  content.
- Header: wordmark (fix the double-render glitch) + ≤3 primary nav (Atlas · Library ·
  Resources) + Search; Guides/Sources/About into an overflow menu + footer; no
  duplicate desktop hamburger.
- **Acceptance:** direct load of `#/atlas`, `#/library`, `#/record/*` yields one
  `<main>` with the route's own content first in the viewport. Header shows no
  duplicate nav control and no doubled wordmark word.

### WS1 — Design tokens & area color system  · shipped
- Add the 9 area hues + authority hue as tokens (light/dark), plus the neutral,
  accent, spacing, radius, and type tokens from the spec §0.
- **Color discipline (owner-corrected 2026-08-10):** one accent (teal) is the only
  color on cards, icons, links, buttons, and section accents. Area color is spent in
  **one place — the Atlas map**. Everywhere else, area is a **small dot on a neutral
  bucket-tag**, never a filled colored block repeated down a list. No per-area colored
  cards, guide/resource icons, or record lead-blocks.
- Build the reusable **bucket-tag** (neutral body + area-hue dot) and **line-tag**
  components.
- Map each area/family to its hue in one place (single source of truth).
- **Acceptance:** a full page shows the accent plus at most small area dots — no page
  reads as a rainbow; the Atlas map is the only surface with full area fills; both
  themes legible; no hardcoded per-page colors.

### WS2 — Template E: Record  · P0 (content) + shipped
- Title block: breadcrumb + publisher/source-native category/official ID identity
  (`NIST AC 3.1.1`) + publisher-authored name when it adds information.
- MAIN leads with complete publisher text under a type-specific heading, followed
  by publisher-supplied discussion, check, fix, implementation examples, or assessment
  procedure fields when supplied. No generated explanation or generic action guidance.
- **Crosswalks = formal published crosswalk records only** — exclude same-catalog
  structure and omit the section when none exists.
- Sidebar: **About This Record** with neutral kind, category, area, and publication
  tags plus Publisher, Publication, Version, Publication Date, and Last Checked.
- One `View official source` action. No `*.json`, `#id`, node ID, or raw file path
  in the public flow.
- **Acceptance:** complete publisher text appears once; one official-source action;
  no fabricated names or guidance; no internal identifiers; every public type has
  a checked presentation profile and required source fields.

### WS3 — Template C: Workspace (Library + Resources unified)  · shipped
- One skeleton for both: persistent left **facet rail** (no "Filters" button at
  desktop), result bar (`count · Sort · List/Map · Compare`), full-width result rows.
- Whole row is the click target — **remove the redundant "Open record" button**;
  put a 1-line snippet + cross-framework count + area tag in the freed space.
- Family-qualified IDs + area bucket-tag on every row; Area added as a facet.
- **Empty query → browse state** (top publications / area cards), not a 29k-row dump.
- Resources = same skeleton with Type/Collection/Owner facets + **per-type icons**
  and colored type tags.
- **Acceptance:** Library and Resources share one component; facets visible at
  desktop; rows fully clickable with no open-record button; empty query shows browse
  state.

### WS4 — Template D: Atlas canvas  · shipped
- Rebuild as a **click-to-drill tree/network graph**: colored area nodes, curved
  edges, root-on-left (or top) with children branching; clicking a node drills in
  automatically; live breadcrumb climbs back.
- Dock totals + area list + legend on the left; node inspector on the right (no
  select-then-drill button — drilling is the click).
- Zero-count limbs muted, dashed, labeled "nothing mapped yet."
- Reuse the repo's existing graph tooling (ELK / React-Flow) for layout rather than
  hand-rolling geometry.
- **Acceptance:** map is first content in the viewport; clicking any populated node
  changes the view to that node; breadcrumb reflects and reverses the path; empty
  limbs cannot dead-end into a blank drill.

### WS5 — Templates B & F: Home + Guides  · shipped
- Home: one hero, one search, **three** cards (retire the 4th "Start" card and the
  competing ecosystem-preview panel), plus neutral area tags with small dots.
- Guides: hold the card-grid directory; add a **per-step icon** and neutral area tag; keep
  numbered steps (the lifecycle is a real sequence).
- **Acceptance:** Home has one hero and three cards; Guides cards carry icons and are
  fully clickable.

### WS6 — Sitewide Copy and Record Truth Reset  · shipped
- Enforce one calm, direct, grounded, task-focused voice. Give each major route one
  useful task sentence; use no institutional “we” and no metaphorical Atlas prose.
- Centralize stable route copy and check product-authored headlines, task lines,
  cards, help, errors, and empty states for prohibited architecture narration.
- Every record leads with complete publisher text under a type-specific heading.
  No sentence-extracted name, generated summary, placeholder, or generic advice may
  fill a missing field.
- Add a checked presentation profile for every supported public record kind. Fail
  generation when a kind is unprofiled or loses required publisher fields.
- Normalize DISA CCI identity from DISA's Policy/Technical classification and retain
  referenced NIST categories as supporting tags with explicit provenance.
- **Acceptance:** exact approved Home, route, About, search, and boundary anchors;
  no brochure slogan, anthropomorphized product, internal metaphor, or unsupported
  product claim; record titles use publisher + source-native category + official ID;
  acronym and derived-tag explanations work on hover, focus, and tap.

### WS7 — URL hygiene  · shipped
- Remove `mode=` from URLs; collapse duplicate params (`crosswalk` vs `workbench`);
  prefer clean path segments; stop URL-encoding `:` into visible links.
- **Acceptance:** no `mode=` anywhere; no duplicate-value params; deep links legible.

---

## Data dependencies (tracked here, NOT blocking the layout work)

The mockup showed populated states the live **data** does not yet support. These are
separate efforts; the templates ship first and improve as data lands.

- **DD1 — Crosswalk enrichment.** `NIST AC 3.1.1` currently has 2 "connections" (one its
  own parent). Real cross-framework mappings (800-171 ↔ 800-53 ↔ CMMC ↔ CSF) must be
  populated for the Connections section to carry weight. Ties to the open
  source-completeness gaps in the provenance-refactor work.
- **DD2 — Atlas taxonomy rebalance.** Implementation holds 24,530 of 28,783 records
  (85%); Risk = 3, two limbs = 0. No limb should exceed ~40%; split the Implementation
  junk drawer; hide/label zero-count limbs. Layout can't fix an unbalanced taxonomy.

---

## Build order

1. **WS0** (app shell) — unblocks the whole site; ship alone first.
2. **WS1** (tokens/color) — foundation every other WS consumes.
3. **WS2** (Record) — worst offender, highest-traffic deep page.
4. **WS3** (Library + Resources).
5. **WS4** (Atlas).
6. **WS5** (Home + Guides).
7. **WS6 / WS7** run continuously and close out with a full copy + URL sweep.
8. **DD1 / DD2** proceed in parallel as data efforts; templates degrade gracefully
   until they land.

## Out of scope for this epic

New features (Compare/Build deepening, new sources, new lenses) are frozen until the
template system and DD-tracked data reach the DoD above. Compare and Build inherit
Template C / E variants when they're next touched, but no new capability ships first.
