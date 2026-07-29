# Codex prompt — holistic Control Atlas correction

Date: 2026-07-28
Purpose: one continuous implementation pass through the complete 2026-07-28 audit and correction backlog

## Exact Codex setting

- Model: `gpt-5.6-sol`
- Reasoning level: `Ultra`
- Fallback if Ultra is not available in the Codex selector: `Max`
- Execution style: one persistent local coding session; complete milestones sequentially without pausing for approval between milestones

Why: this is a large, quality-first correction involving source integrity, data contracts, information architecture, search, generated outputs, responsive behavior, accessibility, copy systems, and deletion of parallel implementations. OpenAI identifies `gpt-5.6-sol` as the frontier-capability GPT-5.6 model and recommends the highest reasoning settings only for the hardest quality-first work. The current Codex environment exposes Ultra in addition to the publicly documented Max level. See [OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model).

## Paste this prompt into Codex

---
You are implementing the complete, approved Control Atlas holistic correction in:

`D:\DevOps\1. Projects\GovFrame`

This is a **change/build request**, not another audit or planning exercise. Execute the full correction program in one continuous pass. Work milestone by milestone, but do not stop for owner approval between milestones. Finish a milestone’s root cause, regression coverage, affected surfaces, and deletion/consolidation work before moving to the next issue.

## Outcome

Bring the complete Control Atlas product into conformance with the 2026-07-28 audit, target experience, correction backlog, project doctrine, and source-truth boundary.

Do not treat the backlog as a list of isolated strings, CSS tweaks, or route patches. For every finding:

1. Reproduce or verify the failure.
2. Determine whether it is an instance of a systemic defect.
3. Identify the shared source of truth, invariant, data contract, state model, component, generator, or test gap responsible.
4. Add the cheapest faithful failing test or invariant first.
5. Correct the shared root cause.
6. Find and migrate every affected consumer.
7. Delete or retire the superseded parallel implementation.
8. Run focused verification.
9. Recheck all affected live/local surfaces, states, responsive presentations, and copy classes.
10. Record evidence against the audit/backlog item before advancing.

If one fix exposes the same defect class elsewhere, expand the **same root-cause correction** to cover the full class. Do not leave known sibling instances for a later pass.

## Read before editing

Read these files completely, in this order:

1. `AGENTS.md`
2. `C:\Users\OrEo2\.engineering\core-engineering-doctrine.md`
3. `docs/audits/control-atlas-full-surface-audit-2026-07-28.md`
4. `docs/design/control-atlas-target-experience-2026-07-28.md`
5. `docs/planning/control-atlas-ux-correction-backlog-2026-07-28.md`
6. `artifacts/audits/control-atlas-2026-07-28/surface-matrix.csv`
7. `artifacts/audits/control-atlas-2026-07-28/copy-register.csv`
8. `artifacts/audits/control-atlas-2026-07-28/oss-evaluation.md`
9. Every file under `artifacts/audits/control-atlas-2026-07-28/evidence/`
10. `docs/PRD.md`
11. `docs/DESIGN_PRINCIPLES.md`
12. `docs/design/translation-first-design.md`
13. `docs/design/design-system.md`
14. `docs/tree-model.md`
15. `docs/FEDERAL_SOURCE_POLICY.md`
16. `docs/architecture/ARCHITECTURE.md`

The 2026-07-28 audit, target experience, backlog, surface matrix, and copy register govern this correction. Older PRD language about synthetic summaries or framework/baseline recommendations is superseded. Start Here is a source navigator, records are source-first, and Control Atlas must not make applicability, compliance, inheritance, authorization, or ATO determinations.

If current code or live behavior differs from the audit, verify the drift and still satisfy the governing principle and acceptance criterion. Do not dismiss a requirement merely because the exact audited symptom moved.

## Branch and authority

- Start from commit `2e8bc89c86a7124a1c222896b7585f311abfef6e`, which contains the complete audit package.
- Work on `agent/forge/control-atlas-holistic-correction`, not `main`.
- Preserve unrelated user changes. If the working tree contains overlapping edits that cannot be safely reconciled, stop and report the exact overlap.
- You are authorized to inspect and edit all in-repository product code, data builders, generated-data contracts, copy, styles, tests, and current planning/state documentation necessary to complete this correction.
- You are authorized to run non-destructive builds, generators, focused tests, browser tests, accessibility automation, and responsive/visual verification.
- For local browser verification, first run `npm run ports:status`. If port 3000 is free and a server is required, you are authorized to start exactly `npm run dev:guarded` on its default port 3000. Stop only the server you started, using the repository’s approved port command. Never kill an unknown process.
- Commit coherent verified milestones locally. Do not push, merge, deploy, tag, publish, release, or mutate production.
- Do not modify `.env`, secrets, git history, or files outside the repository.

## Non-negotiable product contracts

### Source identity

Misattribution can never happen.

- A record must resolve to its exact publisher and exact publication/catalog identity before the UI or generated output uses `official`, `publisher`, `source excerpt`, a publication name, citation, or official-source link.
- OSCAL or another ingestion mechanism is provenance, not a publication identity.
- Split generic ingestion provenance from exact publication identity across every catalog, not only CSF.
- Validate the complete catalog-to-publication mapping.
- If identity is missing or inconsistent, fail closed with an honest unavailable state. Never guess.

### User judgment

- Never select or infer an applicable baseline, framework, authorization path, inherited control, compliance status, or ATO outcome.
- Remove the silent Moderate baseline default from Build and every sibling path.
- Required substantive input blocks generation until explicitly selected.
- Optional unselected input remains absent and is identified as not selected.
- Preview and Download use the same validated input snapshot and readiness state.

### Canonical navigation and state

- One identity per destination: visible label, URL, title, selected navigation, analytics, context, and recovery destination agree.
- Explore, Search, Catalog, Compare, Learn, Build, Resources, Sources, and About remain distinct.
- Resources remains canonically under Build while being findable from Home and as an equal Build lane.
- Meaningful query, filter, task, document, comparison, scope, focus, lens, and selection state is validated URL state.
- Preserve valid state through refresh, back, forward, and copied links.
- Discard only invalid state and explain the recovery.
- Retired aliases are explicit recovery mechanisms, not parallel products.

### Structural truth

- Trees show only publisher-declared hierarchy.
- Graphs show relationships.
- Baselines, applicability, mappings, evidence, implementation aids, assessment material, processes, and external Resources are never structural parents.
- Multiple parents require an explicit publisher/project rule.
- Unavailable ancestry is stated honestly.
- Path, Map, and List operate on the same declared Explore scope and reconcile counts.
- RMF is an optional lens, never the default product worldview.

### Search

- Eligibility precedes ranking.
- Editorial preference cannot create a match.
- Exact unique identifiers may open directly.
- Ambiguous text goes through Search.
- Zero results remain honest.
- Search, the overlay, Catalog, and Resources use one typed eligibility and destination-identity contract.
- Keep and consolidate MiniSearch unless a measured benchmark proves it cannot satisfy the requirement.
- Remove or generated-hash-check duplicate vendored ownership and delete unused indexes.

### Copy

- Inventory all user-facing TS, TSX, MJS, JSON, generated-document, interpolation, tooltip, accessible-name, toast, loading, empty, error, and recovery copy.
- Every string class has a speaker: official publisher, external publisher, Control Atlas navigation note, Control Atlas explanation, system status, or product boundary.
- Official source text is not rewritten for product tone. Verify attribution, citation, truncation, and separation.
- Apply the copy-register dispositions across the full defect class, not only the quoted examples.
- Remove patronizing expertise labels, rotating Ctrl+Alt slogans, platitudes, repetitive taglines, decorative metaphors, generic marketing, canned `choose/start/understand` openings, `practical starting point`, ungrounded recommendations, and repeated disclaimer wallpaper.
- Buttons describe actions. Empty/error/loading states name what happened and the available recovery.
- Human editorial judgment is required after deterministic copy gates pass. A green Vale result alone is insufficient.

### Layout and responsive behavior

- Implement the target first-screen hierarchy and information density, not merely its words.
- Home exposes universal Search without scrolling at 375×812.
- Build exposes Tasks, Starter documents, and Resources as equal first-screen lanes.
- Catalog leads with exhaustive search, useful grouping, and facets; publisher is a filter or alternate lens.
- Record pages show exact official identity and text before workflow actions, contextual resources, repeated provenance, or raw metadata.
- Compare mode selection immediately reveals the next required inputs.
- Sources leads with compact trust-register data.
- Learn contains useful product-authored explanation or is removed from primary navigation until it does.
- Responsive presentation may reflow but cannot remove meaning, controls, warnings, provenance, or information.
- Eliminate clipped controls, horizontal dependence, hard-coded content-height patches, oversized footers, repeated page scaffolds, and dead framed space.
- Keep Orbital Archive architectural and restrained; usability and reading corridors take precedence over decoration.

### Dependency discipline

- Keep React Flow plus ELK and finish the bounded framework/topic overview and record-neighborhood workloads.
- Keep MiniSearch and consolidate search ownership.
- Do not adopt Orama, Pagefind, Cytoscape, Sigma/Graphology, D3 hierarchy, Gramps Web, a table framework, or a state library unless a measured requirement fails with the existing stack and the change includes license, bundle, accessibility, migration, removal, ownership, and rollback evidence.
- Adapt interaction patterns from the audited references; do not visually imitate or migrate frameworks without a proven need.

## Continuous milestone sequence

Use the exact milestone order and acceptance criteria in:

`docs/planning/control-atlas-ux-correction-backlog-2026-07-28.md`

Execute continuously:

1. Stop untruthful output.
2. Restore canonical destination and URL-state contracts.
3. Rebuild first-screen architecture.
4. Finish Explore, Catalog, Compare, and Learn.
5. Consolidate copy, search, style, and presentation ownership; delete superseded implementations.
6. Run independent local proof and prepare the release decision.

Do not begin visual polish before the source-identity and Build-output Critical gates pass. Do not begin the next milestone with a known Critical/High residual in the current milestone.

At the start, create a traceability ledger mapping:

- every Critical/High audit finding;
- every correction-backlog item;
- every affected route/component/generator;
- failing test or invariant;
- implementation commit;
- focused verification;
- responsive/live verification status.

Update the ledger as you work. It is a control mechanism, not a status-only document.

## Root-cause loop for every item

For each backlog item:

1. Reproduce the live symptom where practical and record the route/state/viewport.
2. Use `rg` to locate the generating data, shared model, component, callers, tests, and duplicate implementations.
3. State the root cause and blast radius in the traceability ledger.
4. Add the cheapest faithful failing test:
   - data/schema invariant for source identity;
   - reducer/serialization contract for state;
   - eligibility corpus test for Search;
   - semantic graph invariant for ancestry;
   - component/DOM contract for identity and disclosure order;
   - layout bounds/overflow test for responsive defects;
   - copy-manifest/repetition test for product voice.
5. Fix the most central layer that owns the truth.
6. Migrate all consumers and delete obsolete branches, indexes, copy sources, selectors, routes, and tests.
7. Run the focused gate.
8. Recheck every affected destination and state, including loading, zero, error, invalid, and recovery behavior.
9. Mark the item complete only when its acceptance criteria and regression evidence pass.
10. Move directly to the next backlog item.

Do not:

- patch only DE.AE-08 while leaving the shared source registry conflated;
- replace only the exact cringe phrases while leaving the copy-generation scaffold;
- change only a route label while title/selected state/analytics still disagree;
- add URL parameters that the surface ignores;
- add a second Search, taxonomy, graph model, or design system;
- hide a half-baked feature with copy;
- leave dead code or stale tests after migration;
- accept snapshot changes without explaining the intended behavior;
- declare completion from passing tests that exercise retired/recovery routes.

## Verification strategy

- Use fast unit, data, schema, reducer, graph, and contract tests as the inner loop.
- After a coherent root-cause correction is green, run its focused browser workflow once.
- If an expensive browser/build loop fails twice without narrowing the fault boundary, stop rerunning it and add a focused diagnostic/test.
- Verify representative short, long, zero, loading, error, invalid, and recovery states.
- Verify at 375, 768, and 1440 CSS pixels and actual 200% zoom.
- Verify keyboard-only and reduced-motion behavior.
- Run automated accessibility checks, but report them separately from human NVDA, VoiceOver, TalkBack, and physical-device evidence.
- Do not claim unperformed human/device evidence.
- Before completion, run `npm run precommit` and any stricter correction-specific gates once focused checks are green.
- Compare the final product against all 56 surface-matrix rows and all applicable copy-register rows/rules.

## Completion standard

This single pass is complete only when:

- every correction-backlog milestone gate passes;
- all three Critical findings are fixed systemically;
- no known Critical or High finding remains;
- the catalog-wide publication identity audit reports zero mismatches;
- the twelve practitioner workflows pass;
- every meaningful route/state is Pass or has a genuine external blocked/skipped reason;
- Search eligibility and destination identity are shared;
- Path/Map/List reconcile to the same Explore scope;
- no default or generated output implies applicability or authorization judgment;
- Home, Catalog, Record, Compare, Build/Resources, Learn, and Sources match the target hierarchy and density at desktop and mobile;
- the speaker-aware copy inventory covers every user-facing source class or explicit exemption;
- repetitive/patronizing/platitudinous product copy is removed across the system;
- superseded routes, indexes, components, styles, tests, and content scaffolds are deleted;
- focused tests, full gates, and final browser verification pass;
- current planning/state documentation reflects actual evidence;
- coherent milestone commits exist on the correction branch;
- the worktree is clean.

Do not stop merely because the session is long. Use context compaction at milestone boundaries if needed and continue from the traceability ledger. Stop only for:

- an actual unsafe/destructive action requiring new authority;
- an unreconcilable user-owned overlapping edit;
- a substantive product decision not resolved by the governing documents;
- a repeated external/tool blocker after safe alternatives are exhausted.

If blocked, provide the exact blocker, completed milestones, failing acceptance criterion, evidence, and smallest decision needed. Do not call partial completion success.

## Final report

Lead with the product outcome, then report:

- milestones and backlog items completed;
- root causes corrected;
- systemic consumers migrated and obsolete implementations removed;
- exact acceptance-criteria evidence;
- test commands and results;
- live/local route, responsive, zoom, keyboard, and accessibility evidence;
- changed files and diff summary;
- data/route/state migrations and rollback;
- residual risks and only genuinely external unverified evidence;
- branch and commit hashes;
- explicit statement that no push, merge, deploy, release, or production mutation occurred.

Do not provide a generic progress narrative. Provide evidence that the holistic correction is complete.

---
