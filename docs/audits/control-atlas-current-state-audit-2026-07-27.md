# Control Atlas current-state product audit

Date: 2026-07-27  
Audit lead: Muse (product, IA, UX, and UI) with Pixel-style verification  
Repository baseline: `main` at `8b376b4`  
Shipped surface: `https://backslashbryant.github.io/control-atlas/`

## Verdict

**Correction required before the current information architecture, Atlas, or Resources experience should be called complete.**

Control Atlas is already a useful public reference workbench. Home, Catalog, Compare, Learn, Start Here, Sources, and individual record explanations demonstrate the intended translation-first product. The shipped app is stable enough to navigate and the narrow live smoke suite passes.

The product is not yet coherent from shallow to deep. Its most important hierarchy can present a cross-framework correlation as structural ancestry; Atlas mixes structure, applicability, implementation, and correlation in a single path model; an exact Atlas search can do nothing; Explore names two different destinations; and the 96-item Resources collection is introduced as “Community resources” and buried behind trust lanes and twelve collections. These are systemic product-model problems, not cosmetic defects.

## Authority and method

The audit treated these sources as authoritative, in order:

1. [PRD](../PRD.md), especially the active v3 product purpose and requirements.
2. [Plan](../Plan.md) for delivery claims, independently verified here.
3. [Canonical tree model](../tree-model.md), which explicitly owns hierarchy and relationship semantics.
4. [Current sprint handoff](../plans/sprint-handoff-2026-07-26.md) and [W2 and ship plan](../plans/w2-and-ship-2026-07-27.md) for approved naming and recent interaction direction.
5. [Design principles](../DESIGN_PRINCIPLES.md), [translation-first design](../design/translation-first-design.md), and [Orbital Archive design system](../design/design-system.md).
6. [Architecture](../architecture/ARCHITECTURE.md), [federal source policy](../FEDERAL_SOURCE_POLICY.md), and [Control Commons guide](../COMMONS_GUIDE.md).

Evidence gathered:

- Complete route, layout, navigation, data-model, responsive-state, and user-state inspection in `src/`, `data/`, and `tests/`.
- Live walkthrough of every meaningful shipped route and the principal user workflows at 375×812, 768×1024, and 1440×900.
- Focused interaction checks for menu focus return, search/no-result behavior, Atlas drill-down, record ancestry, Compare, Build, Resources, and Start Here.
- `npm run test:browser`: 17/17 passed.
- Focused contracts for accessibility, resource search, and Commons presentation: 27/27 passed.
- Shipped `live-smoke.spec.mjs`: 3/3 passed in 12.2 seconds, including deployed cache/source agreement.

Proof limits:

- The browser screenshot facility failed twice, once after target closure and once on timeout. The visual assessment therefore uses the live accessibility tree, DOM measurements, interaction state, repository styling, and existing automated visual contracts—not a new screenshot packet.
- The full live E2E suite timed out in its first accessibility case. That is an inconclusive test-run failure, not an accessibility violation.
- Automated axe checks cover serious/critical WCAG A/AA violations. They do not replace the repository’s required human screen-reader, keyboard, 200% zoom, or cognitive-usability checks.
- Template download was not exercised because it would write outside the repository. The preview, parameters, attribution, and download affordance were inspected.

## Executive assessment

### What is working

- Home gives three useful entry jobs: trace a framework, follow RMF, or start from a situation.
- Catalog makes 23 official catalogues understandable through plain-language grouping, descriptions, counts, versions, and official sources.
- Universal search explains records in practitioner language and provides a proper no-result recovery state.
- Compare turns a difficult graph operation into five recognizable intents and produces usable summaries, groupings, and traceable mappings.
- Learn guides are structured around purpose, action, basis, limits, and next steps.
- Start Here asks only three questions, provides a cautious recommendation, and states that the result is a starting reference rather than a determination.
- Sources clearly separates provenance from practitioner resources.
- Record pages contain strong plain-language summaries, relationship groups, source support, and next actions.
- The mobile shell avoids document-level horizontal overflow; the menu is keyboard dismissible and returns focus correctly.
- Loading, empty, error, and retry patterns exist across the principal data surfaces.

### What is not working

- Structural truth is not protected. An AC-2 record displayed `CSF 2.0 > SP 800-53 > AC > AC-2` as “Where this sits,” even though CSF is a correlation, not an ancestor.
- Atlas does not consistently distinguish structural hierarchy, baseline applicability, lifecycle/process, enhancements, implementation guidance, and correlations.
- Atlas exact-ID search can leave the user on the unchanged start screen.
- “Explore” is both the Atlas destination and the eyebrow/path for a different universal-search route.
- Resources is named and sequenced as if it were primarily community content, although 83 of 96 records are official or open-source and the dataset already supports clearer human-centred categories.
- A zero-match Resources query still returns 20 editorially recommended results.
- Build task selection, some context labels, and some share links do not round-trip through URL, refresh, or back navigation.
- Tablet resource lanes and mobile Compare rely on horizontally hidden content where a reflowed, progressive alternative is needed.

### Root causes

1. **Display hierarchy is derived from permissive graph edges instead of a protected structural contract.**
2. **One visual/path model is being asked to represent several relationship classes and user jobs.**
3. **Historical route and label changes were layered rather than migrated to one canonical vocabulary.**
4. **Resources ranking, trust, type, task, and lifecycle concepts are mixed in one landing sequence.**
5. **URL state and display-name normalization are not treated as product contracts across all sections.**
6. **Automated coverage proves rendering and selected contracts, but misses semantic truth and several real-user transitions.**

### Highest-risk failures

| Risk | Why it matters |
|---|---|
| False structural ancestry | The product can teach an incorrect framework hierarchy, undermining its central promise of traceable rigor. |
| Atlas semantic conflation | Users cannot tell whether an item is a parent, applicability choice, implementation aid, evidence link, or crosswalk. |
| Atlas search no-op | A primary control accepts a valid identifier but provides no feedback or navigation. |
| Resources false-positive search | Users cannot distinguish a genuine match from editorial promotion, and no-result recovery is unavailable. |
| Explore/Search identity collision | Navigation labels, URLs, current-section state, and user expectations disagree. |

## Route and workflow inventory

Severity is the highest observed issue on the route: Critical, High, Medium, Low, or None.

| Route or workflow | Intended purpose | Observed result | Severity | Disposition |
|---|---|---|---|---|
| `#/` | Orient and route by user intent | Strong three-path start, search, trust boundary, and section shortcuts | Low | Keep; reduce secondary-path competition only after global IA migration |
| Home search → `#/explore?q=` | Search all records | Works, explains AC-2 plainly, and handles no results | High | Move canonical search to `#/search`; preserve query compatibility |
| `#/atlas-map` | Guided Atlas exploration | Useful NIST and RMF drills, but one framework is hard-coded, baseline appears in the path spine, and exact search can no-op | High | Make canonical Explore; rebuild around protected hierarchy and explicit lenses |
| `#/atlas-map?node=…` | Focused relationship exploration | Path/Map/List exist, but default stages conflate relationship types and misclassify enhancements | High | Replace default semantic model; retain bounded Map and accessible List |
| `#/explore` | Universal search and filtering | Functional, but called Explore and can show Catalog as current global section | High | Canonicalize as `#/search` |
| `#/catalog` | Browse official frameworks and rules | Clear grouping, descriptions, and counts | Low | Keep; align context labels and titles |
| `#/catalog/:id` | Understand one catalogue and enter its hierarchy | Strong overview, families, source, and contextual resources; raw IDs leak into context | Medium | Keep; normalize context and recommendations |
| `#/record/:catalog/:id` | Explain one object and its relationships | Strong explanation; structural breadcrumb can be false and dense relationships precede meaning | Critical | Repair ancestry contract and record disclosure order |
| `#/compare` | Select a comparison job | Clear five-intent hub | Low | Keep |
| Configured Compare | Inspect mappings and gaps | Strong desktop core; 737-map example was usable, but mobile table requires internal horizontal scrolling | Medium | Add mobile result presentation without weakening desktop table |
| `#/learn` | Find practitioner guidance | Clear categories, search, and recommendations | Low | Keep |
| Learn guide detail | Turn guidance into action | Useful purpose, steps, controls, basis, limits, and next action; stale “playbooks” and “Atlas” labels remain | Medium | Normalize vocabulary and route destinations |
| `#/build` | Choose a practical task or artifact | Useful task cards and previews; selected task is local state and not bookmarkable | Medium | Add Build-local IA and durable task routes |
| Build template workflow | Configure and download a starter tied to named official references | Preview, parameters, source metadata, and disclaimer are present | Low | Keep; add route/state contracts and download test in an approved temp target |
| `#/build/community` | Find external resources | Contains all 96 resources but is named Community, starts with trust lanes and 12 collections, and hides type categories behind “browse all” | High | Replace with Resources directory under Build |
| Resource search/filter | Find a specific external resource | Valid queries work; a nonsense query returns 20 recommendations | High | Separate match eligibility from ranking |
| `#/build/community-detail?id=…` | Evaluate one external resource | Useful why-included and metadata; title, badge description, lifecycle, and share URL are inaccurate or generic | Medium | Move to canonical path-segment detail route and repair metadata |
| `#/sources` | Inspect provenance and freshness | Clear source inventory and separation from Resources | Low | Keep |
| `#/start` | Get a cautious starting path | Three-question flow and caveat work; inheritance wording can overstate what comparison proves | Medium | Tighten determination boundary |
| `#/about` | State scope and product boundary | Clear and credible | None | Keep |
| Global header | Move among five product sections | Compact and functional; Explore destination conflicts with search route vocabulary | High | Migrate with canonical route/name contract |
| Global search / Ctrl+K | Reach records quickly | Useful utility entry | Medium | Make `/search` the durable destination and keep overlay as accelerator |
| Mobile menu | Expose global navigation | Opens as a dialog, Escape closes it, focus returns, and targets meet size expectations | None | Keep |
| Context rail | Show location and scope | Frequently exposes raw values such as `all`, `relationships`, `nist-800-53`, and `security_plan_starter` | Medium | Resolve all state through a display-name registry |
| `#/menu` | Legacy all-sections page | Deep-linkable but has no current entry and uses stale structure | Medium | Retire with a tested alias or intentionally expose; do not leave liminal |
| Retired-route handler | Recover old links | Compatibility mechanism exists | Low | Consolidate all route migrations here and test query preservation |
| Unknown route | Recover from bad links | Clear not-found state and routes back to useful surfaces | None | Keep |

## Findings register

### CA-IA-001 — Explore and Search have conflicting identities

- **Affected:** global navigation, `#/atlas-map`, `#/explore`, route state, current-section highlighting.
- **Evidence:** global Explore opens Atlas, while `#/explore` renders “Search everything in one place” with an Explore eyebrow and can mark Catalog current. `browse` also serializes to the search path.
- **Violated requirement:** plain language first; stable destination naming; current handoff’s approved Explore job.
- **User impact:** users cannot predict where Explore goes, communicate a route reliably, or build a stable mental model.
- **Severity:** High.
- **Recommended correction:** make `#/explore` the canonical Atlas destination and `#/search` the canonical universal search; preserve query-bearing legacy links during migration.
- **Dependencies:** hash-route parser, global nav, search entry points, redirects, analytics/test selectors.
- **Acceptance criteria:** every visible “Explore” opens the same experience; every visible “Search” opens `/search`; refresh/back preserve state; old `/atlas-map` and query-bearing old `/explore` links resolve without data loss.

### CA-IA-002 — Context surfaces expose implementation vocabulary

- **Affected:** context rail and document titles across Catalog, records, Compare, Build, and Resources.
- **Evidence:** live context values included `all`, `relationships`, `nist-800-53`, and `security_plan_starter`; resource detail retained the generic “Control Atlas” document title.
- **Violated requirement:** design-system depth/context contract; translation-first principle; “What is this?” must be immediately answerable.
- **User impact:** internal enum and slug knowledge leaks into the interface and degrades orientation, history, bookmarks, and assistive-technology announcements.
- **Severity:** Medium.
- **Recommended correction:** central display-name and route-title registry using resolved entities and user-facing task names.
- **Dependencies:** route model, entity loaders, title hook.
- **Acceptance criteria:** no user-facing context or title contains an unexplained raw enum/slug; route-title tests cover every inventory route.

### CA-NAV-003 — Build selection is not durable navigation state

- **Affected:** Build workflow cards and template configuration.
- **Evidence:** choosing “Build an authorization package” changed the page but left `#/build` unchanged; implementation holds `selectedWorkflowId` in component state.
- **Violated requirement:** shallow-to-deep navigation must be shareable and recoverable.
- **User impact:** refresh, back, duplicate-tab, and shared-link behavior loses the chosen task.
- **Severity:** Medium.
- **Recommended correction:** give tasks and documents canonical routes, with URL-backed parameters and validation.
- **Dependencies:** Build-local IA, route migration, template parameter schema.
- **Acceptance criteria:** selected task, document, framework, and format survive refresh and back/forward; invalid parameters recover without discarding valid ones.

### CA-NAV-004 — Legacy routes and links are liminal

- **Affected:** `menu`, `browse`, resource “Copy link,” aliases.
- **Evidence:** `#/menu` is routable but unreachable and stale; `browse` is not round-trippable; resource copy emits legacy `#/commons-detail` instead of the live canonical detail route.
- **Violated requirement:** one maintained navigation contract; delete or migrate obsolete code.
- **User impact:** shared links, tests, and future changes can diverge from visible navigation.
- **Severity:** Medium.
- **Recommended correction:** publish a versioned alias table, canonicalize copied URLs, and retire or intentionally expose each legacy state.
- **Dependencies:** CA-IA-001 and Resources route migration.
- **Acceptance criteria:** every supported legacy URL has one tested canonical destination; generated links are canonical; no unreachable page remains without an explicit compatibility purpose.

### CA-ATL-001 — Cross-framework correlation is displayed as ancestry

- **Affected:** record “Where this sits,” ancestor-path derivation.
- **Evidence:** AC-2 displayed `CSF 2.0 Catalog > SP 800-53 Rev. 5 Catalog > AC Access Control Family > AC-2`. The canonical tree model says correlations are sideways and only structural relations may form ancestry.
- **Violated requirement:** publisher-defined hierarchy must be separate from interpretation; “a tree for hierarchy, a graph for relationships”; structural parentage contract.
- **User impact:** the product can teach a false hierarchy and make subsequent navigation and decisions untrustworthy.
- **Severity:** Critical.
- **Recommended correction:** build ancestry only from validated structural edges within an allowed structural domain; render cross-framework links in a separate correlation group.
- **Dependencies:** graph-build relationship classification, ancestor-path API, data integrity tests.
- **Acceptance criteria:** no cross-framework or applicability edge can enter a breadcrumb; all displayed parent chains match canonical source hierarchy; AC-2’s chain begins with SP 800-53, not CSF.

### CA-ATL-002 — A baseline filter is presented as a parent step

- **Affected:** guided framework drill-down and “Where this sits.”
- **Evidence:** the live chain showed `Atlas > NIST SP 800-53 > MODERATE > FAMILY-AC`.
- **Violated requirement:** canonical tree model defines baselines as applicability overlays, never parents.
- **User impact:** users infer that a family or control belongs structurally to one baseline rather than being selected by one or more baselines.
- **Severity:** High.
- **Recommended correction:** label the sequence “Your choices,” keep the true structural path separate, and show baseline as an applicability filter/chip.
- **Dependencies:** Atlas path-state model and CA-ATL-001.
- **Acceptance criteria:** baselines never appear in structural breadcrumbs; changing a baseline filters selection without changing parentage.

### CA-ATL-003 — Exact Atlas search can silently do nothing

- **Affected:** Atlas landing search.
- **Evidence:** entering `AC-2` and activating Search left the URL and start cards unchanged with no error or result.
- **Violated requirement:** make action obvious; all controls must provide perceivable feedback.
- **User impact:** users conclude the record is absent or the product is broken.
- **Severity:** High.
- **Recommended correction:** exact identifiers open focused Explore; ambiguous text opens Search results; no-match produces a clear recovery state.
- **Dependencies:** canonical Search route and Atlas state parser.
- **Acceptance criteria:** exact, fuzzy, and no-match cases each have deterministic, tested destinations and announcements.

### CA-ATL-004 — Atlas Path conflates relationship classes

- **Affected:** focused Atlas Path stages and node classification.
- **Evidence:** AC-2 enhancements appeared under “Implementation”; baselines and cross-framework material can appear under “Requirement”; stages mix native node type, lifecycle role, and relationship class.
- **Violated requirement:** structural, applicability, and correlation classes must remain distinct; shallow-to-deep disclosure.
- **User impact:** users cannot tell what a connection means or which direction to follow.
- **Severity:** High.
- **Recommended correction:** make true structural position the first view, then group connections by explicit relationship class and user lens; do not infer primary meaning from a hard-coded catalogue bucket.
- **Dependencies:** relationship metadata, Atlas view model, CA-ATL-001.
- **Acceptance criteria:** every displayed connection names its relationship; enhancements remain children/twigs; applicability and correlations never masquerade as structure.

### CA-ATL-005 — Framework exploration starts as a single-catalog wizard

- **Affected:** Atlas landing framework path.
- **Evidence:** choosing “Trace a framework” immediately selects NIST SP 800-53 although Catalog contains 23 catalogues.
- **Violated requirement:** Atlas should support broad-to-specific exploration without pretending one framework is the whole Atlas.
- **User impact:** users looking for CSF, SP 800-171, CMMC, DISA, MITRE, or other structures cannot discover the proper entry path.
- **Severity:** High.
- **Recommended correction:** offer a small, purposeful framework selector grouped by navigable hierarchy; keep unsupported/flat catalogues in Catalog or relationship lenses.
- **Dependencies:** catalogue capability metadata and Atlas structural model.
- **Acceptance criteria:** the first choice explains available hierarchy types; every offered framework supports a meaningful next step; no dead-end catalogue is advertised as hierarchical.

### CA-ATL-006 — Atlas does not state the job of Path, Map, and List

- **Affected:** focused Atlas mode switch and empty stages.
- **Evidence:** Path defaults to purpose stages rather than the selected object’s true path; Map and List expose the same graph without a concise job statement; Evidence and Decision can appear as disabled empty stages.
- **Violated requirement:** each feature must explain what it is, why it matters, and what to do with it.
- **User impact:** users switch representations without understanding what question each answers.
- **Severity:** Medium.
- **Recommended correction:** define Path as guided connections, Map as bounded local topology, and List as accessible exhaustive results; show true structural position before modes.
- **Dependencies:** CA-ATL-004 and copy/content update.
- **Acceptance criteria:** each mode has one sentence of purpose, preserves the same filter scope, and provides a useful empty state rather than a silent disabled stage.

### CA-RES-001 — The Resources directory is misnamed “Community resources”

- **Affected:** `#/build/community`, contextual recommendation headings, resource detail paths.
- **Evidence:** the dataset contains 96 items: 50 official, 32 open-source, 7 practitioner, 3 commercial, and 4 legacy. Only five records are community forums.
- **Violated requirement:** ordinary practitioners should understand categories immediately; technical taxonomy should not be the product name.
- **User impact:** users seeking official sources, tools, datasets, or templates may not enter the section; “community” overpromises discussion content.
- **Severity:** High.
- **Recommended correction:** rename the section Resources and model it as a directory/catalogue inside Build.
- **Dependencies:** global terminology and route migration.
- **Acceptance criteria:** all entry points say Resources; page purpose enumerates tools, templates, communities, training, and reference material without conflating them with Sources.

### CA-RES-002 — Trust lanes and collections bury the primary browse model

- **Affected:** Resources landing hierarchy at desktop, tablet, and mobile.
- **Evidence:** users encounter six trust lanes and twelve large starter collections before “browse all 96”; only then do clear groups appear: Rules and policy (17), Catalogs and data (26), Templates and starters (8), Tools and automation (33), Communities and training (6), Reference and history (6).
- **Violated requirement:** progressive disclosure and human-centred top-level groupings.
- **User impact:** users must understand an internal editorial model or scroll through large curated sets before browsing by recognizable need.
- **Severity:** High.
- **Recommended correction:** promote the six existing human categories to primary browse; make trust lane a facet/badge and collections optional curated kits.
- **Dependencies:** resource taxonomy validation and Resources page model.
- **Acceptance criteria:** all six categories are visible before collections; each record has one primary category; lane remains independently filterable.

### CA-RES-003 — Resource search returns recommendations with no lexical match

- **Affected:** Resources search and no-result state.
- **Evidence:** query `zzzzqqqq` changed the URL but returned 20 of 96 recommended items. Ranking gives every editorial recommendation a positive score before match eligibility is determined.
- **Violated requirement:** query-match evidence and editorial interpretation must be separate.
- **User impact:** users cannot trust search and cannot reach a no-result recovery state.
- **Severity:** High.
- **Recommended correction:** determine semantic eligibility first, then apply editorial ranking only within eligible results.
- **Dependencies:** resource search scoring and tests.
- **Acceptance criteria:** a nonsense query returns zero results and recovery guidance; editorial recommendations never create eligibility; matched terms/reason are explainable.

### CA-RES-004 — Lifecycle metadata is not discriminating

- **Affected:** Resources lifecycle facets and detail metadata.
- **Evidence:** all 96 resources carry both Implement and Assess, including forums, policy, tools, and historical references.
- **Violated requirement:** filters must help users reduce a set and metadata must remain meaningful.
- **User impact:** the facet appears authoritative but cannot narrow results and may misstate a resource’s role.
- **Severity:** Medium.
- **Recommended correction:** remove the facet until records are reclassified from an explicit controlled vocabulary; permit unknown/not-applicable.
- **Dependencies:** schema update, editorial migration, validation report.
- **Acceptance criteria:** every visible facet changes the result set for at least one supported query; lifecycle values are evidence-backed and are not required when inapplicable.

### CA-RES-005 — Contextual resource recommendations are not traceable

- **Affected:** record, catalogue, guide, and resource recommendation modules.
- **Evidence:** graph entities and Resources use separate datasets; recommendations are keyword/context ranked rather than typed relationships, yet appear as contextual modules.
- **Violated requirement:** preserve rigor and traceability; separate explicit curated links from derived recommendations.
- **User impact:** users cannot tell why a resource is relevant or whether the relationship is curated, derived, or merely lexical.
- **Severity:** Medium.
- **Recommended correction:** add versioned contextual-link records with target entity, relationship/reason, provenance, and review state; label derived suggestions explicitly.
- **Dependencies:** additive resource schema and editorial tooling.
- **Acceptance criteria:** each contextual recommendation displays a concise “recommended because” reason and provenance; derived matches are distinguishable from curated links.

### CA-RES-006 — Resource detail metadata and sharing are inconsistent

- **Affected:** resource lane badge, detail title, lifecycle display, Copy Link.
- **Evidence:** Reddit NISTControls was announced as “Practitioner Knowledge / Template” although its type is `community_forum`; copied links use a legacy route; the document title is generic.
- **Violated requirement:** plain, accurate terminology and canonical navigation.
- **User impact:** assistive-technology users receive wrong type information, bookmarks are weak, and shared URLs encode obsolete structure.
- **Severity:** Medium.
- **Recommended correction:** derive badge descriptions from actual type, use canonical path-segment routes, and set entity-specific titles.
- **Dependencies:** CA-RES-001, route-title registry.
- **Acceptance criteria:** visual and accessible labels agree with data; copied link reloads the same resource at its canonical route; title includes resource name.

### CA-REC-001 — Record disclosure begins with graph density before meaning

- **Affected:** record-page ordering and relationship strip.
- **Evidence:** location, actions, and a dense relationship-class strip can precede “What this is,” despite the canonical record anatomy putting plain explanation first.
- **Violated requirement:** shallow-to-deep disclosure; plain language first.
- **User impact:** newcomers encounter counts and graph vocabulary before they know why the record matters.
- **Severity:** Medium.
- **Recommended correction:** order records as meaning → true structural position → why it matters → actions → grouped connections → sources/resources.
- **Dependencies:** CA-ATL-001 and shared record layout.
- **Acceptance criteria:** the first viewport answers what the object is and why it matters; dense relationship groups are collapsible and remain keyboard accessible.

### CA-BLD-001 — Build mixes tasks, documents, tools, and resources without local IA

- **Affected:** Build landing and Resources entry.
- **Evidence:** ten task cards, document generation, artifacts, tools, and the resource directory share one destination without persistent section navigation.
- **Violated requirement:** show the connection and make the next action obvious.
- **User impact:** users must return to the hub and reinterpret the mixed card set to move between adjacent Build jobs.
- **Severity:** Medium.
- **Recommended correction:** retain Build globally and add a local hierarchy: Tasks, Starter documents, Resources.
- **Dependencies:** Build route migration and Resources rename.
- **Acceptance criteria:** every Build subpage exposes the local hierarchy and current position; task and document states are linkable.

### CA-BLD-002 — Start Here can imply that mapping proves inheritance

- **Affected:** FedRAMP recommendation copy.
- **Evidence:** the result suggests comparing against NIST to see which controls can be inherited, while mapping alone does not establish inheritance.
- **Violated requirement:** simplification must remain accurate; no determination should be implied.
- **User impact:** practitioners may treat a crosswalk as authorization evidence.
- **Severity:** Medium.
- **Recommended correction:** state that comparison identifies candidate overlaps to validate with the provider, system boundary, and authorizing context.
- **Dependencies:** content review only.
- **Acceptance criteria:** recommendation preserves usefulness while explicitly separating candidate mapping from inherited-control determination.

### CA-RESP-001 — Important responsive content is hidden in horizontal scrollers

- **Affected:** Compare results at 375px and Resources lanes near 768px.
- **Evidence:** the Compare table was 672px inside a 299px viewport; Resources lane controls were 1041px inside a 674px scroller.
- **Violated requirement:** responsive usability at 375/768/1440 and 200% zoom; primary choices should be discoverable.
- **User impact:** columns and filters are off-screen without a strong cue, increasing cognitive and motor effort.
- **Severity:** Medium.
- **Recommended correction:** use a mobile comparison-card/definition-list view and a wrapping or overflow-labelled filter control; preserve the desktop table.
- **Dependencies:** Compare presentation and Resources IA.
- **Acceptance criteria:** no primary choice or result meaning requires unannounced horizontal scrolling at 375px, 768px, or 200% zoom.

### CA-A11Y-001 — Current accessibility evidence is incomplete

- **Affected:** release claim across all interactive routes.
- **Evidence:** contracts and automated axe checks exist, but current human NVDA/VoiceOver, full keyboard, 200% zoom, and cognitive walkthrough evidence was not available; the broad live suite timed out.
- **Violated requirement:** repository manual accessibility checklist and release-quality proof.
- **User impact:** semantic, announcement, focus-order, and zoom failures could remain despite automated passes.
- **Severity:** Medium residual risk.
- **Recommended correction:** run and record the manual matrix after corrections, with named browser/screen-reader versions and route coverage.
- **Dependencies:** correction epics complete; stable deployed candidate.
- **Acceptance criteria:** the manual checklist is signed with evidence for 375/768/1440, 200% zoom, keyboard-only, reduced motion, NVDA or VoiceOver, errors, and dynamic announcements.

### CA-UI-001 — Historical terminology remains visible

- **Affected:** Learn detail, Build, resource code paths, and user-facing links.
- **Evidence:** “playbooks,” “templates,” “Commons,” “Community resources,” and “Open in Atlas” coexist with Learn, Build, Resources, and Explore.
- **Violated requirement:** recent approved guidance is authoritative over stale implementation names.
- **User impact:** users must learn multiple words for the same destination or misunderstand a destination’s breadth.
- **Severity:** Medium.
- **Recommended correction:** adopt the terminology registry in the correction specification and remove stale display strings while retaining compatibility aliases only in code.
- **Dependencies:** CA-IA-001, CA-RES-001, route-title registry.
- **Acceptance criteria:** automated copy inventory finds no unapproved visible term; aliases never appear as user-facing labels.

### CA-TEST-001 — Semantic truth is not covered by the current release gates

- **Affected:** graph integrity, Atlas transitions, Resources eligibility, URL state, and live suite.
- **Evidence:** focused suites pass while the live product still shows false ancestry, Atlas search no-op, and false-positive Resources results.
- **Violated requirement:** tests must prove the promised purpose, not only rendering.
- **User impact:** regressions can ship behind green checks.
- **Severity:** High.
- **Recommended correction:** add graph invariants and focused interaction contracts before visual/E2E loops; split the live suite into bounded route groups.
- **Dependencies:** all P0 corrections.
- **Acceptance criteria:** each Critical/High finding has a fast failing-before/passing-after test; live route groups complete independently with useful failure artifacts.

## Overall product disposition

- **Keep and strengthen:** Home, Catalog, Compare, Learn, Sources, Start Here, record explanations, HashRouter/static deployment, MiniSearch, current source boundary, and Path/Map/List as representation options.
- **Reorganize systemically:** global Explore/Search naming, Build-local navigation, Resources catalogue, route/title/context state.
- **Replace the faulty model, not the technology:** ancestry derivation and Atlas relationship staging.
- **Do not add a new framework, graph engine, router, backend, or content corpus to solve these findings.**

The approved correction design, backlog, and execution prompt are in the companion documents:

- [Correction specification](../planning/control-atlas-correction-spec-2026-07-27.md)
- [Prioritized correction backlog](../planning/control-atlas-correction-backlog-2026-07-27.md)
- [Follow-on Codex execution prompt](../planning/control-atlas-correction-execution-prompt-2026-07-27.md)
