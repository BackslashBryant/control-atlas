# UI/UX remediation — 2026-07-21

## Outcome

Make the public site immediately understandable to a first-time user: one clear next action per surface, progressive disclosure for supporting detail, explicit downloads, and bounded result lists.

## Constraints

- Preserve source truth, provenance, and existing routes.
- Use the existing React and Radix component stack; add no dependency unless a verified gap requires it.
- Keep changes reversible and deploy only after local gates and live-route checks pass.
- Do not start a development server outside the repository's automated test scripts.

## Acceptance criteria

- The landing page has one primary call to action above the fold and no timed entrance or rotating shortcut label.
- The persistent header exposes one search control at each breakpoint.
- Start Here presents one recommended next step; alternatives are collapsed.
- Compare shows at most 25 relationship rows per page, a visible result range, and a compact mobile-readable row structure.
- Template format and environment appear before the download action; the action names the downloaded file type.
- Selecting an Atlas source opens its source details before browsing and filter controls.
- Help, playbook, record, About, and empty states present one primary next action and progressively disclose alternatives.
- Interactive targets are at least 24 by 24 CSS pixels, focus remains visible, and page heading order is logical.
- Existing provenance, disclaimer, download, routing, accessibility, and responsive behavior remain covered by automated checks.

## Verification

1. Focused unit and browser tests for the changed contracts.
2. `npm run precommit`.
3. Production build stability check.
4. Local browser checks at desktop and mobile widths.
5. After merge, GitHub Pages deployment and live-route verification.

## Rollback

Revert the remediation commit. No data, schema, or dependency migration is introduced.
