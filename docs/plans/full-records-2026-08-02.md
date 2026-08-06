# Full records, not partial ones — 2026-08-02

Owner direction: *"We should do 2... along with anywhere else where we are
lacking intuition on user needs and reasonable expectations. i.e. expecting
full records vs partial."*

This is a **data completeness** workstream, not a UI one. Written so a fresh
session can execute it without re-deriving context.

---

## 0. Standing rules for this repo (read before touching anything)

- `CLAUDE.md` routing table and iron rules apply. Read the guardrail doc the
  moment its row fires; `(cached)` is invalid after a compaction.
- **Never weaken a check to make it pass.** Quote the failure, propose the
  change, wait. Re-baselining a spec is only legitimate when the product
  deliberately changed — say so in the diff, in a comment, next to the change.
- Ship direct to `main`, no PRs (`memory/deploy-workflow.md`). Branch
  protection now requires a `checks` status, so the flow is: push the same
  commit to a throwaway branch, wait for Public Repo Checks, then push `main`,
  then delete the branch.
- Gates: `npm run precommit`, `npx playwright test --config
  playwright.e2e.config.mjs` (full, 141 tests), `npx playwright test --config
  playwright.visual.config.mjs` (separate config — easy to miss), and
  `tests/e2e/live-smoke.spec.mjs` before any Home copy change.
- Copy rules: no internal tree vocabulary in rendered text (guarded by
  `tests/content-review.test.mjs`), no build-speak, no cute closers. Read every
  string you write as a first-time visitor.

## 1. Item 3 of `docs/tree-model.md` §7 is closed — do not build it

"Why it exists" (a per-record rationale authored by Control Atlas) **should not
exist**, and neither should item 9 as an authoring job. Reasons:

- Epic 5 (2026-07-28) deliberately deleted the curated 800-53 translation
  dataset and its generator, establishing that public records show official
  text, source and relationship provenance — never product-authored guidance.
  Authoring per-record rationale would rebuild exactly what was removed.
- `PRODUCT_DECISION_BOUNDARY` says the people doing the work decide what
  applies and what counts. "What evidence supports this control" authored by us
  is a determination in all but name.

**The reader need behind both is real and is already answerable from published
sources**, which is the only acceptable way to meet it:

- *Why does this exist?* → the authority chain, already rendered by "Where this
  sits" (Cybersecurity › area › publication › family › control), plus the
  publisher's own Discussion text — **which we do not currently ingest** (§2).
- *What evidence supports it?* → NIST SP 800-53A already ships
  `assessment_methods` (EXAMINE / INTERVIEW / TEST), `assessment_objects`
  ("access control policy; system design documentation; …") and
  `assessment_objectives` per control. **All of it is already in the graph and
  none of it is on the record page.** Surfacing it is §3.

Record this decision in `docs/tree-model.md` §7 so it is not re-litigated.

## 2. Measured gaps (2026-08-02, against `data/generated/nodes.json`)

| catalog | records | truncated desc | empty desc | avg desc |
|---|---:|---:|---:|---:|
| nist-800-53 | 1,216 | **225** | 0 | 613 |
| nist-800-172 | 132 | **66** | 0 | 845 |
| nist-800-171 | 147 | **37** | 0 | 632 |
| csf-2 | 225 | 2 | 0 | 285 |
| mitre-d3fend | 278 | 0 | **271** | 2 |
| nist-800-53a | 1,014 | 0 | 0 | 62 (stub — real content is in metadata) |
| dod-zt | 227 | 0 | 0 | 68 |
| fedramp-rev5 | 4 | 0 | 0 | 54 |
| dod-rai | 13 | 0 | 0 | 52 |
| fips-200 | 17 | 0 | 0 | 104 |

Reproduce with the truncation/emptiness scan in the session log, or rewrite it:
count records whose `metadata.description` ends in `...`/`…` or is blank.

### 2a. The truncation is upstream, not in the graph build
`data/controls-800-53.json` — the curated source artifact — already holds AC-2
at 1,159 chars ending `"...[Assignment: frequency]..."`. The graph build
faithfully carries a truncated record. **Fixing the adapter will not help.**
The fix is to re-ingest 800-53 (and 800-171 / 800-172, same shape) from the
authoritative NIST OSCAL catalog, which publishes the complete control
`statement` parts *and* the `guidance` part (the Discussion). A
`nist-oscal-content` source already exists in the registry.

### 2b. Discussion / supplemental guidance is not ingested at all
No catalog node carries a `discussion` field. For 800-53 the Discussion is the
single most useful paragraph on the page for a newcomer — it is the publisher
explaining what the control is for. This is the honest, source-first answer to
"why does this exist".

### 2c. D3FEND is a shell
271 of 278 countermeasures have an empty description; `data/d3fend-countermeasures.json`
does not carry definition text. Either ingest D3FEND definitions properly or
stop presenting it as a browsable catalog — a catalog of 278 empty records is
worse than not having it.

## 3. Work, in priority order

1. **Re-ingest NIST 800-53 from OSCAL**: complete statement text, Discussion,
   related-control references, ODP definitions. Removes 225 truncations and
   adds the Discussion. Highest reader impact by a wide margin.
2. **Same treatment for 800-171 (37) and 800-172 (66).**
3. **Surface what 800-53A already has** on the record page: assessment
   objectives, methods and objects for the control being viewed. This closes
   tree-model item 9 from the publisher's own words. No new ingestion needed.
4. **D3FEND**: ingest definitions or retire the catalog. Decide explicitly.
5. **Re-measure the thin catalogs** (dod-zt, fedramp-rev5, dod-rai, fips-200).
   Short may be correct — FIPS 200 requirements genuinely are one-liners — but
   confirm against the publication rather than assuming.

## 4. The broader mandate: partial where the reader expects whole

Audit every surface for the same class of failure, which is *not* limited to
description text:

- A record page that shows a **preview** with "Read full official description"
  when the full text is present — check whether the disclosure is ever the only
  path to text the reader assumed they were already reading.
- Lists capped at N with no indication that a cap exists.
- Relationship groups showing "+N more in Connections below" — verify the
  Connections list actually contains all N.
- Any count rendered next to a list that does not match the list's length.
- Catalogs advertising a record count that includes wrapper nodes.

Rule to apply: **if the reader would reasonably assume they are seeing all of
it, they must be seeing all of it, or the page must say plainly that they are
not and where the rest is.**

## 5. Acceptance

- Zero descriptions ending in `...`/`…` across every catalog, or a documented
  reason per catalog where the publisher's own text ends that way.
- 800-53 records carry Discussion, and the record page shows it.
- A control's record page shows its 800-53A assessment objectives, methods and
  objects, attributed to SP 800-53A.
- D3FEND either has real definitions or is gone from the catalog surface.
- A test asserting the completeness invariant, so this cannot silently regress:
  extend `tests/federal-graph-contract.test.mjs` with a per-catalog truncation
  and emptiness budget.
- Full gate green (§0), live smoke green, and a browser walkthrough of a
  control, a STIG rule and an assessment procedure at 1440×900 and 390×844.
