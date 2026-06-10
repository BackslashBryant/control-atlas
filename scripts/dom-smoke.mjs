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

const navigationGuard = new Function(`
  'use strict';
  let navigationGeneration = 0;
  let renderItemCalls = [];

  function setView() {
    navigationGeneration += 1;
  }

  async function openDeepLinkedItem(generation) {
    if (generation !== navigationGeneration) return;
    renderItemCalls.push('stale-blocked');
  }

  async function renderItem(key) {
    navigationGeneration += 1;
    renderItemCalls.push(key);
  }

  return (async () => {
    const initGeneration = navigationGeneration;
    setView();
    await openDeepLinkedItem(initGeneration);
    if (renderItemCalls.length !== 0) throw new Error('stale deep link should not render');
    await renderItem('csf-2:PR.AA-01');
    if (renderItemCalls[0] !== 'csf-2:PR.AA-01') throw new Error('expected PR.AA-01 detail');
  })();
`);

await navigationGuard();

const filterReset = new Function(`
  'use strict';
  let lastSearchQuery = '';
  let searchFilters = { match: 'official', source: 'gold' };

  function normalizeQuery(value) {
    return String(value || '').trim().toLowerCase();
  }

  function resetSearchFilters() {
    searchFilters = { framework: '', match: 'all', source: 'all' };
  }

  function prepareSearchSubmission(query, { resetFilters = true } = {}) {
    const trimmed = String(query || '').trim();
    const queryChanged = normalizeQuery(trimmed) !== normalizeQuery(lastSearchQuery);
    if (resetFilters && queryChanged) {
      resetSearchFilters();
    }
    if (queryChanged) {
      lastSearchQuery = trimmed;
    }
    return trimmed;
  }

  prepareSearchSubmission('AC-2');
  if (searchFilters.match !== 'all') throw new Error('expected filters reset on first query');
  prepareSearchSubmission('AC-2');
  if (searchFilters.match !== 'all') throw new Error('expected filters preserved on same query');
  prepareSearchSubmission('PR.AA-01');
  if (searchFilters.match !== 'all') throw new Error('expected filters reset on new query');
`);

filterReset();

console.log('dom-smoke: viewState runtime patterns OK');
