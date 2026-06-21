# Epic 10: Atlas Map-First UX

**Status:** Shipped (June 21, 2026)

**Goal:** Reposition Control Atlas from library-first to map-first with a dedicated homepage, standalone Atlas Map route, navigation/copy rename, and extended relationship graph experience.

**User confusion reduced:** “Where do I start?” and “How do things connect?” — map and connections are primary, not buried in library detail.

**Branch:** `agent/forge/epic-10-atlas-map-ux` (residual closeout: `agent/forge/epic-10-residual-closeout`)

**Dependencies:** Epic 9 relationship graph stack (`RelationshipExplorer`, `buildNeighborhood`, provenance filters).

**Lead personas:** Forge (implementation), Muse (copy/UX), Pixel (E2E/a11y), Vector (doc closeout).

---

## Shipped scope

### Phase 1 — Navigation and branding
- Default `/` → `view=home` map-first homepage
- Nav: Start, Atlas Map, Explore, Compare, Playbooks, Templates, Sources
- URL aliases: `explore`↔`search`, `playbooks`↔`patterns`, `list`↔`table`
- Global copy pass: Library→Explore, Patterns→Playbooks, Connections, Open record, provenance labels
- **Open in Atlas Map** entry points on homepage, explore results, record header, sticky bar

### Phase 2 — Standalone Atlas Map
- `AtlasMapPage` three-zone layout (filters | canvas | selected panel)
- Default starter map via `runtime.buildStarterMap()`
- Focused node state (`?view=atlas-map&node=…`)
- Map/list toggle; URL persistence for node and filters

### Phase 3 — Map readability
- `graphClustering.ts` group collapse thresholds
- Zoom-aware labels; fit/reset/zoom controls
- Item-type legend shapes + provenance color legend

### Phase 4 — Record detail flow
- Connections section rework; Copy ID demoted
- `StickyDetailBar`: Back, Open in Atlas Map, Compare

### Phase 5 — Integrations (complete)
- Compare map/list toggle on all workbenches (relationships, baseline, STIG chain, threat chain)
- Shared/unique/provenance compare summary + `buildCompareGraph.ts`
- `ComparePage.tsx` and `ExplorePage.tsx` extracted from `App.tsx`
- `ProvenanceTerm` tooltips on badges, legends, explore, detail, sources, and compare surfaces

---

## Verification

- `npm run precommit` — pass (E2E includes `compare-map.spec.mjs`)
- Updated specs: `control-atlas-shell`, `relationship-graph`, `compare-map`, `landing-performance`, `critical-path-matrix`, `accessibility`, `load-resilience`, `start-here`, `a11y-contract`, `browser-contract`

---

## Key files

| Area | Path |
|------|------|
| Routing | `src/ui/lib/viewState.ts`, `src/ui/lib/navigation.ts` |
| Pages | `src/ui/pages/HomePage.tsx`, `AtlasMapPage.tsx`, `ExplorePage.tsx`, `ComparePage.tsx` |
| Compare map | `src/ui/lib/buildCompareGraph.ts`, `src/ui/components/CompareResultsPanel.tsx` |
| Provenance UX | `src/ui/components/ProvenanceTerm.tsx`, `src/content/copy.mjs` |
| Graph | `src/ui/components/RelationshipExplorer.tsx`, `src/ui/lib/graphClustering.ts` |
| Runtime | `src/app/runtime.mjs` (`buildStarterMap`) |
