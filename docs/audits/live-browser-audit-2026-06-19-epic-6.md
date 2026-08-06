# Live Browser Audit - Epic 6 Release Candidate - 2026-06-19

Target: `https://backslashbryant.github.io/control-atlas/`

Audited branch commit (pre-merge): `agent/pixel/epic-6-qa-release` at `774b41f` baseline; Epic 6 QA changes verified on staged `dist/site` via `npm run precommit`.

## Verification gates (automated)

| Gate | Command | Result |
| --- | --- | --- |
| Full ship gate | `npm run precommit` | Pass (lint, typecheck, license, unit/contract, browser, smoke, verify, a11y, e2e) |
| Dependency audit | `npm run audit:deps` | Pass — no high/critical vulnerabilities |
| E2E critical path | `tests/e2e/critical-path-matrix.spec.mjs` | 6/6 pass |
| Accessibility | `tests/e2e/accessibility.spec.mjs` | 11/11 pass — zero serious/critical axe violations |
| Content review | `tests/content-review.test.mjs` | 5/5 pass |
| A11y contracts | `tests/a11y-contract.test.mjs` | 3/3 pass |

Total Playwright suite at closeout: **40 passed** (includes template generation, Start Here navigation, Compare workbenches, landing flows).

## Passed (staged shell + live smoke)

- Control Atlas title, tagline, and translation-first landing hero render on staged build.
- Primary navigation order: Start Here, Library, Compare, Patterns, Templates, Sources.
- Start Here produces Library, Compare, Patterns, and Templates recommendations without storing data.
- Library search for `AC-2` returns Account Management; detail page shows plain-language sections before advanced details.
- Compare framework workbench opens summary-first results with CSV/Markdown/JSON export and Detailed mappings table (`aria-label="Relationship mappings"`).
- STIG chain workbench exposes labeled summary table (`aria-label="STIG chain summary"`) and trace flow.
- Baseline compare shows shared/only-in deltas with export actions.
- Template Factory generates all nine templates client-side with disclaimer and source metadata.
- Sources registry supports trust filters and source detail drill-down.
- Patterns open outcome-first detail pages with limitations and next actions.
- Footer disclaimer states the product does not make compliance or authorization decisions.
- Keyboard smoke: Start Here nav button and header search accept focus and Enter activation.
- Live Pages URL responds and serves the Control Atlas shell (pre-deploy parity with prior `main` ship).

## Residual / deferred (documented, non-blocking)

- **Graph UI:** D3 graph view remains legacy-only (`src/app/app.mjs`). React shell uses Compare tables and library relationship cards as the accessible tabular path. Graph migration is deferred to a future epic.
- **Live Pages post-merge:** Epic 6 code ships after merge; re-run this checklist against live Pages once `pages.yml` deploy completes if runtime hash differs from staged build.
- **Font CSP console noise:** Google Fonts preload may log CSP `connect-src` warnings in Playwright; no user-facing breakage observed.
- **Favicon 404 at site root:** prior audits noted `/favicon.ico` 404; app serves favicon from staged assets.

## Manual checks noted

- Keyboard-only pass through header nav: covered by Playwright focus/Enter smoke on Start Here and search field.
- 390×844 responsive overflow: prior June 14 audit passed; no layout regressions observed in Epic 6 diff (test-only + one `aria-label`).

## Assessment

Epic 6 acceptance criteria are met on the staged release candidate. The MVP release candidate tag `v1.0.0-rc.1` is justified after merge to `main` and CI green.
