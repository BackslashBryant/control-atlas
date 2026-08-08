# Search index and relevance spike results

## Decision

Do not switch the product to the tested MiniSearch relevance path yet. The
experiment is a no-go: it misses the defined top-three bar for four of seven
probes. Keep the current path as the production default while Epic 12 chooses
the missing product signals rather than encoding an unsupported preference in
a score formula.

## What the current search artifact contains

| Need | Result |
| --- | --- |
| Publisher / publication name | Present as `source_name`; publication is derivable from `catalog_id`. |
| Official text preview | Missing. The full record text is available only in the record data. |
| Highlightable match field | Missing. |
| Canonical record type | Present as `object_type` (raw type, not the planned six-kind taxonomy). |
| Published connection count | Added at build time from the published graph edges. The search result now consumes that same generated total instead of counting edges from its edge-free bootstrap runtime. |

The generated search set now contains 29,350 records. Its compressed payload
is 871,166 bytes. Adding an integer connection count costs 26,056 compressed
bytes. Adding a 180-character official preview to every record costs
1,071,854 compressed bytes, so snippets cannot be added to the up-front
artifact within the 350 KB constraint. They require a result-triggered
record-text load or a chunked index.

## Open-source gate

| Candidate | License | Current signal | Static-site fit | Result |
| --- | --- | --- | --- | --- |
| MiniSearch 7.2.0 | MIT | npm published 2025-09 | Already installed; field boosting, prefix and fuzzy search; one in-memory index | Tested behind `--engine=minisearch-field-weighted-v1`; no-go below. |
| Pagefind 1.5.2 | MIT | npm published 2026-04 | Build-time, chunked static index | Strong future candidate, but it indexes rendered documents. The SPA does not emit the record corpus as crawlable pages, so adoption requires an intentional document-output change. |
| Orama 3.1.18 | Apache-2.0 | npm published 2026-07 | Browser/static capable with field search | Rejected for this change: adds a second full-text runtime and serialized index without resolving the missing product signals. |
| FlexSearch 0.8.212 | Apache-2.0 | npm published 2025-09 | Browser/static capable, field/document search | Rejected: same migration and signal gap, with no measured advantage over the installed MiniSearch trial. |
| Lunr 2.3.9 | MIT | npm published 2020-08 | Browser index, field boosts | Rejected: materially stale relative to the alternatives and requires a whole-index load. |

MiniSearch, Pagefind, Orama, FlexSearch, and Lunr were evaluated from their
maintainer documentation and npm metadata. MiniSearch’s official API supports
field boosts; Pagefind’s official documentation confirms its post-build,
chunked static index model.

## Measured candidate results

The reproducible runner is:

```text
node scripts/spikes/search-index-relevance.mjs --engine=minisearch-field-weighted-v1
```

| Query | Expected answer | Candidate rank | Result |
| --- | --- | ---: | --- |
| Platform One | Air Force software ecosystem portal | 51 | Fail |
| access control | NIST SP 800-53 Access Control family | 4 | Fail |
| AC-2 | NIST SP 800-53 AC-2 | 10 | Fail; the existing exact-identifier short-circuit must remain. |
| phishing | MITRE ATT&CK Phishing | 1 | Pass |
| FIPS 140-2 | A first-class FIPS 140 record | Not present | Fail; the corpus has citations in DISA content, not the expected standard record. |
| CMMC level 2 | CMMC Level 2 | 1 | Pass |
| eMASS | NISP eMASS | 1 | Pass |

## Next decision needed

Phase 2 can show a real official snippet only through result-triggered
loading; it cannot do so within the current up-front budget. Relevance also
needs a product-owned answer for ties such as multiple Platform One resources
and the absent FIPS 140 publication. Do not compensate with an unexplained
publisher or resource preference in scoring code.
