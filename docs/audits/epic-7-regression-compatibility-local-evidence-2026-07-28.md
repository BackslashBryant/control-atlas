# Epic 7 local regression and compatibility evidence

Date: 2026-07-28  
Scope: local task branch only; no Pages, device, or human assistive-technology verification

## Result boundary

Epic 7 prepares the correction release gate locally. It does not prove a
deployed commit, real-device behavior, human screen-reader use, cache state, or
compatibility-window traffic. No visual baseline was changed. Legacy route
aliases were retired locally by owner direction; that is not deployed proof.

## Critical/High semantic contract map

| Audit finding | Focused local contract |
| --- | --- |
| CA-IA-001 Explore/Search identity | `tests/graph/routeIdentity.test.ts` |
| CA-ATL-001 correlation as ancestry | `tests/graph/ancestorPath.test.ts` |
| CA-ATL-002 baseline as parent | `tests/graph/ancestorPath.test.ts` |
| CA-ATL-003 Atlas search no-op | `tests/graph/atlasSearch.test.ts` |
| CA-ATL-004 Atlas relationship conflation | `tests/graph/atlasModel.test.ts` |
| CA-ATL-005 single-catalog framework wizard | `tests/graph/atlasDrilldown.test.ts` |
| CA-RES-001 Resources identity | `tests/resources-directory.test.mjs`, `tests/graph/routeIdentity.test.ts` |
| CA-RES-002 hidden primary browse model | `tests/resources-directory.test.mjs` |
| CA-RES-003 recommendation-driven false positives | `tests/resources-directory.test.mjs` |
| CA-TEST-001 incomplete semantic gates | `npm run test:correction:contracts` |

`npm run test:correction:local` adds local browser coverage for source-first
records, canonical route/title behavior, Atlas workflows, and responsive
Compare/Resources behavior. It starts a local static test server only.

Local result: `test:correction:contracts` passed 55/55 assertions and
`test:correction:local` passed 28/28 Playwright checks. Alias retirement
removes the static 404 redirect script; browser and static-smoke contracts now
require the explicit not-found page and canonical recovery link instead.

## Alias retirement inventory

The 19 legacy aliases formerly in `COMPATIBILITY_ROUTE_ALIASES` are retired:
`/menu`, `/home`, `/start-here`, `/atlas-map`, `/atlas`, `/map`, `/browse`,
`/compare-controls`, `/source`, `/library`, `/playbooks`, `/playbook`,
`/templates`, `/template`, `/build/community`, `/commons`,
`/resource-bazaar`, `/bazaar`, and `/hub`. Legacy catalog/object/resource-detail
paths and query-bearing Explore links also no longer redirect into canonical
routes. They resolve to the app or static not-found state; they do not silently
transfer state to a different destination.

The pre-hash `?view=...` query-state adapter remains intact. It is a persisted
application-state format, not a legacy route alias.

## Intended visual and accessibility evidence

Existing changed-route visual baselines and the Epic 6 accessibility matrix are
preserved without bulk refresh. The required human NVDA, VoiceOver, or TalkBack
review remains pending in
[`a11y-manual-checklist.md`](a11y-manual-checklist.md); automated axe and local
Chromium checks do not satisfy it.

## Owner-gated deployment proof

After explicit authorization to push, merge, and deploy the reviewed commit:

1. Run `npm run test:e2e:live:smoke` and the four bounded route groups:
   `test:e2e:live:entry`, `test:e2e:live:catalog`, `test:e2e:live:build`, and
   `test:e2e:live:workbench`.
2. Run `npm run test:e2e:live:a11y` and record the saved first-failure
   artifacts if any group fails.
3. Verify the exact deployed commit/cache version plus representative canonical
   deep links and retired-alias static-404 behavior, then save the closeout
   evidence.
4. Obtain human assistive-technology evidence.
