---
name: Bug Report
about: Report a defect for the agent workflow to fix
title: "[Bug] "
labels: ["status:plan", "bug"]
assignees: []
---

## Summary
Describe the problem and the expected behavior. Link to the GitHub issue if it already exists.

## Steps to Reproduce
1. ...
2. ...
3. ...

## Impact
- Affected area (UI/API/CI/etc):
- Severity (Low/Medium/High):
- Regression? (Yes/No):

## Evidence
- Logs, screenshots, or test output:
- Branch or commit where you observed it:

## Definition of Done
- [ ] Reproduced and acceptance tests updated (Vector + Pixel)
- [ ] Fix implemented on a branch (`agent/<agent>/<issue>-slug`)
- [ ] `npm run preflight` and `npm run verify` pass (attach output)
- [ ] Docs updated if behavior changed (Muse)
- [ ] Status label moved to `status:done`
