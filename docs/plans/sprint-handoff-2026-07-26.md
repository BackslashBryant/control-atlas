# Sprint handoff — 2026-07-26

Single-chat sprint spec, written after direct investigation of the repo. Every
claim below carries file:line or a measured number. Read this whole file before
your first tool call, then follow `CLAUDE.md` routing as normal — this file does
not replace the guardrails.

---

# Part I — Orientation

## 1. The philosophy this sprint serves

Owner, this session, and it overrides any contrary instinct you have:

> "Everything should have a parent. None of these sources were just created just
> to be created. Even if the parent is a pillar of cybersecurity like audit,
> assess, secure, etc. Our job is to help make those connections. That is our
> philosophy correct? I feel like we are getting lost in the same trap that I'm
> trying to help people navigate instead of clarifying and demystifying it for
> them as intended."

Read that as a standing rule. **When you find a gap in the hierarchy, close it —
do not report it as an honest limitation and move on.** "53% of nodes have no
parent, so we'll show three tiers and label the rest flat" is the failure mode
this project exists to fix. The product's entire promise is that a newcomer can
see how any one requirement connects up to a reason it exists.

The corollary for you: a record with no parent is a bug, not a data fact.

## 2. What is already done — do not redo, revert, or "improve" it

Four items are finished and verified, sitting uncommitted, awaiting the owner's
go-ahead. Evidence: `docs/STATE.md`, entries dated 2026-07-26 session 2 and 2.

| # | Done | Where |
|---|---|---|
| 1 | Type scale raised sitewide (`--ca-text-*`, base 15px→16px) | `styles/tokens.css` |
| 2 | "Gray highlighter" button chrome fixed (Tailwind preflight is skipped; bare `button` had native Chromium chrome) | `styles/base.css` |
| 3 | Button consolidation — 64 call sites / 18 files → shared `lsm/Button`; added `ButtonLink` + `secondary-quiet`; deleted duplicate `.primary`/`.secondary` rulesets | `src/ui/components/lsm/Button.tsx`, `styles/orbital.css`, `styles/surfaces.css` |
| 4 | Library catalog pages show families before the flat leaf list (`hasTiers = families.length > 1`) | `src/ui/pages/CatalogDetailPage.tsx` |

**Item 4 is a different surface from anything in Part III.** It fixed the
*Library catalog browse page*. It is not the hierarchy rail and not the Atlas
redesign. Do not report those as partially done because item 4 looks adjacent.

## 3. Non-negotiables

- **No push, merge, or deploy.** Commit locally, report, stop.
- **Never weaken a test** — no skips, deleted assertions, loosened thresholds,
  raised tolerances, `as any`, lint-disables. Quote the failure and ask.
- **Stage by path, never `git add -A`.** No `Co-Authored-By` trailer.
- **`data/` is at 89.58 MiB against a 90 MiB gate — 0.59 MiB headroom.** Part II
  is a data change and this constraint drives its design. Gate:
  `npm run check:data-size`.
- **Calm design**: no new badge or color noise; reuse existing disclosure idioms.
- Do not touch `src/ui/components/BrandLockup.tsx`.
- Do not start a dev/static server without confirming command and port.
- **`src/app/*.mjs` is LIVE, not legacy.** 23 files under `src/ui/` import it
  (e.g. `src/ui/lib/runtimeLoader.ts:1-2`). It is the plain-JS logic layer the
  React app consumes. Do not delete it.

## 4. Owner decisions locked this session

| Question | Decision |
|---|---|
| Tree depth | **Give everything a parent.** Do not ship a "3 tiers, rest are flat" compromise. |
| Template formats | **Word / Excel / PDF only.** Markdown, CSV, JSON, YAML are removed as user-facing download formats. |
| Atlas Map | **Redesign the navigation model.** "If I pick NIST, what next? If I pick RMF, what next?" Fixing wheel-zoom is not the deliverable. |
| Commons | **Fold into one surface** with Documents, and **rebrand the whole feature set** with a coherent naming system. |
| Naming system | **Approved as proposed** (§10): Start Here / Explore / Catalog / Compare / Build / Learn / Sources. No stop gate remains on this. |
| Canonical hierarchy | **[`docs/tree-model.md`](../tree-model.md) is doctrine and outranks this file.** Read it before any data work. |
| Tree vs. graph | **One primary tree for orientation, with overlays** for threats, technology, evidence, and lifecycle, so many-to-many stays honest. Never force everything into one literal hierarchy. |
| Nav labels vs. doctrine | The doctrine is "a doctrine call, not a naming and branding call" (owner). The §10 naming decision stands; the doctrine governs the model beneath it. |
| CCI → Assessment Objective | **Try derivation, fall back to an authoritative fetch** (W1.3b). |
| CCI with no resolvable objective | **Hang it on the control/enhancement.** Never orphan it; never fabricate an objective. |

---

# Part II — The hierarchy (the backbone; do this first)

## 5. What was measured

Run against `data/generated/nodes.json` + `edges.json` this session:

- Containment is `relationship_type: "includes"` (8,764 edges). Confirmed at
  `scripts/build-framework-data.mjs:974` and ~24 construction sites. Every other
  type (`maps_to` 6,238, `mitigates` 3,127, `references` 2,153, `assesses` 1,014,
  `supports` 834) is crosswalk/analytic, **not** containment.
- **Ancestor depth today:** depth 0 → 6,222 nodes; depth 1 → 219; depth 2 → 5,048;
  depth 3 → 185; depth 4+ → **0**. Only 1.6% reach depth 3.
- **The orphans, by type:** `requirement` 5,154 (of which **5,137 are DISA CCIs**),
  `assessment_procedure` 1,014 (all of SP 800-53A), `catalog` 16, `baseline` 8,
  `zt_pillar` 8, `zt_overlay_section` 8, `rmf_step` 7, `zt_document` 4,
  `impact_category` 3.
- **1,590 of 5,452 parented nodes have more than one `includes` parent** (29%).
  A single breadcrumb needs a canonical-parent tie-break rule.
- No cycles in the `includes` graph.
- **No ancestor-walk helper exists** in `src/ui/lib/`. The two "breadcrumbs" in
  the codebase are hardcoded: `ObjectDetailPage.tsx:315-321` and
  `AtlasDecompositionBoard.tsx:101-109`. You are building this from scratch.

## 6. Why the gap is closable without fabricating anything

Three separate measurements, all run this session:

1. **All 1,014 SP 800-53A assessment procedures carry `metadata.family` and a
   resolvable `metadata.nist_control`.** 1,014/1,014 resolve to a real
   `nist-800-53` node already in the graph. Free parenting, zero new data — the
   same trick that made item 4 cost nothing.
2. **CCIs have `metadata.nist_control === null` for all 5,137** — but they carry
   `metadata.references[].index` values like `"AC-1 a"`, *and* the Rev4→Rev5
   crosswalk shipped 2026-07-26 already created `maps_to` edges that took CCI
   isolation from 10.8% to 0.4%. **The CCIs are already connected; they are just
   not contained.** Their parent is derivable from edges that exist today.
3. **The roots layer already exists.** `node_type: "function"` holds exactly six
   nodes — GOVERN, IDENTIFY, PROTECT, DETECT, RESPOND, RECOVER — plus 34
   `category` nodes, from NIST CSF 2.0, with 225 internal `includes` edges. These
   are precisely the "pillars of cybersecurity" the owner named. **What is missing
   is one bridge: there are zero edges between CSF and SP 800-53.**

NIST publishes that bridge officially (the CSF 2.0 ↔ SP 800-53 Rev 5 informative
references / OLIR crosswalk). This repo already has a working pattern for fetching
and checksumming exactly this kind of NIST workbook:
`scripts/fetch-800-53-rev4-rev5-crosswalk.mjs`, wired as
`npm run fetch:rev4-crosswalk`. **Copy that pattern. Do not invent a mapping.**

## 6a. The canonical chain (owner-specified, 2026-07-26)

The owner supplied the authoritative model. **Follow it exactly — do not
re-derive or simplify it.**

```
Framework / Authority          (CSF function → catalog)
└── Control Family             AC — Access Control
    └── Control                AC-2 — Account Management
        └── Control Enhancement    AC-2(1)
            └── Assessment Objective   (the specific determination statement)
                └── CCI                CCI-000015
                    └── Technical implementation / assessment check
                        ├── SRG requirement
                        ├── STIG rule
                        └── SCAP / organization-specific check
```

**Every tier in that chain already exists as a node type in this graph:**
`catalog` 16, `family` 68, `control` 324, `control_enhancement` 872,
`assessment_procedure` 1,014 (these ARE the assessment objectives),
CCI 5,137 (`requirement` under `disa-cci`), `srg_requirement` 1,514,
`stig_rule` 603. **What is missing is the containment edges between the tiers,
not the tiers themselves.**

### The nuance that must not be lost

Quoting the owner:

> "CCIs are not a separate control hierarchy parallel to RMF. They are the
> lowest-level decomposition layer used to normalize and correlate individual
> requirements from RMF controls and other authoritative sources."

Three consequences you must honor:

1. **CCI identifiers do not encode hierarchy.** `CCI-000123` is not a child of
   `CCI-000122`, and the number tells you nothing about family or control. The
   hierarchy lives entirely in the CCI's references and mappings. Never infer
   structure from the id.
2. **The CCI layer is many-to-many, not a tree.** One CCI appears in multiple
   SRGs, STIGs, rules, and technologies; one STIG rule can reference multiple
   CCIs. The rail shows **one canonical chain** (per the W1.4 tie-break); every
   other correlation is real and must remain visible on the record as a
   *sideways* affordance, visually distinct from containment. Collapsing
   correlation into containment misrepresents the data.
3. **The CCI is a bridge, not a root.** Its parents and children come from
   mappings. Model it as a correlation layer that happens to have one canonical
   parent for navigation purposes — not as the top of its own family tree.

## 6b. Read the doctrine before writing any data code

**[`docs/tree-model.md`](../tree-model.md) is canonical and supersedes anything
here that contradicts it.** Owner-authored, 2026-07-26. It defines the ten layers
(Environment → Roots → Trunk → Major branches → Branches → Twigs → Junctions →
Leaves → Fruit → Acorns), the three relationship classes, the CCI junction model,
the record-page anatomy, and the disclosure order. Read it in full before touching
`scripts/build-framework-data.mjs` or any hierarchy code.

The three things in it most likely to be violated by accident:

1. **Three relationship classes must stay separate in the data and visually
   distinct in the UI.** *Structural* (`contains`, `parent_of`,
   `decomposes_into`) is the spine and the only thing the breadcrumb walks.
   *Applicability* (`selected_by_baseline`, `included_in_profile`,
   `modified_by_overlay`, `applicable_to`) renders as badges and filters.
   *Correlation* (`maps_to`, `implements`, `mitigates`, `assessed_by`, …) is the
   sideways graph. Going down the tree and going sideways to another framework
   must never look alike.
2. **Preserve each source's native hierarchy.** CSF is function → category →
   subcategory; ATT&CK is tactic → technique → sub-technique; CMMC is domain →
   practice → assessment objective; DISA is SRG → requirement → STIG → rule. Do
   not make every source pretend to follow the NIST control-family model.
3. **Classify every major branch by type** — control catalog, risk framework,
   outcome framework, authorization program, certification program,
   control-selection method, implementation standard, threat knowledge base,
   defensive knowledge base. Without this, users assume FedRAMP, RMF, CMMC, and a
   STIG are interchangeable. They are not.

## 7. W1 — Close the hierarchy

**W1.1 — Fetch the CSF ↔ 800-53 bridge.** New script modeled on
`scripts/fetch-800-53-rev4-rev5-crosswalk.mjs`: fetch NIST's published CSF 2.0
informative references, checksum the download, and emit mappings from CSF
subcategory/category → SP 800-53 Rev 5 control. Any control NIST does not map
stays unmapped and is reported — never guessed. Add an npm script for it.

**W1.2 — Parent the catalogs to functions.** Using W1.1's mapping, connect each
catalog's controls up to their CSF function. Where a catalog maps to several
functions, that is expected — the tie-break rule in W1.4 picks the canonical one
for the breadcrumb while the rest remain visible as additional context.

**W1.3 — Parent the remaining orphans.** In priority order:

**(a) 800-53A assessment procedures (1,014) — free, do this first.** These are the
**Assessment Objective tier** of the canonical chain, not leaves. All 1,014 carry
a `metadata.nist_control` that resolves to a real `nist-800-53` node — measured
1,014/1,014. Parent each to its control or enhancement. Zero new data.

**(b) CCIs (5,137) — the one genuinely hard join.** Per the canonical chain a
CCI's parent is its **Assessment Objective**, not the control directly. Measured
this session, joining CCI `metadata.references[].index` against 800-53A item ids:

| Join quality | Count |
|---|---|
| Exact objective-id match | 69 |
| Base-control-level match | 1,172 |
| **No match** | **3,896 (76%)** |

Root cause is visible in the reference data: CCIs cite **NIST SP 800-53A v1**
(Rev 1 numbering, `"AC-1.1 (i and ii)"`) while this repo's 800-53A catalog is
Rev 5 (`"AC-1"`, `"AC-11.1"`). Same revision mismatch already solved once for
controls by `scripts/fetch-800-53-rev4-rev5-crosswalk.mjs`.

**Owner decision — "try derivation, fall back to fetch." Execute both rungs:**

1. **Derive.** CCIs also carry a Rev 5 control reference (the reference list
   includes `NIST SP 800-53 Revision 5 v5`) with indices shaped like `"AC-1 a"` —
   control plus statement part. Parse into (control, part) and match the 800-53A
   Rev 5 procedure covering that part; the part detail lives in the procedure's
   `metadata.assessment_objectives`. **Measure and report the resolution rate.**
2. **Fetch, if a meaningful residue remains.** Follow the
   `fetch-800-53-rev4-rev5-crosswalk.mjs` pattern exactly: fetch DISA's current
   CCI list carrying Rev 5 references, checksum the download, derive from it, add
   an npm script. Never hand-author a mapping.

**Fallback when an objective genuinely cannot be resolved (owner decision):**
**hang the CCI on its control or enhancement.** The chain is one tier shorter for
that CCI, but every link in it is real and the CCI is never an orphan. Do not
fabricate an objective to keep the chain uniform, and do not hold the whole
Assessment Objective tier back — partial depth built from real links beats
uniform shallowness.

**(c) SRG requirements (1,514) and STIG rules (603).** These sit *below* CCIs in
the canonical chain. Verify their current parentage matches
`CCI → SRG requirement → STIG rule`; where a STIG rule references multiple CCIs,
the canonical rule (W1.4) picks one for the rail and the rest stay visible as
correlations.

**(d) The remaining 54 nodes — and this is where the doctrine changes the answer.**
They are not all spine members, and forcing them into the parent-child chain would
misrepresent the model. Sort them by relationship class first:

| Nodes | Class | Treatment |
|---|---|---|
| `baseline` (8), `zt_overlay_section` (8) | **Applicability** | **NOT tree parents.** A FedRAMP baseline does not own AC-2 — it selects and modifies from a catalog. Model as `selected_by_baseline` / `modified_by_overlay`; render as badges and filters. |
| `impact_category` (3) | **Environment** | Context filter, not a parent record. Belongs to the Start Here layer. |
| `catalog` (16) | Structural — Major branches | Parent to their authority/root, and classify each by type per doctrine §2. |
| `rmf_step` (7) | Structural — Trunk | The RMF lifecycle. Parent under governance. |
| `zt_pillar` (8), `zt_document` (4) | Structural — Branches | Preserve DoD ZT's native structure; do not remap onto NIST families. |

**Consequence for the W1 acceptance test:** "orphan count = 0" applies to
**structural spine members only**. Applicability and Environment nodes correctly
have no structural parent — that is the model working, not a gap. The test must
assert against node class, not against every node, or it will fail for the right
reasons and get weakened for the wrong ones.

**W1.4 — Canonical-parent rule.** 1,590 nodes have multiple `includes` parents.
Write one explicit, documented rule — recommended: prefer the parent in the same
`catalog_id` as the child; if still tied, prefer the shallower parent; if still
tied, lexical by id for determinism. Put it in a single pure function with unit
tests. The breadcrumb uses the canonical parent; other parents surface in the
record's connections, not the rail.

**W1.5 — Data budget: what the gates actually are.** `scripts/check-data-size.mjs`
enforces three separate limits, and they are not equally important:

| Constant | Line | Value | What it protects |
|---|---|---|---|
| `MAX_INITIAL_SEARCH_BYTES` | 7 | 3.2 MB | **The real one.** First-paint payload — what a visitor downloads before the site is usable. Do not touch it. |
| `MAX_FILE_BYTES` | 5 | 20 MiB | Per-artifact sanity check. |
| `MAX_DATA_BYTES` | 6 | 90 MiB | Total `data/` — repo and deploy size. **Self-imposed, not a platform limit.** |

The 90 MiB figure is a project choice, not a GitHub Pages ceiling; Pages permits a
far larger published site, and because records load in shards, total `data/` size
barely affects what any visitor downloads.

Even so: **use the compact representation, and not because of the gate.** Store
derived containment as a `parent_id` plus a `parent_derivation` enum naming the
rule that produced it, on the node itself. Minting 6,200 full `includes` edge
objects — 14 fields each, including rationale prose — to express "this hangs under
that" is the wrong shape for the data regardless of budget, and it would add
roughly 1.9 MiB against 0.59 MiB of headroom as a side effect.

Measure `npm run check:data-size` before and after; report both byte counts. If
your representation still breaches, **stop and report** with the numbers — raising
`MAX_DATA_BYTES` is the owner's call, not yours, even though it is a soft limit.

**W1.6 — The ancestor-walk utility.** New module in `src/ui/lib/` — pure,
synchronous, unit-tested: given a node id, return the canonical ancestor chain
root-first. It must handle multi-parent (via W1.4), missing parents (return the
partial chain, never throw), and must not walk forever if bad data ever
introduces a cycle.

**Acceptance for W1 — all four required:**
- Orphan count among **structural spine members** (excluding true roots, and
  excluding Applicability and Environment nodes per W1.3d) is **0**. Contract test
  asserts it by node class and is proven red against the current data first.
- Every edge carries an explicit relationship **class** — structural,
  applicability, or correlation — and a test asserts no structural edge is minted
  from a baseline, profile, or overlay relationship.
- Depth distribution reported before/after. Median depth ≥ 3.
- `npm run check:data-size` passes, with both byte counts in the report.
- No fabricated mapping: every derived parent traces to a named rule or a fetched
  authoritative source, and the rules are listed in the commit body.

---

# Part III — The surfaces

## 8. W2 — Navigation model: "if I pick NIST, what next?"

The owner's words: *"I want us to figure this out once and for all. Think through
the eyes of those that would use this. If I pick NIST, what next? If I pick RMF,
what should show next? Right now no matter what, I don't feel like I'm truly
navigating to an answer."*

That is the whole brief. The current Atlas fails it structurally, and here is
why, with evidence:

- `src/ui/pages/AtlasMapPage.tsx` is two unrelated products behind one route —
  `FocusedAtlas` (line 289) and `SourceAtlas` (line 626) — selected by
  `atlasView()` (line 60). Which one you get depends on state you did not
  knowingly set.
- `src/ui/components/RelationshipGraph.tsx:572` sets `panOnScroll`, so the mouse
  wheel **pans instead of zooming** — backwards from every map users know.
- `RelationshipGraph.tsx:563` sets `nodesDraggable`, so any click-drag silently
  destroys the computed ELK layout with no reset.
- `RelationshipGraph.tsx:571` `onNodeClick` → re-layout → `fitView` (lines
  416-421, 452). **Every single click re-centers and reflows the whole canvas.**
  You lose your place on every interaction. This, more than anything else, is the
  "hairpullingly frustrating" the owner named.

**The design principle to build to:** every step narrows the set, and every screen
states what the user now knows and what they are choosing next. A canvas that
reflows on click does the opposite — it re-presents everything, every time.

**Build a step-wise drill-down as the primary Atlas experience.** Three entry
axes, because there are exactly three things a person arrives knowing:

1. **"I know my framework"** — pick NIST 800-53 → *next:* which baseline
   (Low / Moderate / High)? → *next:* which family (the 20-ish real families)? →
   *next:* which control? → **land on the record**, which answers: what implements
   this (CCIs, STIG rules), how it is assessed (800-53A), what it defends against
   (ATT&CK), what it maps to elsewhere.
2. **"I know my process"** — pick RMF → *next:* which step (Prepare, Categorize,
   Select, Implement, Assess, Authorize, Monitor — 7 `rmf_step` nodes already
   exist) → *next:* what you produce at that step (documents) and what governs it
   (controls) → **land on either a document task or a control set.**
3. **"I know my situation"** — this is Start Here, which already exists and is the
   best-named surface on the site. Link to it; do not rebuild it.

Requirements:
- Each step is a plain list or card grid of choices with counts. No canvas.
- The chain of choices made so far is always visible and each link is clickable to
  step back — this is the **rail** from W1.6, rendered.
- Never more than one question on screen at a time (`Shallow > Wading > Deep`).
- Crosswalks are rendered as a **visibly different affordance** from containment.
  Going *down* the tree and going *sideways* to another framework must not look
  alike — conflating them is what makes the current graph unreadable.
- Keyboard and screen-reader navigable: semantic lists and links, no canvas, no
  layout solver on the primary path.

**The graph becomes one optional view behind a toggle, not the default.** When it
is shown, fix the three interaction bugs: wheel zooms (`panOnScroll` off), nodes
locked (`nodesDraggable={false}`), and no `fitView` on selection — add an explicit
"Reset view" control instead.

**Acceptance:** from the home page, a person who knows only "NIST" reaches a
specific control record in ≤ 4 choices, and at every step the screen names what
they have chosen and what they are choosing next. Same for "RMF". Demonstrate
both paths with screenshots at 375 / 768 / 1440, inspected.

## 9. W3 — Documents: Word / Excel / PDF only

**Root cause of "a .md file???", confirmed.** `TemplatesPage.tsx:710` sets
`dataFormats = selectedTemplate?.supported_formats || ["markdown"]`; line 713
builds the picker as `[...dataFormats, ...officeFormats]` — data formats **first**;
line 716 defaults `activeFormat` to `dataFormats[0]`. So the headline download
button (line 1341-1343) hands a GRC professional a raw `.md` file. Word and Excel
export already work (`src/app/office-export.mjs`, invoked at lines 846-876) but
are ranked second and never default.

Owner's decision: **Word / Excel / PDF only.**

- Remove markdown, CSV, JSON, and YAML as user-facing download formats. Check
  whether `generateTemplate` in `src/app/template-engine.mjs` is used anywhere
  else before removing its code paths — run REFERENCE SWEEP per
  `docs/guardrails/CODE.md` §RS1-RS5 on `supported_formats`, `FORMAT_LABELS`,
  `FORMAT_HELP`, and the format values themselves.
- Update the template registry data so `supported_formats` reflects reality
  rather than filtering at render time — the data should not claim formats the
  product no longer offers.
- **PDF does not exist yet.** `office-export.mjs` produces xlsx and docx only.
  Adding PDF is real work: check for a license-compatible, already-installed
  dependency first (per the owner's standing "don't invent what you can acquire"
  correction); if none exists, propose the library and its size before adding it —
  bundle weight matters on a static site.
- Add an **in-browser preview** of the actual document before download. A
  "Structure preview" listing column headers already exists (lines 1432-1446); it
  is not the same thing and is not sufficient. Nobody should click Download blind.

**Acceptance:** every template offers only Word, Excel, and/or PDF; the default is
an office format; the document is visible on screen before download; a test asserts
no template advertises a removed format.

## 10. W4 — Fold Commons in, and rebrand the feature set

**Why folding is right, with evidence:** "Commons" does not appear in `docs/PRD.md`
even once — the PRD's IA names Start Here, Library, Compare, Patterns, Templates,
Sources. Commons was added later without a PRD home. Meanwhile `TemplatesPage.tsx`
*already* renders official artifacts (`OfficialArtifactCard`, line 212) **and**
third-party tools (`ToolCard`, line 439) — and Commons is 99 curated external
resources in `data/commons-resource-dataset.json` (field: `canonicalUrl`). Three
surfaces serve "outside stuff." That overlap is the "disconnected components"
complaint in structural form.

**Fold Commons into the Documents surface**, grouped by kind: official artifacts,
tools, community resources. One destination, one nav item removed.

### Proposed naming system

The owner asked for a branded name for this feature and all the others. The
governing constraints: the newcomer is THE user; the design principle is "bring
calm to the storm"; and today's nav mixes metaphors (Atlas, Library, Commons)
with plain verbs (Compare, Guides, Documents). One vocabulary, plain-language,
verb-led — a newcomer should know what a tab does without clicking it.

| Today | Proposed | The job it does |
|---|---|---|
| Start here | **Start Here** | Three questions → your path. Best name on the site; unchanged. |
| Atlas | **Explore** | Pick a framework or a process, narrow step by step, land on an answer. |
| Library | **Catalog** | The complete reference, browsable by catalog → family → record. |
| Compare | **Compare** | Two frameworks side by side. Already plain; unchanged. |
| Documents + Commons | **Build** | Everything you need to produce something: starter documents, official artifacts, tools, community resources. |
| Guides | **Learn** | How the work is done, end to end. |
| Sources | **Sources** | Where every fact came from, and how fresh it is. Unchanged. |

**This table is approved. Execute it — no stop gate.**

Two notes carried for the record, not decisions to reopen:

1. Renaming Atlas → **Explore** deliberately resolves the confusion of a nav item
   sharing the product's name; "Control Atlas" now names the whole site rather
   than one tab.
2. **Build** replaces Documents because it must cover the folded-in tools and
   community resources, which "Documents" did not.

### Rename execution

- Run the full REFERENCE SWEEP (`docs/guardrails/CODE.md` §RS1-RS5) with **no**
  file-type filter. `commons` appears in routes (`src/ui/lib/hashRoutes.ts:22-23,
  42-43, 57-59`), nav (`src/ui/lib/navigation.ts:54-60`), pages, CSS class names,
  test specs, generated data (`data/generated/commons-search-index.json`), npm
  and workflow scripts (`scripts/build-commons-index.mjs`,
  `scripts/check-commons-health.mjs`, `.github/workflows/commons-update.yml`).
- **Rename only what the user sees** — nav labels, headings, copy, routes.
  **Leave internal identifiers, generated filenames, and build scripts alone.**
  Renaming those churns generated data against a 0.59 MiB budget and disturbs the
  known `commons-search-index.json` ship-blocker documented in `docs/STATE.md`.
  Add a one-line comment wherever the user-facing name and the internal name
  diverge.
- Keep working redirects from every old route.
- **Lane tabs**: the "lazy gray highlighter" styling was rejected. Note the global
  gray-button bug is already fixed (item 2) — the lane tabs are a separate
  offender. Reuse an existing disclosure idiom; do not invent a new tab pattern.

## 11. W5 — Deep links into lazily-sharded records

**The single biggest pre-existing defect, and the root cause is now known.**

Traced this session:
- `data/generated/library-search-manifest.json` lists 23 catalog shards.
  **Only 3 are eager** (`nist-800-53`, `csf-2`, `fedramp-rev5`). The other 20 —
  `disa-cci`, `disa-stig`, `mitre-attack`, `cmmc-2`, etc. — load lazily **one at a
  time, sequentially**, on `requestIdleCallback` with a 100ms `setTimeout`
  fallback: `src/ui/lib/runtimeLoader.ts:306-345`.
- A record page needs two lookups. `getNode` reads the full `nodes.json`
  (`src/app/runtime.mjs:1090-1091`) and succeeds. `getLibraryDocument`
  (`runtime.mjs:1093-1095`) reads the shard map and returns null until that
  catalog's shard reaches the front of the idle queue.
- `src/ui/pages/ObjectDetailPage.tsx:220-223` renders **"Item not found"** on
  `if (!node || !document)` — collapsing "shard still queued" and "record does not
  exist" into one message.
- `src/ui/App.tsx:461` gates only on `bundle.graphReady` (the full graph), not on
  whether the specific shard for the requested record has loaded.
- **The index needed to fix this already exists.**
  `data/generated/atlas-node-index.json` is `{schema_version, generated_at,
  atlas_nodes}` where `atlas_nodes` holds `[id, node_type, item_id, title,
  catalog_id]` for all 11,674 nodes — a complete id → catalog_id map. It is
  currently read only by `loadAtlasNeighborhood` (`runtimeLoader.ts:199-221`) for
  an unrelated feature, and never consulted to prioritize a deep link.

**The fix, in two parts:**
1. On a cold deep link, look up the requested id's `catalog_id` in
   `atlas-node-index.json` and **priority-fetch that shard immediately**, jumping
   the idle queue.
2. **Split the guard at `ObjectDetailPage.tsx:220`**: node absent from the full
   graph → a true, honest not-found. Node present but its document shard still
   loading → a loading state that resolves when the shard lands. These are
   different conditions and must render differently.

Failure paths are mandatory (`CODE.md` C13): shard 404, network error, malformed
shard, id present in the index but missing from the fetched shard. Report
`HANDLED FAILURES:` and `NOT HANDLED (by choice):`.

**Acceptance:** an e2e test cold-loads a deep link to a record in a **non-eager**
catalog (`disa-cci` or `cmmc-2`) and asserts the record renders. Existing tests
only deep-link `nist-800-53:AC-2` — an eager catalog — which is why this bug
survived (`tests/e2e/legacy-url-shim.spec.mjs:9-15`).

## 12. W6 — Remaining defects

**W6.1 `#/start-here` 404.** `src/ui/lib/hashRoutes.ts:30-60` already carries a
deliberate alias block for hand-typed URLs (`/atlas`, `/map`, `/hub`, `/bazaar`)
but has no `/start-here` entry, so `parseHashLocation` (line 105-106) falls
through to `not-found`. **One-line fix**: add `"/start-here": "start-here"` to the
alias block. Note the internal view key *is* `start-here` while the route is
`/start` — that mismatch is why people type it wrong. Also audit whether the new
naming from W4 needs its own aliases.

**W6.2 Container-width stranding.** `--ca-content-max: 90rem` is defined at
`styles/tokens.css:153`. The 2026-07-25 rule at `styles/surfaces.css:1876-1881`
applies only to `.catalog-index, .catalog-detail-page, .start-here-result-page`.
**`CommonsPage.tsx` and `SourcesPage.tsx` never used those classes** — Commons uses
inline `max-w-[90rem]` Tailwind utilities (lines 363, 438) and Sources has no
max-width rule at all. **`docs/STATE.md`'s claim that this was fixed is wrong for
these two pages — it never landed, it did not regress.** Fix by giving those pages
the real shared container, not by re-touching CatalogDetailPage (which has
uncommitted changes from item 4).

**W6.3 Commons filters do not resync (Back/Forward broken).**
`src/ui/pages/CommonsPage.tsx:38-54` derives `initialQuery`/`initialLane` from
`viewState` once at render and seeds `useState` (lines 47-54). Nothing
resubscribes. `updateParams` (lines 120-132) only writes forward via
`onNavigate`. Fix by driving filter state **from** the location rather than
copying it at mount. Add a test that exercises back-navigation, not just initial
load.

**W6.4 Dead Commons links — 15 of 99.** Dataset:
`data/commons-resource-dataset.json`, shape `{schemaVersion, lastUpdated,
collections, resources}`, URL field `resources[i].canonicalUrl`, 99 entries
confirmed. Replacements must be **fetched and verified** to return content
matching what the entry claims. **Any link you cannot verify gets removed, not
guessed** — this repo has a fabrication incident in its history (commit
`511333a`, "remove 130 fabricated resources") and a plausible-looking invented URL
is the same class of failure. Report replaced / removed counts.

**W6.5 Orphaned test — `tests/commons-quality.test.mjs`.** Confirmed referenced by
no npm script and no workflow: **never executed**. It asserts the dataset has
≥ 175 resources (line 45); the real count is 99, because commit `511333a` removed
the 130 fabricated entries and the threshold was never updated. Rewrite the
thresholds to current reality and **wire it into `test:data`** — the schema, id
uniqueness, and URL uniqueness assertions are genuinely valuable and are currently
protecting nothing. Do not simply delete it. Same treatment for
`tests/commons-search-benchmark.test.mjs`, also never executed.

**W6.6 Dangerous orphan — `scripts/generate-commons-dataset.mjs`.** Referenced by
nothing. It rewrites `data/commons-resource-dataset.json` wholesale
(lines 700-711) from a hand-written array that still contains placeholder junk
URLs (lines 664-694, e.g. `pirated-standards-mirror.example.org`). Running it
would reintroduce fabricated data over production. **Delete it**, with the three
C14 greps pasted first. `scripts/generate-expanded-commons-dataset.mjs` is in the
same state — same treatment.

**W6.7 Dependabot: 2 pre-existing highs.** react-router (RSC-mode CSRF) and
postcss (build-time path traversal). Neither is reachable: this is a static
hash-routed SPA with no RSC, and postcss is devDependency-only. npm's "fix" for
react-router is a **downgrade** from 7.18.0 to 7.11.0.
`security/npm-audit-exceptions.json` is empty — this project has never accepted an
exception. **Do not self-approve one.** Take the postcss fix if it is
non-breaking; write up react-router with its non-exploitability rationale and a
proposed expiry, and present it for owner approval.

**W6.8 Loading-race flake on `/documents` and `/sources`.** Fails 8 of 9 isolated
`--repeat-each=3` runs, page caught in the retry card (277px vs an expected
2005px). The card is `LoadErrorPanel` at
`src/ui/components/LoadStatusPanel.tsx:31-51`; the condition that sets its error
flag lives upstream and **was not located** — start by grepping for
`<LoadErrorPanel` call sites to find the fetch/abort/timeout wiring. Note
`tests/e2e/load-resilience.spec.mjs:42-47` deliberately delays data by 11s to
assert this card appears, so the card itself is expected behavior *there* — the
failing specs are in `approved-layout-visual.spec.mjs` /
`release-readiness-visual.spec.mjs`, which do not delay anything.

Determine which of two causes is real before fixing: (a) the test's load-wait
resolves before content settles, or (b) the app genuinely races into a retry state
a real user would also hit. **These are not the same bug and (b) is the one that
matters.** Do not lengthen a wait to make it green — that hides (b). This likely
shares a root cause with W5's loading/not-found conflation; if the evidence agrees,
fix them together and say so.

**W6.9 Repo junk.** Evidence-backed, safe to remove:
- **~34 files under `tools/`** — `agent-bootstrap.mjs`, `agent-helper.mjs`,
  `brains-refresh.mjs`, `cursor-*.mjs`, `mcp-*.mjs`, `personal-bootstrap.mjs`,
  `rocky-auto-setup.mjs`, `token-wizard.mjs`, and similar — referenced by no npm
  script and no workflow. This is generic agent-scaffolding boilerplate unrelated
  to Control Atlas. **This is the "junk leftover" the owner suspected.**
- `scripts/test-issue-1..7.mjs`, `scripts/test-auth-tooling.mjs`,
  `scripts/test-pages-ci.mjs`, `scripts/spikes/search-baseline.mjs` — debug
  one-offs, referenced by nothing.
- **Not verified and therefore not to be touched without checking:** `scripts/lib/`,
  `tools/lib/`, `tools/importers/`, `tools/normalizers/`,
  `tools/relationship-builders/`, `tools/validators/` are likely internal
  dependencies of live scripts. Verify import chains before removing anything there.
- `scripts/build-commons-index.mjs` and `check-commons-health.mjs` **are live** —
  referenced by workflows only, not by package.json. Do not remove.
- Paste the three C14 greps before every deletion. Delete in one commit, separate
  from feature work, so it is trivially revertable.

**W6.10 `docs/STATE.md` drift.** 454 lines against its own 80-line rule, and its
Open Items still lists "GRC hierarchy steps 4-7 OPEN" while the Done log above
records them shipped 2026-07-25. Reconcile Open Items against the Done log; move
superseded historical blocks to `docs/audits/` rather than deleting them. 110 `.md`
files exist under `docs/`; 19 predate 2026-07-01 and are archive candidates.
Correct the container-width claim per W6.2 while you are in there — it is
currently inaccurate.

---

## 12a. W7 — Make the model visible to the user

The doctrine is not just internal architecture; the owner wants it published,
because the model *is* the explanation people are missing.

**W7.1 — Publish the philosophy on the About page.** Derive the copy from
[`docs/tree-model.md`](../tree-model.md) §1 and §2 — the ten layers and why they
exist. Keep the owner's thesis in plain terms: federal cybersecurity is not
incoherent, it is layered, and nobody publishes the map of the layers. Include the
tree diagram. This is the one place the Roots/Twigs/Acorns vocabulary is allowed
to surface directly; **it never becomes navigation labels.**

**W7.2 — "Where this sits" on every record page.** Doctrine §7 item 2, and the
single highest-value addition to record pages. A persistent, always-visible tree
path:

```text
NIST › SP 800-53 Rev. 5 › Access Control › AC-2 Account Management
      › AC-2(1) Automated System Account Management
```

This is the rail from W1.6, rendered. Beneath it, the three relationship classes
as **visually distinct** groups — `Selected by` (applicability badges),
`Correlated through` (CCIs), `Implemented by` (STIGs/SRGs), `Assessed through`
(objectives and evidence expectations).

**W7.3 — Adopt the record anatomy.** Doctrine §7 lists the twelve sections in
order. `ObjectDetailPage.tsx` already implements much of it (plain meaning,
location, connections, source support, next action, collapsed advanced detail).
Audit it against the twelve and close the gaps rather than rebuilding it.

**W7.4 — Evidence expectations, never evidence.** Doctrine §2, FRUIT layer. The
product publishes expected evidence types, validation questions, and blank
matrices. **It must never imply that evidence exists or that a control is
compliant.** If W7.3 surfaces an evidence section, this is its hard boundary.

**Acceptance:** About renders the model and diagram; every record page shows its
full tree path; the three relationship classes are visually distinguishable in a
screenshot without reading labels; no surface asserts compliance or possession of
evidence.

---

# Part IV — Execution

## 13. Order

```
W1  Hierarchy (parents for everything) .......... do first; everything else reads it
W5  Deep-link sharding fix ...................... unblocks testing every record page
W6  Defects (10 items, incl. junk removal) ...... mechanical; batch them
W3  Documents: Word/Excel/PDF + preview ......... self-contained
W4  Fold Commons in + rebrand ................... naming approved; just execute
W7  Make the model visible (About + rail) ....... depends on W1
W2  Navigation model redesign ................... largest; depends on W1 and W7
```

W1 first because the rail, the drill-down, and the record pages all read the
ancestor chain — building them against a 53%-orphan graph means building twice.
W5 second because a broken deep link makes every downstream surface untestable.
W2 last because it is the largest design build and it consumes W1's output.

**No stop gates remain.** Every open question was decided by the owner on
2026-07-26 and is recorded in §4. Proceed on your judgment throughout, and report
per §15.

If you run out of runway, stop at a workstream boundary with a clean tree and say
so plainly. A half-landed W2 is worse than no W2.

## 14. Latitude

The owner's framing: *"some of it may be unnecessary and junk leftover but I think
my overall intent is clear."* The intent is **a site with true utility for the
people who need it.** This list is evidence of that intent, not a contract.

You may drop, merge, or delete any item you can show is vestigial — with evidence,
in one line, in your report. But: **evidence, not vibes** (paste the greps,
especially for C14 deletions — there is no PR review here to catch a wrong one),
and **deleting is not skipping.** Judging something junk and removing it is in
scope. Judging something hard and leaving it undone is not — that gets reported as
outstanding.

When torn between "this is junk" and "this is a real defect I don't want to
touch": it is a real defect. Report it.

## 15. Reporting contract

- **Landed:** one line per item, each with `Verified: <command> -> <result line>`.
- **`EDITED-UNVERIFIED: <file>`** for anything changed but not exercised.
- **`NOTED (not done): <thing> <file:line>`** for deliberate non-actions.
- **Deviations:** anything here you departed from, and why.
- **Numbers, for W1 specifically:** orphan count before/after, depth distribution
  before/after, `check:data-size` bytes before/after.

Never write "should work", "likely fixes", or "ought to now". The only legal forms
are `Verified: <command> -> <result>` and
`UNVERIFIED — to confirm, run: <command>`.

Screenshots are evidence only if you actually looked at them. A green suite beside
a screenshot showing overlapping cards is a failed audit — that is this project's
own recorded standard, and a subagent already failed it once this month by
reporting "eye-inspected, passing" on baselines captured mid-`LOADING` state.
