# ADR 0011: Execute Repo, Package, And Deployment Rename As Epic 0

**Status:** Accepted

## Context

Epic 0 requires the repository, package identifier, workflow labels, and Pages deployment URL to align with Control Atlas. The migration affects scripts, tests, links, workflows, and deployment, so it must be executed as one verified slice instead of a later compatibility note.

## Decision

Execute the repo, package, import-path, and deployment-path rename during Epic 0 with explicit staged-build verification, contract tests, and a live Pages audit.

## Consequences

Active repository surfaces no longer treat GovFrame identifiers as acceptable compatibility defaults. Historical references remain only in archived evidence and older delivery records.
