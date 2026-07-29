# Control Atlas V1 launch contract

Date: 2026-07-28
Status: proposed launch authority for the holistic correction
Decision: V1 is an evidenced product state, not a version number or closed backlog.

## V1 outcome

A working practitioner can independently find, verify, relate, compare, and use published cybersecurity material and external working resources without being misled about:

- the publisher or publication;
- structural position versus applicability or mappings;
- what came from a source versus Control Atlas;
- what Control Atlas can do versus what remains user, program, or authorizing-authority judgment.

The product should feel like the obvious public workbench for this information: fast to enter, rigorous at depth, useful without an account, and honest when information is unavailable.

## Release rule

V1 is `GO` only when every gate below has evidence. A gate is not satisfied by a planning status, code inspection, a passing unrelated test, or acceptance of residual risk that changes source truth, user judgment, core task completion, accessibility, or security.

The owner makes the final launch decision after reviewing the evidence packet. The implementation agent may recommend `GO` or `NO-GO`; it may not self-authorize deployment.

## Gate 1 — Source and decision integrity

Zero-tolerance:

- Every record resolves to its exact publisher and publication/catalog identity.
- Ingestion provenance is stored separately and never used as a publication label.
- Full-corpus identity validation reports zero missing or mismatched publication mappings.
- Official titles, identifiers, text, citations, and links are correctly attributed.
- Missing source identity fails closed; the product never guesses.
- Trees use only publisher-declared hierarchy.
- Baselines, applicability, mappings, evidence, implementation aids, processes, and Resources never become parents.
- No default, recommendation, generated document, or interface copy selects or implies applicability, compliance, inheritance, authorization, or ATO outcome.
- Preview and Download use the same validated input snapshot.

Any failure is `NO-GO`.

## Gate 2 — Practitioner workflows

All twelve workflows in the full audit pass on the release candidate:

1. Find a known identifier.
2. Search a topic without an identifier.
3. Distinguish exact, ambiguous, and honest zero results.
4. Verify official identity, text, source, structure, and relationships.
5. Follow a relationship and return without losing state.
6. Explore one scope through Path, Map, and List.
7. Compare records/frameworks with shareable configuration.
8. Inspect a source and how Control Atlas used it.
9. Find a tool, template, dataset, starter document, training source, or community.
10. Recover from invalid parameters, stale links, missing records, and empty filters.
11. Refresh, go back/forward, and copy links without losing valid state.
12. Complete the work at desktop, tablet, mobile, and 200% zoom.

No defining capability is hidden, half-baked, duplicated, or a dead end. Every row in the 2026-07-28 surface matrix is reconciled to `Pass`, except genuinely external human/device evidence tracked by the gates below.

## Gate 3 — Information architecture, layout, and copy

- Home exposes universal Search in the first 375×812 viewport and has one dominant action.
- Search, Explore, Catalog, Compare, Learn, Build, Resources, Sources, and About satisfy their distinct target jobs.
- RMF is an optional lens.
- Catalog is exhaustive without a publisher wall or silent result ceiling.
- Explore Path, Map, and List cover the same scope and reconcile counts.
- Records place official identity and text before workflow chrome and raw metadata.
- Build exposes Tasks, Starter documents, and Resources as equal lanes.
- Sources is a compact provenance register.
- Learn contains real explanatory material or is absent from primary navigation.
- Responsive presentation preserves every control, warning, source field, and piece of information.
- No clipped controls, content-agnostic minimum heights, footer-before-content shift, dead framed space, or oversized repetitive scaffolding remains.
- The copy register is fully reconciled by defect class.
- A human editorial pass finds no patronizing labels, platitudes, repetitive taglines, canned metaphors, generic marketing, vague actions, product/source blur, unsupported interpretation, or disclaimer wallpaper.
- Every meaningful surface answers what it is, why it matters here, and the concrete next action.

Automated copy/style checks support this gate but cannot approve it.

## Gate 4 — Practitioner validation

Run the [V1 practitioner validation protocol](../research/control-atlas-v1-practitioner-validation-protocol-2026-07-28.md) against a deployed preview or release candidate.

Required:

- At least five working practitioners across at least three relevant roles.
- At least 80% unassisted completion across the critical task set.
- Zero participant encounters with source misattribution.
- Zero participant interpretation that Control Atlas determined applicability, compliance, baseline, inheritance, or authorization.
- At least four of five can correctly distinguish Sources from Build → Resources and official text from Control Atlas notes.
- Every observed Critical/High task or comprehension failure is corrected and replayed before launch.

If participants are unavailable, V1 remains `NO-GO`; this gate is not replaced by an internal persona simulation.

## Gate 5 — Accessibility

Target: WCAG 2.2 AA across complete pages, responsive variants, and complete processes.

Required:

- Automated axe coverage reports zero serious or critical violations on every canonical route and defining expanded/error state.
- Keyboard-only operation completes all twelve workflows with visible, unobscured focus and no trap.
- Actual 200% zoom passes with reflow and no lost information.
- Reduced-motion behavior is verified.
- Manual contrast, target-size, headings/landmarks, accessible names, status messages, tables, dialogs, graph alternatives, and error recovery pass.
- A human NVDA session validates the desktop primary workflows.
- A human VoiceOver or TalkBack session validates the mobile primary workflows.
- Physical phone and tablet checks validate responsive controls and reading order.

Component libraries and automated tools do not satisfy this gate by themselves. W3C defines conformance for full pages and responsive variations; USWDS likewise requires project-context and broad manual testing.

Sources: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [USWDS accessibility guidance](https://designsystem.digital.gov/documentation/accessibility/).

## Gate 6 — Performance and resilience

Required route set:

- Home.
- Search with exact, ambiguous, and zero results.
- Explore overview and focused record in Path/Map/List.
- Catalog and a large catalog detail.
- Representative small and large records.
- Configured Compare.
- Build and Resources.
- Sources.

Required:

- Loading, empty, error, invalid, retry, stale-link, and oversized-data states are deterministic and useful.
- No footer-before-content or other late-content layout shift.
- No uncontrolled graph/list expansion, runaway fetch, duplicate index load, or ignored request failure.
- Run three mobile Lighthouse measurements per required route on the same runner/configuration.
- Candidate median must not regress more than three performance points from the previous release on that runner.
- Defined release-candidate lab targets: LCP ≤2.5s, TBT ≤200ms, CLS ≤0.1 on the agreed throttled profile. Any exception requires a measured cause, owner-approved release decision, and time-bounded correction; source/interaction routes cannot be excepted if unusable.
- If field data becomes available, use the 75th-percentile Core Web Vitals targets: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1.
- Bundle/request/index budgets and cache behavior are recorded.

Core Web Vitals thresholds: [web.dev](https://web.dev/articles/defining-core-web-vitals-thresholds).

## Gate 7 — Security, privacy, and dependency integrity

- No secrets, private uploads, or account state enter the public static product.
- Official URLs follow the federal source policy and never fabricate deep links.
- Dependency audit, license checks, CodeQL/security workflows, and source freshness gates pass.
- Generated downloads contain no silent substantive defaults.
- External Resources are clearly external and expose owner, provenance, limitations, and link status.
- Invalid inputs and URLs cannot produce unsafe output or misleading state.
- No Critical/High security or data-integrity finding remains.

## Gate 8 — Release and operations

- Correction branch is clean and contains coherent milestone commits.
- `npm run precommit` and stricter correction gates pass.
- CI is green on the exact release commit.
- Release evidence names commit, asset identifiers, generated-data timestamp, and deployed URL.
- A rollback target and rollback procedure are recorded before deployment.
- Deployment uses the repository's authorized release flow only after fresh owner authorization.
- Live smoke, canonical routes, downloads, responsive layouts, accessibility automation, and source-identity sampling pass after deployment.
- No local or preview evidence is presented as live evidence.
- Known non-blocking residuals have an owner, measurable trigger, and review date.

## Gate 9 — Product identity and launch communication

Before public launch:

- One sentence states what Control Atlas is.
- One sentence states what it does not determine.
- Launch copy names the primary practitioner jobs and the no-account/public-workbench model.
- About, README, repository description, page metadata, social preview, and live product use the same canonical identity.
- Contribution and issue-reporting paths are clear.
- The launch does not claim exhaustive correctness, official-government status, compliance determination, or guaranteed outcomes.

## Evidence packet

The release candidate must produce:

1. Gate matrix with `Pass`, `Fail`, `Blocked`, or `Skipped with reason`.
2. Full-corpus source-identity report.
3. Practitioner-workflow results.
4. Copy/editorial sign-off.
5. Practitioner validation report.
6. Accessibility automation and signed human/device checklist.
7. Performance A/B and route metrics.
8. Security/dependency/source-freshness results.
9. CI and local command outputs.
10. Deployment and post-deploy evidence.
11. Rollback record.
12. Owner `GO` or `NO-GO` decision.

No row remains `Not tested`.

## Skills and MCP decision

Use during the correction:

- `functionality-stress-test`: maintain full surface/state and broken-state coverage.
- `verification-before-done`: prevent unsupported completion claims.
- `cloudflare:web-perf`: only if Chrome DevTools MCP is available and Lighthouse identifies a bottleneck needing trace-level diagnosis.
- `release-maintenance`: only after fresh owner authorization to push, merge, deploy, or release.
- Browser/Playwright tooling: required for local and live workflows.
- GitHub connector: repository, CI, issue, and release evidence.
- Context7: current documentation for existing libraries only.

Do not add now:

- Figma, Notion, Slack, Atlassian, database, hosting-provider, or spec-dashboard MCPs.
- A second browser framework, Search engine, graph stack, state library, or design system.
- Chrome DevTools MCP solely because it exists. The repository already has Lighthouse CI; add trace tooling only when an active measured bottleneck requires it.

The small tool stack keeps context and operational ownership bounded.

## Launch decision

`GO` means every zero-tolerance and required gate passes on the exact deployed candidate, with human evidence where required.

`NO-GO` means any Critical/High truth, core-workflow, accessibility, security, or participant-comprehension failure remains.

Polish can iterate after launch. Misattribution, unsafe determination, inaccessible core work, broken defining workflows, and false product identity cannot.
