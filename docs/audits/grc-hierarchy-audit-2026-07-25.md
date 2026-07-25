# GRC hierarchy audit — 2026-07-25

> **Status update (same day, after this audit was written).** Sequencing steps 1–3
> are DONE: the `catalogId === "nist-800-53"` gate is replaced by the declarative
> `CATALOG_TIERS` table in `scripts/build-framework-data.mjs`, and the `benchmark`
> (STIG 11 + SRG 18) and `family` (SP 800-171 Rev. 3 17, Rev. 2 14, SP 800-172 17)
> tiers are materialized. Graph: 11,486 -> 11,563 nodes, 16,207 -> 18,679 edges.
> **Unparented dropped from 88% to 67%**; fully isolated from 2,366 to 2,073.
> Every measurement in the body below is the pre-fix baseline at commit `4b65312`
> and is deliberately preserved as the historical record — steps 4-7 remain open.

Owner brief: *"in plain language categories we should be able to map the tree of
governance, Risk, and compliance from Roots>trunk>branches>twigs>leaves>etc."*
Triggered by the owner reporting that STIGs are not bucketed
(`STIG BENCHMARK > STIG RULE/Vuln ID`) and are rendering as flat dumps of Vuln IDs.

Scope: every catalog ingested by `scripts/build-framework-data.mjs`. Read-only —
no builder changes were made. All numbers measured against the committed
`data/generated/nodes.json` (11,486 nodes) and `data/generated/edges.json`
(16,207 edges) at commit `4b65312`.

## Headline

**10,089 of 11,486 nodes (88%) have no parent in the containment tree.**
**2,366 nodes (21%) have zero edges of any kind.**

The containment verb in this graph is `includes` (4,216 of 16,207 edges). Only
four node types are parented at all:

| node_type | total | unparented |
|---|---|---|
| `control` | 324 | 0 |
| `control_enhancement` | 872 | 0 |
| `zt_activity` | 156 | 0 |
| `zt_capability` | 45 | 0 |
| *everything else (17 types)* | *10,089* | *100%* |

## Root cause — one line

`scripts/build-framework-data.mjs:388`

```js
if (catalogId === "nist-800-53") {
```

Parent-tier construction is gated to a single catalog. Inside that gate,
`familyNodes` (`:399-423`) builds the 20 SP 800-53 family nodes, and
`addFamilyMembershipEdges` (`:567-594`) joins them to controls with `includes`
edges. No other catalog reaches that code.

Every catalog's grouping value *is* read — `:370` stores
`family: record.family || record.group || ""` on each node — but for every
catalog except `nist-800-53` it is stored and never used to create a tier node or
a containment edge. For STIG/SRG it is not even stored: `:365-383` copies a fixed
metadata shape that never reads `record.metadata.benchmark_id`, so all 603 STIG
rules carry `family: ""` (measured: 0 of 603 have a non-empty `metadata.family`).

## Category 1 — tier data present in the repo, discarded by the builder

Fixable now, no acquisition needed. These records name their parent in the source
file and have no parent in the graph.

| catalog | records | grouping field available | distinct tiers |
|---|---|---|---|
| `disa-srg` | 1,514 | `metadata.benchmark_id` / `benchmark_title` | 18 |
| `mitre-attack` | 697 | `family` (15) + `metadata.tactics` (35) | 15 |
| `disa-stig` | 603 | `metadata.benchmark_id` / `benchmark_title` | 11 |
| `nist-800-171` | 130 | `family` | 17 |
| `nist-800-172` | 115 | `family` | 17 |
| `nist-800-171-rev2` | 110 | `family` | 14 |
| `mitre-attack-ics` | 97 | `family` + `metadata.tactics` | 20 |
| `nist-ai-rmf` | 72 | `family` | 19 |
| `nist-ssdf` | 42 | `family` | 4 |
| `dod-rai` | 11 | `family` | 2 |

**3,391 records** with a named parent in the data and no parent in the graph.
Coverage of the grouping field is 100% of records in every row above, and 0
records are missing it.

## Category 2 — tier derivable from the record ID

The builder already does exactly this for SP 800-53 via
`familyCodeFromControlId`. The same trick applies elsewhere and is not used:

- **`csf-2` — 185 subcategories, currently a single flat list with no grouping
  field at all.** CSF 2.0's real hierarchy is Function > Category > Subcategory,
  and the IDs encode it (`GV.OC-03`). Derivable from `item_id`: **6 Functions**
  (GV, ID, PR, DE, RS, RC) and **34 Categories**. Two whole tiers absent.
- **`mitre-attack` — 493 of 794 techniques are sub-techniques** (`T1234.001`)
  that could nest under their parent technique, giving a second tier under tactic.

## Category 3 — genuinely flat upstream (acquisition problem, not a code problem)

| catalog | records | state |
|---|---|---|
| `disa-cci` | 5,137 | no grouping field in source; **1,258 fully isolated** |
| `mitre-d3fend` | 271 | no grouping field in source; 119 fully isolated |

Do not synthesize a hierarchy for these. CCI is the largest single block of
unparented nodes in the graph and needs a real upstream parent (the CCI list does
publish control references, already used for `references` edges) or an explicit
"flat by nature" statement in the UI.

## Category 4 — legitimate roots, and two genuine bugs among them

Correctly parentless (they are the top of the tree): `catalog` (4), `baseline`
(8), `rmf_step` (7), `impact_category` (3), `zt_pillar` (8).

Two that are wrong:
- **`family` (20) — the SP 800-53 family nodes have no parent themselves.** They
  should hang off the `nist-800-53` catalog node, so the tree is
  catalog > family > control > enhancement rather than a floating middle tier.
- **`zt_tenet` (5) — fully isolated, zero edges.** DoD ZT tenets should sit above
  pillars.

## Fully isolated nodes — the "0 connections" the owner saw, at scale

2,366 nodes have no edges whatsoever. `disa-stig:V-245869` from the owner's
screenshot is one of 145 isolated STIG rules.

```
disa-cci          1258      mitre-attack       387      mitre-attack-ics    97
csf-2               79      nist-800-172       115      disa-stig          145
mitre-d3fend       119      nist-ai-rmf         72      nist-ssdf           42
nist-800-171        33      dod-rai             11      dod-zt               6
cmmc-2               1      cui-policy           1
```

## Proposed target tree, in the owner's vocabulary

Measured tiers that exist today are marked ✅; absent tiers ❌.

| Tier | Plain-language question | Node types |
|---|---|---|
| **Roots** | Why does this apply to me at all? | statute / regulation / executive policy (`policy`, authority sources) |
| **Trunk** | Which framework organizes the work? | `catalog`, `rmf_step`, CSF Functions ❌ |
| **Branches** | Which grouping inside that framework? | `family` ✅ (800-53 only), CSF Category ❌, STIG/SRG `benchmark` ❌, ATT&CK tactic ❌, `zt_pillar` ✅ |
| **Twigs** | What is the actual requirement? | `control` ✅, `requirement`, `srg_requirement` ❌, CCI, `attack_technique` ❌, `zt_capability` ✅ |
| **Leaves** | What is the specific check? | `control_enhancement` ✅, `stig_rule` ❌, ATT&CK sub-technique ❌, `assessment_procedure` (attached by `assesses`, not `includes`) |

## External vocabulary to adopt rather than invent (owner-supplied, 2026-07-25)

**GSA FICAM Policy Map** — <https://www.idmanagement.gov/university/policymap/>
(fetched and verified 2026-07-25). A federal-published map of how policy documents
relate, using a five-tier legend:

1. Act of Congress
2. Executive Order
3. Federal Policy *(OMB circulars, memoranda, guidance)*
4. Technical Standard *(NIST specifications and standards)*
5. Guidance *(implementation and advisory documents)*

Documents are grouped by producing body (Congress; White House; OMB/DNI/OPM;
NIST/ISC/NSA/FedRAMP; GSA/CIO Council/ICAMSC/FPKIPA) and relationships are drawn
as arrows between documents.

Why this matters here: the Atlas "authority" tier currently classifies its 12
records with repo-local labels — "Statutory / Regulatory Authority", "Federal
Policy Authority", "NSS Authority", "DoD Policy Authority", "Contractual
Authority" (`src/ui/graph/sourceSeedManifest.ts:48+`). The FICAM tiers are a
published federal classification for exactly this, so the roots tier should adopt
them rather than keep ad-hoc labels. Note the DoD/contractual dimension is
orthogonal to FICAM's five tiers (a DFARS clause is still a "Federal Policy"
instrument published by DoD), so producing body should be a separate facet, which
is how FICAM itself does it.

**Important limitation, measured:** the Policy Map provides **no one-line
plain-language descriptions** — only document titles and their relationships. It
therefore does *not* close the outstanding gap of ~16 missing plain-English
summaries for the Atlas "Why does this apply?" records. That remains an authoring
task.

<https://www.cisa.gov/topics/cybersecurity-best-practices/cybersecurity-governance>
returned HTTP 403 to automated fetch (known .gov bot-blocking, see `## Open items`
in `docs/STATE.md`). Not assessed — a human should open it and confirm whether it
adds a tier vocabulary worth adopting.

## Recommended sequencing

1. **Generalize the parent-tier builder** — remove the `catalogId === "nist-800-53"`
   gate and drive tier construction from a declarative per-catalog table
   (`{ catalogId, tierNodeType, tierKeyField, tierLabelField }`). This is the
   scalable, maintainable shape the owner asked for: adding a catalog means adding
   a row, not a branch. One code path then fixes all 10 Category-1 catalogs.
2. **STIG + SRG `benchmark` tier** (owner-approved node type: a single
   `benchmark`, since DISA publishes both as XCCDF Benchmarks — the adapter
   parses `parsed.Benchmark` at `tools/importers/disa-stig-adapter.mjs:107`).
   +29 nodes, +2,117 `includes` edges.
3. **`family` tiers for the six NIST/DoD catalogs** already carrying `family`.
4. **CSF Function + Category tiers**, derived from `item_id`.
5. **Parent the orphaned middle tiers**: `family` → catalog, `zt_tenet` → above pillars.
6. **ATT&CK tactic tier + sub-technique nesting.**
7. **Decide CCI and D3FEND explicitly** — acquire a real parent or state flatness in the UI.

## Blast radius to plan for

- Node and edge counts change, invalidating hard-coded assertions at
  `tests/e2e/atlas-map-links.spec.mjs:45-46` ("11,486 records across 7 practical
  categories", "16,207 published links") and `docs/STATE.md` `## Facts`.
  Historical audit docs under `docs/audits/` record past runs and should not be edited.
- `node_type` registration surface for `benchmark` is 4 known points:
  `src/app/display-names.mjs:84` and `:131`, `src/ui/lib/recordTitle.ts:96`,
  `src/ui/lib/connectionInventory.mjs:15`.
- `src/ui/lib/connectionInventory.mjs` buckets node types into the seven practical
  categories shown on the Sources page; new tier types need a category.
- Visual baselines for record/library/atlas routes will move once records gain
  parent breadcrumbs.

## Reproducing this audit

Both probe scripts are in the session scratchpad, not the repo. They read only
`data/generated/nodes.json`, `data/generated/edges.json`, and `data/*.json`.
Re-derive with: containment = `edges` where `relationship_type === "includes"`;
unparented = nodes with no incoming containment edge; isolated = nodes with no
incoming and no outgoing edges.
