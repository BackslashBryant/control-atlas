# Control Atlas prioritized correction backlog

Date: 2026-07-27  
Status: Approved correction program; Epic 1 complete locally  
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
6. Epic 6 — Regression, deployment proof, and compatibility closeout.

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

### Feature 2.1 — Canonicalize Explore and Search

- **Priority:** P0.
- **Risk level:** High — saved links and current-section state can break during migration.
- **Scope:** route table, primary nav, header search, Home links, current-section state.
- **Affected systems:** `App.tsx`, `hashRoutes.ts`, `viewState.ts`, Search/Explore pages, tests.
- **Dependencies:** owner approval of route migration; coordinate with Feature 1.3.
- **Implementation guidance:** `/explore` becomes guided Explore; `/search` becomes universal search; query-bearing legacy `/explore` resolves to Search; `/atlas-map` remains a temporary alias.
- **Acceptance criteria:** visible labels and destinations are one-to-one; legacy queries and focused-node links retain state; generated links are canonical.
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
- **Implementation guidance:** keep a documented alias table with owner and removal date; use replace redirects.
- **Acceptance criteria:** every legacy route resolves once to a canonical URL; no visible action generates a legacy route; `/menu` is retired or explicitly exposed.
- **Verification:** alias contract and deployed deep-link smoke.

## Epic 3 — Resources directory

Priority: P1, with search correction treated as P0 bug work  
Risk: Medium, because taxonomy migration touches all 96 records and contextual modules.

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

## Epic 5 — Responsive and accessibility completion

Priority: P1  
Risk: Medium.

### Feature 5.1 — Reflow Compare for narrow screens

- **Priority:** P1.
- **Risk level:** Medium — two presentations must preserve identical comparison meaning.
- **Scope:** configured comparison results.
- **Affected systems:** `ComparePage.tsx` and responsive styles.
- **Dependencies:** stable comparison data model.
- **Implementation guidance:** keep desktop table; render semantically equivalent cards/definition lists on narrow screens; expose relation and source.
- **Acceptance criteria:** all comparison meaning is available at 375px and 200% zoom without unannounced horizontal scrolling.
- **Verification:** responsive assertions, keyboard flow, screen-reader reading order.

### Feature 5.2 — Reflow Resources controls

- **Priority:** P1.
- **Risk level:** Low — layout changes must preserve URL-backed filter behavior.
- **Scope:** categories, facets, starter kits near 375/768 and zoom.
- **Affected systems:** Resources page and shared filter controls.
- **Dependencies:** Epic 3.
- **Implementation guidance:** primary categories wrap; secondary facets may use a labelled disclosure/drawer.
- **Acceptance criteria:** all categories are discoverable without horizontal scrolling; filter state and result count are announced.
- **Verification:** 375/768/200% automated assertions and manual keyboard check.

### Feature 5.3 — Complete the manual accessibility matrix

- **Priority:** P1.
- **Risk level:** Medium — unresolved human-only failures can block release closeout.
- **Scope:** all meaningful inventory routes and dynamic states.
- **Affected systems:** `docs/audits/a11y-manual-checklist.md`, release evidence.
- **Dependencies:** Epics 1–5 code complete.
- **Implementation guidance:** record browser, OS, screen reader, route, state, expected/observed, and evidence.
- **Acceptance criteria:** keyboard-only, NVDA or VoiceOver, 200% zoom, reduced motion, errors, result changes, mode switches, and mobile menu pass or have owned blockers.
- **Verification:** signed manual artifact plus automated axe gates.

## Epic 6 — Regression, deployment proof, and compatibility closeout

Priority: P2, required before declaring the correction shipped  
Risk: Low/Medium.

### Feature 6.1 — Add semantic release contracts

- **Priority:** P1.
- **Risk level:** Low — test additions are isolated but must avoid brittle implementation coupling.
- **Scope:** Critical/High findings and route inventory.
- **Affected systems:** unit/contract/E2E suites.
- **Dependencies:** corresponding features.
- **Implementation guidance:** every Critical/High finding gets a fast test that fails on the current behavior and passes on the correction.
- **Acceptance criteria:** structural truth, route identity, Atlas search/lenses, resource no-result/category, and durable state are required gates.
- **Verification:** focused test report mapped to finding IDs.

### Feature 6.2 — Split broad live verification into bounded route groups

- **Priority:** P2.
- **Risk level:** Low — test orchestration changes must retain full route coverage.
- **Scope:** live Pages tests and timeout diagnostics.
- **Affected systems:** Playwright config/scripts, E2E group files.
- **Dependencies:** stable local gates.
- **Implementation guidance:** keep a narrow smoke; run route groups independently; attach failure state without one early timeout hiding later routes.
- **Acceptance criteria:** each route group has a bounded runtime and useful artifact; a group can retry without rerunning unrelated routes.
- **Verification:** CI run on a deployed candidate.

### Feature 6.3 — Update visual and accessibility evidence

- **Priority:** P2.
- **Risk level:** Low — the main hazard is approving unintended baseline drift.
- **Scope:** changed-route baselines and manual audit.
- **Affected systems:** Playwright snapshots, audit docs.
- **Dependencies:** Features 5.1–5.3.
- **Implementation guidance:** update only reviewed intended changes; do not approve wholesale baseline drift.
- **Acceptance criteria:** 375/768/1440 and reduced-motion baselines reviewed; manual accessibility evidence linked.
- **Verification:** visual diff report and checklist.

### Feature 6.4 — Verify production and retire aliases deliberately

- **Priority:** P2.
- **Risk level:** Medium — deployment and alias removal affect live deep links.
- **Scope:** Pages deployment, deep links, cache version, alias lifecycle.
- **Affected systems:** deployment smoke, route documentation.
- **Dependencies:** all prior features and explicit shipping authorization.
- **Implementation guidance:** verify the exact deployed commit; retain aliases for the approved compatibility window; create a dated removal item.
- **Acceptance criteria:** live primary/deep routes, cache version, and representative workflows pass; no alias is removed without usage/owner review.
- **Verification:** bounded live smoke and saved closeout evidence.

## Milestone gates

| Gate | Required evidence |
|---|---|
| M1 — Truthful core | Epic 1 tests green; AC-2 ancestry and Atlas exact search manually verified |
| M2 — Coherent navigation | Epic 2 route matrix green; refresh/back/share verified |
| M3 — Useful Resources | Epic 3 counts/search/details/recommendations green |
| M4 — Complete workflows | Epic 4 record/Build flows green |
| M5 — Inclusive UI | Epic 5 responsive automation and manual accessibility complete |
| M6 — Shipped correction | Epic 6 deployed commit, route groups, cache, and compatibility evidence green |

## Explicitly deferred

- New framework content.
- Authenticated workspaces or saved user projects.
- A backend or CMS for resource curation.
- Router or graph-library replacement.
- Automated compliance, inheritance, authorization, or assessment determinations.
