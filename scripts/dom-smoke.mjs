#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('src/app/app.mjs', 'utf8');
const html = readFileSync('src/index.html', 'utf8');

assert.match(app, /createFederalGraphRuntime/, 'graph runtime must be created');
assert.match(app, /normalizeViewState/, 'view state must be normalized');
assert.match(app, /history\.pushState/, 'view changes must update browser history');
assert.match(app, /aria-label="Relationship list"/, 'detail must provide a relationship text alternative');
assert.match(app, /btn-onboarding-skip/, 'onboarding must be dismissible');
assert.match(html, /aria-live="polite"/, 'application status must be announced');

console.log('dom-smoke: federal graph journeys and accessibility markers OK');
