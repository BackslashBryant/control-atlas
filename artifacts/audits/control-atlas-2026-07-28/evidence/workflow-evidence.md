# Practitioner workflow evidence — corrected local candidate

Date: 2026-07-29
Evidence boundary: production static build on local port 4317 through Playwright. This is automated local evidence, not practitioner, deployed, screen-reader, or physical-device evidence.

`npm run precommit` completed all 12 launch-contract practitioner workflows:

| Workflow | Local status | Evidence |
| --- | --- | --- |
| 01 — Find a known identifier | Pass | Exact unique `AC-2` opens the exact NIST SP 800-53 record. |
| 02 — Search a topic | Pass | Topic search stays in canonical Search and returns eligible results with match evidence. |
| 03 — Exact, ambiguous, and zero | Pass | Exact identifiers resolve exactly; ambiguous text stays in Search; zero remains zero with recovery. |
| 04 — Verify official identity | Pass | Record title, publication identity, publisher, official text, and ingestion provenance remain separate. |
| 05 — Follow and return | Pass | Browser history returns to the preserved search URL and state. |
| 06 — Path, Map, and List | Pass | All three representations consume one published relationship scope; candidates remain opt-in. |
| 07 — Compare | Pass | The selected workbench exposes its required inputs and serializes them in the URL. |
| 08 — Inspect a source | Pass | Sources exposes publisher, publication, coverage, version, status, and checked date. |
| 09 — Find a resource | Pass | Resources is a searchable directory with owner, access, status, provenance, and limitations. |
| 10 — Recover | Pass | Invalid parameters, missing records, and empty filters fail closed with useful recovery. |
| 11 — Refresh and history | Pass | Valid route state survives refresh, Back, and Forward. |
| 12 — Responsive defining work | Pass | Defining workflows reflow at mobile, tablet, and desktop automation widths. |

Additional correction suite: `npm run test:correction:local` — 27 passed, 0 failed.

External launch evidence remains blocked pending five working practitioners across at least three roles on the exact deployed candidate.
