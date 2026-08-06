# Live Browser Audit - Epic 1 - 2026-06-14

Target: `https://backslashbryant.github.io/control-atlas/`

Audit date: `2026-06-14`

Audit basis: live GitHub Pages behavior only. This audit does not assume local branch state is deployed.

## Passed

- The deployed page loads at the Control Atlas Pages URL and presents the expected Control Atlas title, branding, footer disclaimer, and top-level navigation.
- The onboarding overlay appears on first load and is dismissible.
- Search for `AC-2` returns the expected NIST control first.
- AC-2 detail still separates defining source, relationship type, provenance, confidence, and evidence quality.
- AC-2 detail still provides the accessible relationship list text alternative.
- The Provenance page loads and shows current live source inventory and graph-health counts.
- Live generated artifact counts are available and consistent across the five-artifact runtime contract:
  - `sources.json`: 25
  - `nodes.json`: 8,076
  - `edges.json`: 8,252
  - `evidence.json`: 8,252
  - `graph-health.json`: 705 findings
- A `390 x 844` viewport has no horizontal overflow.

## Failed

- AC-2 detail does **not** expose the Epic 1 `Open source details` control under `Defining public source`.
- The Provenance page does **not** expose the Epic 1 filters for source class, eligibility, lifecycle, or access.
- The Provenance page does **not** expose `View source details` actions on source records.
- The Provenance page does **not** expose the Epic 1 source-detail surface for license/use, retrieval metadata, framework scope, or graph-eligibility explanation.
- Excluded, limited, and draft sources are visible, but the deployed shell does **not** show the new explicit warning copy required by Epic 1.

## Console Findings

- The browser reports: `The Content Security Policy directive 'frame-ancestors' is ignored when delivered via a <meta> element.`
- The browser reports a live `404` for `https://backslashbryant.github.io/favicon.ico`.

## Assessment

The deployed Pages site is reachable and serving the current Control Atlas public shell, but it is **not** serving the full Epic 1 Provenance Registry UI that was implemented locally on the feature branch. The live site appears to have newer runtime data counts without the corresponding Epic 1 shell updates.

## Open

- Deploy the Epic 1 branch changes to Pages, then rerun the live audit against the deployed site.
- Decide whether the favicon `404` should be fixed as part of Epic 0 closeout or the next public-shell pass.
- Decide whether the CSP `frame-ancestors` warning should be resolved by moving that policy to headers/workflow-controlled delivery instead of the current `<meta>` form.
