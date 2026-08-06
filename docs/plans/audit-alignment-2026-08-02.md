# Audit alignment — 2026-08-02

Source docs (external, not in repo): `D:\Storage\Downloads\control-atlas-full-surface-audit.md`,
`D:\Storage\Downloads\control-atlas-codex-fix-spec.md`. Owner: "Address all issues in the audit by
implementing the spec and shipping."

## Triage (verified against current HEAD before writing this plan)

The audit's screenshot pack and the spec's workstreams (0-12) were checked against actual source,
not assumed current. Sessions 15-20 already shipped substantial parts. Real remaining scope below;
items the audit flagged that are already fixed are NOT re-listed as work.

**Workstream 7 exception:** the spec's literal 3-step situation/work-stage/immediate-need wizard
conflicts with `tests/content-review.test.mjs`'s `DETERMINATION_BOUNDARY` rule and the session-15
decision (STATE.md) that explicitly rejected system/environment classification questions on Start
Here. ASSUMPTION: implement the spirit (explainable reasons, badges) on the existing situational
rows, not a new classification step. Do not weaken that test to fit the literal wizard.

## Phases (each gets its own TASK block, baseline, and verification before the next starts)

### Phase 1 — Core ontology (Path / Map+List / Record page)
1a. Path: split `WhereThisSitsRail` into two visibly separate rails (Control Atlas structure vs
    Publisher hierarchy); badge every organizing crumb, not just the first; fix
    `AtlasMapPage.tsx:583` eyebrow text (currently "Publisher-declared structural path" over a
    mixed rail) and its dependent test assertions.
2a. Map/List: add a "Correlation" lens; reclassify CCIs (`GROUP_META.disa` in `atlasModel.ts`) out
    of Implementation into Correlation; align `RelationshipGraphTable`'s class taxonomy with Map's
    lens set so the same record gets the same class label in both views; label Structure-block
    items with their relationship label, not bare IDs.
3a. Record page (`ObjectDetailPage.tsx`): reorder to identity -> path -> decomposition -> official
    text/Discussion -> relationship summaries -> implementation path -> evidence -> resources ->
    next actions -> source detail; remove the chip/Connections duplication (one canonical
    component); qualify assessment-procedure labels with publication + object type; delete/replace
    the keyword-derived "Implementation guidance" claim (`ContextualCommonsModule.tsx`,
    `contextualResourceRecommendations.mjs`) with an honestly-labeled "related by search relevance"
    treatment that is never called implementation guidance; move evidence before source-text.

### Phase 2 — Surface boundaries (ownership dedup)
4a. Add an ownership test: an ingested publication (SP 800-53 etc.) cannot also render as an
    ordinary Resource. Deduplicate `data/commons-resource-dataset.json`'s 14 "official-*" entries
    that shadow canonical Catalog/Source objects.
5a. Sources: split the default table into Publication register (deduplicated) / Connection sources
    / Ingestion provenance (advanced); resolve raw coverage keys (`disa-cci`, `disa-stig`) to
    display names in the default view.
6a. Resources: rename "Why it is here" -> "Why Control Atlas lists this", mark as a Control Atlas
    note everywhere (card + detail, not just detail's editorialNotes); redirect ingested
    publications to their canonical Source/Catalog page instead of a duplicate Resource detail
    page; add "explicitly related Atlas records" section to Resource detail.

### Phase 3 — Destination doctrine jobs
8a. Learn: add a practitioner-guide directory (RMF, control selection, evidence, assessments,
    findings, monitoring, inheritance, reciprocity, cloud/shared responsibility, STIG lifecycle) as
    the primary surface; demote the existing 6 cards under "How Control Atlas works".
9a. Documents: recategorize `catalogGroups.mjs` from Authorization/Assessment/Evidence/Monitoring/
    Other to Plan/Implement/Assess/Remediate/Monitor per the spec's explicit mapping; no Other.
10a. Catalog: add canonical publication-kind classification (control catalog, risk framework,
     outcome framework, authorization program, certification program, control-selection method,
     implementation standard, threat knowledge base, defensive knowledge base) as the primary
     grouping; keep record-type as secondary/advanced; add an area filter.
7a. Start Here: per the ASSUMPTION above — add explainable reason/badge treatment to existing
    situational rows; do not add a classification wizard.

### Phase 4 — Search, Compare, disclosure
11a. Search: add relevance tiers (exact / directly connected / text match / external resource) and
     a visible match reason per result; replace "Compare, map, or export" with explicit actions.
11b. Compare: add evidence-basis copy per mode; add a conflicting-source-disagreement state.
0a. Add a lightweight semantic-snapshot test (section IDs, group counts, relationship-class labels)
    for the Map/List/Record routes, asserted equal across the two Playwright projects, so a future
    platform divergence like session 20's is caught generically, not just for that one bug.

### Phase 5 — Thesis
12a. Home: Start Here becomes the primary newcomer action; add the hierarchy/relationship thesis
     line + compact example chain; scope "nine areas" language to Atlas publications, not Resources.
12b. About: add "A tree for hierarchy, a graph for relationships" section per the spec.

## Ship gate
Full local verification (lint, typecheck, `npm test`, e2e, a11y, visual) green, then push to a
throwaway branch for Public Repo Checks, fast-forward `main`, confirm GitHub Pages + Pages Live
Smoke, per `memory/deploy-workflow.md`. No PRs.
