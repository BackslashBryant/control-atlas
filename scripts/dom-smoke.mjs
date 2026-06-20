#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const main = readFileSync('src/main.tsx', 'utf8');
const app = readFileSync('src/ui/App.tsx', 'utf8');
const html = readFileSync('src/index.html', 'utf8');

assert.match(main, /createRoot/, 'react root must be created');
assert.match(app, /parseViewState/, 'view state must be parsed');
assert.match(app, /history\.pushState/, 'view changes must update browser history');
assert.match(app, /aria-live="polite"/, 'application status must be announced');
assert.match(app, />\s*Help\s*</, 'contextual help must be available');
assert.match(app, />\s*Glossary\s*</, 'contextual glossary must be available');
assert.match(html, /id="root"/, 'react root container must exist');

console.log('dom-smoke: react shell, history state, and accessibility markers OK');
