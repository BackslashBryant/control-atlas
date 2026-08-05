# ADR 0013: Experience Guardian on the existing verification stack

Status: Accepted (2026-08-03)

## Context

Control Atlas needs a permanent review system for copy ownership, route
coverage, accessibility, visual hierarchy, and screenshot evidence. The site is
already a static Vite/React/TypeScript application with Vale, ESLint,
Playwright, and axe-core in its development toolchain. The Guardian must not
become a second browser harness, design-token engine, or content-management
system.

## Open-source platform gate

Serious maintained candidates were evaluated before implementation:

| Candidate | License | Fit | Decision |
|---|---|---|---|
| Playwright screenshot comparison and browser assertions | Apache-2.0 | Already runs the app's desktop, mobile, accessibility, E2E, and visual checks; supports screenshots, project configuration, and DOM assertions. | Reuse for the rendered Guardian. |
| axe-core with `@axe-core/playwright` | MPL-2.0 | Already installed and used for WCAG checks in the real rendered DOM. | Reuse for blocking serious and critical accessibility findings. |
| Vale custom styles | MIT | Already governs prose and supports repository-owned vocabulary rules. | Keep for prose linting and the existing copy inventory. |
| ESLint custom rules | MIT | Strong AST rule platform, but a plugin would add packaging and maintenance overhead for repository-specific copy ownership and route-matrix checks. | Keep for code quality; do not add a Guardian plugin yet. |
| A new visual-review SaaS or bespoke crawler | Varies | Adds accounts, uploads, lifecycle cost, or duplicates the existing static server and browser harness. | Reject for v1. |

Authoritative references:

- Playwright visual comparisons: <https://playwright.dev/docs/test-snapshots>
- Playwright license: <https://github.com/microsoft/playwright/blob/main/LICENSE>
- axe-core project and license: <https://github.com/dequelabs/axe-core>
- Vale documentation: <https://docs.vale.sh/>
- ESLint custom-rule guidance: <https://eslint.org/docs/latest/extend/custom-rules>

## Decision

Use the existing stack with no new dependency:

1. `tools/experience-guardian.mjs` performs fast deterministic copy, token,
   ownership, naming, and active-route coverage checks.
2. `config/experience-guardian/control-atlas-experience-guardian.md` is the canonical review
   agent instruction.
3. `config/experience-guardian/copy-ownership.json` owns the boundary between
   product copy, official publisher text, legal material, accessibility labels,
   and fixtures.
4. `config/experience-guardian/route-matrix.json` is the authoritative rendered
   coverage register.
5. Playwright renders every registered desktop and mobile state, runs axe, saves
   screenshots, and writes machine- and human-readable reports.
6. `review:experience:fast` blocks CI. `review:experience` adds rendered review;
   judgment findings remain report-only until a repeated issue becomes a
   focused deterministic rule.

## Consequences

- A new active route fails the fast gate until it has desktop and mobile review
  coverage.
- Official publisher text is never submitted to product-voice rewriting.
- The route matrix and reports are repository artifacts and work offline after
  dependencies are installed.
- Pixel baselines remain in the existing visual suite. Guardian screenshots are
  review evidence, not a second baseline store.
