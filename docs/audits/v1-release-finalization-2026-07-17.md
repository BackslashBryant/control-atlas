# Control Atlas v1.0 release-finalization audit

**Date:** July 17, 2026  
**Verified commit:** `b64928cbe5797ca7d75a1bdf99e9f1324ecc8686`  
**Live URL:** <https://backslashbryant.github.io/control-atlas/>  
**Code/deployment decision:** **GO**  
**`v1.0.0` publication decision:** **HOLD — explicit owner approval still required**

## Reconciled release polish

The uncommitted Muse source-polish work was preserved, rebased from `5f7a76b` onto the strengthened `743dcde` baseline, completed, and verified before shipping. It does not change sources, graph edges, evidence, importers, the static architecture, or the public-data-only boundary.

- Removed the repeated green `Used in map: Yes` and warning `Used in map: No` badges.
- Replaced the legacy per-catalog coverage scoreboard, traffic-light bars, and repeated preview labels with a factual connection inventory.
- The inventory accounts for all 11,486 records across seven practical categories and counts 16,207 published links. Candidate links are excluded; no relationship is inferred.
- Each category reports records loaded, records participating in at least one published connection, published incident links, and the other practical categories it connects to.
- Desktop and 375×667 layouts were visually inspected. Both have exact viewport/document-width parity and no horizontal overflow.

## Evidence boundaries

| Evidence | Result | Boundary |
| --- | --- | --- |
| Local Windows `npm run precommit` | Pass in 456.5 seconds: build, lint, typecheck, 699-package license review, Vale, 195 data assertions, runtime/graph/browser/public checks, 22 accessibility tests, 107 functional passes, 1 intentional skip | Local development host only |
| Ubuntu Public Repo Checks | Pass on branch run [29619419633](https://github.com/BackslashBryant/control-atlas/actions/runs/29619419633) and main run [29619754878](https://github.com/BackslashBryant/control-atlas/actions/runs/29619754878) | CI, not local or real-device evidence |
| CodeQL | Pass on main run [29619754895](https://github.com/BackslashBryant/control-atlas/actions/runs/29619754895) | Static analysis only |
| Secret Scan | Pass on branch run [29619419606](https://github.com/BackslashBryant/control-atlas/actions/runs/29619419606) and main run [29619754990](https://github.com/BackslashBryant/control-atlas/actions/runs/29619754990) | Repository secret scan only |
| GitHub Pages | Pass on exact-SHA workflow run [29620043980](https://github.com/BackslashBryant/control-atlas/actions/runs/29620043980) | Deployment evidence |
| Pages Live Smoke | Pass on run [29620079489](https://github.com/BackslashBryant/control-atlas/actions/runs/29620079489) | Deployed public-site smoke only |
| Deployed Playwright replay | 28/28 passed against the public URL in 2.3 minutes | Automated desktop/tablet/mobile emulation; not real hardware |
| Deployed Sources check | Desktop 1440×1000 and compact 375×667 passed exact count, removed-copy, and overflow checks | Automated Chromium emulation |
| Human screen reader | Unverified | Requires NVDA, VoiceOver, or TalkBack with a human operator |
| Real iOS/Android device | Unverified | No hardware evidence was available |

## Deployed focused-Atlas Lighthouse

Three Lighthouse 12.6.1 mobile synthetic runs measured the deployed AC-2 Map route. The final screenshot was inspected and shows the focused Atlas route. Lighthouse reports the main document URL without the client-side hash, while `requestedUrl` retains `#/atlas-map?node=nist-800-53%3AAC-2&relationshipView=map`.

| Run | Performance | Accessibility | FCP | LCP | TBT | CLS | TTI |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 60 | 100 | 1.77 s | 5.68 s | 0.53 s | 0.102 | 5.68 s |
| 2 | 57 | 100 | 1.78 s | 5.68 s | 0.67 s | 0.102 | 5.68 s |
| 3 | 54 | 100 | 1.79 s | 5.73 s | 0.82 s | 0.102 | 5.73 s |

The prior deployed baseline used Lighthouse 12.8.2 and scored Performance 12, Accessibility 100, LCP 17.24 s, TBT 5.42 s, CLS 1.45, and TTI 20.93 s. The final implementation materially improves every recorded performance metric. This is synthetic evidence, not field data or a real-device result. No numeric blocking budget was actually recorded before finalization, so this audit records the run as completed report-only evidence rather than inventing a retroactive pass threshold.

## Remaining release decision

There is no remaining code, CI, Pages, automated accessibility, responsive-emulation, or deployed Lighthouse blocker in this sprint. Before publishing `v1.0.0`, the owner must:

1. explicitly accept or defer the unverified human screen-reader and real-device residuals; and
2. explicitly approve creation and publication of the final `v1.0.0` tag/release.

The Node 20 action-runtime deprecation annotations, the transitive `uuid` constraint under `@lhci/cli@0.15.1`, and `npm ci || npm install` fallbacks remain separate maintenance debt. No speculative dependency or workflow upgrade was mixed into final release polish.
