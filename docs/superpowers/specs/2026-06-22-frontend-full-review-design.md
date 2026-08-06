# Frontend Full Review and Remediation Design

## Purpose

Review every shipped Control Atlas frontend route and shared interface component, correct confirmed defects, and ship the remediated frontend to `main`.

Muse owns user-facing decisions. Pixel verification supplies objective evidence through automated checks and route-level browser coverage.

## Product constraints

- Preserve the current dark cartographic identity and React/HashRouter architecture.
- Apply the translation-first standard: every primary surface explains what it is, why it matters, and what the user should do next.
- Keep source truth, interpretation, confidence, and recommendations distinct.
- Do not add backend behavior, authentication, evidence upload, or organizational-data handling.
- Keep changes focused on confirmed frontend defects and standards drift.
- Do not start an ad hoc development server. Use repository scripts and the configured test harness only when authorized by repository rules.

## Review surface

The audit covers:

- Home
- Start
- Atlas Map
- Explore and search results
- Record detail and relationship views
- Compare workbenches
- Playbooks
- Templates
- Sources
- About and trust
- Search overlay, glossary/help drawer, onboarding, navigation, footer, loading, error, empty, and retired-query states

## Quality standard

Each route and shared component must meet these requirements:

1. Clear page purpose and hierarchy.
2. A visible next action.
3. Plain-language labels and supporting copy.
4. Responsive behavior at desktop, tablet, and narrow mobile widths.
5. Full keyboard operation and visible focus.
6. Correct landmarks, headings, names, descriptions, and state announcements.
7. WCAG 2.1 AA color contrast for normal text and essential controls.
8. No content clipping, unintended horizontal page scrolling, overlapping controls, or inaccessible off-screen actions.
9. Loading, partial-data, error, empty, and offline states remain understandable and actionable.
10. Shared design tokens and components are used consistently.
11. Motion respects reduced-motion preferences.
12. Legacy deep links and current hash routes continue to work.

## Remediation method

The review is evidence-driven:

1. Establish a clean automated baseline.
2. Inspect route structure, copy, interaction contracts, and CSS.
3. Reproduce each suspected defect.
4. Add a failing regression test for behavioral defects.
5. Apply the smallest root-cause fix.
6. Re-run focused tests after each fix.
7. Run the complete repository gate before shipping.

Pure visual-token corrections that cannot be meaningfully unit-tested will be protected by focused CSS or browser-contract assertions and route-level accessibility checks.

## Deliverables

- Prioritized audit record with confirmed findings and resolutions.
- Regression coverage for corrected behavior.
- Frontend code and style corrections.
- Updated delivery/status documentation when the remediation sprint closes.
- Verified feature branch, merged `main`, and passing remote checks.

## Acceptance criteria

- No unresolved critical or high-severity frontend findings.
- Every shipped route satisfies the quality standard above.
- All focused regression tests pass.
- `npm run precommit` passes on the feature branch and merged `main`.
- Git status and diff scope are reviewed before shipping.
- Remote checks pass after `main` is pushed.

