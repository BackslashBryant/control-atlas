#!/usr/bin/env node

/**
 * Passive postinstall reminder.
 *
 * The template should not scatter generated files or mutate local setup during
 * dependency installation. Run explicit setup commands when you want them.
 */

if (process.env.SKIP_SETUP_PROMPT === 'true' || process.env.CI === 'true') {
  process.exit(0);
}

console.log('');
console.log('Cursor template installed.');
console.log('Run `npm run status` to inspect setup.');
console.log('Run `npm run setup` only when you want guided onboarding.');
console.log('');
