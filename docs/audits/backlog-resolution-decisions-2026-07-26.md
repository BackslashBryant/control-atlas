# Backlog resolution decisions (2026-07-26)

Autonomous decision log for the seven-item backlog carried in `docs/STATE.md`
after the 2026-07-25/26 ship. Continues
[`grc-tree-completion-decisions-2026-07-25.md`](grc-tree-completion-decisions-2026-07-25.md).
Recorded for after-the-fact review, not as a request for approval.

## 1. CCI Rev 4 -> Rev 5 — the gap was mostly not a gap

The prior session left 1,258 isolated CCI records as an unbridgeable upstream
gap after three community leads failed. That conclusion was **partly wrong**, and
the measurement that disproves it is cheap:

- 1,301 of 5,137 CCI records carry no SP 800-53 Revision 5 reference.
- **1,069 of them cite a Revision 4 control id that exists verbatim in the
  Revision 5 catalog this repo already ingests** (`data/controls-800-53.json`).
  NIST kept the numbering; the correspondence is identity. No new source was
  needed for the large majority of the block.
- The residual 232 cite Revision 4 **Appendix J privacy controls**
  (AP/AR/DI/DM/IP/SE/TR/UL) plus five withdrawn controls.

Two NIST-published workbooks close nearly all of the residual, and both are
fetched and checksummed by `scripts/fetch-800-53-rev4-rev5-crosswalk.mjs`:

| Artifact | Use |
|---|---|
| `sp800-53r4-to-r5-comparison-workbook.xlsx` | withdrawn Rev 4 controls -> the Rev 5 controls that absorbed them ("Incorporated into MP-4 and SC-28") |
| `sp800-53r4-appj-to-r5-comparison.xlsx` | the 26 Appendix J privacy controls -> their Rev 5 homes |

**Result: isolated nodes 1,258 -> 44 (10.8% -> 0.4%).** Node count is unchanged
at 11,674 — nothing was invented; only edges were added (+1,506), and the count
matches the derived relationship count exactly.

**DECISION — the last 44 stay unmapped.** They are enhancements of withdrawn or
Appendix J controls (`SA-6(1)`, `PE-7(1)`, `DM-2(1)`, `TR-1(1)`, ...) plus `AR-7`,
which NIST explicitly annotates "No specific control reflects AR-7." NIST
documents only the **base** controls; mapping an enhancement to its base's
targets would be this project's assertion, not NIST's. Verified against the
workbook directly: no enhancement-level rows exist for these. Left honestly
unmapped and counted in `unresolved_legacy_controls`.

**DECISION — confidence is `derived`, not `direct`.** These edges compose two
published documents rather than restating one. The MAPS loop in
`build-framework-data.mjs` now honours a per-relationship `confidence`, and only
this map sets it. The existing UI label for `derived` ("Supported by source data
but may require contextual review") is accurate for a two-hop composition, so no
new copy was needed.

**DECISION — one source registry entry, `curated`, not `auto_synced`.** The
crosswalk is a frozen final publication, not a weekly feed, so it is deliberately
NOT wired into `refresh:data`. The Appendix J workbook rides in
`metadata.additional_artifacts` with its own checksum rather than getting a
second registry row.

## 2. Reflexive disclaimer sweep

Cut 4, kept 9. The test applied: does this sentence tell a working ISSM/ISSO
something specific and true they could act on, or is it a reflex?

**Cut**
- `TemplatesPage.tsx` section summary — "it is not an official form, approval, or
  proof" replaced with what the feature actually does.
- `TemplatesPage.tsx` "This is a working aid, not an official form..." — it sat
  immediately above `selectedTemplate.limitations`, which states the *specific*
  limits per template ("not directly importable into FedRAMP or eMASS"). The
  generic line restated them vaguely.
- `TemplatesPage.tsx` full `PRODUCT_DISCLAIMER` block — it was the page's
  **fourth** disclaimer, and `SiteFooter` already carries the site-wide notice
  once per page. `tests/content-review.test.mjs` only requires the disclaimer on
  the About page; nothing required it here.
- `CompareResultsPanel.tsx` "Reference aid only — not an official government
  mapping. Verify every row..." — redundant with the `compare-provenance-note`
  and legend rendered directly beneath it (exact published/candidate/deprecated
  counts), and **factually wrong** for the rows sourced from NIST OLIR, which the
  same panel counts as published.

**Kept** — per-edge provenance/confidence/publication descriptions in
`copy.mjs`, `pagePrimitives.tsx`'s candidate tag, the stale-source warning in
`source-freshness.mjs`, the About page scope section, `SiteFooter`'s single
notice, the collapsed `LoadStatusPanel` details, the substantive Rev 2/Rev 3
guidance in `startHereRecommendations.mjs`, and the `Limit:` lines that travel
inside exported documents.

**NOTED (not done):** `src/app/app.mjs:842` has the same phrasing but is not in
the live UI — only `tools/agent-bootstrap.mjs` and
`tests/retired-concepts.test.mjs` reference that module.

### 2a. The largest instance was in the data, not the UI

`generatePlainLanguageRationale()` appended "Review both sides of this <rel> link
in <source> before assuming coverage transfers." to **every one of the 22,261
edges**, after restating the full rationale verbatim.

Two tests contradicted each other about it:
- `tests/federal-graph-contract.test.mjs:120` **required** the tail
  (`assert.match(..., /before|Compare|Review/i)`, "operational guidance missing").
- `tests/e2e/critical-path-matrix.spec.mjs:152` **forbade** it on screen
  (`not.toContainText("Review both sides of this")`).

**DECISION — remove the tail at the source and invert the data assertion.** The
owner's copy directive settles the contradiction. The contract test was not
deleted or loosened: it now asserts the retired phrasing does **not** reappear
and that the rationale is still substantive (>= 20 chars), which is a strictly
stronger guarantee in the dimension that still matters. Old vs new expectation
and the justification are recorded in the session transcript per DEBUG.md.

Side effect that mattered: this removed ~2.4 MiB of duplicated string from the
generated payload, which is what brought `data/` back under its 90 MiB budget
after the crosswalk pushed it to 91.78 MiB. **The budget in
`scripts/check-data-size.mjs` was NOT raised** — raising it would have been
silencing the gate.

## 3. Plain-English authority summaries

19 written, plus `nara-cui-registry` = 20. Each verified 2026-07-26 against the
document's own text, or against the copy of that source this repo already
ingests where the publisher blocks automated fetch.

The real defect was worse than "missing text": `AtlasMapPage.tsx` only rendered a
description for the three *non-default* dispositions, so every authority and
governance card in "Why does this apply?" rendered **title + link and nothing
else**. New `plainSummary` field on `SourceManifestRecord`; a source with no
entry renders nothing rather than the generated `sourceDispositionReason()`
boilerplate, per the owner's 2026-07-20 decision.

Verification notes worth keeping:
- The web summary of FIPS 200 claimed "13 control families" and then listed 17.
  The repo's own ingested `data/fips-200.json` has **17** records — used that.
  This is why the "verify against real source text" rule exists.
- CSF 2.0's page 404'd; verified 6 functions / 185 subcategories from
  `data/csf-subcategories.json`.
- `.mil` hosts return 403 to automated fetch (already recorded in STATE.md), so
  DoDI facts were verified from published titles plus this repo's ingested data.
- `AR-7` deliberately has no mapping, matching NIST's own annotation.

## 4. Record detail de-densification

`ObjectDetailPage.tsx` opened with "Where it appears" — one line of placement
detail behind a click — sitting *above* the Connections panel, i.e. friction
before the reason the page exists. It also had **three separate single-item
`Accordion.Root`s** interleaved through the body, so nothing coordinated.

Moved "Where it appears" below Connections and merged it with "Official text /
source excerpt" into one grouped disclosure. Accordion roots 3 -> 2; the payoff
now sits directly under "What this is". Verified in a screenshot, not inferred.

## 5. Orbital's 3rd "Systems" mode — dropped, final

`mode` drives exactly one thing in this app: an 8px decorative tick-ruler
(`styles/orbital.css:59`), hidden below desktop. It carries no semantics, no
behaviour, no layout. A third value buys a third decoration, not a third meaning.
Orbital's own definition (diagnostics / advanced settings / raw data entered
deliberately) describes no GovFrame route; the closest candidate, Sources, is
public reference reporting about published data.

Notably `docs/PRD.md:522` already **supports** the 2-mode implementation —
"operational Mission **and Systems** surfaces use restrained technical geometry"
groups Mission and Systems under one treatment. Docs and code already agreed; the
STATE.md note claiming a 3-mode/2-mode mismatch was stale. No code or PRD change.

## 6. Click friction

Measured, not estimated. Home -> Library -> catalog -> record is 3 clicks;
Commons lands directly on grouped collections; Atlas shows the six guided
questions immediately with source cards below. No unjustified click was found in
the landing flows. The one real friction defect found was structural and is fixed
in section 4 above (a click placed before the payoff on record detail).

Observation, not changed: record rows inside a catalog are `<button>`, not
`<a href>`, so they cannot be middle-clicked or opened in a new tab. Logged as
follow-up rather than fixed — it is a broader navigation refactor.

## 7. Designer QA pass

13 routes x 375 / 768 / 1440, screenshots eye-inspected rather than inferred from
exit codes.

**Zero document overflow on every route at every width.** Two candidate defects
investigated and resolved:
- `.link-action` used `justify-content: space-between`, which threw a button's
  icon to the far left and its label to the far right — it read as a layout bug.
  All 12 call sites are either icon+label or `<strong>ID</strong> — Title`; none
  wanted it. Changed to `flex-start`.
- An element appearing to escape the viewport on `/about` at 375px was the
  **collapsed** mobile nav sheet. Opened it and measured: `docW == viewW == 375`,
  zero visible escaping. Not a defect.

False positive worth recording: an automated probe reported `/start` as having
zero clickable affordances. The page uses a `<select>`, which the `a, button`
query missed. Start Here works.
