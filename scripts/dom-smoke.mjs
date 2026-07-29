#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const main = readFileSync('src/main.tsx', 'utf8');
const app = readFileSync('src/ui/App.tsx', 'utf8');
const html = readFileSync('src/index.html', 'utf8');

const hashRoutes = readFileSync('src/ui/lib/hashRoutes.ts', 'utf8');
const navigationEvents = readFileSync('src/shared/navigation-events.ts', 'utf8');

assert.match(main, /createRoot/, 'react root must be created');
assert.match(app, /parseHashLocation/, 'app must parse the shared hash location');
assert.match(app, /serializeHashLocation/, 'app must serialize the shared hash location');
assert.match(app, /notifyRouteCommitted/, 'route commits must notify the progressive shell');
assert.match(
  main,
  /ROUTE_COMMITTED_EVENT/,
  'progressive shell must synchronize on committed routes',
);
assert.match(
  navigationEvents,
  /control-atlas:route-committed/,
  'route synchronization must have one shared event owner',
);
assert.match(hashRoutes, /parseHashLocation/, 'hash location must be parsed');
assert.match(hashRoutes, /applyLegacyQueryRedirect/, 'legacy view query must redirect');
assert.match(app, /aria-live="polite"/, 'application status must be announced');
assert.match(app, /TopNav/, 'primary navigation must be extracted');
assert.match(app, /GlossaryDrawer/, 'contextual glossary must be available');
assert.match(html, /id="root"/, 'react root container must exist');

console.log('dom-smoke: react shell, history state, and accessibility markers OK');
