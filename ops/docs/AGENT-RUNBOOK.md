# Agent Runbook

## Start a dev server
1. Confirm the user requested a dev server in this chat turn.
2. Run `npm run ports:status` to list active listeners.
3. If the target port is free, run `npm run dev:guarded`.
4. If the port is busy and belongs to this project, report "server already running" and attach instead of spawning a duplicate.

## Stop and clean
- POSIX: `npm run ports:free`
- Windows: `npm run ports:free:win`

## Branch workflow
1. `git checkout -b feat/<task-slug>`
2. Make minimal changes limited to the request.
3. Run `npm run precommit`
4. Commit, push the branch, and update the linked issue or completion note with summary, risks, rollback, and test output.

## Before editing
- Re-scan project structure if files changed outside Cursor.
- Restate task, constraints, and rule highlights (`AGENTS.md`).
- If manual prerequisites (tokens, credentials) are required, stop and ask the user to complete them.

## After editing
- Show `git status` and diff of touched files.
- Run `npm run precommit` and share the output.
- If any guard fails, stop and request guidance—do not auto-fix without consent.
