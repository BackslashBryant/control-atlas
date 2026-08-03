# ADR 0014: Build-once verification and bounded browser evidence

Status: Accepted (2026-08-03)

## Context

Control Atlas is one static Vite application, but its release path behaved like
several unrelated systems. A normal UI change could rebuild the 161 MB staged
site locally, on the branch, in a non-blocking visual job, again on `main`, and
again for Pages. The production "smoke" then replayed 54 browser cases. The
full functional suite ran 161 cases serially, while the Guardian and approved
layout suites captured overlapping rendered states.

The required outcome is shorter feedback without weakening exact-commit
provenance, public-source integrity, accessibility, or rendered review.

## Open-source platform gate

| Candidate | License | Fit | Decision |
|---|---|---|---|
| Playwright sharding, blob reports, and official container | Apache-2.0 | Already owns browser verification and supports multi-machine shards plus merged reports. | Adopt its built-in primitives; add no browser framework. |
| GitHub Actions matrix, npm cache, and workflow artifacts | Repository platform | Already runs and deploys the project. Artifacts are the native mechanism for passing one immutable build between jobs and workflows. | Reuse for build-once delivery and exact-SHA evidence. |
| Nx affected/task cache | MIT | Mature affected-task engine, but this is one package with one deployable; adopting a workspace task graph and cache protocol would exceed the problem. | Reject. Keep the small fail-closed path classifier. |
| Turborepo task and remote cache | MIT | Maintained and capable, but optimized for multi-package task graphs. It adds a cache model without removing the 161 MB static artifact transfer. | Reject. |
| Supabase | Apache-2.0 components | A Postgres-centered runtime platform. It does not reduce deterministic static builds or Playwright execution and would add a production data service. | Reject. Keep publisher snapshots and generated graph artifacts static. |

Authoritative references:

- Playwright sharding and report merging: <https://playwright.dev/docs/test-sharding>
- Playwright parallelism: <https://playwright.dev/docs/test-parallel>
- Playwright license: <https://github.com/microsoft/playwright/blob/main/LICENSE>
- GitHub workflow artifacts and cache distinction: <https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts>
- Nx affected commands and license: <https://nx.dev/docs/reference/nx-commands>, <https://github.com/nrwl/nx/blob/master/LICENSE>
- Turborepo caching and license: <https://turborepo.dev/docs/crafting-your-repository/caching>, <https://github.com/vercel/turborepo/blob/main/LICENSE>
- Supabase architecture: <https://supabase.com/docs/guides/getting-started/architecture>

## Decision

1. The branch CI gate produces one `site-build` artifact with a
   `release.json` containing the full commit SHA.
2. `main` reuses both successful checks and that exact artifact. Pages verifies
   the embedded SHA and deploys it without installing dependencies or rebuilding.
3. Manual Pages dispatch remains a clearly isolated recovery path that may build
   once when no triggering CI artifact exists.
4. The change classifier stays fail-closed and adds a generated-data build mode.
   UI, documentation, test, and workflow changes reuse reviewed committed graph
   artifacts; source, map, generator, shared-graph, or dependency changes rebuild
   them. Reuse is allowed only after restoring a complete generated-data cache
   keyed from tracked source data, maps, the generator dependency closure, and
   the lockfile. A miss or incomplete cache rebuilds deterministically.
5. Pull requests and branch pushes run deterministic gates plus small browser and
   accessibility smoke sets. Approved-layout and full rendered review no longer
   run redundantly on every push.
6. The live gate runs four bounded cases: Home/record, Compare, runtime cache
   version, and exact deployed commit SHA.
7. A nightly workflow builds once, runs four Playwright functional shards,
   complete accessibility, approved-layout comparison, and Guardian rendered
   review in parallel, then merges the functional and accessibility blob reports.
8. Weekly source refresh keeps human-reviewed draft PRs. Because `refresh:data`
   already rebuilt the graph, its repository gate uses `precommit:incremental`
   instead of generating the same graph twice.

## Invariants and failure behavior

- Unknown file operations, missing bases, missing artifacts, unrecognized scope,
  and SHA mismatches fail closed to a full build or a failed deployment.
- Generated-data cache keys never include their own output. Missing catalog or
  neighborhood shards are rejected before Vite runs.
- A suggestion, source relationship, or publisher record is never fetched from a
  runtime database; this ADR does not change the product data model.
- Caches may accelerate dependency downloads, but deployment consumes an
  artifact, not a mutable cache.
- Full rendered evidence remains automatic and reviewable; moving it to nightly
  changes cadence, not coverage.

## Consequences

- Routine releases perform one authoritative site build instead of rebuilding
  during branch, `main`, visual capture, and deployment stages.
- Production smoke becomes a genuine release check rather than a second E2E suite.
- Full browser coverage has lower wall-clock time through four single-worker
  shards, avoiding the memory pressure that led to a single local worker.
- Artifact transfer and multiple container starts remain in the nightly path;
  those costs are explicit and bounded, and the merged report is the single
  review surface.
