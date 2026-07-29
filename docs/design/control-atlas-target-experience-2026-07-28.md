# Control Atlas target experience

Date: 2026-07-28  
Status: audit recommendation, not implemented  
Governing standard: truthful, durable, shareable structure; source truth visibly separate from Control Atlas interpretation and user judgment.

Wireframes:

- [Desktop board](../../artifacts/audits/control-atlas-2026-07-28/wireframes/target-wireframes-desktop.svg)
- [Mobile board](../../artifacts/audits/control-atlas-2026-07-28/wireframes/target-wireframes-mobile.svg)

## Product model

Control Atlas should behave as a public reference workbench with one canonical record and relationship model exposed through distinct user-intent lenses:

| Destination | Job | Must contain | Must not become |
|---|---|---|---|
| Home | Orient and enter | One dominant universal Search; three secondary entrances | A questionnaire, RMF landing, or marketing page |
| Search | Retrieve anything eligible | Typed results, result counts, filters, honest zero results | Explore, Catalog, or an editorial recommendation feed |
| Explore | Discover within declared scope | Path, Map, List over the same records | Universal Search or a relationship-stage wizard |
| Catalog | Inspect exhaustive inventory | Search, type grouping, facets, counts | Publisher wall or guided recommendation |
| Compare | Work with published mappings | Mode, inputs, provenance, limits, URL state, exports | Static mode-card gallery |
| Learn | Read product-authored explanation | Concepts and workbench guides labeled as Control Atlas | Official source text or applicability advice |
| Build | Do a task or create/find working material | Tasks, Starter documents, Resources as equal lanes | Ten-card funnel |
| Resources | Find external working material | Tools, templates, datasets, training, communities | Sources, Commons, Community, or a structural graph parent |
| Sources | Verify provenance | Publisher, publication, coverage, status, dates, use | Resources promotion or a generic library |
| About | Understand boundaries | Methods, limitations, contribution, product model | Self-awarded clarity/completeness claims |

`Resources` remains canonically under Build. It also receives a Home entrance and contextual links because subordinate does not mean hidden.

## Global information architecture

Primary navigation:

1. Explore
2. Catalog
3. Compare
4. Learn
5. Build

Persistent utilities:

- Search
- Sources
- About/help

Build local navigation:

- Tasks
- Starter documents
- Resources

Explore local navigation:

- Path
- Map
- List
- Optional lens/filter controls, including RMF

Canonical identity is a data contract. Each destination owns:

- visible label;
- canonical URL;
- document title;
- selected global/local navigation state;
- analytics name;
- breadcrumb/context label;
- recovery destination.

No component invents these values locally. Internal route names such as `library-detail`, `templates`, `commons`, `relationships`, or raw slugs never become display labels.

## Home

The desktop and mobile first screen contains:

1. Product name.
2. One sentence identifying searchable material.
3. Universal Search field and Search action.
4. Three compact secondary entrances:
   - Open the Atlas.
   - Browse Catalog.
   - Find Tools & Resources.
5. One compact public/no-account/source-identity boundary.

RMF is not a Home-level card. Start Here is not a personalized questionnaire. If a source navigator remains valuable, place it as a compact Search/Explore secondary path called `Browse source starting points`, and expose the inclusion rule for every source it shows.

Preserve the rotating Ctrl+Alt slogan as a protected brand element. Remove `Choose a starting point`, card-introduction paragraphs, and duplicated About/Sources buttons. The slogan must not displace Search from the first mobile viewport or compete with Search as an action.

Target desktop first-screen budget:

- Header: at most 64px.
- Hero/search: at most 230px.
- Three secondary entrances: at most 130px.
- Trust boundary: at most 72px.
- No first-screen footer.

## Search

Search is the only universal retrieval surface. The overlay and Home field are accelerators that hand off to the same canonical Search state.

### Eligibility

1. Normalize identifier and text input without changing source identifiers.
2. Determine eligible matches before any ranking or editorial preference.
3. If an exact identifier maps to exactly one canonical record, the accelerator may open it directly.
4. If exact text is ambiguous, show Search results.
5. A result cannot appear because it is popular, recommended, or from a preferred publisher unless it first matches the query and active filters.
6. Zero results remain zero.

### Result anatomy

- Destination type.
- Official or resolved title.
- Identifier where applicable.
- Publisher/source or external owner.
- Match reason.
- Relevant excerpt only when attribution is known.
- Canonical destination.

Filters and query belong in the URL. Result counts, loading, zero, error, invalid-filter recovery, and filter changes are announced. The overlay uses the same typed result model and never labels all Resources `Community`.

## Explore

Explore is guided discovery. It begins with a declared scope, not a selected record and not a hard-coded SP 800-53 path.

### Shared scope

Path, Map, and List operate on the same scope definition:

- catalog/framework;
- structural root or topic scope;
- relationship classes;
- publisher/source filters;
- optional applicability or RMF lens;
- focused record;
- user-triggered expansion set.

Scope, filters, lens, focus, and mode serialize in the URL. Pan, zoom, and raw coordinates do not.

### Path

Path is primary and accessible. It renders only publisher-declared hierarchy:

`catalog → declared parent levels → record`

If ancestry is unavailable: `No publisher-declared ancestry is available in the current sources.`

Multiple parents render only when the source or project rule explicitly declares them, with the rule named. Baseline, applicability, mapping, evidence, implementation, assessment, process, and external resources never appear in this chain.

`Choices applying to this scope` is a separate region for baseline, RMF, and relationship-class filters.

### Map recommendation

Keep Map and finish it with the existing React Flow plus ELK stack.

Provide two bounded map workloads:

1. Framework/topic overview: validated structural nodes within one declared scope, with user-triggered expansion.
2. Record neighborhood: one record plus explicitly selected relationship classes.

Do not build one unlimited whole-product force graph. Do not replace React Flow/ELK unless a benchmark proves the required workload cannot meet accessibility, layout, memory, and static-host budgets.

Every Map displays:

- current scope;
- node/edge counts;
- relationship legend;
- visible filter state;
- equivalent Path and List links;
- loading, zero, too-large, layout-error, and recovery states.

### List

List is complete accessible parity for the declared scope. It should not repeat long provenance and confidence definitions on every row. Use compact cells:

- connected record;
- relationship;
- exact source;
- authority/rationale state;
- validation note where needed.

Definitions appear once above the list or on demand.

## Catalog

Catalog is exhaustive inventory without being an unfiltered wall.

Default grouped view uses practitioner-recognizable types, such as:

- security and privacy controls;
- cybersecurity frameworks;
- baselines and profiles;
- federal programs and rules;
- implementation and assessment catalogs;
- published mappings and datasets.

Publisher is a filter and alternate view. Search, view, type, publisher, lifecycle, and page/cursor state are shareable. Counts reconcile to the full declared scope. No silent 100-record ceiling is allowed; use pagination or accessible virtualization with an explicit total.

Catalog profiles lead with official title, publisher, version, source, record types, and structural capabilities. Product-authored browsing help is labeled `Control Atlas navigation note`, not `When to use it`.

## Record

First screen order:

1. Official record type.
2. Official identifier and title.
3. Honest title-absence statement when no separate title exists.
4. Publisher and exact publication/source.
5. Open official source.
6. Official text or an honest absence statement.

Second layer:

7. Publisher-declared structural position.
8. Key published relationships, compactly grouped.
9. Baseline/applicability references, separate from structure.

On demand:

10. All connections.
11. Contextual Resources.
12. Provenance, synchronization, raw IDs, and source location.

Back, Explore, Compare, and Copy link remain available but do not displace source truth on mobile.

### Source identity fail-closed contract

Before the interface uses `official`, `publisher`, `source excerpt`, or a publication name, the record must resolve to:

- exact publisher;
- exact publication/catalog identity;
- record identifier namespace;
- official source URL or cited landing page;
- ingestion provenance, stored separately.

A generic ingestion channel such as OSCAL is not a publication. One registry entry cannot display `SP 800-53 Rev. 5` while serving CSF, SP 800-171, SSDF, and other catalogs.

When resolution fails:

`Official source identity is unavailable for this record. Control Atlas has hidden the attribution until the source mapping is corrected.`

The product must never guess.

## Compare

Replace the five large mode cards with compact mode tabs or a select control. Choosing a mode immediately reveals the necessary fields.

Framework comparison requires:

- Framework A.
- Framework B.
- Mapping source.
- Optional filters.
- `Show mappings`.

Before results, explain what the selected published mapping can and cannot establish. Results expose source, rationale state, derivation, limitations, and validation need. The configuration and selection persist in the URL. Exported files repeat the same provenance and boundary, once.

## Build and Resources

Build opens with three equal lanes:

- Tasks.
- Starter documents.
- Resources.

Users who know a document or resource should not traverse the task funnel.

### Tasks

A task has a canonical route and names:

- intended output;
- required inputs;
- official sources used;
- what Control Atlas does;
- what remains user/governing-authority judgment.

Avoid outcome claims. `Build an authorization package` is a task label only if the product clearly produces starter material, not an authorization result.

### Starter documents

No baseline, framework, applicability, system type, or authorization value is selected silently. Required choices fail closed. Optional values show `Not selected` or `Not included`.

Preview and Download share one validity state. If generation fails or preview is unavailable, Download is disabled with the reason and recovery action. Export metadata names selected inputs, cited sources, generation time, limitations, and independent-review requirement.

### Resources

First-screen directory anatomy:

- Search.
- Result count.
- Primary type chips: Tools, Templates, Datasets, Training, Communities.
- Secondary facets: owner/publisher, license/cost, platform, format, lifecycle.
- Results.

Purpose/starter collections are optional curated views below or beside the directory, not the only entry architecture. Each inclusion explains:

- what it is;
- owner;
- type;
- why it is included;
- provenance;
- limitations;
- independent-validation need;
- external destination.

Resources can support contextual recommendations only after query/context eligibility. Editorial ranking cannot manufacture a match.

## Learn

Do not expose an empty Learn product.

Minimum launchable Learn scope:

- Hierarchy versus relationships.
- Source truth versus Control Atlas navigation notes.
- How Search eligibility and ranking work.
- How to read a record.
- How to use published mappings in Compare.
- How starter documents handle source citations and user judgment.

Every article identifies itself as `Control Atlas explanation`. It may quote and cite official material, but never impersonates the publisher or advises applicability. Remove `new user`, `novice`, `beginner`, and equivalent expertise labels.

## Sources

Sources is a compact trust register, not a general-resource page.

Default table/list:

- source/publication;
- publisher;
- content coverage;
- version;
- retrieved/current-through date;
- lifecycle/status;
- access to source detail.

Search and filters are URL state. A single compact note points tools/templates/training/community visitors to Build → Resources. Source detail explains ingestion method, checksum/freshness where meaningful, affected catalogs, relationship evidence, and limitations.

## Layout and density rules

1. Target 65–80% information-to-chrome ratio on Mission-layer pages.
2. Use one page title. Eyebrow is reserved for exact context, not a duplicate destination.
3. Do not repeat heading, lede, card intro, and CTA with the same meaning.
4. Desktop content uses available width for useful two-column work: filters plus results, identity plus actions, or list plus detail.
5. Reading prose remains 65–80 characters per line; tables and workbenches may use wider containers.
6. No large empty panel without a state and next action.
7. Footer remains compact and does not duplicate page-level boundaries.
8. All-caps labels are sparse and functional.
9. Orbital geometry stays behind content safe corridors and is removed when it reduces contrast or creates false grouping.
10. Avoid hard-coded page min-heights. Content determines height.

## Responsive behavior

At mobile:

- Search remains first-screen on Home.
- Filters collapse into a named drawer with active count and clear action.
- Path becomes a vertical sequence.
- Map remains optional and bounded; List is always available.
- Tables become compact cards only when column relationships remain explicit; otherwise use an accessible contained scroll region with sticky first column and instructions.
- Record actions become a compact overflow after source identity.
- Global and local navigation remain available.
- No control, filter, result, source field, or warning disappears.

At 200% zoom, the 1280px desktop layout must reflow equivalently to approximately 640 CSS pixels without clipping, two-dimensional page scroll, or lost controls.

## Copy system

Every meaningful string declares a speaker:

- `official_publisher`;
- `external_publisher`;
- `control_atlas_navigation_note`;
- `control_atlas_explanation`;
- `system_status`;
- `product_boundary`.

Official text remains verbatim except for clearly indicated truncation and accessibility-safe formatting. Product notes never use `official` unless the exact source identity is validated.

Major-surface copy must pass:

1. What is this?
2. Why does it matter here?
3. What concrete action is available?
4. Who is speaking?
5. What judgment remains outside the product?

Banned product-voice patterns:

- novice, beginner, new here;
- unapproved slogans other than the protected rotating Ctrl+Alt brand flourish;
- choose/start/understand as empty openings;
- practical starting point;
- generic `Why it is useful`;
- recommendation without rule/provenance/limitations;
- `plain English` self-praise;
- decorative tree/body/space metaphors used as data structure;
- duplicated product disclaimers.

## Target acceptance

The target experience is achieved only when:

- every destination passes the canonical identity contract;
- Search eligibility is shared across all accelerators and typed destinations;
- Explore Path/Map/List reconcile to the same scope;
- all ancestry is publisher-declared or explicitly unavailable;
- exact publication identity is validated before official attribution;
- no default input can imply baseline/applicability/authorization selection;
- every meaningful selection/filter survives refresh, back/forward, and copied links;
- mobile and 200% zoom preserve controls, meaning, and available information;
- no Critical or High copy finding remains;
- Learn contains useful explanation or is not exposed;
- Resources is findable from Home and as an equal Build lane;
- the regression suite exercises canonical live routes, not retired recovery surfaces.
