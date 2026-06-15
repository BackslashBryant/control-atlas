# Epic 3 Library Browser Design

**Date:** 2026-06-15
**Lead persona:** Vector
**Status:** Approved for spec drafting, pending user review of written spec
**Epic:** Epic 3 - Library Browser

## Goal

Deliver the full Epic 3 Library Browser for Control Atlas so users can search public reference objects, open stable deep-linked detail views, and filter library results without a page reload.

## Scope

Epic 3 includes Story 3.1 through Story 3.3 from the active PRD and roadmap:

- Story 3.1 - Search Index (MiniSearch)
- Story 3.2 - Object Detail Pages
- Story 3.3 - Library Filters

Adjacent work is in scope only when it is required to make those stories ship cleanly on the current static runtime.

## Existing Baseline

The current shell already contains partial Library Browser behavior:

- `src/app/app.mjs` renders search, browse, and object detail surfaces.
- `src/app/runtime.mjs` provides in-memory search, URL state helpers, and object lookup helpers.
- The static runtime contract remains the five generated public artifacts:
  - `sources.json`
  - `nodes.json`
  - `edges.json`
  - `evidence.json`
  - `graph-health.json`

The current implementation does not yet satisfy Epic 3 because:

- search is still a linear in-memory scan rather than a generated MiniSearch index,
- detail pages are opened imperatively instead of from a stable routeable object state,
- filters do not yet cover object type, source class, and family or severity.

## Requirements

### Story 3.1 - Search Index

The Library Browser must:

- generate a static MiniSearch index at build time,
- support exact identifier matches and keyword matches,
- use field weighting so identifier, title, and description do not rank equally,
- return enough metadata to render object type and defining source in result cards,
- remain fully static with no backend and no runtime ingestion.

### Story 3.2 - Object Detail Pages

Each object page must:

- have a stable deep-linkable URL state,
- render title, stable object ID, source, version, description, related objects, and source links,
- support direct entry from a copied URL without requiring a prior search,
- preserve current public-source and provenance behavior,
- make control pages show related baselines, STIGs, and CCIs where present,
- make STIG or SRG pages show related CCIs and controls where present.

### Story 3.3 - Library Filters

Library filtering must:

- update results without a page reload,
- support object type filtering,
- support source class filtering,
- support family filtering for controls,
- support severity filtering for STIG or SRG rules,
- compose cleanly with keyword search and browse state.

## Recommended Approach

Use the existing static shell and URL-state model, then extend it rather than replacing it.

This keeps Epic 3 aligned with the current repository structure, limits regression risk, and avoids turning Library Browser delivery into a broader routing or framework rewrite.

## Architecture

### 1. Build-Time Search Artifact

Add a generated library search artifact derived from the existing normalized node and source data.

The artifact should include:

- the MiniSearch serialized index,
- a compact document map for result rendering,
- fields needed for filtering:
  - object type,
  - catalog,
  - source class,
  - control family where available,
  - STIG or SRG severity where available.

This artifact is additive. It does not replace the five runtime graph artifacts that already power graph context, evidence, and relationship views.

### 2. Routeable Library State

Extend view state so Library detail pages are first-class URL states instead of an imperative follow-up after search.

The URL contract should support:

- Library search state,
- Library browse state,
- direct object detail state by object ID,
- filter persistence in Library views where useful,
- backward compatibility for the current shell views that are outside Epic 3.

Direct object links must load the required graph data and detail content without requiring the current "search then exact-match auto-open" fallback.

### 3. Unified Library Surface

Treat search and browse as two entry points into one Library Browser result model.

That model should power:

- keyword search,
- catalog or browse discovery,
- result filtering,
- detail navigation,
- copyable deep links.

The library surface should stop behaving like separate partial features.

### 4. Detail Page Hierarchy

Object detail pages should prioritize Epic 3 contract data first:

1. title and stable object ID,
2. source and version,
3. description,
4. related objects and source links,
5. specialized context for controls, STIGs, SRGs, CCIs, baselines, and related federal-context panels.

Existing provenance, evidence, and federal context remain valuable, but they should support the Library Browser contract instead of acting as the only meaningful detail structure.

## Data and Filter Model

The filter model should be derived from already normalized public data.

### Required facets

- `node_type`
- `source_class`
- `catalog_id`
- `control_family`
- `severity`

### Filter behavior

- Empty filters mean "all".
- Filters compose with search terms.
- Filters apply client-side without reload.
- Unsupported facets for a result type should not break the experience.
- Browse should pre-seed filters or catalog context rather than creating a separate filtering system.

## Non-Goals

Epic 3 does not include:

- Crosswalk export expansion beyond the existing Epic 4 surfaces,
- template generation changes,
- pattern-library delivery,
- Start Here flow delivery,
- framework migration,
- backend services,
- user data or saved workspaces,
- broad shell redesign unrelated to Library Browser requirements.

## Files Expected To Change

- `src/app/app.mjs`
- `src/app/runtime.mjs`
- static build pipeline files that publish browser artifacts
- data-build pipeline files that generate the library search artifact
- browser, runtime, build-contract, and end-to-end tests tied to Library behavior

## Verification Strategy

Epic 3 is not complete until the following are true:

- build-time generation of the library search artifact is covered by tests,
- runtime and URL-state tests prove deep-link detail behavior,
- browser-contract tests prove Library result metadata and filter controls exist,
- end-to-end coverage proves a direct object link opens the right detail page,
- `npm run precommit` passes.

## Risks and Controls

### Risk: search artifact drift from runtime node data

Control:
Generate the search artifact from the same normalized sources used by the runtime graph outputs, and add contract tests that fail on missing detail fields.

### Risk: route-state churn breaks existing shell navigation

Control:
Extend the current state helpers instead of replacing them, and keep explicit tests for legacy non-Library views.

### Risk: filter fields are inconsistent across object types

Control:
Normalize optional facet values in the generated artifact and treat absent facets as empty rather than exceptional.

### Risk: scope creep into Epic 4 routing or export work

Control:
Keep Epic 3 focused on search, detail, and filtering contracts only.

## Acceptance Mapping

### Story 3.1

- MiniSearch index exists as a generated static artifact.
- Search supports identifiers and keywords.
- Results show object type and source.
- Library search is reachable from the shell.

### Story 3.2

- Every object has a stable deep-link state.
- Detail pages render required source-backed fields.
- Control detail pages show related baselines, STIGs, and CCIs when present.
- STIG or SRG detail pages show related CCIs and controls when present.

### Story 3.3

- Filters cover object type, source class, and family or severity.
- Results update without page reload.

## Implementation Handoff

The next step after user review of this spec is to write a detailed implementation plan for Epic 3, then execute on an Epic 3 implementation branch with full verification gates.
