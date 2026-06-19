# Branch Protection Verification — 2026-06-19

**Repository:** `backslashbryant/control-atlas` (GovFrame workspace)
**Branch:** `main`
**Epic:** 7 — Platform Trust & Hardening (Story 7.3)

---

## Required protection rules

| Rule | Purpose |
| --- | --- |
| Require status checks before merge | CI (`Public Repo Checks`) and Pages deploy workflow must pass |
| Require branches to be up to date | Prevent merging stale green builds |
| Block force pushes | Protect release history on `main` |
| Block deletions | Prevent accidental branch removal |
| Restrict direct pushes (recommended) | Solo builder may use direct ship; document exception below |

**Expected status checks (match `.github/workflows/ci.yml` job name):**

- `checks` (Public Repo Checks workflow)

Pages deploy runs on push to `main` after merge; it is not typically a merge gate but must stay green post-merge.

---

## Verification attempt

**Command:**

```text
# Unset invalid GITHUB_TOKEN if present so gh uses keyring credentials
Remove-Item Env:GITHUB_TOKEN -ErrorAction SilentlyContinue
gh auth status
gh api repos/BackslashBryant/control-atlas/branches/main/protection
```

**Result (2026-06-19, post–Epic 7 merge):** Authenticated as `BackslashBryant` (keyring). **`main` is not protected.**

```json
{
  "message": "Branch not protected",
  "documentation_url": "https://docs.github.com/rest/branches/branch-protection#get-branch-protection",
  "status": "404"
}
```

**Gap:** No branch protection rule is configured. Apply remediation steps below.

**Note:** An invalid `GITHUB_TOKEN` environment variable overrides keyring auth and returns `401 Bad credentials`. Clear it before running `gh api`.

Alternatively: GitHub → Settings → Branches → `main` rule → export or screenshot required checks.

---

## Documented policy (enforce outside repo)

1. Do not force-push `main`.
2. Run `npm run precommit` locally before direct merge to `main`.
3. Confirm CI green on the branch commit before merge.
4. Re-verify protection after repository admin changes (rename, visibility, org transfer).

---

## Solo-ship exception

This project ships directly to `main` without mandatory PR review. The `main-ship-gate` ruleset requires the **`checks`** status (Public Repo Checks workflow) to pass on the commit you push — **not** a pull request.

**Preferred command:**

```text
npm run ship:main
```

Manual direct ship flow:

1. Push your task branch (`npm run git:push -- <branch>`) so CI runs on that commit SHA.
2. Wait for **`checks`** green (`npm run checks:wait -- <sha>`).
3. Fast-forward `main` locally and push (`npm run git:push -- main`).

If push is rejected with `Required status check "checks" is expected`, CI has not finished or failed on that commit — fix the failure or wait, then push again. Do not open a PR unless the user explicitly asks.

Unset invalid `GITHUB_TOKEN` before `gh` commands so the CLI uses keyring credentials.

---

## Remediation if protection is missing

1. GitHub → **Settings** → **Branches** → **Add rule** for `main`.
2. Enable **Require status checks to pass** → select `checks`.
3. Enable **Do not allow bypassing the above settings** (if available on plan).
4. Re-run `gh api` and append JSON output below.

### API output (paste after authenticated run)

```json
{
  "message": "Branch not protected",
  "documentation_url": "https://docs.github.com/rest/branches/branch-protection#get-branch-protection",
  "status": "404"
}
```

Verified 2026-06-19 after Epic 7 merge to `main` (commit `1c010d2`).
