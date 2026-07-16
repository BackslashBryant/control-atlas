# Newbie-Reframe Execution Plan — phase-by-phase specs

**Created:** 2026-07-11 (grilling session). **Owner decisions in this doc are locked — do not re-litigate them in execution chats.**
**How to use:** one phase per chat. Start each chat with the kickoff prompt at the end of that phase's section. Each phase = its own branch work + commit(s) on the current flow (branch → green checks → ship per repo workflow). Update `docs/STATE.md` and check the phase box here when a phase ships.

---

## Locked positioning (context for every phase)

- **The GRC newbie is THE user, everywhere. Practitioners are a secondary beneficiary.** (Full reframe — supersedes PRD v3 "five practitioner types.")
- One-sentence product: *the one plain-English place that pulls the government's scattered open-source GRC guidance into a single, reasonably-current reference, connects it, and takes a newcomer from "who am I?" → "here's exactly what applies to you."*
- **Moat = consolidation + connection + freshness.** Owner's words: "all that other stuff is all over the fucking place… it takes months, sometimes years, to connect it all."
- **Graph is demoted** from flagship to one view among equals. `start-here` (situation → requirements) is the newbie's center of gravity. Landing page layout stays (owner likes it; polish only).
- **Freshness model:** auto-sync where a machine-readable feed exists (NIST OSCAL etc.); curated "current as of" + link-out elsewhere. Host the connective tissue; host full text only where small/stable; link out where huge/volatile (STIGs already link out — keep).
- Success bar: become **THE approachable authority / go-to reference for gov GRC.**
- Diagnosis this plan fixes: (1) copy speaks practitioner-jargon, violating the repo's own `docs/design/content-style-guide.md`; (2) visual system tuned so "calm" that surfaces blend (near-identical surface luminance + translucent borders, `styles/tokens.css:5-12`).

## Global constraints (apply to every phase)

- **Never touch `src/ui/components/BrandLockup.tsx`** (standing owner constraint; layout order lives in consumers).
- Keep the rotating Ctrl+Alt+X wordmark. Landing layout (orb + 3 satellites) stays.
- Never weaken tests. When copy legitimately changes, update the matching assertion **in the same commit** and say so in the commit message.
- Stage by path (never `git add -A`), no Co-Authored-By trailer, no push unless the owner asks in that chat, dist/ never hand-edited.
- Repo gates before claiming done: `npm run lint`, `npm test`, `npm run build:site`; `npm run test:e2e` + `npm run test:a11y` when UI strings/styles changed. (Full mirror: `npm run precommit`.)
- Calm-design principle holds: separation via figure/ground, elevation, and type — **no new badge/color noise**.

## Phase index

| Phase | Chat-sized scope | Status |
|---|---|---|
| 1 | Newbie-first copy reposition (landing, nav, menu, interior sweep) | [x] |
| 2 | Visual de-blend spike → owner picks intensity → rollout; + header brand-lockup fix | [x] |
| 3 | Positioning docs reframe (PRD, vision, backlog header) | [x] |
| 4 | Start Here sharpening — situation→requirements as the newbie's main path | [x] |
| 5 | Trust & connection labeling (named crosswalk groups, coverage honesty) | [x] |
| 6 | Freshness: auto-sync pipeline + "current as of" stamping | [x] |
| 7 | Templates professionalism pass (parallel track, any time after 1) | [x] |

---

## Phase 1 — Newbie-first copy reposition

**Objective:** every user-facing string leads with the plain-English promise, not acronyms. Enforce `docs/design/content-style-guide.md` literally (no unexplained acronyms; no abstract-noun stacks; each surface answers *what this is / why it matters / what to do next*).

### 1.1 Specified string changes (verified refs)

| Where | Current | Change to |
|---|---|---|
| `src/ui/pages/HomePage.tsx:24-27` landing tagline | "Unified intelligence for NIST controls, STIGs, CCIs, and FedRAMP baselines — all in one place." | Primary: **"The government's cybersecurity rules, pulled into one place and explained in plain English."** Alt (owner may prefer): "Federal cyber compliance is scattered across a hundred sites. This is the one place that connects it — in plain English." Present both to owner in-chat before editing. |
| `HomePage.tsx:83` Research caption | "Playbooks & practical guidance" | "Plain-English guides to how it all works" |
| `HomePage.tsx:91` Build caption | "Templates & RMF starters" | "Create starter documents in your browser" (drop unexplained "RMF") |
| `HomePage.tsx:101` Navigate caption | "Map connections across frameworks" | "See how everything connects" (graph demotion: function, not flagship) |
| `HomePage.tsx:74` orb caption | "Click to start" | **Keep** — test-coupled (`a11y-contract.test.mjs:170`, 3 e2e specs) and newbie-fine. |
| `src/ui/lib/navigation.ts:34` | "Research · Learn" | "Learn" |
| `src/ui/lib/navigation.ts:64` | "Build · Create" | "Build" |
| `navigation.ts` group "Navigate" / "Search" | — | Keep (already plain; all four now single words: Search / Learn / Navigate / Build) |
| `src/ui/pages/MenuPage.tsx:27` | "Research · Learn" | "Learn" |
| `MenuPage.tsx:34` | "Navigate Maps" | "Navigate" |
| `MenuPage.tsx:41` | "Build · Create" | "Build" |
| `MenuPage.tsx:42` body | "Generate blank RMF/ATO templates without uploading data." | "Create starter compliance documents — nothing you type ever leaves your browser." |

Keep as-is (reviewed, acceptable): search placeholder/aria (`HomePage.tsx:50,54` — IDs are legitimate searchable objects), orb hidden hint (`:105-106`), trust row (`:108-128`, optional light touch only).

### 1.2 Interior sweep (rubric work — inventory first, then rewrite)

1. Grep/inventory every user-facing string in: `src/ui/lib/pagePrimitives.tsx` (PageHeader eyebrows/summaries) and `src/ui/pages/` — AboutPage, ExplorePage, SourcesPage, PlaybooksPage, TemplatesPage, ComparePage, AtlasMapPage, StartHerePage, ObjectDetailPage; plus `SiteFooter.tsx`, `SearchOverlay.tsx`, `LoadStatusPanel.tsx`, `BrandEntranceOverlay.tsx`, `GlossaryDrawer.tsx`.
2. Table them (string → verdict keep/rewrite → proposed). Post the table in-chat for owner scan **before** bulk editing.
3. Rewrite offenders per the style guide. AboutPage is the newbie's "what this is / what it is not" anchor — give it the most care; it should tell the consolidation story ("this stuff is scattered; we pulled it together; here's what we are/aren't").
4. Atlas/graph copy: reword anything selling the graph as *the* product → "one way to see how things connect."

### 1.3 Test blast radius (update in same commits — legitimate renames, not weakening)

- `tests/e2e/control-atlas-shell.spec.mjs:107,109,125,133` — "Research · Learn" / "Build · Create" → "Learn" / "Build".
- `tests/e2e/critical-path-matrix.spec.mjs:195` — "Research · Learn" → "Learn".
- `tests/e2e/load-resilience.spec.mjs:27` — "Research · Learn" → "Learn".
- "Click to start" assertions untouched (string kept).
- **Read `tests/content-review.test.mjs` and `tests/a11y-contract.test.mjs` before editing** — they assert copy/accessible names; expect additional string couplings the greps above didn't list.

### 1.4 Verify & done

`npm run lint` + `npm test` + `npm run test:e2e` + `npm run test:a11y` green; before/after copy table posted; commits per surface group (landing / nav+menu / interior sweep). No CSS changes in this phase.

**Kickoff prompt:**
> Execute Phase 1 of docs/plans/newbie-reframe-execution-plan.md (newbie-first copy reposition). Read that file's "Locked positioning", "Global constraints", and Phase 1 sections, plus docs/design/content-style-guide.md and docs/STATE.md, before editing. Present the tagline choice and the interior-string inventory table to me before bulk edits. Commit on a branch; no push unless I say so.

---

## Phase 2 — De-blend spike → pick → rollout, + header lockup fix

**Objective:** pages stop blending together. Token-first so the fix is systemic. Owner picks intensity from a real before/after.

### 2.1 Root causes (verified)

- `styles/tokens.css:5-7` — `--ca-bg #0b1020`, `--ca-surface #111827`, `--ca-surface-raised #1e293b`: three near-identical dark navies; figure/ground collapses.
- `tokens.css:8-12` — borders deliberately translucent (`rgba(148,163,184,0.22)` / `0.11`) so "hairlines recede"; combined with flat surfaces, nothing separates.
- Check type hierarchy in practice: scale exists (`tokens.css:88-95`) but confirm H1>H2>body renders with real contrast in `styles/surfaces.css` usage.
- Related debt (fix only if touched): ~15 off-scale spacing one-offs in `surfaces.css` (backlog "spacing-token drift" — L322, L668, L759, L1076, L1346, L2360, L2641, L2865).

### 2.2 Build TWO variants (starting values — tune for AA contrast)

Variant A — "Clearer ground" (hierarchy only): `--ca-surface: #151f33`, `--ca-surface-raised: #243248`, `--ca-border: rgba(148,163,184,0.30)`; add elevation token `--ca-elev-1: 0 1px 2px rgba(0,0,0,.45), 0 6px 16px rgba(0,0,0,.25)` applied to raised containers. No new borders/decoration.

Variant B — "Visible structure": Variant A **plus** solid borders on primary cards/containers (≈`#334155`, the PRD's original border value), one type-scale step more contrast between H2 and body, optional left-accent bar on section headers. Still no new colors/badges.

### 2.3 Procedure

1. Apply Variant A → `npm run build:site` → serve (`tools/serve-static-site.mjs` or launch.json dev server) → screenshot **landing + one record/ObjectDetail page** (desktop + 375px). Stash screenshots.
2. Same for Variant B.
3. Post before/A/B screenshots; **owner picks** (may mix: e.g., A's surfaces + B's borders).
4. Roll the chosen tokens out; spot-check high-traffic surfaces (Explore results, Sources, Templates, Compare, StartHere) for regressions — especially text-on-surface contrast (provenance badge text tokens, `tokens.css:37-47`) and the graph pane.
5. Header lockup fix (backlog P0): `src/ui/components/TopNav.tsx:64-68` — reorder to wordmark-above-flourish to match landing (`HomePage.tsx:18-23`); adjust `.brand-lockup` (`styles/surfaces.css:292-297`) only if sizing needs it. **Do not touch BrandLockup.tsx.**

### 2.4 Verify & done

Screenshots before/after posted; `npm run test:a11y` green (contrast assertions matter here); `npm run test:e2e` green; lint/test green. Done = owner-picked variant live on all surfaces + lockup matches landing.

**Kickoff prompt:**
> Execute Phase 2 of docs/plans/newbie-reframe-execution-plan.md (visual de-blend + header lockup). Read that file's "Locked positioning", "Global constraints", and Phase 2 sections first. Build both variants, show me before/after screenshots of landing + a record page, and WAIT for my pick before rolling out. Never touch BrandLockup.tsx. Commit on a branch; no push unless I say so.

---

## Phase 3 — Positioning docs reframe

**Objective:** the repo's own docs stop pulling future sessions back toward practitioner-first jargon.

1. `docs/PRD.md` §Users (~L68-80): replace "Five practitioner types" with newbie-primary framing. Draft to adapt: *"**Primary user — the newcomer.** Someone new to federal cyber compliance ('get us compliant / get an ATO' just landed on their desk) who doesn't yet know how NIST, FedRAMP, CMMC, STIGs, and CCIs relate. Every surface must work for this person first. **Secondary — practitioners** (ISSO/ISSM, assessor, engineer, PM, contractor/CSP): served by the same plain-language model, depth on demand, but never at the newcomer's expense."*
2. `docs/PRD.md` — add the moat sentence (consolidation + connection + freshness) to "The One Thing This Product Does"; note graph demotion in the Relationship Graph section ("an enhancement/one lens — never the headline").
3. `docs/vision.md:9` — same audience reframe; keep translation-not-complexity principle (it already supports this).
4. `docs/design/content-style-guide.md` — add one line: "Write for the newcomer first; practitioners get depth on demand."
5. `docs/plans/live-site-polish-backlog.md` header — 2-line note recording the 2026-07-11 positioning shift and pointing here.
6. **Before editing PRD: read `tests/prd-alignment.test.mjs`** (in `npm run test:data`) — it may assert PRD text/structure. Update assertions only for legitimately changed text; if the test's design conflicts with the reframe, quote the failure and stop for owner approval (never weaken silently).

Verify: `npm test` green. Docs-only phase; no site rebuild needed unless PRD test forces code-adjacent changes.

**Kickoff prompt:**
> Execute Phase 3 of docs/plans/newbie-reframe-execution-plan.md (positioning docs reframe). Read that file's "Locked positioning" and Phase 3 sections first, then tests/prd-alignment.test.mjs before touching docs/PRD.md. Commit on a branch; no push unless I say so.

---

## Phase 4 — Start Here sharpening (situation → requirements)

**Objective:** make `start-here` unmistakably the newbie's main path and its output genuinely actionable. This is the signature feature of the reframe.

1. Audit current flow vs PRD Start Here spec (3 questions: system type / data sensitivity / environment; output: which frameworks apply + why, suggested baselines + one-line rationale, direct links to records/playbooks/templates; "reference recommendation, not a determination" label). Files: `src/ui/pages/StartHerePage.tsx`, `src/ui/components/StartHereResult.tsx`, `src/ui/components/StepIndicator.tsx`, logic under test in `tests/start-here-recommendations.test.mjs`.
2. Grade the output page against: "would a total newcomer know exactly what to click next, and why?" Fix gaps: plain-language rationale per recommendation, explicit next actions, no unexplained acronyms.
3. Promote the path: landing orb already targets it — ensure interior surfaces (About, Explore empty-state, 404) point lost users to Start Here.
4. Consider (propose, don't assume): a "not sure" answer path per question with a plain explainer.

Verify: start-here tests green + e2e/a11y; walk the full flow in the browser pane and screenshot the result page. Done = owner signs off on the output page as "this would have helped confused-beginner me."

**Kickoff prompt:**
> Execute Phase 4 of docs/plans/newbie-reframe-execution-plan.md (Start Here sharpening). Read that file's "Locked positioning" + Phase 4, docs/PRD.md §Start Here, and tests/start-here-recommendations.test.mjs first. Audit before editing; show me the gap list before implementing. Branch; no push unless I say so.

---

## Phase 5 — Trust & connection labeling

**Objective:** connections (the moat) read as named, trustworthy crosswalks — not anonymous piles. Absorbs backlog P1 "trust & first-use" + P3 items.

1. **Named crosswalk groups:** record detail shows "27 other public mappings" (e.g., AC-2) → group by source: "CSF 2.0 crosswalks (NIST OLIR)", "SP 800-171 mappings", etc. Source-grouping logic feeds the Connections panel (`ExpandableRelationshipGroup.tsx` / `RelationshipExplorer.tsx` area — locate exactly in-chat).
2. **Coverage honesty:** decide `isLowCatalogCoverage` boundary (`src/ui/lib/catalogCoverage.ts`, currently `pct < 75` lets exactly-75% skate past) — pick inclusive `<=` or a stated cutoff; adjust the a11y-contract assertion together.
3. **Known-gaps note:** Sources page line explaining the 11 residual blocked relationships (9 upstream OLIR bare-identifier rows, 2 stale DoD ZT refs) so the number is explained, not discovered.
4. 0%-coverage catalogs (ATT&CK ICS, AI RMF, SSDF, DoD RAI; SP 800-172 at 1%): either suppress from default search ranking or clearly badge — propose, owner picks.
5. **One source model, three views:** purpose is the canonical hierarchy (Rules → Frameworks → Controls → Baselines → Implementation → Assessment → Mappings → Threat/Defense → Supporting Sources). The default interface groups those same sources by novice question. RMF lifecycle is an alternate guided view from Prepare through Monitor. Managerial / Operational / Technical remain control-level tags, never document categories.
6. **Connection group jump navigation:** keep full connection lists in the record page's main column, but add a compact named-group rollup in the detail sidebar that opens and jump-links to each accordion group.

Verify: unit + e2e + a11y green; screenshot a record's Connections panel before/after.

**Kickoff prompt:**
> Execute Phase 5 of docs/plans/newbie-reframe-execution-plan.md (trust & connection labeling). Read that file's Phase 5 + docs/plans/live-site-polish-backlog.md (P1 trust section) first. Branch; no push unless I say so.

---

## Phase 6 — Freshness: auto-sync + "current as of"

**Objective:** make "reasonably current" a visible, partially-automated promise. **The fetch pipelines already exist** — this phase schedules and surfaces them, it does not invent them.

Existing machinery (package.json): `fetch:frameworks`, `fetch:ccis`, `fetch:disa-stigs`, `fetch:mitre`, `fetch:olir-mappings`, `refresh:data`, plus the source registry's `last_checked`/`last_imported`/`hash` fields (PRD Source Schema) and ADR-0006 (build-time imports, no runtime ingestion — the freshness model must respect it).

1. **Scheduled sync:** GitHub Actions cron (weekly?) running `refresh:data` → if diff, open an automated PR (or direct branch per repo workflow) with the data delta summarized. Owner reviews/merges — human-in-the-loop, no silent data changes.
2. **"Current as of" stamping:** surface each source's `last_checked`/version on SourcesPage (may exist — audit) AND on record detail pages ("From NIST SP 800-53 Rev 5.2, checked 2026-07-01") — the newbie-facing trust cue.
3. **Per-source model table:** for each registry source, record auto-synced vs curated vs link-out (STIGs stay link-out per standing owner decision — generic technology-class only).
4. Decision points to put to owner in-chat: cron cadence; PR-per-sync vs batch; whether stale sources (> N days) get a visible "may be outdated" note.

Verify: dry-run the workflow (`workflow_dispatch`), show a real sync diff; data contract tests green.

**Kickoff prompt:**
> Execute Phase 6 of docs/plans/newbie-reframe-execution-plan.md (freshness/auto-sync). Read that file's Phase 6, docs/adr/0006-build-time-imports-not-runtime-ingestion.md, the fetch:* scripts in package.json, and the source registry first. Present the per-source sync-model table and cadence options before building. Branch; no push unless I say so.

---

## Phase 7 — Compliance artifact and template nexus (parallel track)

**Objective:** shorten the path from a federal-compliance task to its authoritative source, official artifact, usable companion, compatible format, validation evidence, and next action. The nine pre-Phase-7 templates must also read professionally when opened in Office. Absorbs backlog P0 items 3-4 + P2 value-adds.

1. Generate all nine shipped templates (`data/template-registry.json`; engine `src/app/template-engine.mjs`), open each docx/xlsx export, and grade content/tone/completeness before editing.
2. Put official current and legacy artifacts first, with precise links, provenance, version/status, and retrieval date. Label Control Atlas companions and compatibility evidence separately.
3. Connect tasks, artifact families, supporting tools, formats, validation checks, and next actions through dedicated catalogs.
4. Rebuild the nine shipped templates and add Hardware Baseline, Software Baseline, and PPSM Preparation Worksheet companions.
5. Reuse license-compatible public schemas and implementations where justified; never claim import compatibility without matching evidence.

Verify: regenerate + open all twelve Office exports; validate registry and interoperability contracts; `tests/template-office-export.test.mjs`, template contract tests, and `npm run precommit` green.

**Kickoff prompt:**
> Execute Phase 7 of docs/plans/newbie-reframe-execution-plan.md (compliance artifact and template nexus). Read that file's Phase 7 + docs/plans/live-site-polish-backlog.md P0 items 3-4 first. Generate all nine shipped templates and grade them before editing anything. Branch; no push unless I say so.

---

## Backlog mapping

| live-site-polish-backlog item | Absorbed by |
|---|---|
| P0 header brand lockup | Phase 2 |
| P0 site-wide copy pass | Phase 1 |
| P0 template quality pass | Phase 7 |
| P0 FedRAMP official-template honesty | Phase 7 |
| P1 spacing-token drift | Phase 2 (opportunistic) |
| P1 relationship group labeling | Phase 5 |
| P1 visual-density screenshot pass | Phase 2 (procedure includes screenshots) |
| P1 isLowCatalogCoverage boundary | Phase 5 |
| P1 known-gaps note | Phase 5 |
| P2 template value-adds | Phase 7 (capacity) |
| P3 0% catalogs / OLIR gaps | Phase 5 / Phase 6 |
| P4 hygiene (flake, bundle split, live-smoke) | Not scheduled — separate maintenance |
