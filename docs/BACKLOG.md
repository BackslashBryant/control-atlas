# Control Atlas Backlog

- **Owner:** Product owner
- **Status:** Canonical open work only
- **Last reviewed:** 2026-08-28
- **Supersession:** Add, close, or reprioritize items here; do not create another backlog or preserve completed rows.

| ID | Open outcome | Owner | Trigger |
| --- | --- | --- | --- |
| EXT-A11Y-001 | Hands-on NVDA plus VoiceOver or TalkBack verification | Human QA | Before any claim of assistive-technology conformance |
| EXT-DEVICE-001 | Physical iOS and Android phone verification | Human QA | Before any claim of physical-device coverage |
| EXT-SEC-001 | Independent penetration test | Product owner | Before a formal external security-assurance claim |
| IDENT-001 | Verified official identity marks. Every identity registry entry is `fallback_only` with no asset; `public/identity/official/` and `public/identity/brand/` do not exist. Needs per-publisher usage/licensing review, sanitized local SVGs, `scripts/validate-identity-registry.mjs`, and `docs/IDENTITY_ASSETS.md`. | Product owner | Before claiming Feature A of the unified taxonomy epic is delivered |
| TAX-FACET-001 | Facet rail exposes only the legacy six dimensions. Add grouped, contextually counted, searchable facets for organization, tool, framework, program, artifact, and topic. | Product owner | Before claiming the taxonomy epic's filter/facet acceptance criteria |
| TAX-RESULT-001 | Library and search result rows carry no tags. Add at most three high-signal clickable tags per row without hurting scan speed. | Product owner | Before claiming the taxonomy epic's search-surface acceptance criteria |
| TAX-INDEX-001 | `data/generated/discovery-index.json` covers resources and templates only (100 entries). Extend to records, catalogs, guides, and the Intel contract so a tag opens genuinely cross-content results. | Product owner | Before claiming unified cross-content discovery |
| TAX-COVER-001 | Coverage reporting omits the governed metrics the taxonomy contract requires: direct vs derived assignment counts, identity coverage, official-mark coverage, fallback usage, and unresolved legacy labels. | Product owner | Before publishing a taxonomy coverage claim |
| REC-ID-001 | Generated container nodes store only a Control Atlas scaffold key, so container pages cannot lead with the publisher's own identifier (`PR.AA`, `TA0001`). Carry a `publisher_item_id` through the graph builder instead of reconstructing it with UI string rules. | Product owner | Before claiming container pages present publisher-native identity |
| TAX-COMPARE-001 | Compare shows no shared or differing tags between the two selected publications. | Product owner | Optional; the taxonomy epic marks this non-blocking |
| TAX-BRANDS-001 | `src/ui/lib/resourceBrands.mjs` still owns Commons card identity in parallel with the identity registry. Retire the duplicate metadata once parity tests exist. | Product owner | After IDENT-001 |

Routine dependency, source-freshness, CI, Pages smoke, and comparative performance checks are operations, not backlog items.
