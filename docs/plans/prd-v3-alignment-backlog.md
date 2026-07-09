# Control Atlas Backlog: PRD v3.0 Alignment

Open gaps only. Shipped epics are summarized in [`docs/Plan.md`](../Plan.md).

**Last synced:** July 9, 2026 (SPR-20260708 remediation shipped; gaps below are deferred/non-blocking)

## Deferred (SPR Sprint E — not blocking)

| ID             | Gap                                                                                                    | Owner       | Notes                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| SPR-ENG-005    | Offline reload without network                                                                         | Maintenance | Expected static SPA behavior; service worker only if explicitly requested                                                                          |
| SPR-A11Y-001   | VoiceOver/NVDA/TalkBack hands-on sign-off                                                              | Human QA    | Automated axe on 14 routes + live smoke CI; manual checklist row 6 in [`docs/audits/a11y-manual-checklist.md`](../audits/a11y-manual-checklist.md) |
| SPR-UNVERIFIED | Live color-contrast measurement, Lighthouse/WebPageTest formal run, real iOS/Android devices, pen-test | Maintenance | Optional weekly/human maintenance, not sprint blockers                                                                                             |

## Optional maintenance

- Promote `v1.0.0` after RC feedback
- Dependabot PR review (Nexus)
