# Control Atlas — External Evaluation Readiness

Date: 2026-08-02
Audit lead: Claude (this session), working from the "External Evaluation Readiness" epic
Mode: engineering readiness review — repo/deploy verification, personal live application walkthrough, internal practitioner workflow dry run, starter-document technical review, defect correction, and full automated verification. No market research, user studies, participant recruitment, or pricing was conducted, per the epic's explicit non-goals.
Repository baseline: `d532039` at session start. Shipped to `main` in two rounds this session — `e781eac` (first ship) and a second commit correcting two issues an external review of the first draft of this report caught (see "Second-round corrections" below). Both rounds went through the required `Public Repo Checks` gate (via a throwaway branch, since direct push to `main` is blocked without it) and were verified live via `Pages Live Smoke` before being called done.

## Readiness verdict

**Ready for external practitioner evaluation.**

This verdict reflects the corrected candidate, not the first draft. A review of this report's first draft correctly caught two problems worth recording:
1. The first draft evaluated a local candidate while claiming a deployed commit that didn't yet include the session's fixes — resolved by actually shipping (commit → `Public Repo Checks` → push → deploy → `Pages Live Smoke` verification) before finalizing this verdict, not by softening the claim.
2. The first draft classified all 12 starter documents "Ready" while separately listing a full content re-grade as an unperformed gap — an internal contradiction. Resolved by actually reading real document body content (not just structural validity) before finalizing — see `docs/audits/control-atlas-starter-document-technical-review.md`.

A third issue — the "Control Atlas structure" badge not rendering on the Explore-embedded record view even though the underlying data was correct — was investigated and found to be a real, fixable component bug (not a data-generation gap as first assumed), fixed, and given a regression test proven to fail before the fix and pass after. See "Second-round corrections" below for full detail on all three.

Justification for the verdict: the one Critical defect found (Explore-area navigation silently stuck on back/forward and shared links) is fixed and verified against its exact original reproduction. The organizing-structure badge bug is fixed and regression-tested. All four High-severity a11y findings (missing `<h1>` on four error states) are fixed. The full verification suite — lint, typecheck, the complete unit/data/runtime/graph test suite, the complete Playwright e2e suite, the accessibility suite, the visual regression suite, and `npm run precommit` — all pass clean as of the end of this session, re-run after the second round of fixes. All 12 starter documents load without structural defects, now carry the epic-required pre-launch review notice, and had their actual content (not just structure) spot-checked on the three documents most exposed to the recent full-record-ingestion risk. All 12 practitioner-protocol tasks pass, corroborated by both a manual dry run and the existing automated `v1-practitioner-workflows.spec.mjs` suite. The live deployed site is verified to match the final shipped commit, not an earlier baseline.

This verdict does not claim the product is finished or perfect — see Residual risks below for what remains genuinely open, including a substantial (owner-directed, four-round) rework of the Explore record view that exceeded the epic's original "fix defects only" scope at the owner's explicit direction, and one deferred, bounded follow-on within that same area.

## Second-round corrections (after external review of the first draft)

- **Deploy/candidate mismatch (resolved by shipping, not by claim-softening).** The first draft was written before the session's changes were committed, so "the deployed site matches source" was true only of the *starting* baseline, not the reviewed candidate. Fixed by actually shipping: committed, pushed a throwaway branch to satisfy the required `Public Repo Checks` status (this repo's branch protection rejects direct pushes to `main` without it), fast-forwarded `main` once that check passed, deleted the throwaway branch, and confirmed via `gh run list` that `GitHub Pages` deployed and `Pages Live Smoke` passed against the new commit.
- **Organizing-structure badge — real bug, not a data gap (found, fixed, regression-tested).** The first draft's residual-risk list attributed the missing badge to `attachAncestorPaths` in the build pipeline. Re-investigated: the generated data was actually correct (`atlas:TRUNK` and `atlas:LIMB-COMPLIANCE` both carry `origin: "organizing"` in the shard JSON). The real bug was in `AtlasMapPage.tsx`, which built the rail's `links` prop from `record.structural_path` and hardcoded every hop's `origin` to `"structural"` — silently overwriting the correct value for the two organizing hops. `ObjectDetailPage.tsx`'s direct record view never had this bug (it doesn't override origin), which is why the badge worked there but not on the Explore-embedded view of the identical record. Fixed in `src/ui/lib/runtimeLoader.ts` (derives real origin from `node_type` when building `structural_path`, instead of dropping it) and `src/ui/pages/AtlasMapPage.tsx` (stopped hardcoding). Added `tests/e2e/atlas-map-focused-control.spec.mjs`'s "focused Path badges the organizing hops, not just the direct record page" — proven to fail against the pre-fix code (`git stash` the two files, run the one test, confirm red) and pass after restoring the fix (confirmed green), per this repo's regression-test-must-be-proven doctrine.
- **Badge copy simplified.** While re-verifying the fix live, the newly-visible "ATLAS STRUCTURE" badge itself was flagged as unclear on its own (a bare two-word uppercase badge doesn't explain what it means without hovering for the tooltip, which doesn't work on touch devices at all). Changed the visible badge text from "Atlas structure" to "Not from the publisher" in `WhereThisSitsRail.tsx` — states the fact plainly instead of naming an internal concept the reader has no reason to already know.
- **Starter-document classification contradiction resolved.** See the Document classifications section below and `docs/audits/control-atlas-starter-document-technical-review.md`'s "Focused content review" section for what was actually read and why the "Ready" verdict now holds without caveat.

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
| CA-TRUST-104 | High | The "not from the publisher" organizing-structure badge — the central mechanism for distinguishing Control Atlas's own grouping from publisher-declared hierarchy, called out in `docs/tree-model.md` as load-bearing — never rendered on the Explore-embedded record view (`AtlasMapPage.tsx`), only on the direct `/record/...` page, even for the identical record with identical (correct) underlying data. `AtlasMapPage.tsx` was hardcoding `origin: "structural"` for every hop in the rail, silently discarding the real organizing/structural distinction. | Fixed in `runtimeLoader.ts` (derives real origin from `node_type`) and `AtlasMapPage.tsx` (stopped hardcoding); regression test added and proven red→green |

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

Run twice this session — once before shipping round one (`e781eac`), and again after the second-round corrections above (organizing-badge fix, badge copy, document content review) — both times clean at the end:

| Command | Round 1 result | Round 2 result (final) |
|---|---|---|
| `npm run build:site` | Clean | Clean |
| `npm run lint` (`--max-warnings=0`) | Clean, 0 warnings | Clean, 0 warnings |
| `npm run typecheck` | Clean | Clean |
| `npm test` (data + runtime + graph, 348 tests across 4 suites) | 348/348 pass | 348/348 pass |
| `npx playwright test --config playwright.e2e.config.mjs` (full suite) | 141/141 pass, 1 skipped (live-only) | 142/142 pass, 1 skipped (live-only) |
| `npx playwright test --config playwright.a11y.config.mjs` (32 tests) | 32/32 pass | 32/32 pass |
| `npx playwright test --config playwright.visual.config.mjs` (28 tests) | 6 failed first run (Map/Path/Documents areas reworked), diffs inspected, baselines refreshed, re-run 28/28 clean | 4 more failed first run (Path + record-detail pages, from the badge-copy change), diffs inspected, baselines refreshed, re-run 28/28 clean |
| `npm run precommit` | Clean, exit 0 | Clean, exit 0 |

One test regression was caused and fixed, not weakened, in round 1: `tests/content-review.test.mjs`'s site-wide copy-ban check failed because my own code *comments* (never user-facing text) in three files used the phrase "family tree", which this repo already bans site-wide from a prior, unrelated decision. Reworded the comments; the check now passes for the right reason. `tests/e2e/atlas-map-focused-control.spec.mjs`'s "focused Map..." test was rewritten (not deleted or loosened) to assert the new, intentional round-4 behavior in place of assertions that targeted removed elements. Round 2 added one new test to the same file ("focused Path badges the organizing hops, not just the direct record page"), proven to fail against the pre-fix code and pass after, per this repo's regression-test doctrine.

`tests/e2e/live-smoke.spec.mjs` was not run — no Home copy, initial HTML, metadata, or pre-hydration content changed this session (the changes were scoped to the Explore/record view, document generation, and a handful of a11y-heading fixes). `Pages Live Smoke` (the deployed-site equivalent, run automatically by CI on every push to `main`) passed on both shipped commits.

## Workflow dry-run results

12/12 practitioner protocol tasks pass, both manually and via the existing `v1-practitioner-workflows.spec.mjs` automated suite (12/12). Full per-task account: `docs/audits/control-atlas-practitioner-workflow-dry-run.md`.

## Document classifications

All 12 registered starter documents: **Ready for external practitioner evaluation** (none requires hiding, removal, or further correction before evaluation). This verdict now rests on both structural verification (all 12 load cleanly, no formula errors, correct source citations) and a focused content read of real body text on the three documents most exposed to the recent full-record-ingestion risk (Implementation Statement Worksheet, Evidence Expectation Matrix, Security Plan Starter) — not structural validity alone. Full per-document technical detail and the content-review account: `docs/audits/control-atlas-starter-document-technical-review.md`. The epic-required pre-launch review notice has been added to both the Documents collection page and every generated file (Word and Excel).

## Pages and viewports personally inspected

Full list in `docs/audits/control-atlas-live-application-review.md`. Summary: Home, Search (three query types), Start Here, Explore overview and all 9 areas, Catalog hub and detail, three representative record types (control, CCI, D3FEND countermeasure) plus their Path/Map/List views, Compare (configured), Learn, Build/Tasks/Documents (including the generation form end to end), Resources, Sources, About, and five distinct error/empty states — at 1440×900, with mobile (390×844) spot-checks on the highest-traffic pages.

## Work that still requires real practitioners, human accessibility testing, legal review, or owner action

- **Human assistive-technology testing** (NVDA, VoiceOver, TalkBack) and **real-device testing** (iOS/Android hardware, WebPageTest) were not performed — this is a long-standing, explicitly accepted residual in `docs/PRODUCTION_READINESS.md`, not new to this session. Automated axe-core checks (32/32 passing) catch a different, narrower class of issue than a real assistive-technology session.
- **Actual external practitioner evaluation sessions** per `docs/research/control-atlas-v1-practitioner-validation-protocol-2026-07-28.md` — this epic explicitly does not conduct those; it only confirms the application can technically support the tasks that protocol defines.
- **Penetration testing** was not performed this session (also a long-standing accepted residual).
- **A full manual re-grade of all 12 starter documents against the entire 2026-07-16 professionalism rubric** (every criterion, all 12 documents) was not performed — a *targeted* content spot-check on the three highest-risk documents was (see Document classifications above and the technical review's "Focused content review" section), which resolves the specific risk this epic flagged. A full rubric re-application remains reasonable optional future work, not a blocker.
- **A decision on the deferred radial/concentric-lane graph layout** (see above) — a real, owner-flagged follow-on, not attempted this session. Explicitly not a blocker: the round-4 rework already removes the diagram from the default path, and the owner directed that the five practitioner sessions inform whether this is worth building at all before more time goes into it.
- **A design conversation about the color palette**, if the owner wants to revisit it — investigated during this session and found to be a deliberate, previously-locked design decision (not a defect: 155 real tokens, text contrast measured 5.4–13.75:1, comfortably above WCAG AA), not something this audit changed or recommends changing unilaterally.

All items from the first draft that were genuine blockers (deploy/candidate mismatch, the document-classification contradiction, the organizing-badge bug) are resolved above, not merely re-labeled as residual.
