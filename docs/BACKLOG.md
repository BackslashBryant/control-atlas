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
| POLISH-007 | P1 | Close the legacy public-URL trap that led users to the obsolete `ashbryant.github.io/control-atlas/` release. | Both supplied phone photos show the legacy host; a current direct check returns GitHub Pages 404 while the canonical product is on `backslashbryant.github.io/control-atlas/`. | Inventory and replace every owned old-host link. If the old Pages account/repository is controllable, publish a minimal canonical redirect; otherwise document the external limitation and add an automated repository/link check that forbids the old hostname. |
| POLISH-009 | P2 | Replace the ambiguous global footer date with precise release and data dates. | `live` routes say “Last updated August 7, 2026,” sourced from `data/source-registry.json`, while `data/generated/sources.json` is generated August 13, 2026 and the deployed release is newer. | Footer labels exactly what each date represents (for example product release and source-data build), derives it from the deployed release/data artifacts, and has a test preventing an older registry timestamp from masquerading as whole-product freshness. |
| POLISH-010 | P2 | Give Compare’s mode chooser correct interaction semantics. | `live` `#/compare` exposes five `role=tab` controls with `aria-selected=false` on every item and no roving tab index; the surface behaves as a choice of workflows rather than an active tab panel. | Use cards/buttons for workflow navigation, or implement one selected tab, linked tabpanel, roving focus, and arrow-key behavior. Automated keyboard and accessibility checks cover the chosen pattern. |
| POLISH-011 | P2 | Make reusable card section titles real headings and name their containing regions/articles. | `live` `#/about` exposes “What It Is,” “Why It Exists,” and the other section titles as generic text inside unnamed articles; `SummaryCard` renders its title as a `span`. | About has a useful H1→H2 hierarchy; each article/region has an accessible name; reusable cards accept a semantic heading level without producing skipped or duplicate headings elsewhere. |
