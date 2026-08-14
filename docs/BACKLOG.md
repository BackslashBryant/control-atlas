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
| POLISH-024 | P2 | Resolve parent source names in accessible inheritance explanations instead of announcing raw parent IDs. | `live rendered DOM` on release `30dd68d1`: 19 initially rendered Source material rows at both 320 and 1440 include visually hidden explanations such as `Inherited from parent publication dod-rai-toolkit` and `dod-zt-execution-roadmap`, even though the row has a human display title. `static`: `publisherField` in `src/ui/lib/sourceRegister.ts` interpolates `parent.id` directly into the derived-field reason. | Build the inheritance reason from the governed parent display name/name fallback and keep the stable ID only in the explicitly labeled ID/copy control. At all six widths, accessible snapshots for derived publisher fields must contain the human parent publication name and no raw parent source ID; retain the visible `From parent publication` basis and existing missing/not-applicable distinctions. |
| POLISH-025 | P1 | Give each Source detail route its specific source identity instead of a shared family label. | `live rendered` on release `d632bdf0` at 390 px: `#/sources?source=cyber-mil-stig-downloads` uses the generic H1 `DISA STIG` while the card immediately below names the actual record `DISA STIG Downloads Landing Page`; the browser title remains the generic Sources route title. `static`: `SourcesPage` prefers `display_name` for the H1 even though `SourceSummaryCard` deliberately prefers `name` because nine different sources share `DISA STIG`; the current dataset also has repeated `NIST SP 1800-35 Mapping Workbook`, `SP 800-53 Rev. 5`, `DISA CCI`, and other display labels. | Use the source-specific `name` as the detail H1 and browser/history title, with `display_name` retained only as secondary family context when it differs. Two same-family source deep links must have distinct H1s and document titles, preserve back/forward state, retain the labeled source-ID copy control, and avoid overflow at all six widths. |
| POLISH-026 | P2 | Remove the duplicate return-to-Sources action on Source detail pages. | `live rendered` on release `d632bdf0` at 390 px: the context bar renders `ALL SOURCES` immediately above the panel's `← Back to sources`; both target the same Sources state. `static`: `OrbitalContextBar` supplies the `All sources` back action for `state.source`, while `SourcesPage` independently renders the second back link. | Render one clear return action in the established context-navigation position, preserve the prior Sources query/layer/filter state, and ensure the next task-relevant heading begins without a redundant navigation row at 320/375/390. Assert one Sources-return link on detail routes and correct back/forward behavior at all six widths. |
