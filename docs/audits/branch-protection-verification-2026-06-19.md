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
gh api repos/backslashbryant/control-atlas/branches/main/protection
```

**Result (2026-06-19):** `401 Bad credentials` — local `gh` session not authenticated in the agent environment.

**Re-run when authenticated:**

```text
gh auth status
gh api repos/backslashbryant/control-atlas/branches/main/protection
```

Alternatively: GitHub → Settings → Branches → `main` rule → export or screenshot required checks.

---

## Documented policy (enforce outside repo)

1. Do not force-push `main`.
2. Run `npm run precommit` locally before direct merge to `main`.
3. Confirm CI green on the branch commit before merge.
4. Re-verify protection after repository admin changes (rename, visibility, org transfer).

---

## Solo-ship exception

This project ships directly to `main` without mandatory PR review. Branch protection should still require **status checks** and **block force pushes**. PR reviews are optional per [`AGENTS.md`](../../AGENTS.md) direct ship flow.

---

## Remediation if protection is missing

1. GitHub → **Settings** → **Branches** → **Add rule** for `main`.
2. Enable **Require status checks to pass** → select `checks`.
3. Enable **Do not allow bypassing the above settings** (if available on plan).
4. Re-run `gh api` and append JSON output below.

### API output (paste after authenticated run)

```json
(pending authenticated verification)
```
