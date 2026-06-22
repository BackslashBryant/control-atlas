# Frontend Full Review — June 22, 2026

## Scope

Muse reviewed the complete shipped Control Atlas frontend against:

- `docs/DESIGN_PRINCIPLES.md`
- `docs/design/translation-first-design.md`
- `docs/design/content-style-guide.md`
- `docs/design/design-system.md`
- the accessibility and responsive requirements in `docs/PRD.md`

The review covers Home, Start, Atlas Map, Explore, record detail, Compare, Playbooks, Templates, Sources, About, search, help/glossary, onboarding, loading, error, empty, and retired-query states.

## Verdict

No unresolved critical or high-severity code findings remain after remediation.

Final browser, accessibility, responsive, and end-to-end execution remains the release gate because it launches the repository-configured static test server on port 4317.

## Confirmed findings and resolutions

| Severity | Finding | Root cause | Resolution | Regression evidence |
| --- | --- | --- | --- | --- |
| High | Global search overlay had no visible trigger on narrow layouts. | `TopNav` accepted `onOpenSearch` but never rendered a control that used it. | Added a named mobile search trigger, retained desktop header search, and associated staged-loading guidance with the field. | `tests/browser-contract.test.mjs`; `tests/e2e/control-atlas-shell.spec.mjs` |
| High | Search and glossary dialog controls were not fully named. | The search input relied on placeholder text and the glossary close button contained only an icon. | Added explicit accessible names and complete tab/panel relationships. | `tests/a11y-contract.test.mjs` |
| High | Start could submit incomplete context and render no result. | The recommendation engine correctly returned `null`, but the UI allowed `step=results` without all three answers. | Added a shared completeness rule, disabled submission until complete, and added actionable guidance. | `tests/start-here-recommendations.test.mjs`; `tests/e2e/start-here.spec.mjs` |
| High | Secondary and provenance badge text failed WCAG AA contrast on dark cards. | Visual graph colors were reused directly as small text colors. | Raised secondary text contrast and introduced separate accessible provenance text tokens while preserving graph identity colors. | Contrast calculation in `tests/a11y-contract.test.mjs` |
| Medium | Intent cards used headings and paragraphs inside native buttons. | Card visual structure was implemented with flow content that is invalid inside a button. | Replaced nested headings and paragraphs with styled text spans while preserving the card’s single-button interaction. | `tests/browser-contract.test.mjs` |
| Medium | Atlas Map could show a stale selected item after route-driven center changes. | Local selected-node and search-draft state initialized from route state but did not synchronize afterward. | Synchronized both values when the route center or search term changes. | `tests/browser-contract.test.mjs` |
| Medium | Explore could render an empty results container with no explanation after enabling “connections only.” | Overall result state used pre-filter records instead of visible filtered records. | Added visible-result accounting and a specific recovery state with “Show all matching records.” | `tests/browser-contract.test.mjs`; `tests/e2e/control-atlas-shell.spec.mjs` |
| Medium | Explore copied legacy query-string links and search overlay detail links stored the item ID as navigation origin. | Link generation bypassed the canonical hash serializer; the overlay passed the wrong second argument to `onOpenNode`. | Canonicalized copied detail URLs and restored `search` as the navigation origin. | `tests/browser-contract.test.mjs` |
| Medium | Template advanced options were expanded by default and help text was not associated with fields. | The accordion set `defaultValue="options"` and rendered standalone hint paragraphs. | Collapsed advanced options by default, moved guidance into `SelectField`, and respected reduced motion during focus/scroll. | `tests/browser-contract.test.mjs`; `tests/e2e/control-atlas-shell.spec.mjs` |
| Medium | Compact icon and chip controls could fall below a 44-pixel touch target. | Shared control styles had padding but no minimum dimensions. | Added shared 44-by-44 minimum targets and kept copy controls visible on touch-only devices. | `tests/a11y-contract.test.mjs` |
| Medium | Secondary route code was loaded eagerly. | `App.tsx` imported every page into the initial application chunk. | Lazy-loaded all secondary routes behind a Suspense loading state. The main minified chunk fell from about 518 KB to 383 KB. | `tests/browser-contract.test.mjs`; `npm run build:site` |
| Low | Source cards labeled every artifact as an “official source.” | Shared copy did not account for community and referenced sources. | Changed the action to “Open source artifact.” | Content inspection and existing source trust contracts |
| Low | The documented port-status command was absent and did not include the Playwright port. | `AGENTS.md` and repository tooling had drifted from `package.json`. | Restored `npm run ports:status` and included port 4317. | `tests/package-scripts.test.mjs`; `npm run ports:status` |

## Route review matrix

| Surface | Purpose and next action | Trust/source separation | Keyboard and names | Responsive contract | State handling |
| --- | --- | --- | --- | --- | --- |
| Home | Pass | Pass | Pass | Browser gate pending | Pass |
| Start | Remediated | Pass | Remediated | Browser gate pending | Remediated |
| Atlas Map | Pass | Pass | Pass | Browser gate pending | Remediated |
| Explore | Pass | Pass | Remediated | Browser gate pending | Remediated |
| Record detail | Pass | Pass | Pass | Browser gate pending | Pass |
| Compare | Pass | Pass | Pass | Browser gate pending | Pass |
| Playbooks | Pass | Pass | Pass | Browser gate pending | Pass |
| Templates | Remediated | Pass | Remediated | Browser gate pending | Remediated |
| Sources | Pass | Pass | Pass | Browser gate pending | Pass |
| About | Pass | Pass | Pass | Browser gate pending | Pass |
| Search overlay | Remediated | Pass | Remediated | Browser gate pending | Pass |
| Help and glossary | Pass | Pass | Remediated | Browser gate pending | Pass |
| Loading, error, empty, retired | Pass | Pass | Pass | Browser gate pending | Remediated |

## Verification evidence

Completed:

- `npm run ports:status` — no listeners on 4317, 3000, 3001, or 3002
- `npm run build:site` — pass
- `npm run lint` — pass
- `npm run typecheck` — pass
- `npm run license:check` — pass
- `npm test` — 137 tests passed
- `npm run test:browser` — 12 tests passed
- `npm run smoke:dom` — pass
- `npm run verify:public` — pass

Pending release gate:

- `npm run test:a11y`
- `npm run test:e2e`
- `npm run precommit`
- merged-`main` rerun and remote checks

## Performance note

Secondary route splitting reduced the initial application chunk by about 26%. The remaining build warning is isolated to the lazy-loaded interactive graph chunk, which contains Cytoscape and its layout extensions and is not part of the initial route payload.
