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
| POLISH-019 | P1 | Expose each retained record source locator without turning technical artifact paths into misleading public deep links. | `live rendered + deployed data` on release `7571ee7`: 15 representative record routes (NIST 800-53/53A/171, CCI, STIG/SRG including V-256609, ATT&CK, D3FEND, DoD/NIST Zero Trust, NIST Mobile, and both Appgate records) retain non-empty `source_locator` values in their deployed neighborhood shards, but none exposes the exact locator on the record page. V-256609 retains an archive/XML fragment locator while its visible source facts stop at publication/source-level metadata. | Add a nearby progressive-disclosure `Source location` fact that preserves and can copy the exact retained locator; distinguish artifact paths/fragments from verified official URLs and never synthesize an unverified deep link. Long URL, JSON-pointer, archive/XML, and row/section locators must wrap without page overflow at 320, 375, 390, 768, 1024, and 1440. Add deployed-data-to-DOM and clipboard regressions covering the named source families. |
| POLISH-020 | P2 | Replace raw catalog slugs in the record `Publication` fact with governed human publication names. | `live rendered` on release `7571ee7`: NIST Mobile records APP-0/CEL-10 show `nist-mobile-threats`, and both NIST Zero Trust Appgate records show `nist-zt`, at every audited width from 320 through 1440. `static`: the record template falls back to `document.catalog_id` when the runtime catalog lookup and `catalog_name` are absent. | Resolve the record publication label through the governed catalog-profile identity for every catalog; a known profile must never expose its canonical slug as user-facing publication copy. Assert human labels for NIST Mobile, NIST Zero Trust, and every other profile whose document lacks `catalog_name`, plus responsive no-overflow checks at all six governed widths. |
