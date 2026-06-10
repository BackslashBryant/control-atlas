import {
  buildMappingMatrix,
  buildMatrixCsv,
} from '../scripts/lib/framework-engine.mjs';

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

export function createFrameworkRuntime(dataset) {
  const itemByKey = new Map(dataset.items.map((item) => [item.key, item]));
  const mappings = dataset.mappings || [];
  const paths = dataset.paths || [];

  return {
    searchFrameworkItems(query, filters = {}) {
      const needle = normalize(query);
      if (!needle) return [];
      return dataset.items
        .filter((item) => !filters.framework_id || item.framework_id === filters.framework_id)
        .map((item) => {
          const id = normalize(item.item_id);
          const title = normalize(item.title);
          const text = normalize(item.text);
          const score = id === needle ? 0 : id.startsWith(needle) ? 1 : title.includes(needle) ? 2 : text.includes(needle) ? 3 : 99;
          return { item, score };
        })
        .filter((entry) => entry.score < 99)
        .sort((a, b) => a.score - b.score || a.item.item_id.localeCompare(b.item.item_id))
        .slice(0, 100)
        .map((entry) => entry.item);
    },
    getFrameworkItem(frameworkId, itemId) {
      return itemByKey.get(`${frameworkId}:${itemId}`) || null;
    },
    getDirectMappings(itemKey) {
      return mappings.filter((mapping) => mapping.source_key === itemKey || mapping.target_key === itemKey);
    },
    getCalculatedPaths(itemKey, options = {}) {
      return paths.filter((path) => path.source_key === itemKey && (!options.target_framework
        || itemByKey.get(path.target_key)?.framework_id === options.target_framework));
    },
    buildMappingMatrix(request) {
      return buildMappingMatrix(request, dataset);
    },
    buildMatrixCsv(requestOrMatrix) {
      return buildMatrixCsv(requestOrMatrix.rows ? requestOrMatrix : buildMappingMatrix(requestOrMatrix, dataset));
    },
    getEvidenceSummary(assertionId) {
      return dataset.evidence?.[assertionId] || null;
    },
  };
}

export function parseViewState(searchParams) {
  const params = new URLSearchParams(searchParams);
  const query = params.get('q') || '';
  if (/^[A-Z]{3}-\d{4}-\d+$/i.test(query) || /^\d{4,}$/.test(query)) {
    return { view: 'retired', query, retired_type: 'retired identifier' };
  }
  const view = params.get('view') || 'search';
  const mode = params.get('mode');
  const base = mode ? { mode } : {};
  if (view === 'matrix') return {
    ...base,
    view,
    source: params.get('source') || '',
    target: params.get('target') || '',
    items: params.get('items') || '',
  };
  if (view === 'browse') return { ...base, view, framework: params.get('framework') || '' };
  if (view === 'sources') return { ...base, view };
  return { ...base, view: 'search', query, filter: params.get('filter') || '' };
}

export function serializeViewState(state) {
  const params = new URLSearchParams();
  if (state.view && state.view !== 'search') params.set('view', state.view);
  if (state.query) params.set('q', state.query);
  if (state.filter) params.set('filter', state.filter);
  if (state.source) params.set('source', state.source);
  if (state.target) params.set('target', state.target);
  if (state.items) params.set('items', state.items);
  if (state.framework) params.set('framework', state.framework);
  if (state.mode) params.set('mode', state.mode);
  const value = params.toString();
  return value ? `?${value}` : '';
}
