# Post-v1 platform-strengthening implementation audit

**Date:** July 17, 2026

**Implementation branch:** `agent/pixel/post-v1-platform-strengthening`

**Base:** `5f7a76b`
**Decision:** All five milestones were shipped to `main` at `e56ffc7` and deployed to GitHub Pages after local and remote verification. The four approved-layout baselines were generated and visually reviewed inside the pinned Ubuntu Playwright image, then reproduced 4/4 without updating snapshots. Follow-up pipeline hardening retains every gate while removing duplicate build and browser execution. The final `v1.0.0` tag and release remain separately owner-gated.

## Adopted tools and measured value

| Tool | Decision and unique value | Installation / runtime / CI cost | False positives and maintenance | Rollback |
| --- | --- | --- | --- | --- |
| Playwright 1.60 visual comparisons | Adopt the four approved Atlas compositions only. Existing geometry, workflow, a11y, reflow, and reduced-motion assertions remain. A dedicated CI job pins `mcr.microsoft.com/playwright:v1.60.0-noble` (image digest `sha256:9bd26ad900bb5e0f4dee75839e957a89ae89c2b7ab1e76050e559790e946b948`). | No new dependency. Snapshot generation passed 4/4 in 29.4 seconds after the static build; the immediate no-update comparison passed 4/4 in 18.9 seconds. CI adds one build and four comparisons. | Host rendering varies, so only the reviewed Ubuntu/Chromium snapshots are authoritative. Regenerate them only in the pinned image and review every changed pixel artifact. | Remove the visual config/spec, four snapshots, package script, and CI job. |
| Lighthouse CI 0.15.1 | Adopt report-only. It exposes user-visible regressions not covered by payload and data-size contracts. Reports use filesystem output and a private CI artifact; public temporary storage is disabled. | Apache-2.0. `node_modules` grew 178,431,564 bytes. Twelve local audits reported 155,661 ms total Lighthouse runtime, excluding build/upload overhead. Its stale `tmp` ranges required a lockfile override to maintained MIT release 0.2.7; `parse-cache-control` required one path-specific BSD-3-Clause metadata exception backed by its upstream license file. | Three runs still showed material variance. No score is blocking. Reassess after repeated Ubuntu CI runs. Dependency audit and license policy must remain green. | Remove `@lhci/cli`, `.lighthouserc.json`, the summary tool, package scripts, CI job, `tmp` override, and `parse-cache-control` metadata exception; delete local artifacts. |
| Vale 3.15.1 | Adopt the project-owned terminology/repetition rules. Bad fixture: 6 targeted errors. Approved fixture plus selected public docs and mounted copy from 36 TSX files: 0 findings. Human review remains authoritative. | MIT. Verified official release checksum. Local cache: 52,351,985 bytes. Fixture + project checks complete in seconds; one extra CI step. | Initial spike found four false positives: one broad heading match and three internal JSX values. Rules/extractor were narrowed before adoption. | Remove `.vale.ini`, `vale/`, three helper tools, package scripts, CI/precommit calls, and cache. |
| Knip 6.27.0 | Do not adopt as a gate or retained dependency. One-time inventory found 50 files, 1 unused dependency, 1 unlisted dependency, 2 binaries, 33 exports, 8 exported types, and 2 duplicate exports before classification. | ISC. Ephemeral `npx` cache delta: 24,747,195 bytes. Rerun: 25.3 seconds. | High configuration noise from spawned scripts, agent tooling, test-only files, and the live Playwright config. | No package dependency to remove. Delete the `npx` cache if desired; rerun only for a separately scoped cleanup. |
| NIST OSCAL CLI 1.0.3 | Adopt as a monthly independent cross-check, additive to AJV and contract tests. It accepted valid OSCAL 1.1.2 catalog/profile fixtures and rejected missing `metadata` / `imports` that the current normalizer/classifier accepts. | NIST public domain. Official archive 26,421,611 bytes; extracted cache plus archive 55,803,676 bytes. Cached four-file cross-check: about 21 seconds. Java 17 required only in the scheduled job. | CLI 1.0.3 predates current OSCAL 1.2.2. Keep fixtures at declared 1.1.2 and reassess when NIST publishes a newer official CLI. | Remove the scheduled workflow, fixtures/helper tools, package script, and local cache. Existing validators remain unchanged. |

## Lighthouse evidence (local synthetic only)

These results are not field data, real-device evidence, live Pages evidence, or release budgets.

| Route | Performance | Accessibility | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- |
| Landing | 29–33 | 100 | 5,164–18,887 ms | 0 | 603–1,265 ms |
| Explore (`AC-2`) | 3–5 | 98 | 63,469–63,478 ms | 0.724 | 801–1,211 ms |
| Focused Atlas Map | 5–9 | 100 | 6,415–18,889 ms | 0.726 | 632–1,109 ms |
| Templates | 1–3 | 100 | 252,511–252,662 ms | 0.961–1.318 | 1,628–7,181 ms |

The results justify retaining reports, not setting thresholds. Existing focused-Atlas request exclusions, 20 MiB/file, 80 MiB data, and 3.2 MB eager-search contracts remain unchanged.

## Knip classification

Every initial finding is classified below. “Queued” means no removal is authorized by this sprint.

- **Genuinely unused — removed:** `lib/d3.min.js`; `AtlasLeverageInspector.tsx`; `AtlasMatrix.tsx`; `ConfidencePip.tsx`; `CopyButton.tsx`; `ObjectCard.tsx`; `SelectedItemPanel.tsx`; `StepIndicator.tsx`; `addLaterSources.ts`; redundant direct `axe-core`; unused `BrandEntrance` alias. The print-QA script now imports Chromium from declared `@playwright/test` instead of the transitive `playwright` package.
- **Dynamically referenced — retained:** `scripts/fetch-stig-source-observations.mjs` (spawned by refresh); `tools/agent-bootstrap.mjs` (spawned by setup); `tools/sync-public.mjs`; `graphClustering.ts` (TypeScript facade/types used by the lazy relationship surface); `ipconfig` and `lsof` platform probes.
- **Generated/test-only or reproducibility — retained:** `scripts/spikes/search-baseline.mjs`; `src/ui/components/ProvenanceBadge.tsx` (read by the a11y contract); `src/ui/lib/startHereRecommendations.d.ts`.
- **Intentionally retained agent/tooling surface:** `agent-helper`, `agent-prompts`, `brains-refresh`, `categorize-files`, `check-dependencies`, `convert-to-app`, `cursor-extensions`, `cursor-settings-gen`, `detection`, `dev-guarded`, `docs-audit`, `feature-new`, `get-project-root`, `github-init-issues`, `github-issue-complete`, `github-issue`, `github-labels`, `guard-runner`, `health-check`, `install-agent-hook`, `load-env-to-system`, `mcp-self-heal`, `mcp-suggest`, `personal-bootstrap`, `postinstall-check`, `preflight`, `preset-webapp`, `rocky-auto-setup`, `setup`, `sync-github-token`, `token-wizard`, and `verify-github-issue`. Their ownership is the repository agent template, not the public runtime.
- **Separately queued for removal:** unmounted `src/app/app.mjs` and its `src/content/pageIntros.mjs`. Tests still classify the legacy renderer; this sprint does not churn it.
- **Export findings — retained or queued, not runtime removal evidence:** `reconcileSourceFreshness`; `CONTEXT_SECTION_COPY`; `contextSectionHeading`; `OFFICE_MIME_TYPES`; `ENVIRONMENT_ARCHETYPES`; `buildSourceMetadata`; `relationshipLabelMap`; `trustLabelMap`; `evidenceLabelMap`; `productCopy`; `DEFAULT_STALE_AFTER_DAYS`; `formatConnectionRollup`; `buildSourceHierarchyModel`; `ATLAS_GRAPH_ROLE_RANK`; `filterAtlasEdges`; `summarizeProvenance`; `getCompareLegendLabels`; `formatSourceRefLabel`; `isInferredLink`; `PublicationStatusBadge`; `DEFAULT_CLUSTER_THRESHOLDS`; `resolveLayoutMode`; `compareNodeColor`; `nodeShapeRadius`; `inferRecordType`; `navigateToView`; `Field`; `friendlyTypePlural`; `buildCrossFrameworkEquivalents`; `fetchArtifact`; `loadLibrarySearchPhase`; `loadFullGraphPhase`; `loadRuntimeDataset`; `buildCompareUrl`; `buildAtlasMapUrl`; `appUrl`; `normalizeNistControlId`; `buildCciDiffReport`; `activityNodeId`; `extractCapabilitiesAndActivities`; `parseAttackStixBundle`; `buildAttackCatalogDocument`; `ENTERPRISE_SOURCE`; `ICS_SOURCE`; `D3FEND_MAPPINGS_SOURCE`; `D3FEND_ONTOLOGY_SOURCE`; `parseGithubOrganizationSignals`; `normalize800172Id`; `buildSearchTokens`; both relationship-builder `checksum` exports; `parse800171OscalMappings`; `fetchBuffer`; all source/template validator constant exports and `getSource` / `validateTemplateRegistry`. Many are internally used, test seams, or public module contracts; a separate API-surface migration must prove consumers before changing them.
- **Exported types — retained contracts:** `RmfLifecycleStep`; `SourceHierarchyTier`; `SourceManifestRecord`; `SourceMapDisposition`; `SourceNoviceQuestion`; `CompareRole`; `CompareGraphNode`; `CompareSummaryCounts`; `CompareGraphLabels`; `LayoutMode`; `GraphLink`; `NavItem`; `CrossFrameworkGroup`; `LibrarySearchShard`; `RelationshipViewMode`; `AtlasMapUrlOptions`; `CompareUrlOptions`.
- **Remaining duplicate export:** `RelationshipGraphWithHandle` plus its default export is intentional because `React.lazy` consumes the default; changing it has no measured value.

## Rejected and deferred candidates

- Compliance Trestle remains rejected for the current import-only OSCAL role.
- Lychee, `eslint-plugin-jsx-a11y`, and Cheerio remain deferred. The five required milestones produced no measured trigger for another dependency: freshness already has a purpose-built model, axe and semantic contracts cover the current mounted accessibility surface, and no brittle HTML adapter requires Cheerio.
- Crawlee, Crawl4AI, Orama, DuckDB, Storybook, OSV-Scanner, Qdrant, Chonkie, Marker, Airbyte, Meltano, Dagster, and all runtime AI/vector/service candidates remain excluded without a new measured trigger. Completed Crawl4AI/Chonkie/Qdrant/Marker experiments were not repeated.

## Remaining risks and next action

1. The four Ubuntu baselines were personally reviewed: desktop Map keeps the centered hub, six readable connection groups, and contained controls; desktop Purpose keeps six aligned stages and the selected path/actions; compact Map becomes a readable unclipped vertical list; compact Purpose stacks every stage in order with reachable full-width actions. No animation, font-swap, timestamp, clipping, blank-region, or loading artifact was accepted.
2. Docker Desktop was repaired without a reset: stale `dockerInference` startup residue was removed, Docker Desktop was updated in place to 4.82.0, and the intact WSL data disk was attached once with elevation. `docker run --rm hello-world` then passed. Docker was stopped after baseline work and remains intentionally stopped, not broken.
3. The earlier 124/1/3 browser result was load instability rather than a reproducible product regression. Docker/WSL startup loops and duplicate backends consumed about 1.08 GiB working set; stopping them increased free memory from 1.33 GiB to 2.57 GiB. With that workload isolated, the detailed-mappings axe test passed twice in 1.1 minutes, the Atlas Purpose case passed in 4.4 seconds, the Start Here destination passed in 6.5 seconds, and the unchanged complete matrix passed 127 with 1 skipped in 9.2 minutes. No assertion, timeout, worker count, or performance budget was relaxed.
4. Ubuntu visual CI, Pages deployment, and Pages Live Smoke have remote evidence after `e56ffc7` reached `main`. Human screen-reader testing, real-device testing, and focused deployed Lighthouse remain separate unverified evidence. Lighthouse stays report-only until repeated Ubuntu CI runs establish stable route-specific budgets.
5. The final `v1.0.0` tag and release were not created or published. The release agent should reconcile any separate release-polish branch, complete or accept the remaining external evidence gaps, and request explicit owner approval before publication.

## Pipeline hardening follow-up

The post-deploy review found duplicate work rather than a need to weaken the gate:

- `precommit` built the static site before browser work, then both accessibility and the general Playwright command rebuilt it. The revised scripts build once and expose no-build `:run` variants for CI and precommit ownership.
- The general Playwright matrix also rediscovered and reran all 22 accessibility cases. A functional-only config now excludes the separately owned accessibility and approved-layout visual suites while retaining their dedicated jobs and assertions.
- Pages repeated the complete Public Repo Checks gate after `main` had already passed it. Pages now triggers from a successful `Public Repo Checks` push run on `main`, checks out that run's exact `head_sha`, rebuilds the deploy artifact, verifies it, and deploys it. Manual dispatch remains available.
- Lighthouse remains report-only. A protocol timeout or missing report artifact warns without turning the entire required-check workflow red; reports stay private to the runner and GitHub artifact storage.
- Framework data tests now construct their immutable graph fixture once per file, retaining the two explicit rebuilds that verify idempotency. Focused data verification passed 194 assertions in 36.6 seconds.
- Explore results no longer remount when asynchronously loaded groups expand the result set. Five consecutive focus checks passed after keying the accordion by route query rather than loaded group membership.

Measured local evidence: the dedicated accessibility suite passed 22/22 in 3.5 minutes; the functional matrix passed 105 with 1 skipped in 7.7 minutes; the complete optimized precommit passed in 868.6 seconds. Earlier separation alone reduced the functional matrix from 127 passed plus 1 skipped in 11.4 minutes to 105 passed plus 1 skipped in 7.1 minutes on the same constrained Windows host. Wall-clock variance remains material because the large detailed-mappings axe case and single-worker browser workload are intentionally retained.

Rollback: restore the previous package scripts and Playwright discovery, restore direct `push` ownership in `pages.yml`, restore the duplicated Pages verification steps, and remove `playwright.e2e.config.mjs`. Reverting the shared data fixture and Explore key changes is independent. Rollback increases repeated work and reintroduces the focus-loss defect; it does not restore any unique assertion.
