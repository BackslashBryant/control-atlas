# Control Atlas Production Readiness

## Product Identity

- Public product name: **Control Atlas**
- Campaign line: **Ctrl+Alt+Comply**
- Tagline: **The public map for federal cyber compliance.**
- Supporting line: Open-source reference workbench for mapping controls, tracing frameworks, and generating blank RMF/ATO templates - no login, no evidence upload, no organizational data required.

## Current Status

Release candidate `v1.0.0-rc.1` remains the published release. The v1.0 release-readiness branch contains the landing/search remediation and approved-composition Atlas rebuild. Full local precommit passes, including 127 Playwright tests passed and 1 skipped. Push, merge, deployment, and post-deploy workflow/performance evidence remain owner-gated. Creating or publishing `v1.0.0` requires separate owner approval.

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

- [x] Local `npm run precommit` passes on the release-readiness branch (127 Playwright passed, 1 skipped)
- [x] Targeted desktop and mobile novice/expert Atlas workflows pass, including zero connections, bounded Map/inspector layout, and List fallback
- [ ] Focused Atlas mobile Lighthouse meets the recorded release threshold
- [x] Keyboard, 200% equivalent reflow, responsive, and reduced-motion checks are recorded in the July 17 local evidence audit
- [ ] Human screen-reader and real-device gaps are either completed or explicitly accepted as residual risk
- [ ] Live Pages audit is updated with post-deploy evidence

## Historical Evidence

Dated files under `docs/audits/` remain historical evidence for prior GovFrame-era deployments. New runtime changes require new Control Atlas audit evidence rather than rewriting old records.

## Recommended Next Implementation Task

Review the locally verified post-v1 branch and decide whether to authorize a push. Four approved Atlas compositions now compare against reviewed pinned-Ubuntu baselines, and the complete local precommit passes with 127 Playwright tests passed and 1 skipped. Lighthouse CI remains report-only, Vale remains a focused copy-debt check, and NIST OSCAL validation remains a monthly additive cross-check. Do not merge, deploy, tag, or publish the v1.0 release artifact without owner approval.

## Post-v1 strengthening status

- [x] Four approved Atlas compositions compare against reviewed baselines generated in the pinned Ubuntu Playwright image
- [x] Post-v1 `npm run precommit` passes as one complete run (127 Playwright passed, 1 skipped)
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
