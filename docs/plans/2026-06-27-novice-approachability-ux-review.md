# Control Atlas — Novice-Approachability UX Review & Correction Spec

- **Date:** 2026-06-27
- **Reviewer method:** Live walkthrough of the built site (`dist/site` served on :4173) + source inspection. Every primary route exercised on desktop (961–1280px) and mobile (375px); flagship node interaction, search, compare, template, start-here, and detail flows tested; keyboard focus and first-run verified.
- **Lens (set by the product owner, non-negotiable):** *"Would this have helped confused-beginner me?"* This is not a "does it function" review. The mission is to **demystify and decrappify federal compliance for a novice** — reduce cognitive load, lead with plain language, progressive disclosure, simple by default. The product is measured against approachability, not feature completeness.
- **Mandate:** "We are just starting out, so any churn / major idea is acceptable." Bold redesigns are in scope. Atlas Map is treated as a redesign, not a patch.

---

## 1. Verdict

**Not ready** — against the mission, not against "does it work."

Functionally, most flows work and several pages are well-architected. But the product currently **re-presents the sprawl instead of demystifying it.** A beginner does not land in a calm, guided space; they land in a dense reference console: every page opens with the same four stacked text blocks (eyebrow → display headline → summary → intro/instruction box) before any content, the same information is shown three ways at once (Atlas Map graph + List + matrix), labels and taglines repeat verbatim, and the one place that should say *why a control matters in plain English* says nothing specific. The owner's own first reaction — "information overload, repetitive text, doesn't feel modern, look at all this" — is the correct read and is the headline finding.

The flagship Atlas Map does not match the intended mental model (click a category → expand to frameworks → expand to controls). It shows all nine categories at once and clicking a node does nothing a novice would expect.

Before this is "ready," three things must change: **(A) strip the per-page text scaffolding and repetition, (B) rebuild Atlas Map as progressive click-to-expand, (C) populate the plain-language content layer** the detail page is already built to hold.

---

## 2. Highest-Risk Issues

Ordered by impact on a novice. The first three are the mission-level risks; the rest are concrete defects found live.

### R1 — Every surface overwhelms before it explains (density + repetition)
- **Issue:** Pages lead with a stack of restated framing, not content. Sources opens with EYEBROW → "Review sources before you rely on a match" → a two-line summary → a "HOW TO READ THIS PAGE" box → a "Canonical source links" box → *then* the first source. Atlas Map shows the same nine categories as a graph **and** a List tab **and** a coverage matrix simultaneously.
- **Evidence:** Live Sources page (4 text blocks before content); a source card prints "Federal program" twice consecutively; Atlas Map renders graph + List + matrix of identical nodes side-by-side; detail page summary is meta-instruction ("Open with meaning first, review where this item appears, then use the grouped relationships…").
- **Why it matters:** Directly violates the mission. A novice cannot find the one thing to read. This is the "look at all this" reaction, by construction.
- **Required correction:** One primary thing per surface. Collapse the eyebrow/headline/summary/intro scaffold to **headline + one sentence**. Remove "how to read this page" boxes — the page should be self-evident. Pick **one** default representation per surface and make the others opt-in.
- **Risk if ignored:** The product fails the exact users it exists for; bounce on first visit.

### R2 — Atlas Map is a static picture, not an explorable web
- **Issue:** The intended model — click "Frameworks" → expand to frameworks → click a framework → expand to its controls — is not implemented. All nine categories render at once; clicking a node only selects it (highlights the matrix). To go deeper a user must retype an ID into a search box, which swaps to a different focused view.
- **Evidence:** Live test — clicked "Governance / Risk Framework" node: node count stayed 9, hash unchanged, nothing expanded. Source: foundation map wires `onOpenNode`/`onSelectNode` to selection only (`AtlasMapPage.tsx`).
- **Why it matters:** The flagship is the orientation/"wow" surface for beginners. A static 9-box diagram + a 9×9 dot matrix is the sprawl, redrawn. The owner's vision *is* the mission applied to the map.
- **Required correction:** Rebuild as progressive disclosure (see §5 and §7, Phase 3). Start collapsed at the category layer; expand one layer on click; let users walk category → framework → control → mapping, with breadcrumbs and an always-available list fallback.
- **Risk if ignored:** The headline feature reinforces overwhelm instead of relieving it.

### R3 — The plain-language content layer is empty where it matters most
- **Issue:** The control detail page is built meaning-first, but the meaning isn't there. "What this is" falls back to the raw, semicolon-laden official control text when `plain_language_summary` is absent (true for AC-2). "Why it matters" is a hardcoded template identical for every record: *"{ID} is part of the public compliance library. Use it to understand the requirement, see the public connections around it…"*
- **Evidence:** Live AC-2 page; source `ObjectDetailPage.tsx:213–219` (templated "Why it matters"); `:206–211` (raw `description` fallback).
- **Why it matters:** "What does this control mean?" is the literal novice question the product promises to answer. It currently answers with jargon and boilerplate.
- **Required correction:** Treat plain-language summary + a real "why it matters" as **required content** for the top-N controls a beginner will hit (the baselines, the Start-Here recommendations, the Playbook targets). Remove the generic "Why it matters" template; if no specific text exists, omit the card rather than print filler.
- **Risk if ignored:** The core promise is unmet on the most-visited pages.

### R4 — Atlas Map List view overlaps the coverage matrix (broken layout)
- **Issue:** On Atlas Map, switching to **List** renders the connections table at its intrinsic width (~667px) inside a ~430px grid track; it bleeds into and paints over the coverage matrix. Headers ("SOURCE BASIS / TRUST LEVEL / PLAIN-LANGUAGE RATIONALE") and "Official link" badges land on top of matrix rows — unreadable.
- **Evidence:** Live at 961px viewport: list table x=55→722, matrix container x=481→908 (~240px overlap). Root cause: `.relationship-graph-table`/`.detail-table` are `width:100%` with no `table-layout:fixed` and **no overflow wrapper**; the matrix has `.atlas-matrix-scroll`, the List view doesn't. Manifests roughly 900–1100px (the <900px breakpoint collapses to one column and hides it).
- **Why it matters:** The List view is also the screen-reader/keyboard fallback. It's visibly broken on the flagship at common laptop widths.
- **Required correction:** Wrap the List table in an `overflow-x:auto; max-width:100%` scroll container (mirror `.atlas-matrix-scroll`), or apply `table-layout:fixed`. Add a responsive E2E assertion at 1000px.
- **Risk if ignored:** Broken flagship; a11y fallback unusable.

### R5 — Search state is lost on refresh and split across two systems
- **Issue:** Explore's inline search is component-state only — the query never enters the URL, so refresh/back/share lose it. Separately, the header "Search" opens an overlay that is a *launcher* (no typeahead; Enter routes to Explore). Two different search experiences, one of which isn't bookmarkable.
- **Evidence:** Live — searched "access control" on Explore, reloaded → input empty, hash still `#/explore`. Overlay shows "Type to search records. Press Enter…" with no inline results.
- **Why it matters:** Beginners refresh, share links, and use back. Losing their search is disorienting; two search affordances that behave differently is a "recognition over recall" failure.
- **Required correction:** Make Explore search route-derived (`#/explore?q=…`), restored on load. Decide one search model: either the overlay does live typeahead and is the single entry, or it's an explicit launcher with that one job. Don't ship both half-built.
- **Risk if ignored:** Repeated lost work; user distrust.

### R6 — Unknown routes silently render Home (no not-found)
- **Issue:** `#/start-here` (a plausible guess for the Start page, which is actually `#/start`) renders the **Home page** with no indication anything was wrong. Any unrecognized hash falls back to Home.
- **Evidence:** Live — `#/start-here` → Home hero; `parseHashLocation` defaults unknown paths to `"home"` (`hashRoutes.ts:64`).
- **Why it matters:** Silent wrong-page is more confusing than an honest "not found." Beginners typo and follow stale links.
- **Required correction:** Add a not-found view with the route attempted and recovery links (Home, Start, Search). Don't masquerade as Home.
- **Risk if ignored:** Confusing dead-ends that look like content.

### R7 — Mobile header eats a quarter of the screen; flagship barely usable
- **Issue:** The header is **212px tall at 375px** (no hamburger; nav wraps to three rows). On Atlas Map mobile the graph is a tiny, horizontally-clipped left-to-right diagram below stacked intro text and the matrix.
- **Evidence:** Live 375×812 — `.site-header` height 211.95px (26% of viewport); Atlas Map nodes clipped ("Governance / Risk Frame…"), still LR orientation in portrait.
- **Why it matters:** Many beginners arrive on phones. First impression is chrome, not content; the flagship is unreadable.
- **Required correction:** Collapse mobile nav to a single bar + drawer/menu (the existing "More" menu can absorb secondary items). Target header ≤96px. For the redesigned map, use vertical expansion on mobile (top-down), not LR.
- **Risk if ignored:** Mobile novices never reach the value.

### R8 — Two competing "active" signals in the primary nav
- **Issue:** "Atlas" is permanently styled as a filled blue pill (a CTA treatment), while the real active route is shown by a teal underline. On every page two items look selected (e.g., on Start: "Start" underlined **and** "Atlas" filled).
- **Evidence:** Present in every desktop and mobile screenshot.
- **Why it matters:** "Where am I?" is a core wayfinding question; the nav gives two answers.
- **Required correction:** One active treatment, route-derived. If Atlas deserves emphasis, use a distinct non-"selected" affordance (e.g., a leading icon), not the same visual language as the active state.
- **Risk if ignored:** Persistent low-grade disorientation.

---

## 3. What Works (preserve — do not break)

- **The rotating `Ctrl+Alt+[Audit / Map / Navigate / Comply]` wordmark.** This is the signature brand element and the product's personality. Keep it. *(Owner-confirmed: keep the rotation; remove the redundant static restatements of it, not the animation.)* What not to break: the animated header pill and the first-run splash that reuses it.
- **Start Here (`#/start`).** Three plain-language questions → a route-derived recommendation with real next-step links (Open in Explore, Open Compare, Generate template, Playbooks) + Restart. This is the mission done right. Don't redesign its logic; only align its chrome.
- **Playbooks "Recommended for new users."** Explicit beginner on-ramp ("Start with these three if you are new…") with plain-English outcome titles. Strongest novice content on the site. Preserve the section; promote it.
- **Compare empty state.** "No public connections found for this comparison. Try changing one catalog…" with Reset filters / Review sources / Choose another comparison. A model empty state — replicate this pattern everywhere.
- **Detail page information architecture.** Breadcrumb, meaning-first ordering, grouped connections, a slot for plain-language summary. The scaffold is right — fill it (R3), don't rebuild it.
- **Accessibility baseline.** Global `:focus-visible` (3px cyan outline), labeled inputs, the coverage matrix exposed as a real table with text alternatives, skip-link, reduced-motion handling on the wordmark and splash. Keep this bar; extend it.

---

## 4. UI/UX Corrections (by area)

Each: **Current problem → Required change → Acceptance criteria.**

### Navigation
- **Two active signals (R8).** → One route-derived active treatment; give Atlas a non-"selected" emphasis if needed. → *AC:* on any route, exactly one nav item reads as current; it derives from the URL.
- **Mobile nav 3-row wrap, 212px header (R7).** → Single bar + drawer; secondary items into a menu. → *AC:* header ≤96px at 375px; primary actions reachable in one tap; keyboard-operable menu.

### Homepage / entry
- **Redundant tagline + duplicated wordmark.** The hero restates "The public map for federal cyber compliance" (also in footer + title) and prints a *static* "Ctrl+Alt+Comply" directly below the animated header wordmark. → Remove the static `Ctrl+Alt+Comply` hero line; keep the tagline in exactly one place. → *AC:* "Ctrl+Alt+X" appears once (the animated wordmark); tagline appears once.
- **Seven intent cards, mixed voice.** Six are FAQ questions ("Where do I begin?"), one is a noun ("Atlas"); 7 cards leave ragged grid slots. → Reduce to a small, consistent set with one voice; lead with the two beginner actions (Start, Atlas). → *AC:* ≤5 cards, one title voice, no empty grid slots at md/lg.

### Primary workflow (orientation)
- **No single obvious first action.** → Make "Start here" the unambiguous primary on Home; everything else secondary. → *AC:* one visually-primary CTA above the fold.

### Atlas Map (flagship) — see §5/§7 for the redesign
- **Static, all-at-once, triple representation (R1/R2).** → Progressive click-to-expand; one default view; List as explicit fallback; matrix on demand. → *AC:* first load shows the top layer only; clicking a node expands one layer; a novice can reach a control in ≤3 clicks without typing.

### Search / filters
- **Not route-derived; two systems (R5).** → Route-derive Explore search; pick one search model. → *AC:* `#/explore?q=…` restores on reload; back/forward restore prior queries.
- **"Refine results" / "Show only items with connections" discoverability.** Filters are fine but buried under a generic "Refine results →". → Label what filtering does in beginner terms. → *AC:* filter affordance names its effect.

### Cards / lists / tables
- **Identical icons across Compare/Templates/Playbooks cards.** Icons don't differentiate. → Either differentiate per type or drop the icon. → *AC:* icons carry meaning or are removed.
- **"More actions" (Explore card) is vague.** → Name the action(s) or remove. → *AC:* no card action labelled only "More actions".
- **"4 categories" vs 5 category chips (Templates + Playbooks).** Count excludes "Other". → Make count and chips agree. → *AC:* stated category count equals selectable categories.

### Detail pages
- **Boilerplate "Why it matters"; raw "What this is"; meta summary (R3).** → Real plain-language content; remove templated filler; drop the "how to read this page" summary. → *AC:* for the top-N beginner controls, "What this is" is plain language and "Why it matters" is control-specific; no identical "Why it matters" string across records.
- **"Where it appears" prints duplicates** ("LOW, MODERATE, HIGH, LI-SAAS, LOW, MODERATE, HIGH"). → De-duplicate `locationSummary`. → *AC:* each baseline listed once.

### Forms
- **Compare race: two selects changed in quick succession drop the first (source).** `navigate()` merges a patch over possibly-stale `viewState`. → Derive both params from current DOM/select state on submit, or use a functional state update. → *AC:* setting Framework A then B yields `source=…&target=…`; rapid changes don't drop a field.
- **Compare placeholder clipped** ("Leave blank to compare all visible iten"). → Fix overflow/width. → *AC:* placeholder fully visible at all desktop widths.
- **Single-framework selection shows nothing** (no guidance until both set). → Show a "pick a second framework" hint. → *AC:* partial input yields guidance, never a blank result area.

### Visual system
- **Per-page text scaffold (eyebrow/headline/summary/intro box) on every route.** → Standardize to headline + one sentence; reserve the eyebrow for section context only. → *AC:* no route shows more than two stacked intro text blocks before content.
- **Wordmark blank-fade beat.** The word fully fades to opacity 0 before swapping → ~200ms empty blue pill (visible as "broken" on mobile). → Crossfade so a word is always visible; unify the word lists (header has 4, splash has 8). → *AC:* no frame shows an empty pill; one shared word list.
- **Templates sticky filter bar at 0.96 opacity** lets content faintly bleed through. → Make `.catalog-filter-bar` fully opaque. → *AC:* no bleed-through behind the sticky bar.

### Responsive behavior
- **Atlas Map LR graph in portrait, clipped nodes (R7).** → Vertical expansion on mobile. → *AC:* at 375px the map reads top-to-bottom, no horizontal clipping of labels.

### Copy
- **"Playbook" vs "pattern" for the same thing** (h1 "Compliance playbooks"; card CTA "Open this pattern"; route `patterns`). → Pick one user-facing term everywhere. → *AC:* one term in nav, headings, CTAs, and URLs.

---

## 5. Information Architecture

**Primary nav (route-derived, one active state):** Start · Atlas · Explore · Compare · More
- **More** menu: Playbooks, Templates, Sources, About.

**Utility (right):** Search · Help · Glossary.

**Route structure (keep hash routing; static-site-safe):**
| Path | View | Responsibility |
|---|---|---|
| `#/` | Home | One-line what-it-is + one primary action (Start here) + a short, single-voice card set |
| `#/start` | Start Here | 3-question → recommendation (keep) |
| `#/atlas-map` | Atlas | **Progressive expand** flagship (redesign) |
| `#/explore?q=…` | Explore | Route-derived search + grouped results |
| `#/compare?...` | Compare | Guided comparison (keep) |
| `#/playbooks` | Playbooks | Task guidance; "new users" first (keep, rename consistently) |
| `#/templates` | Templates | Generate blank artifacts |
| `#/sources` | Sources | Provenance/trust (de-densify) |
| `#/record/{catalog}/{item}` | Detail | Plain-language meaning-first (fill content) |
| `#/not-found` | Not found | Honest fallback w/ recovery (new) |

**Not top-level nav:** Sources, Templates, About, Glossary (utility/More). The beginner's spine is **Start → Atlas → a record**.

**Terminology to fix:** "pattern" → standardize to **playbook** (or vice-versa) across UI and routes. Avoid "registry-only entries", "draft / legacy sources", "supporting references" as first-encounter labels without a plain-language gloss. Keep the human control name primary ("Account Management"), the ID secondary.

---

## 6. Design System Requirements

Tokens already exist in `styles/tokens.css` (`--ca-*`). The debt is **two parallel CSS systems** (`.ca-*` in `components.css`; unprefixed legacy in `surfaces.css`, ~1970 lines). Consolidation is foundational to stop the density/repetition from recurring.

- **Spacing:** use the existing `--ca-space-*` scale exclusively; retire ad-hoc margins in `surfaces.css`.
- **Typography:** cap interior-page headings — interior `h1` ≤ `--ca-text-3xl` (1.875rem). Reserve the display clamp for Home only. Body line-length max ~70ch.
- **Page header primitive:** a single `PageHeader` = optional eyebrow + headline + **one** sentence. No page may stack a second intro/instruction box by default.
- **Color/contrast:** maintain WCAG 2.2 AA (provenance colors already pair with text labels — keep that rule; never encode meaning in color alone).
- **Surface/card rules:** one card component; sticky surfaces are fully opaque; consistent radius (`--ca-radius-md`).
- **Focus:** keep the global `:focus-visible` 3px outline; ensure custom graph nodes and the expand controls are in the tab order with visible focus.
- **Motion / reduced-motion:** wordmark crossfades (no blank frame); honor `prefers-reduced-motion` (already done for splash/wordmark) for the new map expansion (no animated reflow; instant layout).
- **Button hierarchy:** exactly one `primary` per section; everything else `secondary`/`quiet`.
- **Badge/chip:** provenance/trust badges always carry text; cap visible filter chips and gloss jargon.
- **Tables/lists:** every data table lives in an `overflow-x:auto; max-width:100%` wrapper (the R4 class of bug); `table-layout:fixed` where columns are known.
- **Forms:** labels visible; partial-input guidance; submit derives state from current values (no stale-merge).

---

## 7. Component Corrections

**Create**
- `PageHeader` (shared) — eyebrow? + headline + one sentence. Replaces the bespoke per-page header stacks. *Props:* `eyebrow?`, `title`, `summary?`. *States:* n/a. *A11y:* `h1` per page. *Used:* every route.
- `AtlasExplorer` (redesigned Atlas Map) — progressive expand graph/tree. *Responsibility:* render the current expansion frontier only; expand one layer on node activation; breadcrumb of the path; list fallback. *Props:* `runtime`, `rootLayer`, `expandedPath`, `onExpand`, `onCollapse`, `onOpenRecord`. *States:* collapsed / expanding(loading) / expanded / empty / error. *A11y:* nodes are buttons with `aria-expanded`; keyboard expand/collapse; the list fallback is the SR path. *Used:* `#/atlas-map`. *Reuses:* `useClusteredGraph`, `expandFocusedControlCluster`, ELK.
- `NotFoundView` — route attempted + recovery links. *Used:* unknown hash.
- `EmptyState` (extract Compare's pattern) — `what happened` + `what next` + actions. *Used:* every data surface.

**Split / change**
- `RelationshipExplorer` — extract the List table into a scroll-wrapped `ConnectionsTable` (fixes R4); stop rendering Map + List + matrix simultaneously on the foundation page (one default).
- `AtlasMapPage` — wire node activation to **expand**, not select-only.
- `ObjectDetailPage` — remove templated "Why it matters"; render plain-language content or omit the card; de-dupe "Where it appears"; drop the meta summary.
- `TopNav` — single route-derived active state; mobile drawer; crossfade wordmark; shared word list.

**Remove**
- The static `Ctrl+Alt+Comply` hero line (`HomePage`).
- "How to read this page" / "Canonical source links" intro boxes as default (move to progressive disclosure).
- Duplicate tagline instances (keep one).

Keep components single-purpose; compose `PageHeader` + `EmptyState` everywhere rather than re-implementing per page.

---

## 8. Loading, Empty, and Error States

Every major surface must define all five. Today: Compare is the gold standard; others are partial.

| Surface | Loading | Empty | Error | Recovery | ARIA/status |
|---|---|---|---|---|---|
| Atlas Map | content-shaped skeleton of the top layer | "No connections at this layer" + go up | retry + open record | breadcrumb up / search | `aria-busy`, `aria-expanded` on nodes |
| Explore | result-shaped skeleton (exists) | "No matches for '{q}'" + clear/broaden | retry | clear query / Start | `aria-live` count |
| Compare | (ok) | (ok — keep) | (ok) | (ok) | (ok) |
| Detail | connections skeleton (exists) | per-card "not published yet" (exists) | retry | back to results | polite |
| Templates | n/a | "no templates match" + clear | n/a | clear filter | — |
| Not found | n/a | route attempted + links | n/a | Home/Start/Search | heading focus |

Rule: **no dead ends.** Every empty/error answers *what happened* and *what next*. Never silently render Home (R6).

---

## 9. Accessibility Requirements (WCAG 2.2 AA minimum)

- **Keyboard-only:** complete Start → Atlas expand → open record → Compare without a mouse. Map nodes are buttons with `aria-expanded`; expansion reachable via Enter/Space; arrow-key movement optional but the **list fallback is the guaranteed SR path**.
- **Focus visibility:** keep global outline; verify on graph nodes, expand toggles, drawer.
- **Contrast:** re-check muted text (`--ca-text-subtle` on `--ca-surface`) at small sizes; AA for all body and badge text.
- **Status messages:** search result counts, expansion changes, and compare results announced via `aria-live`.
- **Reduced motion:** wordmark, splash, and **map expansion** must not animate reflow under `prefers-reduced-motion`.
- **Touch targets:** ≥44px for nav, chips, map nodes, card CTAs on mobile.
- **Non-color status:** provenance/coverage always paired with text/shape (matrix already does this — keep).
- **Icon-only controls:** Search/Help/Glossary and map controls need `aria-label` (verify all).
- **Form labels/errors:** visible labels; Compare partial-input guidance is programmatically associated.
- **Map/chart alternative:** the connections **list** is the required equivalent of the graph and must always be reachable.

---

## 10. Performance Requirements

- **ELK/React Flow bundle** (~501KB gzip) stays route-split to `#/atlas-map` (already). Don't pull graph deps into the shell.
- **Large groups** (e.g., "requirement (5820)") must stay capped/grouped — they already render only a few cards per group with expand-on-demand. Preserve this; never render thousands of cards.
- **Progressive map** must fetch/compute only the expanded frontier, not the full graph, on each expand.
- **Skeletons:** content-shaped (exist for Explore/Detail); add one for the map's top layer.
- **No speculative caching/workers** — not warranted at current scale.
- **Layout/reflow:** fix the List/matrix overflow (R4) and the sticky-bar repaint; avoid animated reflow on expand under reduced-motion.

---

## 11. Implementation Sequence

Foundational structure and content before visual polish. Each phase independently shippable.

**Phase 0 — De-densify + de-dupe (highest ROI, lowest risk)**
- Goal: kill the "wall of text" and repetition the owner reacted to.
- Files: `HomePage.tsx`, `SourcesPage.tsx`, `ObjectDetailPage.tsx`, `pagePrimitives.tsx`, `surfaces.css`.
- Tasks: introduce shared `PageHeader` (headline + one sentence); remove static `Ctrl+Alt+Comply` hero line and duplicate taglines; remove "Why it matters" boilerplate + meta summary; de-dupe "Where it appears"; collapse Sources intro boxes; cap interior `h1` size.
- AC: ≤2 intro blocks per route; no identical "Why it matters" across records; no duplicate tagline/baseline strings. Why first: immediate relief, no architecture risk.

**Phase 1 — Routing & search integrity**
- Goal: state survives refresh/back; honest not-found.
- Files: `hashRoutes.ts`, `App.tsx`, `ExplorePage.tsx`, `SearchOverlay.tsx`, `viewState.ts`.
- Tasks: route-derive Explore search (`?q=`); add `NotFoundView`; settle one search model.
- AC: reload restores query; unknown route → not-found; one search behavior. Why before polish: wayfinding correctness.

**Phase 2 — Flagship layout fixes (unblock the map)**
- Files: `RelationshipExplorer.tsx`, `RelationshipGraphTable.tsx`, `surfaces.css`.
- Tasks: scroll-wrap the List table (fix R4); stop simultaneous Map+List+matrix on foundation (one default + opt-in); fully opaque sticky bar.
- AC: no overlap 900–1280px; one default representation; E2E at 1000px.

**Phase 3 — Atlas Map redesign (the vision)**
- Goal: click-to-expand drill-down (category → framework → control → mapping).
- Files: new `AtlasExplorer`, `AtlasMapPage.tsx`, `useClusteredGraph.ts`, ELK layout.
- Tasks: render top layer collapsed; expand one layer on node activation with `aria-expanded`; breadcrumb path; list fallback; vertical expansion on mobile; skeleton + empty/error per §8.
- AC: reach a control in ≤3 clicks without typing; keyboard-operable; mobile reads top-down; reduced-motion safe. Why after Phase 2: needs the layout/overflow foundation.

**Phase 4 — Content layer (plain language)**
- Goal: answer "what does this mean / why it matters" for real.
- Files: data build (`scripts/build-framework-data.mjs` / source data), `ObjectDetailPage.tsx`.
- Tasks: populate `plain_language_summary` + control-specific "why it matters" for top-N beginner controls (baseline members, Start-Here + Playbook targets); omit cards lacking content.
- AC: top-N records show plain language, not raw text or boilerplate.

**Phase 5 — Chrome & responsive polish**
- Files: `TopNav.tsx`, `surfaces.css`, `components.css`.
- Tasks: single active nav state; mobile drawer + ≤96px header; wordmark crossfade + unified word list; begin `surfaces.css` → token consolidation.
- AC: one active signal; header ≤96px @375px; no blank-pill frame.

---

## 12. QA & Test Plan

**Unit / contract**
- `hashRoutes`: `#/explore?q=x` round-trips; unknown path → not-found (not home). 
- `locationSummary` de-dupes.
- Detail: no record renders the legacy "Why it matters" boilerplate string.
- Category count == chip count (Templates, Playbooks).

**Component**
- `AtlasExplorer`: node activation expands exactly one layer; collapse restores; `aria-expanded` toggles; list fallback lists every edge of the current frontier.
- `ConnectionsTable`: never exceeds container width; scroll wrapper present.
- `PageHeader`: renders ≤2 text blocks.

**E2E (Playwright — extends existing suite)**
- Atlas Map @1000px: List view does not overlap matrix (bounding-box assertion).
- Atlas Map: click category → child layer visible; reach a control in ≤3 activations, no typing.
- Explore: search "access control" → reload → query restored from URL.
- Unknown hash → not-found view with recovery links.
- Compare: select A then B → URL has `source` and `target`; partial input shows guidance.
- Mobile @375px: header height ≤96px; map labels not horizontally clipped.

**Accessibility (axe + manual)**
- Keyboard-only: Start → Atlas expand → open record → Compare.
- `aria-live` announces search counts and expansion changes.
- Reduced-motion: no animated reflow on map expand or wordmark.

**Responsive smoke:** 375 / 768 / 1000 / 1280 on Home, Atlas, Explore, Detail.

**Performance:** graph chunk stays out of the shell bundle; map expand fetches only the frontier; large groups never render >N cards.

**Regression:** existing 86 E2E green; Start Here, Compare empty state, Playbooks "new users" unchanged.

---

## 13. Definition of Done

- No route shows more than two stacked intro text blocks before content.
- "Ctrl+Alt+X" appears once (the animated wordmark); the tagline appears once; the wordmark never shows a blank frame.
- "Why it matters" is control-specific or absent — never the templated library string; "What this is" is plain language for the top-N beginner controls.
- Atlas Map starts at the top layer; clicking a node expands one layer; a novice reaches a control in ≤3 clicks without typing; a list fallback exists; it works keyboard-only and reads top-down on mobile.
- One default representation per surface; List view never overlaps the matrix at any width.
- Explore search is in the URL and restores on reload; back/forward restore prior queries.
- Unknown routes show an honest not-found with recovery, never Home.
- Primary nav shows exactly one active item, derived from the route.
- Mobile header ≤96px at 375px; primary actions reachable in one tap.
- Every major surface defines loading, empty, and error states; every empty/error answers *what happened* + *what next*.
- Contrast passes WCAG 2.2 AA; focus visible on all interactive elements including map nodes.
- One user-facing term for playbooks/patterns across UI and routes.
- `npm run precommit` green (build + lint + typecheck + license + unit/contract + a11y + E2E).

---

## 14. Worklog

| Task | Status | Notes / Deviations |
|---|---|---|
| Read mission/context/prior-audit memory | Done | Lens = "would this help confused-beginner me?" |
| Serve built site, walk every route (desktop) | Done | Home, Atlas, Explore, Compare, Templates, Start, Sources, Playbooks, About, Detail |
| Test flagship node interaction | Done | Click category = select only; no expansion (R2) |
| Test Explore search + refresh | Done | Query not route-derived; lost on reload (R5) |
| Test Compare flow + empty state | Done | Route-derived; strong empty state; select race found |
| Test Templates + Start Here flows | Done | Both route-derived; Start Here is a strength |
| Inspect detail content layer | Done | Boilerplate "Why it matters"; raw "What this is"; dup baselines (R3) |
| Mobile 375px (Home, Atlas) | Done | 212px header; clipped LR map; blank-pill wordmark (R7) |
| Keyboard focus / first-run | Done | Global focus-visible present; splash reuses wordmark |
| Reproduce + root-cause List/matrix overlap | Done | Missing scroll wrapper on `.relationship-graph-table` (R4) |
| Capture owner steers | Done | Keep rotating wordmark; cut redundant tagline; Atlas = progressive expand; churn OK |
| Save memories | Done | brand-treatment, atlas-map-vision, index updated |
| Write spec to plans dir | Done | This file |
| Implement changes | Not started | Review-only per request; Phase 0 is the recommended next step |
