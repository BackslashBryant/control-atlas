# Control Atlas Backlog: PRD v3.0 Alignment

Open gaps only. Shipped epics are summarized in [`docs/Plan.md`](../Plan.md).

**Last synced:** July 28, 2026 (2026 correction Epics 1-7 local implementation
complete; deployed verification and remote publication remain separately owner-gated)

## 2026 correction program

Structural truth, navigation, Resources, progressive disclosure, source-first
records, responsive/accessibility implementation, and Epic 7's local semantic
regression/compatibility preparation are complete on local task branches. Epic
7 remains owner-gated in the
[`2026-07-27 correction backlog`](../planning/control-atlas-correction-backlog-2026-07-27.md)
for deployed-route, exact cache/commit, and compatibility-window proof. The
human NVDA/VoiceOver/TalkBack residual remains open.

## Release verification record

| ID | Gap | Owner | Status |
| --- | --- | --- | --- |
| V1-RR-003 | Atlas clarity, bounded rendering, mobile behavior, and focused-route performance | Pixel / Forge | Superseded by V1-RR-004 through V1-RR-010; final deployed Lighthouse and browser evidence recorded at `b64928c` |
| V1-RR-004 | Match the approved six-column decomposition view on desktop and vertical workflow on mobile | Muse / Forge | Shipped and protected by reviewed desktop/compact Ubuntu visual baselines |
| V1-RR-005 | Match the approved centered, connected, expandable Map and guidance inspector | Muse / Forge | Shipped and protected by reviewed desktop/compact Ubuntu visual baselines |
| V1-RR-006 | Replace empty-query search taxonomy dump with a calm starting state | Muse / Forge | Shipped and verified locally, in CI, and on deployed Pages |
| V1-RR-007 | Turn Templates default page into a progressive task workflow | Muse / Forge | Shipped and verified locally, in CI, and on deployed Pages |
| V1-RR-008 | Remove redundant trust/legal/copy boilerplate and restore specific action guidance | Muse | Shipped; final Sources polish replaces coverage scores and binary map badges with factual connection counts |
| V1-RR-009 | De-duplicate Playbooks and progressively orient heavy routes | Muse / Forge | Shipped and verified locally, in CI, and on deployed Pages |
| V1-RR-010 | Add structural visual contracts for the owner-approved compositions and density limits | Pixel | Shipped and protected by desktop/mobile/zoom/reduced-motion contracts plus reviewed Ubuntu baselines |

## Deferred (SPR Sprint E — not blocking)

| ID             | Gap                                                                                                    | Owner       | Notes                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| SPR-ENG-005    | Offline reload without network                                                                         | Maintenance | Expected static SPA behavior; service worker only if explicitly requested                                                                          |
| SPR-A11Y-001   | VoiceOver/NVDA/TalkBack hands-on sign-off                                                              | Human QA    | Automated axe on 14 routes + live smoke CI; manual checklist row 6 in [`docs/audits/a11y-manual-checklist.md`](../audits/a11y-manual-checklist.md) |
| SPR-UNVERIFIED | WebPageTest, real iOS/Android devices, pen-test | Maintenance / Human QA | External/human evidence; not satisfied by emulation. Lighthouse is now part of the active release gate. |

## Optional maintenance

### Post-v1 platform strengthening (shipped)

| Milestone | Status |
| --- | --- |
| Approved-layout regression protection | Four desktop/compact Map/Purpose baselines generated and visually reviewed in the pinned Ubuntu Playwright image; immediate comparison passed 4/4, and CI owns the same Ubuntu comparisons. |
| Performance regression evidence | Lighthouse CI report-only integration and 12 local reports complete; no blocking budgets |
| Copy and terminology debt | Focused Vale rules integrated after fixture and false-positive review |
| Technical-debt inventory | Knip classified; nine proven dead files plus redundant declarations/exports removed, legacy renderer queued separately |
| Independent OSCAL validation | Unique schema signal confirmed; monthly additive NIST CLI workflow implemented |

### Maintenance debt register (owner: Bryant; solo repo)

| Item | Consequence of leaving it | Trigger / deadline |
| --- | --- | --- |
| GitHub Actions Node 20-runtime deprecation annotations | Workflows fail when GitHub removes the Node 20 runtime | Before GitHub's announced Node 20 Actions runtime removal date; check on the first Dependabot review after an annotation escalates to a warning of removal |
| `npm ci \|\| npm install` fallbacks in workflows | Lockfile drift can pass CI silently | Next workflow-touching maintenance change |
| Deployed mobile Lighthouse performance gate | Performance regressions land undetected because tooling is report-only | Superseded 2026-07-19: the absolute `>= 50` floor was laptop-measured and does not reproduce on CI hardware (same code scores 34–44 there). Gate is now comparative — run the `Lighthouse A/B` workflow against the previous released ref on the same runner and require no material regression |
| Layout shift on slow hardware: `footer.site-footer` moves ~1.5 CLS as late content grows the page | Users on slow connections/devices see the page jump while it loads; the score penalty is severe | Pre-existing (identical in `743dcde` and `9f687d7`), exposed by CI measurement on 2026-07-19. Fix by reserving height for loading regions (skeleton/content height parity in `src/ui/App.tsx`, `LibrarySkeleton.tsx`, and the compact Atlas map block in `styles/surfaces.css`). Trigger: first post-v1 UX maintenance pass, before any accessibility-conformance claim |
| Route-state patch idiom still spreads `...state` in remaining page handlers | Redundant now that `navigate()` merges the latest state; rapid paired interactions elsewhere could revive the dropped-patch race | Next UI maintenance pass; sweep `onNavigate` callers to pass only changed keys |

- Promote `v1.0.0` after RC feedback
- Run the staged ingestion/search experiments in [`open-source-tool-assessment.md`](open-source-tool-assessment.md); no listed tool is approved as a v1.0 dependency
- Run the post-v1 UI/performance/copy/data strengthening sequence in [`open-source-platform-strengthening-assessment-2026-07-17.md`](open-source-platform-strengthening-assessment-2026-07-17.md), beginning with Playwright golden routes, Lighthouse CI, and a project-owned Vale style
- Dependabot PR review (Nexus)
- Source real crosswalks for DoD RAI, ATT&CK ICS, AI RMF, SSDF, SP 800-172, and remaining sparse catalogs; never infer them merely to raise coverage
- Documented upstream provenance for the 11 `graph-health.json` findings: 9 NIST OLIR CSF 2.0 draft crosswalk entries targeting family/category-level nodes (`CP`, `IR`, `PT`, `RC.RP`, `RS.MA`) and 2 DoD ZT overlay entries with invalid control IDs (`EC-1`, `SAC-16`). All 11 are safely blocked from displayable edges as designed.
