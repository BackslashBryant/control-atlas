# Control Atlas Delivery Index

## Active Direction

The replacement `docs/PRD.md` and `docs/roadmap.md` define the active Control Atlas direction. Work is organized by the nine product epics, not the former Federal Integration Directory release sequence.

## Current Baseline

- Static GitHub Pages application
- Public-data-only build pipeline
- Source registry schema `4.0`
- Stable federal graph bundles and browser runtime
- Search, browse, source inspection, comparison, and CSV export
- Existing test and deployment gates

## Historical Delivery Records

Plans for Issues 8-12 and dated browser audits remain historical evidence of reusable work. Their old release sequencing and product terminology are not the active backlog.

## Next Implementation Task

Close Epic 1 foundation gaps, beginning with the highest-priority missing CI security controls and continued product-boundary enforcement. Do not add backend, authentication, uploads, evidence ingestion, scoring, or operational integrations.

## Delivery Rules

1. Work on a task branch.
2. Preserve the adopted graph and runtime contracts unless a separately approved migration requires change.
3. Keep every increment static, public-data-only, and deployable.
4. Run task-specific checks and `npm run precommit`.
5. Complete a live Pages audit for runtime/public-shell changes before closeout.
