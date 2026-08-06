# Live Browser Audit - Post Ship - 2026-06-14

Target: `https://backslashbryant.github.io/control-atlas/`

Audited deployed commit: `7e3e227`

## Passed

- The deployed Control Atlas Pages site loads at the expected public URL with the Control Atlas title, branding, footer disclaimer, and full top-level navigation.
- The onboarding overlay is present on first load and dismissible.
- The live Provenance page now exposes all Epic 1 controls:
  - `Source class`
  - `Eligibility`
  - `Lifecycle`
  - `Access`
- The live Provenance page now exposes `View source details` actions on source cards.
- Searching for `AC-2` still returns the expected NIST control first.
- AC-2 detail still separates defining source, relationship type, provenance, confidence, and evidence quality.
- AC-2 detail now exposes the Epic 1 `Open source details` control under `Defining public source`.
- The live five-artifact runtime contract is intact:
  - `sources.json`: 25
  - `nodes.json`: 8,076
  - `edges.json`: 8,252
  - `evidence.json`: 8,252
  - `graph-health.json`: 705 findings
- A `390 x 844` viewport has no horizontal overflow.

## Remaining Live Findings

- The browser still reports: `The Content Security Policy directive 'frame-ancestors' is ignored when delivered via a <meta> element.`
- The deployed site still returns a `404` for `https://backslashbryant.github.io/favicon.ico`.

## Assessment

The deployed Pages site now serves the shipped Epic 1 Provenance Registry shell successfully. The earlier live-audit gap was a deployment-state issue, not a local branch correctness issue.
