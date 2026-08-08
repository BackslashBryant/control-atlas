# Spike brief — search index fields + cross-corpus relevance

**For:** the data/backend agent
**Requested:** 2026-08-08
**Blocks:** Epic 12 Phase 2 (`epic-12-ux-stabilization-2026-08-08.md`)
**Type:** spike — investigate, prove, recommend. Do not ship UI.

---

## Context

Control Atlas is a **static site on GitHub Pages**. No server, no query backend. Search runs client-side against a prebuilt index (`data/generated/library-search.json.gz`, ~234 KB over the wire) loaded on first search, plus `data/generated/catalog-bootstrap.json.gz`.

The corpus spans roughly 5,300 records across 23 publications (NIST controls, SP 800-171 requirements, DISA STIG rules and SRG requirements, ATT&CK techniques, D3FEND countermeasures, CMMC practices, Zero Trust activities, RMF steps, tasks), plus 114 external resources and 102 sources.

**Confirmed from the live site:** the index is already unified across corpora. A query for `Platform One` returns DISA STIG rules and a `GOVERNMENT PORTAL` resource in the same ranked list. **You are not being asked to merge indexes.** They are merged.

There are two independent problems. Both are index questions, which is why they are one brief.

---

## Problem 1 — the index may not carry what the result row needs

Epic 12 Phase 2 redesigns the search result row. Today every row renders the same three things:

```
Access Control
FAMILY-ACCESS-CONTROL · Control family
Official description available — open this record to read it.
Exact title · 0 published connections
```

Three rows in the top six are byte-identical. The redesigned row needs, **per result**:

| Field | Needed for | Status |
|---|---|---|
| Publisher / publication display name | Disambiguating identical titles | unknown |
| First ~180 chars of official text | The snippet that replaces "open this record to read it" | unknown |
| Match offsets or a highlightable field | Marking the matched term in the snippet | unknown |
| Canonical record type | The 6-kind taxonomy (Epic 12 §3.3) | partially — 30 raw types exist |
| Connection count | Currently **wrong** — see below | broken |

**The connection count is contradicting itself.** Search rows for `fips-200 / AC` render `0 published connections`. That record's own page renders `3 CONNECTIONS` (FAMILY-AC, RMF-PREPARE, CATALOG). Two code paths, two answers, and search shows the discouraging one.

### Deliverable 1

1. Document what `library-search.json.gz` actually contains per entry, as a field table.
2. State, per row of the table above, whether the field is present, derivable at build time, or missing.
3. **Find and fix the connection-count discrepancy at the source.** One computation, one answer, consumed by both the row and the record page. Report which one was wrong and why.
4. If official text is absent from the index, cost adding it: bytes added to the gzipped payload, and the build-step change. **Report the number before implementing** — the size budget matters more than the feature (see constraints).

---

## Problem 2 — cross-corpus relevance

### Measured evidence

**Query: `Platform One`** (a DoD software factory) → 21 results.

| Rank | Type | Title |
|---|---|---|
| 1–8 | STIG RULE | `V-243209`, `V-243210`, `V-243213`, `V-243219`, `V-243221`, `V-243228`, `V-243229`, `V-243235` — all "WLAN components must be Wi-Fi Alliance certified / FIPS 140-2 validated" |
| 9 | SRG REQUIREMENT | `V-259882` — "The Mission Owner of the Infrastructure…" |
| 10 | GOVERNMENT PORTAL | **Department of the Air Force software ecosystem** ← the correct answer |

Eight near-duplicate WLAN STIG rules outrank the one obviously-correct result.

**Query: `access control`** → 112 results, top rows all titled "Access Control", including three rendered identically as `Access Control (ACCESS-CONTROL) family` from different publishers.

### Hypotheses to test (do not assume)

- No phrase matching — `Platform One` is scored as two independent tokens.
- No field weighting — a hit in long body text scores like a hit in a title or identifier.
- No length normalisation — STIG rules carry long boilerplate that inflates raw term frequency.
- No per-type cap or interleave — one corpus can flood the whole first page.
- Near-duplicate records (the eight WLAN rules, the three identical AC families) are not collapsed.

### Deliverable 2

1. **Open-source-first gate — mandatory, and it comes first.** Before writing or tuning any scoring code, name and evaluate the maintained client-side / build-time search options for a static site. At minimum consider **Pagefind**, **MiniSearch**, **Orama**, **FlexSearch**, **Lunr.js**. For each record: licence, maintenance health, bundle and index size, static-site fit, phrase and field-boost support, and ~5,500-document performance. **Pagefind is specifically worth a hard look** — it builds the index at build time and loads it in chunks, which would also address the 234 KB up-front payload.

   Record the selection and **concrete rejection reasons** for the others. Custom scoring is allowed only for the gap that remains after the candidates are named. Do not write bespoke BM25 and rationalise the research afterwards.

2. Stand up the chosen approach behind a flag and measure it against the eval set below.

3. Report results as a before/after table. If the recommendation is "keep what exists and add field boosting," that is a fine outcome — say so with the numbers.

### Evaluation set

Build a fixed probe set and score it; do not evaluate by impression. Seed it with these, and add ~10 more spanning each corpus:

| Query | Expected in top 3 | Currently |
|---|---|---|
| `Platform One` | Air Force software ecosystem portal | **rank 10** |
| `access control` | NIST SP 800-53 AC family (one row, not three) | 3 identical rows |
| `AC-2` | SP 800-53 AC-2, exact identifier | untested |
| `phishing` | ATT&CK phishing technique | untested |
| `FIPS 140-2` | the standard / its records above rules citing it | untested |
| `CMMC level 2` | CMMC practice records | untested |
| `eMASS` | the eMASS resource/portal | untested |

**Success bar:** every probe's expected answer in the top 3, **and** no single record type occupying more than 6 of the first 10 rows for a query whose intent spans corpora.

---

## Constraints

- **Static site. No server, no runtime query API.** Anything requiring a backend is out of scope.
- **Size budget:** total up-front search payload must not exceed ~350 KB gzipped, or must move to chunked/lazy loading. Report the delta for any change. Do not add official text to the index without reporting the size cost first.
- **Do not touch UI components or routes.** Epic 12 owns those. Your surface is the index, the build step, and the query/scoring layer.
- **Do not change the record schema** to fix a ranking problem.
- Keep the existing search path working behind the flag at all times.

---

## Out of scope

New sources, new record types, ingestion changes, the graph/connection model beyond fixing the count discrepancy, and anything in Epic 12 Phases 1 and 3–6.

---

## Report back with

1. The index field table, with present / derivable / missing per field.
2. Root cause of the connection-count discrepancy, and the fix.
3. The open-source evaluation: candidates, licences, health, sizes, selection, rejection reasons.
4. Before/after eval-set scores for the recommended approach.
5. Payload size delta, gzipped.
6. A go/no-go on Phase 2's snippet requirement: **can the result row show real official text within the size budget, yes or no.** This is the single answer Epic 12 is blocked on.
