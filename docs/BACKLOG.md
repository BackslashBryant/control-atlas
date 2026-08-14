# Control Atlas Backlog

- **Owner:** Product owner
- **Status:** Canonical open work only
- **Last reviewed:** 2026-08-14
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
| POLISH-026 | P2 | Remove the duplicate return-to-Sources action on Source detail pages. | `live rendered` on release `d632bdf0` at 390 px: the context bar renders `ALL SOURCES` immediately above the panel's `← Back to sources`; both target the same Sources state. `static`: `OrbitalContextBar` supplies the `All sources` back action for `state.source`, while `SourcesPage` independently renders the second back link. | Render one clear return action in the established context-navigation position, preserve the prior Sources query/layer/filter state, and ensure the next task-relevant heading begins without a redundant navigation row at 320/375/390. Assert one Sources-return link on detail routes and correct back/forward behavior at all six widths. |
| POLISH-027 | P1 | Give unknown Source detail deep links an honest not-found state instead of silently showing the unfiltered register. | `live rendered` on release `c6e499e9` at 390 px: `#/sources?source=not-a-real-source` keeps the invalid key in the URL but renders the ordinary 83-publication register. Because the context bar only checks whether `state.source` is non-empty, it also displays `ALL SOURCES` above the already-visible Sources register. `static`: `SourcesPage` treats an unresolved selected source exactly like no selection and has no invalid-detail branch. | An unresolved non-empty `source` parameter must render a source-specific not-found heading that names the requested key, explain that it is not in the register, and expose one return-to-Sources action; it must not render normal register results underneath. Preserve refresh and back/forward behavior, avoid raw-key overflow, and assert the invalid state plus recovery action at all six widths. |
| POLISH-028 | P2 | Remove duplicate return controls from Resource detail and preserve the user's Resources workspace. | `static`: `OrbitalContextBar` renders `All resources` for `commons-detail` while `CommonsDetailPage` renders a second body-level `Back` link; both reset to the Resources landing state. This repeats the Source-detail navigation defect in a neighboring template. | Keep one truthful context-bar return action, preserve the prior Resources query/collection/owner/type/view state when the detail was opened from a filtered workspace, retain a governed 44 px target, and assert one return control plus Back/Forward restoration at 320/375/390/768/1024/1440. |
