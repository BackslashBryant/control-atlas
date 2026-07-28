# Epic 7 local regression and compatibility evidence

Date: 2026-07-28  
Scope: local task branch only; no Pages, device, or human assistive-technology verification

## Result boundary

Epic 7 prepares the correction release gate locally. It does not prove a
deployed commit, real-device behavior, human screen-reader use, cache state, or
compatibility-window traffic. No visual baseline was changed and no alias was
removed.

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

Local result: `test:correction:contracts` passed 54/54 assertions and
`test:correction:local` passed 28/28 Playwright checks. The browser run found
and corrected one pre-hash compatibility defect: the 404 redirect script's CSP
hash was stale. A browser contract now recalculates that hash before the
precommit gate can pass.

## Compatibility inventory

The 19 aliases in `COMPATIBILITY_ROUTE_ALIASES` remain intact: `/menu`,
`/home`, `/start-here`, `/atlas-map`, `/atlas`, `/map`, `/browse`,
`/compare-controls`, `/source`, `/library`, `/playbooks`, `/playbook`,
`/templates`, `/template`, `/build/community`, `/commons`,
`/resource-bazaar`, `/bazaar`, and `/hub`.

Owner: Control Atlas maintainers. Removal date: 2026-10-27. Removal condition:
the deployed deep-link smoke must remain green through that date. This branch
does not remove aliases or claim that condition is met.

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
   and legacy deep links, then save the closeout evidence.
4. Obtain human assistive-technology evidence and an owner decision before any
   alias removal.
