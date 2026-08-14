# Control Atlas Backlog

- **Owner:** Product owner
- **Status:** Canonical open work only
- **Last reviewed:** 2026-08-13
- **Supersession:** Add, close, or reprioritize items here; do not create another backlog or preserve completed rows.

| ID | Open outcome | Owner | Trigger |
| --- | --- | --- | --- |
| EXT-A11Y-001 | Hands-on NVDA plus VoiceOver or TalkBack verification | Human QA | Before any claim of assistive-technology conformance |
| EXT-DEVICE-001 | Physical iOS and Android phone verification | Human QA | Before any claim of physical-device coverage |
| EXT-SEC-001 | Independent penetration test | Product owner | Before a formal external security-assurance claim |

Routine dependency, source-freshness, CI, Pages smoke, and comparative performance checks are operations, not backlog items.

## Detail and polish audit

Evidence labels below are deliberate: `live` means the canonical Pages site was inspected, `phone photo` means the supplied Android Chrome capture, and `static` means the current component or stylesheet contract was inspected. Re-test every responsive item at 320, 375, 390, 768, 1024, and 1440 pixels before closure.

| ID | Priority | Open outcome | Evidence | Acceptance criteria |
| --- | --- | --- | --- | --- |
| POLISH-007 | P1 | Close the legacy public-URL trap that led users to the obsolete `ashbryant.github.io/control-atlas/` release. | Both supplied phone photos show the legacy host; a current direct check returns GitHub Pages 404 while the canonical product is on `backslashbryant.github.io/control-atlas/`. The authenticated `BackslashBryant` account has no `ashbryant/control-atlas` repository to configure. | Keep the automated owned-link check that forbids the exact obsolete URL. If the legacy account or Pages property becomes available, publish a minimal canonical redirect; otherwise retain this external ownership limitation explicitly rather than representing the 404 as fixed. |
| POLISH-021 | P1 | Keep every Atlas local-connection filter fully inside its panel and viewport. | `live rendered` on release `db2efc9`, fresh initial loads of `#/atlas?node=nist-800-53%3AAC-2&relationshipView=list`: at 1024 px the filter panel ends at x=984 while four selects and the connection search end at x=1043; at 1440 px the panel ends at x=1396 while those controls end at x=1454. The page suppresses horizontal overflow, so the native select affordances and input borders are clipped rather than scrollable. The governed compact widths and 768 px are not affected. `static`: the filter grid retains a 12rem minimum column inside a roughly 150 px flex item. | On a fresh load at 320, 375, 390, 768, 1024, and 1440, the open filter panel, every label, all four selects, the search input, and the candidate toggle must remain within both their containing panel and the viewport, with native select affordances visible and no page-level horizontal scroll. Extend the local-connections rendered regression to assert control and container bounding boxes at all six widths. |
| POLISH-022 | P1 | Present governed publication-currentness review dates separately from source retrieval and automated source-check dates. | `live rendered + deployed data` on release `db2efc9`: the NIST IoT source detail shows `Retrieved 2026-08-12` and `Last verified Not recorded` at all six widths, while the deployed governed review manifest records `reviewed_at 2026-08-13`, `upstream_currentness_review current_as_checked`, and `semantic_content_review reviewed_no_known_mismatch` for `nist-iot-cybersecurity`. The deployed source record correctly has no `last_checked`; the problem is that the trust surface omits the distinct review evidence and leaves `Last verified` semantically ambiguous. | Do not backfill or overwrite a missing `last_checked`. Rename that fact to its exact meaning (for example, `Source last checked`) and expose the governed publication currentness-review date and disposition as a separate fact wherever a source maps to a reviewed catalog. Prove the distinction with NIST IoT, a source that has `last_checked`, and coverage/reconciliation tests for all 27 reviewed profiles; preserve honest unavailable states and responsive no-overflow behavior at all six widths. |
