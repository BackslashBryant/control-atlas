# Cybersecurity trunk spine + voice pass — 2026-07-31

Owner directive: trunk = "Cybersecurity" (supersedes the RMF/Governance trunk in
`docs/tree-model.md` as it stood 2026-07-26 — see Part A.0). Full spec, written
so a fresh session can execute without re-deriving context. Source review:
`product_review_reports/control-atlas/2026-07-30_spr-03/`.

**Do not push or merge without fresh owner authorization** (repo-standard
constraint, see `docs/STATE.md` history). One part per session unless the owner
says otherwise. Update `docs/STATE.md` at the end of every session per
`docs/guardrails/SESSION.md`.

**Ground truth, verified against the current build (v1.0.2):**
- `data/generated/nodes.json`: 11,674 nodes. `edges.json`: 22,273 edges.
- 6,210 nodes (53.2%) have no structural parent. 5,154 are `disa-cci` requirement
  nodes, 1,014 are `nist-800-53a` assessment_procedure nodes. Together 99% of
  the orphan population.
- `scripts/hierarchy-derivation.mjs` already exists and is tested
  (`tests/hierarchy-derivation.test.mjs`, all passing) but is **not called**
  from `scripts/build-framework-data.mjs`.
- `src/ui/components/WhereThisSitsRail.tsx` today renders, verbatim, on every
  orphaned record (confirmed live on `disa-cci:CCI-000015`): *"Structural path
  unavailable. Control Atlas will not infer a parent from applicability,
  mappings, implementation, assessment, or evidence links."*
- `src/ui/lib/atlasDrilldown.ts` `SUPPORTED_FRAMEWORKS` hard-codes 4 of 16
  catalogs (`nist-800-53`, `csf-2`, `cmmc-2`, `mitre-attack`).
- `src/app/structural-hierarchy.mjs` `sharesNativeStructuralDomain()` requires
  parent and child to share `metadata.catalog_id`. **Do not loosen this** —
  it is why the 800-53 family/control/enhancement tree is trustworthy. The new
  work adds a second, clearly-labeled relationship class instead.

---

## PART A — the Cybersecurity trunk spine

### A.0 — Rewrite `docs/tree-model.md` §2 and §6

**FILES:** `docs/tree-model.md`
**GOAL:** Replace the RMF/Governance-trunk model with the owner's Cybersecurity-trunk model. This is a doctrine edit, not a code edit — read the whole file first (421 lines), then edit surgically; do not lose §3 (three relationship classes), §4 (CCIs are junctions), §7 (record anatomy), §8 (disclosure order) — none of those change.

Replace §2's tree diagram and the "Layer by layer" prose for ENVIRONMENT/ROOTS/TRUNK/MAJOR BRANCHES with:

```text
SOIL / CONTEXT
Mission • Systems • Data • Environment • Threats

ROOTS
Authorities • Law • Policy • Standards • Source material

TRUNK
Cybersecurity

LIMBS
Governance · Risk · Compliance · Architecture · Implementation
· Assessment · Operations · Threats & Defense · Knowledge
```

- **SOIL/CONTEXT** replaces ENVIRONMENT, unchanged in meaning (Start Here's job is unchanged).
- **ROOTS** unchanged in meaning.
- **TRUNK** is now literally "Cybersecurity" — not a process. It carries no
  content of its own; it exists so every limb has one visible common ancestor.
- **LIMBS** replace TRUNK (governance/RMF) + MAJOR BRANCHES (frameworks) as a
  single tier. RMF, roles, inheritance, reciprocity, common controls move
  *into* the Governance limb as content, not as the spine. Framework
  classification (control catalog / risk framework / outcome framework /
  authorization program / certification program / control-selection method /
  implementation standard / threat knowledge base / defensive knowledge base)
  is preserved — it now lives inside the Compliance and Implementation limbs,
  same table, same meaning.
- BRANCHES (internal framework structure), TWIGS, JUNCTIONS, LEAVES, FRUIT,
  ACORNS are **unchanged** — keep every word of §2's existing prose for those,
  just re-point the diagram's arrows to hang off LIMBS instead of MAJOR
  BRANCHES.

Update §6's surface table: "Atlas — Understand the whole tree" stays the same
job. Add one row underneath it: `Limb assignment | Every published catalog
belongs to exactly one limb | see docs/plans/cybersecurity-trunk-and-voice-2026-07-31.md Part A.1`.

Add a new §3.5 "Class 4 — Organizing (Control Atlas's own structure)":

```text
organizes
```

This is the trunk, the limbs, and every catalog→limb attachment. It is **not**
`contains` and must never be reported as publisher-declared. Every UI surface
that renders an `organizes` hop must visually mark it as Control Atlas's own
organizing layer (badge text: "Control Atlas structure", not a source name).
The two derived parentages in A.2 (CCI→control, assessment procedure→control)
are also `organizes`, not `contains` — they are real structural facts (the CCI
already cites the control) but they are *derived*, not published as containment
by DISA, so they get the same visible badge.

**DONE-WHEN:** `docs/tree-model.md` reads coherently top to bottom, §3 lists 4
classes, §4/§7/§8 untouched. No code changes in this step.

---

### A.1 — The spine data file

**FILES:** new `data/curated/tree-spine.json`
**GOAL:** One declarative file: the trunk, the 9 limbs, and which limb every
published catalog attaches to. This is Class-4 (`organizes`) data, hand-authored,
not derived.

```json
{
  "trunk": { "id": "atlas:TRUNK", "label": "Cybersecurity" },
  "limbs": [
    { "id": "atlas:LIMB-GOVERNANCE", "label": "Governance", "blurb": "Who decides, who signs, and under what authority." },
    { "id": "atlas:LIMB-RISK", "label": "Risk", "blurb": "How bad it would be, and how much of that you accept." },
    { "id": "atlas:LIMB-COMPLIANCE", "label": "Compliance", "blurb": "The control sets you are measured against." },
    { "id": "atlas:LIMB-ARCHITECTURE", "label": "Architecture", "blurb": "How the system is supposed to be built." },
    { "id": "atlas:LIMB-IMPLEMENTATION", "label": "Implementation", "blurb": "The settings that make a control real on a box." },
    { "id": "atlas:LIMB-ASSESSMENT", "label": "Assessment", "blurb": "How someone proves the control works." },
    { "id": "atlas:LIMB-OPERATIONS", "label": "Operations", "blurb": "Keeping it true after the ATO." },
    { "id": "atlas:LIMB-THREAT", "label": "Threats & Defense", "blurb": "What the adversary does, and what stops it." },
    { "id": "atlas:LIMB-KNOWLEDGE", "label": "Knowledge", "blurb": "Guides, templates, crosswalks, and communities." }
  ],
  "catalogLimbs": {
    "nist-800-53": "atlas:LIMB-COMPLIANCE",
    "nist-800-53b": "atlas:LIMB-COMPLIANCE",
    "fedramp-rev5": "atlas:LIMB-COMPLIANCE",
    "nist-800-171": "atlas:LIMB-COMPLIANCE",
    "nist-800-171-rev2": "atlas:LIMB-COMPLIANCE",
    "nist-800-172": "atlas:LIMB-COMPLIANCE",
    "csf-2": "atlas:LIMB-COMPLIANCE",
    "cmmc-2": "atlas:LIMB-COMPLIANCE",
    "cui-policy": "atlas:LIMB-COMPLIANCE",
    "nist-ssdf": "atlas:LIMB-COMPLIANCE",
    "nist-ai-rmf": "atlas:LIMB-COMPLIANCE",
    "dod-rai": "atlas:LIMB-GOVERNANCE",
    "nist-800-37": "atlas:LIMB-GOVERNANCE",
    "fips-200": "atlas:LIMB-GOVERNANCE",
    "fips-199": "atlas:LIMB-RISK",
    "disa-cci": "atlas:LIMB-IMPLEMENTATION",
    "disa-srg": "atlas:LIMB-IMPLEMENTATION",
    "disa-stig": "atlas:LIMB-IMPLEMENTATION",
    "nist-800-53a": "atlas:LIMB-ASSESSMENT",
    "mitre-attack": "atlas:LIMB-THREAT",
    "mitre-attack-ics": "atlas:LIMB-THREAT",
    "mitre-d3fend": "atlas:LIMB-THREAT",
    "dod-zt": "atlas:LIMB-ARCHITECTURE"
  }
}
```

This is a starting draft (all 22 catalogs present in `data/generated/nodes.json`
today are covered — verify with `node -e` against `catalog_id` values before
committing; if a new catalog appears later the build must fail loudly rather
than silently drop it, see A.3). **Known lump to flag, not silently fix:**
FIPS-200 and FIPS-199 have no catalog root of their own in the current data
(their nodes attach directly) — confirm during A.3 whether they need a
synthetic catalog wrapper or attach as bare limb children; do not invent a
catalog node without checking `data/generated/nodes.json` first.

**DONE-WHEN:** file parses as JSON, `Object.keys(catalogLimbs).length` equals
the count of distinct `metadata.catalog_id` values with `node_type: "catalog"`
in `data/generated/nodes.json` (16 today, verify against current data since
build inputs may have changed).

---

### A.2 — Extend `scripts/hierarchy-derivation.mjs`

**FILES:** `scripts/hierarchy-derivation.mjs`, `tests/hierarchy-derivation.test.mjs`
**GOAL:** Add the assessment-procedure derivation (mirrors the existing CCI
one) and the editorial-spine attachment. Read the whole current file first (94
lines) — it already exports `pickCanonicalCciParent` and
`deriveCciHierarchyParents`; do not change their signatures or behavior, RS-sweep
their two callers if you touch them.

Add:

```js
/**
 * An assessment_procedure's structural parent is the control/enhancement it
 * assesses — already recorded as a published `assesses` edge. This is a
 * reversal, not a guess: every assessment_procedure has exactly one `assesses`
 * target in the current data (verify this invariant; if a procedure ever has
 * more than one, keep the first in edge-array order and report the rest via
 * `extraTargets` rather than silently discarding — do not assume the invariant
 * holds forever).
 *
 * @param {Array<{source_id: string, target_id: string}>} assessesRelationships
 * @returns {{ parents: Map<string, {controlId: string}>, extraTargets: Map<string, string[]> }}
 */
export function deriveAssessmentProcedureParents(assessesRelationships) {
  const parents = new Map();
  const extraTargets = new Map();
  for (const rel of assessesRelationships) {
    if (parents.has(rel.source_id)) {
      const list = extraTargets.get(rel.source_id) || [];
      list.push(rel.target_id);
      extraTargets.set(rel.source_id, list);
      continue;
    }
    parents.set(rel.source_id, { controlId: rel.target_id });
  }
  return { parents, extraTargets };
}

/**
 * Attaches every catalog root with no structural parent to its limb (from
 * tree-spine.json's catalogLimbs), and every limb to the trunk. Pure function
 * over already-loaded spine data — no file I/O here, caller loads the JSON.
 *
 * @param {{id: string}[]} catalogRoots - node_type === "catalog" nodes
 * @param {{trunk: {id: string}, limbs: {id: string}[], catalogLimbs: Record<string,string>}} spine
 * @param {(catalogNode: object) => string} catalogIdOf
 * @returns {{ organizesEdges: Array<{source_id: string, target_id: string}>, unassigned: string[] }}
 */
export function deriveEditorialSpine(catalogRoots, spine, catalogIdOf) {
  const organizesEdges = [];
  const unassigned = [];
  for (const limb of spine.limbs) {
    organizesEdges.push({ source_id: spine.trunk.id, target_id: limb.id });
  }
  for (const root of catalogRoots) {
    const limbId = spine.catalogLimbs[catalogIdOf(root)];
    if (!limbId) {
      unassigned.push(root.id);
      continue;
    }
    organizesEdges.push({ source_id: limbId, target_id: root.id });
  }
  return { organizesEdges, unassigned };
}
```

Add matching tests to `tests/hierarchy-derivation.test.mjs` in the same style
as the existing 6 (see the file for the exact `assert.deepEqual` idiom used):
one for the single-target case, one for the extra-targets case, one for
`deriveEditorialSpine` producing the right edge count (`limbs.length +
catalogRoots.length` when every root resolves), one for an unassigned catalog
landing in `unassigned` rather than being silently dropped.

**DONE-WHEN:** `node --test tests/hierarchy-derivation.test.mjs` — all tests
pass, old and new.

---

### A.3 — Wire the derivation into the data build

**FILES:** `scripts/build-framework-data.mjs`, `src/app/structural-hierarchy.mjs`
**GOAL:** Emit `organizes`-class edges into `data/generated/edges.json` for
(a) the trunk/limb/catalog spine, (b) CCI→control, (c) assessment_procedure→control.

In `src/app/structural-hierarchy.mjs`:
```js
export const RELATIONSHIP_CLASSES = Object.freeze({
  structural: "structural",
  applicability: "applicability",
  correlation: "correlation",
  organizing: "organizing",   // ADD — Control Atlas's own spine, never publisher-declared
});

export const ORGANIZING_RELATIONSHIP_TYPES = new Set(["organizes"]);  // ADD
```
Do not add `"organizes"` to `STRUCTURAL_RELATIONSHIP_TYPES` and do not touch
`sharesNativeStructuralDomain` — the whole point is these stay separate checks.
RS-sweep `RELATIONSHIP_CLASSES` (it is imported in at least
`ancestor-path.mjs`, grep repo-wide before editing, per CODE.md C12).

In `scripts/build-framework-data.mjs`, after the existing edge-generation pass
(find where `edges.json` is assembled — read the file's structure first, do
not guess the insertion point), add a step that:
1. Loads `data/curated/tree-spine.json`.
2. Collects every `assesses` edge already in the in-memory edge list, feeds it
   to `deriveAssessmentProcedureParents`.
3. Collects the existing `cci-to-800-53.json` and `cci-to-800-53-rev4.json`
   relationship arrays (already loaded elsewhere in this file for the existing
   `maps_to` edges — reuse that loaded data, do not re-read the files), feeds
   candidate lists to `deriveCciHierarchyParents` per its existing signature.
4. Calls `deriveEditorialSpine` with every `node_type: "catalog"` node.
5. Emits one `organizes`-class edge per resolved parent:
   `{ id, source_node_id: <parent>, target_node_id: <child>, relationship_type: "organizes", relationship_class: "organizing", publication_status: "editorial", provenance_class: "control_atlas_derived", rationale: <one line stating the join used> }`.
   **`publication_status` must never be `"published"`** — grep every place
   the codebase checks `publication_status === "published"` (used at least in
   `src/ui/lib/atlasDrilldown.ts`) and confirm `"editorial"` is excluded by
   every one of them, so `organizes` edges never leak into a surface that
   assumes publisher fact.
6. Logs a summary: counts of CCIs/procedures resolved vs. unresolved, and any
   `unassigned` catalogs from step 4 — fail the build (non-zero exit) if
   `unassigned` is non-empty, per the "fail loudly" note in A.1.

**BASELINE (run before editing):** `npm run test:data` — record pass/fail
count now.
**DONE-WHEN:** `npm run build:data` completes, `data/generated/edges.json`
contains `relationship_type: "organizes"` edges, `npm run test:data` still
passes at the same or better count than baseline.

---

### A.4 — Extend the ancestor-chain walk to fall back to `organizes`

**FILES:** `src/app/ancestor-path.mjs`, `src/ui/lib/ancestorPath.ts`
**GOAL:** When a node has no `structural` parent, walk one `organizes` hop
instead of stopping — and mark that hop so the UI can badge it. Read
`src/app/ancestor-path.mjs` in full first (this is the underlying `.mjs` that
`ancestorPath.ts` wraps — the wrapper's current exports are fixed in the
earlier session; do not change the wrapper's public shape without also
updating every caller, which today is only `WhereThisSitsRail.tsx`).

Change the per-link return shape to carry origin:
```ts
export type AncestorLink = {
  id: string;
  label: string;
  node_type: string;
  origin: "structural" | "organizing";   // ADD, required, not optional
};
```
RS-sweep `AncestorLink` (CODE.md C12 — enum-like field addition): every
consumer must handle both origins, not just ignore the new field.

Walk order in `buildAncestorGraph`/`ancestorChain`: prefer a `structural`
parent if one exists (current, unchanged behavior for the 46.8% that already
have one); if none exists, use the `organizes` parent if one exists; if
neither exists, the chain still ends at the node itself (unchanged — this is
still correct for e.g. a catalog root with only a trunk-side `organizes` edge
pointed *at* it from the limb, not *from* it).

**DONE-WHEN:** a new unit test in `tests/graph/ancestorPath.test.ts` (existing
file — extend, do not create a duplicate) asserts: a node with only an
`organizes` parent returns a 2+-link chain with the last-but-one link's
`origin === "organizing"`; a node with a `structural` parent still returns
`origin === "structural"` unchanged (regression guard).

---

### A.5 — `WhereThisSitsRail.tsx` badges the organizing hop

**FILES:** `src/ui/components/WhereThisSitsRail.tsx`, its stylesheet (find via
`grep -n "atlas-path-breadcrumb\|tree-path-rail" styles/*.css`)
**GOAL:** Read the current 79-line file in full (already quoted above in this
session's review — re-read live before editing, it may have moved). The
`unavailable` check currently fires whenever `chain.length === 1`; with A.4
shipped, a CCI's chain will now be length ≥ 2, so `unavailable` naturally stops
firing for CCIs and assessment procedures — **do not add a special case for
node type**, the existing length check is already correct once the chain is
populated.

Add: any `link` whose `origin === "organizing"` renders with a visually
distinct treatment (a muted label suffix or a small badge — match whatever
idiom `--ca-editorial` (`--lsm-orange`, already defined in `styles/tokens.css`)
is used for elsewhere in this codebase; grep `var(--ca-editorial)` before
inventing a new visual pattern, per CODE.md "creating a new instance of a kind
that already exists"). Add `aria-label` text noting "Control Atlas structure,
not publisher-declared" on that specific crumb, consistent with A.0's badge
requirement.

**DONE-WHEN:** live check on `#/record/disa-cci/CCI-000015` (build+serve
first) shows a populated chain, not the unavailable message; the organizing
hop is visually distinct from the structural ones; `npm run test:a11y:smoke`
passes.

---

### A.6 — Replace the 4-catalog allowlist with the spine

**FILES:** `src/ui/lib/atlasDrilldown.ts`
**GOAL:** Read the full 275-line file (already read this session — re-read
live, do not edit from memory). Replace `SUPPORTED_FRAMEWORKS` (11 hard-coded
entries covering 4 catalogs) with a spine-driven build: load
`data/curated/tree-spine.json` (via the same import mechanism the runtime
already uses for other curated data — grep `data/curated` imports in
`src/ui/lib/runtimeLoader.ts` for the pattern before inventing a new loader),
group `node_type: "catalog"` nodes by their `organizes`-edge parent limb, and
produce one `AtlasFrameworkGroup` per limb instead of one hard-coded group per
framework family.

This changes `AtlasDrilldownModel`'s shape from "4 named frameworks" to "9
limbs, each with N catalogs, each with the existing family/unit drill-down
unchanged below the catalog level" — the `units`/`records` logic inside each
framework (lines 173-250 today) is untouched; only the top-level grouping
changes. RS-sweep every import of `SUPPORTED_FRAMEWORKS`,
`buildAtlasDrilldownModel`, `AtlasFrameworkGroup`, and `NIST_FRAMEWORK_ID`
(CODE.md C12) — `NIST_FRAMEWORK_ID` is also used outside this file for the
default framework selection; do not remove it if it still has other callers,
disposition each hit explicitly.

**DONE-WHEN:** `npm run test:graph` (includes
`tests/graph/atlasDrilldown.test.ts` if that exists — check; if not, add
coverage there) passes; live check shows all 16 catalogs reachable through
some limb, not just 4.

---

### A.7 — Explore landing renders the trunk and limbs

**FILES:** `src/ui/pages/AtlasMapPage.tsx`
**GOAL:** Read the full file live (partially read this session, 135+ lines
seen, file is longer — read to the end before editing). Replace the current
landing state (three text rows: "A published structure" / "The RMF process" /
"Browse publications", per `evidence/screenshots/desktop-explore-atlas.png` in
the review) with a rendering of the trunk + 9 limbs from A.6's grouped model.
Each limb is clickable and opens into its catalogs (existing `AtlasView`
routing — `path`/`map`/`list` — is unchanged; this only changes what renders
when no node is selected).

**Empty limbs (Assessment, Operations, Knowledge per the measured derivation)
must render, greyed, with the label "Not yet loaded" — do not hide them.**
This is a direct, named product decision (see review ATL-006 and the
2026-07-26 correction in `CLAUDE.md`: "Measuring a gap... is not the
deliverable... do not propose shipping a reduced-scope honest version" — the
resolution here is the opposite of hiding: show the gap, don't silently drop
the limb).

**DONE-WHEN:** `#/explore` with no query params renders 9 limbs (not 3 text
rows); `npm run test:e2e:smoke` and `npm run test:a11y:smoke` pass; live
screenshot at 1440×900 and 390×844 shows no empty lower-page space of the kind
flagged in review UX-003.

---

## PART B — voice and personality pass

You said you like the color scheme from the review artifact. Before touching
anything: **that palette is already this app's palette.** `styles/tokens.css`
defines a real, documented, named system — "Lunar Signal Modernism," an
adaptation of "Orbital Archive No. 01 v1.7.0" — with the same structure you
responded to: dark slate ground (`--lsm-graphite #253139`, `--lsm-orbit
#11181e`), a cyan-teal accent (`--lsm-relay #54bcd9`), a warm gold
(`--lsm-gold #cbae67`), a muted good-green (`--lsm-signal #7eb79e`), a rust
alert (`--lsm-fault #ea7468`). **Do not replace these tokens.** The personality
gap is not the palette — it is the copy, and the one device (`BrandFlourish`)
that was supposed to carry personality and doesn't quite land.

### B.0 — Baseline

**FILES:** none (read-only step)
**GOAL:** Before writing new copy, re-read `src/shared/product-identity.ts`
(8 lines, already quoted in this session — re-read live) and
`src/shared/brand-rotation.ts` (already quoted — re-read live) in full. Every
copy change below must stay inside the existing token system (font stacks
`--ca-font-display`/`--ca-font-body`, type scale `--ca-text-*`) — this is a
words-and-one-interaction-pass, not a redesign.

### B.1 — Home hero stops being the package.json description

**FILES:** `src/shared/product-identity.ts`, `src/ui/pages/HomePage.tsx`
**GOAL:** `PRODUCT_DEFINITION` is used verbatim as both `package.json`'s
`"description"` field and the Home hero paragraph — confirmed identical
strings. Split them: `package.json` can keep a generic one-liner for npm/GitHub
metadata; the hero gets copy that names a situation instead of describing a
corpus. Do not write final copy inside this spec — that is a creative task for
the execution session, but it must satisfy these constraints, checked before
shipping:
- Names a concrete situation ("you've been handed a system to get authorized",
  or similar — a real scenario, not a category).
- Does not repeat "the people doing the work" or any phrase twice on one
  screen (current defect, review UX-001).
- The two top cards ("Open the Atlas" / "Browse Catalog") get copy that makes
  their difference obvious without requiring the reader to already know the
  data model — state what each is *for*, not what it *contains*.
- Fill or deliberately end the page — do not leave ~45% of the 1440×900
  viewport as empty patterned background (review UX-002). The cheapest fix
  compatible with Part A: once A.7 ships, a compact preview of the trunk/limb
  spine (even just the 9 limb labels as a static strip, no interactivity
  required at this stage) belongs here and gives Home a reason to be taller.

**DONE-WHEN:** `package.json`'s `description` and the Home hero string are no
longer character-identical; live screenshot at 1440×900 shows no large empty
region below the fold; `npm run test:data` (covers
`tests/ui-copy-speakers.test.mjs`, `tests/content-review.test.mjs`) passes.

### B.2 — Start Here stops asking the question the visitor came to ask

**FILES:** `src/ui/pages/StartHerePage.tsx`
**GOAL:** Confirmed live: current heading is "FIND THE PUBLICATION YOU NEED"
over a flat list of 23 publications — functionally identical to Sources with a
different heading (review UX-005 / prior-run SYN-006). Replace with 2-3
situational questions (system type, whose rules apply, what stage you're at)
that route into a limb from Part A's spine rather than into a raw publication
list. This step depends on A.6/A.7 shipping first — sequence it after Part A,
not in parallel, or it has nothing to route into yet.

**DONE-WHEN:** live check shows Start Here asking about the visitor's
situation before showing any publication names; `npm run test:e2e:smoke`
passes.

### B.3 — Catalog synopses stop describing their own loading process

**FILES:** `src/ui/lib/catalogProfiles.ts`
**GOAL:** Confirmed live text: *"DISA SRG records loaded from the cited
publisher source. DISA - Not recorded."* Every one of the ~23 entries follows
this template and ends in a visible "Not recorded" placeholder. Write one real
sentence per catalog stating who it binds and when it applies (not how the
data got here), and suppress the trailing date clause entirely when no date
exists rather than printing "Not recorded". Grep the file for the template
string before editing (CODE.md C3/C8 — this is a duplicated-then-adapted
pattern across ~23 entries; confirm you're editing the one shared template
function, not 23 separate strings).

**DONE-WHEN:** live check on `/#/catalog` shows no "Not recorded" text and no
two catalogs sharing the exact same synopsis sentence structure verbatim.

### B.4 — The rotating hotkey becomes a real feature, not a decoration

**FILES:** `src/shared/brand-rotation.ts`, `src/ui/components/BrandLockup.tsx`,
`src/ui/App.tsx`
**GOAL:** `BrandFlourish` already renders as a styled keycap — `Ctrl + Alt +
<rotating verb>` — next to real `Ctrl`/`Alt` keycaps, and each `BRAND_ACTIONS`
entry already carries a `surface` field (`atlas`, `search`, `catalogs`,
`compare`, `build`, `sources`, `learn`). Today it is pure decoration and reads
as an actionable hotkey without being one (review UX-006 / prior-run SYN-010).
Make it real: `src/ui/App.tsx` already has a global `keydown` listener (see
`event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k"` around
line 351, wired to open Search) — extend that same listener, do not add a
second one, so `Ctrl+Alt+<first-letter-of-currently-displayed-word>` navigates
to that word's `surface`. Read `BRAND_ACTIONS` — several words share a surface
(`Trace`→sources, `Inspect`→sources, `Verify`→sources, `Cite`→sources,
`Source`→sources) and some share a first letter (`Search`/`Source`,
`Create`/`Compare`/`Connect`) — resolve collisions by matching the *currently
displayed word* exactly (the flourish already tracks which word is showing via
`wordRef`), not just its first letter, so there is no ambiguity.

Also trim `BRAND_WORDS` from 27 entries to a shorter list with more character
per word — this is the personality opportunity: right now it's a generic verb
list (Trace, Find, Search, Browse, Read...) that could describe any reference
site. Do not invent final wording in this spec; the execution session should
pick words that sound like this specific product (federal-cyber, structural,
tree-shaped) rather than generic search-app verbs — but every word kept must
still map to a real, working `Ctrl+Alt+<word>` shortcut once B.4 ships, so cut
list size for signal, not for its own sake.

**DONE-WHEN:** pressing `Ctrl+Alt+E` while "Explore" is displayed (or
whichever word/letter is live) navigates to that surface; `npm run
test:browser` (covers `tests/browser-contract.test.mjs`) passes; no keyboard
trap introduced (tab order unaffected — this is a global shortcut, not a focus
change).

### B.5 — Compare card copy and type scale

**FILES:** `src/ui/pages/ComparePage.tsx`
**GOAL:** Two separate fixes, both confirmed live: (1) card titles render
around 28px against ~13px body text inside the same card — a 2.2x jump that
makes the explanatory line read as a caption (review UX-004); decorative
corner brackets are drawn at a fixed inset and get crossed by text on 2 of 5
cards. Bring the title down to roughly `--ca-text-lg`/`--ca-text-xl`
(18-20px) against the existing body size, and either size the bracket
decoration to content or remove it. (2) run2's SYN-012 flagged "Mapping
source" vs. "Source basis" as ambiguous labels elsewhere on this page — grep
both exact strings, confirm which is legacy/dead and remove it rather than
leaving both.

**DONE-WHEN:** live screenshot at 1440×900 shows no text crossing a bracket
and no more than roughly 1.5x size ratio between a card's title and its body
text; `npm run test:data` (`tests/commons-presentation.test.mjs` or wherever
Compare copy contracts live — grep for the right test file) passes.

---

## Execution order and sequencing

Part A must ship before B.2 (Start Here needs the spine to route into) and
before the "fill Home's empty space" clause of B.1 (needs A.7's limb strip).
B.3, B.4, B.5 have no dependency on Part A and can run in either order, or in
parallel with Part A if using separate sessions/worktrees.

Suggested single-thread order for one continuous session:
**A.0 → A.1 → A.2 → A.3 → A.4 → A.5 → A.6 → A.7 → B.1 → B.2 → B.3 → B.4 → B.5**

Each step above already states its own DONE-WHEN check — run it before moving
to the next step, per `docs/guardrails/PLAN.md` P6 ("never carry more than one
failing step at a time"). After every 2-3 steps, run the full `npm test` as a
regression gate, not just the step's own narrow check.

## Final gate (before calling any of this done)

```bash
npm run lint
npm run typecheck
npm test
npm run test:browser
npm run test:a11y:smoke
npm run test:e2e:smoke
npm run build:site
```

All green, plus a live walkthrough (build+serve, browser) of: `/`, `/start`,
`/explore` (no params), `/explore?node=...` for one CCI and one assessment
procedure, `/catalog`, `/compare`, at 390×844 and 1440×900. Per repo standard:
**do not push or merge without fresh owner authorization**, even if every
check is green.
