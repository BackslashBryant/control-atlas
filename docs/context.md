# Control Atlas Context Handoff

## Product Identity

- Public product name: **Control Atlas**
- Campaign line: **Ctrl+Alt+Comply**
- Tagline: **The public map for federal cyber compliance.**
- Supporting line: Open-source reference workbench for mapping controls, tracing frameworks, and generating starter RMF/ATO templates - no login, no evidence upload, no organizational data required.
- Design principle: **Build for translation, not complexity.** See [`docs/DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md).

## Current Objective

**2026 correction program** - Epics 4 and 5 are complete locally on
`agent/forge/epic-5-source-first-record-integrity`; Epic 6 responsive and
accessibility implementation is complete locally on
`agent/pixel/epic-6-responsive-accessibility`. Record detail
now leads with official source content, an honest absence state where no
narrative was published, reachable source links, and provenance-labelled
relationships. Synthetic record translation, recommendation defaults, unsourced
public playbooks, and the unmounted legacy renderer are retired.
Build now uses subordinate Tasks/Starter documents/Resources navigation with
canonical task and document paths, validated configuration, and visible
recovery that preserves valid state. Resources retains Epic 3's canonical
URL-backed browse contract. No push, merge, deploy, tag, or release is
authorized by this work.

**Active sprint:** none. Epic 7 local regression and compatibility preparation
is complete on `agent/pixel/epic-7-regression-deployment-compatibility`.
Critical/High contracts, source-first records, durable route/resource state,
and Compare/Resources responsive behavior are grouped in a local gate. Pages
route-group, exact deployed commit/cache, and compatibility-window evidence
remain separately owner-gated; no alias retirement is authorized.

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

1. With explicit shipping authorization, deploy the reviewed commit and run the
   bounded live route groups, exact cache/commit check, and representative deep
   link smoke. Preserve source-first record presentation and the responsive
   375px/1440px contracts; do not treat local automation as deployed,
   real-device, or human screen-reader proof.
2. Preserve Epic 1's structural/applicability/correlation contract and Epics 2
   and 3's canonical route, Resources state, and traceability boundary, plus the
   local-only proof boundary.
3. Keep push, merge, deploy, tag, and release actions separately authorized.

## Status Docs

Canonical delivery state lives in [`docs/Plan.md`](Plan.md). Open PRD gaps only in [`docs/plans/prd-v3-alignment-backlog.md`](plans/prd-v3-alignment-backlog.md).
