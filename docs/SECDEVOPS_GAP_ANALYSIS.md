# SecDevOps Gap Analysis

Analysis date: 2026-06-14

## Existing Controls

| Control | Current implementation |
| --- | --- |
| Unit and contract tests | Node test suites in `npm test` |
| Data schema/source/relationship validation | Source registry, graph contract, build, and graph-health tests |
| Static build/smoke validation | `smoke:static`, `smoke:dom`, `verify:public` |
| Browser contract checks | `test:browser` |
| Full local/CI gate | `npm run precommit` in `.github/workflows/ci.yml` |
| Public-data refresh | Scheduled nightly refresh with verification |
| GitHub Pages deployment | Verified static artifact deployment from `main` |

## Gaps

| Required control | Gap | Recommended implementation |
| --- | --- | --- |
| Lint | No lint script or CI stage | Add a non-rewriting JavaScript/Markdown lint gate |
| Type/static analysis | No type-check script | Add `tsc --checkJs` or equivalent without forcing a framework migration |
| Dependency audit | Closed | `npm run audit:deps` enforces `npm audit` with a documented exception policy |
| Accessibility automation | Marker checks only | Add automated accessibility smoke tests plus manual release audit |
| Secret scanning | Partially closed | Repo-level gitleaks workflow added; GitHub secret scanning/push protection still needs repository settings |
| CodeQL | Closed | Dedicated JavaScript CodeQL workflow added |
| SBOM | Closed | CycloneDX JSON SBOM is generated and uploaded in CI |
| Dependency review | No workflow | Add dependency-review check for pull requests or protected changes |
| License check | No automated gate | Add dependency and source-license review |
| Branch protection | Not documented/verified | Require green release gates on `main` |
| Supply-chain pinning | Actions use tags | Evaluate immutable action SHA pinning |

## Priority

1. GitHub secret scanning/push protection repository settings, lint/static analysis, and accessibility automation.
2. Dependency review, license checks, branch protection, and action pinning.

Existing workflows should be extended, not replaced blindly. Security automation must not introduce a backend or production patching bot.
