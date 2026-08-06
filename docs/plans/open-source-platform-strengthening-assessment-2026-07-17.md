# Open-source platform strengthening assessment

**Decision date:** July 17, 2026
**Scope:** Control Atlas UI/UX, copy quality, search, ingestion, OSCAL handling, build performance, automated QA, and supply-chain controls.
**Release effect:** Assessment only. Do not add these tools to the v1.0 release-readiness branch unless they fix a measured release blocker.

## Bottom line

Control Atlas does not need a new platform stack. Its strongest path is to automate the three failures this release exposed: visual drift from approved compositions, performance regressions that were found late, and repetitive or vague product copy. The source pipeline is already appropriately static-first and structured-data-first; replacing it with a crawler or workflow platform would add more system than problem.

### Recommended adoption sequence

1. **Use Playwright screenshot assertions after v1.0.** Playwright is already installed, and its built-in [`toHaveScreenshot`](https://playwright.dev/docs/test-snapshots) can turn the approved Atlas desktop and mobile compositions into narrow regression contracts. Keep the baseline set small and run it in one stable CI environment because rendering varies by host.
2. **Add Lighthouse CI after v1.0.** The release audit exposed a major performance regression that request-count and bundle contracts did not detect. [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md) supports static sites and automated assertions. Start with report-only runs on Landing, Explore, focused Atlas, and Templates; establish stable measurements before making budgets blocking.
3. **Spike then add a Control Atlas Vale style.** [Vale](https://github.com/vale-cli/vale) is a markup-aware, extensible prose linter. A small project-owned rule set should flag known product debt such as repeated disclaimers, `source-backed`, `source truth`, vague self-description, duplicate adjacent sentences, and headings that do not answer what the user can do. It must supplement human copy review, not award “human-sounding” quality mechanically.
4. **Run Knip as a one-time debt report.** [Knip](https://github.com/webpro-nl/knip) finds unused files, dependencies, and exports. That directly fits the residue risk created by several graph-stack and frontend migrations. Start non-blocking; classify every finding before removing anything.
5. **Cross-check OSCAL inputs with the official NIST OSCAL CLI.** NIST lists the [OSCAL CLI](https://pages.nist.gov/OSCAL/resources/tools/) for validation, conversion, and profile resolution. Use it on representative source snapshots beside the existing AJV and normalization tests. Adopt it as a build validator only if it finds defects the current contracts miss and its Java/runtime cost is acceptable.

This sequence adds no backend, AI runtime, vector database, or data-orchestration service.

## Fit by problem area

| Area | Current Control Atlas state | Candidate | Decision | Why |
| --- | --- | --- | --- | --- |
| Approved UI fidelity | Playwright E2E verifies geometry and workflows, but screenshots are evidence rather than baselines | Playwright visual comparisons | **Adopt after release** | Uses the existing test stack and directly protects the approved desktop/mobile compositions. |
| Performance | Route chunks and request payloads are checked; focused Lighthouse is still manual | Lighthouse CI | **Adopt gradually after release** | Catches LCP, TBT, CLS, and other user-visible regressions that bundle size alone cannot. |
| Copy / “AI slop” | Content tests catch prohibited claims but not repetitive, vague, dead-horse copy | Vale with project rules | **Controlled spike, then adopt** | Best match for repeated phrases and terminology governance; generic grammar packs would be noisy. |
| Dead code / dependency residue | TypeScript, ESLint, licenses, and tests pass; old graph migrations create uncertain residue | Knip | **One-time spike** | Produces an evidence-backed cleanup inventory without changing runtime behavior. |
| JSX accessibility | Axe covers rendered routes and manual keyboard/reflow checks exist | [`eslint-plugin-jsx-a11y`](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y) | **Small configuration spike** | Static checks can catch authoring mistakes before a route renders, but duplicate/noisy rules should not become an immediate release gate. |
| External-link health | Source freshness has domain semantics; no general link crawler is in CI | [Lychee](https://github.com/lycheeverse/lychee) | **Scheduled spike** | Useful for docs and canonical URLs, but must use an allowlist/retry policy and must not replace the source freshness model. |
| OSCAL conformance | Custom normalizer tests plus schema-specific AJV checks | NIST OSCAL CLI | **Controlled cross-check** | An authoritative independent validator is more valuable than another homegrown rule. |
| OSCAL authoring/governance | Control Atlas imports public OSCAL; it does not author a compliance-as-code repository | [Compliance Trestle](https://github.com/oscal-compass/compliance-trestle) | **Hold** | Stronger fit if the product later manages or authors OSCAL artifacts; too much workflow for the current importer role. |
| Structured HTML ingestion | Native `fetch`, explicit adapters, and Playwright handle current structured and dynamic sources | [Cheerio](https://github.com/cheeriojs/cheerio) | **Use when the next HTML adapter needs it** | Lightweight HTML/XML parsing is the next step before a crawler framework. |
| Dynamic-source crawling | Existing Playwright can handle source-specific browser extraction | Crawl4AI / [Crawlee](https://crawlee.dev/js/api/playwright-crawler) | **Exception-only** | Crawl4AI worked but was heavy; Crawlee earns a spike only when queues, retries, concurrency, and several dynamic sources become recurring needs. |
| Record search | MiniSearch plus checked-in ranking aliases now passes 4/4 expert and 11/11 novice cases | [Orama](https://docs.orama.com/docs/orama-js) | **Hold behind benchmark** | A replacement must beat the same quality, bundle, and static/offline constraints. There is no current failure that justifies migration. |
| Semantic search | Static runtime, 11,486 records, no service | Qdrant + Chonkie | **No current integration** | The bounded Qdrant experiments timed out; Chonkie is useful only if long-document chunk search becomes a real requirement. |
| PDF extraction | Current registered sources are mainly JSON, XML, XLSX, and DOCX | Marker | **Named-PDF experiment only** | Its dependency and model footprint is disproportionate until a specific PDF blocks coverage. |
| Data aggregation | Explicit adapters, checked-in source snapshots, weekly human-reviewed refresh PR | Crawlee, Airbyte, Meltano, Dagster | **Do not adopt now** | The bottleneck is source-specific correctness and review, not generic scheduling or connector volume. GitHub Actions already orchestrates the job. |
| Local analytics | Node build handles 11,486 nodes and 16,207 edges within current data budgets | DuckDB | **Hold** | Consider only if measured joins or build time become a bottleneck; it does not solve current UX or copy problems. |
| Dependency security | `npm audit`, dependency review, CodeQL, Gitleaks, license gate, and CycloneDX SBOM already run | [OSV-Scanner](https://github.com/google/osv-scanner) | **Evaluate as a scheduled complement only** | It can broaden ecosystem/lockfile coverage, but adding a second blocking scanner now would mostly duplicate existing Node coverage. |
| Component workshop | Product drift occurred in page composition and workflow hierarchy | Storybook | **Hold** | Golden route workflows are a closer fit than maintaining a second presentation surface today. Revisit when a shared component library has multiple consumers. |

## Existing stack to keep

- **React 19 + Vite 8 + React Router:** no demonstrated framework bottleneck.
- **Semantic DOM for the primary Atlas:** it gives bounded responsive layouts, keyboard semantics, and a small focused chunk without a graph engine.
- **React Flow + ELK only on the lazy legacy relationship surface:** do not add a third graph library. Remove or replace these only after that remaining route has its own product review.
- **MiniSearch:** keep the deterministic, sharded, offline index while the checked-in expert/novice benchmark remains green.
- **Playwright + axe:** extend the existing stack instead of introducing Cypress or another browser harness.
- **Explicit Node import adapters + GitHub Actions:** preserve source-specific normalization, provenance, checksums, and human-reviewed refresh PRs.
- **AJV and contract tests:** keep them even if OSCAL CLI is added; the two layers test different boundaries.
- **Current security pipeline:** dependency review, CodeQL, Gitleaks, license enforcement, `npm audit`, and SBOM generation already cover the core public-repository risks.

## Adoption gates

No candidate is adopted because it is popular. It must pass the applicable gate:

- **UI/UX:** catches a real regression without brittle failures across the supported CI host.
- **Copy:** flags the known bad patterns with low false-positive volume; a human still decides whether prose is natural and useful.
- **Search:** beats the checked-in novice/expert benchmark without losing exact-ID behavior, offline use, or the payload budget.
- **Ingestion:** preserves canonical URL, retrieval date, checksum, license/use terms, and a reviewable source snapshot.
- **Build:** improves a measured duration, defect class, or maintenance burden enough to justify installation and CI time.
- **Security:** expands coverage rather than merely producing duplicate findings.
- **License/operations:** license is compatible, no secret or private service is required, and the static site remains usable without it.

## Concrete backlog

These are post-v1 maintenance candidates, not release blockers:

| Priority | Item | Exit evidence |
| --- | --- | --- |
| P1 | Add four stable Playwright golden routes | Approved desktop Map/Purpose and compact Map/Purpose compare cleanly in CI. |
| P1 | Add report-only Lighthouse CI | Three-run reports for Landing, Explore, focused Atlas, and Templates; budgets proposed from stable evidence. |
| P1 | Build a Control Atlas Vale rule set | Known bad phrases and repeated boilerplate fail fixtures; approved plain-language copy passes; false positives reviewed. |
| P2 | Run and classify Knip | Every reported file/dependency/export is confirmed live, intentionally retained, or separately queued for removal. |
| P2 | Cross-check representative OSCAL snapshots | NIST CLI result is recorded against catalog/profile fixtures and compared to current contracts. |
| P2 | Trial Lychee on docs and canonical source URLs | Rate limits and known dynamic/blocked endpoints have explicit policy; actionable broken links are separated from transient failures. |
| P2 | Trial `jsx-a11y` recommended rules | New unique findings are fixed or documented; redundant rules are disabled. |
| P3 | Evaluate Cheerio on the next brittle HTML source | Adapter becomes simpler and remains fully fixture-tested. |
| Triggered | Evaluate Crawlee or Crawl4AI | At least three active JavaScript-driven sources defeat the explicit Playwright/Cheerio path. |
| Triggered | Evaluate Orama, Chonkie, or another index | The current benchmark expands to long-document retrieval or MiniSearch misses a measured quality/latency target. |

## Non-goals

- Do not turn Control Atlas into an AI stack.
- Do not introduce a runtime service, database, login, user upload, or private data flow.
- Do not use automated extraction to invent or infer cross-framework mappings.
- Do not replace source-specific review with a generic crawler success status.
- Do not add tools to the v1.0 branch solely to make the release checklist look more sophisticated.
