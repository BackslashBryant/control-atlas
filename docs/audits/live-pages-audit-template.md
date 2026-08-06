# Live Pages Audit Template

Copy this file to `docs/audits/live-browser-audit-YYYY-MM-DD-<scope>.md` for each public-shell release or epic closeout.

---

## Header

- **Title:** Live Browser Audit — [scope] — YYYY-MM-DD
- **Target URL:** `https://backslashbryant.github.io/control-atlas/`
- **Branch / commit:** `[branch]` at `[sha]`
- **Manual a11y checklist:** [link to completed `a11y-manual-checklist.md` row dates]

---

## Verification gates (automated)

| Gate | Command | Result |
| --- | --- | --- |
| Full ship gate | `npm run precommit` | |
| Dependency audit | `npm run audit:deps` | |
| Accessibility | `npm run test:a11y` | |
| End-to-end | `npm run test:e2e` | |
| Content review | `tests/content-review.test.mjs` (via `npm test`) | |

---

## Required manual checks

- [ ] Six primary nav destinations load: Start Here, Library, Compare, Patterns, Templates, Sources
- [ ] Start Here questionnaire produces Library, Compare, Patterns, and Templates recommendations
- [ ] AC-2 path: search `AC-2` → Account Management detail with plain-language sections
- [ ] Template Factory: generate one template; downloaded file includes disclaimer and source metadata
- [ ] Footer disclaimer visible on landing; **About & trust** opens full PRD disclaimer at `/?view=about`
- [ ] Mobile viewport 390×844: no layout overflow on nav, hero, About page, footer
- [ ] Manual a11y checklist completed — see [`a11y-manual-checklist.md`](a11y-manual-checklist.md)

---

## Passed (staged shell + live smoke)

- [Bullet findings from the audit session]

---

## Residual / deferred (documented, non-blocking)

- [Known gaps with owner or future epic reference]

---

## Assessment

[Ship / no-ship conclusion with tag or merge recommendation]
