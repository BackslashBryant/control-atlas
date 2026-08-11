# Control Atlas — Page Layout Specification

**Date:** 2026-08-10
**Status:** ✅ **LOCKED** — directions approved by owner 2026-08-10 against the
interactive mockup (Home, Library, Resources, Atlas, Record, Guides). Build to
this. Reference epic: [epic-14-page-template-system-2026-08-10.md](epic-14-page-template-system-2026-08-10.md).
**Purpose:** Exact, prescriptive layouts for every page type. This is the target
each route must conform to. It exists because the live site has **no shared
page-template system** — Library, Resources, and Guides are three different
layouts for the same job, and the Record page stacks nine sections in ad-hoc
order. That is the "no order to their layout" feeling, diagnosed and fixed here.

**Grounding:** Every "current state" note below was confirmed against the live
production DOM on 2026-08-10 (`backslashbryant.github.io/control-atlas`), not
assumed.

---

## Locked decisions (approved refinements — supersede anything below that conflicts)

These are the owner-approved calls from the mockup review. Where an earlier section
conflicts, these win.

1. **Meaningful but restrained area color.** Each of the 9 cybersecurity areas has
   one hue, but **color is spent in one place: the Atlas map**, where it distinguishes
   9 branches for wayfinding. Everywhere else the palette is quiet:
   - **One accent (teal)** is the only color on cards, icons, links, buttons, and
     section accents. Do **not** color cards, guide icons, resource icons, or record
     lead-blocks per-area — that's the rainbow to avoid.
   - **Area appears as a small colored dot** on an otherwise-neutral bucket-tag
     (neutral body, area-hue dot only) — in Library rows + the Area facet, the Record
     `About This Record`. Never a filled colored block repeated down a list.
   - Full area fills are reserved for **Atlas nodes** and small legend/list swatches.
2. **Publisher + source-native category + ID record titles.** Record titles use the compact
   identity `{publisher} {category} {official ID}` (`NIST AC 3.1.1`). If the
   identifier already carries the family, do not repeat it (`NIST AC-2`, not
   `NIST AC AC-2`). The breadcrumb ends with the unchanged official ID.
3. **Records lead with the real text.** The record MAIN opens with the complete
   published description, followed by publisher-supplied discussion, check, fix, or
   assessment fields when available. Do not manufacture generic explanation or
   action blocks, and do not derive a record name from body text. (See §5.)
4. **"Atlas structure" is retired as a user-facing label.** Put neutral kind,
   category, area, and publication tags in **About This Record**. The internal
   trunk/limb vocabulary never appears on screen.
5. **Atlas is a click-to-drill tree/network graph.** The main view is a hierarchical
   graph (colored area nodes, curved edges). **Clicking a node drills in
   automatically** — no select-then-button step. A live breadcrumb climbs back.
   Empty limbs are muted, dashed, and honestly labeled. (See §4.)
6. **Typed icons + color on directory/resource items.** Guides get a per-step icon;
   Resources get a per-type icon and colored type tag. (See §6 and §3.)
7. **Copy standard ratified.** Plain, concrete, librarian-not-salesperson. The
   record explainer voice ("only approved people, the processes acting for them, and
   authorized devices may reach the system") is the standard. (See §10.)

---

## Root cause (confirmed)

There are effectively **six distinct page jobs**, but the site built each page
one-off. Result: no two pages of the same job share a skeleton.

| Live page | Job | Current layout | Problem |
|---|---|---|---|
| Library | search + facets | search bar, then Sort + view-toggle + Compare + a **"Filters" button** hiding facets | facets hidden behind a button; controls in a dense horizontal stack |
| Resources | search + facets | search bar, then a **"Filters" button** hiding **three dropdowns** (Collection/Type/Owner) | *different* control set and arrangement than Library — same job, different UI |
| Guides | directory | **card grid**, no search, no facets | third pattern for a list page |
| Record | detail | 9 stacked full-width sections, ad-hoc order | content printed twice, 4 links to one CSV, internal IDs leaked |
| Atlas | canvas | hero-stacked-on-map (route bug) + graph + inspector | real content buried under a duplicated home hero |
| Home | hub | hero + preview + 4 cards | fine, but sets no template the others reuse |

**Fix:** define the six templates below. Every route maps to exactly one. Nothing
gets a bespoke layout.

---

## 0. Global tokens (use these everywhere — this is what creates "order")

```
Content max-width:      1200px  (centered; full-bleed only for the Atlas canvas)
Reading measure:        720px   (body text column never exceeds this)
Grid gutter:            24px
Spacing scale (only):   4, 8, 12, 16, 24, 32, 48, 64   (no arbitrary values)
Section vertical rhythm: 48px between major sections, 24px within
Card grid:              repeat(auto-fill, minmax(280px, 1fr)), 24px gap
Breakpoints:            mobile <640 · tablet 640–1023 · desktop ≥1024
Sidebar rail width:     280px (facets) / 320px (record metadata) / 320px (atlas inspector)
Sticky offset:          header height + 16px

Area hues (light / dark)  — one per cybersecurity area, used for bucket-tags:
  Governance      #5A63D6 / #8791F0     Assessment       #1C8FB2 / #45B6D6
  Risk            #C87A24 / #E0A24A     Operations       #61748A / #8496A8
  Compliance      #2E9B6E / #4FC38E     Threats&Defense  #CE463F / #F0736B
  Architecture    #8A57CC / #B085EC     Knowledge        #3E9B78 / #5FC79C
  Implementation  #2E6FE0 / #5B96F5     Authority        #B07A1E / #E0B15A
Tag background = color-mix(area 15%, surface); tag text = the area hue.
```

Every page = **App Shell** (§1) wrapping **one** of Templates B–F.

---

## 1. App Shell (every page)

Confirmed problems: the header carries wordmark+animation, 4 primary links, Search,
2 utility links, **and** a redundant desktop hamburger — plus the rotating wordmark
rendered its word twice under load. The route-stacking bug also lives here (deep
routes render a second `<main>` containing the whole home page).

**Target header (single row, one `<main>` per route):**

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [◧ Control Atlas]        Atlas   Library   Resources        [ Search ⌕ ]  ⋯ │
│   (wordmark + rotating X)  — primary nav, max 3–4 —          — action —  menu│
└────────────────────────────────────────────────────────────────────────────┘
```

- **Primary nav = 3 items:** Atlas · Library · Resources. These are the three jobs.
- **Guides, Sources, About** move into the `⋯` overflow menu (and footer). They are
  reference/meta, not primary destinations.
- **One** navigation control per breakpoint: full nav ≥1024px, hamburger only <1024px.
  Never both.
- Keep the rotating `Ctrl+Alt+X` wordmark (locked brand) but fix the double-render.
- Search is a persistent action that opens the search field; it is never a nav link.

**Hard rule:** a route renders exactly **one** `<main>`. No page's content may mount
below another page's content. (This kills the "click Atlas, get the home page" bug.)

**Footer:** unchanged in content, but it is the *only* home for the legal/meta line,
Submit-resource, Report-a-problem, and Source-attribution links. Don't repeat those
in page bodies.

---

## 2. Template B — Landing / Hub  (Home only)

Current home is acceptable; it just needs to be the *only* page that uses this
template. Exact order, single centered column (max 1200, hero text max 720):

```
┌─ HERO ─────────────────────────────────────────────┐
│ H1: "Make federal cybersecurity compliance make sense."    │
│ "Understand what applies, what it means, and what to do next." │
│ [ ⌕ big search field .......................... ]   │  ← single primary action
└─────────────────────────────────────────────────────┘
┌─ HUB CARDS (3, equal) ──────────────────────────────┐
│ [ Browse the Atlas ] [ Search the Library ] [ Browse Resources ] │
└─────────────────────────────────────────────────────┘
   no trust or provenance note in the Home hero
```

Changes from live:
- **Cut the "ecosystem preview" panel** from the hero region OR make it the visual
  background of the search — right now it competes with the cards for the same job
  (both say "here's the ecosystem, pick a path").
- **3 cards, not 4.** "Start with your work" (`#/start`) is a fourth path doing the
  same job as the other three; fold it into the search's placeholder/prompt or drop
  it. Four equal cards = no primary action.
- Exactly one search field on the page.

---

## 3. Template C — Workspace / Search  (Library AND Resources — unified)

**This is the biggest structural fix.** Library and Resources do the same job with
two different UIs. They must become one template. Persistent left facet rail + main
results. No "Filters" button hiding the facets on desktop.

```
┌───────────── page header (full width) ─────────────────────────────┐
│ H1 "Library" (or "Resources")   ·   one-line purpose                │
│ [ ⌕ search field ....................................... ] [Search] │
│ 29,367 results        Sort ▾   [List | Map]      [Compare]          │  ← result-bar
├──────────────┬──────────────────────────────────────────────────────┤
│  FACET RAIL  │  RESULTS (single column, full-width rows)            │
│  280px       │                                                      │
│  (sticky)    │  ┌────────────────────────────────────────────────┐ │
│              │  │ IDENTIFIER · kind badge · publisher            │ │  ← whole row
│  Publisher   │  │ Plain-English title                            │ │    is the link
│  ☐ NIST      │  │ 1-line snippet · N connections                 │ │    (no "Open
│  ☐ DISA …    │  └────────────────────────────────────────────────┘ │    record" btn)
│  Content kind│  ┌────────────────────────────────────────────────┐ │
│  Publication │  │ … next result …                                │ │
│  ☐ Has conns │  └────────────────────────────────────────────────┘ │
└──────────────┴──────────────────────────────────────────────────────┘
```

Rules:
- **Facets live in the left rail, always visible ≥1024px.** Collapse into a "Filters"
  sheet **only** on <1024px. Confirmed live: both Library and Resources hide facets
  behind a button even on desktop — wrong.
- **Same facet control style on both pages.** Pick one: checkbox lists for
  low-cardinality facets (Content kind, Has-connections), type-ahead for
  high-cardinality (Publisher, Publication, Owner). Resources' three plain
  dropdowns and Library's mixed panel must converge.
- **Result rows are the click target end-to-end.** No dedicated "Open record"
  button — that's the wasted space Bryant flagged. Put the freed space into the
  1-line snippet + connection count (real information scent).
- **Empty query ≠ 29,367-row dump.** With no query, show a browse state: top
  publications as tiles + content-kind counts. Rank rows only once a query exists.
- Result-bar order is fixed: `count · Sort · view-toggle · Compare`. Same on both
  pages.
- **Resources** uses the same skeleton; its facets are Collection / Type / Owner
  instead of Publisher / Content-kind / Publication. That's the only difference.

---

## 4. Template D — Canvas  (Atlas only)

Full-bleed graph with two docked panels. Confirmed live: the map works (React-Flow,
zoom/fit, inspector) but renders **below a full copy of the home hero** — fix via
the §1 one-`<main>` rule so the canvas is the first thing in the viewport.

```
┌───────────── slim page header (full width, 1 row) ─────────────────┐
│ H1 "Atlas"  ·  "Browse requirements by topic."  [⌕ jump to record]│
├────────────┬────────────────────────────────────────┬──────────────┤
│ LEFT DOCK  │            GRAPH CANVAS (full-bleed)    │  INSPECTOR   │
│ 280px      │                                         │  320px       │
│            │        ● Cybersecurity (trunk)          │  (selected   │
│ You are    │       / | \ …limbs…                     │   node)      │
│ here /     │                                         │  name        │
│ breadcrumb │     [zoom + / − / fit]  (bottom-right)  │  count       │
│ + totals   │                                         │  drill-in ▸  │
└────────────┴────────────────────────────────────────┴──────────────┘
```

Layout rules (not data — data fixes are in the sniff-test doc):
- Canvas is the hero. Totals, mandate-kind chips, and the legend move **into the
  left dock**, not stacked above the canvas eating vertical space.
- Node inspector is the **right dock**, appears on selection, and names the selected
  item with one clear action to open its details.
- **Zero-count limbs (Knowledge, Operations) are not rendered as nodes** — or are
  rendered muted with an explicit "nothing mapped yet" so a click doesn't dead-end.
- Legend docks bottom-left, collapsible.

---

## 5. Template E — Detail / Record  (the page Bryant is staring at)

Confirmed live defects on `#/record/nist-800-171-rev2/3.1.1`, in order down the page:
1. Title block prints **"Record → 3.1.1 → Requirement → 3.1.1"** — id twice, no hierarchy.
2. Action row: Back · Open official source · See in Atlas · More actions.
3. "Official description" (truncated).
4. **"Open official source"** again (2nd copy).
5. "Source support" (publisher/version).
6. "Hierarchy → Where this sits" with **three** parallel trees (Authority / Atlas
   structure / Publisher).
7. "Connections" — count padded with the record's **own parent folder**.
8. "Where it appears → Official text / source excerpt" = **the full description
   printed a 2nd time**, plus **two more** links to the same CSV
   ("Open official source document", "Browse the official catalog").
9. "Advanced details" leaking `Node ID: nist-800-171-rev2:3.1.1` and the raw
   source URL.

Net: the same paragraph appears twice, the same CSV is linked **four times**, and
internal IDs/filenames are on-screen. That is the "unorganized junk / legacy
directions" instinct, confirmed.

**Target: two-column detail, fixed section order, one of everything.**

```
┌─ breadcrumb ───────────────────────────────────────────────────────┐
│ Library › Access Control › NIST AC 3.1.1                            │
├────────────────────────────────────────────────────────────────────┤
│ NIST AC 3.1.1                                                       │
│ Publisher-authored name, when it adds information                  │
│ [ View official source ]   [ See connections ]   [ ⋯ More ]        │
├──────────────────────────────────────┬─────────────────────────────┤
│ MAIN (≈ 66%, max 720 reading width)  │ SIDEBAR (320px, sticky)     │
│                                       │                             │
│ ## Requirement                        │  About This Record          │
│ complete publisher text — ONCE        │   Publisher                 │
│                                       │   Publication               │
│ ## Discussion                         │   Version                   │
│ publisher discussion, when present    │   Publication Date          │
│                                       │   Last Checked              │
│ ## Crosswalks                         │   neutral classification    │
│ formal crosswalk records only         │   tags                      │
├───────────────────────────────────────┴─────────────────────────────┤
└──────────────────────────────────────────────────────────────────────┘
```

Exact rules:
- **Title block = breadcrumb + publisher/category/official-ID H1 + publisher-authored
  name when it adds information + actions.** Keep tags and publication facts out of it.
- **Publisher text appears exactly once** in MAIN under a type-specific source heading.
  Never generate a name, explanation, or action from body text.
- **One** `View official source` action in the title block. Use `See connections` for
  the record-to-Atlas action.
- Put neutral kind, category, area, and publication tags plus Publisher, Publication,
  Version, Publication Date, and Last Checked in **About This Record**.
- **Crosswalks = formal crosswalk records only.** Omit the section when none exist.
- **No `.json`, no `#id`, no raw file path, and no node ID in the public flow.**
- Every supported record kind has an approved presentation profile. Missing required
  publisher fields or an unknown kind fails generation.
- Sidebar is sticky; MAIN scrolls.

---

## 6. Template F — Directory / Index  (Guides; also Resources' empty-query state)

Guides is already close to right: heading + one-line purpose + card grid. Make it the
canonical directory template.

```
┌─ page header ──────────────────────────────────────┐
│ H1 "Guides"  ·  one-line purpose                    │
├─────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│ │ title    │ │ title    │ │ title    │ │ title    ││  card grid
│ │ 1-line   │ │ 1-line   │ │ 1-line   │ │ 1-line   ││  minmax(280,1fr)
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘│
└─────────────────────────────────────────────────────┘
```

- Cards: title + one-line description, whole card is the link. (Guides already does
  this — hold every directory to it.)
- Use this same grid for Library/Resources' **empty-query browse state** (top
  publications / collections as cards).

---

## 7. Simple content  (Sources, About)

Single centered column, max reading width 720, standard prose + headings. No bespoke
layout. These are the two pages allowed to be "just a document."

---

## 8. Route → template map (every route conforms to exactly one)

| Route | Template |
|---|---|
| `#/` | B — Landing/Hub |
| `#/atlas` | D — Canvas |
| `#/library` | C — Workspace/Search |
| `#/resources` | C — Workspace/Search |
| `#/guides` | F — Directory |
| `#/record/*` | E — Detail |
| `#/compare` | C variant (two-pane compare, facet rail → column picker) |
| `#/build` (Produce a document) | E variant (form in MAIN, provenance sidebar) |
| `#/sources`, `#/about` | Simple content |
| `#/start` | fold into B (search prompt) — retire as its own page |

---

## 9. Build order

1. **App Shell fix** (§1): one `<main>` per route + slim the header. Unblocks the
   "every click feels like home" complaint across the whole site at once.
2. **Template E** (§5): the record page is the most-visited deep page and the worst
   offender. One description, one CSV link, sidebar hierarchy, dev details collapsed.
3. **Template C** (§3): unify Library + Resources onto the facet-rail skeleton;
   whole-row click targets; browse state for empty query.
4. **Template D** (§4): dock the Atlas totals/legend, right-side inspector with a
   real drill button.
5. **Templates B & F** (§2, §6): trim Home to 3 cards; hold Guides as the directory
   canon.

Acceptance for the whole spec: every route renders one `<main>`, maps to exactly one
template above, and no page prints the same content or link twice or exposes an
internal ID/filename in the main flow.

---

## 10. Copy — kill the salesperson AI-slop

Confirmed against live page text. The site has one dominant tell: **every headline
and subhead is a tricolon or a laundry list.** Three parallel verb phrases, or a
run of 5–7 nouns. That cadence is the thing that reads as AI/marketing filler. A
reference tool should sound like a librarian, not a landing page.

**The four slop patterns to strip:**
1. **Tricolon slogans** — three parallel clauses for rhythm, not meaning.
2. **Laundry lists** — "requirements, frameworks, controls, mappings, guidance, tools,
   and communities" jammed into one sentence to sound comprehensive.
3. **Anthropomorphized product** — "Tell Control Atlas what you are trying to do."
   The product is not a person; also violates the no-first/second-person-persona rule.
4. **Leaked internal metaphors** — the tree/limb model spoken to users ("the single
   common ancestor every limb hangs from").

**Live offenders → rewrite:**

| Where | Live copy (slop) | Why it's slop | Rewrite |
|---|---|---|---|
| Home H1 | "See the landscape. Trace the source. Move the work forward." | tricolon slogan | "Make federal cybersecurity compliance make sense." |
| Home subhead | "Control Atlas brings the federal cybersecurity landscape together in one place—requirements, frameworks, controls, mappings, official guidance, tools, and practitioner resources—so you can see what applies, understand how it connects, and get to the next step faster." | laundry list + tricolon, one breath | "Understand what applies, what it means, and what to do next." |
| Home 3rd line | "…go directly to the practical resources that help you do the work." | "do the work" filler | delete |
| Home preview | "The ecosystem at a glance" / "From authority to action" | brochure-speak | "How federal cyber material connects" (or cut the panel per §2) |
| Home card | "Tell Control Atlas what you are trying to do and get a focused next step." | anthropomorphized product | cut the card (§2); if kept: "Search by what you're working on." |
| Atlas eyebrow | "Federal cybersecurity, from authority to action" | slogan | delete; the H1 already says "Atlas" |
| Atlas trunk desc | "The cybersecurity discipline itself — the single common ancestor every limb hangs from." | leaked tree metaphor | "Browse cybersecurity areas and the publications under them." |
| Atlas inspector | "Select a node to inspect it. Use the action above only when you are ready to drill down." | clunky, hedgy | "Select a record to see its details." |
| Library subhead | "One ranked view across published records, guides, documents, resources, communities, and sources." | laundry list | "Search by identifier, title, or topic." |
| Resources H1 | "Find the ecosystem around the work" | vague slop | "Resources" (or "Tools, portals, and communities") |
| Resources subhead | "Search official portals, tools, services, training, product directories, and practitioner communities." | laundry list | "Find tools, training, and guidance for federal cybersecurity work." |

**Copy rules (hold every string to these):**
- **Read-aloud test.** If it sounds like a person reading a brochure, cut it.
- **No tricolons for rhythm.** One clear statement beats three parallel ones.
- **No laundry lists in prose.** If you must enumerate, use a list/facet UI, not a
  comma run in a sentence.
- **No anthropomorphized product.** Direct second-person language is allowed when
  it sounds natural. Never address Control Atlas as a person: no "Tell Control
  Atlas…" or "let us help you."
- **No internal metaphors on-screen** (trunk/limb/branch/leaf, "nothing floats loose",
  "aggregation mecca"). Users get plain nouns: area, publication, family, record.
- **Say the concrete thing.** "Search by identifier, title, or topic" beats
  "get to the next step faster."
- **Keep trust structural.** Preserve source text and show citations where they
  belong; do not make map, source, publisher, or provenance the product story.

Acceptance: no headline or subhead on any page is a three-part parallel slogan or a
5+ item comma list; no on-screen string addresses the product as a person or names
the internal tree metaphor. Record pages lead with publisher text and contain no
generic filler blocks.
