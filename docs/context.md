# Control Atlas Context Handoff

## Product Identity

- Public product name: **Control Atlas**
- Campaign line: **Ctrl+Alt+Comply**
- Tagline: **The public map for federal cyber compliance.**
- Supporting line: Open-source reference workbench for mapping controls, tracing frameworks, and generating starter RMF/ATO templates - no login, no evidence upload, no organizational data required.
- Design principle: **Build for translation, not complexity.** See [`docs/DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md).

## Current Objective

**2026 correction program** - Epic 3, Resources directory, is complete locally
on `agent/forge/epic-3-resources-directory`. Features 3.1-3.5 and M3 are
verified. The six source-derived primary browse categories reconcile all 96
resources; search filters eligibility before editorial order; category/facet
state is URL-backed and invalid state visibly recovers; contextual suggestions
are derived and traceable without graph parentage. No push, merge, deploy, tag,
or release is authorized by this work. The shared header now has one primary
navigation path, and Build treats related resources as supporting context in a
responsive side rail rather than a competing page-level destination.

**Active sprint:** none. The next recommended milestone is Epic 4 - Record and
Build progressive disclosure - from the
[`2026-07-27 correction backlog`](planning/control-atlas-correction-backlog-2026-07-27.md).

## Shipped on `main` (do not re-plan)

- Epics 0-10 baseline through Map Foundation v4.0 (see Plan.md epic table)
- **SPR-20260708 remediation:** deferred graph on Explore, sharded `library-search-manifest` + per-catalog shards, `bootstrap-payload` / `load-resilience` E2E, home About/Sources trust row, header search draft clear, Compare coverage chips, mobile overflow fixes, live Pages smoke workflow (`.github/workflows/pages-live-smoke.yml`), federated search shard refresh on lazy load, connections-only filter triggers on-demand graph
- **Newbie-Reframe Phase 7:** 40 official artifacts, 11 supporting tools, 12 companions, FedRAMP rules `2026.07.14.01`, 27 indexed legacy downloads, ten explicit legacy-to-current transitions, and official-workbook FedRAMP baseline ingestion

## Adopted Baseline

- React shell in `src/ui/App.tsx` is the active UI; legacy `src/app/app.mjs` is not mounted
- Build-time importers and `data/generated/*` bundles are the runtime contract
- Library search loads `library-search-manifest.json` + eager shards first; remaining catalog shards lazy-load with UI refresh via `librarySearchRevision`
- Atlas record views load a compact node index and one deterministic incident-edge shard; they do not load the monolithic graph artifacts
- Atlas defaults to a semantic DOM Path, offers a bounded real-edge Map, and keeps List as an equal accessible view; desktop progression is horizontal and mobile progression is vertical
- React Flow and ELK remain lazy for other legacy bounded relationship diagrams, not the primary Atlas route
- Control Atlas is the active repo and deployment identity

## Product Boundary

Control Atlas is public-data-only and has no backend. It may normalize public sources at build time, serve static bundles from GitHub Pages, and generate blank/public-reference exports locally in the browser.

It must not ingest evidence, accept uploads, connect to operational systems, store user, organization, or system data, score compliance, track real assets or packages, or require login.

## Next

1. Begin Epic 4 on a new task branch only after explicit authorization.
2. Preserve Epic 1's structural/applicability/correlation contract and Epics 2
   and 3's canonical route, Resources state, and traceability boundary, plus the
   local-only proof boundary.
3. Keep push, merge, deploy, tag, and release actions separately authorized.

## Status Docs

Canonical delivery state lives in [`docs/Plan.md`](Plan.md). Open PRD gaps only in [`docs/plans/prd-v3-alignment-backlog.md`](plans/prd-v3-alignment-backlog.md).
