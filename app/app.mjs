import { createFrameworkRuntime, parseViewState, serializeViewState } from './runtime.mjs';

const app = document.querySelector('#app');
const navButtons = [...document.querySelectorAll('nav [data-view]')];
let dataset;
let runtime;

async function ensureDataset() {
  if (runtime) return;
  const response = await fetch('./data/generated/catalog.json');
  if (!response.ok) throw new Error('Validated framework catalog is unavailable.');
  dataset = await response.json();
  runtime = createFrameworkRuntime(dataset);
}

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
})[character]);

function frameworkName(id) {
  return dataset.frameworks.find((item) => item.id === id)?.name || id;
}

function itemFor(key) {
  return dataset.items.find((item) => item.key === key);
}

function evidenceBadges(gaps = []) {
  return gaps.length
    ? `<span class="badge gap">Evidence gap: ${escapeHtml(gaps.join(', '))}</span>`
    : '<span class="badge">Gold + corroboration</span>';
}

async function setView(view, state = {}, replace = false) {
  const next = { view, ...state };
  history[replace ? 'replaceState' : 'pushState'](null, '', location.pathname + serializeViewState(next));
  await render(next);
}

async function renderSearch(state) {
  const query = state.query || '';
  if (query) await ensureDataset();
  const results = query ? runtime.searchFrameworkItems(query) : [];
  app.innerHTML = `
    <section class="panel" aria-labelledby="search-title">
      <p class="eyebrow">Explore an item</p>
      <h2 id="search-title">Search every supported framework</h2>
      <form class="toolbar" id="search-form">
        <input id="search-query" type="search" aria-label="Search framework items" value="${escapeHtml(query)}" placeholder="AC-2, CCI-000225, PR.AA-01, account management">
        <button class="primary" type="submit">Search</button>
      </form>
      <p class="muted">${query ? `${results.length} matching item${results.length === 1 ? '' : 's'}` : 'Enter an identifier or phrase. The landing page does not load the full catalog.'}</p>
    </section>
    <section class="results" aria-label="Search results">
      ${results.map((item) => `
        <article class="item-card">
          <button type="button" data-open-item="${escapeHtml(item.key)}">
            <div class="badge-row"><span class="badge">${escapeHtml(frameworkName(item.framework_id))}</span></div>
            <h3 class="item-id">${escapeHtml(item.item_id)}</h3>
            <strong>${escapeHtml(item.title)}</strong>
            <p class="muted">${escapeHtml(item.text.slice(0, 240))}${item.text.length > 240 ? '…' : ''}</p>
          </button>
        </article>`).join('')}
    </section>`;
  document.querySelector('#search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    setView('search', { query: document.querySelector('#search-query').value.trim() });
  });
  document.querySelectorAll('[data-open-item]').forEach((button) => button.addEventListener('click', () => renderItem(button.dataset.openItem)));
}

async function renderItem(key) {
  await ensureDataset();
  const item = itemFor(key);
  if (!item) return;
  const direct = runtime.getDirectMappings(key);
  const paths = runtime.getCalculatedPaths(key);
  app.innerHTML = `
    <button class="secondary" type="button" id="back-search">← Back to search</button>
    <section class="detail-layout" aria-labelledby="item-heading">
      <div class="detail-main">
        <article class="panel">
          <div class="badge-row"><span class="badge">${escapeHtml(frameworkName(item.framework_id))}</span><span class="badge">${escapeHtml(item.canonical_evidence.tier)} canonical</span></div>
          <h2 id="item-heading" class="item-id" tabindex="-1">${escapeHtml(item.item_id)}</h2>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.text)}</p>
          <details><summary>Canonical source evidence</summary><p>${escapeHtml(item.canonical_evidence.source_id)} · ${escapeHtml(item.canonical_evidence.locator)} · ${escapeHtml(item.canonical_evidence.snapshot_date)}</p></details>
        </article>
        <section class="panel">
          <p class="eyebrow">Direct sourced mappings</p>
          <h3>${direct.length} direct mapping${direct.length === 1 ? '' : 's'}</h3>
          <div class="stack">${direct.length ? direct.map((mapping) => {
            const counterpartKey = mapping.source_key === key ? mapping.target_key : mapping.source_key;
            const counterpart = itemFor(counterpartKey);
            const direction = mapping.source_key === key ? 'outgoing' : 'incoming';
            return `<article class="mapping-card"><div class="badge-row"><span class="badge">${escapeHtml(mapping.relationship_type)} · ${direction}</span>${evidenceBadges(mapping.evidence_gaps)}</div><h4>${escapeHtml(counterpart?.item_id || counterpartKey)} · ${escapeHtml(counterpart?.title || '')}</h4><p>${escapeHtml(mapping.rationale || '')}</p><button class="secondary" type="button" data-open-item="${escapeHtml(counterpartKey)}">Open mapped item</button><details><summary>Evidence audit</summary><pre>${escapeHtml(JSON.stringify(runtime.getEvidenceSummary(mapping.id), null, 2))}</pre></details></article>`;
          }).join('') : '<p class="notice">No gold-supported direct mapping is currently known.</p>'}</div>
        </section>
        <section class="panel">
          <p class="eyebrow">Explained paths</p>
          <h3>${paths.length} calculated path${paths.length === 1 ? '' : 's'}</h3>
          <div class="stack">${paths.length ? paths.slice(0, 30).map((path) => `<article class="mapping-card calculated"><div class="badge-row"><span class="badge">Calculated · ${path.hops.length} hops</span>${evidenceBadges(path.evidence_gaps)}</div><div class="path">${path.item_keys.map((itemKey) => `<span>${escapeHtml(itemFor(itemKey)?.item_id || itemKey)}</span>`).join(' → ')}</div></article>`).join('') : '<p class="notice">No calculated path is currently known.</p>'}</div>
        </section>
      </div>
      <aside class="detail-side panel"><p class="eyebrow">Mapping posture</p><h3>${direct.length + paths.length} known routes</h3><p class="muted">Direct mappings are source assertions. Calculated paths preserve each intermediate hop and never imply direct equivalence.</p><button class="secondary" id="show-graph" type="button">Show optional path graph</button><div id="graph-output"></div></aside>
    </section>`;
  document.querySelector('#back-search').addEventListener('click', () => setView('search', {}, false));
  document.querySelectorAll('[data-open-item]').forEach((button) => button.addEventListener('click', () => renderItem(button.dataset.openItem)));
  document.querySelector('#show-graph').addEventListener('click', () => {
    document.querySelector('#graph-output').innerHTML = paths.length
      ? `<div class="stack">${paths.slice(0, 8).map((path) => `<div class="path">${path.item_keys.map((itemKey) => `<span>${escapeHtml(itemFor(itemKey)?.item_id || itemKey)}</span>`).join(' → ')}</div>`).join('')}</div>`
      : '<p class="muted">No path graph is available.</p>';
  });
  document.querySelector('#item-heading').focus();
  scrollTo({ top: 0, behavior: 'smooth' });
}

function frameworkOptions(selected = '') {
  return dataset.frameworks.map((framework) => `<option value="${escapeHtml(framework.id)}" ${framework.id === selected ? 'selected' : ''}>${escapeHtml(framework.name)}</option>`).join('');
}

async function renderMatrix(state) {
  await ensureDataset();
  const source = state.source || dataset.frameworks.find((item) => dataset.items.some((record) => record.framework_id === item.id))?.id || '';
  const target = state.target || dataset.frameworks.find((item) => item.id !== source && dataset.items.some((record) => record.framework_id === item.id))?.id || '';
  const matrix = source && target ? runtime.buildMappingMatrix({ source_framework: source, target_framework: target }) : null;
  app.innerHTML = `
    <section class="panel">
      <p class="eyebrow">Map frameworks</p><h2>Build a source-to-target mapping matrix</h2>
      <form id="matrix-form" class="controls">
        <div class="field"><label for="matrix-source">Source framework</label><select id="matrix-source">${frameworkOptions(source)}</select></div>
        <div class="field"><label for="matrix-target">Target framework</label><select id="matrix-target">${frameworkOptions(target)}</select></div>
        <button class="primary" type="submit">Build matrix</button>
        <button class="secondary" id="export-matrix" type="button">Export CSV</button>
      </form>
      ${matrix ? `<p class="muted">${matrix.summary.total} source items · ${matrix.summary.direct} direct · ${matrix.summary.calculated} calculated · ${matrix.summary.unmapped} unmapped</p>
      ${matrix.rows.length > 200 ? '<p class="notice">Showing the first 200 rows. CSV export includes the complete matrix.</p>' : ''}
      <table class="matrix-table"><thead><tr><th>Source</th><th>Classification</th><th>Mapped destination or path</th></tr></thead><tbody>${matrix.rows.slice(0, 200).map((row) => `<tr><td>${escapeHtml(row.source_key)}</td><td><span class="badge ${row.classification === 'unmapped' ? 'gap' : ''}">${escapeHtml(row.classification)}</span></td><td>${escapeHtml([...row.direct.map((item) => `${item.matrix_target_key || item.target_key} (${item.matrix_direction || 'outgoing'})`), ...row.paths.map((item) => item.item_keys.join(' > '))].join(' | ') || 'No sourced mapping known')}</td></tr>`).join('')}</tbody></table>` : ''}
    </section>`;
  document.querySelector('#matrix-form').addEventListener('submit', (event) => {
    event.preventDefault();
    setView('matrix', { source: document.querySelector('#matrix-source').value, target: document.querySelector('#matrix-target').value });
  });
  document.querySelector('#export-matrix').addEventListener('click', () => {
    const content = runtime.buildMatrixCsv({ source_framework: source, target_framework: target });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([content], { type: 'text/csv' }));
    link.download = `GovFrame-${source}-to-${target}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  });
}

async function renderBrowse(state) {
  await ensureDataset();
  const selected = state.framework || '';
  const frameworkItems = selected ? dataset.items.filter((item) => item.framework_id === selected) : [];
  app.innerHTML = `<section class="panel"><p class="eyebrow">Browse</p><h2>Framework catalog and coverage</h2><div class="grid">${dataset.coverage.frameworks.map((coverage) => {
    const framework = dataset.frameworks.find((item) => item.id === coverage.framework_id);
    return `<article class="framework-card"><span class="badge">${escapeHtml(framework.status)}</span><h3>${escapeHtml(framework.name)}</h3><p>${coverage.catalog_items} catalog items · ${coverage.mapped_items} mapped</p><div class="coverage-meter" aria-label="${coverage.mapped_percent}% mapped"><span style="width:${coverage.mapped_percent}%"></span></div><button class="secondary" data-browse-framework="${escapeHtml(framework.id)}" type="button">Browse catalog</button></article>`;
  }).join('')}</div>${selected ? `<section class="results"><h3>${escapeHtml(frameworkName(selected))}</h3>${frameworkItems.slice(0, 200).map((item) => `<article class="item-card"><button data-open-item="${escapeHtml(item.key)}"><h4 class="item-id">${escapeHtml(item.item_id)}</h4><strong>${escapeHtml(item.title)}</strong></button></article>`).join('')}</section>` : ''}</section>`;
  document.querySelectorAll('[data-browse-framework]').forEach((button) => button.addEventListener('click', () => setView('browse', { framework: button.dataset.browseFramework })));
  document.querySelectorAll('[data-open-item]').forEach((button) => button.addEventListener('click', () => renderItem(button.dataset.openItem)));
}

function renderSources() {
  app.innerHTML = `<section class="panel"><p class="eyebrow">Sources and evidence health</p><h2>Gold decides. Silver and bronze corroborate.</h2><p class="muted">${dataset.coverage.mappings.published} published mappings · ${dataset.coverage.mappings.evidence_gaps} evidence gaps · ${dataset.coverage.mappings.blocked} blocked candidates</p><div class="grid">${dataset.coverage.sources.map((source) => `<article class="framework-card"><span class="badge">${escapeHtml(source.tier)}</span><h3>${escapeHtml(source.name)}</h3><p class="muted">${escapeHtml(source.issuer)} · ${escapeHtml(source.frameworks.join(', '))}</p><a href="${escapeHtml(source.artifact)}" target="_blank" rel="noreferrer">Open source artifact</a></article>`).join('')}</div></section>`;
}

function renderRetired(state) {
  app.innerHTML = `<section class="notice retired"><p class="eyebrow">Retired identifier type</p><h2>${escapeHtml(state.query)} is outside GovFrame's framework-mapping scope.</h2><p>GovFrame now focuses on framework requirements, controls, Control Correlation Identifiers, and evidence-backed mappings.</p><button class="primary" type="button" id="retired-search">Search frameworks</button></section>`;
  document.querySelector('#retired-search').addEventListener('click', () => setView('search'));
}

async function render(state) {
  app.setAttribute('aria-busy', 'false');
  navButtons.forEach((button) => button.toggleAttribute('aria-current', button.dataset.view === state.view));
  if (state.view === 'matrix') await renderMatrix(state);
  else if (state.view === 'browse') await renderBrowse(state);
  else if (state.view === 'sources') renderSources();
  else if (state.view === 'retired') renderRetired(state);
  else await renderSearch(state);
}

async function init() {
  const response = await fetch('./data/generated/bootstrap.json');
  if (!response.ok) throw new Error('Framework registry is unavailable.');
  dataset = await response.json();
  navButtons.forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
  addEventListener('popstate', () => render(parseViewState(location.search)));
  const state = parseViewState(location.search);
  await render(state);
  if (state.view === 'search' && state.query) {
    const exact = runtime.searchFrameworkItems(state.query).find((item) => item.item_id.toLowerCase() === state.query.toLowerCase());
    if (exact) await renderItem(exact.key);
  }
}

init().catch((error) => {
  app.setAttribute('aria-busy', 'false');
  app.innerHTML = `<section class="notice"><h2>GovFrame could not load the validated catalog.</h2><p>${escapeHtml(error.message)}</p></section>`;
});
