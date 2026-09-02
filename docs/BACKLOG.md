# Control Atlas Backlog

- **Owner:** Product owner
- **Status:** Canonical open work only
- **Last reviewed:** 2026-08-29
- **Supersession:** Add, close, or reprioritize items here; do not create another backlog or preserve completed rows.

| ID | Open outcome | Owner | Trigger |
| --- | --- | --- | --- |
| EXT-A11Y-001 | Hands-on NVDA plus VoiceOver or TalkBack verification | Human QA | Before any claim of assistive-technology conformance |
| EXT-DEVICE-001 | Physical iOS and Android phone verification | Human QA | Before any claim of physical-device coverage |
| EXT-SEC-001 | Independent penetration test | Product owner | Before a formal external security-assurance claim |
| TAX-RULES-001 | `tool`, `artifact`, and `topic` carry no record-level assignment rules, so they never appear as record facets. Closing this means writing governed source-backed rules, not UI work. | Product owner | Before presenting those dimensions as record filters |
| TAX-INDEX-001 | `data/generated/discovery-index.json` covers resources and templates only (100 entries). Extend to records, catalogs, guides, and the Intel contract so a tag opens genuinely cross-content results. | Product owner | Before claiming unified cross-content discovery |
| TAX-COVER-001 | Coverage reporting omits the governed metrics the taxonomy contract requires: direct vs derived assignment counts, identity coverage, official-mark coverage, fallback usage, and unresolved legacy labels. | Product owner | Before publishing a taxonomy coverage claim |
| TAX-COMPARE-001 | Compare shows no shared or differing tags between the two selected publications. | Product owner | Optional; the taxonomy epic marks this non-blocking |
| DATA-FETCH-001 | Only `fetch-stig-source-observations.mjs` uses `strictConditionalFetch`, so the other fetchers re-download their artifacts on every weekly refresh instead of revalidating and taking a 304. Migrating them needs per-adapter work and a check that each publisher honours conditional requests. | Product owner | When refresh bandwidth or runtime becomes a constraint |
| DATA-CADENCE-001 | Every refresh task runs on the same weekly beat. Source manifests carry `retrieved_at` and a checksum but no per-source cadence, and manifests have no `catalog_id`, so mapping a task's scope to its sources is not currently possible. A wrong mapping would skip a fetch and present stale data as fresh, so the mapping has to come first. | Product owner | After DATA-FETCH-001, if weekly still costs too much |
| EOL-001 | The repository has no `.gitattributes`, so line endings depend on each checkout's git config. Three specs had drifted to CRLF and failed CI's whitespace check the moment they were edited. `* text=auto eol=lf` would prevent recurrence, but it renormalises on checkout and needs a deliberate pass rather than a drive-by commit. | Product owner | Before the next CRLF file trips a whitespace gate |
| CI-NIGHTLY-001 | Measured 2026-08-29 at the scheduled job's own settings (`fullyParallel`, 2 workers): browser 366 passed / 2 failed / 5 skipped, accessibility 35 passed / 0 failed. All 34 axe checks pass; no serious or critical violations in that suite. The only remaining failures are the two in E2E-PARALLEL-001. | Product owner | Confirm on the first weekly run |
| E2E-PARALLEL-001 | `epic1-atlas-correctness` (ambiguous Atlas text) and `threat-chain` (Specific item comparison) pass at one worker and fail under `fullyParallel` at two, which is the scheduled job's own configuration. Both use auto-waiting assertions, so this is a load race under contention rather than a missing wait. CI sets `retries: 1` while local runs use 0, so the scheduled job may mask it on retry. | Product owner | Before the scheduled suite is trusted; retry masking makes this easy to ignore |
| TAX-BRANDS-001 | `src/ui/lib/resourceBrands.mjs` still supplies Commons access and type labels alongside the identity registry. With marks retired the overlap is smaller, but the two still describe the same resources from different files. | Product owner | When Commons resource presentation is next revisited |

Routine dependency, source-freshness, CI, Pages smoke, and comparative performance checks are operations, not backlog items.
