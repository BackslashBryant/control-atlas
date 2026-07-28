# Control Atlas prioritized correction backlog

Date: 2026-07-27  
Status: v1.0.1 local closeout candidate complete; deployed proof and release publication execution-gated
Audit: [Current-state audit](../audits/control-atlas-current-state-audit-2026-07-27.md)  
Specification: [Correction specification](control-atlas-correction-spec-2026-07-27.md)

## Delivery rules

- Deliver one epic at a time on a branch.
- Establish the cheapest faithful unit/contract test before browser loops.
- No production stubs, parallel taxonomies, or temporary false hierarchy.
- Each epic must leave legacy URLs recoverable until its migration acceptance criteria pass.
- Do not change the technology stack unless a new, evidenced blocker is approved.
- Do not call an epic complete while a Critical/High finding assigned to it remains.

## Priority order

1. Epic 1 — Structural truth and Atlas correctness.
2. Epic 2 — Navigation and route identity.
3. Epic 3 — Resources directory.
4. Epic 4 — Record and Build progressive disclosure.
5. Epic 5 — Responsive and accessibility completion.
6. Epic 7 — Regression, deployment proof, and compatibility closeout.

## Epic 1 — Structural truth and Atlas correctness

Priority: P0  
Risk: High, because it changes graph interpretation and the central exploration model.

**Status (2026-07-27): Complete locally.** Features 1.1-1.5 and milestone M1
"Truthful core" passed focused graph/runtime contracts and responsive browser
verification at 375, 768, and 1440 pixels. Graph health contains zero invalid
structural-parent findings. No push, merge, deploy, tag, or release was
performed.

### Feature 1.1 — Enforce the structural-parent contract

- **Priority:** P0.
- **Risk level:** High — graph interpretation and every derived breadcrumb depend on it.
- **Scope:** graph generation/normalization, relationship classes, ancestor path.
- **Affected systems:** graph build/schema code, `src/ui/lib/ancestorPath.ts`, graph-health output, record breadcrumbs.
- **Dependencies:** canonical `docs/tree-model.md`; no UI dependency.
- **Implementation guidance:** permit only declared structural edges in ancestry; remain within the native structural domain; fail closed when no validated path exists; report rejected candidate parents.
- **Acceptance criteria:** AC-2 never has CSF as an ancestor; baselines, mappings, Resources, evidence, and implementation aids cannot enter any structural breadcrumb; graph health reports zero invalid structural parents.
- **Verification:** unit/property tests over the graph plus representative hierarchy fixtures; record-page E2E for AC-2 and at least one object from each hierarchical catalogue.

### Feature 1.2 — Separate user choices from structural position

- **Priority:** P0.
- **Risk level:** Medium — presentation and state must change without losing user scope.
- **Scope:** guided Explore chain, baseline selection, context copy.
- **Affected systems:** `AtlasMapPage.tsx`, Atlas state/view model, breadcrumb/context components.
- **Dependencies:** Feature 1.1.
- **Implementation guidance:** render navigation/filter decisions as “Your choices”; render “Where this sits” only from Feature 1.1.
- **Acceptance criteria:** Moderate baseline appears as applicability/choice, not a parent; changing baseline preserves native parentage.
- **Verification:** reducer/serialization tests and framework-path Playwright flow.

### Feature 1.3 — Repair Atlas search transitions

- **Priority:** P0.
- **Risk level:** Medium — search transitions cross Atlas and canonical Search state.
- **Scope:** exact-ID, ambiguous-text, no-match, loading/error behavior.
- **Affected systems:** Atlas landing search, route-state parser, canonical Search handoff.
- **Dependencies:** Epic 2 route names can be feature-flagged or landed in the same branch.
- **Implementation guidance:** exact ID focuses the record; ambiguous text opens Search; no match stays with explicit recovery; announce the result.
- **Acceptance criteria:** AC-2 opens focused Explore; a broad term opens query results; nonsense text shows zero-match guidance; URL and focus update correctly.
- **Verification:** fast transition tests plus three focused browser cases.

### Feature 1.4 — Replace purpose-stage classification with explicit lenses

- **Priority:** P0.
- **Risk level:** High — this replaces the primary semantic grouping in focused Atlas.
- **Scope:** focused Explore Path/Map/List data model and copy.
- **Affected systems:** `src/ui/lib/atlasModel.ts`, Atlas components, legends, relationship filters.
- **Dependencies:** Feature 1.1 and validated relationship metadata.
- **Implementation guidance:** show structural position first; group connections by relationship class and user lens; retain native type; make all modes operate on the same filtered set.
- **Acceptance criteria:** enhancements remain structural children; applicability, implementation, assessment/evidence, process/artifact, cross-framework, and threat relationships are distinguishable; mode counts agree.
- **Verification:** view-model fixtures, accessibility-tree assertions, and bounded Atlas E2E.

### Feature 1.5 — Add a supported framework selector

- **Priority:** P1.
- **Risk level:** Medium — capability metadata must prevent unsupported navigation paths.
- **Scope:** Explore’s “Trace a framework” entry.
- **Affected systems:** Atlas landing, catalogue capability metadata.
- **Dependencies:** Features 1.1 and 1.4.
- **Implementation guidance:** offer only catalogues with validated navigable hierarchy; keep each decision to four or fewer options through grouping.
- **Acceptance criteria:** SP 800-53 is not auto-selected; offered catalogues all produce a meaningful next step; flat datasets route to Catalog/Compare instead of a fake hierarchy.
- **Verification:** metadata contract and one workflow per hierarchy group.

## Epic 2 — Navigation and route identity

Priority: P0/P1  
Risk: Medium, because compatibility mistakes can break saved links.

**Status (2026-07-27): Complete locally.** Features 2.1-2.3 and milestone M2
passed route-matrix, browser-contract, static build, accessibility-smoke, and
navigation-smoke verification. `/explore`, `/search`, and `/build/resources`
are canonical. On 2026-07-28, the owner directed retirement of the legacy
route aliases: those paths now resolve to the honest not-found state rather
than redirecting. The pre-hash query-state adapter remains because it preserves
persisted application state, not a retired route. No push, merge, deploy, tag,
or release was performed.

### Feature 2.1 — Canonicalize Explore and Search

- **Priority:** P0.
- **Risk level:** High — saved links and current-section state can break during migration.
- **Scope:** route table, primary nav, header search, Home links, current-section state.
- **Affected systems:** `App.tsx`, `hashRoutes.ts`, `viewState.ts`, Search/Explore pages, tests.
- **Dependencies:** owner approval of route migration; coordinate with Feature 1.3.
- **Implementation guidance:** `/explore` becomes guided Explore and `/search` becomes universal search; generated links are canonical. Retired route aliases do not transfer state into a different route.
- **Acceptance criteria:** visible labels and destinations are one-to-one; canonical queries and focused-node links retain state; generated links are canonical.
- **Verification:** route round-trip matrix plus history/back/refresh E2E.

### Feature 2.2 — Add one title and display-name registry

- **Priority:** P1.
- **Risk level:** Low — shared resolution must handle unloaded or invalid entities safely.
- **Scope:** document titles, context rail, breadcrumbs, analytics labels.
- **Affected systems:** App shell and entity/task label resolvers.
- **Dependencies:** Feature 2.1.
- **Implementation guidance:** resolve user-facing labels from known entities and approved vocabulary; raw slugs are fallback diagnostics only.
- **Acceptance criteria:** inventory-route test finds no unexplained enum/slug; detail titles include entity name.
- **Verification:** parameterized title/context tests across every route.

### Feature 2.3 — Close legacy navigation states

- **Priority:** P1.
- **Risk level:** Medium — premature alias removal could break external bookmarks.
- **Scope:** `/menu`, `browse`, old Commons routes, copied links.
- **Affected systems:** route aliases, retired-route page, share-link helper.
- **Dependencies:** Features 2.1 and 3.1.
- **Implementation guidance:** aliases were retired by owner direction; preserve an explicit not-found state and do not generate legacy routes. Keep the pre-hash query-state adapter separate from route aliases.
- **Acceptance criteria:** every retired alias stops at not-found; no visible action generates a legacy route; `/menu` is retired.
- **Verification:** alias-retirement contract and deployed static-404 smoke.

## Epic 3 — Resources directory

Priority: P1, with search correction treated as P0 bug work  
Risk: Medium, because taxonomy migration touches all 96 records and contextual modules.

**Status (2026-07-27): Complete locally.** Features 3.1-3.5 and milestone M3
passed focused category/search/provenance and route contracts, Commons history
E2E, static build, and a 375/768/1440 local browser walkthrough. Shared
navigation is one continuous primary path; related resources are supporting
context, not a second navigation layer. The six
existing type-derived categories reconcile all 96 resources; contextual
recommendations are derived from existing metadata and cannot be structural
graph children. No push, merge, deploy, tag, or release was performed.

### Feature 3.1 — Establish Resources page identity and routes

- **Priority:** P1.
- **Risk level:** Medium — terminology and route changes affect every resource entry point.
- **Scope:** rename Community resources/Commons, Build-local entry, canonical list/detail routes.
- **Affected systems:** Commons pages/components, App routes/nav, recommendation headings, tests.
- **Dependencies:** owner approval of name and Epic 2 aliases.
- **Implementation guidance:** user-facing Resources; internal module rename is optional until useful.
- **Acceptance criteria:** all entry points say Resources; Sources remains distinct; list and detail URLs are canonical and shareable.
- **Verification:** copy inventory, route contracts, list/detail E2E.

### Feature 3.2 — Promote six primary browse categories

- **Priority:** P1.
- **Risk level:** Medium — all 96 records require complete, non-overlapping migration.
- **Scope:** directory landing and resource data.
- **Affected systems:** `data/commons-resource-dataset.json`, schema/validator, Resources page.
- **Dependencies:** owner approval of categories.
- **Implementation guidance:** assign exactly one primary category to every resource; show categories before starter kits; trust lane becomes a facet and badge.
- **Acceptance criteria:** counts reconcile to 96; each record appears in one primary category; category, lane, and type filters compose and round-trip.
- **Verification:** schema/count contract and desktop/mobile browse workflows.

### Feature 3.3 — Fix search eligibility before ranking

- **Priority:** P0.
- **Risk level:** Low — the logic is bounded, but ranking regressions must be prevented.
- **Scope:** resource query scorer, no-result state, match explanation.
- **Affected systems:** `CommonsPage.tsx` search logic and tests.
- **Dependencies:** none; may ship as the first narrow correction after approval.
- **Implementation guidance:** filter eligible matches before editorial boosts; preserve explicit filters.
- **Acceptance criteria:** `zzzzqqqq` returns zero; recommendations never create query eligibility; clearing query restores the prior browse scope.
- **Verification:** focused unit contract and browser no-result test.

### Feature 3.4 — Repair facets and detail metadata

- **Priority:** P1.
- **Risk level:** Medium — schema cleanup can invalidate saved filter state.
- **Scope:** lifecycle values, type labels, lane badges, titles, copy link.
- **Affected systems:** resource dataset, badge/detail components, title/share helpers.
- **Dependencies:** Features 3.1 and 3.2.
- **Implementation guidance:** make lifecycle optional until evidence-backed; derive accessible labels from actual type.
- **Acceptance criteria:** every visible facet can narrow at least one dataset slice; Reddit NISTControls is announced as a community/forum, not a template; copied URL is canonical.
- **Verification:** dataset distribution test and detail-page accessibility assertions.

### Feature 3.5 — Make contextual recommendations traceable

- **Priority:** P1.
- **Risk level:** Medium — additive editorial data needs provenance and maintenance ownership.
- **Scope:** curated and derived resource-to-context links.
- **Affected systems:** additive data schema, recommendation selectors, record/catalogue/guide modules.
- **Dependencies:** Feature 3.2.
- **Implementation guidance:** store target, relation, reason, provenance, and review date; label derived suggestions.
- **Acceptance criteria:** each shown recommendation explains why it is present and whether it is curated or derived; Resources never become structural graph children.
- **Verification:** schema tests, selector fixtures, representative record E2E.

## Epic 4 — Record and Build progressive disclosure

Priority: P1  
Risk: Medium.

### Feature 4.1 — Apply canonical record anatomy

- **Priority:** P1.
- **Risk level:** Medium — shared record layout changes affect dense detail routes.
- **Scope:** record order, relationship disclosure, next actions.
- **Affected systems:** `ObjectDetailPage.tsx` and shared record sections.
- **Dependencies:** Epic 1.
- **Implementation guidance:** meaning and true position first; dense connection groups later and collapsible; retain source traceability.
- **Acceptance criteria:** first viewport answers what/why; relationship counts do not precede explanation; keyboard and direct-link behavior remain intact.
- **Verification:** DOM-order contract, axe, and record workflows at 375/1440.

### Feature 4.2 — Add Build-local navigation

- **Priority:** P1.
- **Risk level:** Medium — local navigation must remain coherent with global Build state.
- **Scope:** Tasks, Starter documents, Resources.
- **Affected systems:** `TemplatesPage.tsx`, Build shell, route model.
- **Dependencies:** Epic 2 and Feature 3.1.
- **Implementation guidance:** use persistent local nav and current-position state; do not add another global top-level destination.
- **Acceptance criteria:** all Build subpages expose the three branches and current branch; back returns to the prior Build scope.
- **Verification:** Build navigation E2E and accessibility roles/state.

### Feature 4.3 — Make task and document state durable

- **Priority:** P1.
- **Risk level:** Medium — invalid or legacy parameters must not corrupt valid configuration.
- **Scope:** task selection and template parameters.
- **Affected systems:** Build routes, `TemplatesPage.tsx`, validation helpers.
- **Dependencies:** Feature 4.2.
- **Implementation guidance:** path for task/document identity; query for validated configuration; preserve valid state when one parameter is invalid.
- **Acceptance criteria:** selection survives reload/history/share; invalid state has a visible recovery message.
- **Verification:** route round-trip tests and one document preview workflow.

### Feature 4.4 — Tighten determination-boundary copy

- **Priority:** P1.
- **Risk level:** Low — the implementation is small, but the product claim is consequential.
- **Scope:** Start Here inheritance wording and any equivalent mapping claims.
- **Affected systems:** Start page/content and copy contracts.
- **Dependencies:** none.
- **Implementation guidance:** describe mappings as candidate overlap requiring validation.
- **Acceptance criteria:** no mapping, crosswalk, or recommendation claims compliance, inheritance, authorization, or assessment outcome.
- **Verification:** prohibited-claim copy test plus human review.

## Epic 5 — Source-first record integrity and legacy cleanup

Priority: P0
Risk: Medium.

### Feature 5.1 — Render official record content without synthetic translation

- **Priority:** P0.
- **Risk level:** High — every record surface must remain useful without implying editorial coverage that does not exist.
- **Scope:** mounted React record detail, catalog rows, Atlas record inspector, record-choice drilldowns, Explore results, and Search results.
- **Affected systems:** `ObjectDetailPage.tsx`, `CatalogDetailPage.tsx`, `AtlasMapPage.tsx`, `atlasDrilldown.ts`, Explore/Search surfaces, runtime search/display adapters, and record-content contracts.
- **Dependencies:** Epic 4 layout and route work.
- **Implementation guidance:** make the default presentation an official title, record type, unmodified official description/excerpt, source, and published relationships. Do not derive or display `What this is`, `What to do`, or `Why it matters` from `plain_language_summary`, first-sentence truncation, title text, or a generic fallback. When a source has no narrative description, say that plainly.
- **Acceptance criteria:** no mounted record UI reads `plain_language_summary` or `plain_action`; source text is visibly distinguished from product navigation; records without a description show an honest absence state; search continues to find title, identifier, and official description.
- **Verification:** schema/display contract that forbids synthetic fields in mounted record components; representative controls, STIG/SRG rules, ATT&CK techniques, assessment procedures, and no-description records at 375/1440.

### Feature 5.2 — Retire the abandoned translation pipeline

- **Priority:** P0.
- **Risk level:** Medium — stale data and fallback generators can silently reintroduce false guidance.
- **Scope:** generated node contract and the removed 800-53 curated translation set.
- **Affected systems:** `scripts/build-framework-data.mjs`, `scripts/lib/plain-language.mjs`, generated-node validation, search indexing, template inputs, and `data/curated/plain-language/controls-800-53.json`.
- **Dependencies:** Feature 5.1.
- **Implementation guidance:** remove the curated override and automatic summary generation from the runtime record contract. Retain official source descriptions for search and export only; do not substitute generated prose when an official description is absent. A future human-authored guidance program requires a separately approved provenance/review schema and is not part of this epic.
- **Acceptance criteria:** a clean build contains no generated record translation/action field; existing templates and search preserve source-backed behavior; deleted curated data cannot be reloaded by the build.
- **Verification:** clean-build fixture, negative test for removed generator/curated path, search/export regression tests, and generated-artifact inspection.

### Feature 5.3 — Label relationship explanation by provenance

- **Priority:** P1.
- **Risk level:** Medium — a useful navigation explanation must not masquerade as an official mapping rationale.
- **Scope:** Atlas inspector, relationship table/graph, and comparison relationship copy.
- **Affected systems:** relationship adapters, `runtimeLoader.ts`, Atlas/Compare components, and provenance tests.
- **Dependencies:** Feature 5.1.
- **Implementation guidance:** present published rationale as such. Present product-authored grouping or navigation notes with a distinct label such as `Navigation note`; never call either a record translation or use it as an applicability conclusion.
- **Acceptance criteria:** every visible relationship explanation declares whether it is published or product-authored; no derived note appears as source text; source references remain reachable.
- **Verification:** fixtures for published rationale, derived navigation note, and absent rationale; DOM/copy contract and keyboard workflow.

### Feature 5.4 — Demote Start Here to a source navigator

- **Priority:** P0.
- **Risk level:** High — a three-question prompt cannot make an applicability, baseline, or authorization recommendation.
- **Scope:** Start Here questions, result framing, defaults, and recommendation tests.
- **Affected systems:** `StartHereResult.tsx`, `startHereRecommendations.mjs`, Start Here fixtures, and copy contracts.
- **Dependencies:** Feature 5.1.
- **Implementation guidance:** retain the user’s stated purpose as a browsing aid, but replace `Your starting point`, default baseline selection, and `Recommended next step` with source categories and questions to take to the governing program. Never infer a system classification, baseline, or path from an incomplete prompt.
- **Acceptance criteria:** no answer combination yields an applicability conclusion, default baseline, or recommendation; every listed source or navigation aid has a declared public-source basis; users can continue without accepting a suggested path.
- **Verification:** answer-matrix tests, prohibited-claim copy test, and 375/1440 Start Here workflow.

### Feature 5.5 — Quarantine unsourced Playbook advice

- **Priority:** P1.
- **Risk level:** Medium — first-party advice without a traceable basis conflicts with the product’s public-source claim.
- **Scope:** Playbook/pattern guidance and Sources-page traceability language.
- **Affected systems:** `patterns-data.mjs`, `PlaybooksPage.tsx`, Sources page, source registry, and content contracts.
- **Dependencies:** Feature 5.1.
- **Implementation guidance:** retain a guide only when it has source-registry identifiers and canonical public URLs that support the shown advice. Otherwise remove it from the public product or clearly isolate it as product-authored guidance outside the source-truth surface; do not label `Practitioner-consensus` as a source basis.
- **Acceptance criteria:** every visible Playbook has inspectable public-source provenance or is absent; Sources-page traceability claims match the product; no guide implies a compliance or authorization outcome.
- **Verification:** provenance schema test, UI contract, and source-link review fixture.

### Feature 5.6 — Remove the unmounted legacy renderer

- **Priority:** P1.
- **Risk level:** Low — the renderer is not mounted, but its duplicate copy and synthetic-summary behavior create a false maintenance surface.
- **Scope:** obsolete `src/app/app.mjs` and its unmounted page-intro dependency, plus tests/docs that currently preserve them.
- **Affected systems:** legacy renderer files, retired-concept contracts, and relevant repository documentation.
- **Dependencies:** Features 5.1–5.5 confirm the mounted React equivalents.
- **Implementation guidance:** prove no production entrypoint imports the renderer, remove it and dead-only dependencies, and narrow tests to active runtime surfaces.
- **Acceptance criteria:** no production bundle or test requires the legacy renderer; no dead renderer retains prohibited synthetic-record guidance.
- **Verification:** import/reference scan, production build inspection, focused retired-surface test, and `npm run precommit`.

## Epic 6 — Responsive and accessibility completion

Priority: P1  
Risk: Medium.

**Status (2026-07-28): Implementation complete locally.** Compare and Resources
responsive/keyboard/accessibility contracts pass at the required local
viewports. The manual matrix is complete as an evidence record; human NVDA,
VoiceOver, or TalkBack review remains an explicitly documented release residual.

### Feature 6.1 — Reflow Compare for narrow screens

- **Priority:** P1.
- **Risk level:** Medium — two presentations must preserve identical comparison meaning.
- **Scope:** configured comparison results.
- **Affected systems:** `ComparePage.tsx` and responsive styles.
- **Dependencies:** stable comparison data model.
- **Implementation guidance:** keep desktop table; render semantically equivalent cards/definition lists on narrow screens; expose relation and source.
- **Acceptance criteria:** all comparison meaning is available at 375px and 200% zoom without unannounced horizontal scrolling.
- **Verification:** responsive assertions, keyboard flow, screen-reader reading order.

### Feature 6.2 — Reflow Resources controls

- **Priority:** P1.
- **Risk level:** Low — layout changes must preserve URL-backed filter behavior.
- **Scope:** categories, facets, starter kits near 375/768 and zoom.
- **Affected systems:** Resources page and shared filter controls.
- **Dependencies:** Epic 3.
- **Implementation guidance:** primary categories wrap; secondary facets may use a labelled disclosure/drawer.
- **Acceptance criteria:** all categories are discoverable without horizontal scrolling; filter state and result count are announced.
- **Verification:** 375/768/200% automated assertions and manual keyboard check.

### Feature 6.3 — Complete the manual accessibility matrix

- **Priority:** P1.
- **Risk level:** Medium — unresolved human-only failures can block release closeout.
- **Scope:** all meaningful inventory routes and dynamic states.
- **Affected systems:** `docs/audits/a11y-manual-checklist.md`, release evidence.
- **Dependencies:** Epics 1–6 code complete.
- **Implementation guidance:** record browser, OS, screen reader, route, state, expected/observed, and evidence.
- **Acceptance criteria:** keyboard-only, NVDA or VoiceOver, 200% zoom, reduced motion, errors, result changes, mode switches, and mobile menu pass or have owned blockers.
- **Verification:** signed manual artifact plus automated axe gates.

## Epic 7 — Regression, deployment proof, and compatibility closeout

Priority: P2, required before declaring the correction shipped  
Risk: Low/Medium.

**Status (2026-07-28): Local closeout candidate complete; deployment proof
remains execution-gated.** The local correction gate maps every Critical/High audit finding
to focused semantic contracts, including source-first records, route identity,
Resources state, durable Build state, and Compare responsive behavior. The
broad live responsive sweep is split into independently retryable route groups
with first-failure screenshot, video, trace, route, and diagnostic artifacts.
No Pages test has run and no visual baseline changed. Legacy route aliases were
retired locally by owner direction and are covered by local not-found contracts.
Human NVDA, VoiceOver, or TalkBack evidence remains an explicit release
residual.

The v1.0.1 candidate also records exact upstream provenance for all eleven
blocked graph-health findings, removes stale Compare navigation-state patches,
and turns the same-runner mobile Lighthouse comparison into a three-run,
median-based release gate against `v1.0.0`. Those local changes do not replace
the required deployed evidence.

### Feature 7.1 — Add semantic release contracts

- **Priority:** P1.
- **Risk level:** Low — test additions are isolated but must avoid brittle implementation coupling.
- **Scope:** Critical/High findings and route inventory.
- **Affected systems:** unit/contract/E2E suites.
- **Dependencies:** corresponding features.
- **Implementation guidance:** every Critical/High finding gets a fast test that fails on the current behavior and passes on the correction.
- **Acceptance criteria:** structural truth, route identity, Atlas search/lenses, resource no-result/category, and durable state are required gates.
- **Verification:** focused test report mapped to finding IDs.

### Feature 7.2 — Split broad live verification into bounded route groups

- **Priority:** P2.
- **Risk level:** Low — test orchestration changes must retain full route coverage.
- **Scope:** live Pages tests and timeout diagnostics.
- **Affected systems:** Playwright config/scripts, E2E group files.
- **Dependencies:** stable local gates.
- **Implementation guidance:** keep a narrow smoke; run route groups independently; attach failure state without one early timeout hiding later routes.
- **Acceptance criteria:** each route group has a bounded runtime and useful artifact; a group can retry without rerunning unrelated routes.
- **Verification:** CI run on a deployed candidate.

### Feature 7.3 — Update visual and accessibility evidence

- **Priority:** P2.
- **Risk level:** Low — the main hazard is approving unintended baseline drift.
- **Scope:** changed-route baselines and manual audit.
- **Affected systems:** Playwright snapshots, audit docs.
- **Dependencies:** Features 6.1–6.3.
- **Implementation guidance:** update only reviewed intended changes; do not approve wholesale baseline drift.
- **Acceptance criteria:** 375/768/1440 and reduced-motion baselines reviewed; manual accessibility evidence linked.
- **Verification:** visual diff report and checklist.

### Feature 7.4 — Verify production and retire aliases deliberately

- **Priority:** P2.
- **Risk level:** Medium — deployment and retired deep links affect external bookmarks.
- **Scope:** Pages deployment, canonical deep links, cache version, static-404 behavior.
- **Affected systems:** deployment smoke, route documentation.
- **Dependencies:** all prior features and explicit shipping authorization.
- **Implementation guidance:** verify the exact deployed commit; check canonical routes and representative retired aliases, which must render the static not-found page rather than redirecting.
- **Acceptance criteria:** live primary/deep routes, cache version, and representative workflows pass; retired aliases do not redirect.
- **Verification:** bounded live smoke and saved closeout evidence.

## Milestone gates

| Gate | Required evidence |
|---|---|
| M1 — Truthful core | Epic 1 tests green; AC-2 ancestry and Atlas exact search manually verified |
| M2 — Coherent navigation | Epic 2 route matrix green; refresh/back/share verified |
| M3 — Useful Resources | Epic 3 counts/search/details/recommendations green |
| M4 — Complete workflows | Epic 4 record/Build flows green |
| M5 — Source-first records | Epic 5 record/source/provenance contracts green and legacy renderer removed |
| M6 — Inclusive UI | Epic 6 responsive automation and accessibility matrix complete; human assistive-technology sign-off remains a release residual |
| M7 — Shipped correction | Epic 7 deployed commit, route groups, cache, and compatibility evidence green |

## Explicitly deferred

## Epic 4 local completion record (2026-07-27)

Features 4.1-4.4 and M4 are complete locally on
`agent/forge/epic-4-record-build-progressive-disclosure`. Focused route, DOM,
and copy contracts passed. No push, merge, deploy, tag, or release was
performed; browser proof is local-only.

- New framework content.
- Authenticated workspaces or saved user projects.
- A backend or CMS for resource curation.
- Router or graph-library replacement.
- Automated compliance, inheritance, authorization, or assessment determinations.
