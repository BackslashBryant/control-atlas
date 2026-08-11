# Epic 14 — Page Template System & Visual Language

**Date opened:** 2026-08-10
**Status:** Approved, ready to sequence
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
- Records lead with plain-language *What it is / What to do / How to satisfy it*.
- Atlas is a click-to-drill tree with a live breadcrumb.
- A first-time user can click any primary nav item and land directly on that page's
  real content, above the fold.

## Locked design decisions

Carried from the spec's "Locked decisions" section — do not re-litigate:
meaningful area color as bucket-tags · family-qualified IDs (`AC-3.1.1`) ·
plain-language-first records · "Classified under" replaces "Atlas structure" ·
click-to-drill Atlas graph · typed icons on Guides/Resources · plain
librarian-not-salesperson copy.

---

## Workstreams

Ordered by dependency and impact. Each is a shippable increment.

### WS0 — App Shell fix  · P0 · unblocks everything
The single highest-impact fix: kill the route-stacking bug and slim the header.
- One `<main>` per route; deep routes must not mount the home landing above their
  content.
- Header: wordmark (fix the double-render glitch) + ≤3 primary nav (Atlas · Library ·
  Resources) + Search; Guides/Sources/About into an overflow menu + footer; no
  duplicate desktop hamburger.
- **Acceptance:** direct load of `#/atlas`, `#/library`, `#/record/*` yields one
  `<main>` with the route's own content first in the viewport. Header shows no
  duplicate nav control and no doubled wordmark word.

### WS1 — Design tokens & area color system  · foundation
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

### WS2 — Template E: Record  · P0 (content) + highest-traffic deep page
- Title block: breadcrumb + kind/area/mandate tags + family-qualified `AC-3.1.1` +
  plain-English name + one provenance line.
- MAIN leads with **What this is / What you need to do / How to satisfy it**
  (as applicable); official source text demoted to a collapsible.
- **Connections = real cross-framework only** — exclude same-catalog parent/child
  structural links; honest empty state when none.
- Sidebar: **Classified under** tag group (Area + family + publication),
  **Comes from (authority)**, **Source & provenance**.
- One "Open official source" (delete the other three CSV links). No `*.json`, `#id`,
  Node ID, or raw file path in the main flow — all internal fields in a collapsed
  **Developer details** drawer.
- **Acceptance:** description appears once; one source link; connections exclude the
  parent folder; no internal identifiers in rendered body; plain-language blocks
  present and lead the page.

### WS3 — Template C: Workspace (Library + Resources unified)  · P1
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

### WS4 — Template D: Atlas canvas  · P1
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

### WS5 — Templates B & F: Home + Guides  · P1
- Home: one hero, one search, **three** cards (retire the 4th "Start" card and the
  competing ecosystem-preview panel), plus a colored **"browse by area"** chip row.
- Guides: hold the card-grid directory; add a **per-step icon** and area color; keep
  numbered steps (the lifecycle is a real sequence).
- **Acceptance:** Home has one hero and three cards; Guides cards carry icons and are
  fully clickable.

### WS6 — Copy pass  · P1 · runs alongside every WS
- Strip the four slop patterns (tricolon slogans, laundry lists, anthropomorphized
  product, leaked tree metaphors) per spec §10's offender→rewrite table.
- Every record conforms to the ratified plain-language voice.
- **Acceptance:** no headline/subhead is a 3-part slogan or 5+ item comma list; no
  first/second-person persona; no internal metaphor on screen.

### WS7 — URL hygiene  · P1
- Remove `mode=` from URLs; collapse duplicate params (`crosswalk` vs `workbench`);
  prefer clean path segments; stop URL-encoding `:` into visible links.
- **Acceptance:** no `mode=` anywhere; no duplicate-value params; deep links legible.

---

## Data dependencies (tracked here, NOT blocking the layout work)

The mockup showed populated states the live **data** does not yet support. These are
separate efforts; the templates ship first and improve as data lands.

- **DD1 — Crosswalk enrichment.** `AC-3.1.1` currently has 2 "connections" (one its
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
