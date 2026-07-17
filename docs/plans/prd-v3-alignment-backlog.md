# Control Atlas Backlog: PRD v3.0 Alignment

Open gaps only. Shipped epics are summarized in [`docs/Plan.md`](../Plan.md).

**Last synced:** July 17, 2026 (v1.0 release-readiness implementation in progress)

## Active release gate

| ID | Gap | Owner | Status |
| --- | --- | --- | --- |
| V1-RR-003 | Atlas clarity, bounded rendering, mobile behavior, and focused-route performance | Pixel / Forge | Implemented locally; full precommit passes with 120 Playwright tests passed and 1 skipped. Focused Atlas Lighthouse, CI, and live Pages verification remain. |

## Deferred (SPR Sprint E — not blocking)

| ID             | Gap                                                                                                    | Owner       | Notes                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| SPR-ENG-005    | Offline reload without network                                                                         | Maintenance | Expected static SPA behavior; service worker only if explicitly requested                                                                          |
| SPR-A11Y-001   | VoiceOver/NVDA/TalkBack hands-on sign-off                                                              | Human QA    | Automated axe on 14 routes + live smoke CI; manual checklist row 6 in [`docs/audits/a11y-manual-checklist.md`](../audits/a11y-manual-checklist.md) |
| SPR-UNVERIFIED | WebPageTest, real iOS/Android devices, pen-test | Maintenance / Human QA | External/human evidence; not satisfied by emulation. Lighthouse is now part of the active release gate. |

## Optional maintenance

- Promote `v1.0.0` after RC feedback
- Run the staged ingestion/search experiments in [`open-source-tool-assessment.md`](open-source-tool-assessment.md); no listed tool is approved as a v1.0 dependency
- Dependabot PR review (Nexus)
- Source real crosswalks for DoD RAI, ATT&CK ICS, AI RMF, SSDF, SP 800-172, and remaining sparse catalogs; never infer them merely to raise coverage
- Resolve or document the 11 current graph-health findings upstream
