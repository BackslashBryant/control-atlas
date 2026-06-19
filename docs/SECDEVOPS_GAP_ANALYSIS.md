# SecDevOps Gap Analysis

Analysis date: 2026-06-14
**Epic 7 update:** 2026-06-19

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
| Accessibility automation | `npm run test:a11y` per-route axe in CI and precommit |
| Manual a11y release playbook | [`docs/audits/a11y-manual-checklist.md`](audits/a11y-manual-checklist.md) |
| Live Pages audit template | [`docs/audits/live-pages-audit-template.md`](audits/live-pages-audit-template.md) |

## Partially Present

| Required control | Current evidence | Missing next |
| --- | --- | --- |
| Secret scanning | `secret-scan.yml` runs gitleaks and GitHub secret scanning plus push protection are enabled | Re-verify hosted settings after admin changes |
| Static build gate | CI, Pages, nightly, and precommit all run `npm run build:site` before verification | Keep the staged-output contract covered as repo layout evolves |
| Branch protection verification | Policy documented in [`docs/audits/branch-protection-verification-2026-06-19.md`](audits/branch-protection-verification-2026-06-19.md) | Paste authenticated `gh api` JSON when credentials available |

## Closed or Deferred (Epic 7)

| Required control | Status | Evidence |
| --- | --- | --- |
| Release audit coverage | **Closed** | Repeatable template + Epic 7 live audit |
| Accessibility manual audit | **Closed** | Checklist + release gate in PRODUCTION_READINESS |
| Action pinning | **Deferred** | [`docs/adr/0012-defer-github-actions-sha-pinning.md`](adr/0012-defer-github-actions-sha-pinning.md) — major-version tags + Dependabot |

## Priority Order (post–Epic 7)

1. Authenticated branch protection API verification when `gh` is available.
2. Revisit SHA pinning when org policy or authenticated SHA resolution is available.

Existing workflows should be extended, not replaced blindly. Security automation must not introduce a backend, telemetry, or any production patching bot behavior.
