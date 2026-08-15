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
| POLISH-030 | P1 | Redesign Home area browsing; the shipped weighted word row is rejected as oversized, disconnected, and visually awkward. | `user screenshot` on 2026-08-14 shows seven source-backed areas arranged as large wrapped words with weak grouping. `static`: `.home-ecosystem-areas` is a centered wrapping flex row and `.home-area-link` scales to `2.32rem`, so the largest counts dominate as isolated labels instead of forming a coherent navigational composition. | Show at least two rendered local directions before implementation and obtain visual approval. Preserve exact source-backed counts, logarithmic weighting, stable area URLs, zero-result suppression, semantic links, 44px targets, reduced-motion behavior, keyboard focus, and no overlap or overflow at 320/375/390/768/1024/1440. Do not ship the current word-row treatment unchanged. |
| POLISH-031 | P1 | Remove the unused desktop space in the Atlas overview while keeping the bounded React Flow + ELK neighborhood. | `live browser` on release `23294a2f` at 1440x900: the overview forces a 701px-tall three-column workbench; the 336px inspector contains 212px of content and leaves 489px blank. `static`: `.atlas-tree__workbench` enforces a 40rem minimum and a viewport-clamped 40–50rem height, while the inspector stretches to the full grid row. | Show a rendered desktop/tablet layout direction before implementation. Give the graph or useful navigation the reclaimed space; size sparse context to its content; preserve source context, Current path, keyboard/focus behavior, graph controls, bounded nodes/edges, list fallback, and zero page/control overflow. Verify overview, publication hierarchy, leaf, and local-connections states at 768/1024/1440, plus compact fallbacks at 320/375/390. |
