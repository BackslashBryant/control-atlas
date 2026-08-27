# Epic: Control Atlas Product Trust and Surface Coherence

- **Owner:** Nexus, Muse, Forge, and Pixel
- **Status:** Active
- **Closeout:** Delete it in the shipping change after exact-SHA live proof.

## Outcome

Ship a coherent, source-trustworthy Control Atlas experience across every public
route while repairing the automation and verification paths that currently make
routine work slow, noisy, or falsely red.

The Epic is complete only when a user can arrive, orient, understand, explore,
decide, act, and recover without encountering contradictory page structure,
unreadable source text, unbounded workbenches, misleading freshness, or opaque
automation failures.

## Authority and evidence

Agents must read the shared authorities once, then only the active phase delta:

- Product direction: `docs/PRD.md`, `docs/vision.md`,
  `docs/DESIGN_PRINCIPLES.md`
- Page and responsive contracts: `docs/PAGE_CONTRACTS.md`
- Visual system: `docs/design/design-system.md`
- Source and record truth: `docs/SOURCE_TRUTH_PROFILES.md`,
  `docs/RECORD_TYPE_FIDELITY_AUDIT.md`, `docs/DATA_POLICY.md`
- Operations and release: `docs/CI_CD.md`, `docs/OPERATIONS.md`
- Prior page findings to reconcile, not blindly repeat:
  `visual-audit-findings.md`
- Graph implementation research and selected stack:
  `src/ui/graph/GRAPH_REFERENCES.md`

Current live baseline when this Epic opened:

- Release SHA: `89fc3d55c3a850e89fe184d026fd542b1854b017`
- Current source-data date shown by `release.json`: `2026-08-26`
- Main CI and deployment were green, but scheduled validation was not trustworthy.
- Nightly run `33100567839` exposed contrast failures, unreadable merged browser
  reporting, and a false required-job failure on a scheduled run.
- Weekly refresh run `32945576888` stopped on a supplemental STIG Viewer `403`.

## Platform gate

No new UI runtime is required. Control Atlas keeps React, Vite, Radix,
`@xyflow/react`, ELK, and Graphology. Those maintained open-source components
already cover the product-specific gap.

For incremental engineering work:

- Nx (MIT) provides input hashing, affected task graphs, and local/remote cache,
  but adopting it now would require modeling this single-package repository as
  several artificial projects and declaring many overlapping generated outputs.
- Turborepo (MIT) provides task caching and remote cache, but its package-centered
  graph is a weaker fit for the current single-package, stage-oriented pipeline.
- Playwright's built-in worker model and the Node test runner already provide the
  required safe parallel execution. Use them before adding an orchestrator.
- `make-fetch-happen` (ISC) provides persistent HTTP caching and conditional
  requests. The Phase 0 spike proved ETag revalidation with zero repeated body
  bytes and explicit rejection of its automatic stale-cache fallback.

Decision: repair task selection, fixture reuse, and built-in test parallelism
with the existing stack; do not add a task orchestrator. Adopt
`make-fetch-happen` narrowly in the acquisition layer behind a strict wrapper
that always revalidates, rejects stale responses, and persists only ignored or
CI-cached bytes.

## Verification budget

Routine phase work must use an affected plan printed before execution. Any
command expected to exceed two minutes, run more than 50 tests, rebuild the full
data corpus, or execute a browser matrix is a final-only gate.

Baseline evidence:

- `npm run build:data`: about 31 seconds on the opening workstation.
- `npm run precommit`: about nine minutes.
- `test:e2e:smoke`: 119 Chromium tests, one worker, four minutes.
- The data contract suite repeatedly reparses the same large immutable JSON
  collections inside individual tests.
- A CI-helper-only PR selected full generated-data, unit, build, browser,
  accessibility, visual, and Lighthouse jobs because path classification treated
  all package and tool changes as runtime changes.

Phase 0 measured improvements:

- Repeated federal graph fixture parsing: more than 30 seconds before isolation;
  36 contracts now complete in 9.4 seconds with one parse per collection.
- Unchanged generated-data site build: about 43 seconds before; about 3 seconds
  after preserving staged data and compressing only changed JSON.
- Sources browser family: 14 checks complete in 13.1 seconds with two workers.
- Conditional-fetch proof: the second ETag request transferred no body bytes;
  an offline publisher produced a hard failure instead of stale success.
- Identical atomic JSON output now preserves the existing file and mtime so
  unchanged generator stages do not invalidate downstream work.

## Evidence ledger

- Phase 0 exact release: merge `739d8b77253ee69e48c89c4beb149ec9c014467f`;
  main CI and deployment run `33114882562` passed production smoke and three
  Lighthouse passes.
- Phase 1 live Sources baseline: desktop and 390 px inspected August 27. The
  mobile route had no page overflow or zero-size focusable controls; the table
  changed to stacked records and the named publisher strip remained scrollable.
- Phase 1 fast acceptance: 50 automation and Guardian contracts passed in the
  affected path; the matrix registers 32 states across all 15 routes and six
  layout families.
- Phase 1 rendered family sample: Home, Start, Atlas, Library, record detail,
  and Guides passed at desktop and mobile. Six unchanged cases passed in the
  first run; the six cases affected by stale contract reconciliation passed in
  a focused rerun using two workers.

Required Phase 0 acceptance:

- A repository command prints the affected verification plan before running.
- Unknown changes fail closed to the final gate.
- Automation-only changes do not build the product or run browser/UI matrices.
- Local browser files use a bounded worker pool; CI sharding stays deterministic.
- Large immutable graph fixtures are parsed once per test process.
- Identical generated JSON is not rewritten.
- Conditional refreshes transfer no repeated body bytes and never accept stale
  fallback during required-fresh runs.
- Executable contract tests prevent topology or budget regression.
- Full-build equivalence remains the source of truth for final integration.

## Delivery phases

### Phase 0 - Trustworthy and economical automation

1. Finish the canonical CI waiter prerequisite through PR review and cleanup.
2. Add affected local verification and executable budget contracts.
3. Remove repeated large-fixture parsing and safe one-worker defaults.
4. Correct automation-only CI classification and scheduled required-job logic.
5. Give every nightly shard a unique blob report and readable terminal failure.
6. Make required publisher refreshes fail closed while optional supplemental
   observations record an explicit unavailable state and continue.
7. Spike conditional acquisition against representative sources; adopt it only
   with byte-count evidence and deterministic output equivalence.

### Phase 1 - Shared experience contracts and governed acceptance matrix

1. Reconcile every item in `visual-audit-findings.md` against the current live
   product and mark it resolved, regressed, superseded, or still open.
2. Restore `config/experience-guardian/route-matrix.json` as the canonical route,
   state, layout-family, breakpoint, keyboard, and recovery matrix.
3. Consolidate shared source state, provenance, freshness, dense-data, loading,
   empty, error, success, and recovery primitives before route-specific CSS.
4. Add representative rendered baselines by layout family, not one screenshot
   per page.

### Phase 2 - Source and record trust surfaces

Routes:

- `#/sources`, selected source, unknown source, zero results
- `#/record/disa-stig/V-256609`
- representative NIST, DISA CCI, ATT&CK, D3FEND, historical, and title-only records
- Catalog and publication detail routes reached from those surfaces

Acceptance:

- Source lifecycle badges and small actions meet WCAG AA.
- Register, inspector, and empty/error states share one information hierarchy.
- Publisher identity, artifact identity, source material, freshness, and product
  release are distinct and understandable.
- V-256609 Check and Fix content preserves paragraphs, lists, commands, paths,
  indentation, copy behavior, and mobile reading order.
- Unknown or missing publisher fields are explained without invented prose.

### Phase 3 - Bounded workbenches and relationship exploration

Routes:

- `#/matrix` / Compare configured, incomplete, empty, and invalid states
- `#/atlas-map` overview, focused record, zero connections, narrow viewport
- Library browse/search and Resources list/map/compare states

Acceptance:

- Compare uses fixed 100-row URL-addressable pages. Navigation replaces the
  current row window instead of accumulating hundreds of DOM rows.
- Counts, exports, and summary metrics describe the complete result, not only
  the visible page.
- Atlas meaning precedes layout: authoritative hierarchy, local relationships,
  evidence, uncertainty, limits, and list fallback remain explicit.
- Dense surfaces preserve task priority and primary action at 320, 375, 390,
  768, 1024, and 1440 pixels without horizontal page overflow.

### Phase 4 - Remaining page and content coherence

Routes and families:

- Shell and landing: Home, global search, navigation, footer, not found
- Entry/editorial: Start here, Guides, About, retired routes
- Browse/detail: Library, Catalog, Resources, Resource detail
- Staged workflow: Templates and generated preview/download states

Acceptance:

- Every first screen states what the page is, why it matters, and the next useful
  action without duplicate eyebrows, generic card walls, or architecture copy.
- Loading, empty, error, success, recovery, invalid URL, keyboard, focus return,
  reduced motion, and narrow viewport states meet the shared contract.
- Content is human, direct, specific, concise, transparent, and source-faithful.

### Phase 5 - Final integration, release, and cleanup

1. Run focused contract checks while iterating and one affected browser check per
   changed layout family at its affected breakpoints.
2. Run one full `npm run precommit` only after all implementation inputs freeze.
3. Commit narrowly, push the feature branch, open a PR, and require exact-head CI.
4. Perform focused fresh-checkout verification from the remote branch.
5. Merge only through the PR, verify the deployed `release.json` SHA, and run one
   bounded live route-family smoke.
6. Delete this temporary plan in the shipping change.
7. Remove clean temporary worktrees, delete merged task branches, prune, and
   verify no server, build, or temporary residue created by this Epic remains.

## Stop conditions

- Do not weaken source integrity, completeness, accessibility, performance, or
  release budgets to make a gate pass.
- Do not treat local or built output as live acceptance.
- Do not add a dependency until the platform gate and measured residual gap are
  recorded here.
- If an expensive check fails twice without narrowing the fault, add a focused
  diagnostic before another broad run.
