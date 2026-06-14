# SecDevOps Gap Analysis

Analysis date: 2026-06-14

## Workflow Baseline

- `.github/workflows/ci.yml`: dependency audit, staged build, lint, typecheck, contract checks, browser checks, Playwright, SBOM artifact upload
- `.github/workflows/pages.yml`: audit, staged build, runtime checks, public verification, Playwright, SBOM generation, GitHub Pages deploy
- `.github/workflows/codeql.yml`: JavaScript CodeQL
- `.github/workflows/secret-scan.yml`: gitleaks-based secret scan
- `.github/workflows/nightly-refresh.yml`: scheduled public-data refresh plus staged-build verification

## Already Present

| Required control | Current evidence |
| --- | --- |
| Unit tests | `npm test` in local and CI flows |
| Build | Static-site staging and Pages deployment in `pages.yml` |
| Lint | `npm run lint` in local, CI, Pages, and precommit flows |
| Type check | `npm run typecheck` in local, CI, Pages, and precommit flows |
| Data schema validation | Source and graph contract tests plus build validation |
| Source/provenance registry validation | `tests/source-registry.test.mjs` and graph contract coverage |
| Relationship validation | Graph contract and runtime tests over `edges`, `evidence`, and `graph-health` |
| npm audit | `npm run audit:deps` in CI, Pages, and nightly refresh |
| CodeQL | `codeql.yml` |
| CycloneDX SBOM | `npm run sbom:generate` plus artifact upload |
| Playwright E2E tests | `tests/e2e/control-atlas-shell.spec.mjs` in local, CI, Pages, and precommit flows |
| Dependency review | `.github/workflows/dependency-review.yml` |
| Dependabot | `.github/dependabot.yml` for npm and GitHub Actions |
| License check | `npm run license:check` in local, CI, Pages, nightly, and precommit flows |
| GitHub secret scanning and push protection | Enabled at the repository settings level after the hosted rename |
| GitHub Pages deployment | `pages.yml` |

## Partially Present

| Required control | Current evidence | Missing next |
| --- | --- | --- |
| Accessibility smoke tests | `smoke:dom` plus browser/shell marker tests | Add explicit accessibility automation and keep manual release audit |
| Secret scanning | `secret-scan.yml` runs gitleaks and GitHub secret scanning plus push protection are enabled | Keep release evidence that hosted settings remain enabled after future admin changes |
| Static build gate | CI, Pages, nightly, and precommit all run `npm run build:site` before verification | Keep the staged-output contract covered as repo layout evolves |
| Release audit coverage | Browser contract tests and historical live audits exist | Add repeatable Control Atlas live Pages audit checklist for every public-shell change |

## Missing Next

| Required control | Recommended implementation |
| --- | --- |
| Branch protection verification | Document and enforce protected `main` gates outside repo contents |
| Action pinning | Review tag-based GitHub Actions usage and decide on SHA pinning |

## Priority Order

1. Accessibility automation plus repeatable live Pages audit evidence.
2. Branch protection verification and action pinning.

Existing workflows should be extended, not replaced blindly. Security automation must not introduce a backend, telemetry, or any production patching bot behavior.
