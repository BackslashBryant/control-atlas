# Testing Strategy

Required gates:

- `npm run test:data`: reconciliation, paths, matrix behavior, and retired-concept regression.
- `npm run test:runtime`: search, item exploration APIs, evidence, matrix output, and URL state.
- `npm run test:browser`: modular, accessible, responsive static shell contract.
- `npm run smoke:dom`: lightweight runtime check that `viewState` merge patterns do not throw in strict mode.
- `npm run audit:coverage`: generated coverage consistency.
- `npm run verify:public`: static artifacts and size budgets.
- `npm run precommit`: all required local gates.

Release still requires a strict live browser audit. Static marker tests cannot be used as evidence of completed accessibility or UX behavior.

## Manual live smoke (post-repair)

After each live-facing push, verify in a real browser:

1. Fresh visit shows onboarding; Novice/Expert/Skip/Escape all dismiss the overlay.
2. Mode toggle updates URL (`?mode=novice` or `?mode=expert`) and novice intros.
3. Nav buttons (Search, Map Frameworks, Browse, Sources) swap `#app` without freezing.
4. Search form, Enter, example chips, and Search requirements CTA (empty → focus, filled → submit).
5. `?view=search&q=AC-2&mode=expert` opens item detail; Flow Graph / Grid Matrix / List View tabs render.
6. Help & Glossary opens in-page drawer (same tab).
7. Sources artifact links open valid `https://` destinations.
8. Guided tour advances through all steps; End Tour dismisses the bubble.
