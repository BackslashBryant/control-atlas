# Open-source build-versus-buy evaluation

Date: 2026-07-28  
Decision rule: adopt only when a measured practitioner problem is not already solved by a maintained dependency or a small configuration change.

## Executive recommendation

Do not replace the search or graph stack. Consolidate the duplicated ownership around MiniSearch, and finish the product contracts around the existing React Flow plus ELK stack.

The missing value is not a more impressive engine. It is truthful eligibility, one canonical index contract, explicit relationship semantics, accessible list parity, bounded map workloads, URL-preserved semantic state, and usable entry paths.

| Area | Current state | Recommendation | Why | Removal or rollback |
|---|---|---|---|---|
| Universal record search | MiniSearch 7.2.0, sharded indexes, additional bespoke search paths | **Consolidate** | MiniSearch already supplies field weighting, prefix/fuzzy options, filtering, and deterministic local search suitable for static hosting. The product currently has several competing eligibility/ranking pipelines. | Make the npm package the only implementation. If vendoring is legally or operationally required, generate and hash-check it rather than hand-maintaining a byte-identical copy. |
| Resources search | Custom scorer plus generated index that the page does not use | **Configure then consolidate** | Honest zero results already work in universal Search. Resources needs the same eligibility-before-ranking rule, human facets, match explanation, and URL state—not another engine. | Delete the unused generated index or route all Resources queries through it after parity tests. |
| Catalog search | Component-local substring filtering and a 100-row cap | **Adopt shared search contract** | The problem is truncation and local state, not a need for server search. Reuse the canonical MiniSearch eligibility/index layer with catalog facets and virtualization. | Preserve the existing filter as a fallback until result-count and URL contracts pass. |
| Global search overlay | Separate raw resource index | **Consolidate** | It mislabels every Resource as Community and leaks an enum. The overlay should be an accelerator over the same canonical Search result model. | Remove overlay-specific index ownership after parity tests for exact ID, ambiguous text, resource, source, and zero-result queries. |
| Graph rendering | React Flow plus ELK | **Keep and configure** | The product already has a capable bounded node/edge renderer, automatic layout, controls, and a path to keyboard/accessibility support. The current failure is IA and semantics. | Retain accessible List as canonical parity; Map can be disabled per workload without affecting record or path access. |
| Atlas overview | No overview; record neighborhood only | **Finish with existing stack** | Use bounded framework/topic overview graphs, expansion by declared structural scope, and a record-neighborhood mode. Do not serialize pan/zoom coordinates; serialize scope, filters, focus, and lens. | Each overview can fall back to Path/List if graph health, size, or layout budget fails. |
| Tables and long lists | Hand-rendered catalog and relationship rows | **Adopt focused utilities only if measured** | First add semantic HTML, pagination/virtualization thresholds, URL facets, and compact mobile cards. A table framework is not justified until sorting, column visibility, or row virtualization requirements exceed simple components. | Keep serverless/static data and progressively enhance; the base table/list remains accessible without virtualization. |
| URL state | Custom hash route serialization plus local component state | **Consolidate** | A new state library would not fix missing product decisions. Extend the existing typed route state so every meaningful filter/selection has validation and recovery. | State schemas are small and reversible; legacy parsing can remain time-bounded during migration. |
| Downloads/exports | Existing CSV, Markdown, JSON, DOCX/XLSX generators | **Keep and harden** | The missing contracts are selected-input truth, disabled failure states, source attribution, deterministic filenames, and tests. | Fail closed when preview/generation is unavailable; no dependency migration required. |

## Search candidates

### MiniSearch — keep

- License: MIT.
- Maintenance: active repository and current npm packaging.
- Fit: browser/local search, boosting, prefix/fuzzy configuration, field storage, filtering, and serialization.
- Static-host impact: already paid; replacing it adds migration and relevance risk without a proven user gain.
- Required work:
  1. Separate eligibility from ranking.
  2. Direct exact identifiers only after a unique canonical match.
  3. Route ambiguous text to Search.
  4. Preserve query and facets in the URL.
  5. Return typed destinations with resolved labels.
  6. Explain why a recommendation or resource appears.
  7. Delete or generated-hash-check `src/lib/minisearch.js`, which is byte-identical to the installed package.

Source: [MiniSearch repository](https://github.com/lucaong/minisearch).

### Orama — benchmark only after measured failure

Orama is maintained and offers faceting, filters, vector/hybrid options, and typo-tolerant search. Those capabilities do not justify migration while the current problems are multiple indexes, false identity, ignored state, and category ordering. Define a benchmark corpus and success thresholds first. Consider Orama only if MiniSearch cannot meet measured recall, typo tolerance, faceting latency, or memory targets after configuration.

Source: [Orama repository](https://github.com/oramasearch/orama).

### Pagefind — reject for the record corpus

Pagefind is a strong static-site content search tool. Control Atlas needs typed-record eligibility, exact identifiers, graph/source relationships, fielded filters, and URL-preserved workbench state. Indexing rendered pages would weaken the canonical data model and duplicate record truth.

Source: [Pagefind repository](https://github.com/CloudCannon/pagefind).

## Graph and hierarchy candidates

### React Flow plus ELK — keep

React Flow provides controlled nodes/edges, viewport helpers, keyboard/accessibility guidance, and a mature interaction model. ELK supplies deterministic automatic graph layout. Together they fit bounded framework overviews and record neighborhoods. The target workload must be constrained:

- Overview: one declared framework or topic scope, structural nodes first.
- Neighborhood: one focused record plus explicitly selected relationship classes.
- Expansion: user-triggered, count-labeled, bounded.
- State: focus, scope, lens, filters, and expansion in the URL.
- Parity: accessible Path and List cover the same declared scope.
- Failure: loading, too-large, layout-error, and no-relationship states have textual recovery.

Sources: [React Flow accessibility](https://reactflow.dev/learn/advanced-use/accessibility), [ELK project](https://github.com/kieler/elkjs).

### Cytoscape.js — do not adopt now

Cytoscape.js is mature and capable, but adopting it would create a second graph renderer/layout system. No live finding demonstrates that React Flow plus ELK blocks the required bounded overview or record-neighborhood jobs.

Source: [Cytoscape.js repository](https://github.com/cytoscape/cytoscape.js).

### Sigma.js and Graphology — reject for the declared workload

Sigma and Graphology are strong for large graph exploration and analysis. Control Atlas deliberately requires bounded maps with accessible non-canvas parity. Their scale advantage is unnecessary and would create additional accessibility, rendering, and semantic-state ownership.

Sources: [Sigma.js repository](https://github.com/jacomyal/sigma.js), [Graphology repository](https://github.com/graphology/graphology).

### Genealogy patterns — adapt interaction, not code

Gramps Web demonstrates useful record-first patterns: overview plus detail, explicit relationship navigation, progressive expansion, and return paths. Its AGPL-3.0 license and application scope make it inappropriate as an embedded dependency. Adapt the interaction pattern only.

Source: [Gramps Web repository](https://github.com/gramps-project/gramps-web).

### D3 hierarchy — reject as canonical hierarchy engine

D3 hierarchy assumes a parent-based hierarchy. Control Atlas has multiple relationship classes and may have multiple publisher-declared parents. Using a tree helper before enforcing publisher rules would encourage manufactured ancestry. It could be used only for a validated single-parent slice after the canonical graph model has already declared the hierarchy.

Source: [D3 hierarchy documentation](https://d3js.org/d3-hierarchy).

## Information-architecture patterns

| Reference | Adopt or adapt | Rejected interpretation |
|---|---|---|
| [MDN page types](https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Page_structures/Page_types) | Separate goal-oriented guidance, source-structured reference, and navigation pages. | Do not mix tutorial copy into official record pages. |
| [Diátaxis](https://diataxis.fr/) | Keep task guidance, reference, explanation, and learning distinct. | Do not make one generic “Explore” surface serve all needs. |
| [ATT&CK Navigator](https://github.com/mitre-attack/attack-navigator) | Explicit matrix entry, focused layers, visible scope, shareable configuration. | Do not imitate its visual matrix where publisher structure is not matrix-shaped. |
| [USWDS search](https://designsystem.digital.gov/components/search/), [collection](https://designsystem.digital.gov/components/collection/), [side navigation](https://designsystem.digital.gov/components/side-navigation/) | Adapt public-service labels, compact collections, persistent local navigation, and accessible form feedback. | Do not migrate the entire design framework or mimic federal branding. |
| [GOV.UK content design](https://www.gov.uk/guidance/content-design/writing-for-gov-uk) | Front-load concrete information, use action labels, remove filler. | Do not flatten official terminology when it is needed for verification. |
| [Docusaurus docs navigation](https://docusaurus.io/docs/sidebar) | Adapt explicit hierarchy, current location, and predictable previous/next routes for Learn. | Do not migrate the application to a documentation framework. |

## Decision gates

No new search, graph, table, or state dependency should enter the correction program unless its backlog item records:

1. A live user failure.
2. A benchmark corpus or workload.
3. Success thresholds for relevance, latency, memory, accessibility, and state.
4. License and maintenance review.
5. Bundle/static-host budget.
6. Migration owner.
7. Removal of superseded code.
8. Rollback path.

