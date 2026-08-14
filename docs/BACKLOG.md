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
| POLISH-029 | P2 | Present Resource maintenance dates consistently instead of exposing raw machine timestamps. | `deployed asset` on canonical release `3e4e4490`: the shipped Resource detail chunk prints `lastCommitAt` directly beside date-only `lastCheckedAt` and `nextCheckAt` values. `static`: current publisher data includes values such as `2026-08-10T16:48:29Z`, so `Last repository activity` exposes the full ISO timestamp while the neighboring maintenance fields use a different date form. Live visual rendering is unverified because no controllable browser session was available. | Render recorded repository activity, last-checked, and next-review values with semantic `<time dateTime="...">` elements and one documented, human-readable UTC date convention; preserve the exact source value in `dateTime`, keep honest missing-state copy, and assert timestamp/date/null examples plus no compact-width overflow at 320/375/390/768/1024/1440. |
