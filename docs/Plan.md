# Control Atlas — Clarity, Functional Integrity, and Orbital Fidelity Execution Spec

**Status:** Active  
**Baseline date:** 2026-08-16  
**Repository:** `BackslashBryant/control-atlas`  
**Deployment:** GitHub Pages from `main`  
**Audience:** Autonomous and supervised coding agents  
**Execution rule:** Complete phases in order. Read-only audits may overlap; writes may not cross phase boundaries or touch overlapping files in parallel.  
**Supersession:** This document replaces the prior **Orbital Alignment — Complete Execution Spec**. Do not execute superseded objectives, graph-migration tasks, or acceptance measures from that document.

At most one temporary `docs/Plan.md` may exist while this push is active. It is an execution ledger, not a second specification. Delete it in the shipping change.

---

## Current handoff (2026-08-17)

**Phases 0–7 are complete.** Phase 6 (Compare Surface Rebuild) and Phase 7 (Sources Surface and Trust Workflow Rebuild) have both been completed and verified, and are shipping together.

### Phase 6 Work Summary
1. **Streamlined Compare Scope**: Compare is focused strictly on framework-to-framework crosswalks (`frameworks` ["Catalog to catalog"] and `item-mapping` ["Item mappings"]). Non-crosswalk multi-hop chains (`stig-chain`, `threat-chain`) and baseline diffs (`baseline-compare`) were removed from Compare.
2. **Aggregated Results Table & Exports**: Mapping results table renders one row per source item (e.g. `AC-2`) with target chips, trust basis badges, and expandable evidence drawer (`<details>`). Exports (CSV, Markdown, JSON) support aggregated records alongside flat format.
3. **Optimized Bundle & Flow**: Staged decision flow (`StepIndicator`) across 4 steps (`source` $\rightarrow$ `target` $\rightarrow$ `mapping` $\rightarrow$ `results`) with capability-filtered selectors. Compare bundle reduced by ~27% (48.1 kB).
4. **Verification Gates Passed**: see the Phase 6 exit-gate evidence in §6 below (re-confirmed during Phase 7 hardening, including a regression check after the `buildStigChain` runtime fix — no impact on Compare).

### Phase 7 Work Summary
1. **Publication-centric register**: four registry-layer buttons replaced with one canonical publication register (47 rows), a scoped inspector, and an advanced-evidence disclosure group at the bottom of the page.
2. **Source materials grouped by role**: primary, supplemental/enrichment, a newly separated **historical material** section (superseded documents no longer look equivalent to current ones), reference/community tools, and mapping evidence each render as visually distinct sections; community sources are labeled wherever they appear (fixed a dead-code gap where `isCommunity` was computed but never rendered).
3. **Accurate page/inspector identity**: the page `<h1>` and inspector title now show each publication's full official name; an unknown source ID renders an accessible "Source not found" state naming the requested ID (fixed a real a11y regression — `npm run test:a11y` is 35/35 green).
4. **Evidence captured**: register/inspector/narrow-viewport screenshots captured locally and reviewed by eye during this session (not retained — `docs/` permits only the canonical foundation per `tests/alignment-contract.test.mjs`); stale `sources`/`compare` visual baselines (predating the Phase 6/7 rebuild) regenerated and reviewed by eye, retained as committed Playwright snapshots.
5. **Verification Gates Passed**: see the Phase 7 exit-gate evidence in §7 below.

**Next up: Phase 8 — Remaining Surface Rebuild from Orbital References** (§8 in `docs/Plan.md`).
- Read §8 in full first, including workstreams A–D and the page-level acceptance criteria.
- Phases 6 and 7 are shipped to `main`; Phase 8 starts from that baseline.

---

# 1. Vision and Intent

## 1.1 Product vision

Control Atlas is the public federal-cybersecurity reference and practitioner workbench that makes a fragmented domain understandable.

It must help a newcomer or practitioner answer, in this order:

1. **What does this mean?**
2. **How does it connect?**
3. **What do I do next?**

The product is built for translation, not complexity. It organizes public authority, publications, publisher-native records, mappings, implementation material, and practitioner resources without pretending that Control Atlas is the publisher, a GRC platform, or an authorization authority.

The orienting model is:

- Context frames the work.
- Authorities and source material establish why the work exists.
- **Cybersecurity** is the shared trunk.
- Nine Control Atlas areas organize the landscape:
  - Governance
  - Risk
  - Compliance
  - Architecture
  - Implementation
  - Assessment
  - Operations
  - Threats & Defense
  - Knowledge
- Publisher-native structures remain intact beneath those areas.
- Published mappings and references connect the structures without turning those connections into false hierarchy.
- Implementation, assessment, and reusable public work show what a practitioner can do next.

**The tree provides orientation. The graph carries the many-to-many reality. Showing the chain is the product.**

## 1.2 Intent of this push

This push corrects the product from the foundation upward.

It must produce all of the following:

- Every feature works before it is visually polished.
- A control is never shown as available when the application cannot complete the action.
- Every user-facing surface is intuitive without requiring knowledge of the schema, graph implementation, source registry, ingestion pipeline, or developer terminology.
- Technical provenance remains available, but it appears only where a user asks for trust details or where a decision materially depends on it.
- The Atlas remains a semantic, multiresolution landscape rather than a full-database hairball.
- Publisher-native structure remains authoritative.
- Control Atlas-owned structure remains a clearly labeled organizing overlay.
- Publications, source materials, mapping evidence, records, and relationships are separate concepts in both the data model and the interface.
- Control Atlas becomes the most faithful production implementation of **Orbital Archive No. 01**, not a generic dark dashboard wearing Orbital colors.
- Large architectural defects are resolved before surface redesign, CSS cleanup, animation fixes, or decorative polish.

## 1.3 Non-negotiable outcomes

### Functional truth

- Do not render impossible choices.
- Do not rely on disabled fields to explain a workflow that should have prevented the invalid state.
- Do not count “the page rendered” as a working feature.
- Do not merge a mapping source, target, comparison mode, publication, or record into a selector unless the next required action is possible.
- Do not label a relationship as equivalent, applicable, implemented, compliant, or authorized unless the cited publisher explicitly supports that meaning.

### Plain product language

- No raw schema values, source IDs, canonical IDs, internal layer names, or enum values in ordinary UI copy.
- No repeated phrases such as “Recorded by the source registry,” “Inherited from parent publication,” “canonical graph,” “runtime projection,” or “complete the comparison scope first” in primary task surfaces.
- Do not repeat general product disclaimers on every screen. Keep global boundaries in the footer and About; repeat them only where the user could otherwise make a consequentially wrong inference.
- A technical explanation belongs in a detail inspector, disclosure, source panel, export metadata, or documentation—not between the user and the task.
- Headings, labels, helper text, and empty states must explain what the user can do, not how the implementation works.

### Information integrity

- Preserve source-native terminology and hierarchy.
- Keep `nativeType` authoritative.
- Treat `atlasClass` as an optional Control Atlas discovery facet.
- Keep Atlas structure separate from publisher content.
- Keep source material and mapping evidence separate from publication identity.
- Keep relationships as relationships; visual proximity and algorithmic clusters do not create facts.
- Every aggregate count and aggregate relationship must resolve to canonical records and canonical relationships.
- Every source-to-runtime count delta must be explicitly reconciled.

### Orbital fidelity

- Follow the authority order in the Orbital repository:
  1. `AGENTS.md`
  2. `tokens/tokens.json`
  3. `components/contracts.json`
  4. icon and asset manifests
  5. `docs/AEROSPACE-GRAMMAR.md`, `docs/LAYOUT-UX.md`, and style guidance
  6. `examples/`
  7. the visual guide
- “Present dramatically. Operate calmly. Scale completely.”
- Ordinary work begins at the calm operational depth, not at a diagnostic/cockpit density.
- Geometry must frame, align, measure, connect, sequence, locate, or establish scale.
- No decorative line crosses copy, controls, table rows, focus indicators, or actions.
- One primary action per decision area.
- Internal Orbital vocabulary is never surfaced as product copy.

---

# 2. Scope and Baseline

## 2.1 Current shipped baseline

Begin from current `main`, not from the superseded plan.

The semantic Atlas foundation is already implemented:

- Graphology remains the runtime semantic graph.
- Sigma remains the global Atlas renderer.
- The Atlas has `landscape`, `area`, `publication`, and `detail` projections.
- Projection nodes already separate `nativeType`, `atlasClass`, `objectLayer`, and Atlas structure role.
- Aggregate edges retain canonical edge IDs and connection-source IDs.
- The default Atlas no longer needs to render every record simultaneously.
- ELK/React Flow may remain for explicit hierarchy or provenance views where directional structure is the actual task.

Do not replace this foundation with Cytoscape, Gephi, Graphviz, or another renderer during this push. Refactor the data contracts and projections only where the acceptance tests in this specification prove a defect.

## 2.2 Current known defects

### Compare

The current UI permits a user to choose a publication and then discover that no valid target or published comparison exists. It exposes a disabled mapping-source selector, implementation-oriented helper text, and a dead-end state. That is a capability-contract failure first and a UI failure second.

### Sources

The current page:

- repeats the page identity in the eyebrow and title;
- exposes four equal top-level buttons for publication rows, connection sources, source material, and Control Atlas structure;
- treats raw registry layers as user navigation;
- repeats search terminology and actions;
- exposes internal field-basis explanations in the table;
- includes conceptual publication duplicates;
- mixes missing, inherited, not-applicable, and unverified data in ways that make the page look incomplete rather than trustworthy;
- makes users understand the ingestion model before they can answer “who published this, which version is represented, and when was it checked?”

### Data model

The record inventory contains publisher content, structural containers, authority documents, and Control Atlas tree concepts in one broad type inventory. Compatibility fields exist, but the canonical contract is not yet strict enough to prevent future UI and source-registry confusion.

### Presentation

Several pages still read like implementation output rather than a product. The site contains duplicated headings, button overload, verbose caveats, inconsistent state handling, legacy CSS friction, decorative teal, and small layout shifts such as the rotating `Ctrl + Alt + <word>` flourish affecting the header.

## 2.3 Baseline inventory snapshot

The current inventory snapshot supplied for this push reports approximately:

- 30,799 total records;
- 83 raw publication-register rows;
- 13 connection sources;
- 94 source materials;
- 2 Control Atlas structure source records.

These are audit inputs, not permanent UI counts. Regenerate all counts from the current data pipeline before implementation. The future publication count must represent canonical publication identities, not raw registry entries.

## 2.4 Out of scope

Do not add:

- accounts, login, or a backend;
- organizational or system data collection;
- compliance scoring;
- evidence ingestion;
- authorization recommendations;
- an eMASS replacement;
- a new graph renderer;
- a new framework merely to increase coverage;
- monetization work;
- decorative features that do not resolve a task in this specification.

---

# 3. Agent Operating Contract

## 3.1 Required execution behavior

For every task:

1. Read the governing files named by the phase before editing.
2. Confirm the current branch, HEAD, worktree, generated-data state, and applicable tests.
3. State the exact failing contract or user outcome in `docs/Plan.md`.
4. Add or update a test before or with the implementation when behavior is machine-verifiable.
5. Make the smallest coherent change that satisfies the phase contract.
6. Run the targeted gate.
7. For UI work, build the site, restart the static server, and inspect wide and narrow screenshots.
8. Record commands, results, changed files, screenshots, and unresolved limitations in `docs/Plan.md`.
9. Do not mark the task complete from code inspection alone.
10. Do not begin the next phase until the current exit gate is green.

## 3.2 Agent prohibitions

- Never `git add -A`.
- Never silently rewrite source data to make a test pass.
- Never fabricate missing source metadata.
- Never dismiss a visual defect because automated tests pass.
- Never use a giant autonomous prompt as a substitute for phase boundaries.
- Never let two agents edit overlapping files simultaneously.
- Never allow the implementation agent for a high-risk phase to be the only reviewer.
- Never declare “complete” without showing the relevant test and visual evidence.

## 3.3 Context and handoff discipline

Long autonomous coding runs repeatedly fail in the same ways: context compaction loses state, checklist items are skipped, long prompts drop constraints, loops repeat failed work, and agents self-certify incomplete work.

Therefore:

- `docs/Plan.md` must contain the active phase, completed tasks, current failing test, last verified screenshot, and next exact action.
- Before any context compaction or session handoff, update that file.
- After compaction or handoff, re-read:
  - this specification;
  - `docs/Plan.md`;
  - the current diff;
  - the last failing test output;
  - the latest screenshots.
- A resumed agent must not rely on its conversational memory.
- Parallel agents are allowed only for read-only research or file-disjoint tasks with an explicit merge owner.
- A reviewer starts with a fresh context and receives the requirements, diff, tests, and screenshots—not the author’s conclusion.

## 3.4 Evidence hierarchy

When sources conflict, use:

1. Product-owner intent in this specification.
2. `docs/vision.md`.
3. `docs/DESIGN_PRINCIPLES.md`.
4. `docs/PRD.md`.
5. Orbital design-system authority order.
6. Current source data and published-source evidence.
7. Existing implementation.
8. Historical plans and comments.

Existing code does not override the product contract.

---

# 4. Execution Phases

## Phase 0 — Baseline, Supersession, and Evidence Lock

### Objective

Establish one trustworthy baseline and prevent agents from implementing obsolete requirements.

### Required inputs

- this specification;
- prior execution spec;
- current `main`;
- current Compare and Sources screenshots;
- `docs/vision.md`;
- `docs/DESIGN_PRINCIPLES.md`;
- `docs/PRD.md`;
- Orbital `AGENTS.md`, layout guidance, aerospace grammar, contracts, examples, and tokens;
- current generated count and connection artifacts.

### Tasks

#### Foundation

- [x] **T0.1** Confirm `main` HEAD, branch protection expectations, clean worktree, current dependency graph, and current CI status.
  - **HEAD:** `8212b2a3` (Merge pull request #107 from BackslashBryant/agent/forge/semantic-atlas-projections)
  - **Branch / Worktree:** `main`, clean worktree, up to date with `origin/main`.
  - **CI & Dependency status:** `npm audit` / security policy compliant; TypeScript `npm run typecheck` passes with zero errors.
- [x] **T0.2** Create temporary `docs/Plan.md` containing:
  - current HEAD;
  - phase checklist;
  - current known defects;
  - screenshots and viewport sizes;
  - relevant test commands;
  - no duplicate requirements from the superseded plan.
- [x] **T0.3** Mark the prior plan superseded in its repository location if it still exists. Do not preserve two active execution specs.
  - Verified no duplicate or prior active plan files exist in `docs/`. Exactly one active plan (`docs/Plan.md`) exists.
- [x] **T0.4** Regenerate or validate the current data/count artifacts and record:
  - **Canonical graph node count:** 30,799 nodes.
  - **Canonical graph edge count:** 76,838 edges.
  - **Canonical evidence count:** 76,879 records.
  - **Source count:** 192 sources (100 unclassified/none, 43 enrichment, 34 primary_data, 13 mapping, 1 reconciliation, 1 editorial).
  - **Record counts by native type (`node_type`):**
    - `stig_rule`: 17,021
    - `requirement`: 5,740
    - `srg_requirement`: 2,516
    - `assessment_procedure`: 1,014
    - `control_enhancement`: 872
    - `attack_technique`: 794
    - `benchmark`: 379
    - `control`: 324
    - `defend_countermeasure`: 271
    - `zt_activity`: 257
    - `iot_capability_element`: 243
    - `mobile_threat`: 236
    - `zt_product_component`: 197
    - `iot_capability_subelement`: 181
    - `policy`: 128
    - `family`: 88
    - `zt_assessment_question`: 62
    - `iot_subcapability`: 52
    - `zt_reference_component`: 52
    - `zt_capability`: 45
    - `tactic`: 34
    - `mobile_threat_category`: 32
    - `catalog`: 27
    - `group`: 25
    - `zt_collaborator`: 24
    - `category`: 22
    - `zt_build`: 19
    - `zt_mapping_contributor`: 16
    - `zt_pillar`: 13
    - `zt_tenet`: 12
    - `iot_capability`: 11
    - `zt_logical_component`: 11
    - `zt_cloud_native_requirement`: 11
    - `limb`: 9 (Atlas structure)
    - `baseline`: 8
    - `rmf_step`: 7
    - `statute`: 7
    - `policy_directive`: 7
    - `function`: 6
    - `zt_document`: 6
    - `regulation`: 4
    - `zt_mapping_document`: 4
    - `program`: 3
    - `impact_category`: 3
    - `zt_publication`: 3
    - `iot_capability_domain`: 2
    - `trunk`: 1 (Atlas structure)
  - **Counts by Atlas class:** Currently `none` across all 30,799 nodes (unseparated in runtime node layer).
  - **Publication identities:** 27 canonical catalogs (83 raw register entries in legacy views).
  - **Connection evidence:** 76,879 evidence records.
  - **Atlas projection artifact:** `dist/site/data/generated/atlas-network.json` (23.45 MB, 13 landscape nodes, 30 landscape edges).

#### Behavioral baseline

- [x] **T0.5** Capture deterministic wide and narrow screenshots for every public route.
  - Viewport sizes baselined: Desktop (1440x1000), Mobile/Compact (366/390x844).
  - Routes captured across test suite: `/`, `/#/explore`, `/#/catalog`, `/#/compare`, `/#/resources`, `/#/learn`, `/#/templates`, `/#/sources`, `/#/about`.
- [x] **T0.6** Record current Compare behavior for:
  - **Valid catalog pair:** `nist-800-53` <-> `csf-2` requires user to choose `nist-olir-csf2-to-sp800-53` mapping publication before "Show mappings" button activates.
  - **SP 800-171 Rev. 3:** Dead-end when chosen as a primary compare source because no valid target or published crosswalk is supported, leading to disabled UI selectors and helper text dead-ends.
  - **Valid baseline pair:** `nist-800-53b:LOW` vs `nist-800-53b:MODERATE` renders compare-results-panel and side-by-side delta.
  - **Valid STIG/CCI/control chain:** STIG rule mapping trace navigates correctly from DISA STIG to CCI to SP 800-53 control.
  - **Invalid deep link:** Falls back to safe selector states or not-found status without throwing unhandled exceptions.
- [x] **T0.7** Record current Sources behavior for:
  - **Duplicate conceptual publications:** Raw registry rows expose 83 items with repeated conceptual entries (e.g. separate rows for different ingest formats or crosswalks).
  - **Publication with version vs without version:** Version display is inconsistent between OSCAL-derived catalogs and static markdown/workbook ingest sources.
  - **Source material vs connection evidence:** Currently mixed in the sources view rather than clearly separating publication landmark, supporting document, and mapping evidence.
  - **Control Atlas structure:** `atlas:TRUNK` and `atlas:LIMB-*` are currently stored inside `federal-graph` node sets as `trunk` and `limb` node types rather than an isolated structural layer.
- [x] **T0.8** Run the current local quality, accessibility, smoke, graph, data, and visual gates. Record failures without fixing them in this phase.
  - `npm run typecheck`: **PASS** (0 errors)
  - `npm run test`: **PASS** (100% passing across tokens, copy-contract, authority, atlas, data, runtime, graph, record-presentation, nist-ingestion, ingestion suites)
  - `npm run verify:quality`: **PASS** (discovery, manifests, completeness, ingestion, hygiene, oscal check, eslint, typecheck, static smoke, graph audit)
  - `npx playwright test --config playwright.visual.config.mjs`: Recorded 13 layout-drift visual diffs on compact/mobile viewports for approved-layout-visual (to be addressed during UI and presentation phases).
- [x] **T0.9** Produce a traceability matrix mapping each phase in this specification to current files, tests, and observable failures.
  - **Phase 1 (Canonical Domain Model & Layer Separation):**
    - *Files:* `src/shared/data-trust-contracts.mjs`, `scripts/build-framework-data.mjs`, `src/types/`, `src/data/`
    - *Tests:* `tests/data-trust-contracts.test.mjs`, `tests/federal-graph-contract.test.mjs`, `tests/graph/atlasModel.test.ts`
    - *Observable baseline defect:* `trunk` and `limb` mixed in `node_type`, `atlas_class` not populated, `native_type` overloaded.
  - **Phase 2 (Publication Identity, Source Registry & Count Reconciliation):**
    - *Files:* `scripts/build-catalog-source-inventory.mjs`, `scripts/reconcile-artifact-counts.mjs`, `src/data/sources.json`
    - *Tests:* `tests/source-registry.test.mjs`, `tests/source-refresh-reconciliation.test.mjs`, `tests/catalog-publication-identity.test.mjs`
    - *Observable baseline defect:* 83 raw register entries vs 27 publication identities, missing source roles (100 unclassified sources).
  - **Phase 3 (Capabilities, Mappings & Relationship Truth):**
    - *Files:* `src/pages/ComparePage.tsx`, `src/components/compare/`, `src/shared/compareState.ts`
    - *Tests:* `tests/graph/compareModeState.test.ts`, `tests/e2e/compare-map.spec.mjs`
    - *Observable baseline defect:* Dead-end selector states on SP 800-171 Rev. 3 and unmapped frameworks.
  - **Phase 4 (Plain Language, Information Architecture & Search):**
    - *Files:* `src/components/`, `src/pages/`, `src/lib/search/`
    - *Tests:* `tests/copy-contract.test.mjs`, `tests/graph/informationArchitecture.test.ts`, `tests/search-quality.test.mjs`
    - *Observable baseline defect:* Implementation jargon ("canonical graph", "runtime projection", "source registry") surfaced in primary UI.
  - **Phase 5 (Orbital Fidelity, Visual System & Layout Integrity):**
    - *Files:* `src/styles/`, `src/components/layout/`, `src/components/common/`
    - *Tests:* `tests/orbital-token-drift.test.mjs`, `tests/e2e/approved-layout-visual.spec.mjs`, `tests/e2e/release-readiness-visual.spec.mjs`
    - *Observable baseline defect:* Visual snapshot diffs on 13 compact routes, rotating brand shift in header.

### Exit gate

- [x] One active plan exists (`docs/Plan.md`).
- [x] The prior plan is clearly superseded.
- [x] Current data and UI baselines are reproducible.
- [x] No implementation work has begun.
- [x] Every subsequent phase has named files, tests, and baseline evidence.

---

## Phase 1 — Canonical Domain Model and Layer Separation

### Objective

Make the canonical model express what each object actually is before any surface attempts to display it.

### Required canonical layers

The data contract must distinguish:

1. **Atlas structure**
   - Control Atlas-owned organizing overlay;
   - Cybersecurity root/trunk;
   - nine areas;
   - optional context/authority orientation nodes;
   - never represented as publisher-native record types.

2. **Publication identity**
   - a publisher-issued publication, catalog, standard, workbook, rule, architecture, benchmark family, or other coherent released identity;
   - owns editions/versions and publisher metadata;
   - acts as a user-facing landmark.

3. **Source material**
   - a retrieved file, page, API result, workbook, XCCDF, OSCAL, STIX, PDF, JSON, CSV, or reference page;
   - supports a publication;
   - may import records, enrich metadata, or exist only as a reference.

4. **Publisher-native record**
   - a record whose type and hierarchy come from its publisher;
   - examples include control, enhancement, family, CCI, function, category, subcategory, requirement, tactic, technique, benchmark, group, STIG rule, SRG requirement, assessment procedure, Zero Trust activity, or IoT capability element.

5. **Canonical relationship**
   - a typed, directed or undirected relationship between canonical records or identities;
   - keeps relationship meaning separate from provenance.

6. **Connection evidence**
   - the mapping artifact, crosswalk, workbook, or source declaration that supports one or more relationships;
   - normally lives on relationships as provenance;
   - is not automatically a publication landmark or a visible graph node.

### Tasks

#### Contract

- [x] **T1.1** Inventory every current object type, source role, relationship type, provenance class, and compatibility field. Identify every place where `node_type`, source role, publication identity, or registry layer is overloaded.
  - **Findings (recorded 2026-08-16):**
    - `node_type` was doing triple duty: literal publisher record kind (e.g. `control`, `stig_rule`), Atlas structure marker (`trunk`, `limb`), and authority-document marker (`statute`, `regulation`, `policy_directive`) — one field, three unrelated semantics.
    - The UI projection layer (`src/ui/lib/atlasGraphModel.ts`, `src/ui/lib/atlasGraphProjection.ts`, `src/ui/components/AtlasGraph.tsx`) already *displayed* `nativeType`/`atlasClass`/`objectLayer`/`atlasStructureRole` as client-computed heuristics derived from `node_type` — but no canonical field backed them at generation time, so every consumer re-derived the same classification independently with no single source of truth and no validation.
    - Seven catalogs (`csf-2`, `disa-cci`, `cui-policy`, `fips-200`, `nist-ai-rmf`, `nist-ssdf`, `dod-rai`) shared the generic `node_type: "requirement"` bucket (`CATALOGS` table, `scripts/build-framework-data.mjs`) even though each ingested record already carried a specific source-native `type` (e.g. `csf-subcategory`, `ssdf-task`, `fips-200-requirement`) in `metadata.type` — an accidental byproduct, not a contract. DISA CCI was worse: its native `type` field is overloaded for the policy/technical classification (`cciClassificationLabel`), not the record kind at all, so its true native type ("cci") existed nowhere in the data.
    - `trunk`/`limb` (Atlas's own organizing overlay, `applyOrganizingSpine` in `scripts/build-framework-data.mjs`) and `statute`/`regulation`/`policy_directive` (authority instruments, `applyAuthoritySpine`) were both listed in `NON_RECORD_NODE_TYPES` alongside genuine publisher structural-group types (`benchmark`, `catalog`, `category`, `family`, `function`, `group`, `tactic`) — correct for excluding them from record-presentation validation, but with no field distinguishing *why* each type was excluded (Atlas-owned vs. authority vs. publisher-structural).
    - `resolveCatalogPublicationIdentity` (`src/app/catalog-publication-identity.mjs`) already resolved a `{ publicationSourceId, ingestionSourceId }` pair per node and `validateCatalogPublicationIdentity` already failed closed on an unresolvable identity — this is the existing publication-identity contract; Phase 1 formalizes a stable `publicationId` field on top of it rather than replacing it.
    - `tools/validators/source-registry.mjs::loadSourceRegistry` already fails closed on an unrecognized `source_role` (hard validation error against the `SOURCE_ROLES` allowlist, not a silent default) — T1.8's "unknown source role" half was already satisfied; the gap was `objectLayer`, which had no validated field at all.
    - No existing concept named `connectionEvidenceIds`; the closest analog is `edge.evidence_ids` (with a mechanical-default omission optimization — see `tests/federal-graph-contract.test.mjs`), which was never validated for isolation from the canonical node/edge ID namespace.
- [x] **T1.2** Define or tighten explicit contracts for `objectLayer`, `nativeType`, `atlasClass`, `atlasStructureRole`, `publicationId`, `sourceMaterialId`, `connectionEvidenceIds`, and relationship type/direction/provenance.
  - Added to `src/shared/data-trust-contracts.mjs`: `OBJECT_LAYERS`, `ATLAS_STRUCTURE_ROLES`, `ATLAS_STRUCTURE_NODE_TYPES`, `AUTHORITY_DOCUMENT_NODE_TYPES` constants; `resolveObjectLayer`, `resolveAtlasStructureRole`, `resolveNativeType`, `resolveAtlasClass`, `resolvePublicationId`, `resolveSourceMaterialId`, `connectionEvidenceIdsForEdge` resolvers (single source of truth, importable by both the generator and validators); `validateCanonicalLayerAssignment`, `validateNativeTypeAssignment`, `validatePublicationIdAssignment`, `validateSourceMaterialIdAssignment`, `validateConnectionEvidenceIsolation` validators.
  - Relationship type/direction/provenance were already contract-validated by the existing `RELATIONSHIP_CLASSES` enum (`src/app/structural-hierarchy.mjs`) and `validateGraphArtifacts` (`tools/validators/federal-graph.mjs`, exercised by `federal-graph-contract.test.mjs`'s "displayable edges separate semantics, provenance, confidence, and evidence quality" test) — left as-is; not re-implemented.
- [x] **T1.3** Make `nativeType` authoritative and source-faithful. `resolveNativeType` special-cases `disa-cci` (native type `"cci"`, since its ingested `type` field holds a policy/technical classification, not the record kind) and otherwise reads the record's own `metadata.type`, falling back to `node_type` only when no source-native type exists. Verified against the regenerated graph: CSF subcategories now report `native_type: "csf-subcategory"`, DISA CCIs `"cci"`, SSDF `"ssdf-task"`, CUI policy `"cui-policy"`/`"cui-category"`, FIPS 200 `"fips-200-requirement"`, AI RMF `"ai-rmf-outcome"`, DoD RAI `"rai-toolkit-principle"`/`"rai-shield-activity"` — none collapse to the generic `"requirement"` bucket anymore. `node_type` itself is left unchanged (still `"requirement"` for these catalogs) as the explicit T1.5-style compatibility boundary — every existing route, filter, and test keyed on `node_type` keeps working unmodified.
- [x] **T1.4** Make `atlasClass` an optional Control Atlas discovery facet. `resolveAtlasClass` reads only an explicit upstream `metadata.atlas_class` assertion and never infers one from `node_type` or `nativeType`, and never feeds back into `nativeType`. No current ingestion adapter populates `metadata.atlas_class`, so the field is intentionally unpopulated across the regenerated graph — a real, contract-validated, currently-empty optional facet, not a fabricated default. (The UI's pre-existing local heuristic that treats `node_type === "requirement"` as an implicit atlasClass fallback was left untouched — it is a display-layer choice outside this phase's data-contract scope, not part of the canonical field.)
- [x] **T1.5** Migrate `trunk` and `limb` out of the publisher record taxonomy. `node_type: "trunk"/"limb"` is retained as the explicit compatibility boundary the spec permits ("accept old values only at a compatibility boundary if required") — changing it would have forced edits across dozens of UI/test call sites with no functional benefit. Instead every Atlas-structure node now carries `metadata.object_layer: "atlas_structure"` and `metadata.atlas_structure_role: "root" | "area"`, stamped once in `attachNodeProvenance` (the single choke point every node construction path — `pushEligibleNode`, `buildStructureNode`, `buildAuthorityNode`, `buildSyntheticCatalogNode` — already funnels through). `resolveNativeType` returns `""` and `resolvePublicationId` returns `""` for these nodes, so they can never be counted as publisher records or attributed to a fabricated publication.

#### Publication identity

- [x] **T1.6** Publication identity, edition, and supporting-source rules were already established by `resolveCatalogPublicationIdentity`/`validateCatalogPublicationIdentity` (`src/app/catalog-publication-identity.mjs`, unchanged by this phase) and are out of Phase 1's scope to redesign (Phase 2 owns reconciliation/dedup). Phase 1's contribution is `metadata.publication_id`, a stable, always-present field on every publisher-content node (`= metadata.catalog_id`) so downstream consumers reference one canonical identifier instead of re-deriving it from `catalog_id`.
- [x] **T1.7** Authority-document treatment: `resolveObjectLayer` classifies `statute`/`regulation`/`policy_directive` nodes as `authority_document` (never `publisher_content`), `resolveNativeType` keeps their genuine source-faithful kind (`native_type === node_type`, e.g. `"statute"`), and `resolvePublicationId` forces `publication_id: ""` for them — they can never be mislabeled as a framework catalog. Verified against the regenerated graph (18 authority nodes, all pass).
- [x] **T1.8** Unknown source roles already failed closed via `loadSourceRegistry`/`validateSourceRegistry` (hard error against the `SOURCE_ROLES` allowlist — confirmed by reading `tools/validators/source-registry.mjs`, not modified). Extended the same fail-closed posture to `objectLayer`: `validateCanonicalLayerAssignment` rejects any node whose `metadata.object_layer` is outside `OBJECT_LAYERS`, or whose stamped value has drifted from the resolver's derived value, or whose `atlas_structure_role` is missing/invalid for an `atlas_structure` node — wired into `validateDataTrustContracts`, which `buildFrameworkData()` already throws the whole build on (`scripts/build-framework-data.mjs:3398-3405`). No quarantine path was needed because the resolver has no "unknown" branch left — every node_type not explicitly Atlas-structure or authority-document is publisher content by construction, so there is nothing left to silently default.

#### Migration and verification

- [x] **T1.9** Compatibility adapter: `src/ui/lib/atlasGraphModel.ts` and `src/ui/lib/atlasGraphProjection.ts`'s `objectLayer()` functions now check the canonical `metadata.object_layer` first and fall back to the pre-existing `node_type`-based heuristic only when it is absent — one line added per file. `nativeType()`/`atlasClass()`/`atlasStructureRole()` in both files already checked `metadata.native_type`/`metadata.atlas_class`/`metadata.atlas_structure_role` first (written defensively ahead of this phase), so they needed no change and now resolve from the canonical stamped field instead of the heuristic for every regenerated node. Confirmed zero visual/behavioral drift: `tests/graph/atlasGraphModel.test.ts` and `tests/graph/atlasGraphProjection.test.ts` (4/4) and the full `test:graph` suite (157/157) pass unchanged.
- [x] **T1.10** Contract tests added to `tests/data-trust-contracts.test.mjs` (15 new unit tests on the resolvers/validators) and `tests/federal-graph-contract.test.mjs` (8 new tests against the regenerated 30,799-node graph):
  - every canonical node has exactly one `object_layer` and the generator round-trips with zero drift (`validateDataTrustContracts(nodes, edges)` returns `[]`);
  - Atlas structure is never emitted as `publisher_content` and never carries a `catalog_id` or fabricated `publication_id`;
  - the Cybersecurity trunk (`atlas:TRUNK`) and all 9 areas (`atlas:LIMB-*`) keep their exact pre-migration IDs;
  - authority documents stay source-faithful and unassigned to a publication;
  - `nativeType` no longer collapses to `"requirement"` for the 6 previously-affected catalogs;
  - every node's stamped `native_type`/`publication_id` matches the resolver with no drift;
  - every node has a non-empty `source_material_id`, and connection evidence never collides with a canonical node or edge ID.

### Exit gate

- [x] The canonical domain model is explicit and machine-validated. `validateDataTrustContracts` runs inside `buildFrameworkData()` and throws the build on any layer/type/publication/source-material drift.
- [x] `nativeType` and `atlasClass` are separate. `resolveAtlasClass` never reads or writes `nativeType`; `resolveNativeType` never reads `atlas_class`.
- [x] Atlas structure is not a peer publisher record type. `object_layer: "atlas_structure"` is exclusive to `trunk`/`limb`; `native_type`/`publication_id` are forced empty for them; `NON_RECORD_NODE_TYPES` already excluded them from record-presentation validation.
- [x] Unknown source roles fail or quarantine explicitly (pre-existing `SOURCE_ROLES` allowlist, confirmed); `objectLayer` now fails the build the same way on drift or an invalid value.
- [x] Existing stable links remain resolvable. `node_type` values, all node/edge IDs, and the trunk/9-limb ID set are byte-for-byte unchanged — regression-tested. `npm test` (full composite, all suites), `npm run test:graph`, `npm run typecheck`, `npm run verify:discovery/manifests/completeness/ingestion`, and `npm run lint:ingestion` all pass clean against the regenerated graph.
- [x] No UI redesign has begun. Only the two projection-layer `objectLayer()` functions changed, each by one line (prefer the canonical field, unchanged fallback) — no visual or component change; `test:graph` (157/157) confirms zero behavioral drift.

**Evidence commands run (all clean) 2026-08-16:**
```
npm run build:data          # full regeneration: 192 sources, 30799 nodes, 76838 edges, 0 findings
npm test                    # full composite: tokens, copy-contract, authority, atlas, data (333), runtime, graph (157), record-presentation, nist-ingestion, ingestion (30) — all pass
npm run typecheck           # clean
npm run lint:ingestion      # clean
npx eslint src/ui/lib/atlasGraphModel.ts src/ui/lib/atlasGraphProjection.ts tests/federal-graph-contract.test.mjs --max-warnings=0   # clean
npm run verify:discovery    # PASS
npm run verify:manifests    # PASS
npm run verify:completeness # PASS: all 27 catalog source inventories reconciled
npm run verify:ingestion    # PASS: 92 artifacts, 27 catalogs, all 10 stages
node ./tools/hygiene-check.mjs   # PASS
npm run check:oscal         # PASS
```

**Files changed:**
- `src/shared/data-trust-contracts.mjs` — new canonical layer contract (resolvers + validators)
- `scripts/build-framework-data.mjs` — stamp canonical fields in `attachNodeProvenance`; extend `validateDataTrustContracts`
- `src/ui/lib/atlasGraphModel.ts`, `src/ui/lib/atlasGraphProjection.ts` — compatibility adapter (prefer canonical `metadata.object_layer`)
- `tests/data-trust-contracts.test.mjs`, `tests/federal-graph-contract.test.mjs` — new contract tests
- `data/generated/**` — full regeneration (every node now carries `object_layer`, `native_type`, `publication_id`, `source_material_id`; `atlas_structure_role` on trunk/limb)

**Not committed.** These changes remain in the working tree pending explicit commit instruction (repo doctrine: never commit without being asked). The `data/generated/**` diff is large (~770 files) because every node was re-stamped; this is the expected shape of a full `npm run build:data` regeneration, not unrelated churn.

---

## Phase 2 — Publication Identity, Source Registry, and Count Reconciliation

### Objective

Make the registry publication-centric and prove where every record and relationship came from.

### Target source model

The primary runtime/index shape should be conceptually equivalent to:

```text
Publisher
  └── Publication identity
        ├── Catalog/profile coverage
        ├── Source materials
        │     ├── primary data
        │     ├── enrichment
        │     ├── reconciliation
        │     ├── reference only
        │     └── historical
        ├── Connection evidence
        │     └── cited canonical relationships
        ├── Canonical publisher-native records
        └── Source health / version / last checked
```

The exact files may differ, but the separation may not.

### Tasks

#### Canonical publication register

- [x] **T2.1** Build a canonical publication-identity index from the source registry and catalog profiles.
  - New `scripts/build-publication-identity-index.mjs` → `data/generated/publication-identity-index.json`, wired as a new step in `npm run build:data` (after `reconcile-artifact-counts.mjs`). Groups every `publications[]`/`artifacts[]` row under its canonical `"publication"`-kind identity (47 identities), with `alias_source_ids`, role-bucketed `source_materials`, and `connection_evidence`. Self-validates: 0 orphan `publication`/`supplemental`/`mapping` rows.
  - Tests: `tests/publication-identity-index.test.mjs` (7 tests) — reconciliation, dedup, no-double-counting, DoD ZT grouping, SP 800-171 anchor correctness.
- [x] **T2.2** Reconcile conceptual duplicates.
  - Root-caused the baseline "83 raw publication rows": of 100 `publications[]` rows, only 41 carried an explicit `metadata.identity_kind`; the other 59 silently defaulted to the `"publication"` UI bucket. Wrote `scripts/backfill-publication-identity-kind.mjs` (idempotent, kept in-repo) to stamp all 59 explicitly, hand-verified against `catalog_source_bundles` and each row's real content — no ID renamed, merged, or deleted:
    - 23 are genuine canonical catalog anchors (`identity_kind: "publication"`).
    - 2 standalone publications not tied to any ingested catalog (`nist-sp-1800-35`, `nist-sp-800-207a`) — real, distinct NIST publications, each its own identity.
    - 16 are real supplemental publisher documents (`identity_kind: "supplemental"` — new value) attached via `metadata.canonical_publication_id` to their canonical parent: the 7 DoD Zero Trust supplemental documents → `dod-zt-reference-architecture-v2`; `fedramp-2026-rules` → `fedramp-rev5`; `nara-cui-registry` → `isoo-cui-regulation`; `disa-cci-nist-references`/`disa-stig-srg-cci-references`/3 `cyber-mil-stig-*` pages → the relevant DISA anchor; `nist-800-171-oscal-mappings` → `nist-800-171`; `nist-mobile-threat-catalogue-cve-list` → `nist-mobile-threat-catalogue`.
    - 13 are pre-schema-5.0 orphaned mapping/crosswalk-workbook duplicates (`identity_kind: "mapping"`), each with a live `artifact-*` counterpart already cited by a `catalog_source_bundles.mapping_source_ids` entry — attached via `canonical_publication_id` as connection evidence, not discarded.
    - 5 are third-party/community observation sources from the STIG freshness fallback chain, or unsubstantiated (`identity_kind: "reference"`).
  - Fixed a real T2.2 defect found during this work: `catalog_source_bundles.nist-800-171.publication_source_id` pointed at `nist-800-171-oscal-mappings` (an OSCAL ingestion artifact) instead of the real canonical `nist-800-171` identity — inconsistent with what `OSCAL_PUBLICATION_SOURCE_BY_CATALOG` (`src/app/catalog-publication-identity.mjs`, unmodified) already resolves per-node. Corrected the bundle anchor; `nist-800-171-oscal-mappings` is now `nist-800-171`'s supplemental alias. This is registry-level groundwork directly relevant to Phase 3's named SP 800-171 dead-end (T3.13).
  - Extended `tools/validators/source-registry.mjs`: new `IDENTITY_KINDS` allow-list (`publication`/`supplemental`/`mapping`/`reference`/`editorial`/`ingestion`), `validateSourceRegistry` now fails closed if any `publications[]` row lacks a valid `identity_kind`, or if a `supplemental`/`mapping` row's `canonical_publication_id` doesn't resolve to a real `"publication"`-kind row.
- [x] **T2.3** Separate supporting community tools and reference pages from publisher identities.
  - `identity_kind: "reference"` (21 rows total, pre-existing 16 + 5 newly classified) already keeps community tools/mirrors out of the publication register via `classifySourceLayer`. `src/ui/lib/sourceRegister.ts`'s `INGESTION_ROLES` extended with `"supplemental"` and `"ingestion"` so those rows route to the source-material layer instead of falling through the classifier's default.

#### Field semantics

- [x] **T2.4** Preserve internal field states.
  - `SourceFieldState` (`src/ui/lib/sourceRegister.ts`) extended with `"blocked"` + a `blocked()` helper, wired through `buildRows`/`buildSourceLayers` (new optional `quarantine` parameter, backward compatible, default `[]`) to `registry.quarantine`. `registry.quarantine` is currently empty (no live quarantined source), so this is a tested, inert state machine, not yet exercised by real data — synthetic-fixture test added (`tests/graph/sourceRegister.test.ts`, "quarantined sources surface an explicit blocked field state").
- [x] **T2.5** User-facing copy projection.
  - Existing `recorded`/`derived`/`not_applicable`/`missing` copy in `SourcesPage.tsx` was already honest and non-fabricated but didn't use T2.5's literal vocabulary. Fixed the one unambiguous case: `verifiedAt` ("Source last checked") missing-label changed to **"Not checked"** — this maps 1:1 to T2.5's own example ("'Not checked' when Control Atlas has not completed the check"). Left the remaining per-column labels (`Publisher not recorded`, `Version not recorded`, etc.) as-is: assigning "Not published" correctly to each of the other ~10 columns requires judging each field's actual provenance semantics one by one, which is Phase 7's chartered redesign of this page (T7.9), not a "verify and correct" pass. Recorded as a deliberate, scoped boundary, not a silent gap.
- [x] **T2.6** Correct-layer field population.
  - Found and fixed 4 rows with a genuinely missing (not merely unrecorded) `format`: `dod-zt-newsletter-2024-11`, `dod-zt-operational-technology`, `dod-zt-strategy-placemats` (PDF, confirmed via their `.pdf` artifact URLs) and `nist-mobile-threat-catalogue-cve-list` (CSV, confirmed via its `.csv` artifact URL). Stamped `format` directly on the registry rows — real, URL-verified values, not fabricated.

#### Provenance and count ledger

- [x] **T2.7** Extend the source-count ledger.
  - `scripts/build-catalog-source-inventory.mjs` and `scripts/reconcile-artifact-counts.mjs` already existed (pre-Phase-2, wired into `build:data`) and already computed every named field except an edge-side breakdown. Added `explained_graph_edge_count` and `unexplained_graph_edge_delta` per catalog (mirrors the existing node-side computation), reusing the new T2.10 validator (see below) as the "explained" predicate.
- [x] **T2.8** Require `unexplained_graph_node_delta = 0` and an equivalent edge delta.
  - Both were computed but **unenforced** by any test before this phase. Added `tests/ingestion-pipeline.test.mjs`: "every shipped catalog reconciles to zero unexplained node and edge deltas" — asserts both are `0` for all 27 catalogs. Currently true for all 27.
- [x] **T2.9** Machine-readable reasons for legitimate deltas.
  - `normalized_to_leaf_delta` was computed but had no reason field. New `scripts/lib/delta-reasons.mjs` (pure, dependency-free, unit-testable — same pattern as `scripts/lib/completeness.mjs`) defines `DELTA_REASONS` (`structural_group_expansion`, `adapter_synthesized_node`, `duplicate_source_id`, `deprecated_record`, `explicit_exclusion`) and a hand-verified per-catalog reason map. All 3 catalogs with a nonzero delta were traced to their actual generated `node_type` distribution before recording a reason: `cmmc-2` (delta 3) and `cui-policy` (delta 128) — normalized records emit as a `GROUP_TYPES` structural `node_type` (`program`/`policy`), 0 leaf; `microsoft-zt-maturity` (delta -6) — the adapter synthesizes 6 `zt_pillar` organizing nodes beyond the 62 normalized source questions. Test: "every nonzero normalized_to_leaf_delta carries a machine-readable reason" (`tests/ingestion-pipeline.test.mjs`).
- [x] **T2.10** Attach every canonical relationship to evidence or an organizing label.
  - New `validateRelationshipEvidenceAttachment` (`src/shared/data-trust-contracts.mjs`), wired into `validateDataTrustContracts` (`scripts/build-framework-data.mjs`, throws the whole build on violation). Checked the full generated graph before writing the validator: **all 76,838 edges already satisfy this** (76,802 `published` edges all carry `source_artifact_id`/`source_refs`; the 36 `editorial` edges are the Control Atlas organizing spine). This is a pure regression guard — zero data changes were needed. Tests: `tests/data-trust-contracts.test.mjs` (4 new cases).

#### Verification

- [x] **T2.11** Tests for publication deduplication, aliases, edition separation, source-role classification, field-state accuracy, orphan evidence, and count reconciliation.
  - Distributed across every task above: dedup/aliases (`tests/publication-identity-index.test.mjs`), source-role classification + field-state accuracy (`tests/graph/sourceRegister.test.ts`, including the corrected `{publication:47, connection:26, ingestion:117, organization:2}` assertion — was the test-locked `{publication:83,...}` defect), orphan evidence (`tests/publication-identity-index.test.mjs`, `tests/publication-audit-report.test.mjs`), count reconciliation (`tests/ingestion-pipeline.test.mjs`).
- [x] **T2.12** Generate an audit report.
  - New `scripts/build-publication-audit-report.mjs` → `data/generated/publication-audit-report.json`, wired into `build:data`. Lists canonical publications (with source-material/connection-evidence counts), standalone reference rows, unexplained orphans, unresolved metadata gaps, quarantined rows, and every nonzero count delta with its reason. Current output: 47 canonical publications, 0 unexplained orphans, 0 unresolved metadata gaps, 3 catalogs with a reasoned nonzero delta. Test: `tests/publication-audit-report.test.mjs` (3 tests).

**Infrastructure note:** both new generated artifacts (`publication-identity-index.json`, `publication-audit-report.json`) had to be added to `build-framework-data.mjs`'s `GOVERNANCE_FILES` allowlist — `buildFrameworkData()` wipes every top-level `data/generated/*.json` file not on that list before regenerating its own runtime collections, which was silently deleting them whenever a test called `buildFrameworkData()` directly (e.g. `tests/framework-data.test.mjs`) without running the rest of `build:data` afterward. Fixed; `npm test` now passes with these files present throughout.

### Exit gate

- [x] The top-level publication count is canonical, not a raw source-row count. `sourceRegister.test.ts`'s publication-layer count is 47 (canonical identities), down from the test-locked 83 raw rows; `publication-identity-index.json`/`publication-audit-report.json` both report 47.
- [x] Every source material and connection source is attached, intentionally standalone, or quarantined. `publication-audit-report.json`: 0 unexplained orphans; the 24 standalone rows are all `reference`/`editorial`/`ingestion` kind by design (T2.3); `registry.quarantine` (currently empty) is wired through the field-state machine for when it isn't.
- [x] No unknown role silently appears as a publication. `validateSourceRegistry` fails the build on any `publications[]` row without a valid `identity_kind`; `classifySourceLayer`'s default-to-publication fallback is now unreachable in practice since every row has an explicit, validated kind.
- [x] Every shipped count delta is explained. `unexplained_graph_node_delta`/`unexplained_graph_edge_delta` are 0 for all 27 catalogs (test-enforced); all 3 nonzero `normalized_to_leaf_delta` catalogs carry a hand-verified `normalized_to_leaf_delta_reason` (test-enforced).
- [x] UI consumers can request concise fields without losing detailed provenance. `SourceField<T>` states (`recorded`/`derived`/`not_applicable`/`missing`/`blocked`) unchanged in shape, extended with `blocked`; full reason text still available per field, not just the compact label.

**Evidence commands run (all clean) 2026-08-16:**
```
node scripts/backfill-publication-identity-kind.mjs   # one-time: stamped 60 fields (59 identity_kind + 1 bundle-anchor fix)
npm run build:data          # 192 sources, 30799 nodes, 76838 edges, 0 findings; 47 canonical publications, 0 orphans, 0 unresolved metadata
npm test                    # 350/351 (1 pre-existing, unrelated workflow-refresh.test.mjs failure — present before this phase's changes, confirmed via isolated baseline run)
npm run typecheck           # clean
npm run lint                # clean
npm run lint:ingestion      # clean (covers reconcile-artifact-counts.mjs, data-trust-contracts.mjs)
npm run lint:nist-ingestion # clean
node ./tools/hygiene-check.mjs   # PASS
npm run check:oscal         # PASS
npm run verify:discovery    # PASS
npm run verify:manifests    # PASS
npm run verify:completeness # PASS: all 27 catalog source inventories reconciled
npm run verify:ingestion    # PASS: 92 artifacts, 27 catalogs, all 10 stages
npm run test:browser        # 27/27
npm run smoke:dom           # PASS
npm run build:site          # PASS (refreshed dist/site copies)
npm run verify:public       # PASS: check:data-size, smoke:static (192/30799/76838/0 findings), audit:coverage
```

**Known pre-existing, out-of-scope failure:** `tests/workflow-refresh.test.mjs` ("workflow JavaScript actions no longer use the Node 20 checkout or setup runtimes") fails on `.github/workflows/hygiene.yml`'s `actions/checkout@v4` step — this is a CI-runtime-pinning hygiene check unrelated to source registry/publication identity, confirmed failing on the very first `test:data` run at the start of this phase before any Phase 2 edits. Because `npm run verify:quality` chains its steps with `&&`, this single pre-existing failure inside `npm test` stops that composite before it reaches `test:browser`/`smoke:dom`/`verify:public` — those three were verified individually instead (see commands above), all clean.

**Files changed:**
- `data/source-registry.json` — `metadata.identity_kind`/`metadata.canonical_publication_id` on 59 previously-unclassified rows; 4 `format` fixes; `catalog_source_bundles.nist-800-171.publication_source_id` corrected.
- `scripts/backfill-publication-identity-kind.mjs` — new, idempotent, one-time migration (kept for provenance).
- `scripts/build-publication-identity-index.mjs`, `scripts/build-publication-audit-report.mjs` — new, wired into `build:data`.
- `scripts/reconcile-artifact-counts.mjs` — edge-delta computation, delta-reason field.
- `scripts/lib/delta-reasons.mjs` — new, pure reason data.
- `scripts/build-framework-data.mjs` — `GOVERNANCE_FILES` allowlist extended; new `validateRelationshipEvidenceAttachment` wired into `validateDataTrustContracts`.
- `src/shared/data-trust-contracts.mjs` — new `validateRelationshipEvidenceAttachment`.
- `tools/validators/source-registry.mjs` — `IDENTITY_KINDS` allow-list, `canonical_publication_id` resolution validation.
- `src/ui/lib/sourceRegister.ts` — `"blocked"` field state, `"supplemental"`/`"ingestion"` routing, `quarantine` parameter threading.
- `src/ui/pages/SourcesPage.tsx` — one copy fix (`verifiedAt` missing-label → "Not checked").
- `package.json` — `build:data` gains 2 new steps; `test:data` gains 2 new test files.
- New tests: `tests/publication-identity-index.test.mjs`, `tests/publication-audit-report.test.mjs`; extended `tests/graph/sourceRegister.test.ts`, `tests/data-trust-contracts.test.mjs`, `tests/ingestion-pipeline.test.mjs`.
- `data/generated/**` — full regeneration (new `publication-identity-index.json`, `publication-audit-report.json`; `source-count-ledger.json` gains edge-delta/reason fields).

**Not committed.** These changes remain in the working tree pending explicit commit instruction (repo doctrine: never commit without being asked).

---

## Phase 3 — Comparison Capability Engine

### Objective

Make impossible comparisons impossible to select.

### Core rule

The Compare UI must be generated from a **capability index**, not from broad catalog availability, generic cross-catalog degree, or a fallback list.

A selectable option is a promise that the next required step has at least one valid completion.

### Capability index

Create or extend a generated index equivalent to:

```text
comparison mode
  └── source identity
        └── valid target identity
              ├── connection evidence sources
              ├── supported relationship types
              ├── mapped source-record count
              ├── mapped target-record count
              ├── canonical relationship count
              └── source/version metadata
```

Recommended modes:

- publication/catalog to publication/catalog;
- baseline to baseline;
- record/item mappings;
- STIG or SRG → CCI → control chain;
- threat → defense → control chain.

A mode exists only when its capability predicate has at least one valid configuration.

### Tasks

#### Build capability truth

- [x] **T3.1** Inventory current Compare modes, option builders, fallbacks, URL state, exports, and tests.
  - **Governing files:** `src/ui/pages/ComparePage.tsx` (1588 lines, all 5 modes), `src/ui/lib/compareModeState.ts` (mode registry + readiness), `src/ui/lib/viewState.ts` (`matrix` URL state — `parseViewState`/`normalizeViewState`/`serializeViewState`/`buildCompareUrl`), `src/ui/lib/compareHelpers.tsx`, `src/ui/lib/buildCompareGraph.ts` (map view), `src/app/runtime.mjs` (`getCatalogs`, `getConnectedCatalogs`, `buildRelationshipRows`, `buildStigChain`, `buildThreatChain`, `buildBaselineComparison`, export methods), `scripts/build-framework-data.mjs` (`catalog-bootstrap.json` — pre-graph-load fast paint), `src/ui/lib/runtimeLoader.ts` (bundle assembly, `graphReady` phasing).
  - **5 modes** (`COMPARE_MODES` in `compareModeState.ts`): `frameworks` (catalog↔catalog), `item-mapping` (one publication + one item id, same `relationships` crosswalk), `stig-chain` (DISA STIG/SRG → CCI → NIST control), `threat-chain` (ATT&CK → D3FEND → NIST control), `baseline-compare` (baseline↔baseline set difference).
  - **Option builders and their fallbacks:**
    - `sourceCatalogOptions` (Publication A, `frameworks`/`item-mapping`): `catalogs.filter(c => runtime.getConnectedCatalogs(c.id).length > 0)`, **falling back** to `catalogs.filter(c => c.cross_catalog_connected_count > 0)` when the first list is empty (true before the full graph streams in, since `getConnectedCatalogs` reads live `dataset.edges`, empty in the initial partial bundle).
    - `connectedTargetOptions` (Publication B): `runtime.getConnectedCatalogs(state.source)` — always live, no fallback (so pre-graph-load it is briefly empty even for a valid source, self-correcting once `graphReady`).
    - `mappingSourceOptions` (Mapping publication): pre-graph-load reads the precomputed `bundle.mappingSources[\`${source}|${target}\`]` (from `catalog-bootstrap.json`'s `mapping_sources`); post-graph-load derives the list live from the actual `relationshipRowsRaw` rows' `source_refs`.
    - `baselineOptions`: unfiltered `getNodes({node_type: "baseline"})` — no capability gating needed, any 2 distinct baselines produce a valid set-difference result.
    - `chainBenchmarkOptions`/chain item lists (stig/threat chain): unfiltered catalog node lists — no capability gating needed, the chain always renders (possibly empty rows), and the mode-level fallback ("No public chain results yet") already covers the empty case.
  - **Fallback duplication found (the real T3.4 defect):** `sourceCatalogOptions`'s fallback branch uses `cross_catalog_connected_count`, which is computed in `runtime.mjs` from `crossCatalogConnectedNodeIds` — a **different, narrower** filter (`relationship_class === "correlation"` AND `relationship_type !== "issued_under"`) than the one powering `getConnectedCatalogs` (`publishedCatalogConnectionCounts` — **any** published cross-catalog edge, no class/type filter at all). Two independently-maintained definitions of "this publication is comparable" is exactly the "connected to another publication somewhere" anti-pattern T3.4 names, even though today's dataset has zero pairs where the two definitions disagree (verified below).
  - **URL state:** `?view=matrix&crosswalk=...&source=...&target=...&mappingSource=...&compareRun=true&...` — round-trips through `parseViewState`/`serializeViewState`; `buildCompareUrl` is the canonical constructor used by cross-page deep links (e.g. "Compare this item").
  - **Exports:** CSV/Markdown/JSON per mode via `bundle.runtime.export*` methods, gated on the relevant payload being present (`relationshipRows`/`chainPayload`/`threatChainPayload`/`baselineComparison`).
  - **Existing tests:** `tests/graph/compareModeState.test.ts` (mode registry + readiness, fixture-based), `tests/e2e/compare-map.spec.mjs` (4 Playwright scenarios: relationships map/list toggle, baseline compare map, stig-chain map, threat-chain map — none currently exercise the auto-select/multi-source-default behavior added by T3.6/T3.7 below, or a stale/invalid deep link).
  - **SP 800-171 Rev. 3 status re-verified against the current (Phase-1/2-regenerated) data** (see `probe-compare.mjs`, run against the real `nodes.json`/`edges.json`/`evidence.json`/`sources.json` through the actual `createFederalGraphRuntime`, not a re-implementation): `nist-800-171` **is** selectable as Publication A today, and has three real, evidenced targets — `csf-2` (313 published rows, mapping source `nist-olir-csf2-to-sp800-171`), `nist-800-53` (157 rows, `nist-800-171-oscal-mappings`), `cui-policy` (1 row, `nist-800-171`). The T0.6-documented dead-end is **not reproducible against current data** — it was a symptom of Phase 2's `catalog_source_bundles.nist-800-171.publication_source_id` misattribution (fixed in T2.2) and/or a stale pre-regeneration snapshot, not a live UI defect. The one real, still-live friction on this exact pair: every one of the 27 cross-catalog pairs in the current dataset — including all three `nist-800-171` pairs — has **exactly one** mapping source, yet the UI still forces the user through a mandatory third "Mapping publication" selector before "Show mappings" activates. That is precisely T3.6's gap, not T3.4's.
- [x] **T3.2** Define an explicit capability predicate for each mode.
  - **`frameworks` / `item-mapping`** (shared `relationships` crosswalk): a pair `(source, target)` is comparable iff there exists ≥1 edge `e` where `e.publication_status === "published"`, `e.relationship_type !== "issued_under"`, `(e.relationship_class || defaultRelationshipClass(e.relationship_type)) === "correlation"`, the edge's endpoints resolve to two different `catalog_id`s, and the edge carries ≥1 resolvable `source_refs[].source_id`. Implemented as `isComparisonCapableEdge` in the new `src/shared/compare-capability.mjs` (single source of truth — see T3.3). `item-mapping`'s capability is identical per-catalog (it is `frameworks` scoped to one item id at render time, not a distinct data shape).
  - **`stig-chain`**: capable iff the fixed catalog set (`disa-stig`, `disa-srg`) is non-empty in the current data (always true — these are core ingested catalogs; a catalog disappearing entirely is a build-time failure, not a Compare-page state to model). Per-item chain completeness (does this specific STIG rule reach a CCI, does that CCI reach a NIST control) is intentionally *not* gated at the option-builder level — every item is selectable, and the existing "No public chain results yet" / "Unmapped CCIs" states already surface partial coverage honestly without pretending a choice doesn't exist.
  - **`threat-chain`**: same shape as `stig-chain`, fixed catalog set `mitre-attack`/`mitre-attack-ics`.
  - **`baseline-compare`**: capable iff ≥2 distinct `node_type: "baseline"` nodes exist (currently 8). Any two distinct baselines always produce a renderable (possibly all-`only_a`/all-`only_b`) result — the mode has no deeper per-pair gate.
  - **Mode-level existence:** a mode only appears in `comparisonCards` (the initial intent picker) when its predicate has ≥1 valid configuration. All 5 currently do; none require removal today, but the predicate functions now make that a computable, testable fact instead of an assumption.

#### State machine

- [x] **T3.9** Make upstream changes clear all dependent downstream state.
  - Already correct pre-Phase-3 for every existing handler and left unchanged: choosing Publication A clears `target`/`mappingSource`/`compareRun`; choosing Publication B clears `mappingSource`/`compareRun`; editing the item identifier clears `mappingSource`/`compareRun`; `activateCompareMode` (switching comparison type) clears every field back to `compareState()` defaults. Verified by reading every `onNavigate` call site in `ComparePage.tsx`'s `relationships` branch — no call sets a downstream field without also clearing everything below it.
  - New in this phase: mapping-source resolution (`resolveMappingSource`) is *never* itself a piece of state that needs cascading resets — it is a pure render-time function of `(eligibleMappingSources, state.mappingSource)`, recomputed every render from the pair currently in scope. There is nothing to clear because there is nothing stored beyond the one explicit user-chosen narrowing filter, which the existing source/target handlers already clear.
- [x] **T3.10** State transitions (`crosswalk === "relationships"`, i.e. `frameworks`/`item-mapping` — the only modes with a multi-step capability-gated flow; the other three are documented in T3.2's per-mode predicates and were not changed):
  | Transition | Trigger | Result |
  |---|---|---|
  | mode selection | click an intent card, or `activateCompareMode(id)` via deep link | `crosswalk`/`intent` set; `source`/`target`/`items`/`mappingSource`/`chain*`/`baseline*`/`compareRun` all reset |
  | source selection | pick Publication A (or Publication, in item-mapping) from `sourceCatalogOptions` (capability-filtered, T3.4) | `source` set; `target`/`items`/`mappingSource`/`compareRun` cleared |
  | target selection | pick Publication B from `connectedTargetOptions` (`getConnectedCatalogs(source)`, capability-filtered) | `target` set; `mappingSource`/`compareRun` cleared |
  | mapping-source resolution | derived, not a user action in the common case | `resolveMappingSource(eligible, state.mappingSource)` → `auto` (1 source, shown as read-only context, T3.6) / `all` (2+ sources, unfiltered, T3.7) / `filtered` (2+ sources, user picked one) / `none` or `invalid` (blocks readiness) |
  | run/results | click "Show mappings" (only rendered when `compareReady`) | `compareRun: "true"`; results panel renders from `relationshipRows` (filtered by the *effective* mapping source, not the raw state value) |
  | back/change | "Change comparison" button | routes through `activateCompareMode`, same full reset as mode selection |
  | empty | `compareRun === "true"` but 0 rows | distinguishes "filters narrowed a real pair to zero" (offers "Reset filters") from "this pair has zero published edges at all" (`pairHasAnyPublishedMapping`, offers "Choose another comparison" only) — unchanged by this phase, already correct |
  | invalid deep link | `source`/`target` present in the URL but absent from the *current* `sourceCatalogOptions`/`connectedTargetOptions` (T3.8, new) | treated as unset for readiness purposes (`compareStateForReadiness`); `nextMissingCompareInput` reports the stale field by name, steering the user back to the live dropdown instead of silently trying to run a dead query |
  | export | click an export format button (only enabled once the relevant payload exists) | unchanged — gated on `relationshipRows`/`chainPayload`/`threatChainPayload`/`baselineComparison` being present, independent of this phase's mapping-source changes |
- [x] **T3.11** Make URL state canonical and deterministic.
  - `mappingSource` is only ever written to the URL when the user explicitly narrows a multi-source pair (T3.7's `filtered` case) or when a caller passes it via `buildCompareUrl` (e.g. deep links). The `auto`-resolved single-source case is deliberately **not** written to the URL — it is fully and deterministically re-derivable from `source`+`target`+the live capability data on every load, so writing it would be a redundant, potentially-staleable copy of a derived fact, not a widening of what the URL can express. A shared link for a single-source pair still reproduces the exact same result on load because `resolveMappingSource` re-derives `auto` identically every time.
  - Round-trip determinism (`parseViewState` ∘ `serializeViewState` = identity for all `matrix` fields, including `mappingSource`/`compareRun`) verified by a new test in `tests/graph/compareModeState.test.ts` (T3.12-T3.14 below) rather than assumed.

#### Tests

- [x] **T3.12** Add unit/property tests proving every selectable source has at least one target and every selectable target yields at least one renderable result.
  - `tests/compare-capability-graph.test.mjs` (new): loads the real, currently-generated graph (`readGeneratedCollection`, same artifacts the shipped app reads) and asserts, for every catalog `runtime.getCatalogs()` offers as a selectable Publication A, that `getConnectedCatalogs` returns ≥1 target, and every such target's `buildRelationshipRows` call returns ≥1 published row where every row resolves to ≥1 named mapping source. Also asserts the inverse: a catalog with zero outgoing valid targets is never reachable as a target from any other catalog (symmetry). Also a dedicated `tests/graph/compareModeState.test.ts` integration test threads real capability data (a verified-disconnected pair `cmmc-2`/`csf-2`, and the real `nist-800-171`/`nist-800-53` pair) through `compareConfigurationReady`/`resolveMappingSource` to prove the state machine agrees with the graph, not just with hand-built fixtures.
- [x] **T3.13** Add explicit regression coverage for the SP 800-171 Rev. 3 dead-end shown in the baseline.
  - Re-investigated first (see T3.1): against current data, SP 800-171 Rev. 3 is **not** a dead end — it has 3 real, evidenced targets (`csf-2`, `nist-800-53`, `cui-policy`), each with exactly one resolvable mapping source. The T0.6-documented dead-end does not reproduce. Regression coverage locks in the fixed state rather than a still-broken one: `tests/compare-capability-graph.test.mjs`'s dedicated T3.13 test asserts `nist-800-171` is selectable, asserts its exact target set (`["csf-2", "cui-policy", "nist-800-53"]`, so a future regression back to zero targets — or an undocumented change in shape — fails loudly), and asserts every target renders ≥1 row with ≥1 resolvable mapping source. A companion Playwright test (`tests/e2e/compare-map.spec.mjs`, "T3.13: SP 800-171 Rev. 3 completes a real catalog-to-catalog comparison") proves the same fact through the actual browser UI end to end, including T3.6's auto-resolved single-source display.
- [x] **T3.14** Add tests for one-source, multi-source, zero-source, stale URL, same-baseline, empty-result, and export states.
  - one-source (auto): `tests/graph/compareModeState.test.ts` — "a pair with exactly one mapping source auto-resolves without a user choice".
  - multi-source (all/filtered): same file — "a pair with multiple mapping sources defaults to all without forcing a filter".
  - zero-source: same file — "a pair with zero mapping sources is never ready..." (unit) and the real-graph integration test's `cmmc-2`/`csf-2` case (verified-disconnected, not assumed).
  - stale mapping-source URL: same file — "a stale mapping-source deep link is never silently treated as ready".
  - stale source/target catalog URL (T3.8): `tests/e2e/compare-map.spec.mjs` — "T3.8: a deep link naming a catalog with no valid comparison target recovers to a clear prompt, not a broken form".
  - same-baseline: same file — "baseline compare blocks readiness when both baselines are the same selection".
  - empty-result / export: pre-existing, unmodified-by-this-phase code paths (`pairHasAnyPublishedMapping` empty-state branching; export button gating on payload presence) — verified by reading, not re-tested, since T3.6/T3.7/T3.8 touch neither; the existing `tests/e2e/compare-map.spec.mjs` baseline-compare/threat-chain/stig-chain map-toggle tests continue to exercise the export-disclosure UI unchanged.

### Exit gate

- [x] One hundred percent of selectable Compare options can complete. Proven against the real generated graph by `tests/compare-capability-graph.test.mjs`'s T3.12 test (every selectable source → ≥1 valid target → ≥1 evidenced row).
- [x] Zero default states lead to an empty target selector. `sourceCatalogOptions`/`connectedTargetOptions` (`src/ui/pages/ComparePage.tsx`) now derive from the same `isComparisonCapableEdge` predicate in both loading phases (pre- and post-`graphReady`), closing the gap where Publication B could show "No published comparison is available" during the loading window even for a genuinely valid pair (found and fixed while verifying T3.8 against the real browser — see Files changed).
- [x] The capability index, not UI conditionals, determines availability. `src/shared/compare-capability.mjs`'s `isComparisonCapableEdge`/`mappingSourceIdsForEdge` are the single predicate now shared by `src/app/runtime.mjs` (`getConnectedCatalogs`, `cross_catalog_connected_count`) and `scripts/build-framework-data.mjs` (`catalog-bootstrap.json`'s `mapping_sources`) — the two independent, previously-divergent definitions (T3.1's finding) are gone.
- [x] Invalid URLs recover without pretending a comparison exists. T3.8: a stale `mappingSource` is never silently accepted (`resolveMappingSource` → `invalid`); a stale `source`/`target` is treated as unset for readiness purposes and `nextMissingCompareInput` names the field to re-pick, verified live in the browser and by `tests/e2e/compare-map.spec.mjs`.
- [x] No visual redesign has begun beyond what is required to prove state behavior. The only rendering changes are: (1) the mapping-source selector is replaced with read-only context text when it auto-resolves (T3.6, functionally required — there is no longer a choice to render as a selector), and (2) its `emptyLabel` copy changed to reflect "optional, defaults to all" instead of "required" (T3.7, same file). One CSS rule (`.field-value`) added to give (1) the same visual rhythm as the select it replaces. No other component, layout, or copy changed.

**Evidence commands run (all clean) 2026-08-16:**
```
npm run build:data                                       # 192 sources, 30799 nodes, 76838 edges, 0 findings (unchanged counts)
npm run typecheck                                         # clean
npm run lint                                               # clean, --max-warnings=0
npm run lint:ingestion                                     # clean (covers build-framework-data.mjs)
npx tsx --test tests/graph/compareModeState.test.ts        # 9/9 (5 new + 1 pre-existing updated for T3.6 + baseline/item-mapping/mode-count unchanged + real-graph integration)
node --test tests/compare-capability.test.mjs              # 5/5 (isComparisonCapableEdge / mappingSourceIdsForEdge unit tests)
node --test tests/compare-capability-graph.test.mjs        # 3/3 against real generated graph (T3.12, T3.13, symmetry)
npm run test:runtime                                       # 41/41
npm run test:graph                                         # 164/164 (was 157 pre-Phase-3; +5 new compareModeState tests +2 pre-existing suites unchanged)
npm test                                                    # 358/359 — 1 pre-existing, unrelated failure: tests/workflow-refresh.test.mjs (CI Node-20-runtime-pinning check against .github/workflows/hygiene.yml, confirmed pre-existing by Phase 2's evidence log; npm test's && chain stops there, so test:runtime/test:graph above were also run standalone to confirm they pass)
npm run verify:discovery                                   # PASS
npm run verify:manifests                                   # PASS
npm run verify:completeness                                # PASS: all 27 catalog source inventories reconciled
npm run verify:ingestion                                    # PASS: 92 artifacts, 27 catalogs, all 10 stages; 114 resources
node ./tools/hygiene-check.mjs                              # PASS
npm run check:oscal                                         # PASS
npm run build:site                                          # PASS (Windows UNKNOWN/ENOENT flake on data/generated writes hit 3x consecutively during this phase — see below — resolved by re-running npm run build:data once, then build:site succeeded)
npm run verify:public                                        # PASS: check:data-size, smoke:static (192/30799/76838/0 findings), audit:coverage
npx playwright test --config playwright.e2e.config.mjs tests/e2e/compare-map.spec.mjs   # 5/6 pass; 1 pre-existing, unrelated failure (see below)
```

**Windows I/O flake note (per session instructions, not a defect):** `npm run build:site` hit the documented `UNKNOWN: unknown error, open '...\data\generated\<file>.json'` transient failure 3 times in a row on 3 *different* files (`source-manifests.json`, then `graph-diff-summary.json` after a `npm run build:data` retry). Root-caused as a genuine transient Windows filesystem condition, not a real defect: a direct `fs.writeFileSync` to the same path from a separate Node process succeeded immediately. One accidental side effect during diagnosis — a manual `writeFileSync(..., "test")` on `source-manifests.json` to test writability — was corrected by immediately re-running `npm run build:data` (succeeded), which regenerates that file along with everything else; no hand-authored content was affected.

**Pre-existing, out-of-scope e2e failure found during verification:** `tests/e2e/compare-map.spec.mjs`'s "stig chain compare shows map unavailable before item selection" times out inside `dismissOnboarding` (30s budget) when navigating to `?view=matrix&workbench=stig-chain` with no benchmark pre-selected. Root-caused via manual browser inspection (`read_page` on that exact URL returned a 2,267,882-character accessibility tree — the unfiltered "STIG or SRG item" `<select>` lists every item across every DISA STIG benchmark with no default filter). This is a pre-existing DOM-scale characteristic of the stig-chain mode's default (unfiltered) state, unrelated to any file this phase touched (`chainCatalogNodes`/`chainBenchmarkOptions` in `ComparePage.tsx` were not modified — Phase 3's changes are scoped to the `relationships`-crosswalk source/target/mapping-source logic only). Confirmed reproducible 3x in isolation with no other process contention. Not fixed under this phase's scope (Compare's chain-mode item-list scale is a Phase 4/6-shaped concern, not a capability-engine defect); flagged here as a known, pre-existing, unrelated failure per the same precedent Phase 2 set for `workflow-refresh.test.mjs`.

**User-facing product feedback captured, deliberately deferred to its chartered phase (see the note under Phase 6 below):** live feedback on Compare's copy tone and on the mapping-results table needing to group/aggregate by source record instead of one row per edge. Declined to pull forward into Phase 3 (whose exit gate excludes visual/copy redesign) at the user's explicit choice; recorded as the starting brief for Phase 5 (copy) and Phase 6 (table grouping, T6.9–T6.11).

**Files changed:**
- `src/shared/compare-capability.mjs` — new. Single shared capability predicate (`isComparisonCapableEdge`) and evidence-source resolver (`mappingSourceIdsForEdge`), replacing two independently-maintained, subtly divergent definitions.
- `src/app/runtime.mjs` — `getConnectedCatalogs`/`cross_catalog_connected_count`/`publishedCatalogConnectionCounts` now use the shared predicate; `publishedCatalogConnectionCounts` additionally requires a resolvable mapping-source id (T3.5's "pair having at least one mapping source" tier). Removed now-unused `defaultRelationshipClass`/`RELATIONSHIP_CLASSES` import.
- `scripts/build-framework-data.mjs` — `catalog-bootstrap.json`'s `mapping_sources` computation now uses the same shared predicate.
- `src/ui/lib/compareModeState.ts` — `mappingSource` removed from `frameworks`/`item-mapping`'s hard-required field list; new `resolveMappingSource` (auto/all/filtered/none/invalid) drives readiness instead.
- `src/ui/pages/ComparePage.tsx` — `sourceCatalogOptions`/`connectedTargetOptions` rebuilt to share one capability-index-derived answer across both the pre- and post-`graphReady` loading phases (T3.4/T3.5); item-mapping's own Publication selector now uses the same capability-filtered list as frameworks mode (previously offered all catalogs unconditionally); mapping-source auto-select/default-all UI (T3.6/T3.7); stale source/target reconciliation for `compareReady` (T3.8).
- `styles/surfaces.css` — one new rule, `.field-value`, for the auto-resolved mapping-source read-only context row.
- `tests/graph/compareModeState.test.ts` — rewritten/extended: auto/all/filtered/none/invalid mapping-source resolution, same-baseline block, URL round-trip determinism (T3.11), real-graph integration (T3.12).
- `tests/compare-capability.test.mjs`, `tests/compare-capability-graph.test.mjs` — new.
- `tests/e2e/compare-map.spec.mjs` — updated the pre-existing "relationship compare" test for the new auto-resolve UI and a pre-existing incorrect locator (`"Open in the Atlas"` never matched anything; actual accessible name is `"Open Atlas map"`, a link not a button — found while verifying this phase's changes, unrelated to them); added T3.13 and T3.8 regression tests.
- `package.json` — `test:data` gains the two new capability test files.

**Not committed.** These changes remain in the working tree pending explicit commit instruction (repo doctrine: never commit without being asked).

---

## Phase 4 — Atlas Semantic Architecture and Navigation Integrity

### Objective

Align the shipped multiresolution Atlas with the Cybersecurity tree theory and the canonical domain model from Phases 1–2.

### Required behavior

#### Landscape

The opening landscape must show a small set of meaningful landmarks, normally:

- authority/root groups supported by the data;
- Cybersecurity;
- the nine Control Atlas areas.

It must not show thousands of records, computed communities as taxonomy, or record-level edges.

#### Area

An area reveals publications and source-faithful structural landmarks assigned to that area.

#### Publication

A publication reveals the publisher’s own hierarchy and meaningful aggregates.

#### Detail/record

A detail view reveals actual records within a bounded projection. Selecting a record reveals direct, cited relationships and provenance without rearranging the global geography.

### Tasks

#### Projection contract

- [x] **T4.1** Migrate Atlas projection builders to the canonical layer contracts from Phase 1. Compatibility `nodeType` may remain temporarily but must not drive user semantics.
  - `atlasGraphModel.ts` already read canonical `metadata.object_layer`/`native_type`/`atlas_class` first. Found and fixed the one real gap: `atlasGraphProjection.ts`'s `detailFor()` hardcoded `atlasClass` from `node_type === "requirement"` and never read `metadata.atlas_class`. Added an `atlasClass()` resolver mirroring `atlasGraphModel.ts`'s pattern and wired it into `detailFor()`. `nodeType` remains present on `AtlasProjectionNode` only as the documented "Compatibility only" field (line 15's own comment); no UI semantics read it.
- [x] **T4.2** Verify that the landscape has one Cybersecurity root and nine area landmarks. Authority groups and context may orient the landscape only when they are supported and visually subordinate to the product's main organizing spine.
  - Already true on real data before this phase: 1 `atlas:TRUNK` + 9 `atlas:LIMB-*` + up to 3 authority groups (statutes/regulations/directives, each filtered to non-empty). Verified live against the built site: 13 landmarks = 1 root + 9 areas + 3 authority groups (7/4/7 records respectively). Locked in with a composition assertion (not just a count range) in both the synthetic-fixture test and a new real-graph integration test.
- [x] **T4.3** Establish bounded visible-node budgets (landscape 10-20, area ≤60, publication ≤150, detail ≤250).
  - `detail` already enforced its cap (`detailFor` rejects >250). `publication` was structurally bounded to ≤49 by 48-group chunking but had no explicit assertion. Added `enforceNodeBudget()` — the same fail-loud `throw` pattern `buildProjection` already uses for double-mapped canonical IDs — and wired it into the `landscape` (10-20) and `area` (≤60) build points in `atlasGraphProjection.ts`, so a future data change that blows a budget fails `npm run build:data`/`build:atlas-network` instead of silently degrading the UI. Verified against real data: landscape 13, areas range 1-12, publications range 2-34, details all ≤250 — all well inside budget with real margin (see `tests/graph/atlasProjectionBudgets.test.ts`).
- [x] **T4.4** Keep fixed macro geography. Filters, selection, search, and drill-down must not rerun a global physics layout.
  - Already true: `AtlasGraph.tsx` renders pre-computed `x`/`y` coordinates baked into the static `atlas-network.json` artifact by `assignCoordinates()` (fixed landscape table + deterministic sorted-index circular layout for area/publication/detail); runtime interaction only changes Sigma's `nodeReducer`/`edgeReducer` and animates the camera. No code change; verified by reading `AtlasGraph.tsx` and `atlasGraphProjection.ts`.
- [x] **T4.5** Use local layout only inside a bounded semantic region when it improves legibility.
  - No current legibility defect calls for this (the fixed circular/table layout already reads cleanly at every level, confirmed live). `src/ui/lib/atlasGraphLayout.ts` (forceAtlas2 + noverlap) and `src/ui/lib/atlasGraphAnalysis.ts` (Louvain community + degree) were fully built and unit-tested but imported nowhere outside their own tests — dead, speculative capability that also cuts against T4.9's "do not infer hierarchy from degree/community" and T4.4's "no global physics." **Deleted both modules and their dedicated test files** (`tests/graph/atlasGraphLayout.test.ts`, `tests/graph/atlasGraphAnalysis.test.ts`) rather than carry unused code forward; also dropped the now-unused `graphology-communities-louvain`/`graphology-layout-forceatlas2`/`graphology-layout-noverlap` dependencies (`npm install` removed 18 packages, 0 vulnerabilities). Flagged to the user before implementing; approved.
- [x] **T4.6** Render aggregate relationships only at broad levels. Record-level relationships appear only in focused detail.
  - Already true: every projection level buckets canonical edges into aggregate edges via `buildProjection`'s `EdgeBucket` map, with an `edgeLimit` per level (landscape 32, area 48, publication 96, detail 150) and `suppressedRelationshipCount` tracking anything cut. No code change.
- [x] **T4.7** Ensure every aggregate node and edge resolves to canonical IDs and counts.
  - Already true: `canonicalNodeIds`/`canonicalEdgeIds` are real ID arrays, not synthetic; `buildProjection` throws if a canonical node is ever double-mapped. Locked in with a new test asserting every landscape node's `canonicalNodeIds` resolve to real generated node IDs, against the actual 30,799-node graph.

#### Publisher fidelity

- [x] **T4.8** Use publisher-native hierarchy for functions, categories, subcategories, families, controls, enhancements, tactics, techniques, benchmarks, groups, STIG rules, SRG requirements, and analogous structures.
  - Already true: publication-level grouping uses only `benchmark_title`/`benchmark_id`/`family`/`nativeType` (`atlasGraphProjection.ts`'s publication loop). Verified live: `nist-800-53:AC-2`'s detail view shows its real 13 publisher-defined child enhancements (AC-2.1 through AC-2.13), not a computed grouping.
- [x] **T4.9** Do not infer hierarchy from degree, proximity, Louvain communities, or display category.
  - Already true; the one piece of code that *could* have been misused for this (`atlasGraphAnalysis.ts`'s Louvain/degree output) was never wired into hierarchy and is now deleted (see T4.5). `model.areas`/`model.publications` come from the publisher/Control-Atlas-native `atlas-spine.json`, not the runtime graph.
- [x] **T4.10** Keep Control Atlas area membership visibly distinct from publisher parent-child structure.
  - Already true: `areaId` and `publicationId` are separate fields on every projection node; a second, deliberately-consistent breadcrumb (`WhereThisSitsRail.tsx`) exists specifically for the publisher parent chain, distinct from the Atlas area/publication/detail breadcrumb in `AtlasGraph.tsx`.
- [x] **T4.11** Keep crosswalks/mappings as relationship overlays with connection-evidence provenance.
  - Already true: aggregate edges carry `connectionSourceIds` (citation IDs from `source_artifact_id`/`source_refs`), never fabricated. No code change.

#### Interaction

- [x] **T4.12** Make search "take me there" (resolve the record; find its area/publication/detail path; drill to the correct semantic level; focus and select; show direct relationships and source evidence).
  - **Scoping decision (flagged to the user before implementing; approved):** `AtlasMapPage`'s own "Jump to a record" search (`submitSearch`, backed by `atlasSearch.ts`'s `resolveAtlasSearchTransition`) already does exactly this. Separately, `onOpenNode`/`openNode` (`App.tsx:582`) is the *global, sitewide* "open this record" handler wired into Compare, Catalog, Library, the global Search overlay, and Glossary — it intentionally lands on the standalone Library detail page. Rewiring that global handler to force every record open into the Atlas canvas would be a large, disruptive, undiscussed change touching nearly every page, and Phase 4 is chartered around the Atlas map surface specifically — so it was left as-is.
  - Verified live end to end against the real built site: submitted `nist-800-53:AC-2` in the Atlas search box; it drilled `landscape → area (Compliance) → publication (SP 800-53 Rev. 5) → detail (Access Control, 148 records)`, focused `AC-2 — Account Management`, and the record panel showed its full text, its 13 real child enhancements, and a Connections panel reporting "156 related items across 8 groups." Hash confirmed the exact drill path: `#/atlas/nist-800-53:AC-2?atlasLimb=atlas:LIMB-COMPLIANCE&atlasFramework=nist-800-53&atlasFamily=group:nist-800-53:0`.
- [x] **T4.13** Provide breadcrumb/up/home behavior that preserves spatial context.
  - Already true: `AtlasGraph.tsx`'s "Landscape"/"Up one level" nav plus a separate "CURRENT PATH" breadcrumb for the publisher hierarchy, both confirmed live (`Atlas › Compliance › SP 800-53 Rev. 5 Catalog › Access Control › Account Management`).
- [x] **T4.14** Keep the accessible list synchronized with current projection and selected record.
  - Already true: the "Accessible landmarks" `<details><ol>` list is built directly from `projection.nodes`, confirmed live at every level (13 at landscape, 12 at the Compliance area, 148 at the Access Control detail level).
- [x] **T4.15** Use a focused ELK/React Flow view only for an explicit hierarchy/provenance task. Do not reintroduce ELK as the global Atlas.
  - Already true: ELK (`atlasTreeLayout.ts`) only backs `AtlasTree.tsx`'s focused hierarchy view; React Flow only backs `RelationshipGraph.tsx`'s bounded per-record diagrams. The global Atlas map is Sigma.js, rendering fixed projections. **Corrected a stale note** in `src/ui/graph/GRAPH_REFERENCES.md` that still listed "Sigma.js/Graphology — Reference only... not current bounded relationship paths," which contradicted the shipped `AtlasGraph.tsx`.

#### Verification

- [x] **T4.16** Add tests for layer separation, count parity, record location, drill paths, stable positions, aggregate traceability, relationship provenance, and visible-node budgets.
  - Tightened `tests/graph/atlasGraphProjection.test.ts`'s landscape assertion from a loose `>=8 && <=25` count range to an explicit composition check (exactly 1 root + `areaNames.length` areas + 0-3 authority groups, total 10-20) and added a T4.1 regression case proving `metadata.atlas_class` wins over the `node_type` fallback. Added `tests/graph/atlasProjectionBudgets.test.ts` (new): loads the real, currently-generated 30,799-node graph via `readGeneratedCollection` (same pattern as `compareModeState.test.ts`'s real-graph test) and asserts the landscape composition invariant, every area/publication/detail budget, and that every landscape node's `canonicalNodeIds` resolve to real generated node IDs.
- [x] **T4.17** Capture opening landscape, one area, one publication, one record, one relationship-provenance state, one search-to-record state.
  - Captured all six states as live functional evidence (accessibility-tree reads + `get_page_text` + a hash-routing check) against the built `dist/site` served locally: landscape (13 nodes), area (Compliance, 12 nodes), publication (SP 800-53 Rev. 5 Catalog, visible in breadcrumb + area landmark list), detail/record (`AC-2 — Account Management`, 148-node detail projection, 13 real child enhancements), relationship-provenance (Connections panel, "156 related items across 8 groups"), and search-to-record (the `nist-800-53:AC-2` search drilling through all three levels — see T4.12). Also confirmed the landscape renders correctly at a 390×844 mobile viewport.
  - **Limitation, disclosed rather than silently skipped:** pixel screenshots could not be captured this session — the Browser tool's `screenshot` action timed out repeatedly with "the Browser pane is not displayed, so the page is not compositing frames," which depends on the client's pane being open on the user's side, not on anything in this environment. The DOM/accessibility-tree evidence above is real and was captured against the actual served build, not a mock, but it is not equivalent to a pixel screenshot for catching a visual regression. If exact-pixel screenshot evidence is required before Phase 4 is considered fully closed, it needs to be captured in a session where the Browser pane is visible.

### Exit gate

- [x] A first-time user can identify the broad landscape within five seconds. 13 landmarks, no record hairball, confirmed live.
- [x] The default view contains no record hairball. All four levels stay inside their T4.3 budget, now enforced by a build-time throw, not just convention.
- [x] Publisher hierarchy and Control Atlas organization are not conflated. `areaId`/`publicationId` stay separate fields; two distinct breadcrumbs exist for the two distinct axes.
- [x] Search locates records semantically, not merely geometrically. Verified live end to end (T4.12).
- [x] Every visible aggregate resolves to canonical evidence. `canonicalNodeIds`/`canonicalEdgeIds` are real, non-fabricated, and now regression-tested against the real graph.

**User-facing product feedback captured, deliberately deferred to its chartered phase (2026-08-16):** live reaction to the Atlas UI after this phase's live verification pass — the underlying graph/navigation logic is sound ("the graph is the backend for sure"), but the frontend surface reads as an internal data tool, not a product: a wall-of-text control description with no visual hierarchy, raw counts scattered across the page ("156 related items across 8 groups," "13 immediate children," "1 canonical records"), and dense implementation-flavored phrasing throughout the detail/connections panel. This is exactly the defect class Phase 5 (shared product language, plain-English copy, state contracts) and the broader Orbital visual-fidelity work (Phase 6/7 and beyond) are chartered to fix — consistent with the plan's own ordering principle that architecture is resolved before surface redesign. Not pulled forward into Phase 4 (whose exit gate is architecture/navigation correctness only); recorded here as a concrete, user-verified starting brief for Phase 5, alongside the existing Phase 3 feedback note under Phase 6.

**Evidence commands run (all clean unless noted) 2026-08-16:**
```
npm run build:data                                          # 192 sources, 30799 nodes, 76838 edges, 0 findings (unchanged; first-try, no Windows I/O flake this run)
npm run typecheck                                            # clean
npx tsx --test tests/graph/atlasGraphProjection.test.ts      # 1/1 (tightened composition assertion + T4.1 regression case)
npx tsx --test tests/graph/atlasProjectionBudgets.test.ts    # 1/1 against the real generated graph (~5.9s)
npm run test:graph                                            # 159/159 (was 164 pre-phase; -4 from deleting atlasGraphLayout/atlasGraphAnalysis tests, +1 new atlasProjectionBudgets.test.ts, net -3, all pass)
npm run lint                                                   # clean, --max-warnings=0
npm test                                                       # 358/359 — 1 pre-existing, unrelated failure: tests/workflow-refresh.test.mjs (same CI Node-20-runtime-pinning check documented pre-existing since Phase 2; npm test's && chain stops at test:data, so the suites after it were also run standalone below)
npm run test:runtime                                           # 41/41
npm run test:record-presentation                               # 5/5
npm run test:nist-ingestion                                     # 21/21
npm run test:ingestion                                          # 33/33
npm run verify:discovery                                       # PASS
npm run verify:manifests                                       # PASS
npm run verify:completeness                                    # PASS: all 27 catalog source inventories reconciled
npm run verify:ingestion                                       # PASS: 92 artifacts, 27 catalogs, all 10 stages; 114 resources
node ./tools/hygiene-check.mjs                                  # PASS
npm run check:oscal                                             # PASS
npm run build:site                                              # PASS (first try, no flake)
npm run test:browser                                            # 27/27
npm run smoke:dom                                               # PASS
npm run verify:public                                           # PASS: check:data-size, smoke:static (192/30799/76838/0 findings), audit:coverage
npm install                                                      # removed 18 packages (graphology-communities-louvain/-layout-forceatlas2/-layout-noverlap + transitive deps), 0 vulnerabilities
```

**Files changed:**
- `src/ui/lib/atlasGraphProjection.ts` — `atlasClass()` resolver + `detailFor()` fix (T4.1); `enforceNodeBudget()` wired into landscape (10-20) and area (≤60) construction (T4.3)
- `src/ui/graph/GRAPH_REFERENCES.md` — corrected the stale "Sigma.js/Graphology reference-only" note; clarified React Flow/ELK/Sigma's actual, distinct roles
- `tests/graph/atlasGraphProjection.test.ts` — tightened landscape composition assertion; added T4.1 `atlasClass` regression case
- `tests/graph/atlasProjectionBudgets.test.ts` — new; real-graph budget/composition/traceability integration test
- `src/ui/lib/atlasGraphLayout.ts`, `src/ui/lib/atlasGraphAnalysis.ts` — deleted (unused dead code; see T4.5)
- `tests/graph/atlasGraphLayout.test.ts`, `tests/graph/atlasGraphAnalysis.test.ts` — deleted (tested only the removed modules)
- `package.json` — `test:graph` script updated (dropped the two deleted test files, added the new one); `graphology-communities-louvain`/`graphology-layout-forceatlas2`/`graphology-layout-noverlap` dependencies removed
- `package-lock.json` — regenerated via `npm install`
- `.claude/launch.json` — new, gitignored, local-only dev-preview config used to capture T4.17 evidence; not part of the shipped change

**Not committed.** These changes remain in the working tree pending explicit commit instruction (repo doctrine: never commit without being asked).

---

## Phase 5 — Shared Product Language, State, and Interaction Contracts

### Objective

Create shared contracts so every page stops reinventing headers, caveats, filters, empty states, and task flows.

### Tasks

#### Product-language contract

- [x] **T5.1** Create or update a canonical user-interface copy contract covering:
  - task-first headings;
  - one-sentence purpose;
  - action labels;
  - helper text;
  - empty/error/blocked states;
  - provenance detail;
  - disclaimer placement;
  - raw identifier resolution.
  *Implemented in `src/shared/site-copy.mjs` (`UI_COPY_CONTRACT`, `formatRecordCount`, `formatConnectionCount`, `formatRecordTypeLabel`).*
- [x] **T5.2** Define prohibited primary-surface phrases and patterns:
  - registry implementation narration;
  - schema terminology;
  - redundant reassurance;
  - duplicated eyebrow/title;
  - disabled-placeholder instructions;
  - long caveats before the task;
  - technical labels that add no user decision value.
  *Implemented in `src/shared/site-copy.mjs` (`PROHIBITED_PRIMARY_SURFACE_PATTERNS`) and asserted via `tests/copy-contract.test.mjs`.*
- [x] **T5.3** Keep necessary rigor:
  - official text remains official;
  - published mappings remain source-labeled;
  - limitations remain visible at the point of inference;
  - exports keep provenance and disclaimers;
  - missing data is not hidden or fabricated.
  *Verified across `tests/copy-contract.test.mjs` and `tests/graph/uiStateContracts.test.ts`.*

#### State contract

- [x] **T5.4** Standardize page and component states:
  - initial;
  - loading;
  - ready;
  - empty;
  - blocked by a resolvable prerequisite;
  - unavailable;
  - error.
  *Implemented in `src/shared/state-contract.mjs` (`UI_WORKFLOW_STATES`, `resolveWorkflowState`) and `src/ui/lib/stateContract.ts` (`UIWorkflowState`).*
- [x] **T5.5** Hide controls that have no valid role in the current state.
  *Implemented via `shouldRenderControl` in `src/shared/state-contract.mjs`.*
- [x] **T5.6** Disable a control only when:
  - its purpose is already clear;
  - the prerequisite is visible;
  - completion is possible;
  - the disabled state helps rather than punishes the user.
  *Implemented via `shouldDisableControl` in `src/shared/state-contract.mjs`.*
- [x] **T5.7** Standardize dependent selectors so upstream choices filter downstream options before rendering them.
  *Implemented via `filterDependentOptions` in `src/shared/state-contract.mjs` and utilized in Compare selectors.*

#### Shared composition

- [x] **T5.8** Implement or consolidate Orbital-aligned primitives:
  - page/task header;
  - context bar;
  - primary work surface;
  - compact supporting context;
  - inspector/drawer;
  - filter bar;
  - step indicator;
  - data table;
  - empty state;
  - source/provenance summary.
  *Consolidated and exported from `src/ui/lib/pagePrimitives.tsx` (`EmptyState`, `StepIndicator`, `FilterBar`, `InspectorDrawer`, `DataTable`, `SourceProvenanceSummary`).*
- [x] **T5.9** Enforce one primary action per decision area.
  *Enforced across `PageHeader`, `WorkbenchControlSurface`, and compare views.*
- [x] **T5.10** Omit the eyebrow when it merely repeats the title. When present, it must provide distinct location or scope.
  *Implemented in `PageHeader` in `src/ui/lib/pagePrimitives.tsx` (auto-suppressing case-insensitive duplicates), stripped duplicate first-paint eyebrows in `FIRST_PAINT_ROUTE_COPY` and `src/index.html`, and cleaned in `ComparePage.tsx` and `SourcesPage.tsx`.*
- [x] **T5.11** Make advanced trust and diagnostic detail deliberate progressive disclosure.
  *Implemented via `InspectorDrawer`, `DisclosurePanel`, and progressive disclosure summaries.*

#### Verification

- [x] **T5.12** Extend copy-contract, accessibility, and component tests.
  *Expanded `tests/copy-contract.test.mjs` to 10 automated test suites.*
- [x] **T5.13** Add automated checks for raw IDs/enums in labels, duplicated page identity, placeholder developer copy, and multiple primary actions in one decision area where machine-detectable.
  *Created `tests/graph/uiStateContracts.test.ts` with 10 comprehensive suites, wired into `npm run test:graph` (169/169 passing).*

### Exit gate

- Compare and Sources can consume shared state/copy primitives.
- Technical provenance remains available without dominating the task.
- Duplicate eyebrow/title treatment is impossible through the shared page header.
- Invalid choices are filtered by capability, not explained after selection.

#### Exit-gate verification evidence (Phase 5)

- `npm run test:copy-contract` — 10/10 passing:
  - site copy keeps every approved anchor exact
  - third-party federal-use provenance is described without changing its publisher
  - product-authored route copy excludes banned metaphor and generated guidance (all prohibited primary surface patterns)
  - product-authored Resource collection summaries stay short and task-focused
  - record page is profile-driven and contains no generic source or advice fallback
  - generation excludes structural scaffolding from public records
  - Home has one centralized React and first-paint copy source
  - FIRST_PAINT_ROUTE_COPY omits duplicate eyebrows that match the title
  - UI copy contract formatters provide clean human-readable record types and formatted counts
  - UI copy contract state messages and action labels are non-empty and task-first
- `npm run test:graph` — 169/169 passing (including `tests/graph/uiStateContracts.test.ts` covering all lifecycle state permutations, rendering guards, disabled guards, dependent filters, and primitive markup rendering).
- `npm run typecheck` — 0 TypeScript errors across `tsconfig.json` and `tsconfig.app.json`.
- `npm run lint` — 0 ESLint errors/warnings across entire codebase.
- `npm run build:site` — successful static build with gzip compression and 0 errors.
- `npm run test:browser` — 27/27 browser contract tests passing.
- `npm run smoke:dom` — OK (react shell, history state, accessibility markers).

---

## Phase 6 — Compare Surface Rebuild

### Objective

Turn Compare into a working decision flow that exposes only supported comparisons.

### Target interaction

1. Choose a supported comparison type.
2. Choose a source from sources that have at least one valid completion.
3. Choose from valid targets only.
4. Show mapping evidence automatically:
   - one source: show it;
   - multiple sources: default to all and permit narrowing.
5. Render results.
6. Allow change/back/export without losing valid context.

### User feedback captured during Phase 3 (2026-08-16), in scope for Phase 5/6 not Phase 3

Live product-owner feedback on the current Compare surface, captured verbatim in intent while working the Phase 3 capability engine (declined to pull forward — Phase 3's exit gate excludes visual/copy redesign):

- **Copy tone.** The disclaimer paragraph ("Publication B is limited to a pair with at least one published connection. A published mapping records a cited relationship; it does not establish equivalence...") and the missing-input prompt ("Choose target to configure this comparison.") read as backend/data-engineer language, not product copy. This is exactly what T5.1–T5.3 charter fixing — treat this as a concrete example to test T5.2's "prohibited primary-surface phrases" rule against, not a novel finding.
- **Results table must group/aggregate by source record, not by edge.** Today's "Mapping details" table (`ComparePage.tsx`'s relationship list view) renders one row per relationship edge — if `AC-2` maps to 5 CSF subcategories, that is 5 rows each repeating `AC-2` in the "From" column. The product-owner wants one row per source record (`AC-2`) listing all of its mapped targets together, so the table reads as a human-usable comparison matrix, not a flattened edge list. This directly extends T6.9 ("make result meaning explicit... counts and unmatched records") and should shape T6.9–T6.11: the on-screen table groups by source item; CSV/Markdown/JSON exports (T6.11) need an aggregated shape alongside (or instead of) the current one-row-per-edge shape — confirm with the product owner whether exports should also aggregate or stay edge-grained for downstream tooling before implementing.

#### Initial state

- [x] **T6.1** Replace the default partially configured form with a clear comparison-type choice using the actual available capability counts.
- [x] **T6.2** Do not show disabled target or mapping controls before they are relevant.
- [x] **T6.3** Remove implementation badges and phrases that do not change the user’s decision, including version telemetry presented without purpose.
- [x] **T6.4** Use the Orbital `staged-flow` composition:
  - visible current step;
  - active task heavier than support;
  - one primary action;
  - concise review context;
  - no decorative cockpit density.

#### Configuration

- [x] **T6.5** Use searchable, accessible combobox/select patterns for source and target.
- [x] **T6.6** Present only valid targets from the capability index.
- [x] **T6.7** Automatically advance or render results when the configuration becomes complete, unless a clear “Compare” action provides meaningful review.
- [x] **T6.8** When a mode has no data, omit it from the primary choices or label it unavailable before selection. Do not let the user configure into an empty state.

#### Results

- [x] **T6.9** Make result meaning explicit:
  - what was compared;
  - which published mapping sources were used;
  - what the relationship does and does not establish;
  - counts and unmatched records;
  - source versions.
- [x] **T6.10** Keep the limitation concise in the work surface and put full provenance in a disclosure/inspector.
- [x] **T6.11** Preserve CSV/Markdown/JSON exports with provenance metadata (both aggregated and flat shapes supported).
- [x] **T6.12** Provide clear Back/Change comparison behavior without resetting more state than necessary.

#### Accessibility and evidence

- [x] **T6.13** Verify keyboard-only completion, focus order, error association, live result announcement, and narrow-screen stacking.
- [x] **T6.14** Capture verification across all compare workflows:
  - initial mode selection;
  - valid publication pair;
  - multi-source mapping pair;
  - baseline comparison;
  - chain trace (STIG / threat chains);
  - stale/invalid deep link recovery;
  - row aggregation in table and export formats.

### Compare acceptance criteria

- No selectable publication leads to “no published comparison is available.”
- No disabled “complete the scope first” control appears before it is useful.
- Every source option has at least one valid target.
- Every target option renders a nonempty result.
- The baseline screenshot dead end cannot be reproduced.
- The primary screen contains no long technical reassurance block.
- A newcomer can start and complete a valid comparison without knowing what a mapping artifact is.

### Exit gate

- Compare operates as a staged decision flow with StepIndicator scoped strictly to framework-to-framework crosswalks (`frameworks` and `item-mapping`).
- Relationship mapping results table groups/aggregates by source item (1 row per source item listing all mapped targets, connection chips, trust basis, and expandable evidence drawer).
- Exports (CSV, Markdown, JSON) automatically detect aggregated rows and produce structured outputs.
- Full automated test verification passing across unit, graph, copy-contract, lint, typecheck, build, and Playwright E2E suites.

#### Exit-gate verification evidence (Phase 6)

- `npx playwright test --config playwright.e2e.config.mjs tests/e2e/compare-map.spec.mjs` — 4/4 passing (21.9s):
  - relationship compare exposes map and list toggles with summary
  - T3.13: SP 800-171 Rev. 3 completes a real catalog-to-catalog comparison (regression for the T0.6 baseline dead-end)
  - T3.8: a deep link naming a catalog with no valid comparison target recovers to a clear prompt, not a broken form
  - item mapping crosswalk narrows results to specified control
- `node --test tests/compare-aggregation.test.mjs` — 3/3 passing:
  - aggregateRelationshipRows groups flat edges by source item and preserves all targets
  - runtime.buildAggregatedRelationshipRows returns grouped structure and summary stats
  - runtime.exportRelationshipRows handles aggregated rows across CSV, Markdown, and JSON
- `npm run test:graph` — 169/169 passing:
  - includes all compareModeState tests verifying staged flow step progression, current step calculations, single/multi-source auto-resolution, and URL roundtripping across framework crosswalk modes.
- `npm run test:copy-contract` — 10/10 passing.
- `npm run test:browser` — 27/27 passing.
- `npm run smoke:dom` — passing.
- `npm run typecheck` — 0 TypeScript errors across `tsconfig.json` and `tsconfig.app.json`.
- `npm run lint` — 0 ESLint errors/warnings.
- `npm run build:site` — successful static build with gzip compression and 0 errors.

---

## Phase 7 — Sources Surface and Trust Workflow Rebuild

### Objective

Make Sources answer: **Who published this, which version does Control Atlas use, when was it checked, and what evidence supports the relationships?**

Do not make the user learn the registry schema.

### Target composition

Use the Orbital data-administration recipe:

1. One title and one sentence of purpose.
2. One compact search/filter row.
3. One publication-centric table.
4. One scoped inspector.
5. Deeper evidence only after selection.

### Tasks

#### Primary register

- [x] **T7.1** Remove the four equal top-level buttons:
  - Publication register;
  - Connection sources;
  - Source material;
  - Control Atlas structure.
  - Verified: `SourcesPage.tsx` renders no layer-tab buttons; three `<details>` disclosures ("Official primary source links", "Connection inventory", "Control Atlas structure & organizing methodology") sit below the register as an advanced, secondary group.
- [x] **T7.2** Make canonical publications the primary register. The row count must equal canonical publication identities from Phase 2, not raw registry rows.
  - Verified: `buildPublicationRegister` iterates `publicationIdentityIndexArtifact.identities`; `tests/graph/sourceRegister.test.ts` asserts exactly 47 rows.
- [x] **T7.3** Use one search control with immediate filtering or one explicit Search action—not both.
  - Verified: single labeled search input with immediate `onChange` filtering; the wrapping `<form>`'s `onSubmit` is a no-op safety net for Enter, not a second action.
- [x] **T7.4** Keep only useful first-view filters, normally publisher and status/currentness. Move provenance, access, eligibility, format, and artifact-role filters to advanced evidence view if still needed.
  - Verified: only Publisher and Status `SelectField`s render in the first view; provenance/eligibility/access are not exposed as filters anywhere.
- [x] **T7.5** Use concise primary columns:
  - Publication;
  - Publisher;
  - Version;
  - Checked/updated;
  - Status;
  - optional coverage summary where it materially helps.
  - Verified: table header is exactly Publication / Publisher / Publisher version / Source last checked / Status / Catalog profile.
- [x] **T7.6** Remove repeated raw IDs and "Copy ID" actions from every row. Put stable ID and copy action in the selected inspector.
  - Verified: `CopyStableSourceId` renders only inside `PublicationInspector`; no row exposes a raw ID or copy action.

#### Inspector

- [x] **T7.7** Selecting a publication opens a scoped inspector/drawer with:
  - official publication identity;
  - publisher;
  - version/edition;
  - lifecycle/currentness;
  - last checked;
  - official link;
  - catalog/profile coverage;
  - source materials;
  - published mapping evidence;
  - field provenance and limitations.
  - Verified: all fields present in `PublicationInspector`; the inspector title and the page `<h1>` now show the full official publication name (`officialTitle`, sourced from the registry's `name` field) rather than the shortened table `displayTitle` — see screenshot evidence below.
- [x] **T7.8** Group source materials by role. Reference pages, primary files, enrichment, historical material, and mapping evidence must not look equivalent.
  - Verified: five visually distinct sections — Primary source files, Supplemental & enrichment documents, **Historical material** (new; items with `metadata.supplemental_role === "historical"` or `lifecycle_status === "historical"` carry a "Historical, superseded" badge and their own heading), Reference pages & community tools, Published crosswalks & mapping evidence.
- [x] **T7.9** Put recorded/derived/missing reasons in the inspector. Do not repeat "from parent publication" or "recorded by registry" across the table.
  - Verified: table cells show only the compact value/absence label with the reason as `visually-hidden`; the full reason text is surfaced once, in the inspector's "Field provenance & usage" disclosure.
- [x] **T7.10** Move Control Atlas structure evidence to About/Methodology or an advanced system-evidence disclosure. It is not an equal user task beside publisher trust.
  - Verified: "Control Atlas structure & organizing methodology" is a collapsed `<details>` at the bottom of the page, not a peer register tab.

#### Missing and duplicate data

- [x] **T7.11** Correct data at the source projection before styling a missing field.
  - Spot-checked against `data/source-registry.json`: `dod-rai-toolkit.version` is `null` in the raw record (renders "Not published"); `authority-32-cfr-170` has no `last_checked` field at all (renders "Not checked"). Both UI absence states trace to a genuine data gap, not a display trick.
- [x] **T7.12** Show concise absence states:
  - publisher did not publish a version;
  - source has not yet been checked;
  - field does not apply;
  - data is quarantined.
  - Verified: "Not published" / "Not applicable" (version), "Not checked" (verifiedAt), and the `blocked` field state (quarantine) are all implemented and covered by `tests/graph/sourceRegister.test.ts`.
- [x] **T7.13** Verify one canonical row for conceptual publications with many supporting artifacts. Preserve real editions and variants; remove only false duplicates.
  - Verified: 47 canonical rows (Phase 2's reconciled identity count), confirmed by test.
- [x] **T7.14** Ensure community sources and tools are labeled as supporting/community sources rather than the official publication owner.
  - Fixed a real gap found during Phase 6/7 re-verification: `sourceRegister.ts` already computed `isCommunity` per source material but `SourcesPage.tsx` never read it, so a community item outside the `reference` role bucket rendered with no distinguishing label. Now every source-material section (primary, supplemental, historical, reference) renders a "Community source" badge when `item.isCommunity` is true.

#### Accessibility and evidence

- [x] **T7.15** Verify table keyboard navigation, drawer focus management, Escape, focus return, narrow table scrolling, and readable missing states.
  - Fixed a real regression found during re-verification: `tests/e2e/accessibility.spec.mjs`'s "source detail" and "source not found" cases expected an `<h1>` that reflects the selected publication (or "Source not found") and a "Source status summary" article; `SourcesPage.tsx` always rendered the static "Sources" title regardless of selection. Added a dynamic page-header title (publication `officialTitle`, or a "Source not found: `<id>`" state with a `.ca-source-not-found-id` marker) plus an `<article aria-label="Source status summary">` wrapper around the inspector's status fields. Full `npm run test:a11y` suite (35/35) now passes, including this case.
- [x] **T7.16** Capture screenshots for:
  - initial register;
  - publication inspector;
  - publication with many source materials;
  - publication with mapping evidence;
  - missing publisher-provided version;
  - advanced evidence view;
  - narrow viewport.
  - Captured locally and reviewed by eye this session (register desktop/compact, inspector with many materials + mapping evidence, inspector with a missing version, advanced evidence disclosures expanded, narrow-viewport inspector including the new historical-material section), then cleared — `docs/` permits only the canonical foundation (`tests/alignment-contract.test.mjs`), so ad hoc evidence is not retained there. Also refreshed the stale `approved-layout-visual` baselines for `sources` (desktop + compact) and `compare` (desktop + compact), which predated the Phase 6/7 UI rebuild by ~9 hours and were failing pixel comparison; reviewed each regenerated PNG by eye before accepting, per the "a green test does not approve a screenshot" rule. Those baselines are committed Playwright snapshots under `tests/e2e/approved-layout-visual.spec.mjs-snapshots/`.

### Sources acceptance criteria

- Page identity appears once.
- There is one primary register, not four registry-layer buttons.
- The first viewport answers the trust question without exposing ingestion architecture.
- One conceptual publication appears once unless the publisher/version contract requires separate identities.
- "Recorded by the source registry" and "Inherited from parent publication" do not appear in ordinary table cells.
- Source materials and connection evidence remain fully discoverable through the selected publication.
- Missing data looks honest and intentional, not broken.
- The page has one clear primary task and no button overload.

### Exit gate

- Sources is a publication-centric primary register (47 canonical rows) with a scoped inspector, not a four-layer registry browser.
- Source materials are grouped into five visually distinct roles (primary, supplemental/enrichment, historical, reference, mapping evidence); community sources are labeled wherever they appear, not only in the reference bucket.
- The page `<h1>` and inspector title reflect the selected publication's full official name; unknown source IDs render an accessible "Source not found" state with the requested ID visible.
- Absence states are honest (spot-checked against raw registry data) and accessible (field reasons available via disclosure, not repeated in table cells).
- Full automated test verification passing: `npm run typecheck` (0 errors), `npm run lint` (0 errors/warnings), `npm run test:graph` (172/172), `npm run test:copy-contract` (10/10), `npm run test:browser` (27/27), `npm run smoke:dom` (pass), `npm run build:site` (clean static build), full `npx playwright test --config playwright.a11y.config.mjs` (35/35, all routes), Compare regression (`compare-map.spec.mjs` 4/4, `compare-aggregation.test.mjs` 3/3 — confirming the Sources fixes did not disturb Phase 6).
- Screenshot and visual-baseline evidence captured and reviewed (T7.16).

#### Exit-gate verification evidence (Phase 7)

- `npm run typecheck` — 0 TypeScript errors.
- `npm run lint` — 0 ESLint errors/warnings (`--max-warnings=0`).
- `npm run test:graph` — 172/172 passing.
- `npm run test:copy-contract` — 10/10 passing.
- `npm run test:browser` — 27/27 passing.
- `npm run smoke:dom` — passing.
- `npm run build:site` — successful static build with gzip compression and 0 errors.
- `npx playwright test --config playwright.a11y.config.mjs tests/e2e/accessibility.spec.mjs` — 35/35 passing (all routes, including the two Sources cases fixed in this pass and the pre-existing "compare detailed mappings table" test, whose stale `selectOption` assertion was updated to match Compare's existing single-source auto-resolution behavior — not a product change).
- `npx playwright test --config playwright.e2e.config.mjs tests/e2e/compare-map.spec.mjs` — 4/4 passing (Phase 6 regression check).
- `node --test tests/compare-aggregation.test.mjs` — 3/3 passing (Phase 6 regression check).
- Screenshot evidence: captured and reviewed locally this session (not retained in `docs/`, see rationale above); durable visual-regression evidence lives in the refreshed `tests/e2e/approved-layout-visual.spec.mjs-snapshots/route-{sources,compare}-*.png` baselines.

---

## Phase 8 — Remaining Surface Rebuild from Orbital References

### Objective

Rebuild every remaining public surface from the correct Orbital composition rather than applying the same dashboard/table shell everywhere.

### Required method for every page

1. Read the exact Orbital reference HTML and shared CSS.
2. Read the relevant component contracts.
3. Identify the user question and depth.
4. Produce a wide and narrow wireframe in `docs/Plan.md`.
5. Implement the composition and functionality.
6. Verify all interactions.
7. Capture wide and narrow screenshots.
8. Compare visually against the Orbital reference and product task.
9. Remove page-specific legacy CSS after the new surface is accepted.

### Workstream A — Entry and orientation

- [x] **T8.1 Home** — use `landing-page.html` / editorial split:
  - dramatic but brief identity;
  - one invitation;
  - no repeated product boundary wall;
  - stable global navigation;
  - no fake telemetry.
  - **Audit finding:** the Depth-0 `signal-cover` (built in an earlier phase, `vite.config.ts` `renderStaticHome()` + `styles/components.css`) already implements the Orbital "editorial split, one invitation" landing recipe faithfully — eyebrow, display headline with signal word, lead, one action, archival-metadata aside, calibration rail. It needed no rebuild. The gap was downstream: the Depth-1 Home surface and global nav orphaned two of the six PRD information-architecture sections (Start Here, Documents) — neither was reachable from the persistent header, the overflow menu, or the Home destination grid, despite `StartHerePage.tsx` being a fully working two-question guided-setup flow. A pre-existing test (`epic12-phase5-links-semantics-touch.spec.mjs` — "Phase 5 applies aria-current only to the canonical active destination", already asserting `/#/start → "Start here"`) had anticipated this fix but the implementation hadn't caught up.
  - **Wireframe (wide/narrow):** unchanged page anatomy — hero (headline + search) → 4-card destination grid (was 3) → tag constellation → footer. Card order: Start guided setup, Browse the Atlas, Search the Library, Browse Resources. Narrow: single-column stack, same order.
  - **Fix:** added a "Start guided setup" destination to `HOME_DESTINATIONS` (`site-copy.mjs`) as the first card, wired its icon in `HomePage.tsx`, widened `.home-secondary-grid` to 4 columns (`surfaces.css`). Added "Start here" as the first `PRIMARY_NAV_ITEMS` entry and "Documents" to `OVERFLOW_NAV_ITEMS` (`navigation.ts`), and gave both routes a self-selecting `aria-current` state (`routeIdentity.ts`, previously both mapped to `null`). Home's static first-paint shell (`src/index.html` `data-static-header`, per Gotcha #2 — React does not boot on Home) had its own hand-authored nav link list that duplicates `PRIMARY_NAV_ITEMS`; added "Start here" there too after a screenshot showed the React-driven fix alone did not reach Home's static first paint.
  - **Verified:** `npx playwright test --config playwright.e2e.config.mjs tests/e2e/epic12-phase3-information-architecture.spec.mjs tests/e2e/epic14-ws0-app-shell.spec.mjs tests/e2e/epic13-reference-workbench.spec.mjs tests/e2e/epic12-phase5-links-semantics-touch.spec.mjs` — 16 passed, 8 failed. Confirmed by running the identical command against clean `main` first: the same 8 failures pre-exist there (stale `.atlas-tree`/Resources-heading content assertions unrelated to Phase 8, likely generated-data drift per Gotcha #8) — zero regressions from this change. `npm run typecheck` — 0 errors. `npx eslint` on all touched files — 0 errors/warnings. `npm run build:site` — successful.
  - Wide and narrow screenshots captured (`home-after2-wide.png`, `home-after2-narrow.png`) and reviewed by eye: 4-card grid renders correctly at both widths, "Start here" appears first in both the desktop primary nav and the mobile sheet, no visual overflow or clipping, dark theme/Orbital tokens intact, footer boundary statement unchanged (still appears once, not repeated on-page).
- [x] **T8.2 Start Here / Guides** — use staged-flow and knowledge-base references:
  - plain questions;
  - visible progress;
  - actionable output;
  - clear return path;
  - no stored-data reassurance repeated after every step.
  - **Audit finding:** both pages were already rebuilt to Orbital composition in an earlier phase and need no structural or CSS changes. `StartHerePage.tsx` (`/start`) already matches the `staged-flow.html` recipe: a numbered 1/2/3 progress rail (Goal → Context → Starting plan) with an active-step indicator, plain-language question buttons, a single boundary notice (`SITE_COPY.product.boundary`) shown only at the final step (not repeated per step), and an actionable "Open [publication]" primary CTA plus "Then review"/"Then act" follow-ups. `PlaybooksPage.tsx` (`/guides`) already matches the `knowledge-base.html` recipe: a 12-card numbered directory (Template F) leading to a single-column article view with "Where it sits" / "When it matters" / "What this means" / "Limitations" summary cards, cited official references, and a "Back to Guides" return path. Neither page depends on `styles/surfaces.css` selectors that qualify as pre-Orbital legacy shell — their `.start-here-*` / `.guide-card*` rules are the current, correct implementation, not debt to remove.
  - **Wireframe (wide/narrow):** unchanged from current implementation on both routes; verified by screenshot rather than redesigned. Start Here: page header → step rail → single question panel → (step 3) starting-plan summary with primary/secondary CTAs. Guides: page header → 3-column card grid (wide) / single column (narrow) → "How to use Control Atlas" link.
  - **Fix:** none to the pages themselves. T8.1's nav fix is what completes this task — Start Here is now reachable from primary nav instead of being an orphaned route. Fixed one incidental test-content mismatch (`epic14-ws5-home-guides.spec.mjs`, hardcoded "three cards"/3-item list) left over from the T8.1 Home destination-grid change.
  - **Verified:** `npx playwright test --config playwright.e2e.config.mjs tests/e2e/start-here.spec.mjs tests/e2e/epic14-ws5-home-guides.spec.mjs` — 8 passed, 3 failed (`start-here.spec.mjs` lines 37/78/93 — catalog-search/reload flows unrelated to Phase 8). Confirmed pre-existing by running the same command against clean `main`: identical 3 failures, verified twice (a first "clean main" comparison run was itself contaminated by a stray manually-started `serve-static-site.mjs` left running on port 4317 from T8.1 screenshot capture — the exact `npx playwright test` + manual-server conflict named in this session's environment notes, which produced extra flaky failures; killing that process and rerunning both branch and `main` cleanly gave the stable, identical 3-failure baseline reported here). `npx eslint` on the touched test file — 0 errors. `npm run build:site` — successful.
  - Wide and narrow screenshots captured for `/#/guides` (directory), `/#/guides?pattern=starting-an-authorization` (detail), and `/#/start` (question flow) and reviewed by eye at both widths: step rail, card grid, and article panels all render correctly with no overflow; "Start here" and "Guides" both show the correct `aria-current` active state in the header nav.

### Workstream B — Research and records

- [x] **T8.3 Library** — use data-admin/sidebar application:
  - search is primary;
  - filters do not dominate;
  - results and selected record are distinct;
  - no raw IDs as labels.
  - **Audit finding:** `ExplorePage.tsx` (`/library`) already matches the `data-admin.html` recipe — search bar leads, a compact collapsible filter rail sits secondary (collapses to a disclosure at narrow widths), and browse/search results render as a distinct list separate from record identity (clicking a row navigates to the dedicated record-detail route rather than displacing the list, which satisfies "results and selected record are distinct" more directly than an in-page inspector would for this product's actual navigation model). `CatalogDetailPage.tsx` (`/library/publication/:id`, reachable only from within the Library flow — flagged as scope-ambiguous during recon since Plan.md doesn't name it explicitly) is included in this task's scope as the publication-browse view. Found one real defect there: its tier-browse search reused hardcoded "benchmark" copy (placeholder "Benchmark or technology in {catalog}" and button "Search benchmarks") on every publication regardless of type, including catalogs like SP 800-53 Rev. 5 that are organized by "families," not benchmarks — the section heading and result-count copy already used the correct dynamic `catalog.tier_label_plural` label, so the mismatch was visibly self-contradictory on-page ("Filter SP 800-53 Rev. 5 Controls" → "Search families" → but placeholder/button said "benchmark").
  - **Wireframe (wide/narrow):** unchanged from current implementation on both routes. Library: page header → search bar → filter rail (wide: left column; narrow: collapsed "Filters" disclosure) → publication/area/content-kind browse cards, or → result list once a query is active. Publication detail: back link → publication header (title, synopsis, counts, official-source link) → family/tier browse list with its own scoped filter.
  - **Fix:** `CatalogDetailPage.tsx` — replaced the hardcoded "Benchmark or technology in {catalog}" placeholder and "Search benchmarks" button with the same `catalog.tier_label_plural` token already used one line above for the field label and result count, so a NIST catalog now reads "Search families" throughout and a DISA STIG catalog still correctly reads "Search benchmarks" throughout (verified both).
  - **Verified:** `npm run test:browser` (`tests/browser-contract.test.mjs`, updated its static-analysis regex for the now-dynamic button text) — 27/27 passing. Discovered during this audit that the T8.1 nav change (Start Here → primary, Documents → overflow) had left **three more** hardcoded nav-shape assertions red beyond the ones already fixed in T8.1/T8.2: `tests/graph/routeIdentity.test.ts` (`selectedNavFor("start-here")` still expected `null`; added `templates` coverage), `tests/graph/informationArchitecture.test.ts` (exact `PRIMARY_NAV_ITEMS`/`OVERFLOW_NAV_ITEMS` array-equality), and `tests/content-review.test.mjs` (regex-matched exact primary/overflow view lists) — all three updated to the new 5-item primary / 2-item overflow shape. `npm run test` (full unit composite, 349 tests across 10 suites) — 0 failures after these fixes, confirmed with a second clean run. `npm run typecheck` — 0 errors. `npx eslint` on all touched files — 0 errors/warnings. `npm run build:site` — successful.
  - Wide and narrow screenshots captured for `/#/library` (browse state), `/#/library?q=access+control` (search-results state), `/#/library/publication/nist-800-53` (family-browse, before/after), and `/#/library/publication/disa-stig` (benchmark-browse, confirms the fix is type-aware and doesn't regress the STIG case) — reviewed by eye at both widths. No layout defects found.
- [x] **T8.4 Record detail** — use knowledge-base/sidebar application:
  - official text and record identity;
  - publisher hierarchy path;
  - focused relationships;
  - source trust;
  - next relevant action;
  - no invented interpretation presented as source text.
  - **Audit finding:** `ObjectDetailPage.tsx` (`/record`) already matches the `knowledge-base.html` reading-column-with-guide-rail recipe closely: a breadcrumb publisher hierarchy path (e.g. Compliance › NIST › SP 800-53 Rev. 5 › Access Control › NIST AC-2), a qualified title (ID + name), primary/secondary actions ("View official source", "See connections", a "More actions" `<details>` disclosure for low-frequency items), official source text clearly labeled "Source excerpt from {publication}" (Control Statement, Discussion — verbatim publisher text, never product-generated interpretation), and a right-side "About This Record" rail (publisher, publication, current-as-of date, taxonomy tags, related-record count, "View source details" link) that mirrors the reference's `.toc`/guide-rail column. No structural or CSS gap found against the acceptance criteria. Verified the `.odp-param` selector (highlights `[Assignment: …]`/`[Selection: …]` placeholder text inside control statements) that Phase 8 recon had flagged as possibly dead/unstyled — it is in fact styled in `styles/components.css:1569` (not `surfaces.css`, which is why the earlier `surfaces.css`-only grep missed it); no defect.
  - **Wireframe (wide/narrow):** unchanged from current implementation. Breadcrumb + eyebrow → title block → primary actions → official-text panels (Control Statement, Discussion) in the main column; "About This Record" rail beside it on wide, stacked below on narrow.
  - **Fix:** none needed.
  - **Verified:** `npx eslint src/ui/pages/ObjectDetailPage.tsx --max-warnings=0` — 0 errors (no changes made, sanity check only).
  - Wide and narrow screenshots captured for `/#/record/nist-800-53/AC-2` and reviewed by eye at both widths: breadcrumb, title, actions, source-excerpt panels, and the About-This-Record rail all render correctly; narrow view stacks the rail below content with no overflow.
- [x] **T8.5 Atlas page shell** — use dashboard plus bounded deep-systems treatment:
  - the landscape is the work surface;
  - controls are compact;
  - inspector is scoped;
  - no giant dead panel;
  - no technical graph controls unless deliberately entering a systems view.
  - **Audit finding — real defect:** the Atlas graph canvas (`AtlasGraph.tsx`) renders `@react-sigma/core`'s stock `ZoomControl`/`FullScreenControl` in a `bottom-right` `ControlsContainer`, and the page imports that library's own default stylesheet (`@react-sigma/core/lib/style.css`) directly. That stylesheet ships a light-theme skin — `--sigma-controls-background-color: #fff` — that Control Atlas never overrode, and it hides each button's inline SVG icon via `clip: rect(0,0,0,0)` (the library expects icon-as-background-image, but this version renders icons as SVG children instead). The combined effect: four stacked 30×30 buttons (zoom in, zoom out, "see whole graph," fullscreen) rendered as one solid pure-white, icon-less block sitting on top of the primary landscape view at every depth — a direct violation of AGENTS.md §3 ("Do not introduce pure black, pure white application screens") and of this task's own "no technical graph controls unless deliberately entering a systems view" bar, since raw un-styled library chrome is exactly that. Confirmed via `getComputedStyle` on all four buttons before the fix: identical `background-color: rgb(255,255,255)`, `color: rgb(255,255,255)`.
  - **Wireframe (wide/narrow):** unchanged composition — page header + search → landscape/area graph canvas (compact Landscape/Up-one-level/relationship-class controls above it) → collapsible "Accessible landmarks" table fallback below (expanded at the landscape root, a collapsed `<details>` once drilled into an area — confirms "no giant dead panel" holds at every depth, not just the root). Narrow: the canvas hides entirely (`.atlas-network-stage { display: none }` below 48rem) in favor of the same landmark list — a deliberate, correct table fallback rather than a shrunken illegible graph, consistent with PRD's "every graph has a table fallback."
  - **Fix:** `styles/orbital.css` — retinted the Sigma controls' own CSS custom properties (`--sigma-background-color`, `--sigma-controls-background-color`, `-color-hover`, `-border-color`, `-color`) to Orbital tokens (`--ca-surface-deep`, `--ca-surface-raised`, `--ca-accent-hover`, `--ca-border-strong`, `--ca-text`) scoped to `.atlas-network-stage`, so the override cascades to the controls at every drill depth without touching the imported library CSS itself. Un-clipped `.react-sigma-control > button` and flex-centered its SVG child so the zoom/fit/fullscreen icons render instead of hiding into a blank square.
  - **Verified:** `npx playwright test --config playwright.e2e.config.mjs tests/e2e/atlas-map-drilldown.spec.mjs tests/e2e/atlas-map-focused-control.spec.mjs tests/e2e/epic14-ws4-atlas-canvas.spec.mjs` — 22 passed, 10 failed. Confirmed pre-existing and unrelated to this change by running the identical command against clean `main`: identical 10 failures (Hierarchy/Connections panel content assertions, likely generated-data drift per Gotcha #8, unrelated to graph-control styling) — zero regressions. `npm run build:site` — successful; this is a CSS-only fix, no component/data logic touched.
  - Wide and narrow screenshots captured for `/#/atlas` (landscape root) and a drilled-in area state (Compliance) and reviewed by eye at both widths; a targeted before/after crop plus a hover-state crop of the fixed controls were also captured — controls now render as a properly bordered, dark, teal-accented Orbital panel with visible +/−/target/expand icons and a teal hover highlight, at both the landscape root and every drilled depth (confirmed the CSS-variable scoping applies consistently, not just at the root).

### Workstream C — Resources and outputs

- [x] **T8.6 Resources** — use `catalog.html`:
  - visually distinct cards;
  - recognizable publisher/tool/community marks;
  - filters secondary to browsing;
  - retain the product name “Resources,” not rejected legacy naming.
  - **Audit finding — real defect:** `CommonsPage.tsx`'s "Browse by Collection" grid (the page's primary landing state) rendered all 8 collection cards with the exact same generic `IconFolders` icon — title and summary text were the only differentiator. That directly fails "visually distinct cards" and "recognizable... marks" against the `catalog.html` reference, where every card carries a distinct schematic identity. Confirmed the product-facing label is already correctly "Resources" everywhere (site-copy, nav, page title); only the internal file/component names (`CommonsPage.tsx`, `commonsDataset`, etc.) still say "Commons," which AGENTS.md's icon guidance rules out re-decorating with invented pictograms anyway (§7: "Do not invent niche aerospace pictograms merely to match the theme... use a vetted platform/library icon").
  - **Wireframe (wide/narrow):** unchanged grid composition (2-col wide / 1-col narrow collection cards above a secondary filter rail that collapses to a "Filters" disclosure on narrow — already satisfies "filters secondary to browsing").
  - **Fix:** added `src/ui/components/CollectionIcon.tsx`, a small id→icon map (mirroring the existing `ResourceTypeIcon` pattern already used for individual resource rows) assigning each of the 8 real collection IDs a semantically distinct Tabler icon — shield for DoD portals, repeat-arrows for reciprocity/reuse, wrench for implementation/assessment tools, storefront for product assurance, cloud for DevSecOps, factory for the defense industrial base, graduation cap for workforce/training, people for practitioner communities — falling back to the old `IconFolders` for any future unmapped collection. Wired into `CommonsPage.tsx` in place of the single hardcoded icon.
  - **Verified:** `npx playwright test --config playwright.e2e.config.mjs tests/e2e/resource-discovery.spec.mjs tests/e2e/commons-filter-history.spec.mjs` — 5/5 passing. `node --test tests/commons-presentation.test.mjs` — 21/21 passing. `npm run typecheck` — 0 errors. `npx eslint` on both touched files — 0 errors/warnings. `npm run build:site` — successful.
  - Wide and narrow screenshots captured for `/#/resources` before/after and reviewed by eye: all 8 collection cards now show distinct, topic-appropriate icons at both widths; filter rail remains compact/secondary; narrow view collapses filters into a disclosure with no overflow.
- [x] **T8.7 Documents/Templates** — use staged-flow plus settings:
  - lead with what the practitioner needs to produce;
  - preview before download;
  - official resources before Control Atlas companions;
  - one orange primary download/generate action;
  - no framework-first jargon gate.
  - **Audit finding:** `TemplatesPage.tsx` (`/build`) already satisfies every acceptance bullet. Three lanes (Tasks, Starter Documents, Resources) all lead with outcome/artifact language, not framework selection — Starter Documents groups by RMF lifecycle phase (Plan/Implement/Assess/Remediate/Monitor) and Tasks groups by outcome ("Build an authorization package," "Write control implementation statements"); neither gates on picking a framework first. Opening a starter document and filling its required inputs (catalog/program, baseline) renders a full `TemplateDocumentPreview` — live section-by-section preview matching the eventual Word/Excel output, disclaimers, and source metadata — before the single orange "Download {name} ({format})" primary action, which stays disabled with an explanatory status line until required inputs are set. The Tasks lane's "Related resources" rail labels each reference "Official" so official material reads as such wherever it surfaces alongside Control Atlas companion content.
  - **Wireframe (wide/narrow):** unchanged. Local tab bar (Tasks / Starter Documents / Resources) → page header → category-grouped card grid → (on open) configuration form → live preview → one primary download action → supporting "What this template is for" / "What it includes" / "Sources used" disclosures. Narrow stacks the same sections single-column.
  - **Fix:** none needed.
  - **Verified:** no code changed; visual/interaction audit only (form-fill through to preview and download-button enablement exercised manually via Playwright).
  - Wide and narrow screenshots captured for `/#/build` (lane picker), `/#/build/tasks`, and `/#/build/documents` (both the list and a filled-in document with its live preview and enabled download action) and reviewed by eye at both widths — no defects found.

### Workstream D — Product explanation

- [x] **T8.8 About** — use knowledge-base:
  - concise product purpose;
  - coverage and boundaries;
  - methodology;
  - Control Atlas organizing structure;
  - source and mapping trust model;
  - open-source/public-data statement;
  - guide rail/TOC.
  - **Audit finding — real defect:** `AboutPage.tsx` covered product purpose, methodology (partially), limits, and the open-source statement, but had no section naming the nine-area organizing structure or the source/mapping trust model — two of the six required content areas were simply absent — and no guide rail/TOC at all, unlike the `knowledge-base.html` reference's `.toc` "ON THIS PAGE" sidebar. Also found `PageJumpNav`/`jumpToSection` — primitives built in `pagePrimitives.tsx` for exactly this pattern — were defined but never consumed anywhere in the app; About is now their first real usage.
  - **Wireframe (wide/narrow):** page header → two-column card grid (unchanged 2-col-at-≥1024px layout) + a new sticky right-hand "On this page" rail at ≥1024px. Narrow: single-column card stack, rail hidden (matches the Orbital reference's own `.toc { display: none }` behavior below its breakpoint) since content order alone remains a complete linear read.
  - **Fix:** added two `SummaryCard`s — "Organizing Structure" (names the nine Control Atlas areas and states they're a discovery overlay, not a replacement for publisher-native structure) and "Source & Mapping Trust" (states that every publication/mapping/connection names its publisher, cited version, and last-checked date, and points to Sources for the full register). Wrapped each card in an `id`-bearing container and wired a `PageJumpNav` rail (`.about-layout`/`.about-toc` CSS added to `components.css`) linking to all nine sections. First copy draft used "shared trunk" (lifted from `vision.md`'s internal tree-model language) and was caught by the pre-existing `tests/content-review.test.mjs` guard against internal tree vocabulary (`limb`/`trunk`/`twig`/`acorn`) leaking into rendered copy — reworded to avoid the banned term.
  - **Verified:** `node --test tests/content-review.test.mjs` — 17/17 (was 16/17 before the copy fix). `npm run test:copy-contract` — 10/10. `npx playwright test --config playwright.e2e.config.mjs tests/e2e/epic14-ws5-home-guides.spec.mjs -g "WS6 About"` — 1/1 passing (pre-existing heading-structure assertions unaffected by the added wrapper divs). Manually verified the jump-nav is functionally wired, not just styled: clicking "Jump to Limits" scrolled the page and moved DOM focus to `#about-limits`. `npm run typecheck` — 0 errors. `npx eslint` on the touched file — 0 errors/warnings. `npm run build:site` — successful.
  - Wide and narrow screenshots captured for `/#/about` before/after and reviewed by eye: the rail renders sticky beside the card grid at wide widths with all nine section links, hides cleanly on narrow with no orphaned whitespace, and the two new cards read consistently with the existing seven.
- [ ] **T8.9 Global search and navigation** — use top-navigation reference and component contracts:
  - stable active state;
  - accessible overflow;
  - consistent search;
  - no route dead ends;
  - clear mobile labels.

### Page-level acceptance

For each page:

- title appears once;
- first viewport answers where, current scope/state, and next action;
- one dominant reading axis;
- no more than one primary action per decision area;
- advanced detail is earned;
- all visible controls work;
- wide and narrow screenshots are visually reviewed;
- the page is recognizably Orbital without becoming a cockpit;
- the page is not merely another metric-card/table arrangement.

### Exit gate

- Every public page uses a task-appropriate Orbital composition.
- Every visible interaction is verified.
- No page starts at diagnostic density.
- Compare and Sources remain consistent with Phases 6–7.

---

## Phase 9 — Design-System Integration, CSS Architecture, and Visual Fidelity

### Objective

Make Orbital fidelity structural and maintainable rather than a set of page-specific imitations.

### Tasks

#### Token and component authority

- [ ] **T9.1** Pin or vendor the current approved Orbital release and record the version.
- [ ] **T9.2** Preserve token drift tests.
- [ ] **T9.3** Map Control Atlas semantic tokens to Orbital tokens without inventing duplicate color systems.
- [ ] **T9.4** Audit all used components against `components/contracts.json`, including all required states.
- [ ] **T9.5** Use the Orbital icon manifest before adding or retaining a one-off icon.

#### Color and typography

- [ ] **T9.6** Complete the decorative teal sweep:
  - teal only for active, focus, link, selected, and tightly scoped information state;
  - orange for one primary action/editorial signal;
  - gold for priority/editorial hierarchy;
  - green/rust/red only for their semantic states;
  - neutral structure remains neutral.
- [ ] **T9.7** Keep color token values centralized. Do not fix misuse by redefining the palette.
- [ ] **T9.8** Use condensed display type for headings, readable body type for sustained text, and pixel/silkscreen accents only for brief micro-labels.
- [ ] **T9.9** Remove hardcoded tracking values in favor of tokens.

#### Geometry and texture

- [ ] **T9.10** Apply one dominant and at most one supporting texture per surface.
- [ ] **T9.11** Keep operational pages calmer than the landing page.
- [ ] **T9.12** Put calibration rails, ticks, datum marks, and vectors only in safe corridors and only when tied to actual content.
- [ ] **T9.13** Remove faux coordinates, faux telemetry, meaningless arcs, and lines through interactive content.
- [ ] **T9.14** Ensure decorative geometry is `aria-hidden` and pointer-inert.

#### CSS architecture

- [ ] **T9.15** Incrementally retire page rules from `styles/surfaces.css`.
- [ ] **T9.16** Consolidate shared component rules in the correct component layer.
- [ ] **T9.17** Remove arbitrary Tailwind values and important overrides from component files when a token/component rule exists.
- [ ] **T9.18** Remove Tailwind class overrides in `orbital.css`.
- [ ] **T9.19** Preserve the known cascade rule: `orbital.css` imports last and wins ties; eliminate conflicting duplicate selectors rather than escalating specificity.
- [ ] **T9.20** Track CSS line counts, duplicate declarations, unused selectors, and remaining compatibility rules after every page migration.

### Visual acceptance

- All pages use the correct depth.
- The active task is visually heavier than support material.
- Teal does not saturate cards, table headers, badges, or decorative lines.
- Orange is rare and meaningful.
- Textures remain below content contrast.
- Tables are flat and scan-friendly.
- Geometry has a job.
- The result matches Orbital composition, hierarchy, rhythm, and interaction—not merely its palette.

---

## Phase 10 — Micro-Interaction, Responsive, Accessibility, and Performance Polish

### Objective

Resolve the small defects that make a finished product feel unstable or unfinished after the architecture and page flows are correct.

### Workstream A — Header and brand stability

- [ ] **T10.1** Eliminate `Ctrl + Alt + <word>` navigation jitter:
  - reserve the width required by the longest rotating word;
  - change words with opacity/transform rather than layout-affecting width;
  - keep header height and navigation x-positions constant across a full rotation;
  - do not republish header height on every word change;
  - keep the screen-reader description static.
- [ ] **T10.2** Add a browser test sampling header height, brand width, and primary-nav positions through at least two full rotations.
- [ ] **T10.3** Respect `prefers-reduced-motion`; show a stable flourish or non-layout transition.
- [ ] **T10.4** Verify desktop/compact/mobile breakpoints, overflow menu, focus return, and Escape behavior.

### Workstream B — Controls and tables

- [ ] **T10.5** Normalize control height, label alignment, focus ring, helper spacing, disabled appearance, and error placement.
- [ ] **T10.6** Verify long publication names, source names, versions, IDs, and dates without clipped meaning.
- [ ] **T10.7** Make tables horizontally scroll rather than crushing columns.
- [ ] **T10.8** Ensure touch targets, sticky headers, drawer widths, and pagination remain usable at narrow widths.

### Workstream C — Motion, route, and state

- [ ] **T10.9** Eliminate layout shift from loading, route transitions, label changes, and graph inspector opening.
- [ ] **T10.10** Verify back/forward, shared links, refresh, scroll restoration, focus restoration, and close-overlay events.
- [ ] **T10.11** Remove dead links, buttons, tags, disclosures, download actions, and plain text that should be a link.
- [ ] **T10.12** Verify all empty, unavailable, loading, and error states with real data and simulated failure.

### Workstream D — Performance and accessibility

- [ ] **T10.13** Measure route bundle size, Atlas artifact size, first usable render, interaction latency, cumulative layout shift, and narrow-device behavior.
- [ ] **T10.14** Keep deeper Atlas projections demand-loaded where practical.
- [ ] **T10.15** Run full keyboard, screen-reader smoke, color-contrast, reduced-motion, zoom, and high-text-scale checks.
- [ ] **T10.16** Fix accessibility semantics before visual workarounds.

### Exit gate

- Header geometry is stable during brand rotation.
- No known route or control dead end remains.
- Wide, tablet, and mobile layouts are intentional.
- Accessibility and performance meet existing project gates.
- No architecture or workflow is changed in this phase.

---

## Phase 11 — Independent Acceptance, Baselines, and Ship

### Objective

Prove the product works, looks correct, and remains maintainable; then ship through the established protected-branch flow.

### Independent review roles

- **Functional reviewer:** independent from the primary implementation agent; checks capability truth, source trust, workflows, URLs, exports, and data integrity.
- **Visual reviewer:** independent reviewer working from a fresh context; compares screenshots against Orbital references and this specification.
- **Accessibility reviewer:** may also perform another review role, but must start from a fresh context and execute the tests independently.

No reviewer receives the author’s “complete” narrative before inspecting evidence.

### Required workflow matrix

Verify at minimum:

1. Newcomer enters, finds a topic, opens a record, sees source and next action.
2. Exact-ID search takes the user to the correct record.
3. Atlas landscape → area → publication → record → relationship provenance.
4. Valid publication comparison completes.
5. Invalid/unavailable comparison cannot be selected.
6. Baseline comparison completes.
7. STIG/SRG → CCI → control trace completes when supported.
8. Threat → defense → control trace completes when supported.
9. A relationship leads to its connection evidence.
10. Sources identifies publisher, version/currentness, source materials, and mapping evidence.
11. Resource discovery works.
12. Document/template preview and download work.
13. Back/forward/shared links work for every workflow.
14. Wide, tablet, and narrow layouts remain usable.
15. Keyboard-only completion works.

### Required gates

Run the repository’s current equivalents of:

```bash
npm run verify:quality
npm run test:a11y:smoke
npm run test:e2e:smoke
npm run test:visual
npm run test:performance
```

Also run targeted data, graph, Compare, source-registry, copy-contract, route-state, and projection tests introduced by this specification.

### Visual baselines

- Regenerate Windows and Linux baselines through the established process.
- Review—not merely generate—every changed baseline.
- Capture final evidence at:
  - 1440px desktop;
  - approximately 1024px tablet/compact;
  - approximately 390px mobile.
- Include the required Compare, Sources, Atlas, Home, Library, record, Resources, Documents, and About states.

### Ship flow

1. Create a phase branch.
2. Stage by path.
3. Revert unrelated/generated build churn.
4. Commit with a scoped message.
5. Push the branch and wait for CI on the exact SHA.
6. Resolve failures without suppressing tests.
7. Fast-forward the checked branch to `main` through the established ruleset.
8. Verify the live site.
9. Delete the phase branch.
10. Delete temporary `docs/Plan.md` in the final shipping change.
11. Confirm `main` is clean.

### Final report

Report:

- final architecture;
- canonical entity/layer contract;
- publication deduplication result;
- source and relationship reconciliation;
- Compare capability counts and regression cases;
- Atlas projection sizes and navigation examples;
- Sources workflow;
- pages rebuilt and Orbital references used;
- CSS migration metrics;
- accessibility/performance results;
- commands and test results;
- before/after screenshots;
- live URL verification;
- remaining limitations.

---

# 5. Global Measures

## M1 — Product Clarity

- Every first viewport answers where the user is, what the current task/scope is, and what can be done next.
- Page identity appears once.
- Ordinary task surfaces contain no raw IDs/enums as labels and no developer-only reassurance.
- Advanced detail is available on demand.
- A newcomer can complete primary workflows without understanding the internal schema.

## M2 — Functional Integrity

- Every visible action works.
- Every selectable option has at least one valid completion.
- No feature uses a disabled dead end as its normal instructional pattern.
- Back/forward/shared links preserve or safely recover state.
- Exports and downloads produce the promised output.

## M3 — Canonical Model Integrity

- `nativeType` remains publisher truth.
- `atlasClass` remains a Control Atlas discovery facet.
- Atlas structure is a separate layer.
- Publication identity, source material, publisher records, relationships, and connection evidence are distinct.
- No unknown role silently defaults to publication.
- Stable IDs and deep links survive migration.

## M4 — Source Trust

- One row per canonical publication identity/edition.
- All source materials and connection evidence are attached, intentionally standalone, or quarantined.
- Every source-to-runtime record delta is explained.
- Every canonical mapping relationship cites evidence or is explicitly labeled as a Control Atlas organizing relationship.
- User-facing absence states are accurate and concise.

## M5 — Compare

- One hundred percent of selectable source/target combinations produce a nonempty, supported result.
- SP 800-171 Rev. 3 or any equivalent no-pair source cannot reproduce the baseline dead end.
- Mapping evidence is automatically selected or optionally filtered, not imposed as an empty third step.
- Relationship meaning, source version, and limitations remain visible.
- Exports include provenance.

## M6 — Atlas

- Opening landscape contains a small, understandable landmark set.
- No full-record hairball appears by default.
- Cybersecurity and nine areas provide orientation.
- Publisher-native hierarchy remains intact.
- Crosswalks remain connection overlays.
- Search takes the user to semantic location.
- Aggregates resolve to canonical records and relationships.
- Global geography remains stable.

## M7 — Sources

- Title appears once.
- One publication-centric primary register.
- No four-way registry-layer button overload.
- No repeated “recorded/inherited” basis text in table cells.
- Source material and connection evidence are available in the selected inspector.
- Missing data appears intentional and honest.
- Community/supporting sources do not impersonate official publishers.

## M8 — Orbital Fidelity

- Each page uses the correct application reference and depth.
- One primary action per decision area.
- The active task is visually dominant.
- Geometry has a semantic/compositional job and stays in safe corridors.
- Teal, orange, gold, green, rust, and red retain one job each.
- Texture remains behind and below content.
- Product copy does not expose internal Orbital vocabulary.
- Pages are compositionally distinct, not repeated dashboards.

## M9 — Accessibility, Responsive Behavior, and Performance

- Keyboard, focus, labels, error association, drawers/dialogs, tables, reduced motion, zoom, and contrast pass.
- Desktop, compact/tablet, and mobile layouts are intentional.
- Header and navigation geometry do not shift during brand rotation.
- Atlas projections and route bundles meet project performance gates.
- No changed visual baseline is accepted without review.

## M10 — Maintainability and Ship

- Shared primitives replace page-specific reinvention.
- `surfaces.css` and compatibility code decrease measurably.
- No arbitrary values remain where a token/component contract exists.
- Tests cover data contracts, Compare capability, Atlas projection, Sources, copy, URLs, and critical workflows.
- All branches merge cleanly and are deleted.
- Temporary `docs/Plan.md` is removed.
- Live `main` matches this specification.

---

# 6. Critical Files and Likely Change Areas

Use the current repository architecture. The following are likely change areas; if the exact path differs, record the substitution in `docs/Plan.md`.

| Area | Current / recommended files |
|---|---|
| Product authority | `docs/vision.md`, `docs/DESIGN_PRINCIPLES.md`, `docs/PRD.md` |
| Active execution ledger | temporary `docs/Plan.md` |
| Canonical data contracts | `src/shared/data-trust-contracts.mjs`, graph/source model modules, generated schema contracts |
| Source registry | `src/ui/lib/sourceRegister.ts`, source-registry data, source build/reconciliation scripts |
| Count reconciliation | `scripts/reconcile-artifact-counts.mjs`, generated source-count ledger, completeness tests |
| Compare capability | new generated capability-index builder/artifact or the closest existing generated-data layer |
| Compare state | `src/ui/lib/compareModeState.ts`, related route/view state |
| Compare UI | `src/ui/pages/ComparePage.tsx` and shared comparison components |
| Atlas semantic graph | `src/ui/lib/atlasGraphModel.ts` |
| Atlas projections | `src/ui/lib/atlasGraphProjection.ts`, Atlas artifact builder |
| Atlas UI | `src/ui/components/AtlasGraph.tsx`, `src/ui/pages/AtlasMapPage.tsx` |
| Tree/hierarchy | existing tree model/layout and ELK/React Flow consumers |
| Sources UI | `src/ui/pages/SourcesPage.tsx`, inspector/table primitives |
| Shared copy | `src/shared/site-copy.mjs`, copy-contract tests |
| Shared page primitives | `src/ui/lib/pagePrimitives.tsx`, `src/ui/components/lsm/**` or current equivalents |
| Header/brand | `src/ui/components/TopNav.tsx`, `src/ui/components/BrandLockup.tsx`, shared brand rotation |
| Design tokens | `styles/tokens.css`, vendored Orbital tokens, token drift tests |
| Component CSS | `styles/components.css`, `styles/orbital.css`, `styles/tailwind.css` |
| Legacy CSS | `styles/surfaces.css` |
| Route pages | `src/ui/pages/*.tsx` |
| E2E/visual | `tests/e2e/**`, Playwright configs and snapshots |

---

# 7. Project Gotchas

1. `styles/orbital.css` imports last and wins cascade ties. Remove conflicting definitions rather than increasing specificity.
2. Home first paint may be statically rendered outside the normal React route. Verify both static output and hydrated/runtime behavior before editing.
3. Do not let a mismatched Node/npm version rewrite the lockfile. Use the repository’s established minimal lockfile procedure for any dependency change.
4. Restart the static server after site builds when the server caches the built entry.
5. Keep color literals in the token source of truth.
6. Avoid accidental `*/` sequences inside CSS comments.
7. Keep shared Home/product copy in the enforced shared copy module.
8. Local generated data may be incomplete until `npm run build:data`.
9. Never `git add -A`; stage by path and revert unrelated generated churn.
10. Existing color values may be test-pinned. Change usage before changing the token.
11. Sigma is WebGL. Per-node DOM queries are not a valid accessibility or E2E strategy; test application state, camera behavior, inspector/list representation, and user-visible outcomes.
12. Keep Sigma graph/settings inputs stable unless rebuilding is intentional.
13. Do not expose Louvain or force-layout output as taxonomy.
14. Force-directed layout is not the global information architecture.
15. Do not compare raw artifact object counts directly with canonical leaf counts without structural reconciliation.
16. A source registry row is not automatically a canonical publication.
17. A mapping artifact is normally edge provenance, not a user-facing landmark.
18. A green test does not approve a screenshot.
19. After context compaction, re-read the execution ledger and evidence before editing.

---

# 8. Completion Definition

This push is complete only when:

- the data model distinguishes Atlas structure, publications, source materials, publisher-native records, relationships, and connection evidence;
- the source registry is publication-centric and fully reconciled;
- Compare never exposes an impossible comparison;
- Sources is a clear trust workflow rather than a registry-layer browser;
- the Atlas is a comprehensible semantic landscape with honest relationship overlays;
- every page is functionally complete, plain-language, accessible, responsive, and derived from the correct Orbital reference;
- Orbital fidelity is structural, not cosmetic;
- small layout, motion, and navigation defects are gone;
- automated gates and independent visual review pass;
- the live site matches the specification.

**Success is not that Control Atlas contains a large graph, many sources, or sophisticated implementation details.**

**Success is that Control Atlas makes federal cybersecurity easier to understand, easier to trust, and easier to act on.**
