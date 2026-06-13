import { createFederalGraphRuntime, normalizeViewState, parseViewState, serializeViewState } from './runtime.mjs';

const app = document.querySelector('#app');
const navButtons = [...document.querySelectorAll('nav [data-view]')];
const workspace = document.querySelector('#workspace');
let runtime = null;
let graphLoadPromise = null;
let currentState = { view: 'search' };
let noviceMode = true;

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
})[character]);

async function fetchCollection(path, collection) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Unable to load ${collection}.`);
  const artifact = await response.json();
  if (artifact.schema_version !== '1.0' || !Array.isArray(artifact[collection])) {
    throw new Error(`Invalid ${collection} graph artifact.`);
  }
  return artifact[collection];
}

async function loadFederalGraph() {
  const [sources, nodes, edges, evidence, findings] = await Promise.all([
    fetchCollection('./data/generated/sources.json', 'sources'),
    fetchCollection('./data/generated/nodes.json', 'nodes'),
    fetchCollection('./data/generated/edges.json', 'edges'),
    fetchCollection('./data/generated/evidence.json', 'evidence'),
    fetchCollection('./data/generated/graph-health.json', 'findings'),
  ]);
  runtime = createFederalGraphRuntime({ sources, nodes, edges, evidence, findings });
}

async function ensureGraph() {
  if (runtime) return;
  if (!graphLoadPromise) graphLoadPromise = loadFederalGraph().catch((error) => {
    graphLoadPromise = null;
    throw error;
  });
  app.setAttribute('aria-busy', 'true');
  await graphLoadPromise;
  app.setAttribute('aria-busy', 'false');
}

async function withGraph(render) {
  try {
    if (!runtime) app.innerHTML = '<div class="loading-card">Loading federal graph...</div>';
    await ensureGraph();
    await render();
  } catch (error) {
    app.setAttribute('aria-busy', 'false');
    app.innerHTML = `<section class="notice"><h2>Federal graph unavailable</h2><p>${escapeHtml(error.message)}</p><button class="primary" id="retry-load" type="button">Retry</button></section>`;
    document.querySelector('#retry-load')?.addEventListener('click', () => void renderState(currentState));
  }
}

function catalogOptions(selected = '') {
  return runtime.getCatalogs().map((catalog) =>
    `<option value="${escapeHtml(catalog.id)}" ${catalog.id === selected ? 'selected' : ''}>${escapeHtml(catalog.name)}</option>`).join('');
}

function sourceBadge(provenance) {
  const label = provenance.replaceAll('_', ' ');
  const cssClass = provenance === 'inferred' ? 'badge-research' : 'badge-official';
  return `<span class="badge ${cssClass}">${escapeHtml(label)}</span>`;
}

function nodeCard(node) {
  const edges = runtime.getEdgesForNode(node.id);
  const published = edges.filter((edge) => edge.publication_status === 'published').length;
  const candidates = edges.filter((edge) => edge.publication_status === 'candidate').length;
  return `
    <article class="item-card workbench-card">
      <div>
        <h3 class="workbench-card-title">${escapeHtml(node.metadata.item_id)} - ${escapeHtml(node.metadata.title)}</h3>
        <p class="workbench-card-meta">${escapeHtml(node.metadata.catalog_id)} · ${escapeHtml(node.node_type.replaceAll('_', ' '))}</p>
        <p class="workbench-card-counts">${published} published relationship${published === 1 ? '' : 's'} · ${candidates} inferred candidate${candidates === 1 ? '' : 's'}</p>
      </div>
      <button class="primary" type="button" data-open-node="${escapeHtml(node.id)}">Open federal context</button>
    </article>`;
}

function bindNodeButtons() {
  document.querySelectorAll('[data-open-node]').forEach((button) => button.addEventListener('click', () => {
    void renderDetail(button.dataset.openNode);
  }));
}

async function renderSearch(state) {
  const query = state.query || '';
  const filter = state.filter || '';
  workspace.toggleAttribute('data-search-active', Boolean(query));

  if (!query) {
    app.innerHTML = `
      <section class="panel" aria-labelledby="search-title">
        <p class="eyebrow">Federal integration graph</p>
        <h2 id="search-title">Find a federal security control or requirement</h2>
        <p>Search federal controls, requirements, programs, and relationship evidence. The full graph loads only after you search or browse.</p>
        <form id="search-form" class="search-controls">
          <div class="field"><label for="search-query">ID, title, or topic</label><input id="search-query" type="search" placeholder="AC-2, CCI-000225, account management"></div>
          <button class="primary" type="submit">Search</button>
        </form>
        <div class="search-examples"><span class="label">Examples:</span><button class="chip" data-example="AC-2" type="button">AC-2</button><button class="chip" data-example="CCI-000225" type="button">CCI-000225</button></div>
      </section>`;
    bindSearchForm();
    return;
  }

  await withGraph(async () => {
    const results = runtime.searchNodes(query, { catalog_id: filter || undefined });
    app.innerHTML = `
      <section class="panel search-workbench" aria-labelledby="search-title">
        <p class="eyebrow">Search</p><h2 id="search-title">Federal graph results</h2>
        <form id="search-form" class="search-controls">
          <div class="field"><label for="search-query">ID, title, or topic</label><input id="search-query" type="search" value="${escapeHtml(query)}"></div>
          <div class="field"><label for="search-catalog">Catalog filter</label><select id="search-catalog"><option value="">All catalogs</option>${catalogOptions(filter)}</select></div>
          <button class="primary" type="submit">Search</button>
        </form>
        <p class="muted">${results.length} matching node${results.length === 1 ? '' : 's'} found.</p>
      </section>
      <section class="results" aria-label="Search results">${results.length ? results.map(nodeCard).join('') : '<div class="notice"><h3>No results</h3><p>Try another identifier or browse the catalogs.</p></div>'}</section>`;
    bindSearchForm();
    bindNodeButtons();
  });
}

function bindSearchForm() {
  document.querySelector('#search-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    void setView('search', {
      query: document.querySelector('#search-query').value.trim(),
      filter: document.querySelector('#search-catalog')?.value || '',
    });
  });
  document.querySelectorAll('[data-example]').forEach((button) => button.addEventListener('click', () => {
    void setView('search', { query: button.dataset.example, filter: '' });
  }));
}

function evidencePanel(edge) {
  const records = runtime.getEvidenceForEdge(edge.id);
  return records.map((record) => `
    <div class="evidence-summary-panel">
      <h4>Evidence summary</h4>
      <ul>
        <li><strong>Evidence quality:</strong> ${escapeHtml(record.evidence_quality)}</li>
        <li><strong>Source:</strong> ${escapeHtml(record.source?.name || record.source_id)}</li>
        <li><strong>Locator:</strong> ${escapeHtml(record.locator)}</li>
        <li><strong>Retrieved:</strong> ${escapeHtml(record.retrieved_at)}</li>
      </ul>
      ${record.source?.artifact_url ? `<a href="${escapeHtml(record.source.artifact_url)}" target="_blank" rel="noopener noreferrer">Open source artifact</a>` : ''}
    </div>`).join('');
}

async function renderDetail(nodeId) {
  await withGraph(async () => {
    const node = runtime.getNode(nodeId);
    if (!node) return;
    const definingSource = runtime.getSources().find((source) => source.id === node.source_id);
    const edges = runtime.getEdgesForNode(node.id);
    const relationshipCards = edges.map((edge) => {
      const counterpartId = edge.source_node_id === node.id ? edge.target_node_id : edge.source_node_id;
      const counterpart = runtime.getNode(counterpartId);
      return `
        <article class="mapping-card">
          <div class="badge-row">${sourceBadge(edge.provenance_class)}<span class="badge">${escapeHtml(edge.publication_status)}</span></div>
          <h4>${escapeHtml(counterpart?.metadata.item_id || counterpartId)} - ${escapeHtml(counterpart?.metadata.title || '')}</h4>
          <ul>
            <li><strong>Relationship type:</strong> ${escapeHtml(edge.relationship_type)}</li>
            <li><strong>Federal provenance:</strong> ${escapeHtml(edge.provenance_class)}</li>
            <li><strong>Confidence:</strong> ${escapeHtml(edge.confidence)}</li>
          </ul>
          ${edge.warning ? `<p class="notice">${escapeHtml(edge.warning)}</p>` : ''}
          ${evidencePanel(edge)}
          <button class="secondary" type="button" data-open-node="${escapeHtml(counterpartId)}">Open related node</button>
        </article>`;
    }).join('');

    app.innerHTML = `
      <button class="secondary" id="back-search" type="button">Back to search</button>
      <section class="detail-layout">
        <div class="detail-main">
          <article class="panel">
            <div class="badge-row"><span class="badge">${escapeHtml(node.node_type.replaceAll('_', ' '))}</span>${definingSource ? sourceBadge(definingSource.provenance_class) : ''}</div>
            <h2 class="item-id" tabindex="-1">${escapeHtml(node.metadata.item_id)}</h2>
            <h3>${escapeHtml(node.metadata.title)}</h3>
            <p>${escapeHtml(node.metadata.description || 'No public description available.')}</p>
            <details><summary>Defining federal source</summary><p>${escapeHtml(definingSource?.name || node.source_id)} · Eligibility: ${escapeHtml(definingSource?.eligibility_status || 'unknown')} · Lifecycle: ${escapeHtml(definingSource?.lifecycle_status || 'unknown')}</p></details>
          </article>
          <section class="panel"><p class="eyebrow">Federal context</p><h3>${edges.length} relationship${edges.length === 1 ? '' : 's'}</h3><div class="stack">${relationshipCards || '<p class="notice">No displayable relationships are known.</p>'}</div></section>
        </div>
        <aside class="detail-side panel">
          <h3>Accessible alternative</h3>
          <p>Relationship list</p>
          <ul aria-label="Relationship list">${edges.map((edge) => `<li>${escapeHtml(edge.display_label)}</li>`).join('') || '<li>No displayable relationships</li>'}</ul>
        </aside>
      </section>`;
    document.querySelector('#back-search').addEventListener('click', () => void renderState(currentState));
    bindNodeButtons();
    document.querySelector('.item-id')?.focus();
  });
}

async function renderBrowse(state) {
  await withGraph(async () => {
    const selected = state.framework || '';
    const catalogs = runtime.getCatalogs();
    const cards = catalogs.map((catalog) => `
      <article class="framework-card"><span class="badge badge-official">Federal catalog</span><h3>${escapeHtml(catalog.name)}</h3><p>${catalog.node_count} nodes · ${catalog.relationship_count} relationships</p><button class="secondary" data-browse-catalog="${escapeHtml(catalog.id)}" type="button">Browse catalog</button></article>`).join('');
    const selectedList = selected ? runtime.getNodes({ catalog_id: selected }) : [];
    app.innerHTML = `
      <section class="panel"><p class="eyebrow">Browse</p><h2>Federal graph catalogs</h2><div class="grid">${cards}</div>
      ${selected ? `<section class="results" id="catalog-list"><h3>${escapeHtml(selected)}</h3><p class="muted">Showing ${Math.min(selectedList.length, 200)} of ${selectedList.length} nodes.</p>${selectedList.slice(0, 200).map(nodeCard).join('') || '<p class="notice">No eligible nodes in this catalog.</p>'}</section>` : ''}</section>`;
    document.querySelectorAll('[data-browse-catalog]').forEach((button) => button.addEventListener('click', () => void setView('browse', { framework: button.dataset.browseCatalog })));
    bindNodeButtons();
  });
}

async function renderSources() {
  await withGraph(async () => {
    const findings = runtime.getGraphHealth();
    app.innerHTML = `
      <section class="panel"><p class="eyebrow">Sources</p><h2>Federal provenance and graph health</h2>
        <div class="learning-grid"><p><strong>Federal provenance</strong><br>Why the source or relationship is eligible.</p><p><strong>Eligibility</strong><br>Whether a source may publish graph records.</p><p><strong>Graph health</strong><br>Blocked relationships and quality findings stay outside displayable edges.</p></div>
        <p class="muted">${findings.length} graph-health finding${findings.length === 1 ? '' : 's'}.</p>
        <div class="grid">${runtime.getSources().map((source) => `
          <article class="framework-card">${sourceBadge(source.provenance_class)}<h3>${escapeHtml(source.name)}</h3><p>${escapeHtml(source.owner)} · Eligibility: ${escapeHtml(source.eligibility_status)} · Access: ${escapeHtml(source.access_status)}</p><p class="muted">Version ${escapeHtml(source.version)} · Retrieved ${escapeHtml(source.retrieved_at)} · Lifecycle ${escapeHtml(source.lifecycle_status)}</p><a href="${escapeHtml(source.artifact_url)}" target="_blank" rel="noopener noreferrer">Open source artifact</a></article>`).join('')}</div>
      </section>`;
  });
}

function parseNodeIds(value, catalogId) {
  return [...new Set(String(value || '').split(/[\s,]+/).filter(Boolean).map((id) => id.includes(':') ? id : `${catalogId}:${id}`))];
}

async function renderMatrix(state) {
  await withGraph(async () => {
    const catalogs = runtime.getCatalogs();
    const source = state.source || catalogs[0]?.id || '';
    const target = state.target || catalogs.find((catalog) => catalog.id !== source)?.id || '';
    const itemText = state.items || '';
    const matrix = source && target ? runtime.buildRelationshipMatrix({
      source_catalog: source,
      target_catalog: target,
      node_ids: parseNodeIds(itemText, source),
    }) : null;
    app.innerHTML = `
      <section class="panel"><p class="eyebrow">Compare</p><h2>Build a federal relationship matrix</h2>
        <form id="matrix-form" class="controls">
          <div class="field"><label for="matrix-source">Source catalog</label><select id="matrix-source">${catalogOptions(source)}</select></div>
          <div class="field"><label for="matrix-target">Target catalog</label><select id="matrix-target">${catalogOptions(target)}</select></div>
          <div class="field matrix-items-field"><label for="matrix-items">Optional source IDs</label><textarea id="matrix-items">${escapeHtml(itemText)}</textarea></div>
          <button class="primary" type="submit">Build matrix</button><button class="secondary" id="export-matrix" type="button">Export CSV</button>
        </form>
        ${matrix ? `<p class="muted">${matrix.summary.total} rows · ${matrix.summary.published} published · ${matrix.summary.candidate} inferred candidates · ${matrix.summary.unmapped} unmapped</p><table class="matrix-table"><thead><tr><th>Source ID</th><th>Status</th><th>Related nodes</th></tr></thead><tbody>${matrix.rows.slice(0, 200).map((row) => `<tr><td>${escapeHtml(row.source_node_id)}</td><td>${escapeHtml(row.classification)}</td><td>${escapeHtml(row.edges.map((edge) => edge.display_label).join(' | ') || 'No sourced relationship')}</td></tr>`).join('')}</tbody></table>` : ''}
      </section>`;
    document.querySelector('#matrix-form').addEventListener('submit', (event) => {
      event.preventDefault();
      void setView('matrix', { source: document.querySelector('#matrix-source').value, target: document.querySelector('#matrix-target').value, items: document.querySelector('#matrix-items').value.trim() });
    });
    document.querySelector('#export-matrix').addEventListener('click', () => {
      const content = runtime.buildRelationshipCsv(matrix);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([content], { type: 'text/csv' }));
      link.download = `GovFrame-${source}-to-${target}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    });
  });
}

function renderRetired(state) {
  app.innerHTML = `<section class="notice"><h2>${escapeHtml(state.query)} is outside the active federal graph scope.</h2><button class="primary" id="retired-search" type="button">Search federal controls</button></section>`;
  document.querySelector('#retired-search').addEventListener('click', () => void setView('search'));
}

async function renderState(state) {
  currentState = state;
  navButtons.forEach((button) => button.toggleAttribute('aria-current', button.dataset.view === state.view));
  if (state.view === 'matrix') await renderMatrix(state);
  else if (state.view === 'browse') await renderBrowse(state);
  else if (state.view === 'sources') await renderSources();
  else if (state.view === 'retired') renderRetired(state);
  else await renderSearch(state);
}

async function setView(view, state = {}) {
  const next = normalizeViewState(view, { ...currentState, ...state, mode: noviceMode ? 'novice' : 'expert' });
  history.pushState(null, '', location.pathname + serializeViewState(next));
  await renderState(next);
}

function showOnboardingOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'onboarding-overlay';
  overlay.id = 'onboarding-overlay';
  overlay.innerHTML = `<div class="onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="onboarding-title"><h2 id="onboarding-title">Explore federal security relationships</h2><p>GovFrame separates relationship semantics, federal provenance, confidence, and evidence quality.</p><div class="onboarding-choices"><button class="primary" id="btn-onboarding-start" type="button">Start exploring</button><button class="secondary" id="btn-onboarding-skip" type="button">Skip</button></div></div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  document.querySelector('#btn-onboarding-start').addEventListener('click', close);
  document.querySelector('#btn-onboarding-skip').addEventListener('click', close);
  overlay.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
  document.querySelector('#btn-onboarding-start').focus();
}

function toggleHelp() {
  const existing = document.querySelector('#glossary-drawer');
  if (existing) {
    existing.remove();
    return;
  }
  const drawer = document.createElement('aside');
  drawer.id = 'glossary-drawer';
  drawer.className = 'glossary-drawer open';
  drawer.innerHTML = `<button class="close-drawer" aria-label="Close help" type="button">×</button><h2>Federal graph help</h2><dl class="glossary-list"><div class="glossary-item"><dt>Federal provenance</dt><dd>Why a source or relationship is eligible for the federal graph.</dd></div><div class="glossary-item"><dt>Confidence</dt><dd>The support strength for a relationship.</dd></div><div class="glossary-item"><dt>Evidence quality</dt><dd>The role of a source record supporting a claim.</dd></div></dl>`;
  document.body.appendChild(drawer);
  drawer.querySelector('button').addEventListener('click', () => drawer.remove());
}

async function init() {
  navButtons.forEach((button) => button.addEventListener('click', () => void setView(button.dataset.view)));
  document.querySelector('#btn-toggle-mode').addEventListener('click', (event) => {
    noviceMode = !noviceMode;
    event.currentTarget.setAttribute('aria-pressed', String(noviceMode));
    event.currentTarget.textContent = noviceMode ? 'Novice Mode' : 'Expert Mode';
  });
  document.querySelector('#btn-toggle-mode').setAttribute('aria-pressed', 'true');
  document.querySelector('#btn-toggle-glossary').addEventListener('click', toggleHelp);
  addEventListener('popstate', () => void renderState(parseViewState(location.search)));
  const state = parseViewState(location.search);
  if (!state.mode) showOnboardingOverlay();
  await renderState(state);
  if (state.query) {
    await ensureGraph();
    const exact = runtime.searchNodes(state.query, { catalog_id: state.filter || undefined })
      .find((node) => node.metadata.item_id.toLowerCase() === state.query.toLowerCase());
    if (exact) await renderDetail(exact.id);
  }
}

init().catch((error) => {
  app.setAttribute('aria-busy', 'false');
  app.innerHTML = `<section class="notice"><h2>GovFrame could not start</h2><p>${escapeHtml(error.message)}</p></section>`;
});
