import { createFederalGraphRuntime, getFederalContext, normalizeViewState, parseViewState, serializeViewState } from './runtime.mjs';

const app = /** @type {HTMLElement} */ (document.querySelector('#app'));
const navButtons = [.../** @type {NodeListOf<HTMLButtonElement>} */ (document.querySelectorAll('nav [data-view]'))];
const workspace = /** @type {HTMLElement} */ (document.querySelector('#workspace'));
const heroRotatingWord = /** @type {HTMLSpanElement | null} */ (document.querySelector('#hero-rotating-word'));
let runtime = null;
let graphLoadPromise = null;
let currentState = { view: 'search' };
let noviceMode = true;
const heroPrefix = 'Ctrl+Alt+';
const heroWords = ['Comply', 'Map', 'Assess', 'Crosswalk', 'Navigate', 'Inherit', 'Audit', 'Authorize'];

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
})[character]);

const controlBySelector = (selector) => /** @type {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null} */ (document.querySelector(selector));
const buttonBySelector = (selector) => /** @type {HTMLButtonElement | null} */ (document.querySelector(selector));
const elementBySelector = (selector) => /** @type {HTMLElement | null} */ (document.querySelector(selector));

async function fetchArtifact(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Unable to load ${path}.`);
  return response.json();
}

async function fetchCollection(path, collection) {
  const artifact = await fetchArtifact(path);
  if (artifact.schema_version !== '1.0' || !Array.isArray(artifact[collection])) {
    throw new Error(`Invalid ${collection} graph artifact.`);
  }
  return artifact[collection];
}

async function loadFederalGraph() {
  const [sources, nodes, edges, evidence, findings, libraryArtifact] = await Promise.all([
    fetchCollection('./data/generated/sources.json?v=20260614-1', 'sources'),
    fetchCollection('./data/generated/nodes.json?v=20260614-1', 'nodes'),
    fetchCollection('./data/generated/edges.json?v=20260614-1', 'edges'),
    fetchCollection('./data/generated/evidence.json?v=20260614-1', 'evidence'),
    fetchCollection('./data/generated/graph-health.json?v=20260614-1', 'findings'),
    fetchArtifact('./data/generated/library-search.json?v=20260615-1'),
  ]);
  if (libraryArtifact.schema_version !== '1.0' || !Array.isArray(libraryArtifact.library_search?.documents)) {
    throw new Error('Invalid library search artifact.');
  }
  runtime = createFederalGraphRuntime({
    sources,
    nodes,
    edges,
    evidence,
    findings,
    librarySearch: libraryArtifact.library_search,
  });
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
    if (!runtime) app.innerHTML = '<div class="loading-card">Loading the public compliance map...</div>';
    await ensureGraph();
    await render();
  } catch (error) {
    app.setAttribute('aria-busy', 'false');
    app.innerHTML = `<section class="notice"><h2>Control Atlas map unavailable</h2><p>${escapeHtml(error.message)}</p><button class="primary" id="retry-load" type="button">Retry</button></section>`;
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

function sourceStateBadge(label, tone = 'neutral') {
  return `<span class="badge badge-${tone}">${escapeHtml(label)}</span>`;
}

function sourceWarningMessages(source) {
  const messages = [];
  if (source.access_status !== 'public' || !source.graph_eligible || source.eligibility_status === 'excluded') {
    messages.push('Restricted or excluded from the public graph.');
  }
  if (source.lifecycle_status === 'deprecated' || source.lifecycle_status === 'draft') {
    messages.push('Deprecated or draft content needs extra review.');
  }
  if (source.eligibility_status === 'limited' || source.eligibility_status === 'pending_review') {
    messages.push('Limited or pending-review content may need additional validation.');
  }
  return messages;
}

function sourceWarningMarkup(source, title = 'Source warning') {
  const warnings = sourceWarningMessages(source);
  if (!warnings.length) return '';
  return `
    <div class="source-warning" role="note" aria-label="${escapeHtml(title)}">
      <strong>${escapeHtml(title)}</strong>
      <ul>${warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('')}</ul>
    </div>`;
}

function sourceFilterMarkup(sources, filters = {}) {
  const provenances = [...new Set(sources.map((source) => source.provenance_class).filter(Boolean))].sort();
  const eligibilities = [...new Set(sources.map((source) => source.eligibility_status).filter(Boolean))].sort();
  const lifecycles = [...new Set(sources.map((source) => source.lifecycle_status).filter(Boolean))].sort();
  const accesses = [...new Set(sources.map((source) => source.access_status).filter(Boolean))].sort();
  return `
    <form id="source-filters" class="relationship-filter-grid">
      <div class="field">
        <label for="source-provenance-filter">Source class</label>
        <select id="source-provenance-filter">${optionMarkup(provenances, filters.provenance, 'All source classes')}</select>
      </div>
      <div class="field">
        <label for="source-eligibility-filter">Eligibility</label>
        <select id="source-eligibility-filter">${optionMarkup(eligibilities, filters.eligibility, 'All eligibility')}</select>
      </div>
      <div class="field">
        <label for="source-lifecycle-filter">Lifecycle</label>
        <select id="source-lifecycle-filter">${optionMarkup(lifecycles, filters.lifecycle, 'All lifecycle states')}</select>
      </div>
      <div class="field">
        <label for="source-access-filter">Access</label>
        <select id="source-access-filter">${optionMarkup(accesses, filters.access, 'All access states')}</select>
      </div>
    </form>`;
}

function bindSourceButtons() {
  /** @type {NodeListOf<HTMLButtonElement>} */ (document.querySelectorAll('[data-open-source]')).forEach((button) => button.addEventListener('click', () => {
    void setView('sources', {
      source: button.dataset.openSource || '',
      provenance: currentState.provenance || '',
      eligibility: currentState.eligibility || '',
      lifecycle: currentState.lifecycle || '',
      access: currentState.access || '',
    });
  }));
}

function optionMarkup(values, selected, fallbackLabel) {
  const options = [`<option value="">${escapeHtml(fallbackLabel)}</option>`];
  for (const value of values) {
    options.push(`<option value="${escapeHtml(value)}" ${value === selected ? 'selected' : ''}>${escapeHtml(value.replaceAll('_', ' '))}</option>`);
  }
  return options.join('');
}

function filterRelationshipEntries(edges, filters = {}) {
  return edges.filter((edge) =>
    (!filters.relationshipType || edge.relationship_type === filters.relationshipType)
    && (!filters.provenance || edge.provenance_class === filters.provenance)
    && (!filters.confidence || edge.confidence === filters.confidence));
}

function relationshipFilterMarkup(edges, filters = {}) {
  const relationshipTypes = [...new Set(edges.map((edge) => edge.relationship_type).filter(Boolean))].sort();
  const provenances = [...new Set(edges.map((edge) => edge.provenance_class).filter(Boolean))].sort();
  const confidences = [...new Set(edges.map((edge) => edge.confidence).filter(Boolean))].sort();
  return `
    <div class="relationship-filter-grid">
      <div class="field">
        <label for="relationship-type-filter">Relationship type</label>
        <select id="relationship-type-filter">${optionMarkup(relationshipTypes, filters.relationshipType, 'All relationship types')}</select>
      </div>
      <div class="field">
        <label for="provenance-filter">Provenance</label>
        <select id="provenance-filter">${optionMarkup(provenances, filters.provenance, 'All provenance')}</select>
      </div>
      <div class="field">
        <label for="confidence-filter">Confidence</label>
        <select id="confidence-filter">${optionMarkup(confidences, filters.confidence, 'All confidence')}</select>
      </div>
    </div>
    <div class="relationship-view-toggle">
      <button class="secondary" type="button" data-relationship-view="cards">Card view</button>
      <button class="secondary" type="button" data-relationship-view="table">Table view</button>
    </div>`;
}

function relationshipTable(edges, runtimeNodeLookupId) {
  return `
    <table class="relationship-table" aria-label="Table view">
      <thead><tr><th>Related node</th><th>Relationship type</th><th>Provenance</th><th>Confidence</th></tr></thead>
      <tbody>${edges.map((edge) => {
        const counterpartId = edge.source_node_id === runtimeNodeLookupId ? edge.target_node_id : edge.source_node_id;
        const counterpart = runtime.getNode(counterpartId);
        return `<tr><td>${escapeHtml(counterpart?.metadata?.item_id || counterpartId)}</td><td>${escapeHtml(edge.relationship_type)}</td><td>${escapeHtml(edge.provenance_class)}</td><td>${escapeHtml(edge.confidence)}</td></tr>`;
      }).join('') || '<tr><td colspan="4">No displayable relationships</td></tr>'}</tbody>
    </table>`;
}

function libraryResultCard(document) {
  const source = runtime.getSource(document.source_id);
  const node = runtime.getNode(document.id);
  const edges = node ? runtime.getEdgesForNode(node.id) : [];
  const published = edges.filter((edge) => edge.publication_status === 'published').length;
  return `
    <article class="item-card workbench-card">
      <div class="badge-row">
        <span class="badge">${escapeHtml(document.object_type.replaceAll('_', ' '))}</span>
        ${source ? sourceBadge(source.provenance_class) : ''}
      </div>
      <div>
        <h3 class="workbench-card-title">${escapeHtml(document.item_id)} - ${escapeHtml(document.title)}</h3>
        <p class="workbench-card-meta">Object type: ${escapeHtml(document.object_type.replaceAll('_', ' '))}</p>
        <p class="workbench-card-meta">Defining source: ${escapeHtml(source?.name || document.source_id)}</p>
        <p class="workbench-card-counts">${published} published relationship${published === 1 ? '' : 's'}  -  Catalog: ${escapeHtml(document.catalog_id || 'unknown')}</p>
      </div>
      <button class="primary" type="button" data-open-node="${escapeHtml(document.id)}">Open detail</button>
    </article>`;
}

function bindNodeButtons() {
  /** @type {NodeListOf<HTMLButtonElement>} */ (document.querySelectorAll('[data-open-node]')).forEach((button) => button.addEventListener('click', () => {
    void setView('library-detail', { node: button.dataset.openNode });
  }));
}

function libraryFilterMarkup(state) {
  const facets = runtime.getLibraryFacets();
  return `
    <div class="relationship-filter-grid">
      <div class="field">
        <label for="search-catalog">Catalog filter</label>
        <select id="search-catalog"><option value="">All catalogs</option>${catalogOptions(state.filter || '')}</select>
      </div>
      <div class="field">
        <label for="library-object-type-filter">Object type</label>
        <select id="library-object-type-filter">${optionMarkup(facets.objectTypes, state.objectType || '', 'All object types')}</select>
      </div>
      <div class="field">
        <label for="library-source-class-filter">Source class</label>
        <select id="library-source-class-filter">${optionMarkup(facets.sourceClasses, state.sourceClass || '', 'All source classes')}</select>
      </div>
      <div class="field">
        <label for="library-family-filter">Control family</label>
        <select id="library-family-filter">${optionMarkup(facets.controlFamilies, state.controlFamily || '', 'All control families')}</select>
      </div>
      <div class="field">
        <label for="library-severity-filter">Severity</label>
        <select id="library-severity-filter">${optionMarkup(facets.severities, state.severity || '', 'All severities')}</select>
      </div>
    </div>`;
}

async function renderSearch(state) {
  await withGraph(async () => {
    const query = state.query || '';
    const filters = {
      catalog_id: state.filter || undefined,
      object_type: state.objectType || undefined,
      source_class: state.sourceClass || undefined,
      control_family: state.controlFamily || undefined,
      severity: state.severity || undefined,
    };
    const hasActiveFilters = Object.values(filters).some(Boolean);
    const results = runtime.searchLibrary(query, filters);
    workspace.toggleAttribute('data-search-active', Boolean(query || hasActiveFilters));

    app.innerHTML = `
      <section class="panel search-workbench" aria-labelledby="search-title">
        <p class="eyebrow">Library</p>
        <h2 id="search-title">Find a control, STIG, CCI, or framework topic</h2>
        <p>Search the public reference library by identifier, keyword, object type, source class, family, severity, or catalog.</p>
        <form id="search-form" class="search-controls">
          <div class="field"><label for="search-query">ID, title, or topic</label><input id="search-query" type="search" value="${escapeHtml(query)}" placeholder="AC-2, CCI-000225, account management"></div>
          <button class="primary" type="submit">Search</button>
        </form>
        ${libraryFilterMarkup(state)}
        <div class="search-examples"><span class="label">Examples:</span><button class="chip" data-example="AC-2" type="button">AC-2</button><button class="chip" data-example="CCI-000225" type="button">CCI-000225</button></div>
        <p class="muted">${results.length} matching object${results.length === 1 ? '' : 's'} found.</p>
      </section>
      <section class="results" id="library-results" aria-label="Search results">${results.length ? results.map(libraryResultCard).join('') : '<div class="notice"><h3>No results</h3><p>Try another identifier or adjust the filters.</p></div>'}</section>`;
    bindSearchForm();
    bindNodeButtons();
  });
}

function bindSearchForm() {
  const nextSearchState = () => ({
    query: controlBySelector('#search-query')?.value.trim() || '',
    filter: controlBySelector('#search-catalog')?.value || '',
    objectType: controlBySelector('#library-object-type-filter')?.value || '',
    sourceClass: controlBySelector('#library-source-class-filter')?.value || '',
    controlFamily: controlBySelector('#library-family-filter')?.value || '',
    severity: controlBySelector('#library-severity-filter')?.value || '',
  });

  elementBySelector('#search-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    void setView('search', nextSearchState());
  });
  elementBySelector('.relationship-filter-grid')?.addEventListener('change', () => {
    void setView('search', nextSearchState());
  });
  /** @type {NodeListOf<HTMLButtonElement>} */ (document.querySelectorAll('[data-example]')).forEach((button) => button.addEventListener('click', () => {
    void setView('search', { ...nextSearchState(), query: button.dataset.example || '' });
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

function renderContextCards(title, entries, renderEntry) {
  return `
    <section class="panel">
      <p class="eyebrow">${escapeHtml(title)}</p>
      <div class="stack">
        ${entries.length ? entries.map(renderEntry).join('') : '<p class="notice">No source-backed context is currently available.</p>'}
      </div>
    </section>`;
}

function contextCard(node, edge, extras = []) {
  return `
    <article class="mapping-card">
      <div class="badge-row">${sourceBadge(edge.provenance_class)}<span class="badge">${escapeHtml(edge.publication_status)}</span></div>
      <h4>${escapeHtml(node.metadata?.item_id || node.id)} - ${escapeHtml(node.metadata?.title || '')}</h4>
      <ul>
        <li><strong>Relationship type:</strong> ${escapeHtml(edge.relationship_type)}</li>
        <li><strong>Provenance:</strong> ${escapeHtml(edge.provenance_class)}</li>
        <li><strong>Confidence:</strong> ${escapeHtml(edge.confidence)}</li>
        ${extras.join('')}
      </ul>
      ${evidencePanel(edge)}
      <button class="secondary" type="button" data-open-node="${escapeHtml(node.id)}">Open related node</button>
    </article>`;
}

function assessmentProcedureCard(entry) {
  const objectives = entry.assessmentNode.metadata?.assessment_objectives || [];
  const methodDetails = entry.assessmentNode.metadata?.assessment_method_details || [];
  const objectGroups = entry.assessmentNode.metadata?.assessment_objects || [];
  return `
    <article class="mapping-card">
      <div class="badge-row">${sourceBadge(entry.assessmentEdge.provenance_class)}<span class="badge">${escapeHtml(entry.assessmentEdge.publication_status)}</span></div>
      <h4>${escapeHtml(entry.assessmentNode.metadata?.item_id || entry.assessmentNode.id)} - ${escapeHtml(entry.assessmentNode.metadata?.title || '')}</h4>
      <ul>
        <li><strong>Relationship type:</strong> ${escapeHtml(entry.assessmentEdge.relationship_type)}</li>
        <li><strong>Assessment methods:</strong> ${escapeHtml((entry.assessmentNode.metadata?.assessment_methods || []).join(', ') || 'None listed')}</li>
        <li><strong>Assessment objects:</strong> ${escapeHtml(objectGroups.flat().join('; ') || 'None listed')}</li>
      </ul>
      <details>
        <summary>Assessment objectives</summary>
        <ul>${objectives.map((objective) => `<li><strong>${escapeHtml(objective.label || objective.id || 'Objective')}</strong>: ${escapeHtml(objective.prose || '')}</li>`).join('') || '<li>No source-backed objectives available.</li>'}</ul>
      </details>
      <details>
        <summary>Assessment methods and objects</summary>
        <ul>${methodDetails.map((detail) => `<li><strong>${escapeHtml(detail.method || detail.label || 'Method')}</strong>: ${escapeHtml((detail.objects || []).join('; ') || 'No assessment objects listed.')}</li>`).join('') || '<li>No source-backed assessment methods available.</li>'}</ul>
      </details>
      <details>
        <summary>Procedure text</summary>
        <p>${escapeHtml(entry.assessmentNode.metadata?.procedure_text || 'No source-backed procedure text available.')}</p>
      </details>
      ${evidencePanel(entry.assessmentEdge)}
      <button class="secondary" type="button" data-open-node="${escapeHtml(entry.assessmentNode.id)}">Open related node</button>
    </article>`;
}

async function renderDetail(nodeId, filters = {}) {
  await withGraph(async () => {
    const node = runtime.getNode(nodeId);
    if (!node) return;
    const definingSource = runtime.getSource(node.source_id);
    const edges = runtime.getEdgesForNode(node.id);
    const visibleEdges = filterRelationshipEntries(edges, filters);
    const isControl = node.node_type === 'control' || node.node_type === 'control_enhancement';
    const federalContext = getFederalContext(runtime, node.id);
    const consumedEdgeIds = new Set([
      ...(federalContext?.baselineMembership || []).map((entry) => entry.membershipEdge.id),
      ...(federalContext?.fedrampBaselineContext || []).map((entry) => entry.membershipEdge.id),
      ...(federalContext?.minimumSecurityRequirements || []).map((entry) => entry.familyEdge.id),
      ...(federalContext?.assessmentContext || []).map((entry) => entry.assessmentEdge.id),
      ...(federalContext?.programRequirementContext || []).map((entry) => entry.relationshipEdge.id),
      ...(federalContext?.cmmcProgramContext || []).map((entry) => entry.relationshipEdge.id),
      ...(federalContext?.cuiPolicyContext || []).map((entry) => entry.relationshipEdge.id),
    ]);
    const relationshipCards = visibleEdges.map((edge) => {
      const counterpartId = edge.source_node_id === node.id ? edge.target_node_id : edge.source_node_id;
      const counterpart = runtime.getNode(counterpartId);
      return `
        <article class="mapping-card">
          <div class="badge-row">${sourceBadge(edge.provenance_class)}<span class="badge">${escapeHtml(edge.publication_status)}</span></div>
          <h4>${escapeHtml(counterpart?.metadata.item_id || counterpartId)} - ${escapeHtml(counterpart?.metadata.title || '')}</h4>
          <ul>
            <li><strong>Relationship type:</strong> ${escapeHtml(edge.relationship_type)}</li>
            <li><strong>Provenance:</strong> ${escapeHtml(edge.provenance_class)}</li>
            <li><strong>Confidence:</strong> ${escapeHtml(edge.confidence)}</li>
          </ul>
          ${edge.warning ? `<p class="notice">${escapeHtml(edge.warning)}</p>` : ''}
          ${evidencePanel(edge)}
          <button class="secondary" type="button" data-open-node="${escapeHtml(counterpartId)}">Open related node</button>
        </article>`;
    }).join('');
    const additionalRelationshipCards = visibleEdges
      .filter((edge) => !consumedEdgeIds.has(edge.id))
      .map((edge) => {
        const counterpartId = edge.source_node_id === node.id ? edge.target_node_id : edge.source_node_id;
        const counterpart = runtime.getNode(counterpartId);
        return `
          <article class="mapping-card">
            <div class="badge-row">${sourceBadge(edge.provenance_class)}<span class="badge">${escapeHtml(edge.publication_status)}</span></div>
            <h4>${escapeHtml(counterpart?.metadata.item_id || counterpartId)} - ${escapeHtml(counterpart?.metadata.title || '')}</h4>
            <ul>
              <li><strong>Relationship type:</strong> ${escapeHtml(edge.relationship_type)}</li>
              <li><strong>Provenance:</strong> ${escapeHtml(edge.provenance_class)}</li>
              <li><strong>Confidence:</strong> ${escapeHtml(edge.confidence)}</li>
            </ul>
            ${edge.warning ? `<p class="notice">${escapeHtml(edge.warning)}</p>` : ''}
            ${evidencePanel(edge)}
            <button class="secondary" type="button" data-open-node="${escapeHtml(counterpartId)}">Open related node</button>
          </article>`;
      }).join('');

    const additionalRelationshipMarkup = filters.relationshipView === 'table'
      ? relationshipTable(visibleEdges.filter((edge) => !consumedEdgeIds.has(edge.id)), node.id)
      : additionalRelationshipCards || '<p class="notice">No additional displayable relationships are known.</p>';

    app.innerHTML = `
      <button class="secondary" id="back-search" type="button">${filters.libraryMode ? 'Back to Library' : 'Back to search'}</button>
      <section class="detail-layout">
        <div class="detail-main">
          <article class="panel">
            <div class="badge-row"><span class="badge">${escapeHtml(node.node_type.replaceAll('_', ' '))}</span>${definingSource ? sourceBadge(definingSource.provenance_class) : ''}</div>
            <p class="eyebrow">${filters.libraryMode ? 'Library detail' : 'Mapped context'}</p>
            <h2 tabindex="-1">${escapeHtml(node.metadata.title)}</h2>
            <p class="item-id">${escapeHtml(node.metadata.item_id)}</p>
            <p class="workbench-card-meta">Object type: ${escapeHtml(node.node_type.replaceAll('_', ' '))}</p>
            <p class="workbench-card-meta">Defining source: ${escapeHtml(definingSource?.name || node.source_id)}  -  Version: ${escapeHtml(definingSource?.version || 'unknown')}</p>
            <p>${escapeHtml(node.metadata.description || 'No public description available.')}</p>
            ${definingSource?.artifact_url ? `<p><a href="${escapeHtml(definingSource.artifact_url)}" target="_blank" rel="noopener noreferrer">Open source artifact</a></p>` : ''}
            ${filters.libraryMode ? '<button class="secondary" id="copy-library-link" type="button">Copy link</button>' : ''}
            <details>
              <summary>Defining public source</summary>
              <p>${escapeHtml(definingSource?.name || node.source_id)}  -  Eligibility: ${escapeHtml(definingSource?.eligibility_status || 'unknown')}  -  Lifecycle: ${escapeHtml(definingSource?.lifecycle_status || 'unknown')}</p>
              ${definingSource ? `
                <div class="source-trace-actions">
                  <button class="secondary" type="button" data-open-source="${escapeHtml(definingSource.id)}">Open source details</button>
                </div>
                ${sourceWarningMarkup(definingSource)}
              ` : ''}
            </details>
          </article>
          ${isControl ? `
            ${renderContextCards('Baseline membership', federalContext.baselineMembership, (entry) =>
              contextCard(entry.baselineNode, entry.membershipEdge))}
            ${renderContextCards('FedRAMP baseline context', federalContext.fedrampBaselineContext, (entry) =>
              contextCard(entry.baselineNode, entry.membershipEdge))}
            ${renderContextCards('Categorization context', federalContext.categorizationContext, (entry) =>
              contextCard(entry.categoryNode, entry.categoryEdge, [
                `<li><strong>Through baseline:</strong> ${escapeHtml(entry.baselineNode.metadata.item_id)} - ${escapeHtml(entry.baselineNode.metadata.title)}</li>`,
              ]))}
            ${renderContextCards('Minimum security requirements', federalContext.minimumSecurityRequirements, (entry) =>
              contextCard(entry.requirementNode, entry.requirementEdge, [
                `<li><strong>Through family:</strong> ${escapeHtml(entry.familyNode.metadata.item_id)} - ${escapeHtml(entry.familyNode.metadata.title)}</li>`,
              ]))}
            ${renderContextCards('RMF lifecycle', federalContext.rmfLifecycle, (entry) =>
              contextCard(entry.stepNode, entry.contextEdge, [
                `<li><strong>Through node:</strong> ${escapeHtml(entry.viaNode.metadata.item_id)} - ${escapeHtml(entry.viaNode.metadata.title)}</li>`,
              ]))}
            ${renderContextCards('Assessment procedures', federalContext.assessmentContext, assessmentProcedureCard)}
            <section class="panel"><p class="eyebrow">Additional published relationships</p><h3>${visibleEdges.length} relationship${visibleEdges.length === 1 ? '' : 's'}</h3>${relationshipFilterMarkup(edges, filters)}<div class="stack">${additionalRelationshipMarkup}</div></section>
          ` : `
            ${renderContextCards('Program requirement context', federalContext.programRequirementContext, (entry) =>
              contextCard(entry.relatedNode, entry.relationshipEdge))}
            ${renderContextCards('CMMC program context', federalContext.cmmcProgramContext, (entry) =>
              contextCard(entry.relatedNode, entry.relationshipEdge))}
            ${renderContextCards('CUI policy context', federalContext.cuiPolicyContext, (entry) =>
              contextCard(entry.relatedNode, entry.relationshipEdge))}
            <section class="panel"><p class="eyebrow">Additional published relationships</p><h3>${visibleEdges.length} relationship${visibleEdges.length === 1 ? '' : 's'}</h3>${relationshipFilterMarkup(edges, filters)}<div class="stack">${filters.relationshipView === 'table' ? relationshipTable(visibleEdges, node.id) : additionalRelationshipCards || relationshipCards || '<p class="notice">No displayable relationships are known.</p>'}</div></section>
          `}
        </div>
        <aside class="detail-side panel">
          <h3>Accessible alternative</h3>
          <p>Relationship list</p>
          <ul aria-label="Relationship list">${visibleEdges.map((edge) => `<li>${escapeHtml(edge.display_label)}</li>`).join('') || '<li>No displayable relationships</li>'}</ul>
        </aside>
      </section>`;
    buttonBySelector('#back-search')?.addEventListener('click', () => void setView('search', {
      query: currentState.query || '',
      filter: currentState.filter || '',
      objectType: currentState.objectType || '',
      sourceClass: currentState.sourceClass || '',
      controlFamily: currentState.controlFamily || '',
      severity: currentState.severity || '',
    }));
    buttonBySelector('#copy-library-link')?.addEventListener('click', async () => {
      const link = `${location.origin}${location.pathname}${serializeViewState({ view: 'library-detail', node: node.id, mode: currentState.mode })}`;
      try {
        await navigator.clipboard.writeText(link);
      } catch {
        // Clipboard access can fail in some browser contexts; keep the UI stable.
      }
    });
    const rerenderDetail = (relationshipView = filters.relationshipView || 'cards') => {
      void renderDetail(node.id, {
        relationshipType: controlBySelector('#relationship-type-filter')?.value || '',
        provenance: controlBySelector('#provenance-filter')?.value || '',
        confidence: controlBySelector('#confidence-filter')?.value || '',
        relationshipView,
        libraryMode: filters.libraryMode,
      });
    };
    controlBySelector('#relationship-type-filter')?.addEventListener('change', () => rerenderDetail());
    controlBySelector('#provenance-filter')?.addEventListener('change', () => rerenderDetail());
    controlBySelector('#confidence-filter')?.addEventListener('change', () => rerenderDetail());
    /** @type {NodeListOf<HTMLButtonElement>} */ (document.querySelectorAll('[data-relationship-view]')).forEach((button) => button.addEventListener('click', () => rerenderDetail(button.dataset.relationshipView)));
    bindNodeButtons();
    bindSourceButtons();
    elementBySelector('.item-id')?.focus();
  });
}

async function renderBrowse(state) {
  await withGraph(async () => {
    const selected = state.framework || '';
    const catalogs = runtime.getCatalogs();
    const cards = catalogs.map((catalog) => `
      <article class="framework-card"><span class="badge badge-official">Public catalog</span><h3>${escapeHtml(catalog.name)}</h3><p>${catalog.node_count} nodes  -  ${catalog.relationship_count} relationships</p><button class="secondary" data-browse-catalog="${escapeHtml(catalog.id)}" type="button">Browse catalog</button></article>`).join('');
    const selectedList = selected ? runtime.searchLibrary('', { catalog_id: selected }) : [];
    app.innerHTML = `
      <section class="panel"><p class="eyebrow">Library</p><h2>Public catalog coverage</h2><div class="grid">${cards}</div>
      ${selected ? `<section class="results" id="catalog-list"><h3>${escapeHtml(selected)}</h3><p class="muted">Showing ${Math.min(selectedList.length, 200)} of ${selectedList.length} objects.</p>${selectedList.slice(0, 200).map(libraryResultCard).join('') || '<p class="notice">No eligible nodes in this catalog.</p>'}</section>` : ''}</section>`;
    /** @type {NodeListOf<HTMLButtonElement>} */ (document.querySelectorAll('[data-browse-catalog]')).forEach((button) => button.addEventListener('click', () => void setView('browse', { framework: button.dataset.browseCatalog })));
    bindNodeButtons();
  });
}

async function renderLibraryDetail(state) {
  if (!state.node) {
    await setView('search');
    return;
  }
  const node = runtime?.getNode(state.node) || runtime?.searchNodes(state.node)?.[0];
  if (!node) {
    await setView('search');
    return;
  }
  await renderDetail(node.id, { libraryMode: true });
}

function renderSourceListCard(source) {
  return `
    <article class="framework-card source-card">
      <div class="badge-row">
        ${sourceBadge(source.provenance_class)}
        ${sourceStateBadge(source.eligibility_status, source.eligibility_status === 'eligible' ? 'success' : 'warning')}
        ${sourceStateBadge(source.lifecycle_status, source.lifecycle_status === 'active' ? 'success' : 'warning')}
      </div>
      <h3>${escapeHtml(source.name)}</h3>
      <p>${escapeHtml(source.owner)}  -  Access: ${escapeHtml(source.access_status)}  -  Graph eligibility: ${escapeHtml(source.graph_eligible ? 'publishable' : 'excluded')}</p>
      <p class="muted">Version ${escapeHtml(source.version)}  -  Retrieved ${escapeHtml(source.retrieved_at)}  -  License/use: ${escapeHtml(source.license_or_use)}</p>
      ${sourceWarningMarkup(source)}
      <div class="source-card-actions">
        <button class="secondary" type="button" data-open-source="${escapeHtml(source.id)}">View source details</button>
        <a href="${escapeHtml(source.artifact_url)}" target="_blank" rel="noopener noreferrer">Open source artifact</a>
      </div>
    </article>`;
}

async function renderSourceDetail(state) {
  const source = runtime.getSource(state.source);
  if (!source) {
    await renderSources({ ...state, source: '' });
    return;
  }
  app.innerHTML = `
    <button class="secondary" id="back-to-sources" type="button">Back to Provenance</button>
    <section class="panel">
      <p class="eyebrow">Provenance</p>
      <h2 tabindex="-1" id="source-detail-title">${escapeHtml(source.name)}</h2>
      <div class="badge-row">
        ${sourceBadge(source.provenance_class)}
        ${sourceStateBadge(source.eligibility_status, source.eligibility_status === 'eligible' ? 'success' : 'warning')}
        ${sourceStateBadge(source.lifecycle_status, source.lifecycle_status === 'active' ? 'success' : 'warning')}
        ${sourceStateBadge(source.access_status, source.access_status === 'public' ? 'success' : 'warning')}
      </div>
      <p>${escapeHtml(source.owner)} maintains this public source record for Control Atlas provenance review.</p>
      ${sourceWarningMarkup(source)}
      <div class="source-detail-grid">
        <div class="framework-card">
          <h3>Source status</h3>
          <ul>
            <li><strong>Version:</strong> ${escapeHtml(source.version)}</li>
            <li><strong>Retrieved:</strong> ${escapeHtml(source.retrieved_at)}</li>
            <li><strong>Retrieval method:</strong> ${escapeHtml(source.retrieval_method)}</li>
            <li><strong>Artifact type:</strong> ${escapeHtml(source.artifact_type)}</li>
            <li><strong>Eligibility:</strong> ${escapeHtml(source.eligibility_status)}</li>
            <li><strong>Access:</strong> ${escapeHtml(source.access_status)}</li>
            <li><strong>Lifecycle:</strong> ${escapeHtml(source.lifecycle_status)}</li>
            <li><strong>Graph eligibility:</strong> ${escapeHtml(source.graph_eligible ? 'publishable' : 'excluded')}</li>
          </ul>
        </div>
        <div class="framework-card">
          <h3>Use and scope</h3>
          <p><strong>License/use:</strong> ${escapeHtml(source.license_or_use)}</p>
          <p><strong>Frameworks:</strong> ${escapeHtml((source.metadata?.frameworks || []).join(', ') || 'None listed')}</p>
          <p><strong>Artifact URL:</strong></p>
          <p class="external-url-display"><a class="external-url" href="${escapeHtml(source.artifact_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.artifact_url)}</a></p>
        </div>
      </div>
    </section>`;
  buttonBySelector('#back-to-sources')?.addEventListener('click', () => void setView('sources', {
    source: '',
    provenance: state.provenance || '',
    eligibility: state.eligibility || '',
    lifecycle: state.lifecycle || '',
    access: state.access || '',
  }));
  elementBySelector('#source-detail-title')?.focus();
}

async function renderSources(state = currentState) {
  await withGraph(async () => {
    if (state.source) {
      await renderSourceDetail(state);
      return;
    }
    const findings = runtime.getGraphHealth();
    const filters = {
      provenance_class: state.provenance || undefined,
      eligibility_status: state.eligibility || undefined,
      lifecycle_status: state.lifecycle || undefined,
      access_status: state.access || undefined,
    };
    const sources = runtime.getSources(filters);
    app.innerHTML = `
      <section class="panel"><p class="eyebrow">Provenance</p><h2>Provenance and graph health</h2>
        <div class="learning-grid"><p><strong>Provenance</strong><br>Why a public source is included and how it supports visible records.</p><p><strong>Eligibility</strong><br>Whether the source may publish graph records into the public map.</p><p><strong>Lifecycle and access</strong><br>Deprecated, draft, restricted, or excluded sources stay visible here with warnings.</p></div>
        <p class="muted">Current sources cover baseline, RMF, assessment, CMMC, CUI, and program-context relationships while preserving the adopted static artifact contract.</p>
        <p class="muted">${findings.length} graph-health finding${findings.length === 1 ? '' : 's'}.</p>
        ${sourceFilterMarkup(runtime.getSources(), state)}
        <p class="muted">${sources.length} source record${sources.length === 1 ? '' : 's'} shown.</p>
        <div class="grid">${sources.map(renderSourceListCard).join('') || '<p class="notice">No sources match the current filters.</p>'}</div>
      </section>`;
    elementBySelector('#source-filters')?.addEventListener('change', () => {
      void setView('sources', {
        source: '',
        provenance: controlBySelector('#source-provenance-filter')?.value || '',
        eligibility: controlBySelector('#source-eligibility-filter')?.value || '',
        lifecycle: controlBySelector('#source-lifecycle-filter')?.value || '',
        access: controlBySelector('#source-access-filter')?.value || '',
      });
    });
    bindSourceButtons();
  });
}

function renderPatterns() {
  app.innerHTML = `
    <section class="panel">
      <p class="eyebrow">Patterns</p>
      <h2>Reference patterns stay public, generic, and source-aware</h2>
      <div class="grid">
        <article class="framework-card"><span class="badge">RMF lifecycle</span><h3>Plan around public RMF stages</h3><p>Follow public baseline, assessment, and evidence expectations without implying an authorization outcome.</p></article>
        <article class="framework-card"><span class="badge">Inheritance</span><h3>Map shared-control expectations</h3><p>Use public mappings to explain where a provider relationship begins and where local implementation still matters.</p></article>
        <article class="framework-card"><span class="badge">Reciprocity</span><h3>Separate reuse from approval</h3><p>Reference reuse patterns and provenance, but keep official acceptance decisions with the program office.</p></article>
      </div>
    </section>`;
}

function renderTemplates() {
  app.innerHTML = `
    <section class="panel">
      <p class="eyebrow">Templates</p>
      <h2>Blank planning starters stay local to your browser</h2>
      <div class="grid">
        <article class="framework-card"><span class="badge">Security Plan Starter</span><h3>Blank SSP structure</h3><p>Start with public control context and fill in your environment outside this site.</p></article>
        <article class="framework-card"><span class="badge">Evidence Matrix</span><h3>Evidence expectation matrix</h3><p>Use public sources to outline expected evidence types without uploading or storing package data.</p></article>
        <article class="framework-card"><span class="badge">POA&amp;M Starter</span><h3>Blank remediation tracker</h3><p>Generate a local planning surface without any backend, account, or hidden persistence.</p></article>
      </div>
    </section>`;
}

function renderStartHere() {
  app.innerHTML = `
    <section class="panel">
      <p class="eyebrow">Start Here</p>
      <h2>Find the right public entry point before diving into the graph</h2>
      <div class="grid">
        <article class="framework-card"><span class="badge">1</span><h3>Know your problem</h3><p>Start in the library when you already have a control, CCI, baseline, or framework identifier.</p><button class="secondary" type="button" data-start-here-target="search">Open Library</button></article>
        <article class="framework-card"><span class="badge">2</span><h3>Compare frameworks</h3><p>Use crosswalks when you need the public relationship path between two catalogs.</p><button class="secondary" type="button" data-start-here-target="matrix">Open Crosswalks</button></article>
        <article class="framework-card"><span class="badge">3</span><h3>Check trust first</h3><p>Open Provenance when you need to confirm why a mapping is shown and what source supports it.</p><button class="secondary" type="button" data-start-here-target="sources">Open Provenance</button></article>
      </div>
    </section>`;
  /** @type {NodeListOf<HTMLButtonElement>} */ (document.querySelectorAll('[data-start-here-target]')).forEach((button) => button.addEventListener('click', () => void setView(button.dataset.startHereTarget)));
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
      <section class="panel"><p class="eyebrow">Crosswalks</p><h2>Build a provenance-aware relationship matrix</h2>
        <form id="matrix-form" class="controls">
          <div class="field"><label for="matrix-source">Source catalog</label><select id="matrix-source">${catalogOptions(source)}</select></div>
          <div class="field"><label for="matrix-target">Target catalog</label><select id="matrix-target">${catalogOptions(target)}</select></div>
          <div class="field matrix-items-field"><label for="matrix-items">Optional source IDs</label><textarea id="matrix-items">${escapeHtml(itemText)}</textarea></div>
          <button class="primary" type="submit">Build matrix</button><button class="secondary" id="export-matrix" type="button">Export CSV</button>
        </form>
        ${matrix ? `<p class="muted">${matrix.summary.total} rows  -  ${matrix.summary.published} published  -  ${matrix.summary.candidate} inferred candidates  -  ${matrix.summary.unmapped} unmapped</p><table class="matrix-table"><thead><tr><th>Source ID</th><th>Status</th><th>Related nodes</th></tr></thead><tbody>${matrix.rows.slice(0, 200).map((row) => `<tr><td>${escapeHtml(row.source_node_id)}</td><td>${escapeHtml(row.classification)}</td><td>${escapeHtml(row.edges.map((edge) => edge.display_label).join(' | ') || 'No sourced relationship')}</td></tr>`).join('')}</tbody></table>` : ''}
      </section>`;
    elementBySelector('#matrix-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      void setView('matrix', { source: controlBySelector('#matrix-source')?.value || '', target: controlBySelector('#matrix-target')?.value || '', items: controlBySelector('#matrix-items')?.value.trim() || '' });
    });
    buttonBySelector('#export-matrix')?.addEventListener('click', () => {
      const content = runtime.buildRelationshipCsv(matrix);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([content], { type: 'text/csv' }));
      link.download = `Control-Atlas-${source}-to-${target}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    });
  });
}

function renderRetired(state) {
  app.innerHTML = `<section class="notice"><h2>${escapeHtml(state.query)} is outside the active public-map scope.</h2><button class="primary" id="retired-search" type="button">Search the library</button></section>`;
  buttonBySelector('#retired-search')?.addEventListener('click', () => void setView('search'));
}

async function renderState(state) {
  currentState = state;
  navButtons.forEach((button) => button.toggleAttribute('aria-current', button.dataset.view === state.view));
  if (state.view === 'matrix') await renderMatrix(state);
  else if (state.view === 'library-detail') await renderLibraryDetail(state);
  else if (state.view === 'browse') await renderBrowse(state);
  else if (state.view === 'patterns') renderPatterns();
  else if (state.view === 'templates') renderTemplates();
  else if (state.view === 'sources') await renderSources();
  else if (state.view === 'start-here') renderStartHere();
  else if (state.view === 'retired') renderRetired(state);
  else await renderSearch(state);
}

async function setView(view, state = {}) {
  const next = normalizeViewState(view, { ...currentState, ...state, mode: noviceMode ? 'novice' : 'expert' });
  history.pushState(null, '', location.pathname + serializeViewState(next));
  await renderState(next);
}

function initHeroRotation() {
  if (!heroRotatingWord) return;
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotionQuery.matches) {
    heroRotatingWord.textContent = 'Comply';
    heroRotatingWord.setAttribute('aria-label', `${heroPrefix}Comply`);
    return;
  }
  let index = 0;
  heroRotatingWord.textContent = heroWords[index];
  heroRotatingWord.setAttribute('aria-label', `${heroPrefix}${heroWords[index]}`);
  setInterval(() => {
    index = (index + 1) % heroWords.length;
    heroRotatingWord.textContent = heroWords[index];
    heroRotatingWord.setAttribute('aria-label', `${heroPrefix}${heroWords[index]}`);
  }, 1800);
}

function showOnboardingOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'onboarding-overlay';
  overlay.id = 'onboarding-overlay';
  overlay.innerHTML = `<div class="onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="onboarding-title"><h2 id="onboarding-title">Explore public security relationships</h2><p>Control Atlas separates relationship semantics, provenance, confidence, and evidence quality.</p><div class="onboarding-choices"><button class="primary" id="btn-onboarding-start" type="button">Start exploring</button><button class="secondary" id="btn-onboarding-skip" type="button">Skip</button></div></div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  buttonBySelector('#btn-onboarding-start')?.addEventListener('click', close);
  buttonBySelector('#btn-onboarding-skip')?.addEventListener('click', close);
  overlay.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
  buttonBySelector('#btn-onboarding-start')?.focus();
}

function toggleHelp() {
  const existing = elementBySelector('#glossary-drawer');
  if (existing) {
    existing.remove();
    return;
  }
  const drawer = document.createElement('aside');
  drawer.id = 'glossary-drawer';
  drawer.className = 'glossary-drawer open';
  drawer.innerHTML = `<button class="close-drawer" aria-label="Close help" type="button">x</button><h2>Control Atlas help</h2><dl class="glossary-list"><div class="glossary-item"><dt>Provenance</dt><dd>Why a source or relationship is eligible for the public map.</dd></div><div class="glossary-item"><dt>Confidence</dt><dd>The support strength for a relationship.</dd></div><div class="glossary-item"><dt>Evidence quality</dt><dd>The role of a source record supporting a claim.</dd></div></dl>`;
  document.body.appendChild(drawer);
  /** @type {HTMLButtonElement | null} */ (drawer.querySelector('button'))?.addEventListener('click', () => drawer.remove());
}

async function init() {
  initHeroRotation();
  navButtons.forEach((button) => button.addEventListener('click', () => void setView(button.dataset.view)));
  /** @type {NodeListOf<HTMLButtonElement>} */ (document.querySelectorAll('[data-view-shortcut]')).forEach((button) => button.addEventListener('click', () => void setView(button.dataset.viewShortcut)));
  buttonBySelector('#btn-toggle-mode')?.addEventListener('click', (event) => {
    noviceMode = !noviceMode;
    const toggleButton = /** @type {HTMLButtonElement} */ (event.currentTarget);
    toggleButton.setAttribute('aria-pressed', String(noviceMode));
    toggleButton.textContent = noviceMode ? 'Novice Mode' : 'Expert Mode';
  });
  buttonBySelector('#btn-toggle-mode')?.setAttribute('aria-pressed', 'true');
  buttonBySelector('#btn-toggle-glossary')?.addEventListener('click', toggleHelp);
  addEventListener('popstate', () => void renderState(parseViewState(location.search)));
  const state = parseViewState(location.search);
  if (!('mode' in state) || !state.mode) showOnboardingOverlay();
  await renderState(state);
}

init().catch((error) => {
  app.setAttribute('aria-busy', 'false');
  app.innerHTML = `<section class="notice"><h2>Control Atlas could not start</h2><p>${escapeHtml(error.message)}</p></section>`;
});
