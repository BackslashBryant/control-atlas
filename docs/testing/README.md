# Testing Strategy

Required gates:

- `npm run test:data`: reconciliation, paths, matrix behavior, and retired-concept regression.
- `npm run test:runtime`: search, item exploration APIs, evidence, matrix output, and URL state.
- `npm run test:browser`: modular, accessible, responsive static shell contract.
- `npm run audit:coverage`: generated coverage consistency.
- `npm run verify:public`: static artifacts and size budgets.
- `npm run precommit`: all required local gates.

Release still requires a strict live browser audit. Static marker tests cannot be used as evidence of completed accessibility or UX behavior.
