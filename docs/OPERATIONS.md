# Control Atlas Operations, Verification, and Release

- **Owner:** Nexus and Pixel
- **Status:** Canonical
- **Last reviewed:** 2026-08-12
- **Supersession:** Update this contract and the corresponding package scripts or workflows in the same approved change.

## Local gates

- `npm run build:data` rebuilds and reconciles generated source truth.
- `npm run build:site` produces `dist/site`.
- `npm run verify:quality` runs discovery, manifest, hygiene, OSCAL, lint, type, unit, browser-contract, DOM, and public-artifact gates.
- `npm run resources:enrich` refreshes README facts and presentation evidence for supported repositories; `npm run resources:validate-media` verifies attributable image responses.
- `npm run verify:ingestion` checks the shared ten-stage lifecycle for all catalog artifacts, all publisher catalogs, and all Resources entries.
- `npm run test:a11y:smoke` checks representative accessibility paths.
- `npm run test:e2e:smoke` checks representative product workflows.
- `npm run precommit` is the complete local ship gate.

Use the cheapest faithful contract test during development. Run corpus rebuilds and browser suites at integration checkpoints and once at final verification.

## Shipping contract

1. Work on a feature branch and keep commits narrow.
2. Pass the complete local ship gate.
3. Push with `npm run git:push` and open a pull request to `main`.
4. Require exact-head CI and security checks to pass.
5. Verify a fresh checkout of the remote branch.
6. Merge through the repository ship flow; never merge locally around CI.
7. Verify the deployed `release.json` commit equals merged `main`.
8. Inspect representative live desktop and mobile routes, keyboard behavior, overflow, and key source records.
9. Keep release evidence in CI artifacts, the pull request, and the release—not a dated documentation file.
10. Delete the completed `docs/Plan.md`, remove clean temporary worktrees and merged local branches, and prune worktrees.

## Evidence boundaries

Automated browser emulation is not physical-device evidence. Automated axe is not hands-on NVDA, VoiceOver, or TalkBack evidence. Report those external checks as unverified until they actually occur. A release may proceed only when the owner has explicitly accepted any remaining non-blocking external evidence gap.

## Runtime boundary

The deployed site is static and public-data-only. It has no backend, authentication, telemetry, user uploads, organizational data, compliance scoring, operational integrations, or stored generated templates.
