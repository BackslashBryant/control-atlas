# Epic 12: UX Stabilization — Live-Site Sniff Test and Rectification Spec

**Date:** 2026-08-08
**Status:** Proposed
**Source:** Live site only — `https://backslashbryant.github.io/control-atlas/`. No repo inspection was used to produce the findings. Every number below is a `getBoundingClientRect()` / `getComputedStyle()` read taken in-browser at 1440×900 and 375×812, or a quoted string copied from the rendered page.
**Supersedes for UX purposes:** `live-site-sniff-test-2026-08-03.md`, `live-site-polish-backlog.md` (P1 visual items)

**Why this epic exists:** the owner's stated gate is that no new features ship until the UI/UX is stable, scalable, and hooks the target user without friction or AI-slop. This document is the review that establishes the current state, and the spec that closes it.

---

## Part 0 — BLUF

The site has real substance and a real thesis. It loses users on **structure, not content**.

Three defects account for most of the "this feels wrong" reaction:

1. **The global navigation is not at the top of any interior page.** On search results, the brand and nav render 452px down a 900px viewport, below a page-title band and a second search box. On mobile it's 350px down an 812px screen. The first search result sits at 643px. A first-time visitor scrolls before they see the product's name or a way to move.
2. **Search results are undifferentiable and self-contradicting.** A query for "access control" returns four rows titled "Access Control" — three of them character-for-character identical — with no publisher shown, no text snippet ("Official description available — open this record to read it." on every row), and a "0 published connections" claim that the record page immediately contradicts with "3 CONNECTIONS."
3. **Every surface is a menu, and almost none of them is an answer.** Home stacks four competing entry systems; Compare opens with a disclaimer and five methodology-annotated choices; "Documents" is three cards that lead to other menus, one of which duplicates a top-level nav item. Between landing and reading one sentence of FIPS 200, a user passes roughly sixteen doors.

Underneath those sits the structural cause: **the system has no middle tier anywhere.** The nav is 11 flat items mixing corpora, actions, explanations and site meta. "Object type" is a flat list of 30 — including the internal graph terms `Limb` and `Trunk`, plus six separate `Zero Trust …` entries. "Control family" is a flat `<select>` of 172. There are **four parallel browse surfaces** (Library, Atlas, Resources, Sources) with four search boxes and four filter vocabularies — over what is demonstrably **one index**. Every new framework lands at the top level of every one of those lists, which is why the rail regrows no matter how often it is trimmed. Trimming 11 to 6 is not a fix; §1.3 and Phase 3 give the structure and the placement rule instead.

The one piece of good news that changes the cost of all of it: a global search for `Platform One` returns nine DISA STIG rules **and** a government-portal resource in the same ranked list. The unified index already exists. Unifying browse is a UI job, not a data migration.

Also: zero real hyperlinks on the entire site (74 `<button>`s, 2 `<a>`s — both skip links), view-state parameters stamped into URLs on plain nav clicks, and a prerendered "ghost" shell left in the layout after hydration.

The good news is that the hard part is done. **Guides** and **Sources** are genuinely strong. Contrast and focus rings pass. Nothing needs to be rebuilt — the work is removal, reordering, and one honest search result row.

---

# Part 1 — The Review

## 1.1 Walking in cold

What a target user (new to federal compliance, looking for a bookmark-worthy reference) actually encounters, in order.

**Landing.** Headline is a three-clause slogan: "Find the source. See what connects. Keep the work moving." Below it, a search box, then a link pair, then a 490×298px panel in the prime right-hand hero slot listing **Govern / Build / Assess / Operate / Defend**.

That panel is five non-interactive `<span>` elements:

```html
<div class="home-work-map" aria-label="The work Control Atlas covers">
  <span>Govern</span><span>Build</span><span>Assess</span>
  <span>Operate</span><span>Defend</span>
</div>
```

It is styled as a bordered list of rows with bullets. It looks exactly like a menu. It does nothing. The largest, most prominent interactive-looking element on the home page is decoration — and it duplicates the taxonomy of the seven cards immediately below it.

**Scrolling down.** Seven task cards render as 4 + 3 with a hole in the fourth slot of row two, and the two rows are different heights (104px vs 146px) because the copy lengths differ. Then a "What you can do here" section with three more cards. Then a closing line: *"Official public material stays primary and attributed. Control Atlas suggestions are labeled and never added to the published graph."*

"Published graph" is an internal term. The user does not know there is a graph, so they cannot be reassured that things are being kept out of it.

**Clicking Atlas.** The nav says "Atlas." The URL becomes `#/explore?relationshipView=path`. The page's `<h1>` says "Atlas." The breadcrumb says "Your choices: Explore." The content heading says "Landscape." Four names for one destination, before anything renders.

What renders is nine areas. Four of them — Risk, Assessment, Operations, Knowledge — have no record counts. They read "Connected work surface" where the other five read "9 publications / 1,902 records." **Forty-four percent of the flagship view is hollow**, and the placeholder text for "empty" is a phrase with no user meaning.

The owner's instinct here is correct. Clicking "Atlas" does not produce an atlas. It produces a nine-item list with connector lines, half of it unpopulated, under a heading that says "Landscape," at a URL that says "explore," with a view-state query parameter nobody asked for.

**Searching.** Typing "access control" into the global overlay returns:

| Title | Subtitle |
|---|---|
| Access Control | `FAMILY-AC` · Control family |
| Access Control | `AC` · Requirement |
| Access Control | `FAMILY-ACCESS-CONTROL` · Control family |
| Access Control | `FAMILY-ACCESS-CONTROL` · Control family |
| Access Control | … |

Every row's third line is identical: *"Official description available — open this record to read it."*

This is the single most damaging screen on the site. The product's promise is "find the source." The search result says: *we have the text, and we are not going to show you any of it.* There is no publisher on the title line, so two rows with the same ID are indistinguishable. The user cannot choose. They must open records one at a time to find out what they already searched for.

The overlay's own hint reads "Press Enter for the full results page." **Enter does nothing** — verified with the input focused and populated, the URL unchanged.

**Full results page.** 112 results, 10 rendered, "Show 15 more" — eight clicks to see everything. Each row carries three actions (Open in Atlas / Compare / Copy link) parked at x≈1225–1360 while the title sits at x=483: three-quarters of the screen width of travel, and the three buttons don't align with each other. Each row also states **"0 published connections."**

Opening the first result shows **"3 CONNECTIONS."**

**On the record.** "Where this sits" comes first. The official FIPS 200 text — one sentence, the entire reason the page exists — comes third. Below it, the same three connections are rendered three separate times: as summary chips, as an expanded "Other public mappings (3)" list, and again in the right rail under "PUBLISHED CONNECTIONS / PUBLISHED FACT." Each of the three carries identical boilerplate: *"References / Mandated source / Direct requirement or mapping from an official authoritative source."*

The right rail also says *"Imported from: FIPS 200 Artifact"* and *"Freshness check overdue — last checked 2026-06-13. This source may have changed. Verify the official source before relying on this page."* That is 56 days stale, on a flagship record, on a product whose differentiator is freshness.

## 1.2 Findings

Severity: **S1** breaks the core job · **S2** visible defect or major friction · **S3** polish

### Structure and layout

| # | Sev | Finding | Evidence |
|---|---|---|---|
| L1 | S1 | Global nav is not at the top of interior pages | Search results @1440×900, scrollTop 0: `.page-header` y=140, `header.site-header` **y=452**, `.search-result-row` y=643. Mobile 375×812: title band y=179, header **y=350**, first control y=438 |
| L2 | S1 | Dead space above the page-title band | Two empty `<div>`s (h=68, h=40) render before any content on interior routes; 179px equivalent on mobile |
| L3 | S1 | Prerender ghost stays in the layout after hydration | `.static-route-shell` h=188 persists at y=108 post-hydration on `#/explore` and `#/catalog`; still present on fresh loads |
| L4 | S2 | Duplicate DOM across routes | 2 `<main>` (both `display:block`), **4 `<h1>`** ("Find the source…", "Library" ×3), 2 `header.site-header`, 2 `<footer>`, 2 "Skip to workspace" links |
| L5 | S2 | Primary nav overflows at desktop width | `nav.primary-nav` scrollWidth 481 vs clientWidth 467 @1440px, `overflow-x: auto` → a scrollbar renders across the header |
| L6 | S3 | Horizontal overflow on the Atlas route | `main` / `.app-shell` scrollWidth 1381 vs clientWidth 1354 (27px) |

### Navigation and IA

| # | Sev | Finding | Evidence |
|---|---|---|---|
| N1 | S1 | Nav label ≠ route on 5 of 8 destinations | Atlas→`#/explore`, Library→`#/catalog`, Guides→`#/learn`, Documents→`#/build` |
| N2 | S1 | Zero hyperlinks site-wide | 74 `<button>`, 2 `<a>` — both `#workspace` skip links. No Cmd/Ctrl-click to a new tab, no right-click copy link, no hover URL preview, no crawlable internal linking. Comparing two controls side by side — the core job — is impossible without losing your place |
| N3 | S2 | View-state stamped into URLs on plain nav clicks | Atlas → `?relationshipView=path`; Compare → `?crosswalk=intent&workbench=intent`; records → `?from=search&returnTo=%2Fsearch%3Fq%3Daccess%2Bcontrol`. `novice` still appears 6× across shipped bundles |
| N4 | S2 | 11 nav items, two type scales, one duplicate destination | Left cluster 12px uppercase (Atlas/Library/Compare/Guides/Documents), right cluster 14px (Search/Resources/Sources/About/Help/Start here). **Help and About both resolve to `#/about`** |
| N5 | S2 | "Documents" is a menu of menus | `#/build` contains only three cards — Tasks, Starter documents, Resources — each saying "Open X." Resources is also a top-level nav item |
| N6 | S2 | Two competing "what are you doing?" taxonomies | Home offers 7 cards (Understand a requirement / Secure or build a system / …); Start here step 1 offers 6 different goals (Understand requirements / Select or scope controls / …). Same question, different vocabularies |
| N7 | S3 | Modal state survives route navigation | Help drawer + search overlay remained open and stacked across a forced navigation to a different route; two dismiss buttons visible simultaneously |

### Search

| # | Sev | Finding | Evidence |
|---|---|---|---|
| S1 | S1 | Results are undifferentiable | Query "access control": 4 of the first 6 titled "Access Control"; three identical as "Access Control (ACCESS-CONTROL) family". No publisher on the title line |
| S2 | S1 | The snippet slot refuses to show the snippet | Every row: *"Official description available — open this record to read it."* |
| S3 | S1 | Result rows contradict the record | Rows show "0 published connections"; the record for the same item shows "3 CONNECTIONS" |
| S4 | S2 | Enter is a dead end in the global overlay | Overlay hint says "Press Enter for the full results page." Enter pressed with the input focused and populated → URL unchanged, no navigation |
| S5 | S2 | The overlay input fill is off-centre — *the "blue box"* | Wrapper `.search-input.search-overlay-input` x=417 w=550; inner `<input>` x=455.1 w=498.9. Left inset **38.1px**, right inset **13.0px**. The input carries its own `rgb(45,58,66)` background distinct from the wrapper, so the 25px asymmetry is plainly visible inside the cyan border |
| S6 | S2 | `.catalog-search` breaks below ~500px of container width | Icon and input wrap onto separate lines; wrapper renders 64–67px tall instead of 44px. Confirmed on Library desktop (icon y=562, input y=586) and mobile (icon y=632, input y=654) |
| S7 | S2 | Row actions are far from the row | Title x=483; actions x=1225–1360. Three buttons across two lines with mismatched right edges (1360 / 1283 / 1360) |
| S8 | S3 | Pagination is 10 + 15 | 112 results → 8 clicks to see all |
| S9 | S3 | Four search boxes, four scopes, four descriptions | Home hero, Library page, Library filter, global overlay — each with different placeholder copy. Nothing tells the user which one searches everything |

### Record page

| # | Sev | Finding | Evidence |
|---|---|---|---|
| R1 | S1 | Orientation precedes payload | "Where this sits" renders before "Official description"; the one-sentence FIPS 200 text is the third block |
| R2 | S2 | The same 3 connections render three times | Summary chips → "Other public mappings (3)" → right-rail "PUBLISHED CONNECTIONS." "Other" implies a different set; it is the same set |
| R3 | S2 | Identical boilerplate on every connection | *"References / Mandated source / Direct requirement or mapping from an official authoritative source."* ×3 |
| R4 | S2 | Primary CTA sends users away from the content | "OPEN IN THE ATLAS" is the styled primary action on a record page |
| R5 | S2 | Two competing back affordances | "← LIBRARY" (top right) and "BACK TO RESULTS" (below) with different destinations |
| R6 | S2 | Stale-source scolding on a flagship record | "Freshness check overdue — last checked 2026-06-13" (56 days as of today) |

### Atlas

| # | Sev | Finding | Evidence |
|---|---|---|---|
| A1 | S1 | Four of nine areas are hollow | Risk, Assessment, Operations, Knowledge show "Connected work surface" instead of counts; the other five show "N publications / N records" |
| A2 | S1 | Intermittent permanent hang on cold load | `#/explore` stuck on "Opening the selected workspace" indefinitely (>30s), reproduced **2 of 3 attempts**; a fresh tab loaded in <8s. All 32 JS assets and both data payloads returned 200 (`jsonParseWorker` 723 B / 93 ms). Not deterministic — needs instrumentation, not a guess |
| A3 | S2 | Four names for one destination | Nav "Atlas" / route `explore` / `<h1>` "Atlas" / breadcrumb "Explore" / section heading "Landscape" |

### Copy and audience calibration

| # | Sev | Finding | Evidence |
|---|---|---|---|
| C1 | S1 | Internal vocabulary shipped to users | "published graph", "PUBLISHED FACT", "Only published graph relationships with citations appear here", "Imported from: FIPS 200 Artifact", "Connected work surface", "Publisher-declared structure", "Atlas landscape ready.", and — in **Help**, of all places — "Go to the surface named on the masthead keycap" |
| C2 | S1 | Build notes rendered as UI copy | Atlas: *"Mappings, baselines, RMF, and evidence appear after focus, not as parents."* That is a graph-parenting rule, not a sentence for a user |
| C3 | S2 | Data-model categories exposed as filters | Sources "Source type": Published federal source / Federal referenced / Federal utilized / Federal program / Publisher / Publisher supplement / Control atlas derived / Government mapping. Also "Map inclusion: Included in map / Limited use / Excluded from map" |
| C4 | S2 | Defensive framing at first contact | Compare opens with *"A missing mapping does not prove there is no relationship…"* before the first choice. Start here step 1 opens with *"Control Atlas does not decide what applies to your system."* |
| C5 | S2 | Methodology annotations on decision cards | Every Compare option carries an "Evidence:" line ("Evidence: a CCI-mediated path — STIG/SRG to CCI to NIST control"). Options 1 and 5 have **identical** Evidence text — a copy/paste artifact |
| C6 | S3 | Filter vocabularies are inconsistent and mis-sorted | Library "Record type (advanced)" mixes casing ("SRG requirements", "activities", "baseline records" vs "baselines") and is not alphabetical ("Control family" sorted after "D3FEND countermeasure"). "Lifecycle" offers exactly one non-All value ("active") |

### Accessibility

| # | Sev | Finding | Evidence |
|---|---|---|---|
| Y1 | S2 | Heading structure is flat and duplicated | 4 `<h1>` on one document; every search result title is an `<h2>` (10 per page) |
| Y2 | S2 | Two `<main>` landmarks, both `display:block` | Invalid; assistive tech and reader-mode extractors pick the wrong one — a text extraction of the search-results URL returns the **home page** content |
| Y3 | S2 | Unlabelled form controls | All four Library comboboxes expose the accessible name "All" |
| Y4 | S2 | Touch targets below minimum | 23 targets under 32px at 375px wide, including result titles at **h=15px** and footer nav items at 28×22. WCAG 2.5.8 floor is 24×24; platform guidance is 44×44 |

### What is already right — do not regress it

- **Colour contrast passes.** A full sweep of every leaf text node in `main` and the header against computed backgrounds produced **zero** WCAG AA failures.
- **Focus rings are strong**: `outline: solid 3px rgb(231,225,213)` plus a `0 0 0 3px rgba(84,188,217,.28)` ring.
- **No horizontal overflow at 375px.**
- **Guides (`#/learn`) is the best thing on the site** — twelve plain-English topics with one-line explanations that respect the reader ("Inheritance and common controls — Why the same control doesn't get assessed twice"). It is nav item #4, behind a label that doesn't say what it is.
- **Sources (`#/sources`)** is real substance: 102 sources with publisher, coverage, version, and status.
- **Start here** is the right idea, correctly matching situation → requirements. It is the last item in the nav.
- **"Free and open source, not a government system."** Exactly the right trust line — currently in the hidden footer copy.

## 1.3 The information architecture is the root cause

The rail having twelve things is a symptom. The disease is that **the system has no middle tier anywhere**, so every new piece of content lands at the top level of whatever list it belongs to.

Measured, on the live site:

| Flat list | Items | Contains |
|---|---|---|
| Top nav | **11** + wordmark | Four unrelated kinds of thing in one row (below) |
| Search "Object type" | **30** | Control, Control enhancement, Requirement, SRG requirement, STIG rule, STIG/SRG benchmark, ATT&CK technique, Tactic, D3FEND countermeasure, Baseline, Catalog, CSF category, CSF function, Control family, Group, Impact category, **Limb**, **Trunk**, Policy, Program, RMF step, Assessment procedure, Practice, and **six** separate `Zero Trust …` types |
| Search "Control family" | **172** | A 172-option `<select>` |
| Sources "Source type" | 10 | Published federal source / Federal referenced / Federal utilized / Federal program / … |
| Library "Record type" | 17 | Mixed casing, not alphabetical |

`Limb` and `Trunk` are internal graph-structure terms exposed as user-selectable filter values. Six of the thirty object types are one framework's internal breakdown. Ingest two more frameworks and this list is fifty.

**The nav mixes four different kinds of thing in one flat row:**

- **Corpora you browse** — Atlas, Library, Sources, Resources
- **Actions you take** — Search, Compare, Documents
- **Explanations you read** — Guides
- **Site meta** — About, Help, Start here

A flat rail gives a new capability nowhere to go except the rail. That is the scalability failure, precisely.

### There are four parallel browse experiences over one index

| Surface | Nav slot | Contents | Own search? | Own filter vocabulary? |
|---|---|---|---|---|
| Library `#/catalog` | yes | 23 publications / ~5,322 records | yes (×2) | Area, Publisher, Lifecycle, Record type |
| Atlas `#/explore` | yes | the same records, 9 areas (4 empty) | yes ("Jump to another record") | none |
| Resources `#/resources` | yes | 114 resources, 8 collections | yes | own "Filters" |
| Sources `#/sources` | yes | 102 sources | yes | Source type, Status, Map inclusion, Access, Publisher |

Four top-level slots, four search boxes, four filter vocabularies — and **they are already one index.** A global search for `Platform One` returns nine DISA STIG rules *and* a `GOVERNMENT PORTAL — Department of the Air Force software ecosystem` resource in the same ranked list.

That single observation is the most important finding in this document: **unifying browse is a UI and IA job, not a data migration.** The hard part is already built.

Two more things that observation exposes:

- **Filters are unstable between queries.** `access control` renders Publication + Object type; `Platform One` renders Publication + Object type + Source type + Control family + Severity. The user cannot learn a control set that changes underneath them. One of those queries also renders a `Publication` filter with exactly **one** option.
- **Relevance is weak across corpora.** For `Platform One` — a DoD software factory — results 1–9 are STIG rules about Wi-Fi Alliance certification and FIPS 140-2 WLAN components. The one obviously correct answer ranks **10th**.

### Same objects, two front doors

`tasks` is already a record type inside Library's own filter. `Documents → Tasks` is a separate top-level path to those same objects. Resources is both a top-level nav item *and* a card inside Documents. So a record can be reached under three different parents with three different names, which is why no breadcrumb can be stable and why a record opened from search highlights "Library" in the nav.

## 1.4 The pattern

Three themes explain nearly every finding.

**Chrome outranks content.** On interior pages the sequence is: empty space → prerender ghost → page-title band → page search → global nav → breadcrumb → toolbar → content. Content is seventh. Fixing the ordering fixes L1, L2, L3, R1 and most of the "cramped nav / weird layout" complaint at once.

**The build's vocabulary reached the user.** "Published graph," "PUBLISHED FACT," "Connected work surface," "Imported from … Artifact," "Federal utilized," "surface named on the masthead keycap." These read as AI-slop to a newcomer because they are unfalsifiable phrases that carry no meaning outside the repo. This is the [audience-calibration] and [no-insider-copy] rules being violated at scale, not in one or two strings.

**Menus stand in for answers.** Home 4 systems / 16 doors · nav 11 items · Start here 6 goals · Compare 5 options + disclaimer · Documents 3 links to other menus · Library 2 searches + 5 filters · results sort + filters + 3 actions per row. The product is highly capable and keeps asking the user to choose instead of showing them something.

---

# Part 2 — The EPIC

**Goal:** get Control Atlas to a stable, scalable UI/UX baseline that delivers on the first click and stops leaking build vocabulary — so feature work can resume.

**Definition of done:** a first-time visitor can land, search a term they know, tell the results apart without opening them, read official text, and open a second record in a new tab to compare — without meeting internal vocabulary, a dead control, or a contradiction.

**Sequencing rule:** phases are ordered so each one is independently shippable and visibly better. Phase 1 is the highest ratio of perceived improvement to risk. Do not start Phase 4 before Phases 1–3 are on the live site.

## Phase 1 — Put the page back in order

*Closes L1, L2, L3, L4, L5, L6, R1. This is the phase that answers "the layout is weird."*

**Scope**

1. **Global header is the first painted element on every route, at y=0.** No page-title band, no page search, no ghost above it.
2. **Delete the prerender shell after hydration.** `.static-route-shell` must be removed from the layout — not faded, not zero-opacity — once the app mounts. Also remove the two empty spacer `<div>`s (h=68, h=40).
3. **Collapse the page-title band into the header region.** Route title becomes a compact breadcrumb/title strip immediately under the nav, ≤64px, not a 124–139px hero with an eyebrow that repeats the `<h1>`.
4. **One `<main>`, one `<h1>`, one `<footer>`, one skip link per document.** Unmount previous routes rather than leaving them in the DOM.
5. **Fix nav overflow at 1440px** (L5) and the 27px `.app-shell` overflow on `#/explore` (L6).
6. **Record page order becomes:** title → official text → source & freshness → where this sits → connections → advanced.

**Acceptance criteria**

- On every route at 1440×900 and 375×812, scrollTop 0: `header.site-header` has `y === 0`.
- First meaningful content is above 400px at 1440×900 and above 480px at 375×812.
- `document.querySelectorAll('main').length === 1`, `h1` length `=== 1`, `footer` length `=== 1`, `.skip-link` length `=== 1`, on all of: `#/`, `#/explore`, `#/catalog`, `#/search?q=access+control`, `#/record/fips-200/AC`, `#/compare`, `#/learn`, `#/build`, `#/sources`, `#/about`, `#/start`.
- `document.querySelector('.static-route-shell') === null` two seconds after load.
- For every element with `clientWidth > 100`: `scrollWidth <= clientWidth + 2` at 1440, 1024, 768 and 375.
- On the record page, the official-text block's `getBoundingClientRect().y` is less than the "Where this sits" block's.

## Phase 2 — Make search answer the question

*Closes S1–S9, R2, R3. This is the phase that decides whether anyone comes back.*

**Scope**

1. **Publisher on the title line, always.** `Access Control` becomes `NIST SP 800-53 Rev. 5 · Access Control (AC)`. No two visible rows may render an identical title + subtitle pair.
2. **Show the text.** Replace *"Official description available — open this record to read it."* with the first ~180 characters of the official text, with the matched term marked. If a record genuinely has no text, say what it does have — never advertise withheld content.
3. **Fix the connection count** (S3). One source of truth shared by the row and the record. A record showing 3 connections must not appear in results as 0.
4. **One action per row.** The row itself opens the record. Move Compare and Copy link into a hover/focus affordance or the record page. Remove the standalone "Open record" button.
5. **Fix the overlay input fill** (S5): the input fills its wrapper, insets symmetric, no independent background colour.
6. **Fix `.catalog-search` wrapping** (S6): icon and input stay on one line down to 320px; wrapper height fixed at 44px.
7. **Enter works** (S4) — Enter in the overlay navigates to `#/search?q=…`. If a suggestion is highlighted, Enter opens it; otherwise it goes to full results.
8. **Consolidate to two search entry points**: the global overlay (searches everything) and one in-page filter where a page has its own list. Retire the redundant third and fourth boxes. Use one placeholder string for the global search everywhere it appears.
9. **Left filter rail is visible on first paint** on the results page — publisher, record type, and framework — not below the fold and not duplicated by a separate FILTERS button.
10. **Page size 25**, with "Show 25 more."

**Acceptance criteria**

- For `q=access control`, no two visible result rows have identical rendered `title + subtitle` text.
- Every result row displays a publisher and a non-boilerplate description; the string "open this record to read it" appears zero times in the DOM.
- For each of the first 10 rows, the row's connection count equals the count rendered on that record's own page (assert both).
- `.search-input` inner `<input>`: `|leftInset - rightInset| <= 2px`, and the input's computed `background-color` equals its wrapper's.
- Every `.catalog-search` wrapper has `height <= 46` and its input's `y` is within 6px of its icon's `y`, at 1440 / 768 / 375.
- Pressing Enter in the overlay with a non-empty query changes `location.hash` to a `#/search` route.
- Filter rail is within the first viewport at 1440×900, scrollTop 0.

## Phase 3 — Information architecture: one corpus, three doors, a rule for the next thing

*Closes N1, N3, N4, N5, N6, A3, R4, R5, the four-browsers problem, the 30-item and 172-item filters, and the home page. This is the phase the owner is asking for: not a smaller rail, a structure that stops the rail from regrowing.*

**Principle:** there is one corpus and one record type that matters. Everything else is a **lens** on records (a view), an **action** on records, or an **explanation** of records. Only a genuinely new product earns a nav slot.

### 3.1 The rail

Persistent search **field** in the header — search is a control, not a destination.

**Primary (3):**

| Label | Route | What it is |
|---|---|---|
| **Start here** | `#/start` | Guided: situation → requirements. The door for someone who doesn't know the vocabulary |
| **Library** | `#/library` | The one browse surface over the one index. The door for someone who does |
| **Guides** | `#/guides` | The twelve explainers. Currently the best content on the site and the fourth-least visible |

**Utility (2), visually subordinate:** **Sources** `#/sources` · **About** `#/about` (absorbs Help).

Eleven items to three plus search plus two. Labels, routes, `<h1>`s and breadcrumbs all use the same word.

### 3.2 Where the removed items go

| Today | Becomes | Why |
|---|---|---|
| **Atlas** | A lens with three entry points — see §3.2a | Owner decision 2026-08-08: off the rail, **not** demoted. Visualizing and drilling into the graph stays a key capability; it stops being a blank destination |
| **Compare** | A record action ("What does this map to?") plus a Library multi-select mode | Compare as a destination means landing the user on a blank five-option configuration screen. Comparison always starts *from* something |
| **Documents** | An outcome of Start here, plus a record action ("Produce a document") | It is a hub of three cards that link to other menus. `tasks` is already a Library record type — the objects are in the corpus |
| **Resources** | A record-type facet in Library ("Tools & communities") | Already returned by global search alongside STIG rules. Its 8 curated collections become saved Library views |
| **Help** | Merged into About | They already resolve to the same route |
| **Search** | A persistent field, not a nav item | It is a control |

**Nothing is deleted.** Every surface keeps its content and gets a verified entry point; the audit for this phase is a table of each relocated surface and the click path that reaches it.

### 3.2a Atlas as a lens — one slot out, ~5,300 entry points in

**The owner's constraint:** Atlas comes off the primary rail, but visualizing and drilling into the graph remains a key capability. Those are compatible, because the rail slot was never what made the map valuable — and today it is what makes it *weak*.

**Why the blank destination is the problem.** A map is only useful when you have a position on it. Arriving at `#/explore` cold gives you nine areas, four of them empty, with no query behind them — so the first thing the flagship view does is show you what it doesn't have (A1). Anchor the same view to something the user already cares about and it becomes the strongest surface on the site.

**Three entry points, each more numerous than one rail slot:**

1. **`Library ▸ List | Map`** — a persistent segmented toggle on every Library result set. **The map is a projection of the current query and filters.** Filter to 800-53 AC family → map of that. Filter to "Threats & defenses" → map of that. Because the map always renders a non-empty result set, *it can never open empty* — this closes A1 structurally rather than by hiding nodes.
2. **Record → "See this in the map"** — opens the map centred on that record with its neighbourhood expanded. This is the drill-down job, and it exists on every one of ~5,300 records.
3. **Guides and Start here → map deep links** — an RMF guide links to the map centred on RMF steps; a Start-here outcome can hand off to the map for its scope.

**`#/atlas` stays a real, deep-linkable route.** Off the rail is not off the site. It remains the whole-graph overview — reachable from a "zoom out to the whole atlas" control in the Library map view, from Guides, and by direct link. It is bookmarkable and shareable like any other page.

**The map and the breadcrumb become the same hierarchy in two representations.** Drill path matches the canonical parent from §3.4 exactly:

```
Area → Publisher → Publication → Family / Section → Record
```

That is the roots-to-leaves structure expressed as a *view* — which is where it belongs — instead of as filter values named `Trunk` and `Limb`.

**Honesty about empty nodes.** Where a whole-graph area genuinely has no records, it shows a real count and a plain sentence ("Nothing published here yet"), never "Connected work surface." Zero is a fine answer; a placeholder phrase that hides a zero is not.

**Naming.** The map view is labelled **"Atlas map"** wherever it appears, so the product's own word stays visible on the surfaces people actually use — every Library result set and every record — rather than on one nav item.

**Acceptance criteria for 3.2a**

- A `List | Map` toggle renders on every Library result set; switching preserves the active query, filters, sort and scroll position, and updates the URL.
- The map never renders zero nodes when the underlying result set is non-empty.
- Every record page exposes "See this in the Atlas map," which opens the map centred on that record with its immediate neighbourhood expanded.
- `#/atlas` loads the whole-graph overview directly and is reachable from the Library map view without going through the rail.
- Breadcrumb text on a record reached by drilling through the map is byte-identical to the breadcrumb on the same record reached from search.
- The string `Connected work surface` appears zero times; every visible area shows an integer count.

### 3.3 The two-tier taxonomy

Replace the flat 30-item "Object type" with six user-facing kinds, each expanding to the raw types as a second-level refinement:

1. **Requirements** — Control, Control enhancement, Requirement, SRG requirement, Practice, Zero Trust activity / capability / tenet
2. **Technical rules** — STIG rule, STIG/SRG benchmark
3. **Threats & defenses** — ATT&CK technique, Tactic, D3FEND countermeasure
4. **Baselines & profiles** — Baseline, Catalog, Impact category, Zero Trust overlay catalog / section
5. **Process & methods** — RMF step, Assessment procedure, Task, Program, Policy
6. **Tools & communities** — Resources, portals

**Remove from user-facing filters entirely:** `Limb`, `Trunk`, `Group`, and `CSF function`-as-a-type. These are structure, not content — they belong in the breadcrumb, not a dropdown.

**Control family (172 options)** becomes a typeahead scoped to the selected publication, never a `<select>`.

**Filters become stable across queries.** The same control set renders for every search; values that don't apply are disabled with counts, not removed. A filter with fewer than two applicable values does not render.

### 3.4 The canonical-parent rule

Every record has exactly **one** canonical URL and **one** canonical breadcrumb:

```
Publisher → Publication → Family / Section → Record
```

Arrival path never changes the breadcrumb or the active nav item. This kills `from=` / `returnTo=`, makes shared links mean one thing, and restores the family/section tier that framework catalogs currently skip — the shallow-to-deep gap.

### 3.5 The placement rule — write this into the repo as a gate

Every new thing is exactly one of four kinds, and each has exactly one home:

1. **New content** (source, framework, record type, resource collection) → a **facet value in Library**. Never a nav item.
2. **New action on content** (compare, export, generate, annotate) → a **record action**, optionally a Library bulk mode. Never a nav item.
3. **New explanation** → a **Guide**. Never a nav item.
4. **New provenance or trust surface** → **Sources** or the footer. Never a nav item.

If a proposal fits none of the four, it is a new product — and that is the only thing that earns a rail slot. Add this to `CLAUDE.md` / the contributing doc so the rail cannot regrow by default.

### 3.6 Also in this phase

- **No view-state in URLs on a plain nav click.** Strip `relationshipView`, `crosswalk`, `workbench` from default navigation; strip `from` and `returnTo` from "Copy link". Back comes from browser history. Remove the residual `novice` references.
- **One taxonomy for "what are you doing."** Home's 7 cards and Start here's 6 goals become one set of words, used in both places.
- **Home page reduction.** Delete the fake `.home-work-map` menu (or make its five items real Library filters). One entry system: headline + search + the single task taxonomy. Even grid, equal card heights. Preview cards cut or moved below the fold.
- **Record page:** primary action is "Open official source"; "Open in the Atlas" becomes secondary. One back affordance.
- **A real footer** on every route: "Free and open source, not a government system," last-updated, source attribution — and the "Submit resource / Report a problem" affordances that currently exist only on the Resources page.

**Acceptance criteria**

- `header.site-header` renders exactly 3 primary + 2 utility items, one computed `font-size` across the primary set, `scrollWidth <= clientWidth` from 1024px up.
- No two nav items resolve to the same route; label, route segment, `<h1>` and breadcrumb match for all five.
- Clicking any nav item produces a hash with no query string.
- "Copy link" on a record yields a URL matching `^https://[^?]+#/record/[^?]+$`.
- Library returns records, resources, and sources in one result set from one search field; `#/resources` and `#/catalog` redirect to Library views.
- Every `<select>` in the filter rail has ≤10 options; no filter renders with fewer than 2 applicable values; the rendered filter control set is identical for `q=access control` and `q=Platform One`.
- The strings `Limb`, `Trunk`, and `Group` appear zero times in any user-facing filter.
- The same record reached from search, from Library, and from a direct link renders an identical breadcrumb and highlights the same nav item.
- `document.querySelectorAll('.home-work-map span:not(button)').length === 0`; home and Start here use identical taxonomy strings.
- A relocation audit table exists listing every moved surface and a verified click path to it.
- A visible `<footer>` exists on every route.

## Phase 4 — Say it in English

*Closes C1–C6, and the "AI-slop" objection.*

**Scope**

1. **Ban list, enforced by a test.** No user-visible string may contain: `published graph`, `PUBLISHED FACT`, `Connected work surface`, `Publisher-declared structure`, `Imported from`, `Artifact` (as a noun for an ingested file), `surface` (as a UI noun), `masthead`, `landscape ready`, `Federal utilized`, `Federal referenced`, `Map inclusion`, `Included in map`, `Excluded from map`, `Correlated through`.
2. **Rewrite the offenders** rather than deleting them. Examples: "Only published graph relationships with citations appear here" → "Every link below comes from a published source, with the citation." · "Imported from: FIPS 200 Artifact" → "From: FIPS 200." · "Connected work surface" → "No records yet."
3. **Delete build notes from the UI.** "Mappings, baselines, RMF, and evidence appear after focus, not as parents." and "Atlas landscape ready." come out entirely.
4. **Move disclaimers out of first contact.** Compare's "A missing mapping does not prove…" moves to a footnote on the results it qualifies. Start here loses "Control Atlas does not decide what applies to your system" from step 1.
5. **Cut the "Evidence:" lines** from Compare's decision cards (and fix the duplicated one). Show provenance on the result, not on the menu.
6. **Rewrite the Sources "Source type" filter** into categories a newcomer can distinguish, or replace it with publisher + status and drop the taxonomy. Sort every filter list; fix the casing in Library's record-type list; delete the "Lifecycle" filter while it has one value.
7. **Record connections render once**, not three times (R2), with the boilerplate line (R3) removed — the differentiating information is the target and the relationship, and it is one line.
8. **Fix or hide the freshness warning** (R6). A 56-day-stale banner on a flagship record either gets a refresh or gets a calmer presentation. Do not scold the user about your own pipeline.

**Acceptance criteria**

- An automated scan of rendered text across all 11 routes plus one record produces zero ban-list hits.
- No user-visible string contains a sentence about graph parenting, focus semantics, or ingestion state.
- Each connection on a record appears exactly once.
- Every `<select>` list is sorted, consistently cased, and has ≥2 meaningful values.

## Phase 5 — Links, semantics, and touch

*Closes N2, Y1–Y4, N7.*

**Scope**

1. **Records, publications, nav items, and external sources become real `<a href>`.** This is the highest-leverage single change for the core job: opening three controls in three tabs to compare them. Keep the SPA interception on plain click; let the browser handle modified clicks.
2. **One `<h1>` per page**; result titles become `<h3>` inside a list, not ten sibling `<h2>`s.
3. **Label the comboboxes** (Y3) so each has a distinct accessible name.
4. **Minimum 44×44 touch targets** at 375px; result titles become full-row targets.
5. **Modal state resets on route change** (N7); only one overlay at a time.
6. **`aria-current="page"`** on the active nav item, and correct active state on record pages (currently highlights "Library" for a record reached from search).

**Acceptance criteria**

- Every record and publication is reachable via an `<a href>`; Cmd/Ctrl-click opens a working new tab at the correct record.
- Zero `<button>` elements whose sole purpose is navigation to an in-app route.
- At 375px, zero interactive elements with `width < 44 || height < 44`.
- axe-core: zero serious/critical violations on all 11 routes.
- Navigating routes with an overlay open closes the overlay.

## Phase 6 — Make the Atlas map worth drilling into

*Closes A1, A2, A3. Sequenced last because §3.2a has already given the map its three entry points; this phase makes what they open worth the click.*

The purpose is now settled and does not need re-deciding: **the Atlas map shows where a record sits, what surrounds it, and what it descends from.** Phase 6 delivers against that sentence.

### 6.1 The model: a skill tree

**Owner direction, 2026-08-08:** a skill-tree-style view you branch through and can work your way back up.

It is the right metaphor, for reasons that are specific rather than decorative:

- **Spatial persistence.** A skill tree is a fixed map you learn. The same node is in the same place every visit, so returning users navigate by memory. A force-directed graph re-lays out on every render and destroys that — which is a large part of why the current view reads as a diagram rather than a map.
- **Progressive disclosure is native to the form.** Trunk → branch → leaves is exactly Area → Publisher → Publication → Family → Record. The structure the product already has finally gets a shape.
- **It has silhouette.** A skill tree is legible zoomed out; nine boxes with connector lines are not. Legible-at-a-glance is the difference between a map and a diagram.
- **"Work your way back" is the underserved half, and the most valuable.** From a STIG rule up through its CCI, to the NIST control, to the family, to the publication, to the law or policy that authorises it. *"Why does this rule exist?"* is the question a newcomer actually has, and it is literally a path up a tree. Today it is two lines of breadcrumb text under "Where this sits."

### 6.2 Three constraints, or the metaphor breaks

Skill trees have properties that compliance data does not. Each of these is a hard design rule:

1. **The tree is the canonical hierarchy only — single parent, no exceptions.** Cross-framework mappings are many-to-many (one control reaches CSF, CMMC, STIGs, ATT&CK). Drawing those as tree edges produces the hairball that was already rejected. **Mappings are a toggleable overlay**: selecting a node lights up its counterparts on other branches, drawn as highlights, never as structural edges. This is §3.4's canonical-parent rule expressed visually, and it is what keeps the tree a tree.
2. **Draw structure, count leaves.** There are ~5,300 records; a drawable tree is a few hundred nodes. Render Area → Publisher → Publication → Family. A family node reads "17 controls" and opens a list. Never attempt to draw the record layer.
3. **No locks, no progression, no completion.** A skill tree implies prerequisites and unlocking. Nothing here is locked, and implying "you must finish X first" would be false and would contradict the product's own honesty about not deciding what applies to a given system. Show position and counts; never gate.

### 6.3 Scope

1. **Deterministic layout.** Same node, same coordinates, every load, for every user. No force-directed simulation. Positions derive from the canonical hierarchy and are stable across data updates.
2. **Branch out (down).** Expand from a root toward records; each expansion writes to the URL so any depth is shareable.
3. **Trace back (up).** From any record or node, light the full path to its authority root as a first-class action — the "why does this exist" answer. This is a headline feature, not a breadcrumb.
4. **Mapping overlay.** Toggle that highlights a selected node's cross-framework counterparts on other branches without adding structural edges.
5. **Query projection.** The tree renders the active Library result set; `#/atlas` is the case where that set is "everything." Because it always projects a non-empty set, it cannot open empty.
6. **Honest counts.** Populate, merge, or plainly label Risk / Assessment / Operations / Knowledge. No placeholder phrases standing in for zero.
7. **Fix the cold-load hang** (A2). Intermittent: 2 of 3 attempts in one tab, clean in a fresh tab, every asset 200 (`jsonParseWorker` 723 B / 93 ms). **Instrument the workspace-open path and the JSON parse worker before attempting a fix — do not guess.** Ship a timeout with an actionable error state regardless, so the worst case is a message rather than an infinite spinner.
8. **One name** — "Atlas map" in the view toggle, record action, `<h1>`, breadcrumb and section heading.

> **Supersedes a prior endorsed decision.** `atlas-depth-spine-decision` (owner-endorsed 2026-07-26) called for a rail + Miller-column redesign to replace the ELK graph. Miller columns and a skill tree traverse the same hierarchy; the skill tree adds spatial persistence and a visible silhouette, which Miller columns do not have. Flagging the change explicitly so it is a decision rather than a drift — the rail-first increment from that decision remains valid and is still the cheapest first slice.

**Open-source-first gate applies before any custom renderer.** Deterministic-layout tree/DAG rendering is a solved problem; name and evaluate the maintained candidates (licence, health, bundle size, static-site fit, ~400-node performance, accessibility of the output) and record concrete rejection reasons before writing a bespoke layout engine. A hand-rolled renderer is allowed only for the gap that remains after those are named.

**Acceptance criteria**

- Node coordinates are byte-identical across two separate cold loads of the same data.
- The tree renders the active Library query; changing filters changes the tree without a full reload.
- "Trace back" from any record renders the complete path to its authority root, and that path matches the record's breadcrumb exactly.
- Toggling the mapping overlay adds zero structural edges — the tree's parent/child set is unchanged.
- No more than 500 nodes are drawn at any zoom level; the record layer is never drawn.
- Every visible area shows an integer count; zero occurrences of `Connected work surface`; nothing in the UI implies locking, prerequisites or completion.
- Drill state is encoded in the URL and restores on reload at every depth.
- 20 consecutive cold loads of `#/atlas` render content within 5s or show an actionable error; **zero indefinite spinners**.
- The same word appears in the toggle, the record action, the `<h1>`, the breadcrumb and the section heading.

**Acceptance criteria**

- The map renders the active Library query; changing filters changes the map without a full reload.
- Every visible area shows an integer count; zero occurrences of `Connected work surface`.
- Drill state is encoded in the URL and restores on reload at every depth.
- 20 consecutive cold loads of `#/atlas` render content within 5s or show an actionable error; **zero indefinite spinners**.
- The same word appears in the toggle, the record action, the `<h1>`, the breadcrumb and the section heading.

---

## Verification

Add a live-site UX regression suite that runs the acceptance criteria above against the built site, not against components. Most criteria in Phases 1–5 are single `getBoundingClientRect` / `querySelectorAll` assertions and belong in the fast inner loop; only Phase 6's 20-run cold-load check is expensive, and it runs once per milestone.

Two checks deserve to be permanent CI gates because they are the ones that regressed silently:

- **Ban-list scan** over rendered text on every route (Phase 4).
- **Chrome-before-content** assertion: `header.site-header` at y=0 and first content above 400px, on every route at three widths (Phase 1).

## Explicitly out of scope

New features of any kind, new sources, new record types, graph algorithm work, template/document generation changes. The gate is UI/UX stability; adding surface area before Phase 5 lands will re-open the findings above.

## Decisions taken

**2026-08-08 — Atlas comes off the primary rail, and is not demoted.** The rail slot was never what made the map valuable; a blank destination is what made it weak. It becomes a lens with three entry points (§3.2a) and a skill-tree model (§6.1). It loses one nav slot and gains an entry point on every Library result set and every one of ~5,300 records. `#/atlas` remains a real, deep-linkable route.

**2026-08-08 — the Atlas map is a skill tree** you branch through and trace back up, subject to the three constraints in §6.2. This supersedes the Miller-column direction in `atlas-depth-spine-decision`; see the note in §6.3.

## Risks

- **Phase 2 depends on record text and connection counts being available to the search index.** If the index doesn't carry official text, that is a data-layer task that must be scoped before Phase 2 starts — it is the difference between the phase being a day and a week.
- **Phase 3's unification is lower-risk than it looks**, because the index is already unified — a single query returns STIG rules and a government portal in one ranked list. The work is browse UI, facets, and redirects, not a data migration. Do not let the phase get re-scoped into one.
- **"Move" must not become "orphan."** Compare, Documents, Tasks, Starter documents and Resources all contain real work. The relocation audit table is a hard gate on Phase 3, not a nicety.
- **Cross-corpus relevance is a separate problem from result presentation.** `Platform One` ranking nine WLAN STIG rules above the Air Force software-ecosystem portal will not be fixed by Phase 2's row redesign. Once corpora share one result list, ranking needs its own scoped task — probably type-aware boosting — sequenced after Phase 3.
- **Phase 6 may conclude that the current Atlas view should be replaced rather than repaired.** That is an acceptable outcome and is why it is sequenced last, but it should be an explicit decision with the one-sentence purpose written down first.
