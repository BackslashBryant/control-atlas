import { createFrameworkRuntime, parseViewState, serializeViewState } from './runtime.mjs';
import { terms } from './content/terms.mjs';
import { tooltips } from './content/tooltips.mjs';
import { emptyStates } from './content/emptyStates.mjs';
import { pageIntros } from './content/pageIntros.mjs';
import { statusLabels } from './content/statusLabels.mjs';
import { glossary } from './content/glossary.mjs';

const app = document.querySelector('#app');
const navButtons = [...document.querySelectorAll('nav [data-view]')];
let dataset;
let runtime;

// Persistent UI states
let noviceMode = true;
let walkthroughStep = null;
let browseSort = 'alpha';
let browseFilter = 'all';
let searchFilters = { framework: '', match: 'all', source: 'all' };
let currentActiveView = 'search';
let currentActiveState = {};
let viewState = { view: 'search', mode: 'novice' };

const TOUR_EXAMPLE_KEY = 'nist-800-53:AC-2';
const TOUR_EXAMPLE_QUERY = 'AC-2';

// Framework date additions lookup
const frameworkDates = {
  'nist-800-53': '2026-01-01',
  'nist-800-171': '2026-02-01',
  'csf-2': '2026-03-01',
  'cmmc-2': '2026-04-01',
  'fedramp-rev5': '2026-05-01',
  'disa-cci': '2026-05-15',
  'nist-ai-rmf': '2026-06-01',
  'nist-ssdf': '2026-06-05',
  'dod-rai': '2026-06-09'
};

async function ensureDataset() {
  if (runtime) return;
  const response = await fetch('./data/generated/catalog.json');
  if (!response.ok) throw new Error('Validated framework catalog is unavailable.');
  dataset = await response.json();
  runtime = createFrameworkRuntime(dataset);
}

function showLoadingCard(message) {
  app.setAttribute('aria-busy', 'true');
  app.innerHTML = `<div class="loading-card">${escapeHtml(message)}</div>`;
}

function renderCatalogError(error, retry) {
  app.setAttribute('aria-busy', 'false');
  app.innerHTML = `
    <section class="notice">
      <h2>Catalog could not load</h2>
      <p>${escapeHtml(error.message)}</p>
      <button class="primary" type="button" id="catalog-retry">Retry</button>
    </section>`;
  document.querySelector('#catalog-retry').addEventListener('click', () => retry());
}

async function ensureDatasetWithLoading(retryFn) {
  if (runtime) return;
  showLoadingCard('Loading catalog…');
  try {
    await ensureDataset();
  } catch (error) {
    renderCatalogError(error, retryFn);
    throw error;
  }
}

function renderNotice(message) {
  const el = document.createElement('p');
  el.className = 'notice muted';
  el.textContent = message;
  return el;
}

function isSecureExternalUrl(url) {
  return typeof url === 'string' && url.startsWith('https://');
}

function externalAnchor(href, label, title = '') {
  if (!isSecureExternalUrl(href)) {
    return `<span class="muted">${escapeHtml(label)} (link unavailable)</span>`;
  }
  const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
  return `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer"${titleAttr}>${escapeHtml(label)}</a>`;
}

function sourceArtifactLabel(source) {
  const url = source.artifact || '';
  if (url.includes('github.com')) return `GitHub — ${source.name}`;
  if (url.includes('nist.gov')) return `NIST — ${source.name}`;
  return source.name;
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

function sourceTierLabel(tier) {
  if (tier === 'gold') return 'Official';
  if (tier === 'silver') return 'Supporting';
  if (tier === 'bronze') return 'Research lead';
  return tier;
}

// Epic 4.3 & 4.2 Source badges
function getSourceBadgesHtml(mapping) {
  const evidence = runtime.getEvidenceSummary(mapping.id);
  const presentBadges = [];
  if (evidence) {
    evidence.sources.forEach(src => {
      const label = sourceTierLabel(src.tier);
      const badgeClass = src.tier === 'gold' ? 'badge-official' : src.tier === 'silver' ? 'badge-supporting' : 'badge-research';
      presentBadges.push(`<span class="badge ${badgeClass}">${escapeHtml(label)} source</span>`);
    });
  } else {
    presentBadges.push(`<span class="badge badge-official">Official source</span>`);
  }
  return presentBadges.join(' ');
}

// Epic 8.2 Contribution Link
function getContributionLink(mapping) {
  const sourceItem = itemFor(mapping.source_key);
  const targetItem = itemFor(mapping.target_key);
  const title = encodeURIComponent(`Contribute mapping evidence: ${sourceItem?.item_id} to ${targetItem?.item_id}`);
  const body = encodeURIComponent(
`### Suggested Mapping Evidence

**Source Framework:** ${sourceItem?.framework_id}
**Source Control ID:** ${sourceItem?.item_id}
**Target Framework:** ${targetItem?.framework_id}
**Target Control ID:** ${targetItem?.item_id}

**Evidence Link / Rationale:**
[Please provide the link to the official source or crosswalk and brief rationale supporting this mapping]

**Mapping ID (GovFrame):** ${mapping.id}`
  );
  return `https://github.com/BackslashBryant/GovFrame/issues/new?title=${title}&body=${body}`;
}

// Epic 4.1 Plain language Evidence Panel
function renderEvidenceSummaryPanel(mapping, key) {
  const evidence = runtime.getEvidenceSummary(mapping.id);
  if (!evidence) {
    return `<div class="evidence-summary-panel"><p class="muted">No detailed evidence available.</p></div>`;
  }
  const counterpartKey = mapping.source_key === key ? mapping.target_key : mapping.source_key;
  const counterpart = itemFor(counterpartKey);
  const currentItem = itemFor(key);

  const sourcesHtml = evidence.sources.map(source => {
    const tierName = sourceTierLabel(source.tier);
    return `
      <div class="evidence-source-item" style="margin-bottom: 1rem;">
        <h5>Why GovFrame shows this</h5>
        <ul>
          <li><strong>Source:</strong> ${escapeHtml(source.source_id)}</li>
          <li><strong>Source type:</strong> ${escapeHtml(tierName)}</li>
          <li><strong>What it supports:</strong> ${escapeHtml(currentItem?.item_id || key)} maps to ${escapeHtml(counterpart?.item_id || counterpartKey)}.</li>
          <li><strong>Use in audit:</strong> Review and cite the source: ${externalAnchor(source.artifact, source.locator)}</li>
        </ul>
      </div>`;
  }).join('');

  return `
    <div class="evidence-summary-panel">
      ${sourcesHtml}
      <details class="raw-evidence-details">
        <summary>View raw evidence</summary>
        <pre>${escapeHtml(JSON.stringify(evidence, null, 2))}</pre>
      </details>
    </div>`;
}

// Epic 1.1 Novice mode State and View helper
function renderNoviceIntro(pageKey) {
  if (!noviceMode || !pageIntros[pageKey]) return '';
  return `
    <div class="learning-callout" style="margin-bottom: 1.5rem;">
      <p style="margin: 0; font-size: 0.92rem; line-height: 1.4;">
        <strong>Educational Guide:</strong> ${escapeHtml(pageIntros[pageKey].description)}
      </p>
    </div>
  `;
}

function dismissOnboardingOverlay() {
  document.querySelector('#onboarding-overlay')?.remove();
}

// Onboarding Choice Modal
function showOnboardingOverlay() {
  let overlay = document.querySelector('#onboarding-overlay');
  if (overlay) return;
  overlay = document.createElement('div');
  overlay.id = 'onboarding-overlay';
  overlay.className = 'onboarding-overlay';
  overlay.innerHTML = `
    <div class="onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="onboard-title">
      <h3 id="onboard-title">Welcome to GovFrame</h3>
      <p>Select your mapping experience level to customize help tips and explanations:</p>
      <div class="onboarding-choices">
        <button class="primary" id="btn-mode-novice">I'm new to mapping</button>
        <button class="secondary" id="btn-mode-expert">I know what I need</button>
      </div>
      <button class="secondary" id="btn-onboarding-skip" type="button" aria-label="Skip onboarding for now" style="margin-top: 1rem; width: 100%;">Skip for now</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const bindModeChoice = (buttonId, isNovice) => {
    document.querySelector(buttonId).addEventListener('click', async () => {
      try {
        await setNoviceMode(isNovice);
      } catch (error) {
        console.error(`Failed to set ${isNovice ? 'novice' : 'expert'} mode`, error);
      } finally {
        overlay.remove();
      }
    });
  };

  bindModeChoice('#btn-mode-novice', true);
  bindModeChoice('#btn-mode-expert', false);

  document.querySelector('#btn-onboarding-skip').addEventListener('click', () => {
    overlay.remove();
  });

  const escHandler = (event) => {
    if (event.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

async function setNoviceMode(isNovice) {
  noviceMode = isNovice;

  viewState = {
    ...viewState,
    mode: isNovice ? 'novice' : 'expert',
  };

  const toggleBtn = document.querySelector('#btn-toggle-mode');
  if (toggleBtn) {
    toggleBtn.textContent = `Mode: ${isNovice ? 'Novice' : 'Expert'}`;
    toggleBtn.classList.toggle('active-novice', isNovice);
  }

  history.replaceState(null, '', location.pathname + serializeViewState(viewState));

  if (currentActiveState.key) {
    await renderItem(currentActiveState.key);
    return;
  }

  await render(viewState);
}

// Help & Glossary Drawer
function toggleGlossaryDrawer(forceOpen) {
  let drawer = document.querySelector('#glossary-drawer');
  if (!drawer) {
    drawer = document.createElement('div');
    drawer.id = 'glossary-drawer';
    drawer.className = 'glossary-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-labelledby', 'glossary-title');

    const glossaryHtml = glossary.map(item => `
      <div class="glossary-item">
        <dt>${escapeHtml(item.term)}</dt>
        <dd>${escapeHtml(item.definition)}</dd>
      </div>
    `).join('');

    drawer.innerHTML = `
      <button class="close-drawer" id="btn-close-glossary" aria-label="Close glossary">&times;</button>
      <h2 id="glossary-title">Help & Glossary</h2>
      <p class="muted" style="margin-bottom: 1.5rem;">Key concepts and definitions:</p>
      <dl class="glossary-list">
        ${glossaryHtml}
      </dl>
      <div style="margin-top: 2rem; border-top: 1px solid var(--line); padding-top: 1rem;">
        <button class="primary" id="btn-restart-walkthrough" style="width: 100%;">Restart Guided Tour</button>
      </div>
    `;
    document.body.appendChild(drawer);

    document.querySelector('#btn-close-glossary').addEventListener('click', () => toggleGlossaryDrawer(false));
    document.querySelector('#btn-restart-walkthrough').addEventListener('click', () => {
      toggleGlossaryDrawer(false);
      startWalkthrough();
    });
  }

  const isOpen = forceOpen !== undefined ? forceOpen : !drawer.classList.contains('open');
  drawer.classList.toggle('open', isOpen);

  if (isOpen) {
    drawer.querySelector('#btn-close-glossary').focus();
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        toggleGlossaryDrawer(false);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  } else {
    const trigger = document.querySelector('#btn-toggle-glossary');
    if (trigger) trigger.focus();
  }
}

// Epic 1.2 Guided Walkthrough
const walkthroughSteps = [
  {
    title: "1. Search a Control ID",
    text: "Let's search for the NIST control 'AC-2'. We've prefilled it in the search input. Click the Search button to execute.",
    setup: async () => {
      await setView('search', { query: '', filter: '' });
      const queryInput = document.querySelector('#search-query');
      if (queryInput) {
        queryInput.value = TOUR_EXAMPLE_QUERY;
      }
    }
  },
  {
    title: "2. Open Search Result",
    text: "The search found matching items. Look for the 'AC-2' card and click it to view detail.",
    setup: async () => {
      await setView('search', { query: TOUR_EXAMPLE_QUERY, filter: '' });
    }
  },
  {
    title: "3. Understand Official Matches",
    text: "Under 'Direct sourced mappings', you see 'Official matches'. These are verified, trusted mappings directly from official source organizations (e.g. NIST or DISA).",
    setup: async () => {
      await renderItem(TOUR_EXAMPLE_KEY);
    }
  },
  {
    title: "4. Review Possible Connections",
    text: "Scroll down to 'Possible connections'. These are paths GovFrame calculated through intermediate requirements. They are useful research leads, but require auditing.",
    setup: async () => {
      // already on item page
    }
  },
  {
    title: "5. Compare or Export Mappings",
    text: "You can click 'Export CSV' to download the relationships, or copy a citation-ready summary. You can also build a full matrix from the 'Map Frameworks' tab.",
    setup: async () => {
      // already on item page
    }
  }
];

async function startWalkthrough() {
  dismissOnboardingOverlay();
  walkthroughStep = 0;
  try {
    await walkthroughSteps[0].setup();
  } catch (error) {
    console.error('Walkthrough setup failed', error);
  }
  renderWalkthroughBubble();
}

function renderWalkthroughBubble() {
  let bubble = document.querySelector('#walkthrough-bubble');
  if (walkthroughStep === null) {
    if (bubble) bubble.remove();
    return;
  }

  if (!bubble) {
    bubble = document.createElement('div');
    bubble.id = 'walkthrough-bubble';
    bubble.className = 'walkthrough-bubble';
    document.body.appendChild(bubble);
  }

  const step = walkthroughSteps[walkthroughStep];
  bubble.innerHTML = `
    <h4>${escapeHtml(step.title)}</h4>
    <p>${escapeHtml(step.text)}</p>
    <div class="walkthrough-actions">
      <button type="button" class="btn-skip" id="btn-walkthrough-skip">End Tour</button>
      <button type="button" class="btn-next" id="btn-walkthrough-next">
        ${walkthroughStep === walkthroughSteps.length - 1 ? 'Finish' : 'Next Step'}
      </button>
    </div>
  `;

  document.querySelector('#btn-walkthrough-skip').addEventListener('click', () => {
    walkthroughStep = null;
    renderWalkthroughBubble();
  });

  document.querySelector('#btn-walkthrough-next').addEventListener('click', async () => {
    walkthroughStep++;
    if (walkthroughStep >= walkthroughSteps.length) {
      walkthroughStep = null;
      renderWalkthroughBubble();
    } else {
      const nextStep = walkthroughSteps[walkthroughStep];
      if (nextStep.setup) {
        try {
          await nextStep.setup();
        } catch (error) {
          console.error('Walkthrough step setup failed', error);
        }
      }
      renderWalkthroughBubble();
    }
  });
}

// D3 Node-link visualization
function drawNodeLink(svgElement, paths) {
  const d3 = window.d3;
  if (!d3) {
    svgElement.replaceWith(renderNotice('Graph library unavailable.'));
    return;
  }
  if (!paths.length) {
    svgElement.replaceWith(renderNotice(emptyStates.paths));
    return;
  }
  svgElement.innerHTML = '';

  const nodesMap = new Map();
  const links = [];
  const slicedPaths = paths.slice(0, 8);

  slicedPaths.forEach(path => {
    path.item_keys.forEach((key, index) => {
      if (!nodesMap.has(key)) {
        const item = itemFor(key);
        nodesMap.set(key, {
          key,
          id: item?.item_id || key.split(':')[1] || key,
          column: index,
        });
      }
    });
    for (let i = 0; i < path.item_keys.length - 1; i++) {
      const source = path.item_keys[i];
      const target = path.item_keys[i+1];
      if (!links.some(l => l.source === source && l.target === target)) {
        links.push({ source, target });
      }
    }
  });

  const nodes = [...nodesMap.values()];
  const columns = [[], [], [], []];
  nodes.forEach(n => {
    if (columns[n.column]) columns[n.column].push(n);
  });

  const width = svgElement.clientWidth || 300;
  const height = svgElement.clientHeight || 240;
  const colWidth = width / 3;

  columns.forEach((colNodes, colIndex) => {
    const spacing = height / (colNodes.length + 1);
    colNodes.forEach((n, nodeIndex) => {
      n.x = colIndex * colWidth + colWidth / 2;
      n.y = (nodeIndex + 1) * spacing;
    });
  });

  const svg = d3.select(svgElement);

  svg.selectAll('.vis-link')
    .data(links)
    .enter()
    .append('line')
    .attr('class', 'vis-link')
    .attr('x1', d => nodesMap.get(d.source).x)
    .attr('y1', d => nodesMap.get(d.source).y)
    .attr('x2', d => nodesMap.get(d.target).x)
    .attr('y2', d => nodesMap.get(d.target).y)
    .attr('stroke', '#47715d')
    .attr('stroke-width', 2);

  const nodeGroups = svg.selectAll('.vis-node')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'vis-node')
    .attr('transform', d => `translate(${d.x},${d.y})`);

  nodeGroups.append('circle')
    .attr('r', 12)
    .attr('fill', '#173f35')
    .attr('stroke', '#d2a84b')
    .attr('stroke-width', 1.5);

  nodeGroups.append('text')
    .attr('dy', -18)
    .attr('text-anchor', 'middle')
    .attr('font-size', '10px')
    .attr('fill', '#14231f')
    .text(d => d.id);
}

function drawAdjacencyMatrix(container, paths, direct) {
  const targets = new Set();
  const rows = [];

  direct.forEach(m => {
    const counterpartKey = m.source_key === currentActiveState.key ? m.target_key : m.source_key;
    const counterpart = itemFor(counterpartKey);
    const id = counterpart?.item_id || counterpartKey;
    targets.add(id);
    rows.push({ id, type: 'Official' });
  });

  paths.forEach(p => {
    const lastKey = p.item_keys[p.item_keys.length - 1];
    const counterpart = itemFor(lastKey);
    const id = counterpart?.item_id || lastKey;
    if (!targets.has(id)) {
      targets.add(id);
      rows.push({ id, type: 'Possible' });
    }
  });

  if (rows.length === 0) {
    container.innerHTML = '<p class="muted">No relationships to display.</p>';
    return;
  }

  const cellsHtml = rows.map(r => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.4rem; border-bottom: 1px solid var(--line); font-size: 0.85rem;">
      <strong>${escapeHtml(r.id)}</strong>
      <span class="badge ${r.type === 'Official' ? 'badge-official' : 'badge-connection'}">${escapeHtml(r.type)}</span>
    </div>
  `).join('');

  container.innerHTML = `
    <div style="border: 1px solid var(--line); border-radius: 8px; background: white; padding: 0.5rem;">
      <div style="font-weight: 800; font-size: 0.8rem; text-transform: uppercase; color: var(--muted); padding-bottom: 0.4rem; border-bottom: 1.5px solid var(--line); margin-bottom: 0.4rem;">Mapped Counterparts</div>
      ${cellsHtml}
    </div>
  `;
}

async function setView(view, state = {}, replace = false) {
  const next = {
    ...viewState,
    view,
    mode: noviceMode ? 'novice' : 'expert',
    ...state,
  };

  viewState = next;
  history[replace ? 'replaceState' : 'pushState'](null, '', location.pathname + serializeViewState(next));
  await render(next);
}

async function renderSearch(state) {
  const query = state.query || '';
  const filter = state.filter || '';
  if (query) {
    try {
      await ensureDatasetWithLoading(() => renderSearch(state));
    } catch {
      return;
    }
  }
  const filters = { framework_id: filter || undefined };
  const rawResults = query ? runtime.searchFrameworkItems(query, filters) : [];

  // Epic 3.3 Search Filters
  let results = rawResults;
  if (query) {
    if (searchFilters.match !== 'all') {
      results = results.filter(item => {
        const direct = runtime.getDirectMappings(item.key);
        const paths = runtime.getCalculatedPaths(item.key);
        if (searchFilters.match === 'official') return direct.length > 0;
        if (searchFilters.match === 'connection') return paths.length > 0;
        if (searchFilters.match === 'none') return direct.length === 0 && paths.length === 0;
        return true;
      });
    }
    if (searchFilters.source !== 'all') {
      results = results.filter(item => {
        const direct = runtime.getDirectMappings(item.key);
        return direct.some(mapping => {
          const evidence = runtime.getEvidenceSummary(mapping.id);
          return evidence && evidence.sources.some(src => src.tier === searchFilters.source);
        });
      });
    }
  }

  const hasResults = query && results.length > 0;
  const noResults = query && results.length === 0;

  const title = query ? pageIntros.search.title : pageIntros.home.title;
  const description = query ? pageIntros.search.description : pageIntros.home.description;

  app.innerHTML = `
    <section class="panel" aria-labelledby="search-title">
      <p class="eyebrow">Explore an item</p>
      <h2 id="search-title">${escapeHtml(title)}</h2>
      <p>${escapeHtml(description)}</p>
      ${!query ? `
      <div style="margin: 1rem 0; display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button class="primary" id="btn-focus-search" type="button">Search requirements</button>
        <button class="secondary" id="btn-learn-mapping" type="button">Learn how mapping works</button>
      </div>` : ''}
      ${renderNoviceIntro(query ? 'search' : 'home')}
      <form class="search-controls" id="search-form">
        <div class="field"><label for="search-query">ID, title, or topic</label><input id="search-query" type="search" value="${escapeHtml(query)}" placeholder="AC-2, CCI-000225, PR.AA-01, account management"></div>
        <div class="field"><label for="search-framework">Framework filter</label><select id="search-framework"><option value="">All frameworks</option>${frameworkOptions(filter)}</select></div>
        <button class="primary" type="submit">Search</button>
      </form>

      <!-- Epic 3.1 Search Examples -->
      <div class="search-examples">
        <span class="label">Examples:</span>
        <button type="button" class="chip" data-example="AC-2">AC-2</button>
        <button type="button" class="chip" data-example="CCI-000225">CCI-000225</button>
        <button type="button" class="chip" data-example="PR.AA-01">PR.AA-01</button>
        <button type="button" class="chip" data-example="account management">account management</button>
      </div>

      <p class="muted">${query ? `${results.length} matching item${results.length === 1 ? '' : 's'} found.` : 'Enter an identifier or phrase. The landing page does not load the full catalog.'}</p>
    </section>

    <!-- Epic 3.3 Dynamic Filters -->
    ${hasResults ? `
    <div class="results-filters-bar">
      <span class="filter-label">Filter matches:</span>
      <select id="filter-match-type">
        <option value="all" ${searchFilters.match === 'all' ? 'selected' : ''}>All match types</option>
        <option value="official" ${searchFilters.match === 'official' ? 'selected' : ''}>Official matches only</option>
        <option value="connection" ${searchFilters.match === 'connection' ? 'selected' : ''}>Possible connections only</option>
        <option value="none" ${searchFilters.match === 'none' ? 'selected' : ''}>No known matches only</option>
      </select>
      <select id="filter-source-type">
        <option value="all" ${searchFilters.source === 'all' ? 'selected' : ''}>All source tiers</option>
        <option value="gold" ${searchFilters.source === 'gold' ? 'selected' : ''}>Official</option>
        <option value="silver" ${searchFilters.source === 'silver' ? 'selected' : ''}>Supporting</option>
        <option value="bronze" ${searchFilters.source === 'bronze' ? 'selected' : ''}>Research lead</option>
      </select>
    </div>` : ''}

    <section class="results" aria-label="Search results">
      <!-- Epic 3.2 Empty State -->
      ${noResults ? `
      <div class="notice empty-search">
        <h3>No matches found</h3>
        <p>${escapeHtml(emptyStates.search)}</p>
        <div style="margin-top: 1rem;">
          <button class="secondary" id="empty-btn-browse" type="button">Browse catalogs</button>
        </div>
      </div>` : ''}

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

  // Event bindings
  document.querySelector('#search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    setView('search', {
      query: document.querySelector('#search-query').value.trim(),
      filter: document.querySelector('#search-framework').value,
    });
  });

  const focusSearchBtn = document.querySelector('#btn-focus-search');
  if (focusSearchBtn) {
    focusSearchBtn.addEventListener('click', () => {
      const form = document.querySelector('#search-form');
      const input = document.querySelector('#search-query');

      if (input.value.trim()) {
        form.requestSubmit();
        return;
      }

      input.focus();
    });
  }

  const learnMappingBtn = document.querySelector('#btn-learn-mapping');
  if (learnMappingBtn) {
    learnMappingBtn.addEventListener('click', () => {
      void startWalkthrough();
    });
  }

  document.querySelectorAll('[data-example]').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelector('#search-query').value = chip.dataset.example;
      searchFilters = { framework: '', match: 'all', source: 'all' };
      setView('search', {
        query: chip.dataset.example,
        filter: '',
      });
    });
  });

  const emptyBrowseBtn = document.querySelector('#empty-btn-browse');
  if (emptyBrowseBtn) {
    emptyBrowseBtn.addEventListener('click', () => setView('browse'));
  }

  const matchFilterSelect = document.querySelector('#filter-match-type');
  if (matchFilterSelect) {
    matchFilterSelect.addEventListener('change', () => {
      searchFilters.match = matchFilterSelect.value;
      renderSearch(state);
    });
  }

  const sourceFilterSelect = document.querySelector('#filter-source-type');
  if (sourceFilterSelect) {
    sourceFilterSelect.addEventListener('change', () => {
      searchFilters.source = sourceFilterSelect.value;
      renderSearch(state);
    });
  }

  document.querySelectorAll('[data-open-item]').forEach((button) => button.addEventListener('click', () => renderItem(button.dataset.openItem)));

  if (hasResults) {
    requestAnimationFrame(() => {
      document.querySelector('.results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

async function renderItem(key) {
  try {
    await ensureDatasetWithLoading(() => renderItem(key));
  } catch {
    return;
  }
  const item = itemFor(key);
  if (!item) return;
  currentActiveState = { key };
  const direct = runtime.getDirectMappings(key);
  const paths = runtime.getCalculatedPaths(key);

  const mappingCard = (mapping) => {
    const counterpartKey = mapping.source_key === key ? mapping.target_key : mapping.source_key;
    const counterpart = itemFor(counterpartKey);
    const direction = mapping.source_key === key ? 'outgoing' : 'incoming';

    // Gaps renamed to "Needs supporting source" (Epic 4.2)
    const gapBadge = mapping.evidence_gaps && mapping.evidence_gaps.length
      ? `<span class="badge badge-needs-source" title="${escapeHtml(tooltips.needsSupportingSource)}">Needs supporting source</span>`
      : `<span class="badge badge-official" title="${escapeHtml(tooltips.officialMatch)}">Official match</span>`;

    // Contribution link
    const contributionHtml = mapping.evidence_gaps && mapping.evidence_gaps.length
      ? `<div class="contribution-callout">${externalAnchor(getContributionLink(mapping), 'Contribute mapping evidence', 'Open GitHub issue in a new tab')}</div>`
      : '';

    const sourceBadges = getSourceBadgesHtml(mapping);
    const evidenceSummaryPanel = renderEvidenceSummaryPanel(mapping, key);

    return `
      <article class="mapping-card badge-official">
        <div class="badge-row">
          <span class="badge">${escapeHtml(mapping.relationship_type)} · ${direction}</span>
          ${sourceBadges}
          ${gapBadge}
        </div>
        <h4>${escapeHtml(counterpart?.item_id || counterpartKey)} · ${escapeHtml(counterpart?.title || '')}</h4>
        <p>${escapeHtml(mapping.rationale || '')}</p>
        ${contributionHtml}
        <button class="secondary" type="button" data-open-item="${escapeHtml(counterpartKey)}">Open mapped item</button>
        <details>
          <summary>Evidence audit</summary>
          ${evidenceSummaryPanel}
        </details>
      </article>`;
  };

  const pathCard = (path) => {
    return `
      <article class="mapping-card calculated">
        <div class="badge-row">
          <span class="badge" title="${escapeHtml(tooltips.possibleConnection)}">Possible connection · ${path.hops.length} hops</span>
        </div>
        <div class="path" style="margin-top: 0.5rem;">
          ${path.item_keys.map((itemKey) => `<span>${escapeHtml(itemFor(itemKey)?.item_id || itemKey)}</span>`).join(' → ')}
        </div>
      </article>`;
  };

  const visibleDirect = direct.slice(0, 8);
  const additionalDirect = direct.slice(8);

  app.innerHTML = `
    <button class="secondary" type="button" id="back-search">← Back to search</button>
    <section class="detail-layout" aria-labelledby="item-heading">
      <div class="detail-main">
        <article class="panel">
          <div class="badge-row"><span class="badge">${escapeHtml(frameworkName(item.framework_id))}</span><span class="badge badge-official">Official source</span></div>
          <h2 id="item-heading" class="item-id" tabindex="-1">${escapeHtml(item.item_id)}</h2>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.text)}</p>
          <details><summary>Canonical source evidence</summary><p>${escapeHtml(item.canonical_evidence.source_id)} · ${escapeHtml(item.canonical_evidence.locator)} · ${escapeHtml(item.canonical_evidence.snapshot_date)}</p></details>
        </article>

        <section class="panel">
          <p class="eyebrow">Direct sourced mappings</p>
          <h3>${direct.length} Official match${direct.length === 1 ? '' : 'es'}</h3>
          ${renderNoviceIntro('search')}
          <div class="stack">${direct.length ? visibleDirect.map(mappingCard).join('') : '<p class="notice">No official matches are currently known.</p>'}</div>
          ${additionalDirect.length ? `<details class="more-mappings"><summary>Show all ${direct.length} direct mappings</summary><div class="stack">${additionalDirect.map(mappingCard).join('')}</div></details>` : ''}
        </section>

        <section class="panel">
          <p class="eyebrow">Explained paths</p>
          <h3>${paths.length} Possible connection${paths.length === 1 ? '' : 's'}</h3>
          <p class="muted">Possible connections link requirements through related hops.</p>
          <div class="stack">${paths.length ? paths.slice(0, 30).map(pathCard).join('') : '<p class="notice">No possible connections known.</p>'}</div>
        </section>
      </div>

      <aside class="detail-side panel">
        <p class="eyebrow">How to use this result</p>
        <h3>${direct.length + paths.length} known routes</h3>
        <p class="muted">Review official matches for direct reuse. Treat possible connections as leads.</p>

        <!-- Epic 7.2 Relationship Visualizations -->
        <div class="visualization-tabs">
          <button type="button" id="vis-tab-node" class="active">Flow Graph</button>
          <button type="button" id="vis-tab-matrix">Grid Matrix</button>
          <button type="button" id="vis-tab-list">List View</button>
        </div>
        <p class="muted" style="font-size: 0.85rem; margin: 0.5rem 0 0;">Shows calculated multi-hop paths. See mapping cards for evidence.</p>
        <div id="vis-container" style="margin-top: 10px;">
          <svg id="vis-svg" class="visualization-canvas"></svg>
        </div>
      </aside>
    </section>`;

  document.querySelector('#back-search').addEventListener('click', () => setView('search', {}, false));
  document.querySelectorAll('[data-open-item]').forEach((button) => button.addEventListener('click', () => renderItem(button.dataset.openItem)));

  // D3 Visualization tabs binding
  const visContainer = document.querySelector('#vis-container');
  const drawVis = (tab) => {
    document.querySelectorAll('.visualization-tabs button').forEach(btn => btn.classList.remove('active'));
    if (tab === 'node') {
      document.querySelector('#vis-tab-node').classList.add('active');
      visContainer.innerHTML = '<svg id="vis-svg" class="visualization-canvas"></svg>';
      drawNodeLink(document.querySelector('#vis-svg'), paths);
    } else if (tab === 'matrix') {
      document.querySelector('#vis-tab-matrix').classList.add('active');
      visContainer.innerHTML = '<div id="vis-matrix-list"></div>';
      drawAdjacencyMatrix(document.querySelector('#vis-matrix-list'), paths, direct);
    } else {
      document.querySelector('#vis-tab-list').classList.add('active');
      const directRows = direct.slice(0, 8).map((mapping) => {
        const counterpartKey = mapping.source_key === key ? mapping.target_key : mapping.source_key;
        const counterpart = itemFor(counterpartKey);
        return `<div class="path"><span class="badge badge-official">Official</span> ${escapeHtml(counterpart?.item_id || counterpartKey)}</div>`;
      });
      const pathRows = paths.slice(0, 8).map((path) => `<div class="path">${path.item_keys.map((itemKey) => `<span>${escapeHtml(itemFor(itemKey)?.item_id || itemKey)}</span>`).join(' → ')}</div>`);
      const rows = [...directRows, ...pathRows];
      visContainer.innerHTML = rows.length
        ? `<div class="stack">${rows.join('')}</div>`
        : '<p class="muted">No relationships to list.</p>';
    }
  };

  document.querySelector('#vis-tab-node').addEventListener('click', () => drawVis('node'));
  document.querySelector('#vis-tab-matrix').addEventListener('click', () => drawVis('matrix'));
  document.querySelector('#vis-tab-list').addEventListener('click', () => drawVis('list'));

  // Initial draw
  drawVis('node');

  document.querySelector('#item-heading').focus();
  scrollTo({ top: 0, behavior: 'smooth' });
}

function frameworkOptions(selected = '') {
  return dataset.frameworks.map((framework) => `<option value="${escapeHtml(framework.id)}" ${framework.id === selected ? 'selected' : ''}>${escapeHtml(framework.name)}</option>`).join('');
}

function parseSelectedItemKeys(value, frameworkId) {
  return [...new Set(String(value || '')
    .split(/[\s,]+/)
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => id.includes(':') ? id : `${frameworkId}:${id}`))];
}

async function renderMatrix(state) {
  try {
    await ensureDatasetWithLoading(() => renderMatrix(state));
  } catch {
    return;
  }
  const source = state.source || dataset.frameworks[0]?.id || '';
  const target = state.target || dataset.frameworks.find((item) => item.id !== source)?.id || '';
  const selectedIds = state.items || '';
  const selectedKeys = parseSelectedItemKeys(selectedIds, source);
  const request = {
    source_framework: source,
    target_framework: target,
    ...(selectedKeys.length ? { item_keys: selectedKeys } : {}),
  };

  // Matrix classifications mapping (Epic 5.1)
  const matrixClassInfo = (classification) => {
    if (classification === 'direct') return { label: 'Official match', action: 'Review and cite the source.', badgeClass: 'badge-official' };
    if (classification === 'calculated') return { label: 'Possible connection', action: 'Review each step.', badgeClass: 'badge-connection' };
    return { label: 'No known match', action: 'Assess separately.', badgeClass: 'badge-no-match' };
  };

  const matrix = source && target ? runtime.buildMappingMatrix(request) : null;
  const estimatedRows = selectedKeys.length || dataset.items.filter(item => item.framework_id === source).length;

  app.innerHTML = `
    <section class="panel">
      <p class="eyebrow">Map frameworks</p><h2>${escapeHtml(pageIntros.matrix.title)}</h2>
      ${renderNoviceIntro('matrix')}
      <form id="matrix-form" class="controls">
        <div class="field"><label for="matrix-source">Source framework</label><select id="matrix-source">${frameworkOptions(source)}</select></div>
        <div class="field"><label for="matrix-target">Target framework</label><select id="matrix-target">${frameworkOptions(target)}</select></div>
        <div class="field matrix-items-field">
          <label for="matrix-items">Optional source item IDs</label>
          <textarea id="matrix-items" placeholder="AC-2, AC-3, AC-6">${escapeHtml(selectedIds)}</textarea>
          <span class="muted" id="matrix-estimated-rows">Paste IDs separated by commas, spaces, or lines. Estimated matrix rows: ${estimatedRows}. Leave blank for the whole source framework.</span>
        </div>
        <button class="primary" type="submit">Build matrix</button>
        <button class="secondary" id="export-matrix" type="button">Export CSV</button>
      </form>

      ${matrix ? `
      <p class="muted" style="margin-top: 1.5rem;">${matrix.summary.total} source items · ${matrix.summary.direct} official matches · ${matrix.summary.calculated} possible connections · ${matrix.summary.unmapped} no known matches</p>
      ${matrix.rows.length > 200 ? '<p class="notice">Showing the first 200 rows. CSV export includes the complete matrix.</p>' : ''}
      <table class="matrix-table">
        <thead>
          <tr>
            <th>Source ID</th>
            <th>Match Type</th>
            <th>Next Action</th>
            <th>Mapped Destination or Path</th>
          </tr>
        </thead>
        <tbody>
          ${matrix.rows.slice(0, 200).map((row) => {
            const info = matrixClassInfo(row.classification);
            const destinations = [
              ...row.direct.map((item) => `${item.matrix_target_key.split(':')[1] || item.matrix_target_key} (${item.matrix_direction || 'outgoing'})`),
              ...row.paths.map((item) => item.item_keys.map(k => k.split(':')[1] || k).join(' > '))
            ].join(' | ') || 'No sourced mapping known';
            return `
              <tr>
                <td>${escapeHtml(row.source_key.split(':')[1] || row.source_key)}</td>
                <td><span class="badge ${info.badgeClass}">${escapeHtml(info.label)}</span></td>
                <td><small>${escapeHtml(info.action)}</small></td>
                <td>${escapeHtml(destinations)}</td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>` : ''}
    </section>`;

  // Dynamic row estimation (Epic 5.2)
  const itemsTextarea = document.querySelector('#matrix-items');
  const sourceSelect = document.querySelector('#matrix-source');
  const estimateLabel = document.querySelector('#matrix-estimated-rows');
  const updateEstimate = () => {
    const src = sourceSelect.value;
    const ids = parseSelectedItemKeys(itemsTextarea.value, src);
    const count = ids.length || dataset.items.filter(item => item.framework_id === src).length;
    estimateLabel.textContent = `Paste IDs separated by commas, spaces, or lines. Estimated matrix rows: ${count}. Leave blank for the whole source framework.`;
  };
  itemsTextarea.addEventListener('input', updateEstimate);
  sourceSelect.addEventListener('change', updateEstimate);

  document.querySelector('#matrix-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const itemsVal = document.querySelector('#matrix-items').value.trim();
    const src = document.querySelector('#matrix-source').value;
    const tgt = document.querySelector('#matrix-target').value;

    // Epic 5.2 Confirmation for whole framework
    if (!itemsVal) {
      const confirmWhole = confirm("You are about to compare the entire framework. This may generate a large table. Do you want to continue?");
      if (!confirmWhole) return;
    }

    setView('matrix', {
      source: src,
      target: tgt,
      items: itemsVal,
    });
  });

  const exportBtn = document.querySelector('#export-matrix');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const content = runtime.buildMatrixCsv(matrix);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([content], { type: 'text/csv' }));
      link.download = `GovFrame-${source}-to-${target}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    });
  }
}

async function renderBrowse(state) {
  try {
    await ensureDatasetWithLoading(() => renderBrowse(state));
  } catch {
    return;
  }
  const selected = state.framework || '';
  const frameworkItems = selected ? dataset.items.filter((item) => item.framework_id === selected) : [];

  // Epic 6.2 Framework Sorting and Filtering
  let frameworksToRender = [...dataset.coverage.frameworks];

  if (browseFilter === 'full') {
    frameworksToRender = frameworksToRender.filter(cov => {
      const fw = dataset.frameworks.find(item => item.id === cov.framework_id);
      return fw && fw.status !== 'limited-public-scope';
    });
  } else if (browseFilter === 'partial') {
    frameworksToRender = frameworksToRender.filter(cov => {
      const fw = dataset.frameworks.find(item => item.id === cov.framework_id);
      return fw && fw.status === 'limited-public-scope';
    });
  }

  frameworksToRender.sort((a, b) => {
    const fwA = dataset.frameworks.find(item => item.id === a.framework_id);
    const fwB = dataset.frameworks.find(item => item.id === b.framework_id);
    if (browseSort === 'coverage') {
      return b.mapped_percent - a.mapped_percent;
    }
    if (browseSort === 'date') {
      const dateA = frameworkDates[a.framework_id] || '2026-01-01';
      const dateB = frameworkDates[b.framework_id] || '2026-01-01';
      return dateB.localeCompare(dateA);
    }
    return (fwA.name || '').localeCompare(fwB.name || '');
  });

  app.innerHTML = `
    <section class="panel">
      <p class="eyebrow">Browse</p>
      <h2>${escapeHtml(pageIntros.browse.title)}</h2>
      ${renderNoviceIntro('browse')}

      <!-- Epic 6.2 Sorting & Filtering Bar -->
      <div class="results-filters-bar" style="margin-bottom: 1.5rem;">
        <span class="filter-label">Sort by:</span>
        <select id="browse-sort">
          <option value="alpha" ${browseSort === 'alpha' ? 'selected' : ''}>Alphabetical</option>
          <option value="coverage" ${browseSort === 'coverage' ? 'selected' : ''}>Mapping coverage</option>
          <option value="date" ${browseSort === 'date' ? 'selected' : ''}>Date added</option>
        </select>
        <span class="filter-label" style="margin-left: 1rem;">Filter coverage:</span>
        <select id="browse-filter">
          <option value="all" ${browseFilter === 'all' ? 'selected' : ''}>All frameworks</option>
          <option value="full" ${browseFilter === 'full' ? 'selected' : ''}>Full catalogs only</option>
          <option value="partial" ${browseFilter === 'partial' ? 'selected' : ''}>Partial public scope only</option>
        </select>
      </div>

      <div class="grid">
        ${frameworksToRender.map((coverage) => {
          const framework = dataset.frameworks.find((item) => item.id === coverage.framework_id);
          const isLimited = framework.status === 'limited-public-scope';

          // Epic 6.1 Explain Framework Coverage Labels
          const coverageLabelsHtml = `
            <div class="badge-row" style="margin-bottom: 0.5rem;">
              <span class="badge badge-official">Catalog available</span>
              ${coverage.mapped_items > 0 ? '<span class="badge badge-supporting">Mappings available</span>' : ''}
              ${isLimited ? '<span class="badge badge-research">Partial public data</span>' : ''}
            </div>
          `;

          return `
            <article class="framework-card">
              ${coverageLabelsHtml}
              <h3>${escapeHtml(framework.name)}</h3>
              <p>${coverage.catalog_items} catalog items · ${coverage.mapped_items} mapped</p>
              <div class="coverage-meter" aria-label="${coverage.mapped_percent}% mapped"><span style="width:${coverage.mapped_percent}%"></span></div>
              <button class="secondary" data-browse-framework="${escapeHtml(framework.id)}" type="button" style="margin-top: 1rem;">Browse catalog</button>
            </article>`;
        }).join('')}
      </div>

      ${selected ? `
      <section class="results">
        <h3>${escapeHtml(frameworkName(selected))}</h3>
        ${frameworkItems.slice(0, 200).map((item) => `
          <article class="item-card">
            <button data-open-item="${escapeHtml(item.key)}">
              <h4 class="item-id">${escapeHtml(item.item_id)}</h4>
              <strong>${escapeHtml(item.title)}</strong>
            </button>
          </article>`).join('')}
      </section>` : ''}
    </section>`;

  document.querySelector('#browse-sort').addEventListener('change', (e) => {
    browseSort = e.target.value;
    renderBrowse(state);
  });

  document.querySelector('#browse-filter').addEventListener('change', (e) => {
    browseFilter = e.target.value;
    renderBrowse(state);
  });

  document.querySelectorAll('[data-browse-framework]').forEach((button) => button.addEventListener('click', () => setView('browse', { framework: button.dataset.browseFramework })));
  document.querySelectorAll('[data-open-item]').forEach((button) => button.addEventListener('click', () => renderItem(button.dataset.openItem)));
}

function renderSources() {
  // Epic 4.3 plain-language source badges legend
  app.innerHTML = `
    <section class="panel">
      <p class="eyebrow">Sources and evidence health</p>
      <h2>${escapeHtml(pageIntros.sources.title)}</h2>
      ${renderNoviceIntro('sources')}

      <div class="learning-grid">
        <p><strong>Official</strong><br>Primary source.</p>
        <p><strong>Supporting</strong><br>Confirms or adds context.</p>
        <p><strong>Research lead</strong><br>Useful, but verify before use.</p>
      </div>

      <p class="muted">${dataset.coverage.mappings.published} published mappings · ${dataset.coverage.mappings.evidence_gaps} needs supporting source gaps · ${dataset.coverage.mappings.blocked} blocked candidates.</p>

      <div class="grid">
        ${dataset.coverage.sources.map((source) => {
          const badgeClass = source.tier === 'gold' ? 'badge-official' : source.tier === 'silver' ? 'badge-supporting' : 'badge-research';
          const tierLabel = sourceTierLabel(source.tier);
          return `
            <article class="framework-card">
              <span class="badge ${badgeClass}">${escapeHtml(tierLabel)}</span>
              <h3>${escapeHtml(source.name)}</h3>
              <p class="muted">${escapeHtml(source.issuer)} · ${escapeHtml(source.frameworks.join(', '))}</p>
              ${externalAnchor(source.artifact, sourceArtifactLabel(source))}
            </article>`;
        }).join('')}
      </div>
    </section>`;
}

function renderRetired(state) {
  app.innerHTML = `
    <section class="notice retired">
      <p class="eyebrow">Retired identifier type</p>
      <h2>${escapeHtml(state.query)} is outside GovFrame's framework-mapping scope.</h2>
      <p>GovFrame now focuses on framework requirements, controls, Control Correlation Identifiers, and evidence-backed mappings.</p>
      <button class="primary" type="button" id="retired-search">Search frameworks</button>
    </section>`;
  document.querySelector('#retired-search').addEventListener('click', () => setView('search'));
}

async function render(state) {
  app.setAttribute('aria-busy', 'false');
  currentActiveView = state.view || 'search';
  currentActiveState = {};
  viewState = { ...viewState, ...state };
  navButtons.forEach((button) => button.toggleAttribute('aria-current', button.dataset.view === state.view));

  if (state.view === 'matrix') await renderMatrix(state);
  else if (state.view === 'browse') await renderBrowse(state);
  else if (state.view === 'sources') renderSources();
  else if (state.view === 'retired') renderRetired(state);
  else await renderSearch(state);

  renderWalkthroughBubble();
}

async function init() {
  const response = await fetch('./data/generated/bootstrap.json');
  if (!response.ok) throw new Error('Framework registry is unavailable.');
  dataset = await response.json();

  // Bind Header Controls
  const toggleModeBtn = document.querySelector('#btn-toggle-mode');
  const toggleGlossaryBtn = document.querySelector('#btn-toggle-glossary');

  if (toggleModeBtn) {
    toggleModeBtn.addEventListener('click', () => {
      void setNoviceMode(!noviceMode);
    });
  }

  if (toggleGlossaryBtn) {
    toggleGlossaryBtn.addEventListener('click', () => {
      toggleGlossaryDrawer();
    });
  }

  navButtons.forEach((button) => button.addEventListener('click', () => void setView(button.dataset.view)));
  addEventListener('popstate', () => {
    const state = parseViewState(location.search);
    viewState = { ...viewState, ...state };
    void render(state);
  });

  const state = parseViewState(location.search);
  viewState = { ...viewState, ...state };

  // Parse mode preference from URL (Epic 1.1)
  if (state.mode === 'expert') {
    noviceMode = false;
  } else if (state.mode === 'novice') {
    noviceMode = true;
  } else {
    // Prompt first time user
    showOnboardingOverlay();
  }

  // Sync toggle state button visual
  if (toggleModeBtn) {
    toggleModeBtn.textContent = `Mode: ${noviceMode ? 'Novice' : 'Expert'}`;
    toggleModeBtn.classList.toggle('active-novice', noviceMode);
  }

  await render(state);

  if (state.view === 'search' && state.query) {
    await openDeepLinkedItem(state);
  }
}

async function openDeepLinkedItem(state) {
  try {
    await ensureDataset();
  } catch (error) {
    renderCatalogError(error, () => openDeepLinkedItem(state));
    return;
  }
  const exact = runtime.searchFrameworkItems(state.query, {
    framework_id: state.filter || undefined,
  }).find((item) => item.item_id.toLowerCase() === state.query.toLowerCase());
  if (exact) await renderItem(exact.key);
}

init().catch((error) => {
  app.setAttribute('aria-busy', 'false');
  app.innerHTML = `<section class="notice"><h2>GovFrame could not load the validated catalog.</h2><p>${escapeHtml(error.message)}</p></section>`;
});
