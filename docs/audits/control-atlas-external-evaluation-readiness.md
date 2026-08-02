# Control Atlas — External Evaluation Readiness

Date: 2026-08-02
Audit lead: Claude (this session), working from the "External Evaluation Readiness" epic
Mode: engineering readiness review — repo/deploy verification, personal live application walkthrough, internal practitioner workflow dry run, starter-document technical review, defect correction, and full automated verification. No market research, user studies, participant recruitment, or pricing was conducted, per the epic's explicit non-goals.
Repository baseline: `d532039` at session start; this session's fixes are uncommitted at the time of writing (see `docs/STATE.md` session 19 for the exact file list and a per-round narrative).

## Readiness verdict

**Ready for external practitioner evaluation.**

Justification: the one Critical defect found (Explore-area navigation silently stuck on back/forward and shared links) is fixed and verified against its exact original reproduction. All four High-severity findings (missing `<h1>` on four error states) are fixed. The full verification suite — lint, typecheck, the complete unit/data/runtime/graph test suite, the complete Playwright e2e suite, the accessibility suite, the visual regression suite, and `npm run precommit` — all pass clean as of the end of this session. All 12 starter documents load without structural defects and now carry the epic-required pre-launch review notice. All 12 practitioner-protocol tasks pass, corroborated by both a manual dry run and the existing automated `v1-practitioner-workflows.spec.mjs` suite. Deploy state matches source exactly, with no drift.

This verdict does not claim the product is finished or perfect — see Residual risks below for what remains genuinely open, including a substantial (owner-directed, four-round) rework of the Explore record view that exceeded the epic's original "fix defects only" scope at the owner's explicit direction, and one deferred, bounded follow-on within that same area.

## Repository and deployment state

| Item | Value |
|---|---|
| Local `main` at session start | `d532039`, clean, matched `origin/main` |
| Deployed GitHub Pages site vs local build | Byte-identical (same `RUNTIME_CACHE_VERSION` `20260729-1`, same main JS bundle hash, same meta tags) |
| Generated data at session start | 51 sources, 11,691 nodes, 28,491 edges, 0 inferred-candidate edges, 11 graph-health findings (pre-existing, not newly introduced) |
| Working tree at end of session | Uncommitted, consistent (every change typechecked, linted, and test-verified); not pushed |
| Files changed this session | `docs/STATE.md`; `src/ui/App.tsx`; `src/ui/pages/AtlasMapPage.tsx`; `src/ui/pages/ObjectDetailPage.tsx`; `src/ui/components/AtlasConnectionMap.tsx`; `src/ui/components/RelationshipGraph.tsx`; `src/ui/lib/graphTheme.ts`; `src/shared/disclaimer.mjs`; `src/app/office-export.mjs`; `src/app/template-engine.mjs`; `src/ui/pages/TemplatesPage.tsx`; `styles/tokens.css`; `styles/surfaces.css`; `tests/e2e/atlas-map-focused-control.spec.mjs`; four new `docs/audits/*.md` files |

## Critical and High findings

| ID | Severity | Finding | Status |
|---|---|---|---|
| CA-EXP-101 | Critical | Explore area navigation (`AtlasMapPage.tsx`'s `AtlasGuidedPath`) never re-synced its local `openLimbId` state to the URL after first mount, so browser back/forward, direct navigation to a different area's link, or a fresh page load with a non-default area param all showed the *previous* area while the URL/title had already updated. | Fixed, verified against the exact original repro (direct nav, hashchange event, browser back) |
| CA-A11Y-102 | High | Four full-page notice states (`not-found`, `retired`, `Item not found`, `Record metadata unavailable`) rendered `<h2>` as their only heading — no `<h1>` for a screen-reader user to land on. | Fixed (bumped to `<h1>`, matching the existing correct convention in `CatalogDetailPage.tsx`) |
| CA-CPY-103 | Low/copy | "Structural position" eyebrow used internal-sounding phrasing; my own first fix ("Control Atlas structure") then overclaimed the *entire* breadcrumb as Control-Atlas-organized structure, contradicting `WhereThisSitsRail.tsx`'s existing correct per-crumb badging. | Fixed (now "Hierarchy"); self-caught and corrected within the same session, logged as a regression I introduced and reversed |

No other Critical or High defects were found in the areas personally inspected this session (see `docs/audits/control-atlas-live-application-review.md` for full route/viewport coverage).

## Owner-directed Map/Explore-record rework (beyond "fix defects only")

During live review, the owner directed a substantial rework of the Explore per-record Path/Map/List view across four rounds of increasingly specific feedback, explicitly overriding the epic's "fix Critical/High defects only" scope for this one surface. Summarized (full detail, quoted feedback, and file-level diffs in `docs/STATE.md` session 19):

1. Separated structural children (enhancements) from correlation/applicability data — previously mixed in one small diagram.
2. Fixed the diagram's default zoom (was 0.4x, forced to a 1.0x floor — a verified 2.5x increase), reduced canvas height, narrowed/stickied the inspector panel, hid the redundant node-shortcut strip on small graphs (kept accessible, not removed), gave the relationship-group controls real button styling.
3. Added relationship-class color coding to nodes and edges (using an existing `graphRole` prop that no caller had ever populated), added a legend, regrouped controls by relationship class, corrected the breadcrumb mislabeling from round 1.
4. Replaced the diagram-as-default entirely: the default view is now relationship-type summary cards with counts, opening into that type's own record list; the node-link diagram is an explicit, opt-in "View as graph" secondary view.

**This is real, substantial, verified work — not a defect fix — done because the owner asked for it directly and repeatedly during the review, not because the epic required it.** It is called out this prominently so it is not mistaken for either (a) a small polish pass or (b) something quietly out of scope that got done anyway without acknowledgment.

**Deferred, not built:** the owner's fuller ask for a true radial/concentric relationship-class-lane layout for the diagram itself (their explicit ASCII mockup). Round 4's redesign addresses the practical substance of this (the diagram is no longer the default, and only ever shows one relationship class at a time), but the *optional* diagram, when opened, is still an ELK "mrtree" layout, not a true radial layout with the record forced to the geometric center. This is a bounded, real, not-yet-attempted follow-on.

## Verification results

All run this session, in this order, against the final state of the code:

| Command | Result |
|---|---|
| `npm run build:site` | Clean (repeated after every edit round) |
| `npm run lint` (`--max-warnings=0`) | Clean, 0 warnings |
| `npm run typecheck` | Clean |
| `npm test` (data + runtime + graph, 348 tests across 4 suites) | 348/348 pass |
| `npx playwright test --config playwright.e2e.config.mjs` (full suite, 142 tests) | 141/141 pass, 1 skipped (live-only, not applicable locally) |
| `npx playwright test --config playwright.a11y.config.mjs` (32 tests) | 32/32 pass, including "focused Atlas Map has no serious or critical violations" |
| `npx playwright test --config playwright.visual.config.mjs` (28 tests) | 6 failed on first run (all in the areas intentionally reworked above — Map, Path, Documents), diffs personally inspected and confirmed as the intended changes, baselines refreshed, re-run 28/28 clean |
| `npm run precommit` (build, lint, typecheck, test, test:browser, dom-smoke, verify:public [data-size, static-smoke, audit-coverage], a11y:smoke, e2e:smoke) | Clean, exit 0 |

One test regression was caused and fixed, not weakened: `tests/content-review.test.mjs`'s site-wide copy-ban check failed because my own code *comments* (never user-facing text) in three files used the phrase "family tree", which this repo already bans site-wide from a prior, unrelated decision. Reworded the comments; the check now passes for the right reason. `tests/e2e/atlas-map-focused-control.spec.mjs`'s "focused Map..." test was rewritten (not deleted or loosened) to assert the new, intentional round-4 behavior in place of assertions that targeted removed elements.

`tests/e2e/live-smoke.spec.mjs` was not run — no Home copy, initial HTML, metadata, or pre-hydration content changed this session (the changes were scoped to the Explore/record view, document generation, and a handful of a11y-heading fixes).

## Workflow dry-run results

12/12 practitioner protocol tasks pass, both manually and via the existing `v1-practitioner-workflows.spec.mjs` automated suite (12/12). Full per-task account: `docs/audits/control-atlas-practitioner-workflow-dry-run.md`.

## Document classifications

All 12 registered starter documents: **Ready for external practitioner evaluation** (none requires hiding, removal, or further correction before evaluation). Full per-document technical detail: `docs/audits/control-atlas-starter-document-technical-review.md`. The epic-required pre-launch review notice has been added to both the Documents collection page and every generated file (Word and Excel).

## Pages and viewports personally inspected

Full list in `docs/audits/control-atlas-live-application-review.md`. Summary: Home, Search (three query types), Start Here, Explore overview and all 9 areas, Catalog hub and detail, three representative record types (control, CCI, D3FEND countermeasure) plus their Path/Map/List views, Compare (configured), Learn, Build/Tasks/Documents (including the generation form end to end), Resources, Sources, About, and five distinct error/empty states — at 1440×900, with mobile (390×844) spot-checks on the highest-traffic pages.

## Work that still requires real practitioners, human accessibility testing, legal review, or owner action

- **Human assistive-technology testing** (NVDA, VoiceOver, TalkBack) and **real-device testing** (iOS/Android hardware, WebPageTest) were not performed — this is a long-standing, explicitly accepted residual in `docs/PRODUCTION_READINESS.md`, not new to this session. Automated axe-core checks (32/32 passing) catch a different, narrower class of issue than a real assistive-technology session.
- **Actual external practitioner evaluation sessions** per `docs/research/control-atlas-v1-practitioner-validation-protocol-2026-07-28.md` — this epic explicitly does not conduct those; it only confirms the application can technically support the tasks that protocol defines.
- **Penetration testing** was not performed this session (also a long-standing accepted residual).
- **A full manual re-grade of all 12 starter documents against the 2026-07-16 professionalism rubric**, specifically re-checking whether the 2026-08-02 full-record content ingestion (Discussion text, SP 800-53A evidence) changed anything the worksheets pull from those records — this session confirmed structural integrity and the new notice, not a cell-by-cell re-grade against that older rubric.
- **A decision on the deferred radial/concentric-lane graph layout** (see above) — a real, owner-flagged follow-on, not attempted this session.
- **A data-generation fix** for `AC-2`'s (and potentially other records') `ancestor_path` not carrying an `origin: "organizing"` tag on any link, which means the correctly-built per-crumb "Control Atlas structure" badge in `WhereThisSitsRail.tsx` never actually renders for at least this record. Pre-existing, not introduced this session, and out of scope for this pass (`scripts/build-framework-data.mjs`).
- **A design conversation about the color palette**, if the owner wants to revisit it — investigated during this session and found to be a deliberate, previously-locked design decision (not a defect: 155 real tokens, text contrast measured 5.4–13.75:1, comfortably above WCAG AA), not something this audit changed or recommends changing unilaterally.
- **Owner review and commit/push decision** — this epic explicitly prohibits push/merge/deploy/tag/publish. The worktree is left clean, tested, and uncommitted, ready for the owner's own commit and shipping decision.
