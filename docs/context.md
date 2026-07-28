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

**Active sprint:** v1.0.1 final closeout on
`agent/nexus/v1-0-1-final-closeout`. The local candidate includes Epic 7
semantic/compatibility contracts, retired aliases, graph-health provenance,
Node 22 and strict-install workflow verification, a comparative mobile
Lighthouse gate, and the remaining Compare navigation-state cleanup. Pages
route groups, the comparative workflow result, exact deployed commit/cache,
canonical routes, static-404 evidence, and release publication require fresh
remote execution. The pre-hash query-state adapter remains because it preserves
persisted state rather than a retired route.

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

1. Run final local gates, integrate reviewed dependency updates, and push the
   v1.0.1 candidate.
2. Run the bounded Pages route groups, same-runner v1.0.0 comparison, exact
   cache/commit check, and representative canonical/deep-link/static-404 smoke.
   Do not treat local automation as deployed, real-device, or human
   screen-reader proof.
3. Preserve the explicit human NVDA/VoiceOver/TalkBack residual after release.

## Status Docs

Canonical delivery state lives in [`docs/Plan.md`](Plan.md). Open PRD gaps only in [`docs/plans/prd-v3-alignment-backlog.md`](plans/prd-v3-alignment-backlog.md).
