# Control Atlas Production Readiness

## Product Identity

- Public product name: **Control Atlas**
- Campaign line: **Ctrl+Alt+Comply**
- Tagline: **The public map for federal cyber compliance.**
- Supporting line: Open-source reference workbench for mapping controls, tracing frameworks, and generating blank RMF/ATO templates - no login, no evidence upload, no organizational data required.

## Current Status

Release candidate `v1.0.0-rc.1` remains the published release. The approved-composition Atlas rebuild, post-v1 platform strengthening, and reconciled source polish are on `main` at `b64928c` and deployed to GitHub Pages. The final full local gate passes with 195 data assertions, 22 accessibility tests, and 107 functional tests passed with 1 skipped. Public Repo Checks, CodeQL, Secret Scan, Pages, Pages Live Smoke, 28 deployed browser tests, and three focused deployed mobile Lighthouse runs have recorded evidence. Human screen-reader and real-device checks remain explicit residuals. Creating or publishing `v1.0.0` requires separate owner approval.

## Phase 0 Development Readiness

- [x] Canonical PRD adopted
- [x] Static GitHub Pages baseline retained
- [x] Public-data-only boundary documented
- [x] Historical GovFrame delivery records reframed as non-active guidance
- [x] Design-token implementation completed
- [x] Node and edge provenance extensions completed
- [x] Provenance renderer updates completed
- [x] Missing CI/CD and SecDevOps controls addressed or explicitly deferred
- [x] New Control Atlas live Pages audit completed

## Required Before MVP Release

- [x] Static GitHub Pages delivery with no backend or login
- [x] Public source registry and validated graph bundles
- [x] Search, browse, provenance, relationship comparison, and public-reference CSV export
- [x] Product boundary documented and enforced in runtime tests
- [x] Library, Crosswalk Workbench, Template Factory, Pattern Library, Start Here, and QA scope
- [x] Accessibility automation (axe per-route + contract tests) and keyboard smoke E2E
- [x] Content, disclaimer, source-license, and prohibited-claim review (`tests/content-review.test.mjs`)
- [x] Release candidate tag `v1.0.0-rc.1` with live audit evidence [`docs/audits/live-browser-audit-2026-06-19-epic-6.md`](audits/live-browser-audit-2026-06-19-epic-6.md)

## Public-shell release gate (Epic 7+)

- [x] Local `npm run precommit` passes after source-polish reconciliation (195 data assertions; 22 accessibility tests; 107 functional passed, 1 skipped)
- [x] Targeted desktop and mobile novice/expert Atlas workflows pass, including zero connections, bounded Map/inspector layout, and List fallback
- [x] Focused deployed Atlas mobile Lighthouse recorded in three runs and materially improves over the failed baseline; no numeric blocking threshold was previously established
- [x] Doctrine audit (July 18, 2026): a forward performance budget is now recorded — deployed focused-Atlas mobile Lighthouse Performance must stay at or above 50 (recorded release band: 54–60). Lighthouse tooling stays report-only; the floor is the comparison criterion for future runs, not a retroactive gate.
- [x] Keyboard, 200% equivalent reflow, responsive, and reduced-motion checks are recorded in the July 17 local evidence audit
- [ ] Human screen-reader and real-device gaps are either completed or explicitly accepted as residual risk
- [x] Live Pages audit is updated with post-deploy evidence at `b64928c`

## Historical Evidence

Dated files under `docs/audits/` remain historical evidence for prior GovFrame-era deployments. New runtime changes require new Control Atlas audit evidence rather than rewriting old records.

## Recommended Next Implementation Task

Await the owner's release decision. The code, CI, deployment, live browser replay, and deployed Lighthouse evidence are complete. The owner must explicitly accept or defer human screen-reader and real-device residuals and separately approve creation/publication of `v1.0.0`. Lighthouse remains report-only, Vale remains a focused copy-debt check, and NIST OSCAL validation remains a monthly additive cross-check.

## Post-v1 strengthening status

- [x] Four approved Atlas compositions compare against reviewed baselines generated in the pinned Ubuntu Playwright image
- [x] Post-v1 `npm run precommit` passes as one complete run after removing duplicate execution (22 accessibility tests; 105 functional passed, 1 skipped)
- [x] Lighthouse CI records three local synthetic runs for Landing, Explore, focused Atlas, and Templates without public upload or blocking budgets
- [x] Project-owned Vale rules pass focused fixtures and mounted React/public-doc copy with human review still authoritative
- [x] Knip inventory is classified; only proven dead UI/graph/D3 residue was removed and React Flow/ELK remain mounted
- [x] NIST OSCAL CLI independently rejects schema-invalid catalog/profile fixtures that current normalization accepts; monthly scheduled validation is additive

## Residual (non-blocking)

- Branch protection API verification pending authenticated `gh` session — policy documented in [`docs/audits/branch-protection-verification-2026-06-19.md`](audits/branch-protection-verification-2026-06-19.md)
- Action SHA pinning deferred per [`docs/adr/0012-defer-github-actions-sha-pinning.md`](adr/0012-defer-github-actions-sha-pinning.md)
- Hands-on NVDA/VoiceOver/TalkBack, real iOS/Android devices, WebPageTest, and pen-test require external/human evidence

## Runtime Boundary

Control Atlas remains static and public-data-only with no backend, authentication, user uploads, user, organization, or system data, scoring, operational integrations, or stored generated templates.
