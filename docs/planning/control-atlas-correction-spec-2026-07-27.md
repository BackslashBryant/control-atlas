# Control Atlas correction specification

Date: 2026-07-27  
Status: Proposed for owner review; no implementation authorized by this document  
Source audit: [Current-state audit](../audits/control-atlas-current-state-audit-2026-07-27.md)

## Outcome

Make Control Atlas understandable and trustworthy from first visit through deep framework navigation without changing the React/Vite/HashRouter/static-data architecture.

The corrected product must:

1. Use one name for each user job and one canonical route for each destination.
2. Protect structural hierarchy from applicability and correlation edges.
3. Let Atlas answer a clear question at each depth.
4. Present Resources as a human-centred directory, with trust and provenance preserved as facets.
5. Keep every meaningful selection durable in URL, refresh, history, and shared links.
6. Meet the existing responsive and accessibility contract with current evidence.

## Recommended global hierarchy

### Primary navigation

| Destination | User question | Canonical route |
|---|---|---|
| Home | Where should I begin? | `#/` |
| Explore | How does this framework, process, or record connect? | `#/explore` |
| Catalog | What official rules and frameworks are available? | `#/catalog` |
| Compare | How do two scopes or records relate? | `#/compare` |
| Learn | How do practitioners approach this work? | `#/learn` |
| Build | What can I do or produce next? | `#/build` |

### Utility navigation

| Utility | Job | Canonical route |
|---|---|---|
| Search | Find any known record by words or identifier | `#/search` |
| Start Here | Get a cautious starting path from a situation | `#/start` |
| Sources | Verify provenance, version, freshness, and limitations | `#/sources` |
| Help/About | Understand product scope, method, and boundaries | `#/about` |

Search remains available in the header and by Ctrl+K, but the durable destination is `/search`. Sources stays outside Build because it proves Control Atlas data provenance; Resources stays inside Build because it helps practitioners do work.

## Route migration

Hash routing remains appropriate for the current static GitHub Pages architecture. Migrate, do not replace, the router.

| Current | Canonical | Compatibility behavior |
|---|---|---|
| `#/atlas-map` | `#/explore` | Redirect while preserving `node`, axis, filters, mode, and focus |
| `#/explore?q=…` | `#/search?q=…` | Query-bearing legacy route redirects to Search |
| bare `#/explore` search page | `#/explore` Atlas | Change only after the query-aware compatibility rule ships |
| `#/build/community` | `#/build/resources` | Redirect preserving search and facets |
| `#/build/community-detail?id=:id` | `#/build/resources/:id` | Redirect to path-segment detail |
| `#/commons-detail?id=:id` | `#/build/resources/:id` | Preserve as tested legacy alias |
| `#/menu` | none | Redirect to Home unless an owner explicitly chooses to expose it |

Every redirect must use replace semantics, retain valid parameters, discard only invalid parameters with a visible recovery message, and produce the canonical URL when copied.

## Section hierarchy

### Explore

1. Explore landing: three primary jobs, no more than four choices at a decision.
2. Chosen job and choice chain: “Your choices,” not “Where this sits.”
3. Selected object summary.
4. True structural position.
5. Relevant lenses and relationship groups.
6. Path, Map, and List representations over the same declared scope.

### Catalog

1. Catalogue groups.
2. Catalogue overview.
3. Native structural units.
4. Record detail.
5. Applicability and correlation connections.

Catalog remains the exhaustive inventory. Explore is the guided route through relationships. Neither should imitate the other.

### Build

Persistent local navigation:

- **Tasks** — task-first workflows such as authorization package, assessment, continuous monitoring, and policy work.
- **Starter documents** — configurable starter artifacts tied to named official references.
- **Resources** — external tools, templates, communities, training, datasets, and references.

Suggested routes:

- `#/build/tasks`
- `#/build/tasks/:taskId`
- `#/build/documents`
- `#/build/documents/:documentType`
- `#/build/resources`
- `#/build/resources/:resourceId`

The Build landing may still recommend one next action, but every card must resolve into one of these three stable branches.

## Resources catalogue model

### Page identity

Name: **Resources**  
Description: **Tools, templates, communities, training, datasets, and reference material that help you do the work.**

Do not call the full directory Community, Commons, Library, or Sources in user-facing copy.

### Primary categories

Promote the six existing, mutually comprehensible groups already produced by the current dataset:

1. Rules and policy — 17 current records.
2. Catalogs and data — 26.
3. Templates and starters — 8.
4. Tools and automation — 33.
5. Communities and training — 6.
6. Reference and history — 6.

Each resource has exactly one primary category. Secondary type values can remain for filtering and display. Category assignment must be validated as data, not recalculated from display strings in each component.

### Secondary facets

- Trust/source lane: Official, Open source, Practitioner, Commercial, Legacy.
- Resource type.
- Framework or program.
- Audience or role, if present and sufficiently populated.
- Access/cost, if evidence-backed.
- Lifecycle stage only after reclassification proves that it narrows the set.

Trust lane remains visible because authority and usefulness are different. It is a facet and badge, not the first browse hierarchy.

### Curated collections

Rename “Featured Starter Collections” to **Starter kits**. Show at most three contextually relevant kits before an explicit “View all starter kits.” Collections are optional shortcuts, not the directory’s primary architecture.

### Search and ranking contract

1. Normalize query and filters.
2. Determine eligibility from indexed fields and explicit filters.
3. Return no results if no record is eligible.
4. Rank only eligible records.
5. Apply editorial recommendation as a bounded tie-break/boost.
6. Display a concise match reason when practical.

An editorial recommendation must never turn a non-match into a match.

### Contextual recommendations

Add an optional, versioned link collection:

```json
{
  "id": "resource-link-...",
  "resourceId": "community-reddit-nistcontrols",
  "target": {
    "kind": "catalog|family|control|guide|task",
    "catalogId": "nist-800-53",
    "recordId": "AC-2"
  },
  "relation": "discussion|implementation_aid|starter|training|reference",
  "reason": "Practitioner discussion focused on NIST control implementation.",
  "provenance": "editorial|derived",
  "reviewedAt": "YYYY-MM-DD"
}
```

This does not make external Resources members of the canonical framework tree. Derived suggestions remain allowed when labelled as derived.

## Atlas hierarchy and interaction model

### Product jobs

Atlas must help a user:

1. Locate a record in its true native structure.
2. Understand what applicability choices affect it.
3. Follow a process such as RMF without confusing process with parentage.
4. Inspect implementation, assessment, evidence, and cross-framework connections by explicit relationship.
5. Move to the full record, comparison, source, guide, or resource without losing context.

### Landing jobs

Keep three primary entry cards:

- **Trace a framework** — choose a supported hierarchy, then move from catalogue to structural unit to record.
- **Follow RMF** — choose a step, then inspect the controls, documents, decisions, and outputs connected to that step.
- **Start with my situation** — hand off to Start Here and return with an explicit recommended scope.

Do not automatically select SP 800-53 after “Trace a framework.” Offer only catalogues with validated hierarchy capability, grouped in plain language. Flat/correlation-only datasets remain discoverable in Catalog, Compare, or a later lens.

### Structural truth

The persistent “Where this sits” path is built only from relationship classes declared structural by the canonical tree model. It must:

- remain within the applicable native structural domain;
- never contain baseline applicability, mappings, correlations, evidence, implementation aids, or external Resources;
- resolve multiple valid parents through a declared publisher-hierarchy rule, not arbitrary graph traversal;
- fail closed with “Structural path unavailable” rather than display an inferred false parent.

The user’s guided selections are shown separately as **Your choices**, for example:

`Explore → SP 800-53 → Moderate baseline → Access Control`

The structural path remains:

`SP 800-53 → Access Control family → AC-2`

### Selected-record disclosure

1. What this is.
2. Where this sits — structural only.
3. Why it matters.
4. Applicability — baselines and scoping.
5. Connections grouped by relationship class.
6. Next actions.
7. Sources and external Resources.

### Relationship lenses

Use native type plus explicit relationship class. Recommended groups:

- Structure.
- Applicability.
- Implementation and technical requirements.
- Assessment and evidence.
- Process and artifacts.
- Cross-framework mappings.
- Threat and defensive relationships.

Do not assign enhancements to Implementation merely because their catalogue bucket is hard-coded there. An enhancement remains a structural child; its other connections may appear in additional groups.

### Path, Map, and List

- **Path:** guided sequence through one selected relationship group, with the choice chain and relationship verbs visible.
- **Map:** bounded local topology, never an unbounded giant canvas; edge legend and direction are always present.
- **List:** complete accessible rendering of the same filtered nodes and edges, sortable without losing relation meaning.

All three modes share selected record, scope, filters, and counts. A mode switch changes representation, not the underlying result set.

### Search behavior

- Exact unique identifier: open focused Explore.
- Multiple textual matches: open `/search` with query preserved.
- No match: remain in place with a clear message and links to Search and Catalog.
- Loading/error: announce status and retain the query for retry.

## Terminology registry

| Use | Do not use visibly | Meaning |
|---|---|---|
| Explore | Atlas as a destination label | Guided framework, process, and relationship navigation |
| Search | Explore for universal results | Find records across the product |
| Catalog | Library/Browse | Exhaustive official framework inventory |
| Learn | Playbooks | Practitioner guidance |
| Build | Templates as the whole section | Tasks, starter documents, and Resources |
| Resources | Commons/Community resources for the full set | External aids used to do the work |
| Starter documents | Templates when the object is generated/configured | Configurable artifacts tied to named official references |
| Starter kits | Featured Starter Collections | Curated resource bundles |
| Where this sits | any chain containing choices or correlations | Structural ancestry only |
| Your choices | breadcrumb for navigation/filter decisions | User-selected route and applicability |
| Mapping | inheritance determination | A traceable relationship requiring validation |

“Atlas” may remain in the product name and explanatory copy. It should not compete with Explore as a second destination name.

## Shallow-to-deep navigation paths

### Framework path

Home → Explore → Trace a framework → choose framework → choose native structural unit → choose record → read meaning and true path → inspect applicability or a connection lens → open Compare/Source/Resource.

### RMF path

Home → Explore → Follow RMF → choose step → see purpose, inputs, outputs, and related records → choose a record/artifact → inspect source and next action.

### Known-item path

Header Search/Ctrl+K → `/search?q=AC-2` → record result → record meaning and true path → focused Explore only when relationship exploration is needed.

### Resource path

Build → Resources → primary category → facet/search → resource detail → canonical external link or contextually related task/record.

### Task path

Build → Tasks → task → required inputs and starter documents → preview/configure → source and limitations → download.

## Component implications

Expected systems, subject to implementation-time confirmation:

- `src/ui/App.tsx`: canonical route table, section highlighting, title/context registry.
- `src/ui/lib/hashRoutes.ts` and `src/ui/lib/viewState.ts`: route migration and durable state.
- `src/ui/pages/AtlasMapPage.tsx` and `src/ui/lib/atlasModel.ts`: structural-first Explore, search transitions, relationship lenses.
- `src/ui/lib/ancestorPath.ts`: fail-closed structural path.
- `src/ui/pages/ObjectDetailPage.tsx`: record disclosure order and relationship grouping.
- `src/ui/pages/ExplorePage.tsx`: canonical Search identity.
- `src/ui/pages/TemplatesPage.tsx`: Build-local navigation and URL-backed task/document state.
- `src/ui/pages/CommonsPage.tsx`, `CommonsDetailPage.tsx`, and `CommonsLaneBadge.tsx`: Resources directory, eligibility/ranking, detail accuracy.
- `src/ui/pages/ComparePage.tsx`: mobile result representation.
- shared header, context bar, link, breadcrumb, empty/error, and metadata components.
- `data/commons-resource-dataset.json`: primary categories, lifecycle cleanup, optional contextual links.
- graph build/schema code: structural relationship invariant.

Do not rename internal modules merely for cosmetic consistency in the first milestone. Rename only when it reduces ongoing confusion and is covered by imports/tests.

## Data and migration requirements

1. Add relationship-class validation to generated graph data.
2. Make structural-parent rules explicit and versioned.
3. Add `primaryCategory` to each resource and validate exactly one allowed value.
4. Make lifecycle optional; reclassify or remove non-discriminating values.
5. Add optional contextual links without merging Resources into the framework graph.
6. Preserve source URL policy: official catalogue/document URL plus record ID; no fabricated official deep links.
7. Emit migration diagnostics for rejected legacy route parameters and invalid graph relationships.
8. Retain a rollback path to the last valid generated dataset.

## Responsive requirements

- Verify at 375, 768, and 1440 CSS pixels and at 200% zoom.
- No document-level horizontal overflow.
- Compare uses a table at wide widths and a semantically equivalent card/definition-list view on narrow widths.
- Primary Resources categories wrap or reflow; hidden horizontal scrolling is not the only way to discover them.
- Graph/map controls remain reachable without covering selected-record content.
- Touch targets remain at least 44×44 CSS pixels.
- Text reflows without clipping; long IDs and URLs wrap safely.

## Accessibility requirements

- Path and List remain complete without the visual Map.
- Relationship class, direction, selection, loading, result count, and error changes are announced.
- Tabs, disclosures, filters, pagination, and mobile menu use correct roles, names, states, and focus behavior.
- Mode switches return focus to the new mode heading or preserve a documented focus target.
- Color is never the sole carrier of relationship class or trust lane.
- Reduced-motion mode avoids animated pan/zoom transitions.
- Keyboard-only operation covers every route and graph alternative.
- Human NVDA or VoiceOver review is required before closure.

## Required tests

Fast checks first:

1. Graph invariant tests: structural ancestry accepts only allowed structural edges; explicit AC-2 regression.
2. Route contract tests: canonical serialization, legacy alias migration, query/selection preservation.
3. Atlas reducer/view-model tests: exact, ambiguous, no-match, hierarchy, applicability, and lens grouping.
4. Resource search tests: eligibility before ranking; nonsense-query no-result.
5. Resource schema tests: one primary category, optional/discriminating facets, accurate badge descriptions.
6. Display-name/title tests for every route.
7. Build state round-trip tests.

Integration checks once per milestone:

- Playwright workflow suites for Home, Explore, Search, Catalog/record, Compare, Learn, Build/Resources, Sources/Start/About.
- 375/768/1440 and 200% zoom responsive assertions.
- axe serious/critical checks plus keyboard flows.
- Visual baselines for changed routes only.
- Bounded live Pages smoke after deployment.
- Manual screen-reader checklist after the final candidate.

## Tradeoffs and non-goals

- Route migration adds temporary compatibility logic; it is preferable to indefinite vocabulary conflict. Give aliases an owner and removal date.
- Curated resource links require editorial maintenance; they provide traceability that opaque keyword relevance cannot.
- A structural-first Atlas may initially show fewer connections. Lower volume with truthful semantics is the intended trade.
- No backend, authenticated workspace, router replacement, graph-engine replacement, or new framework corpus is required.
- This correction does not claim that mappings prove authorization, inheritance, compliance, or assessment outcomes.

## Owner decisions required

1. Approve the canonical route migration: Explore at `/explore`, Search at `/search`.
2. Approve Resources as the user-facing name and the six primary categories.
3. Approve Build local navigation: Tasks, Starter documents, Resources.
4. Approve replacing the current Atlas purpose-stage default with structural position plus explicit relationship lenses.

All other corrections are necessary integrity, accessibility, or consistency work derived from existing product rules.
