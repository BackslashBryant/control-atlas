# Control Atlas Delivery Index

## Product Identity

- Public product name: **Control Atlas**
- Campaign line: **Ctrl+Alt+Comply**
- Tagline: **The public map for federal cyber compliance.**
- Supporting line: Open-source reference workbench for mapping controls, tracing frameworks, and generating starter RMF/ATO templates - no login, no evidence upload, no organizational data required.

## Canonical Doc Hierarchy

Read and update docs in this order when status changes:

1. [`docs/PRD.md`](PRD.md) — requirements (change only when product intent changes)
2. **This file** — delivery index, epic status, active sprint
3. [`docs/plans/prd-v3-alignment-backlog.md`](plans/prd-v3-alignment-backlog.md) — open PRD gaps only
4. [`docs/context.md`](context.md) — short session handoff (must mirror active sprint here)
5. [`docs/roadmap.md`](roadmap.md) — epic definitions and dependencies (stable; update sequence footers only)

Agents must not mark work complete in chat without updating **Plan.md** and **prd-v3-alignment-backlog.md** in the same ship commit when an epic or sprint closes.

## Active Sprint

**2026 correction program - Epic 3 complete locally.** Resources now has six
reconciled primary browse categories, eligibility-first search, URL-backed
facets with recovery, and traceable derived contextual recommendations.
Features 3.1-3.5 and milestone M3 are verified on the local task branch only.
The shared header now keeps one continuous primary navigation path and groups
Search, Sources, and Help as utilities; Build presents related resources as a
desktop support rail that stacks after task selection at narrower widths.
Epic 4 - Record and Build progressive disclosure is next; see the
[`2026-07-27 correction backlog`](planning/control-atlas-correction-backlog-2026-07-27.md).

## Epic Status (July 9, 2026)

| Epic                                 | Status                | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------ | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Migration                        | **Closed (residual)** | React shell, schema extensions, CI/Pages parity shipped. Relationship map now ships in React Library detail (Epic 9); legacy `app.mjs` remains unmounted.                                                                                                                                                                                                                                                                                                                                                         |
| 1 — Data Backbone                    | **Closed (residual)** | Build pipeline emits `plain_language_summary`, edge provenance fields, and registry-backed sources. Contract tests enforce quality; ongoing importer tuning is maintenance, not a blocker.                                                                                                                                                                                                                                                                                                                        |
| 2 — Library + Search                 | **Shipped**           | MiniSearch index, facets, library detail, deep links, "What to do next".                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 3 — Compare                          | **Shipped**           | Relationship table with provenance, STIG→CCI→NIST trace, baseline delta, exports (`81daf6d`).                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 4 — Template Factory                 | **Shipped**           | Nine PRD-aligned templates, artifact-first UI, disclaimer + source metadata on all exports, unit + E2E generation coverage.                                                                                                                                                                                                                                                                                                                                                                                       |
| 5 — Patterns + Glossary + Start Here | **Shipped**           | Start Here actionable deep links (Library, Compare, Patterns, Templates) with plain-language rationale; header glossary search; inline glossary on detail and pattern pages.                                                                                                                                                                                                                                                                                                                                      |
| 6 — QA + Release                     | **Shipped**           | Critical-path E2E matrix, per-route a11y, content-review contracts, `npm run precommit` green, live audit [`docs/audits/live-browser-audit-2026-06-19-epic-6.md`](audits/live-browser-audit-2026-06-19-epic-6.md), tag `v1.0.0-rc.1`. Graph UI shipped in Epic 9.                                                                                                                                                                                                                                                 |
| 7 — Platform Trust & Hardening       | **Shipped**           | About/trust page, manual a11y playbook, SecDevOps docs, live audit template — [`docs/plans/epic-7-platform-trust-hardening.md`](plans/epic-7-platform-trust-hardening.md), audit [`docs/audits/live-browser-audit-2026-06-19-epic-7.md`](audits/live-browser-audit-2026-06-19-epic-7.md).                                                                                                                                                                                                                         |
| 8 — MITRE Threat Lens                | **Shipped**           | ATT&CK Enterprise + ICS, D3FEND countermeasures, Compare threat chain — [`docs/plans/epic-8-mitre-threat-lens.md`](plans/epic-8-mitre-threat-lens.md), audit [`docs/audits/live-browser-audit-2026-06-19-epic-8.md`](audits/live-browser-audit-2026-06-19-epic-8.md).                                                                                                                                                                                                                                             |
| 9 — Interactive Relationship Graph   | **Shipped**           | Object-local relationship diagram in Library detail, provenance filters, lazy graph surface, table fallback — [`docs/plans/epic-9-relationship-graph.md`](plans/epic-9-relationship-graph.md), ADR [`0011`](adr/0011-graph-library.md), audit [`docs/audits/live-browser-audit-2026-06-19-epic-9.md`](audits/live-browser-audit-2026-06-19-epic-9.md).                                                                                                                                                            |
| 10 — Atlas Map-First UX              | **Shipped**           | v2.2 + stability pass + **Frontend Overhaul** + **Frontend Full Review remediation** + Map Foundation v4.0 + **SPR-20260708 remediation** (staged graph bootstrap, sharded library search, live smoke CI, trust/UX polish) — [`docs/plans/epic-10-atlas-map-ux.md`](plans/epic-10-atlas-map-ux.md), [`docs/superpowers/plans/2026-06-22-map-foundation-v4.md`](superpowers/plans/2026-06-22-map-foundation-v4.md), [`docs/audits/frontend-full-review-2026-06-22.md`](audits/frontend-full-review-2026-06-22.md). |

## Active Direction

`docs/PRD.md` is the canonical source of truth. `docs/roadmap.md` defines epics 0–6.

As of June 19, 2026, `main` ships the translation-first React shell through Epic 6 with release candidate tag `v1.0.0-rc.1`.

## Translation-First Product Standard

Build for translation, not complexity.

Control Atlas is not a data explorer first. It is a public reference workbench that translates complex cybersecurity guidance into clear, traceable user action.

Future work must preserve this order:

1. User intent
2. Plain-language meaning
3. Visible relationships
4. Source trust
5. Recommended next action
6. Raw technical detail only on demand

No roadmap item may be accepted unless it identifies the user confusion it reduces and the action it enables.

No backend or user, organization, or system data is part of this product direction.

## Current Baseline

- Static GitHub Pages application (React shell in `src/ui/`)
- Public-data-only build pipeline
- Source registry schema `4.0`
- Stable `sources`, `nodes`, `edges`, `evidence`, and `graph-health` artifacts; sharded library search; and record-indexed Atlas neighborhood shards
- Library search, Compare workbenches, Sources registry, Patterns, Templates shell, Start Here, glossary drawer
- Provenance-aware CSV/Markdown/JSON exports on Compare surfaces

## Development Readiness Checklist

- [x] Canonical PRD updated to Control Atlas v3.0
- [x] Static, public-data-only baseline retained
- [x] Epic 0 shell, schema, and Pages deploy parity
- [x] Epic 1 provenance registry and graph contract on generated bundles
- [x] Epic 2 Library + Search shipped
- [x] Epic 3 Compare shipped
- [x] Epic 4 Template Factory QA complete
- [x] Epic 5 Start Here deep links and PRD alignment complete
- [x] Epic 6 release candidate (`v1.0.0-rc.1`)
- [x] Epic 7 platform trust & hardening (About page, a11y playbook, SecDevOps docs)

## Recommended Sequence (post-MVP)

1. **Owner release decision** — review the finalization evidence and explicitly accept or defer the documented human screen-reader and real-device residuals
2. **Optional, separately owner-approved** — create and publish `v1.0.0`; this verification sprint does not itself authorize the tag or release
3. **Maintenance** — address Node runtime notices and install-fallback cleanup in separately verified maintenance work

## Historical Delivery Records

Plans for Issues 8–12, older source-hardening proposals, and dated browser audits remain historical evidence. They inform implementation; they do not override this index.

## Delivery Rules

1. Work on a task branch.
2. Preserve the adopted graph and runtime contracts unless a separately approved migration requires change.
3. Keep every increment static, public-data-only, and deployable.
4. Run task-specific checks and `npm run precommit` before ship.
5. Update **Plan.md**, **prd-v3-alignment-backlog.md**, and **context.md** when an epic or sprint status changes.
6. Complete a live Pages audit for runtime/public-shell changes before epic closeout.
