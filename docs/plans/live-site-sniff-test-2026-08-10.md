# Live Site Sniff Test — Control Atlas

**Date:** 2026-08-10
**Reviewer stance:** First-time visitor deciding whether this becomes their go-to
federal-cyber reference. Browsed the live production site only
(`https://backslashbryant.github.io/control-atlas/`). No code was read to produce
findings; every claim below is anchored to what the live site actually served.
**Method note:** The review pane could not composite pixel frames, so this pass is
built from the live DOM, rendered text, route behavior, and real link/URL targets
— not screenshots. Two items flagged verbally (the misaligned blue box in search,
exact spacing) are marked **[visual — confirm]** and need a human eyeball or a
working screenshot pass. Everything else is DOM-confirmed.

---

## BLUF

The content is real and the data is here (28,783 records, a working faceted
Library, a working React-Flow Atlas graph). The problem is **presentation and
payoff**, and one bug poisons the whole first impression:

> **Every deep route renders the entire home landing page stacked on top of the
> real content.** Click Atlas, Library — anything — and you land back on the hero +
> the four destination cards. The actual page is mounted *below* it, off-screen.
> This single defect is why "clicking Atlas doesn't give me an Atlas" and why the
> whole site "feels like we threw up information on a page." **Fix this first.
> Alone it will make the site feel ~50% more finished.**

After that, the ranked issues are: (2) the Atlas aggregation is lopsided to the
point of being illegible — 85% of records fall into one limb and two limbs are
empty; (3) record pages surface internal plumbing (raw JSON filenames, duplicated
labels, a record's own parent folder masquerading as a "connection"); (4) URL
hygiene — query strings stuffed into hash routes (`?mode=novice#`, `?node=`,
`?crosswalk=…&workbench=…`); (5) the top nav is overloaded; (6) the Library dumps
29,367 unfiltered results with no query and no result rows visible.

**Recommendation:** Freeze new features. Run the P0 block below (route stacking +
record-page plumbing + URL cleanup). Those are correctness/trust bugs, not taste.
Then do the P1 legibility/aggregation pass. *Then* add features on a stable base.

---

## What a new user hits, in order

### 0. The route-stacking bug (P0 — the headline)

**Observed:** Navigating directly to `#/atlas` or `#/library` renders **two
`<main>` elements**. The first is a full, pixel-complete copy of the home landing
(hero headline "See the landscape. Trace the source…", the ecosystem preview, and
all four destination cards). The real route content ("Atlas map", "Library") is a
*second* `<main>` mounted underneath it. `get_page_text` returns the home copy
because it reads the first `<main>`.

**User experience:** Click any primary nav item → you appear to be back on the
home page. The payoff you expected (a map, a search) is pushed a full viewport
down, if you even scroll to find it. This is the concrete mechanism behind "if
every button click doesn't immediately pay off, we lose them."

**Why it matters:** This is the difference between "unfinished demo" and "real
product." No amount of copy or color fixes it.

**Acceptance:** A direct load of `#/atlas` produces exactly **one** `<main>`, and
the Atlas map is the first meaningful content in the viewport (above the fold). No
landing-page hero on any non-home route. Same for `#/library`, `#/resources`,
`#/guides`, `#/record/*`. Verify by asserting a single `<main>` per route in a
render test.

**Likely area (for the fix, not a finding):** route/layout mount-unmount — the
landing route element is being retained under subsequent routes. Recent commits
("stabilize route transitions", "route loading") were circling this; the residue
is still live.

---

### 1. Top navigation is overloaded (P1)

**Observed** in the header, left to right, all on one bar:
- Wordmark "Control Atlas" + the rotating `Ctrl` `Alt` `Crosswalk/Find/Trace`
  animation (on one read it rendered the rotating word **twice** — "Crosswalk
  Crosswalk" — an animation glitch).
- Primary nav: **Atlas · Library · Resources · Guides**
- **Search** button
- Utility nav: **Sources · About**
- A hamburger ("Open navigation menu") *also present at desktop width*.

That's 4 primary + 2 utility + search + wordmark-animation + a redundant hamburger
competing in one strip. It reads cramped because it *is* cramped.

**Recommendations:**
- Keep the rotating wordmark (brand decision) but fix the double-render glitch.
- Collapse "Sources" and "About" into a single overflow / footer-only home. They
  are reference/meta, not primary destinations.
- Don't show the hamburger at desktop width if the full nav is already visible —
  pick one.
- Primary nav should be the 3–4 verbs a user actually needs: Atlas, Library,
  Resources. "Guides" can live one level down unless it's a first-run priority.

**Acceptance:** Desktop header shows wordmark + ≤4 nav items + search, with no
duplicate hamburger and no double-rendered wordmark word.

---

### 2. The Atlas: aggregation is lopsided to the point of illegible (P1)

The Atlas map *works* (React-Flow graph, zoom/fit controls, node inspector). But
the aggregation it visualizes is not legible, which is the whole point of an
"aggregation mecca." Live node counts under the Cybersecurity trunk (28,783
total):

| Limb | Records |
|---|---:|
| Implementation | **24,530** (85%) |
| Threats & Defense | 1,065 |
| Assessment | 1,014 |
| Compliance | 1,909 |
| Architecture | 227 |
| Governance | 35 |
| Risk | **3** |
| Knowledge | **0** |
| Operations | **0** |

**Problems:**
- **One limb (Implementation) swallows 85% of everything.** That's a junk drawer,
  not a taxonomy. It's almost certainly DISA STIG technical rules (17,255
  "Technical rules" in the Library facet) flooding a single bucket. A map where
  one node is the whole map communicates nothing.
- **Two limbs are empty (Knowledge 0, Operations 0)** yet rendered as clickable
  nodes. Clicking them expands nothing — exactly the "clicking expands nothing nor
  tells people anything" complaint. Empty categories should not be advertised as
  destinations; either hide them or show an honest "nothing mapped here yet" state.
- **Risk = 3, Governance = 35** next to Implementation = 24,530 makes the visual
  hierarchy meaningless. The eye can't compare a 3 to a 24,530 in the same tree.

**Recommendations:**
- Rebalance the limb taxonomy so no single limb exceeds a sane share (rule of
  thumb: no leaf-of-the-trunk should hold >40%). Split "Implementation" (STIG
  technical rules almost certainly need their own limb or a nested tier).
- Suppress or clearly mark zero-count limbs.
- Consider showing counts on a log scale or with proportional node sizing so the
  distribution is *readable* even while lopsided — but fixing the taxonomy is the
  real answer, not a viz trick.

**Acceptance:** No limb >40% of trunk total; zero-count limbs are hidden or
explicitly labeled empty; every rendered node, when clicked, either drills down or
states plainly that it has nothing below it.

---

### 3. Record pages surface internal plumbing (P0 — trust)

Live-confirmed on `#/record/nist-800-171-rev2/3.1.1`. This is the "unorganized
junk due to legacy directions in the codebase" instinct — and it's right.

**Confirmed defects:**
- **Raw internal filename leaked to users.** The single "connection" row displays:
  `From: NIST 800 171 rev2 — requirements-800-171-rev2.json#3.1.1`. A build-artifact
  path (`requirements-800-171-rev2.json#3.1.1`) has no business on a public record
  page. This is the clearest "we threw up information" tell on the site.
- **A record's own parent folder is dressed up as a "connection."** The Connections
  section claims "2 connections" but the SP 800-171 group's only entry is
  `FAMILY-ACCESS-CONTROL` with relation **"Contains"** — i.e. the record's own
  parent family. That's structural hierarchy, already shown in the "Where this
  sits" section directly above. Padding the crosswalk with a self-referential
  parent link makes the aggregation look richer than it is. For a foundational
  access-control requirement, **2 connections (one of which is its own parent) is
  the real story** — the cross-framework crosswalk data is thin, and dressing it
  up erodes trust rather than hiding the gap.
- **Duplicated labels.** The mapping tooltip text "Published federal mapping or
  catalog entry from the named source." renders **twice** in the same row (tooltip
  + visible caption). "Open official source" appears **twice** on the page (header
  action + inside the description block).
- **Redundant/space-wasting header actions.** Header carries Back · Open official
  source · See this in the Atlas map · More actions(▾ Compare / Produce a document
  / Copy link). "Open official source" then repeats below. This is the "open record
  button wasting space where context could be" instinct applied to the record page:
  primary action duplicated, secondary actions promoted to top-level.

**Recommendations:**
- **Never render source filenames or `*.json#id` fragments in the UI.** Show the
  publication name and section; keep the file path in data provenance only.
- **Don't count structural parent/child links as "connections."** Reserve
  "Connections" for genuine cross-framework mappings (800-171 3.1.1 → 800-53 AC
  family, → CMMC AC.L2-3.1.1, etc.). If those don't exist in the data yet, say
  "No cross-framework mappings published yet" honestly rather than padding with the
  parent folder. (This is also a *data* gap worth a backlog item — see P1 below.)
- De-duplicate the tooltip/caption and the doubled "Open official source."
- Header: one primary action ("Open official source"), everything else in the
  "More actions" menu. Don't repeat the primary below.

**Acceptance:** No `.json`, no `#id` fragment, no internal path anywhere in
rendered record text. "Connections" excludes same-catalog parent/child structural
links. Each action appears once. Tooltip text is not duplicated as a caption.

---

### 4. URL hygiene — query strings stuffed into hash routes (P1)

The `?mode=novice#` cruft Bryant keeps seeing is real and systemic. Live examples
pulled straight from link targets:
- `#/atlas?node=nist-800-171-rev2%3A3.1.1` (the "See this in the Atlas map" link)
- `#/compare?crosswalk=relationships&workbench=relationships&source=nist-800-171-rev2&items=3.1.1`
  (the "Compare" action — four params, two of which duplicate each other:
  `crosswalk=relationships` and `workbench=relationships`)
- `?mode=novice#` (persona state, reported; leaks the novice/pro mode into the URL)

**Problems:** Ugly, unshareable-looking, and it exposes internal state names
(`workbench`, `crosswalk`, `mode=novice`) to users. Two params carrying the same
value (`crosswalk`/`workbench`) is dead legacy state.

**Recommendations:**
- Drop persona/mode from the URL entirely — it's session UI state, not a location.
- Collapse duplicate params (`crosswalk` vs `workbench`).
- Prefer clean path segments over query strings where the value identifies a
  resource (e.g. `#/atlas/node/nist-800-171-rev2:3.1.1`).
- URL-encoding `:` as `%3A` in visible links reads as broken to users — either use
  a clean separator or a path segment.

**Acceptance:** No `mode=` in any URL. No duplicate-value params. Compare/Atlas
deep links use the minimum set of human-legible params.

---

### 5. Library / search results (P1)

**Observed on `#/library`:**
- Loads **29,367 results with no query entered** — the entire corpus dumped as a
  "result set." Overwhelming and meaningless as a first view; there's no reason to
  rank 29k records against an empty query.
- The controls stack is dense: search box → "29,367 results" → List/Atlas-map
  toggle → Sort dropdown → "Compare records" → "Filters" button → filter panel
  (Publisher, Content kind, Publication, Has-published-connections). Good facets
  exist — Publisher, Content kind with counts, Publication, connection filter —
  but they're gated behind a "Filters" button rather than presented as the
  persistent left sidebar a user expects for faceted search.
- **Result rows did not render in the accessibility tree** — the "Search results"
  list was present but empty in the DOM snapshot despite the "29,367 results"
  count. Either the list is virtualized in a way that yields nothing to a11y, or
  there's an empty-state bug where the count shows but rows don't paint. **Needs a
  human check** — if rows genuinely don't render on first load, that's a P0.
- **[visual — confirm]** the misaligned blue box in the search field (reported).
  Likely a focus-ring / input-outline offset. Couldn't verify pixels this pass.

**Recommendations:**
- Empty query → show a **browse/landing state** (top publications, content-kind
  tiles, "recently updated"), not 29k ranked rows.
- Promote facets to a **persistent left sidebar** at desktop width (Publisher,
  Content kind, Publication, Has-connections). That's the standard faceted-search
  pattern users already know (Baymard's e-commerce faceted-navigation findings; NN/g
  on faceted search). Don't hide the primary filtering behind a button.
- Result rows should lead with **identifier + plain-English title + publisher**,
  and put context (snippet, mapping count) where the redundant "Open record" button
  currently wastes space — the whole row is the click target; a separate open
  button is redundant.

**Acceptance:** Empty-query Library shows a curated browse state, not a 29k dump.
Facets are visible as a sidebar at desktop. Result rows render on first load and
the whole row is clickable (no dedicated open-record button).

---

## Best-practice lens applied

These aren't opinions; they're the established principles the site is currently
violating, named so the fixes have a reference:

- **NN/g Usability Heuristic #1 (Visibility of system status) & #7 (Flexibility):**
  clicking Atlas must *show* the Atlas. The route-stacking bug is a direct #1
  violation — the user can't tell what state they're in.
- **NN/g Heuristic #8 (Aesthetic and minimalist design):** record pages carry
  duplicated actions, duplicated tooltip text, and internal filenames — noise that
  competes with the real content. Every unit of extra UI reduces the relative
  visibility of what matters.
- **Progressive disclosure:** 29k results and 24,530-in-one-limb both dump the
  whole corpus at once. Show the shape first, let the user drill. The Atlas map's
  own tagline ("Zoom from the whole landscape to the source you need") is the right
  instinct the rest of the site should honor.
- **Information scent (Pirolli/Card):** empty limbs (Knowledge 0, Operations 0) and
  a "Connections" count padded with the parent folder are false scent — they
  promise payoff that isn't there, which trains users to distrust every count.
- **Faceted search convention (Baymard, NN/g):** users expect a persistent facet
  sidebar, whole-row click targets, and a meaningful default (browse) state rather
  than an unranked full-corpus dump.
- **Honest empty/zero states:** a category with nothing in it should say so, not
  render as a live destination that expands into nothing.

---

## Prioritized backlog

### P0 — trust/correctness, do before any new feature
1. **Kill the route-stacking bug.** One `<main>` per route; deep routes must not
   render the home landing above their content. (Finding 0)
2. **Strip internal plumbing from record pages.** No `*.json#id`, no file paths, no
   internal state names in rendered text. (Finding 3)
3. **Stop counting same-catalog parent/child links as "Connections."** Reserve the
   Connections section for genuine cross-framework mappings; show an honest empty
   state when there are none. (Finding 3)
4. **Confirm Library result rows actually render on first load** (a11y tree came
   back empty under a 29k count). If they don't paint, promote to top of P0.
   (Finding 5)

### P1 — legibility/structure, the "make it slap" pass
5. **Rebalance the Atlas taxonomy** so no limb exceeds ~40%; split the
   Implementation junk drawer; hide/label zero-count limbs. (Finding 2)
6. **Empty-query Library = browse state**, not a 29,367-row dump; facets become a
   persistent desktop sidebar; whole result row is the click target (remove the
   redundant open-record button). (Finding 5)
7. **URL cleanup:** remove `mode=`, collapse duplicate `crosswalk`/`workbench`
   params, prefer clean path segments, stop URL-encoding `:` into visible links.
   (Finding 4)
8. **Declutter record-page header:** one primary action, rest in the overflow menu;
   de-duplicate "Open official source" and the doubled tooltip caption. (Finding 3)
9. **Thin the top nav:** ≤4 primary items, drop the redundant desktop hamburger,
   fix the double-rendered rotating wordmark. (Finding 1)

### P1.5 — data, not just UI (the real "aggregation" fix)
10. **Enrich the crosswalk data.** 800-171 3.1.1 having 2 "connections" (one being
    its own parent) is a *data* gap, not just a display gap. The site's core pillar
    is cross-framework leverage; the maps need to actually exist (800-171 ↔ 800-53
    ↔ CMMC ↔ CSF). No UI polish substitutes for empty crosswalks. Track separately
    from presentation.

### P2 — visual QA (needs a working screenshot/human pass)
11. **[visual — confirm]** the misaligned blue box in the search field; spacing and
    density on the record page; the doubled-wordmark animation glitch under load.

---

## What this pass did *not* verify
- Pixel-level visual issues (the blue box, exact spacing, contrast) — the review
  pane didn't composite frames. Do one human screenshot pass for the P2 items.
- Whether Library rows render for a real query (only checked the empty-query
  default). Item 4 above hinges on this.
- `?mode=novice#` was reported by Bryant and is consistent with the query-in-hash
  pattern I confirmed elsewhere, but I did not catch the exact click that produces
  it. Confirm the trigger when fixing Finding 4.
