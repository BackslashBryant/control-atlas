# Frontend Full Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit, remediate, verify, and ship the complete Control Atlas frontend against its translation-first UI/UX standard.

**Architecture:** Preserve the current React shell, HashRouter state contract, route page components, and split CSS design system. Correct defects at their source in shared navigation, page primitives, route components, or design tokens, then protect behavior with focused contract and Playwright coverage.

**Tech Stack:** React 19, TypeScript, React Router, Radix UI, Cytoscape, CSS design tokens, Node test runner, Playwright, axe-core.

---

### Task 1: Capture the audit baseline

**Files:**
- Create: `docs/audits/frontend-full-review-2026-06-22.md`
- Inspect: `src/ui/**/*.tsx`
- Inspect: `styles/*.css`
- Inspect: `tests/e2e/*.spec.mjs`

- [ ] Record every route, shared shell component, state surface, viewport, and quality criterion in the audit document.
- [ ] Run `npm test` and record the test count and result.
- [ ] Run static contract checks that do not launch a server: `npm run lint`, `npm run typecheck`, and `npm run test:browser`.
- [ ] Inspect rendered-structure contracts for landmarks, headings, labels, keyboard actions, responsive rules, and contrast tokens.
- [ ] Classify each confirmed finding as critical, high, medium, or low and identify its root cause.
- [ ] Commit the baseline audit and approved design documents.

### Task 2: Correct shared shell and navigation defects

**Files:**
- Modify: `src/ui/App.tsx`
- Modify: `src/ui/components/TopNav.tsx`
- Modify: `src/ui/components/SiteFooter.tsx`
- Modify: `styles/base.css`
- Modify: `styles/components.css`
- Modify: `styles/surfaces.css`
- Test: `tests/browser-contract.test.mjs`
- Test: `tests/e2e/control-atlas-shell.spec.mjs`
- Test: `tests/e2e/accessibility.spec.mjs`

- [ ] Write one failing regression test per confirmed shell defect.
- [ ] Run each focused test and confirm it fails for the expected reason.
- [ ] Correct navigation semantics, focus behavior, responsive overflow, search affordances, footer routing, and shared contrast defects.
- [ ] Re-run focused tests and confirm they pass.
- [ ] Commit the shared-shell remediation.

### Task 3: Correct route-level hierarchy, copy, and interaction defects

**Files:**
- Modify as required: `src/ui/pages/*.tsx`
- Modify as required: `src/ui/components/*.tsx`
- Modify as required: `src/ui/lib/pagePrimitives.tsx`
- Modify as required: `styles/surfaces.css`
- Test: `tests/content-review.test.mjs`
- Test: `tests/a11y-contract.test.mjs`
- Test: `tests/e2e/critical-path-matrix.spec.mjs`
- Test: route-specific files under `tests/e2e/`

- [ ] For each confirmed route defect, add the smallest failing test that demonstrates the broken requirement.
- [ ] Verify each test fails before implementation.
- [ ] Correct page purpose, hierarchy, next actions, disclosure order, labels, control names, and responsive behavior.
- [ ] Verify focused tests after each route family.
- [ ] Commit route-level remediation in coherent slices.

### Task 4: Verify responsive, accessibility, and resilience behavior

**Files:**
- Modify: `tests/e2e/accessibility.spec.mjs`
- Modify or create: `tests/e2e/frontend-responsive.spec.mjs`
- Modify: `tests/e2e/load-resilience.spec.mjs`
- Modify: `docs/audits/frontend-full-review-2026-06-22.md`

- [ ] Add route coverage at representative desktop, tablet, and mobile viewports.
- [ ] Assert there is no unintended document-level horizontal overflow.
- [ ] Assert primary actions remain reachable and named.
- [ ] Run axe checks for every shipped route and major expanded state.
- [ ] Verify keyboard access, reduced motion, loading, partial-data, error, empty, and retired-query states.
- [ ] Update the audit with evidence and resolution status.
- [ ] Commit verification coverage and audit results.

### Task 5: Close documentation and run the ship gate

**Files:**
- Modify: `docs/Plan.md`
- Modify: `docs/context.md`
- Modify: `docs/plans/prd-v3-alignment-backlog.md` only if an open PRD gap changes
- Modify: `docs/audits/frontend-full-review-2026-06-22.md`

- [ ] Review `git status` and `git diff --stat`; remove unrelated changes.
- [ ] Run `npm run precommit`.
- [ ] If the gate fails, stop, record the exact failure, investigate the root cause, and add regression coverage before fixing.
- [ ] Update delivery documentation with the verified remediation result.
- [ ] Re-run affected documentation and frontend checks.
- [ ] Commit the completed remediation.

### Task 6: Independent review and direct ship

**Files:**
- Review all files changed from `origin/main`.

- [ ] Request an independent code review against this design and plan.
- [ ] Resolve all critical and important findings with test-first changes.
- [ ] Re-run `npm run precommit`.
- [ ] Push `agent/muse/frontend-full-review`.
- [ ] Fast-forward merge to `main`.
- [ ] Re-run `npm run precommit` on merged `main`.
- [ ] Push `main` and wait for remote checks.
- [ ] Remove the temporary worktree and delete the merged feature branch.

