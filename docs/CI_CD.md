# Control Atlas CI/CD

- **Owner:** Nexus and Pixel
- **Status:** Canonical
- **Last reviewed:** 2026-08-25
- **Supersession:** Update this contract and the corresponding workflows or package scripts in the same approved change.

Control Atlas uses three GitHub Actions workflows with one immutable site artifact.

## Workflow responsibilities

- `ci.yml` classifies changes once, runs independent quality gates, builds the site once, and publishes `site-build` for the exact commit SHA.
- `security.yml` runs dependency review, CodeQL, secret scanning, and repository hygiene without rebuilding the site.
- `deploy.yml` accepts only a successful `main` push CI run, verifies `release.json`, deploys that exact artifact, then runs production smoke and Lighthouse checks.

## Pull request graph

`Change map` determines which gates are required. Lint, types, unit tests, build, contracts, browser shards, accessibility, visual regression, Lighthouse, and workflow lint report independently. `Required CI` fails if any selected gate fails or is cancelled.

The final `checks` job mirrors `Required CI` for compatibility with the repository's existing protected-branch status context. It does not bypass or duplicate validation.

Routine checkout uses depth 1 and fetches only the comparison base SHA. Full history is reserved for the scheduled deep secret scan.

## Change-map policy

- Runtime, style, data, dependency, and browser-test changes produce a site artifact and exercise the relevant browser gates.
- Data and dependency changes force a deterministic full build.
- Workflow-only changes run fast contracts, security, and actionlint without a site build.
- Audit evidence changes run the narrow evidence-integrity gate and do not deploy.
- Unknown paths fail closed as runtime code.

## Browser policy

- Pull requests use Chromium with two functional shards, axe accessibility checks, and three deliberate visual snapshots.
- Nightly verification runs the complete functional suite in Chromium, Firefox, and WebKit.
- Browser binaries are installed only for the engine each job needs. They are not cached until timing data justifies that complexity.

## Deployment guarantees

Production deployment never rebuilds routine releases. The deploy workflow downloads `site-build`, verifies that `release.json` matches the successful CI run SHA, publishes through native GitHub Pages permissions, then verifies the same SHA at the public edge.
