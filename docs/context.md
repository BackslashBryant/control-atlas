# Control Atlas Context Handoff

## Product Identity

- Public product name: **Control Atlas**
- Protected brand flourish: **Ctrl+Alt+** followed by a rotating, real product
  action such as **Trace**, **Search**, **Explore**, **Compare**, or **Build**.
- Product definition: A federal cybersecurity reference and practitioner
  workbench that brings requirements, frameworks, controls, mappings, official
  guidance, tools, and practitioner resources together so people can understand
  where things come from, how they connect, and what to do next.
- Boundary: Control Atlas organizes public material. The people responsible
  for the work decide applicability, baseline selection, compliance and
  inheritance claims, and authorization or ATO outcomes.
- Design principle: **Build for translation, not complexity.** See [`docs/DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md).

## Current Objective

**v1 closeout complete.** The correction program, maintenance pass, dependency
review, source-provenance review, deployment verification, and release
publication are complete. `v1.0.2` is the final v1 patch and points to
`e46a122`; it supersedes `v1.0.1` without rewriting that published tag. The
pre-hash query-state adapter remains because it preserves application state,
not a retired route.

**Active sprint:** None. Epic 13 shipped the product-first homepage,
first-class Resources navigation, isolated runtime recovery, and aggregated
Atlas workbench. Human NVDA/VoiceOver/TalkBack and physical iOS/Android checks
remain external evidence.

## Shipped on `main` (do not re-plan)

- Epics 0-10 baseline through Map Foundation v4.0 (see Plan.md epic table)
- **SPR-20260708 remediation:** deferred graph on Explore, sharded `library-search-manifest` + per-catalog shards, `bootstrap-payload` / `load-resilience` E2E, home About/Sources trust row, header search draft clear, Compare coverage chips, mobile overflow fixes, live Pages smoke workflow (`.github/workflows/pages-live-smoke.yml`), federated search shard refresh on lazy load, connections-only filter triggers on-demand graph
- **Newbie-Reframe Phase 7:** 40 official artifacts, 11 supporting tools, 12 companions, FedRAMP rules `2026.07.14.01`, 27 indexed legacy downloads, ten explicit legacy-to-current transitions, and official-workbook FedRAMP baseline ingestion

## Implementation foundation

- React shell in `src/ui/App.tsx` is the active UI; legacy `src/app/app.mjs` is not mounted
- Build-time importers and `data/generated/*` bundles are the runtime contract
- Library search loads one complete compact `library-search.json` artifact.
  Full published text stays on record payloads; the search bootstrap carries
  only identity, source, facets, text-availability disclosure, and its
  build-time MiniSearch index.
- Atlas record views load a compact node index and one deterministic incident-edge shard; they do not load the monolithic graph artifacts
- Atlas defaults to a semantic DOM Path, offers a bounded real-edge Map, and keeps List as an equal accessible view; desktop progression is horizontal and mobile progression is vertical
- React Flow and ELK remain lazy for other legacy bounded relationship diagrams, not the primary Atlas route
- Control Atlas is the active repo and deployment identity

## Product Boundary

Control Atlas is public-data-only and has no backend. It may normalize public sources at build time, serve static bundles from GitHub Pages, and generate blank/public-reference exports locally in the browser.

It must not ingest evidence, accept uploads, connect to operational systems, store user, organization, or system data, score compliance, track real assets or packages, or require login.

## Next

1. Preserve the Epic 13 product definition, canonical Resources routes,
   failure-isolation contracts, and inspector-led Atlas behavior.
2. Preserve the v1.0.2 release evidence and the explicit human
   NVDA/VoiceOver/TalkBack/physical-device residual.
3. Revisit sparse-catalog crosswalks only when an official upstream source
   publishes direct, reproducible mappings.
4. Reopen staged ingestion/search tools only against the checked-in benchmark
   and a concrete product failure; the July 17 experiments and strengthening
   sequence are complete.

## Status Docs

Canonical delivery state lives in [`docs/Plan.md`](Plan.md). Open PRD gaps only in [`docs/plans/prd-v3-alignment-backlog.md`](plans/prd-v3-alignment-backlog.md).
