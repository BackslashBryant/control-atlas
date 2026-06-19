# ADR 0012: Defer GitHub Actions SHA Pinning

## Status

Accepted (2026-06-19)

## Context

[`docs/SECDEVOPS_GAP_ANALYSIS.md`](../SECDEVOPS_GAP_ANALYSIS.md) lists action SHA pinning as a missing control. Epic 7 Story 7.3 requires either implementation or a documented deferral with rollback.

All eight workflows under `.github/workflows/` use major-version tags (`@v4`, `@v3`, `@v2`, `@v5`). Dependabot monitors `github-actions` weekly ([`.github/dependabot.yml`](../../.github/dependabot.yml)).

During Epic 7 implementation, automated SHA resolution failed: `gh api` returned `401 Bad credentials` and outbound GitHub REST calls timed out in the build environment. Pinning incorrect SHAs would break CI with no local verification path.

## Decision

**Defer full SHA pinning.** Continue using **major-version tags** for all GitHub Actions, with Dependabot weekly updates as the supply-chain control.

Document required admin verification for branch protection separately ([`docs/audits/branch-protection-verification-2026-06-19.md`](../audits/branch-protection-verification-2026-06-19.md)).

## UX Translation Impact

No user-facing change. CI and Pages deploy behavior unchanged.

## User-Facing Boundary

Internal CI configuration only.

## Consequences

- **Positive:** CI remains stable; Dependabot continues actionable Action update PRs.
- **Negative:** Tag-moving supply-chain risk remains mitigated only by GitHub trust + Dependabot, not immutable SHAs.
- **Revisit trigger:** Authenticated `gh api` available at ship time, or org policy mandates SHA pinning — then pin first-party `actions/*` and `github/codeql-action/*` first, one workflow PR at a time.

## Rollback

If SHA pinning is adopted later and causes CI failure:

1. Revert the workflow commit to tag-based `uses:` lines.
2. Confirm `npm run precommit` green locally.
3. Re-open Dependabot-only policy until SHAs are re-resolved with authenticated API access.
