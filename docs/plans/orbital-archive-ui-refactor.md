# Orbital Archive UI Refactor

## Outcome

Apply the Orbital Archive No. 01 v1.5.0 design system across every Control Atlas route without changing public data, deep links, exports, source truth, or task behavior.

## Acceptance Boundaries

- Canonical Lunar Signal Modernism tokens are centralized in `styles/tokens.css`.
- Shared shell, context, controls, cards, tables, dialogs, and responsive behavior use those tokens.
- Purple, violet, pink, and magenta do not appear in user-facing implementation.
- Every route has an explicit depth and mission context.
- Desktop and compact layouts keep the primary task first and remain keyboard and screen-reader operable.
- Fast contracts, full precommit, browser accessibility, E2E behavior, and visual baselines pass before completion.
- No push, merge, deployment, tag, or release is authorized by this plan.

## Route and Depth Matrix

| Hash route | View | Depth | Primary pattern |
|---|---|---:|---|
| `#/` | Home | 0 | Editorial signal landing |
| `#/menu` | Menu | 0 | Route chooser |
| `#/start` | Start Here | 1 | Guided workflow |
| `#/explore` | Explore | 1 | Search and filters |
| `#/library` | Library | 1 | Catalog browse |
| `#/library/:catalog` | Catalog | 1 | Catalog inventory |
| `#/record/:catalog/:item` | Record | 2 | Source-backed record detail |
| `#/atlas-map` | Atlas | 1/2 | Spatial path and focused record |
| `#/compare` | Compare | 1 | Comparison setup and matrix |
| `#/commons` | Commons | 1 | External resource index |
| `#/commons-detail` | Commons detail | 2 | Resource detail |
| `#/playbooks` | Guides | 1 | Task guidance |
| `#/templates` | Documents | 1 | Generator workflow |
| `#/sources` | Sources | 1/2 | Publisher inventory and detail |
| `#/about` | About | 0 | Product and trust boundary |
| `#/retired` | Retired | 0 | Retired identifier recovery |
| Unknown | Not found | 0 | Route recovery |

## Verification Ladder

1. `npm run typecheck`
2. `npm run test:browser`
3. `node --test tests/a11y-contract.test.mjs tests/build-layout-contract.test.mjs`
4. `npm run precommit`
5. Playwright accessibility, E2E, and approved visual suites on the repository's guarded loopback server

Pinned Ubuntu/Chromium baselines remain the authoritative visual comparison environment; local screenshots are review evidence, not a replacement for that gate.
