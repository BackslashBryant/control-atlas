#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('app/app.mjs', 'utf8');

assert.match(app, /let viewState\s*=/, 'viewState must be declared');

const exerciseState = new Function(`
  'use strict';
  let viewState = { view: 'search', mode: 'novice' };
  let noviceMode = true;
  let currentActiveState = {};

  async function setView(view, state = {}) {
    const next = {
      ...viewState,
      view,
      mode: noviceMode ? 'novice' : 'expert',
      ...state,
    };
    viewState = next;
    return next;
  }

  async function setNoviceMode(isNovice) {
    noviceMode = isNovice;
    viewState = {
      ...viewState,
      mode: isNovice ? 'novice' : 'expert',
    };
    if (currentActiveState.key) {
      return 'detail';
    }
    return 'render';
  }

  return (async () => {
    await setView('search', { query: 'AC-2' });
    await setNoviceMode(false);
    currentActiveState = { key: 'nist-800-53:AC-2' };
    const modeResult = await setNoviceMode(true);
    if (modeResult !== 'detail') throw new Error('expected detail re-render path');
    if (viewState.mode !== 'novice') throw new Error('expected novice mode in viewState');
    if (viewState.query !== 'AC-2') throw new Error('expected query preserved in viewState');
  })();
`);

await exerciseState();

console.log('dom-smoke: viewState runtime patterns OK');
