# Frontend Overhaul Corrections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the twelve approved frontend corrections, verify their acceptance criteria, and ship the result to `main`.

**Architecture:** Preserve the existing `HashRouter` plus typed view-state navigation in `App.tsx`. Consolidate shared presentation through `pagePrimitives.tsx`, keep `.primary` and `.secondary` as the button contract, and limit styling changes to the named tokens and surface classes.

**Tech Stack:** React 19, TypeScript, Vite, CSS custom properties, Node test runner, Playwright.

---

### Task 1: Repair shared shell navigation and remove dead routing

**Files:**
- Modify: `src/ui/components/SiteFooter.tsx`
- Modify: `src/ui/App.tsx`
- Delete: `src/ui/AppRoutes.tsx`
- Modify: `styles/surfaces.css`

- [ ] Replace footer router links with typed `onNavigate` buttons.
- [ ] Pass the existing `navigate` function into `SiteFooter`.
- [ ] Implement the responsive three-column footer.
- [ ] Delete the unused route metadata file and confirm no imports remain.

### Task 2: Normalize hero, card, token, and button presentation

**Files:**
- Modify: `src/ui/pages/HomePage.tsx`
- Modify: `src/ui/components/ObjectCard.tsx`
- Modify: `styles/tokens.css`
- Modify: `styles/components.css`
- Modify: `styles/surfaces.css`

- [ ] Remove the obsolete hero-tagline class and redundant `ca-btn` classes.
- [ ] Add the missing hero, detail, warning, object-card, and panel styles.
- [ ] Replace the four surface hex literals with semantic tokens.
- [ ] Move object IDs into the card header and reduce list-card action emphasis.

### Task 3: Add guided Start Here progression

**Files:**
- Modify: `src/ui/pages/StartHerePage.tsx`
- Modify: `src/ui/lib/pagePrimitives.tsx`
- Modify: `styles/surfaces.css`

- [ ] Derive and render the active three-step progression.
- [ ] Add `disabled` support to the shared select primitive.
- [ ] Gate fields two and three behind preceding answers.
- [ ] Add accessible disabled and step-state styling.

### Task 4: Improve template copy and deduplicate Explore primitives

**Files:**
- Modify: `src/ui/pages/TemplatesPage.tsx`
- Modify: `src/ui/pages/ExplorePage.tsx`

- [ ] Translate template format and input slugs into display labels.
- [ ] Surface the shared product disclaimer above generation actions.
- [ ] Replace Explore-local primitives and helpers with shared imports.

### Task 5: Align delivery status

**Files:**
- Modify: `docs/Plan.md`
- Modify: `docs/context.md`
- Modify: `docs/plans/prd-v3-alignment-backlog.md`

- [ ] Remove the obsolete `AppRoutes.tsx` residual.
- [ ] Record the frontend correction pass without changing epic scope.

### Task 6: Verify and ship

- [ ] Run targeted source searches for removed classes, files, local duplicates, and hardcoded surface colors.
- [ ] Run `npm run precommit`.
- [ ] Validate footer navigation, hero colors, Start Here sequencing, template labels, and 375px panel padding in the browser.
- [ ] Review `git status` and `git diff --stat`.
- [ ] Commit, push the feature branch, fast-forward `main`, rerun `npm run precommit`, push `main`, wait for remote checks, and clean up the temporary worktree.
