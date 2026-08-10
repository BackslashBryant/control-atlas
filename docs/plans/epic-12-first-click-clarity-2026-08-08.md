# Epic 12: First-Click Clarity — Information Architecture, Search, and Atlas Navigation

**Date:** 2026-08-08
**Status:** Proposed — ready for execution
**Sources:**
- **§1.1–1.4 (UX review): live site only** — `https://backslashbryant.github.io/control-atlas/`. No repo inspection. Every number is a `getBoundingClientRect()` / `getComputedStyle()` read taken in-browser at 1440×900 and 375×812, or a string copied from the rendered page.
- **§1.4 (Atlas data model) and Phases 6–7: repo inspection** on `agent/source-completeness-final`, counts read from the live graph shards. Where the two sources disagree, both readings are given.

**Supersedes:** `live-site-sniff-test-2026-08-03.md`, `live-site-polish-backlog.md` (P1 visual items), and — for the Atlas view specifically — `atlas-depth-spine-decision` / the rail + Miller-column direction endorsed 2026-07-26 (see §7.10).

**Why this epic exists:** the owner's stated gate is that no new features ship until the UI/UX is stable, scalable, and hooks the target user without friction or AI-slop. This document is the review that establishes the current state, and the single spec that closes it. **It is one epic; execute the phases in order.**

**Working tree caveat:** ~200 files under `data/` and `maps/` are uncommitted on the current branch. All data counts here are from the working tree, not `HEAD`. Artifact timestamps are also skewed (`nodes.json` / `edges.json` at 20:56:49Z vs `build-manifest.json` / `catalog-bootstrap.json` at 21:10:08Z), so the runtime graph on disk may be one build stale relative to its manifests. **Rebuild cleanly and re-measure before acting on any single number.**

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

And under the Atlas specifically, the data tells a fourth story the live site can't: the "LAW / POLICY / STANDARDS — Authority roots" band is **hard-coded decoration** with no node and no edge behind it, while the publisher-declared tree is really **23 disconnected catalog subtrees** — 29,341 of 29,350 nodes reach the trunk only through the editorial `organizes` spine. The nine areas are carrying the entire structure above catalog level, and four of them are empty because of a one-line bug. §1.5 has the full model; Phases 6–7 rebuild it as a skill tree with a real authority spine.

The good news is that the hard part is done. **Guides** and **Sources** are genuinely strong. Contrast and focus rings pass. The whole L0–L3 tree is only **294 nodes**. Nothing needs to be rebuilt from scratch — the work is removal, reordering, one honest search result row, and about twenty curated authority nodes.

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
| S3 | S1 | Result rows contradict the record — **root cause found** | Rows show "0 published connections"; the record shows "3 CONNECTIONS". It is not a counting disagreement: `published_connection_count` **is** computed at build time (`scripts/build-framework-data.mjs:1921-1944`) and **is** read correctly by `ExplorePage.tsx:289`. It is dropped in transit — `src/ui/workers/jsonParseWorker.ts:9-21` lists 11 columns and omits it, and `runtimeLoader.ts:372` hard-codes `transport_columns.length !== 11`. Since `parseOffThread` runs for every `library-search.json` fetch, **every row in every browser reads 0** |
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
| A1 | S1 | Four of nine areas are hollow — **root cause found, it is a one-line bug** | `buildAtlasBootstrapModel` (`src/ui/lib/atlasDrilldown.ts:82-118`) reads only `spine.catalogLimbs` and never `syntheticCatalogs`. `fips-199:CATALOG` and `nist-800-53a:CATALOG` are real nodes with real `organizes` edges — the bootstrap model just can't see them. **Risk and Assessment are pure bugs.** Governance (1 vs 3), Implementation (2 vs 3) and Compliance (9 vs 11) undercount for the same reason. Only **Operations and Knowledge** are genuinely empty, and those are intentional — `tree-spine.json` routes them to Templates and Resources via `areaDestinations`, but that fallback isn't reaching the universe view |
| A2 | S1 | Intermittent permanent hang on cold load — **root cause found, it is a commit race not a network failure** | `#/explore` stuck on "Opening the selected workspace" indefinitely (>30s), **2 of 3 attempts**; fresh tab loaded in <8s; all assets 200. `parseJsonResponseOffThread` (`runtimeLoader.ts:334-358`) has **no timeout, no `messageerror` handler, no abort**, and `fetchArtifact` caches the *pending* promise (`:324`; delete only on rejection, `:328`) so every retry awaits the dead promise. `App.tsx:254-255` clears **both** the 3s and 10s timers on `onSearchReady`, and on `#/explore` phase 1 always delivers first — so phase 2, the phase that uses the worker, runs with **no deadline at all**. `setBundle` is wrapped in `startTransition`; a suspending transition never commits, so `readyState` stays `"false"` and the overlay stays up |
| A3 | S2 | Four names for one destination | Nav "Atlas" / route `explore` / `<h1>` "Atlas" / breadcrumb "Explore" / section heading "Landscape" |
| A4 | S1 | The authority-roots band is decoration | `AtlasUniverse.tsx:118-126` hard-codes an `atlas:AUTHORITY-ROOTS` node with one fake edge, repeated per projection (`:177`, `:252`, `:307`) and again as static JSX on mobile (`:615`). **No such node exists in the graph, no law/statute/EO node type exists, and no edge points at it.** Directly contradicts `docs/tree-model.md:117`, which requires every record be traceable upward to one or more roots |
| A5 | S1 | The breadcrumb skips the parent control | `pickCanonicalParent` (`src/app/ancestor-path.mjs:71`) tie-breaks **shallowest-first**, so `nist-800-53:AC-2.1` resolves to `FAMILY-AC` and **AC-2 is skipped**. `docs/tree-model.md:498` specifies `… › AC-2 › AC-2(1)`; the doc wins. 1,365 nodes carry two structural parent edges. Trace-back is the entire content of the redesign's justification state, so this is on the critical path |
| A6 | S2 | 8 nodes are unparented while the build reports 100% | `dod-zt:OVERLAY-{APP,AUTO,DATA,DEVICE,ENABLER,NET,USER,VIS}` root at themselves in `ancestorChain`. `trunkConnectedComponent` (`build-framework-data.mjs:2111`) tests **undirected any-edge** reachability; the UI walks **canonical parents**. Both are true statements about different graphs, and the console prints the flattering one |
| A7 | S2 | `mandate_basis` in the source registry is factually wrong | `nist-ai-rmf-playbook` and `nist-ssdf-oscal` both claim `["FISMA","FIPS 200"]`; `nist-ssdf` carries `[]` while its OSCAL sibling claims FISMA. The authority spine must be curated independently and then reconciled — never derived from this field |

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

## 1.4 The Atlas data model as it exists today

*Repo-sourced. This is the "what is the form of the Atlas right now" answer that Phases 6–7 build on.*

**Scale:** 29,350 nodes / 73,394 edges / 103 sources (`data/generated/build-manifest.json`).

### Edge classes — four, defined in `src/app/structural-hierarchy.mjs`

| Class | Count | Types actually emitted |
|---|---:|---|
| `correlation` (cross-framework mapping) | 40,734 | `references` 28,442 · `maps_to` 5,501 · `mitigates` 3,760 · `Concept Crosswalk` 1,059 · `assesses` 1,014 · `supports` 834 · rest <120 |
| `structural` (publisher-declared) | 24,523 | **`contains` only.** `parent_of` and `decomposes_into` are declared but never produced — so `tree-model.md` §7's "Decomposes into" block can never populate |
| `organizing` (Control Atlas editorial) | 6,183 | `organizes` — trunk→limb 9, limb→catalog 23, control→assessment procedure 4,698, control→CCI 1,409 |
| `applicability` | 1,954 | `selects` (baselines) |

`correlation / Concept Crosswalk` is a raw human-readable string sitting in the `relationship_type` enum position on 1,059 edges, leaked from the NIST OLIR CSF crosswalk. Every other value is a snake_case slug; it survives only because `displayNameFor` falls through to `humanizeSlug`.

### The structural tree is 23 islands

`isValidatedStructuralEdge` (`structural-hierarchy.mjs:51`) requires parent and child share a `catalog_id`. **Cross-catalog containment is impossible by construction.** So the "publisher-declared tree" is 23 disconnected subtrees, and **29,341 of 29,350 nodes (99.97%) reach the trunk only via an editorial `organizes` hop.**

This is the finding that reframes the whole design. The editorial spine is not a garnish on a publisher hierarchy — it *is* the hierarchy above catalog level, and it always was. The owner's position that the tree is the product's editorial contribution is a description of what already ships, not a new claim.

Canonical-parent resolution lives in `src/app/ancestor-path.mjs`: `pickCanonicalParent` (`:71`) tie-breaks same-`catalog_id` → shallowest → lexical id; `canonicalParentWithOrigin` (`:97`) prefers a validated structural parent and falls back to a single `organizing` hop only when none exists, so editorial structure can never shadow a publisher's own. `node.parent_id` is **dead** — 0 of 29,350 carry it, making `isValidatedStructuralPointer` unreachable, while the field still costs bytes as slot 8 of every compacted shard node.

**Depth** (chain length including the node): 1→9 (trunk + the 8 orphans), 2→9 (limbs), 3→23 (catalogs), 4→614 (families/functions/benchmarks), **5→22,326** (typical), 6→1,671, 7→4,698 (max, e.g. `atlas:TRUNK › LIMB-COMPLIANCE › nist-800-53 › family › control › 800-53A procedure › CCI`).

### Mapping density — what an overlay would actually light up

| Population | n | 0 | 1–5 | 6–20 | 21+ | median | max |
|---|---:|---:|---:|---:|---:|---:|---:|
| All nodes | 29,350 | 1,734 | 25,914 | 1,239 | 463 | **1** | 3,491 |
| 800-53 base controls | 324 | 5 | 54 | 160 | 105 | **14** | 81 (AC-2) |
| 800-53 enhancements | 872 | 23 | 598 | 248 | 3 | 4 | 41 |
| CSF 2.0 | 135 | 27 | 45 | 49 | 14 | 5 | 55 |
| STIG rules | 17,231 | 354 | 16,491 | 353 | 33 | **1** | 51 |

The median record lights up **one** counterpart; a typical 800-53 base control lights ~14 across 5–7 catalogs; the tail is real — 463 nodes at 21+, worst case `disa-cci:CCI-000366` at **3,491** (the "documented procedures" CCI that thousands of STIG rules cite). The top ten are all CCIs. An uncapped overlay hangs on those.

Edges are **directional** with no reverse materialisation, but the UI traverses undirected from the record's perspective (`getEdgesForNode`, `relationship-groups.mjs:21`). **Zero dangling edges** across all 73,394 — `addPublishedEdge` refuses to emit unless both endpoints exist. Only 2 relationships were ever blocked.

### STIG shape — the technology tier already exists

`disa-stig` = 17,231 nodes: 16,877 `stig_rule` under **353 `benchmark`** containers. Benchmark→rule fanout is min 2 / median 24 / max 448. The technology gate the owner described is a *rendering* rule over a tier that is already in the data, not new modelling.

### Isolated catalogs — and why the coverage badge has never fired

Cross-catalog mapping coverage: `nist-ai-rmf` **0 / 92** · `nist-ssdf` **0 / 47** · `dod-rai` **0 / 14** · `nist-800-172` **1 / 133** (and that 1 is the catalog root, so **0 of 132 items**) · `cui-policy` **2 / 129** · `dod-zt` 45 / 228. `mitre-attack-ics` is **no longer 0%** — it is 52.7% since `attack-to-d3fend.json` gained ICS rows, correcting a stale prior note.

`catalog-bootstrap.json`'s `connected_count` counts structural + organizing edges, so it reports **100%** for AI RMF, SSDF and DoD RAI. Consequently `isLowCatalogCoverage` (`src/ui/lib/catalogCoverage.ts:43`, threshold ≤75) has **never fired for any catalog** — the "Limited coverage" badge is dead code. A tree that warns about thin branches needs a cross-catalog-only count.

### Three orphaned map files

`maps/800-53-to-fisma.json` (3 rows), `maps/800-53-to-800-37.json` (1), `maps/csf-to-cpg.json` (1) are not in the `MAPS` registry and their targets have no nodes. Notably, **someone already tried to wire 800-53 to FISMA** — that instinct was right and Phase 6 completes it properly.

### Doc drift to reconcile

`display-names.mjs` declares `zt_overlay_catalog`, `cci`, `pillar`, `capability`, `program_requirement` — none exist as node types. `docs/PRD.md:188`'s provenance vocabulary (`official`, `dod_published`, `nist_published`, …) appears on **zero** edges; the live set is `federal_published` 60,618 / `control_atlas_derived` 6,183 / `mitre_published` 5,388 / `federal_program` 1,164 / `mandated` 41. `docs/STATE.md:1190` claims the Atlas landing loads the full graph; `runtimeLoader.ts:173-190` explicitly does not. `docs/adr/0011-graph-library.md` still names Cytoscape, which was removed. **CMMC is a stub** — 3 program nodes, zero practices, despite `data/cmmc-practices.json` existing.

## 1.5 The pattern

Three themes explain nearly every finding.

**Chrome outranks content.** On interior pages the sequence is: empty space → prerender ghost → page-title band → page search → global nav → breadcrumb → toolbar → content. Content is seventh. Fixing the ordering fixes L1, L2, L3, R1 and most of the "cramped nav / weird layout" complaint at once.

**The build's vocabulary reached the user.** "Published graph," "PUBLISHED FACT," "Connected work surface," "Imported from … Artifact," "Federal utilized," "surface named on the masthead keycap." These read as AI-slop to a newcomer because they are unfalsifiable phrases that carry no meaning outside the repo. This is the [audience-calibration] and [no-insider-copy] rules being violated at scale, not in one or two strings.

**Menus stand in for answers.** Home 4 systems / 16 doors · nav 11 items · Start here 6 goals · Compare 5 options + disclaimer · Documents 3 links to other menus · Library 2 searches + 5 filters · results sort + filters + 3 actions per row. The product is highly capable and keeps asking the user to choose instead of showing them something.

---

# Part 2 — The EPIC

**Goal:** get Control Atlas to a stable, scalable UI/UX baseline that delivers on the first click and stops leaking build vocabulary — so feature work can resume.

**Definition of done:** a first-time visitor can land, search a term they know, tell the results apart without opening them, read official text, and open a second record in a new tab to compare — without meeting internal vocabulary, a dead control, or a contradiction.

**Sequencing rule:** phases are ordered so each is independently shippable and visibly better. Do not start Phase 4 before Phases 1–3 are live. **Phases 6 and 7 must be done in that order** — 7 is a view over the data 6 produces.

| Phase | What | Ships value on its own? |
|---|---|---|
| **0** | Three user-visible bugs, no model change | Yes — immediately |
| **1** | Put the page back in order | Yes |
| **2** | Make search answer the question | Yes |
| **3** | Information architecture — one corpus, three doors | Yes |
| **4** | Say it in English | Yes |
| **5** | Links, semantics, touch | Yes |
| **6** | Atlas data: authority spine + build correctness | Yes — fixes the empty areas **on the existing view** |
| **7** | Atlas view: the skill tree | The rewrite |

Phases 0–6 all have hard, measurable definitions of done. Phase 7 is a genuine rewrite of the primary surface whose thresholds will need tuning against real use in a way tests cannot settle. **Sequence so 0–6 ship value even if 7 slips.**

## Phase 0 — Stop the bleeding

*Three bugs that are visible to users today, independent of every other phase, and cheap. Ship this first. Closes S3, A2, and the `Limb`/`Trunk` half of C1.*

**0a. Every search row reads "0 published connections" (S3).**
Not a counting bug. `published_connection_count` is computed at build time and read correctly by the UI; it is dropped in the columnar worker transport. Add the field to `LIBRARY_DOCUMENT_FIELDS` (`src/ui/workers/jsonParseWorker.ts:9`) and to `libraryFromNodes` (`src/ui/lib/runtimeLoader.ts:753`). **Export the field list from one shared module and derive the column check from `FIELDS.length`** — the literal `11` living in a second file (`runtimeLoader.ts:372`) is what caused this, and leaving it will cause it again.

**0b. The infinite spinner (A2).** Four changes, all required — fixing any one alone leaves the hang reachable:

1. `parseJsonResponseOffThread` (`runtimeLoader.ts:334-358`): add a `messageerror` listener, a 20s deadline that calls `worker.terminate()` and rejects, and try/catch around `postMessage`. Once it *can* reject, the existing `artifactCache.delete(path)` at `:329` makes retries work — the never-settling promise is the bug, not the cache.
2. `src/ui/App.tsx:255`: stop clearing `timeoutTimer` in `onSearchReady`; keep clearing `slowTimer`. `onFullReady` and the existing `.finally()` (`:291-296`) already clear both, and `.finally()` fires only after every phase resolves — so the hard deadline then correctly covers phase 2.
3. `App.tsx:257`: deliver the phase-1 bundle with a plain `setBundle`, not inside `startTransition`. A suspending transition never commits, which is exactly why `readyState` stays `"false"` with the overlay up. Keep `startTransition` for `onFullReady` only.
4. Give `fetchArtifact` an `AbortController` so an abandoned route cancels its fetches.

**0c. `Limb` and `Trunk` leak into the user-facing Object type filter.**
The facet list is derived from the data by `facetValues("object_type")` (`scripts/build-framework-data.mjs:1951`), so internal scaffold types surface automatically. Add `scaffold: true` in `buildStructureNode` and have `facetValues` skip scaffold nodes. A denylist would need editing for every new type; the flag will not. **Prerequisite for Phase 6** — `statute` / `regulation` / `policy_directive` are *not* scaffold and will need proper entries in `src/app/display-names.mjs`.

**Acceptance criteria**

- A search for `AC-2` shows at least one row with a non-zero connection count, and that count equals the one rendered on that record's own page.
- With `library-search.json` stubbed to hang, `#/explore` reaches a visible error affordance within the deadline; the overlay never persists. A second attempt re-fetches rather than awaiting the dead promise.
- `library_search.facets.objectTypes` contains no scaffold type.

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

*Closes S1, S2, S4–S9, R2, R3 (S3 is already fixed in Phase 0). This is the phase that decides whether anyone comes back.*

**Scope**

1. **Publisher on the title line, always.** `Access Control` becomes `NIST SP 800-53 Rev. 5 · Access Control (AC)`. No two visible rows may render an identical title + subtitle pair.
2. **Show the text.** Replace *"Official description available — open this record to read it."* with the first ~180 characters of the official text, with the matched term marked. If a record genuinely has no text, say what it does have — never advertise withheld content.
3. **Surface the connection count properly.** The transport bug is fixed in Phase 0; here the number becomes useful — show what the connections *are* ("maps to 7 frameworks"), not a bare integer, and never lead with a zero. A record with no published mappings says so plainly rather than rendering "0 published connections" on a product about connections.
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

### 3.7 Permanent relocation audit

The tested click path is the durable discovery path. Redirects preserve old
bookmarks without restoring a retired primary-navigation destination.

| Moved surface | Old route | New home | Redirect | Tested click path |
|---|---|---|---|---|
| Atlas overview | `#/explore` | Library `List \| Map` lens and `#/atlas` overview | `#/explore` → `#/atlas` | Library → Map → Open the Atlas |
| Atlas record focus | `#/explore?node=…` | Record secondary action and `#/atlas?node=…` | Old query is preserved on `#/atlas` | Library result → record → See this in the Atlas map |
| Compare | `#/compare` | Record action and Library multi-select mode | Existing deep link remains available | Library → Compare records; record → More actions → Compare |
| Documents | `#/build/documents` | Start-here outcome and record action | Existing deep link remains available | Start here → Produce a document; record → More actions → Produce a document |
| Tasks | `#/build/tasks` | Start-here outcome | Existing deep link remains available | Start here → selected goal → starting plan |
| Resources directory | `#/resources` | Tools & communities Library facet | `#/resources` → `#/library?kind=tools-communities` | Library → Content kind → Tools & communities |
| Curated resource collections | `#/resources?collection=…` | Saved Library views | Collection is preserved on the Library redirect | Library → saved collection link |
| Resource detail | `#/resources/:id` | Canonical Library resource detail | `#/resources/:id` → `#/library/resource/:id` | Library resource result → resource detail |
| Catalog | `#/catalog` | Library | `#/catalog` → `#/library` | Primary navigation → Library |
| Publication detail | `#/catalog/:id` | Library publication detail | `#/catalog/:id` → `#/library/publication/:id` | Library → publication result |
| Search | `#/search` | Persistent header control and Library result set | `#/search` → `#/library` with query preserved | Header → Search → Library results |
| Help | `#/help` | About | `#/help` → `#/about` | Utility navigation → About → Help using Control Atlas |
| Guides | `#/learn` | Guides | `#/learn` → `#/guides` | Primary navigation → Guides |

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

## Phase 6 — Atlas data: the authority spine

*Closes A1, A4, A5, A6, A7. **No view work.** Everything here ships value on the existing Atlas — the empty areas fill in, and every record page gains an authority tier in its breadcrumb.*

### 6.1 Why this phase exists

§1.4 established that the publisher-declared tree is 23 islands and that 99.97% of nodes reach the trunk only through the editorial spine. The nine areas are therefore load-bearing, and they are editorial — which is fine and is the point (§1.3), but they are also **44% empty**, and the band that would explain *why* any of this exists is a hard-coded decoration (A4).

The owner's framing settles the design question: **federal compliance is sprawling because of bureaucracy, and the tree is the product's editorial contribution that makes that sprawl legible.** Curated structure is the feature — it is what a library competitor cannot do. The authority chain is the right shape for it because it explains why 800-53, CMMC and 17,000 STIG rules all exist and descend from different statutes.

### 6.2 Spine placement — visual roots above the trunk

**Decision:** authority instruments are shown as roots **above** `atlas:TRUNK`, but they do not participate in the canonical `organizes` hierarchy. The trunk remains the single canonical root and the nine areas stay as the descent path below it. A catalog carries `issued_under` up-edges to **one or more** instruments.

This is not the shape a first reading suggests, and the reason matters. `docs/tree-model.md` §2 puts authority roots above the trunk visually, and line 117 says *"traceable … upward to **one or more** roots"* — plural. **The data agrees.** A publication can be issued under several instruments across different branches of authority. `primary_authority` selects the one composed into the displayed authority rail; `also_required_by[]` preserves the rest without changing canonical ownership or making a determination about the visitor.

Modelling authority as many-to-many `issued_under` up-edges keeps it honest, preserves the nine areas, `ATLAS_UNIVERSE_POSITIONS`, `atlasLimb` deep links and `areaDestinations`, and requires no rewrite of canonical doctrine.

### 6.3 The curated data

New file **`data/curated/authority-spine.json`** — deliberately separate from `tree-spine.json`, which already carries four unrelated concerns and whose limb assignments need no legal-citation review.

Three new node types, ~20 instruments: `statute` (~6), `regulation` (~8 — CFR parts, FAR/DFARS clauses), `policy_directive` (~8 — EOs, OMB memos, DoDIs). IDs `authority:<CITATION-SLUG>` (`authority:USC-44-3554`, `authority:EO-13556`, `authority:32-CFR-2002`, `authority:DFARS-252.204-7012`). **Tiering by declared `parent`, never derived.** These node types are classification labels, not an ordering constraint: any instrument type may parent any instrument type through `issued_under`, with parent resolution and cycle checks.

Do **not** create authority nodes for FIPS 199/200 — they are already catalogs (`fips-199:CATALOG` 3 children, `fips-200:CATALOG` 17) whose authority parent is FISMA. Modelling them twice is the first thing that will break.

Each catalog gets a block carrying `mandate`, `primary_authority`, `also_required_by[]`, `publication_type`, `mandate_note`, `source_refs`. `publication_type` wires up the `tree-model.md` §2 classification table, which is curated doctrine currently rendered nowhere — free value at the discovery zoom level.

**Mandate is four-valued, not binary.** A boolean or three-value model would ship factual errors:

- `statutory` — required by law or issued as part of a program directly required by statute (FIPS 199/200 ← FISMA; FedRAMP ← 44 U.S.C. chapter 36)
- `contractual` — required by contract flow-down (800-171 ← DFARS 252.204-7012; CMMC ← DFARS 252.204-7021 / 32 CFR 170)
- `federal_policy_or_regulatory_mandate` — required by binding federal regulation or executive/agency policy rather than directly by statute or contract (32 CFR 2002, DoD Zero Trust, DISA STIG/SRG/CCI)
- `issued_without_federal_mandate` — SSDF under current OMB M-26-05, SP 800-172 Rev. 3 as issued (an agency may make selected requirements binding through a contract or agreement), ATT&CK, ATT&CK ICS, D3FEND, AI RMF, DoD RAI

Four, because current official evidence does not fit the original taxonomy. OMB M-26-05 rescinded M-22-18 and M-23-16, so SSDF must be classified from current evidence rather than the superseded attestation rationale. CSF 2.0 is federally policy-mandated for executive agencies and otherwise voluntary; SP 800-172 becomes contractually binding only when selected into a contract or agreement; and the exact FedRAMP Rev. 5 artifact is legacy material inside a statutory program. **Kind and scope are separate axes:** do not add scope enum values. Whenever mandate scope is not universal, `mandate_note` is required, cites the controlling source through `source_refs`, and states the boundary without claiming that the publication applies to the visitor. CSF 2.0, SP 800-172 and FedRAMP Rev. 5 are permanent required-note cases.

Copy discipline: this is a property of the **publication**, never of the reader. *"NIST SP 800-53 is issued under FISMA (44 U.S.C. §3554)."* Never "this applies to you." The fourth bucket is labelled *"Issued without a federal mandate"* — never "optional," which is a determination.

**Curate independently, then reconcile.** `mandate_basis` in `data/source-registry.json` is wrong in at least two places (A7). Do not derive from it; build the spine, add a reconciliation test that surfaces the discrepancies, then correct the registry.

**Every legal citation must be source-verified before ship**, each with a `data/source-registry.json` entry. New registry entries for the U.S. Code sections, CFR parts and OMB memos are prerequisite work in this phase, not incidental.

### 6.4 Emission

New `applyAuthoritySpine(nodeState, edgeState, registry)` in `scripts/build-framework-data.mjs`, called **before** `applyOrganizingSpine` so the existing residual backfill and connectivity gates still run last and still catch anything it misses. It emits:

1. instrument nodes via a `buildAuthorityNode()` modelled on `buildStructureNode` (`:1997`), with no `catalog_id` — the same exemption path trunk and limb already use;
2. **`issued_under` edges catalog → instrument** (upward), one per `primary_authority` plus one per `also_required_by`;
3. **`issued_under` edges instrument → instrument** for every explicitly declared `parent`.

Authority instruments emit **no `organizes` edges**. The trunk stays the single canonical root; authority placement above it is a runtime presentation concern.

**The trap, stated explicitly because it fails silently:** do *not* add `issued_under` to `ORGANIZING_RELATIONSHIP_TYPES` in `src/app/structural-hierarchy.mjs`. If you do, `buildAncestorGraph` (`ancestor-path.mjs:19-28`) treats instruments as parent candidates and `canonicalParentWithOrigin` picks one by **lexical sort** (`:115`) — arbitrarily reparenting all 23 catalogs with no error. Add a separate exported `SECONDARY_ORGANIZING_RELATIONSHIP_TYPES = new Set(["issued_under"])`, set `relationship_class: organizing` explicitly on the edge (otherwise `defaultRelationshipClass` classifies the unknown type as `correlation`), and leave `isValidatedStructuralEdge` untouched — it never sees these edges, because they are not `structural`.

### 6.5 Build correctness (do 6.5b before 6.5a, or two rebuilds fight over the 243 MB shard diff)

**6.5b — fix the canonical parent (A5).** `pickCanonicalParent` (`ancestor-path.mjs:71`) tie-breaks shallowest-first, so `AC-2(1)`'s parent is the AC family and **AC-2 is skipped**. Among same-catalog structural parents, prefer the **deepest** — most specific containment wins — matching `tree-model.md:498`. Affects 1,365 nodes' `ancestor_path` and their shards. This is on the critical path: trace-back is the entire content of Phase 7's justification state.

**6.5a — fix the build gate (A6).** Add `canonicalTrunkReachable(nodes, edges, trunkId)` using `buildAncestorGraph` + `ancestorChain`. **Use it as the step-4 predicate** (`build-framework-data.mjs:2311`) — the 8 `dod-zt:OVERLAY-*` nodes are skipped today *because* the undirected component already contains them, so switching the predicate makes the existing backfill file them under `dod-zt:CATALOG` automatically (+8 edges, nothing else). **Keep both gates at step 5** and report both counts: undirected catches disconnected content, canonical catches breadcrumb dead ends. They are different failures and the console should stop printing only the flattering one.

The three authority instrument node types are exempt from both trunk-reachability denominators and orphan lists because they intentionally sit outside `organizes`. The trunk and existing organizing structure remain gated exactly as before; no other production node is exempt.

### 6.6 The runtime artifact — and the empty-areas fix

New **`data/generated/atlas-spine.json`**: the full L0–L3 tree (trunk, instruments, catalogs) plus L4 summaries. Per entry: `id`, `node_type`, `label`, `blurb`, `parent_id`, `child_count`, `descendant_record_count`, and for catalogs `mandate`, `primary_authority`, `also_required_by[]`, `publication_type`, `mandate_note`, `area_id`.

Measured after generation: 51 L0–L3 entries + 642 L4 summaries = **329,528 bytes raw, 23,857 bytes gzipped**. Register in `RUNTIME_COLLECTIONS` and the manifest's `runtime_artifacts` (`:1900`) so `verify:manifests` and `check:data-size` see it.

**Two counts, deliberately distinct** — conflating them is a current source of nonsense. `child_count` (`disa-cci:CATALOG` has 44 children but 5,138 records) decides layout only. `descendant_record_count` (from `catalog-bootstrap.json`'s `leaf_record_count`) is always the number a node *displays*.

**Replace `buildAtlasBootstrapModel`** (`src/ui/lib/atlasDrilldown.ts:82-118`) with a reader of this artifact. Replacing rather than patching A1 leaves no `catalogLimbs`-only path behind to be incomplete again. Keep `buildAtlasDrilldownModel` (`:170`), narrowed, for the remaining baseline/RMF paths.

Drop `atlasAxis`, `atlasFramework`, `atlasFamily` from **both** `requiresFullGraph` (`src/ui/lib/navigationState.ts:25-36`) **and** its mirror in `runtimeArtifactPlan` (`runtimeLoader.ts:179-190`) — the comment at `:177` says they must stay in step. `onExpandArea` (`AtlasMapPage.tsx:1083`) sets `atlasAxis` on *every* area expansion, which is why expanding an area currently loads the entire monolithic graph and swaps the view for `DataPendingNotice` (`App.tsx:653-670`). Keep `atlasBaseline` / `atlasRmfStep` requiring it until baselines get the same treatment.

Also add `cross_catalog_connected_count` to `catalog-bootstrap.json`. Today's `connected_count` includes structural and organizing edges, so it reports 100% for `nist-ai-rmf` (really 0/92) — which is why `isLowCatalogCoverage` (`src/ui/lib/catalogCoverage.ts:43`) has never once fired. One field makes that dead code live, and Phase 7 needs it to mark thin branches honestly.

### 6.7 Empty and isolated branches — show all, state the gap

**Decision:** every catalog appears. Voluntary-and-unmapped reads as *explained* ("issued without a federal mandate — no crosswalk published"). Mandated-and-unmapped says so directly ("no published mappings yet"). Consistent with the product's honesty rules, and it keeps the roadmap visible every time the app is opened.

Under the authority spine, `nist-ai-rmf` (0/92), `nist-ssdf` (0/47) and `dod-rai` (0/14) sitting thin becomes an *explanation* rather than a gap. `nist-800-172` (1/133) is issued without a blanket federal mandate but can become binding when selected into a contract or agreement; `cui-policy` (2/128) is regulatory-policy mandated. Their thinness remains a genuine data gap and the strongest argument for prioritising those crosswalks.

`Connected work surface` is deleted from the codebase. Zero is a fine answer; a placeholder phrase that hides a zero is not.

**Acceptance criteria**

- Every catalog in `tree-spine.json`'s `catalogLimbs` ∪ `syntheticCatalogs` appears exactly once in `authority-spine.json`'s `publications`, and vice versa — build fails loudly on drift.
- No node has more than one incoming `organizes` edge (currently 0 violations — free to assert, and it protects the lexical tiebreak permanently).
- Every instrument's `parent` resolves; no cycles; every instrument's `source_id` exists in the registry; every `issued_under` edge carries `source_refs`.
- Every `statutory`/`contractual` entry has a non-null `primary_authority`; every `issued_without_federal_mandate` entry has a non-empty `mandate_note`.
- `nist-800-53:AC-2.1`'s canonical chain is exactly `CATALOG › FAMILY-AC › AC-2 › AC-2.1`.
- Zero nodes fail canonical-parent trunk reachability.
- Reading `atlas-spine.json` yields non-zero publication counts for **Risk** and **Assessment**, and Compliance = 11, Governance = 3, Implementation = 3.
- Expanding an area on `#/explore` requests **no** `nodes.json` / `edges.json`.
- The displayed authority rail includes the hop composed from the catalog's curated `primary_authority`; canonical ancestry and canonical ownership do not include authority instruments.
- `Connected work surface` appears zero times in the codebase.

---

## Phase 7 — Atlas view: the skill tree

*Closes A1's presentation half and A3. The rewrite. Requires Phase 6.*

The purpose is settled and does not need re-deciding: **the Atlas map shows where a record sits, what surrounds it, and what it descends from.**

**Delivery status, 2026-08-09: implemented and accepted for release.** The shipped
model renders 18 visual authority instruments, the trunk, all nine areas, 23
publication roots, and publisher-native summaries only. The real-spine maximum is
33 rendered nodes; the 448-rule benchmark becomes 12 deterministic buckets; the
L0-L2 position snapshot is collision-free and locked at
`ceb85d1f1f9956731e988f35e2537b3b7aa463930a808d8cd1e18fed9e1f8045`.
Permanent Phase 7 tests cover layout, aggregation, overlay identity/ranking,
authority-rail parity, URL/history restoration, compact keyboard behavior, scoped
runtime requests, and 20 consecutive cold loads. Phase 1-6 and the unchanged
32-case accessibility suite remain part of the release gate.

### 7.1 The model: a skill tree

**Owner direction, 2026-08-08:** a skill-tree-style view you branch through and can work your way back up.

It is the right metaphor, for reasons that are specific rather than decorative:

- **Spatial persistence.** A skill tree is a fixed map you learn. The same node is in the same place every visit, so returning users navigate by memory. A force-directed graph re-lays out on every render and destroys that — which is a large part of why the current view reads as a diagram rather than a map.
- **Progressive disclosure is native to the form.** Trunk → branch → leaves is exactly Area → Publisher → Publication → Family → Record. The structure the product already has finally gets a shape.
- **It has silhouette.** A skill tree is legible zoomed out; nine boxes with connector lines are not. Legible-at-a-glance is the difference between a map and a diagram.
- **"Work your way back" is the underserved half, and the most valuable.** From a STIG rule up through its CCI, to the NIST control, to the family, to the publication, to the law or policy that authorises it. *"Why does this rule exist?"* is the question a newcomer actually has, and it is literally a path up a tree. Today it is two lines of breadcrumb text under "Where this sits."

### 7.2 Three constraints, or the metaphor breaks

Skill trees have properties that compliance data does not. Each of these is a hard design rule:

1. **The tree is the canonical hierarchy only — single parent, no exceptions.** Cross-framework mappings are many-to-many (AC-2 alone reaches 7 counterpart catalogs). Drawing those as tree edges produces the hairball that was already rejected. **Mappings are a toggleable overlay**: selecting a node lights up its counterparts on other branches as highlights, never as structural edges. This is §3.4's canonical-parent rule expressed visually, and it is what keeps the tree a tree.
2. **Draw structure, count leaves.** There are 29,367 nodes, of which 29,349 participate in canonical trunk reachability and 18 are authority instruments. The generated Atlas spine has 693 entries, but only 531 are publisher-native summary types; the other 111 L3+ entries are record-layer nodes and are excluded. Never attempt to draw the record layer.
3. **No locks, no progression, no completion.** A skill tree implies prerequisites and unlocking. Nothing here is locked, and implying "you must finish X first" would be false and would contradict the product's own honesty about not deciding what applies to a given system. Show position and counts; never gate.

### 7.3 Levels

```
L1   Instrument    statute / regulation / policy directive    ~20   ABOVE the trunk
L0   Trunk         Cybersecurity                                1
L1'  Area          the nine areas                               9    below the trunk
L2   Publication   the 23 catalog roots                        23
L3   Publisher     family / function / tactic / benchmark     531   summaries only
```

Instruments above, areas below — the existing silhouette, with the fake roots node (A4) replaced by real ones. Authority is above the trunk **visually only**; `atlas:TRUNK` remains the canonical root and authority never participates in canonical parent selection.

### 7.4 Three jobs by depth

The owner's answer to "what is the map's primary job" was **all three, by depth**. That is not a hedge; it is three deliberate states:

| Zoom | Job | Node shows | Suppressed |
|---|---|---|---|
| `<0.7`, L0–L1 | **Orientation** — "what is this world" | Label, aggregate count, one plain-language fragmentation explanation, four mandate-kind counts | Descriptions, type chips, overlay toggle |
| `0.7–1.3`, L2–L3 | **Discovery** — "what else connects" | Label, `publication_type` chip, `descendant_record_count`, mapping-degree dot, mandate chip | Publisher prose |
| `>1.3` or focused | **Justification** — "why does this item exist" | Full displayed trace-back rail, publisher text, "also required by" chips, connections | Sibling detail (siblings collapse to labels) |

This is not new machinery. `AtlasUniverse.tsx:552`'s `onMoveEnd` already implements zoom<0.5 collapse / >1.3 expand with a 500 ms `semanticGuard`. Keep the mechanism; change the thresholds and what each level projects.

The "why the sprawl exists" sentence is said **once**, at orientation zoom, alongside counts for the four mandate kinds: `statutory`, `contractual`, `federal_policy_or_regulatory_mandate`, and `issued_without_federal_mandate`. It is the editorial contribution and it must not be repeated at every level.

### 7.5 Deterministic layout

Same node, same coordinates, every load, for every user. **No force-directed simulation** — spatial memory is the entire reason the skill tree beats the current view.

The repo's existing pattern is already correct and should be followed rather than replaced: author coordinates in a module, assert non-collision in a test. `ATLAS_UNIVERSE_POSITIONS` + `atlasUniverseCollisions(positions, gap)` (`src/ui/lib/atlasUniverse.ts`, already generic over any positions array), covered by `tests/graph/atlasUniverse.ts`.

**Determinism holds only within a build.** A STIG refresh that adds a benchmark shifts positions. Derive from a stable sort key (`item_id`), **never from array index**, and add a position snapshot test (§Verification) so a shift becomes a visible diff rather than a silent regression against the thing that makes the view work.

### 7.6 Node budget, aggregation, and the technology gate

**Hard cap: 120 rendered nodes per frame.** Rendered set = path from trunk to focus (≤7) ∪ siblings of focus ∪ children of focus.

**Aggregation when `children > 40`:** bucket by a publisher-supplied grouping key if one exists, else by `item_id` prefix range (`A–F · 128`). Buckets are themselves nodes; expanding one replaces it in place under the same cap. Deterministic, because buckets are a pure function of the lexically sorted child array.

**Technology gate — `TECHNOLOGY_GATE_THRESHOLD = 60`.** Owner direction: *"once you get to STIGs, you pick the tech to proceed to that level of depth."* Any publication whose publisher-native summary child count exceeds the threshold renders **a picker instead of children** — the tree shows one placeholder child ("Choose a benchmark — 353 available") and a searchable, count-annotated list beside the stage. Picking one inserts exactly one child at a fixed position and the tree continues normally. New URL param `atlasBenchmark`, serialised alongside the existing atlas params.

Measured fit: `disa-stig:CATALOG` = 353 → gated. `disa-cci:CATALOG` = 44 → not gated. `disa-srg:CATALOG` = 25 → not gated. Below the gate, benchmark→rule is median 24 / max 448, so the 448-rule benchmark hits the 40-child bucket rule.

**Generalise rather than special-casing DISA.** The same rule is what stops the next large catalog import from breaking the view.

### 7.7 Branch out, trace back

**Branch out (down).** Expand from a root toward records; every expansion writes to the URL so any depth is shareable and restores on reload.

**Trace back (up).** A persistent "Trace back to authority" control on any focused node, opening root-first. The displayed path starts at the selected publication's curated `primary_authority`, follows the authority spine's declared parent chain, and then joins the canonical trunk/area/publication path. This is display composition, never canonical ancestry. Each hop retains its origin, rationale, and available source references.

Reuse the three-origin `src/ui/components/WhereThisSitsRail.tsx` shipped in Phase 6 and extend its authority segment to the full declared parent chain:

- **Authority** — the publication's curated primary authority and its declared authority parents
- **Control Atlas structure** — `organizing` hops
- **Publisher hierarchy** — `structural` hops

The Atlas tree and record page consume the same composition function and must produce byte-identical hop sequences.

### 7.8 Mapping overlay

Toggle only, never structure. When on with a node focused: fetch that node's shard via the existing `loadAtlasNeighborhood(nodeId)`, no full graph, and decorate only matching nodes already in the rendered tree. Ranked counterparts that are not structural tree nodes remain in the bounded side-highlight list; they never become tree nodes or edges. `tree-model.md` §3 requires that going down and going sideways never look alike.

**Cap: 24 highlights**, ranked publisher-declared first, then confidence, then lexical id. §1.4's density table justifies the number: median node has 1 counterpart, 800-53 base controls median 14 / max 81, only 463 nodes have ≥21. **24 renders >99% of nodes completely.** Beyond the cap, one summary chip — "3,467 more" — routing to `/compare`, which is where that many relationships belong.

Reuse `applyRelationshipClustering` + `DEFAULT_CLUSTER_THRESHOLDS` (`src/ui/lib/graphClustering.ts:45,15`) for the ranking and side list; they already do this job for the record page.

### 7.9 Rewrite, don't refactor

**`AtlasUniverse.tsx` gets rewritten.** 712 lines of which roughly 90 survive. It hard-codes three projection functions, the fake authority node (`:118-126`), six named junctions with literal coordinates (`:139-146`) and fifteen edge IDs keyed to specific limb IDs (`:176-193`) — every one of which dies with the new spine. A refactor would preserve their shape by inertia.

Salvage `AtlasTreeNodeView` (`:332`) and `useCompactAtlas` (`:372`) first. Target:

```
src/ui/components/AtlasTree.tsx       stage, interaction, semantic zoom
src/ui/lib/atlasTreeModel.ts          atlas-spine.json -> level projection
src/ui/lib/atlasTreeLayout.ts         deterministic positions + collision assert
src/ui/lib/atlasTreeAggregation.ts    budget, buckets, technology gate
```

**One name** — "Atlas map" in the view toggle, record action, `<h1>`, breadcrumb and section heading (A3).

### 7.10 Open-source-first gate

**Implementation decision, 2026-08-09.** Current official project evidence
confirms the planned split. Keep `@xyflow/react` for the interactive stage: it is
MIT-licensed, actively maintained, already integrated, and provides the viewport,
focus, keyboard, and accessibility controls the semantic-zoom contract relies on.
Add `d3-hierarchy` (ISC) only for pure L3+ child-band coordinate math over
lexically sorted input; it owns no rendering or interaction state. Do not adopt
`react-complex-tree`: its MIT-licensed W3C tree and keyboard implementation is
strong, but its multi-select, drag/drop, rename, and environment state add lifecycle
cost without improving this read-only compact branch's established accessibility
contract. Its maintainers also identify Headless Tree as the successor direction,
which raises avoidable migration cost. Preserve the existing semantic DOM compact
representation. No renderer, framework, or development-environment change is
justified.

**Keep React Flow.** Already a dependency, MIT, actively maintained, and only ~15% of it is used (custom node types, controls, viewport events). At ~120 rendered nodes, replacing it saves ~40 KB gzipped and costs pan/zoom, focus management, edge routing, and the `onMoveEnd` hook the semantic zoom is built on. Not a good trade.

| Candidate | Verdict |
|---|---|
| **`d3-hierarchy`** — ISC, ~5 KB gz, no DOM dependency | **Adopt, narrowly** — L3+ child-band math only, where fanout is data-driven and hand-authoring per catalog does not scale. Seed with a lexically sorted child array so identical input always yields identical output |
| **`elkjs`** — already a dep | Reject for the tree. Async, worker-bound, built for compound-graph routing; buys nothing at 120 nodes and costs a round trip. Keep it where it is (`/record`, `/compare`) |
| **`dagre` / `dagre-d3`** | Reject — effectively unmaintained; `dagre-d3` archived |
| **Cytoscape, sigma.js, regl renderers** | Reject — Cytoscape was removed deliberately; WebGL solves a 10k-node problem that does not exist here |
| **`react-complex-tree`** — MIT, maintained, strong keyboard/ARIA | **Reject for this phase.** Its selection, drag/drop, rename, and environment state add lifecycle cost to a read-only branch; its maintainers identify Headless Tree as the successor direction. Preserve the smaller semantic DOM tree and its existing accessibility contract |

**Split:** hand-author **L0–L2** (44 nodes, fixed silhouette, ~5 visible at once — exactly what `ATLAS_UNIVERSE_POSITIONS` already does well); `d3-hierarchy` for **L3+**.

One flag, not a blocker: React Flow is imported **statically** by `AtlasUniverse.tsx`, putting it on the critical path of a route about to become the front door. Consider lazy-loading behind a plain-DOM L0–L1 skeleton.

> **Supersedes a prior endorsed decision.** `atlas-depth-spine-decision` (owner-endorsed 2026-07-26) called for a rail + Miller-column redesign to replace the ELK graph. Miller columns and a skill tree traverse the same hierarchy; the skill tree adds spatial persistence and a visible silhouette, which Miller columns do not. Flagged so it is a decision rather than a drift — the rail-first increment from that decision remains valid and is still the cheapest first slice.

**Acceptance criteria**

- Node coordinates are byte-identical across two cold loads of the same data; laying out the same input twice produces identical output.
- No frame exceeds 120 rendered nodes for any focus node in the real spine; the record layer is never drawn.
- `disa-stig:CATALOG` gates; `disa-srg:CATALOG` does not; the 448-rule benchmark buckets; bucketing is a pure function of sorted input.
- "Trace back" from any record renders the complete displayed path to its authority root, and that path is byte-identical to the record page's displayed authority rail.
- Toggling the mapping overlay adds **zero** nodes and **zero** edges to the tree model — assert by identity against the pre-overlay model.
- `disa-cci:CCI-000366` yields exactly 24 highlights plus one summary chip; a median node yields 1 and no chip.
- Drill state is encoded in the URL and restores on reload at every depth.
- Nothing in the UI implies locking, prerequisites or completion.
- 20 consecutive cold loads of `#/atlas` render content within 5s or show an actionable error; **zero indefinite spinners**.
- The same word appears in the toggle, the record action, the `<h1>`, the breadcrumb and the section heading.

---

## Verification

**Bias to cheap deterministic tests as the inner loop.** The repo already has `tests/graph/`, `tests/content-review.test.mjs`, `tests/atlas-neighborhood.test.mjs`, `tests/framework-data.test.mjs`, `tests/hierarchy-derivation.test.mjs` and `tests/e2e/`. Use Playwright only where the browser is the thing under test. The only expensive check in this epic is Phase 7's 20-run cold-load loop; it runs once per milestone, not in the loop.

| Phase | Test | Where |
|---|---|---|
| 0a | `compactLibrarySearchTransport` → `expandLibrarySearchTransport` round-trip preserves `published_connection_count`; the shared field list's length equals the reader's expected column count, so the constant can never drift again | `tests/graph/runtimeLoader.test.ts` |
| 0a | Search `AC-2`, assert a result row shows a non-zero connection count — **the S3 regression test** | `tests/e2e/` |
| 0b | Stubbed `Worker` that never posts: `fetchArtifact` rejects within the deadline; a second call re-fetches rather than awaiting the dead promise; `messageerror` also rejects | `tests/graph/runtimeLoader.test.ts` |
| 0b | `page.route` `library-search.json` to hang, load `#/explore`, assert `data-react-active="true"` and a visible error affordance — never a permanent overlay. **The A2 regression test** | `tests/e2e/load-resilience.spec.mjs` (exists) |
| 0c | `library_search.facets.objectTypes` contains no scaffold type | `tests/framework-data.test.mjs` |
| 1–5 | Acceptance criteria as written — mostly single `getBoundingClientRect` / `querySelectorAll` assertions against the built site, not components | live-site UX suite |
| 6 | Enhancement with both family and control structural parents resolves to the **control**; assert the literal chain `CATALOG > FAMILY-AC > AC-2 > AC-2.1` | `tests/graph/ancestorPath.test.ts` |
| 6 | Fixture reachable undirected but not by canonical parent → build throws | `tests/hierarchy-derivation.test.mjs` |
| 6 | Zero canonical-parent failures; zero nodes with >1 incoming `organizes` | `tests/framework-data.test.mjs` |
| 6 | Catalog sets cross-validate both directions; instrument parents resolve; no cycles; every `source_id` exists in the registry; every `issued_under` edge carries `source_refs` | new `tests/authority-spine.test.mjs` |
| 6 | **Reconciliation:** each catalog's `mandate` is consistent with its source's `mandate_basis` — this is the test that surfaces the AI RMF / SSDF registry errors (A7) instead of letting them ship | `tests/authority-spine.test.mjs` |
| 6 | The displayed authority rail composes a hop from `primary_authority`; canonical ancestry remains unchanged | `tests/atlas-neighborhood.test.mjs` + `tests/e2e/accessibility.spec.mjs` |
| 6 | Reading `atlas-spine.json` yields non-zero counts for **Risk** and **Assessment** specifically, and Compliance = 11, Governance = 3, Implementation = 3 | `tests/graph/atlasDrilldown.test.ts` |
| 6 | Expanding an area requests no `nodes.json` / `edges.json` — the `graphArtifactUrls` helper already does this check for other routes | `tests/e2e/bootstrap-payload.spec.mjs` |
| 7 | Collisions empty at every level; same input laid out twice is byte-identical; **position snapshot for L0–L2** that fails if a node moves without its parent set changing — this is what protects spatial memory | new `tests/graph/atlasTreeLayout.test.ts`, modelled on `atlasUniverse.test.ts` |
| 7 | No frame exceeds 120 nodes for any focus node in the real spine; `disa-stig` gates, `disa-srg` does not; the 448-rule benchmark buckets; bucketing is pure | new `tests/graph/atlasTreeAggregation.test.ts` |
| 7 | `CCI-000366` yields exactly 24 highlights + one chip; a median node yields 1 and no chip; overlay output adds zero nodes and zero edges — assert by identity against the pre-overlay model | unit |
| all | `tests/e2e/accessibility.spec.mjs` + `test:a11y:smoke` on the changed routes each phase; `npm run check:data-size` after Phases 6 (shard rebuild) | ongoing |

**Three permanent CI gates**, because these are the ones that regressed silently:

- **Ban-list scan** over rendered text on every route (Phase 4).
- **Chrome-before-content**: `header.site-header` at y=0 and first content above 400px, every route, three widths (Phase 1).
- **Canonical-parent trunk reachability** reported alongside undirected reachability, so the console can never again print 100% while records have dead-end breadcrumbs (Phase 6).

## Explicitly out of scope

New features, new sources, new record types, template/document generation changes, and cross-corpus relevance ranking (tracked separately in `spike-search-index-and-relevance-2026-08-08.md`).

**In scope, despite being data work:** the curated authority spine, the three build-correctness fixes, and the `atlas-spine.json` artifact. They are not features — they are the prerequisites without which Phase 7's view has nothing true to render.

## Decisions taken

**2026-08-08 — Atlas comes off the primary rail, and is not demoted.** The rail slot was never what made the map valuable; a blank destination is what made it weak. It becomes a lens with three entry points (§3.2a) and a skill-tree model (§7.1). It loses one nav slot and gains an entry point on every Library result set and every one of ~5,300 records. `#/atlas` remains a real, deep-linkable route.

**2026-08-08 — the Atlas map is a skill tree** you branch through and trace back up, subject to the three constraints in §7.2. Supersedes the Miller-column direction in `atlas-depth-spine-decision`; see §7.10.

**2026-08-08 — the curated spine is the product's contribution, not a compromise.** Federal compliance is sprawling because of bureaucracy; no citable source will ever hand over a single coherent tree, because no single authority built one. §1.4 confirms this is already how the product works — 99.97% of nodes reach the trunk only through the editorial layer. Badge it honestly as "Control Atlas structure," as the codebase already does, and stop treating it as a weakness to minimise.

**2026-08-08 — authority roots sit above the trunk, many-to-many.** Not as a level between areas and catalogs. `docs/tree-model.md` §2 and line 117 ("one or more roots") and the data both require it: SP 800-171 answers to four instruments across three branches of authority. §6.2.

**2026-08-08 — publisher-declared structure wins within a catalog**; the curated spine provides the levels above catalog roots. One canonical parent per node.

**2026-08-08 — the map's job varies by depth**: zoomed out = orientation, mid = discovery, focused = justification. Three deliberate states, §7.4.

**2026-08-08 — show all branches, state the gap plainly.** Voluntary-and-unmapped reads as explained; mandated-and-unmapped says "no published mappings yet." §6.7.

**2026-08-09 — mandate is four-valued**, not binary: `statutory` / `contractual` / `federal_policy_or_regulatory_mandate` / `issued_without_federal_mandate`. Kind and scope remain separate; non-universal scope requires a cited `mandate_note`. Current OMB M-26-05 evidence places SSDF in the issued-without-federal-mandate bucket. §6.3.

**2026-08-08 — STIGs get a technology gate**, generalised to any node over the threshold rather than special-cased. §7.6.

## Risks

- **Every legal citation in Phase 6 is unverified.** Instrument IDs, citations and mandate classifications must be source-checked before ship, each with a `data/source-registry.json` entry. That is real prerequisite work inside Phase 6, not incidental.
- **Phase 6 rewrites `ancestor_path` for all 29,350 nodes** and rebuilds every neighborhood shard (243 MB across 128). Expect `graph-diff-summary` and `check:data-size` to be loud; measure before merging. Do 6.5b before 6.5a or two rebuilds fight over the same diff.
- **The `issued_under` trap fails silently.** Adding it to `ORGANIZING_RELATIONSHIP_TYPES` reparents all 23 catalogs by lexical sort with no error. §6.4 states the correct approach; do not shortcut it.
- **`nist-800-172` (1/133) is conditionally contractual and `cui-policy` (2/128) is regulatory-policy mandated, but both are effectively unmapped** — genuine data gaps. They ship with "no published mappings yet" per §6.7 and are the strongest argument for prioritising those crosswalks next.
- **Determinism holds only within a build.** A STIG refresh that adds a benchmark shifts positions. Derive from a stable sort key, never array index; the §7.5 snapshot test turns a shift into a visible diff rather than a silent regression against spatial memory.
- **Phase 2 depends on official text being available to the search index.** If it isn't, that is a data-layer task to scope before Phase 2 starts — the difference between a day and a week. The connection-count half of that dependency is now answered: it is a two-field transport fix in Phase 0.
- **Phase 3's unification is lower-risk than it looks**, because the index is already unified. The work is browse UI, facets and redirects, not a data migration. Do not let it get re-scoped into one.
- **"Move" must not become "orphan."** Compare, Documents, Tasks, Starter documents and Resources all contain real work. The relocation audit table is a hard gate on Phase 3.
- **Cross-corpus relevance is a separate problem from result presentation.** `Platform One` ranking nine WLAN STIG rules above the correct portal will not be fixed by Phase 2's row redesign; it is tracked in its own spike.
- **React Flow's static import** sits on the critical path of a route about to become the front door. Worth lazy-loading behind a plain-DOM skeleton — optimisation, not blocker.
- **Scope honesty.** Phases 0–6 have hard, measurable definitions of done. Phase 7 is a genuine rewrite of the primary surface, and its aggregation and overlay thresholds will need tuning against real use in a way tests cannot settle. Sequence so 0–6 ship value even if 7 slips.

## Open items to reconcile (not blockers)

- **STIG scope conflict.** A recorded scope decision says "generic technology-class STIGs/SRGs only, never brand/product STIGs," but the graph carries 353 benchmarks and 16,877 product-specific rules. The technology gate works either way, but the rule and the shipped data disagree and one of them is wrong.
- **Doc drift** listed at the end of §1.4: `display-names.mjs` declares five node types that don't exist; `docs/PRD.md:188`'s provenance vocabulary appears on zero edges; `docs/STATE.md:1190` contradicts `runtimeLoader.ts`; `docs/adr/0011-graph-library.md` still names Cytoscape. Fix as encountered.
- **`Concept Crosswalk`** is a display string sitting in the `relationship_type` enum position on 1,059 edges. Normalise to a slug.
- **`parent_id` is dead** (0 of 29,350 nodes) yet still occupies slot 8 of every compacted shard node across 243 MB. Removing it is free bytes; `isValidatedStructuralPointer` becomes deletable with it.
- **Three orphaned map files** — `maps/800-53-to-fisma.json`, `maps/800-53-to-800-37.json`, `maps/csf-to-cpg.json` — are unregistered with no matching nodes. The FISMA one is the same instinct Phase 6 completes properly; fold or delete.
- **CMMC is a stub** — 3 program nodes, zero practices, despite `data/cmmc-practices.json` existing in the tree.
