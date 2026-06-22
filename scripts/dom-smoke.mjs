#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const main = readFileSync('src/main.tsx', 'utf8');
const app = readFileSync('src/ui/App.tsx', 'utf8');
const html = readFileSync('src/index.html', 'utf8');

const hashRoutes = readFileSync('src/ui/lib/hashRoutes.ts', 'utf8');

assert.match(main, /createRoot/, 'react root must be created');
assert.match(main, /HashRouter/, 'hash router must wrap the app');
assert.match(hashRoutes, /parseHashLocation/, 'hash location must be parsed');
assert.match(hashRoutes, /applyLegacyQueryRedirect/, 'legacy view query must redirect');
assert.match(app, /aria-live="polite"/, 'application status must be announced');
assert.match(app, /TopNav/, 'primary navigation must be extracted');
assert.match(app, /GlossaryDrawer/, 'contextual glossary must be available');
assert.match(html, /id="root"/, 'react root container must exist');

console.log('dom-smoke: react shell, history state, and accessibility markers OK');
