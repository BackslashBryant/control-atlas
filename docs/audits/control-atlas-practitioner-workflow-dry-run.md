# Control Atlas — Practitioner Workflow Dry Run

Date: 2026-08-02
Mode: internal technical capability check against the local build, using the task list from `docs/research/control-atlas-v1-practitioner-validation-protocol-2026-07-28.md`. This is not human usability testing — no participants, no timing data, no completion-rate claims. It confirms the application can technically support each task.

Corroborating evidence: `tests/e2e/v1-practitioner-workflows.spec.mjs` (12 automated tests, one per protocol task) passed 12/12 against the same build after this session's changes — see `docs/audits/control-atlas-external-evaluation-readiness.md` for the full run.

## Desktop tasks

| # | Task | Result |
|---|---|---|
| 1 | Find AC-2 and its official source | **Pass.** `/record/nist-800-53/AC-2` shows the official title, "Source excerpt from SP 800-53 Rev. 5", full Discussion text, and "Open official source" linking to `csrc.nist.gov`. |
| 2 | Search a plain-language topic ("encryption") without an identifier | **Pass.** Returns relevant control enhancements (AC-17.2, AC-18.1, AC-19.5...) each labeled "Published federal source" with its source name. |
| 3 | Search a nonsense term | **Pass.** Honest "No matching records found" with guidance ("Try searching by control ID, topic, baseline, CCI, or source") and a clear-search recovery action — not a blank or misleading screen. |
| 4 | Find DE.AE-08, its publisher-structure position, and one published mapping | **Pass.** Search finds it directly, correctly attributed to "Cybersecurity Framework 2.0"; its record page lists related-mapping connections. |
| 5 | Open a related record and return without losing original work | **Pass**, contingent on the round-4 Map rework: opening a related record from the record inspector, then using browser back, returns to the originating list/selection — this exercises the same state-preservation path fixed for the Explore-area routing bug. |
| 6 | Browse via Path, Map, and List; explain what changes and stays in scope | **Pass**, after this session's rework. Path shows the publisher-declared hierarchy only. Map (as of round 4) shows relationship-type summary cards, a selected-type record list, and an opt-in full diagram. List shows the complete, accessible connection set. All three read the same underlying record; none invents a parent the publisher didn't declare. |
| 7 | Configure a comparison, share/copy the state, explain what the mapping does not prove | **Pass.** Selecting "Catalog to catalog" then SP 800-53 Rev. 5 × FedRAMP Rev. 5 updates the URL (`?crosswalk=...&source=nist-800-53&target=fedramp-rev5...`) — that URL is the shareable state. The page states plainly: "A published mapping records a cited relationship. It does not establish equivalence, applicability, implementation, compliance, or authorization." |
| 8 | Find the source used for a record; explain how Control Atlas used it | **Pass.** Every record's "Source support" panel names the primary source, review status, version, and last-checked date; the Sources hub separately lists every publication with the same detail. |
| 9 | Find one external tool, one template/starter, one practitioner community | **Pass.** Resources hub (96 indexed resources) surfaces tools (e.g. OWASP Dependency-Track), templates (Build → Documents' 12 starters), and communities (e.g. a defense-industrial-base subreddit), each labeled by category and owner. |
| 10 | Distinguish Sources from Build → Resources | **Pass.** The Sources page states outright: "Tools, templates, datasets, training, and communities are in Resources," with a direct link — the two collections don't overlap and the copy says so. |
| 11 | Recover from a stale/invalid link or empty filter | **Pass.** `/not-found` and `/retired` both render a clear notice and a path back (now with a proper `<h1>`, fixed this session); an unmatched search filter clears cleanly. |
| 12 | Refresh and use back/forward while preserving the active task | **Pass**, after the Critical fix in this session. Before the fix, this task would have failed for any Explore-area navigation; the fix specifically closes this gap. |

## Mobile subset (tasks 1, 2, 6, 9, 11) at 390×844

All five re-verified at mobile width: no horizontal overflow found on Home, a record detail, Search results, the Explore/record Map view (compact layout, group-summary cards stack to full width, no diagram forced), or the not-found/empty states.

## Limitations of this dry run

- Internal, single-operator pass — not a substitute for the human validation protocol's actual sessions, timing thresholds, or authority-perception questions (docs/research/...:63-104).
- Did not exercise every one of the 51 indexed sources, 11,691 nodes, or 96 resources individually — spot-checked representative examples per task.
- Assistive-technology behavior (NVDA/VoiceOver/TalkBack) was not tested by a human; automated axe-core checks (32/32 passing, see the readiness report) catch a different, narrower class of issue than a real screen-reader session.
