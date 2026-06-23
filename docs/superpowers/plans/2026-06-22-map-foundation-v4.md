# Map Foundation v4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Atlas Map's raw-record starter view with an authoritative nine-tier source hierarchy, a controlled AC-2 focus model, centralized canonical links, optional source filters, and the exact free Cytoscape stack.

**Architecture:** `src/ui/graph/` owns source truth, hierarchy, visibility, graph roles, and visible graph construction. `AtlasMapPage` consumes that model and passes normalized nodes and edges to the existing Cytoscape renderer. The runtime graph remains the evidence source for record drill-down, while the initial hierarchy and focused-control presentation are deterministic product models.

**Tech Stack:** React 19, TypeScript, Cytoscape.js, cytoscape-dagre, cytoscape-fcose, cytoscape-popper, Popper, Tippy.js, Node test runner, Playwright.

---

### Task 1: Lock source foundation contracts

**Files:**
- Create: `tests/graph/sourceManifest.test.ts`
- Create: `tests/graph/sourceLinks.test.ts`
- Create: `tests/graph/defaultMapFilter.test.ts`
- Create: `tests/graph/sourceToGraphRole.test.ts`
- Create: `tests/graph/sourceHierarchyEdges.test.ts`
- Create: `tests/fixtures/source-manifest.fixture.json`

- [ ] Write tests that import the requested source modules and assert stable IDs, canonical URLs, one tier, one disposition, filter behavior, role mapping, and hierarchy order.
- [ ] Run `node --test tests/graph/sourceManifest.test.ts tests/graph/sourceLinks.test.ts tests/graph/defaultMapFilter.test.ts tests/graph/sourceToGraphRole.test.ts tests/graph/sourceHierarchyEdges.test.ts`; expect module-not-found failures.
- [ ] Implement focused modules under `src/ui/graph/`: registry types, hierarchy constants, dispositions and warnings, centralized links, seed manifest, classification, default filters, graph roles, and hierarchy edges.
- [ ] Re-run the focused test command; expect all source foundation tests to pass.

### Task 2: Build the visible relationship model

**Files:**
- Create: `tests/graph/buildFocusedControlRings.test.ts`
- Create: `tests/fixtures/atlas-map-ac2.fixture.json`
- Create: `src/ui/graph/buildFocusedControlRings.ts`
- Create: `src/ui/graph/buildVisibleRelationshipModel.ts`

- [ ] Write tests asserting the initial model has exactly nine category nodes and eight ordered edges, and the AC-2 model has no more than twelve visible nodes with clustered CCIs, STIG/SRG, templates, playbooks, and sources.
- [ ] Run the focused test and confirm it fails because the builders do not exist.
- [ ] Implement deterministic hierarchy and AC-2 visible models with Cytoscape-compatible node and edge records.
- [ ] Re-run the focused test and confirm it passes.

### Task 3: Render hierarchy and focused control views

**Files:**
- Modify: `src/ui/pages/AtlasMapPage.tsx`
- Modify: `src/ui/components/RelationshipGraph.tsx`
- Modify: `src/ui/lib/graphLayout.ts`
- Modify: `src/ui/lib/graphTheme.ts`
- Modify: `src/ui/lib/viewState.ts`
- Modify: `styles/surfaces.css`

- [ ] Add contract tests/E2E specs for nine initial nodes, left-to-right ordering, de-emphasized supporting reference, AC-2 focus, cluster presence, and the twelve-node cap.
- [ ] Run the new tests and confirm the existing starter map fails the assertions.
- [ ] Route an empty map query to the hierarchy model with dagre LR and route `AC-2`/`nist-800-53:AC-2` to the focused concentric model.
- [ ] Extend the renderer with `concentric`, role-driven styling, testable node position attributes, and dominant NIST control styling.
- [ ] Re-run targeted tests and E2E specs.

### Task 4: Add source visibility filters and canonical source links

**Files:**
- Create: `tests/e2e/atlas-map-source-filters.spec.mjs`
- Create: `tests/e2e/atlas-map-links.spec.mjs`
- Modify: `src/ui/pages/AtlasMapPage.tsx`
- Modify: `src/ui/pages/SourcesPage.tsx`
- Modify: `src/ui/lib/viewState.ts`

- [ ] Write E2E tests for supporting, draft/legacy, and registry-only controls and warning copy.
- [ ] Write E2E tests for FISMA, SP 800-53, ATT&CK, and D3FEND canonical links.
- [ ] Confirm the tests fail against the current UI.
- [ ] Add URL-backed optional source filters and warning text; add a manifest-backed source link section to Sources.
- [ ] Re-run the E2E specs.

### Task 5: Install and document the exact graph stack

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/ui/graph/GRAPH_REFERENCES.md`
- Modify: `tests/browser-contract.test.mjs`
- Modify: `tests/package-scripts.test.mjs`

- [ ] Add failing contract assertions for `cytoscape-popper`, `@popperjs/core`, `tippy.js`, required references, and prohibited package absence.
- [ ] Run the contract tests and confirm the missing dependencies/references fail.
- [ ] Run the exact requested install command.
- [ ] Add graph reference documentation and graph unit/E2E test scripts to repository gates.
- [ ] Re-run package and browser contracts.

### Task 6: Verify and ship

**Files:**
- Modify only status/backlog/context docs if this work changes sprint status.

- [ ] Run all targeted graph unit tests.
- [ ] Run the four new Atlas Map E2E specs.
- [ ] Show `git status --short` and `git diff --stat`.
- [ ] Run `npm run precommit`; stop on failure and fix only failures caused by this change.
- [ ] Commit the completed slice, push the feature branch, merge to `main`, rerun `npm run precommit` on `main`, push `main`, and wait for remote checks.
