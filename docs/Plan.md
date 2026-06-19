# Control Atlas Delivery Index

## Product Identity

- Public product name: **Control Atlas**
- Campaign line: **Ctrl+Alt+Comply**
- Tagline: **The public map for federal cyber compliance.**
- Supporting line: Open-source reference workbench for mapping controls, tracing frameworks, and generating blank RMF/ATO templates - no login, no evidence upload, no organizational data required.

## Canonical Doc Hierarchy

Read and update docs in this order when status changes:

1. [`docs/PRD.md`](PRD.md) — requirements (change only when product intent changes)
2. **This file** — delivery index, epic status, active sprint
3. [`docs/plans/prd-v3-alignment-backlog.md`](plans/prd-v3-alignment-backlog.md) — open PRD gaps only
4. [`docs/context.md`](context.md) — short session handoff (must mirror active sprint here)
5. [`docs/roadmap.md`](roadmap.md) — epic definitions and dependencies (stable; update sequence footers only)

Agents must not mark work complete in chat without updating **Plan.md** and **prd-v3-alignment-backlog.md** in the same ship commit when an epic or sprint closes.

## Active Sprint

**Epic 6: QA + Accessibility + Release**

**Goal:** Expand E2E critical-path coverage, harden accessibility, complete content review, and cut a versioned release candidate.

**Open gaps:** See [`docs/plans/prd-v3-alignment-backlog.md`](plans/prd-v3-alignment-backlog.md) Epic 6.

**Branch pattern:** `agent/pixel/epic-6-qa-release`

**Exit checks:** `npm run precommit`; full critical-path E2E matrix; release tag candidate.

## Epic Status (June 19, 2026)

| Epic | Status | Notes |
| --- | --- | --- |
| 0 — Migration | **Closed (residual)** | React shell, schema extensions, CI/Pages parity shipped. D3 graph provenance coloring remains in legacy `app.mjs` only; React shell does not mount the graph view. |
| 1 — Data Backbone | **Closed (residual)** | Build pipeline emits `plain_language_summary`, edge provenance fields, and registry-backed sources. Contract tests enforce quality; ongoing importer tuning is maintenance, not a blocker. |
| 2 — Library + Search | **Shipped** | MiniSearch index, facets, library detail, deep links, "What to do next". |
| 3 — Compare | **Shipped** | Relationship table with provenance, STIG→CCI→NIST trace, baseline delta, exports (`81daf6d`). |
| 4 — Template Factory | **Shipped** | Nine PRD-aligned templates, artifact-first UI, disclaimer + source metadata on all exports, unit + E2E generation coverage. |
| 5 — Patterns + Glossary + Start Here | **Shipped** | Start Here actionable deep links (Library, Compare, Patterns, Templates) with plain-language rationale; header glossary search; inline glossary on detail and pattern pages. |
| 6 — QA + Release | **Active** | Partial Playwright/a11y coverage; release candidate and content review remain. |

## Active Direction

`docs/PRD.md` is the canonical source of truth. `docs/roadmap.md` defines epics 0–6.

As of June 19, 2026, `main` and the public GitHub Pages shell (`https://backslashbryant.github.io/control-atlas/`) are in parity for the translation-first React shell through Epic 4.

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
- Stable `sources`, `nodes`, `edges`, `evidence`, `graph-health`, and `library-search` bundles
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
- [ ] Epic 6 release candidate

## Recommended Sequence (after Epic 4)

1. **Epic 6 (active)** — E2E expansion, a11y hardening, content review, release tag

## Historical Delivery Records

Plans for Issues 8–12, older source-hardening proposals, and dated browser audits remain historical evidence. They inform implementation; they do not override this index.

## Delivery Rules

1. Work on a task branch.
2. Preserve the adopted graph and runtime contracts unless a separately approved migration requires change.
3. Keep every increment static, public-data-only, and deployable.
4. Run task-specific checks and `npm run precommit` before ship.
5. Update **Plan.md**, **prd-v3-alignment-backlog.md**, and **context.md** when an epic or sprint status changes.
6. Complete a live Pages audit for runtime/public-shell changes before epic closeout.
