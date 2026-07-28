# Follow-on Codex implementation prompt

Use the following prompt only after the owner approves the correction direction and names the first epic to execute.

---

You are implementing the approved Control Atlas correction backlog in:

`D:\DevOps\1. Projects\GovFrame`

## Authority

Read these files before editing:

1. `AGENTS.md` and the full canonical Core Engineering Doctrine it references.
2. `docs/audits/control-atlas-current-state-audit-2026-07-27.md`
3. `docs/planning/control-atlas-correction-spec-2026-07-27.md`
4. `docs/planning/control-atlas-correction-backlog-2026-07-27.md`
5. `docs/tree-model.md`
6. `docs/PRD.md`
7. `docs/DESIGN_PRINCIPLES.md`
8. `docs/design/translation-first-design.md`
9. `docs/design/design-system.md`
10. `docs/architecture/ARCHITECTURE.md`
11. `docs/FEDERAL_SOURCE_POLICY.md`

The 2026-07-27 audit/spec/backlog and canonical tree model govern the correction. Preserve newer repository guidance if it has been explicitly owner-approved; flag any conflict before implementation.

## Objective

Implement **Epic [OWNER INSERTS EPIC NUMBER AND NAME]** only. Complete every feature and milestone gate assigned to that epic. Do not substitute adjacent cleanup or begin the next epic.

## Fixed product decisions

Replace this section with the owner’s answers before execution:

- Explore canonical route `/explore`, Search canonical route `/search`: [APPROVED / CHANGED]
- Full external directory user-facing name “Resources”: [APPROVED / CHANGED]
- Resources primary categories: Rules and policy; Catalogs and data; Templates and starters; Tools and automation; Communities and training; Reference and history: [APPROVED / CHANGED]
- Build local navigation: Tasks; Starter documents; Resources: [APPROVED / CHANGED]
- Atlas default: true structural position followed by explicit relationship lenses, with Path/Map/List as representations: [APPROVED / CHANGED]

Stop and request owner direction if any required decision remains blank or if a proposed change materially conflicts with an approved decision.

## Constraints

- Work on `agent/<lead-persona>/<issue>-<slug>`, not `main`.
- Keep the React 19, Vite 8, HashRouter, static GitHub Pages, MiniSearch, and public-data-only architecture unless an evidenced blocker is approved.
- Never fabricate official deep links. Follow `docs/FEDERAL_SOURCE_POLICY.md`.
- Structural breadcrumbs may use only validated structural relationships. Baselines, mappings, correlations, evidence, implementation aids, and Resources are never parents.
- External Resources remain outside the canonical framework tree.
- Preserve valid legacy deep-link state through explicit, tested aliases.
- No stubs, placeholders, parallel taxonomies, silent fallbacks, or route-by-route patches that bypass the shared model.
- Do not change `.env`, secrets, git history, or files outside the repository.
- Do not start a development server until the owner explicitly confirms `npm run dev:guarded` and its port in the current chat.
- Do not commit, push, merge, or deploy unless the owner explicitly authorizes those actions in the current task.

## Required workflow

1. Restate the selected epic, constraints, hazards, acceptance criteria, and lead persona.
2. Check `git status`, branch, current commit, package scripts, and active ports.
3. Inspect the named implementation paths and direct callers/tests. Use maintained authoritative platform documentation only where the existing repo does not settle behavior.
4. Establish the cheapest faithful failing test for each Critical/High finding before changing production code.
5. Implement the smallest systemic correction that satisfies the epic. Keep generated-data migrations versioned and reversible.
6. Run focused unit/contract tests after each coherent change. If an expensive browser loop fails twice without narrowing the boundary, stop and add instrumentation or a focused test.
7. Run the epic’s required browser, responsive, accessibility, and route-history checks once focused gates are green.
8. Show `git status`, diff summary, changed paths, exact commands, and outputs.
9. Compare every epic acceptance criterion against evidence. Do not call the epic complete with a known residual.
10. Update only the relevant current planning/state documentation. Do not rewrite historical audit evidence.

## Epic-specific non-negotiables

### If executing Epic 1

- Add a graph invariant before repairing UI symptoms.
- Prove AC-2 cannot acquire CSF or a baseline as ancestry.
- Prove exact Atlas search, ambiguous search, and no-match behavior.
- Preserve enhancement structural identity.
- Make relationship class and direction explicit in Path, Map, and List.

### If executing Epic 2

- Build a parameterized route round-trip matrix first.
- Query-bearing legacy `/explore` must reach Search; `/atlas-map` focused links must reach Explore.
- Generated/copy links must be canonical.
- No raw slugs/enums in titles or context.

### If executing Epic 3

- Reconcile all 96 records to exactly one primary category.
- Determine search eligibility before editorial ranking.
- `zzzzqqqq` must produce a real no-result state.
- Trust lane remains an independent facet.
- Recommendations state reason and provenance and never become tree edges.

### If executing Epic 4

- Apply the canonical record anatomy without hiding sources or relationships.
- Build task/document state must survive refresh, back, forward, and sharing.
- Mapping language must never imply determination.

### If executing Epic 5

- Verify 375, 768, 1440, and 200% zoom.
- Provide a non-horizontal-scroll primary reading mode for mobile Compare.
- Complete keyboard and human NVDA or VoiceOver evidence.

### If executing Epic 6

- Map each Critical/High finding to a fast regression test.
- Split live checks into bounded route groups.
- Update only intentional visual baselines.
- Deployment and alias retirement require fresh owner authorization.

## Completion report

Lead with the outcome, then provide:

- epic and features completed;
- acceptance-criteria evidence;
- exact tests and results;
- changed files and diff summary;
- route/data migration notes and rollback;
- remaining risks or deviations;
- branch and commit status;
- explicit recommendation for the next epic, without starting it.

If any gate fails, stop at the fault boundary and report the failure. Do not broaden the fix silently.

---
