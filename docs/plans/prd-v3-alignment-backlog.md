# Control Atlas Backlog: PRD v3.0 Alignment

Open gaps only. Shipped epics are summarized in [`docs/Plan.md`](../Plan.md).

**Last synced:** July 17, 2026 (approved-comp recovery in progress)

## Active release gate

| ID | Gap | Owner | Status |
| --- | --- | --- | --- |
| V1-RR-003 | Atlas clarity, bounded rendering, mobile behavior, and focused-route performance | Pixel / Forge | Performance/data architecture shipped at `94ab460`, but product approval was revoked after live visual review. Superseded by V1-RR-004 through V1-RR-010. |
| V1-RR-004 | Match the approved six-column decomposition view on desktop and vertical workflow on mobile | Muse / Forge | Implemented and locally verified — owner review pending |
| V1-RR-005 | Match the approved centered, connected, expandable Map and guidance inspector | Muse / Forge | Implemented and locally verified — owner review pending |
| V1-RR-006 | Replace empty-query search taxonomy dump with a calm starting state | Muse / Forge | Implemented locally — 4/4 expert and 11/11 novice search gate passes |
| V1-RR-007 | Turn Templates default page into a progressive task workflow | Muse / Forge | Implemented locally — route contract passes |
| V1-RR-008 | Remove redundant trust/legal/copy boilerplate and restore specific action guidance | Muse | Implemented locally for release blockers — content contract passes |
| V1-RR-009 | De-duplicate Playbooks and progressively orient heavy routes | Muse / Forge | Implemented locally — browser contracts pass |
| V1-RR-010 | Add structural visual contracts for the owner-approved compositions and density limits | Pixel | Implemented locally — desktop/mobile/zoom/reduced-motion contracts pass |

## Deferred (SPR Sprint E — not blocking)

| ID             | Gap                                                                                                    | Owner       | Notes                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| SPR-ENG-005    | Offline reload without network                                                                         | Maintenance | Expected static SPA behavior; service worker only if explicitly requested                                                                          |
| SPR-A11Y-001   | VoiceOver/NVDA/TalkBack hands-on sign-off                                                              | Human QA    | Automated axe on 14 routes + live smoke CI; manual checklist row 6 in [`docs/audits/a11y-manual-checklist.md`](../audits/a11y-manual-checklist.md) |
| SPR-UNVERIFIED | WebPageTest, real iOS/Android devices, pen-test | Maintenance / Human QA | External/human evidence; not satisfied by emulation. Lighthouse is now part of the active release gate. |

## Optional maintenance

- Promote `v1.0.0` after RC feedback
- Run the staged ingestion/search experiments in [`open-source-tool-assessment.md`](open-source-tool-assessment.md); no listed tool is approved as a v1.0 dependency
- Run the post-v1 UI/performance/copy/data strengthening sequence in [`open-source-platform-strengthening-assessment-2026-07-17.md`](open-source-platform-strengthening-assessment-2026-07-17.md), beginning with Playwright golden routes, Lighthouse CI, and a project-owned Vale style
- Dependabot PR review (Nexus)
- Source real crosswalks for DoD RAI, ATT&CK ICS, AI RMF, SSDF, SP 800-172, and remaining sparse catalogs; never infer them merely to raise coverage
- Resolve or document the 11 current graph-health findings upstream
