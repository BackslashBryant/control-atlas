function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function createFederalGraphRuntime(dataset) {
  const nodeById = new Map(dataset.nodes.map((node) => [node.id, node]));
  const sourceById = new Map(dataset.sources.map((source) => [source.id, source]));
  const evidenceById = new Map(dataset.evidence.map((entry) => [entry.id, entry]));
  const edgeById = new Map(dataset.edges.map((edge) => [edge.id, edge]));
  const catalogs = [...new Set(dataset.nodes.map((node) => node.metadata?.catalog_id).filter(Boolean))]
    .sort()
    .map((id) => ({
      id,
      name: id,
      node_count: dataset.nodes.filter((node) => node.metadata?.catalog_id === id).length,
      relationship_count: dataset.edges.filter((edge) =>
        nodeById.get(edge.source_node_id)?.metadata?.catalog_id === id
        || nodeById.get(edge.target_node_id)?.metadata?.catalog_id === id).length,
    }));

  return {
    searchNodes(query, filters = {}) {
      const needle = normalize(query);
      if (!needle) return [];
      return dataset.nodes
        .filter((node) => !filters.catalog_id || node.metadata?.catalog_id === filters.catalog_id)
        .filter((node) => !filters.node_type || node.node_type === filters.node_type)
        .map((node) => {
          const itemId = normalize(node.metadata?.item_id);
          const label = normalize(node.label);
          const description = normalize(node.metadata?.description);
          const score = itemId === needle ? 0 : itemId.startsWith(needle) ? 1 : label.includes(needle) ? 2 : description.includes(needle) ? 3 : 99;
          return { node, score };
        })
        .filter((entry) => entry.score < 99)
        .sort((a, b) => a.score - b.score || a.node.id.localeCompare(b.node.id))
        .slice(0, 100)
        .map((entry) => entry.node);
    },
    getNode(id) {
      return nodeById.get(id) || null;
    },
    getNodes(filters = {}) {
      return dataset.nodes.filter((node) =>
        (!filters.catalog_id || node.metadata?.catalog_id === filters.catalog_id)
        && (!filters.node_type || node.node_type === filters.node_type));
    },
    getEdgesForNode(id, options = {}) {
      return dataset.edges.filter((edge) =>
        (edge.source_node_id === id || edge.target_node_id === id)
        && (!options.publication_status || edge.publication_status === options.publication_status));
    },
    getEvidenceForEdge(edgeId) {
      const edge = edgeById.get(edgeId);
      return (edge?.evidence_ids || []).map((id) => {
        const entry = evidenceById.get(id);
        return entry ? { ...entry, source: sourceById.get(entry.source_id) || null } : null;
      }).filter(Boolean);
    },
    getSources() {
      return dataset.sources;
    },
    getGraphHealth() {
      return dataset.findings;
    },
    getCatalogs() {
      return catalogs;
    },
    buildRelationshipMatrix(request) {
      const sourceNodes = dataset.nodes.filter((node) =>
        node.metadata?.catalog_id === request.source_catalog
        && (!request.node_ids?.length || request.node_ids.includes(node.id)));
      const rows = sourceNodes.map((node) => {
        const edges = dataset.edges.filter((edge) => {
          const counterpartId = edge.source_node_id === node.id
            ? edge.target_node_id
            : edge.target_node_id === node.id
              ? edge.source_node_id
              : null;
          return counterpartId && nodeById.get(counterpartId)?.metadata?.catalog_id === request.target_catalog;
        });
        return {
        source_node_id: node.id,
        classification: edges.some((edge) => edge.publication_status === 'published')
          ? 'published'
          : edges.some((edge) => edge.publication_status === 'candidate')
              ? 'candidate'
              : 'unmapped',
          edges,
        };
      });
      return {
        request,
        rows,
        summary: {
          total: rows.length,
          published: rows.filter((row) => row.classification === 'published').length,
          candidate: rows.filter((row) => row.classification === 'candidate').length,
          unmapped: rows.filter((row) => row.classification === 'unmapped').length,
        },
      };
    },
    buildRelationshipCsv(matrix) {
      const rows = [['Source ID', 'Relationship status', 'Target IDs', 'Evidence IDs']];
      for (const row of matrix.rows) {
        rows.push([
          nodeById.get(row.source_node_id)?.metadata?.item_id || row.source_node_id,
          row.classification,
          row.edges.map((edge) => {
            const counterpartId = edge.source_node_id === row.source_node_id ? edge.target_node_id : edge.source_node_id;
            return nodeById.get(counterpartId)?.metadata?.item_id || counterpartId;
          }).join('|'),
          row.edges.flatMap((edge) => edge.evidence_ids || []).join('|'),
        ]);
      }
      return rows.map((row) => row.map(csvCell).join(',')).join('\n');
    },
    getFederalContext(nodeId) {
      const node = nodeById.get(nodeId);
      if (!node) {
        return {
          baselineMembership: [],
          categorizationContext: [],
          minimumSecurityRequirements: [],
          rmfLifecycle: [],
          assessmentContext: [],
          fedrampBaselineContext: [],
          programRequirementContext: [],
          cmmcProgramContext: [],
          cuiPolicyContext: [],
        };
      }

      const directEdges = dataset.edges.filter((edge) =>
        edge.publication_status === 'published'
        && (edge.source_node_id === nodeId || edge.target_node_id === nodeId));
      const counterpartFor = (edge, currentId) => nodeById.get(edge.source_node_id === currentId ? edge.target_node_id : edge.source_node_id) || null;

      const baselineMembership = uniqueBy(directEdges
        .filter((edge) => edge.relationship_type === 'includes')
        .map((membershipEdge) => ({
          baselineNode: counterpartFor(membershipEdge, nodeId),
          membershipEdge,
        }))
        .filter((entry) => entry.baselineNode?.node_type === 'baseline' && entry.baselineNode?.metadata?.catalog_id === 'nist-800-53b'), (entry) => entry.baselineNode.id);

      const fedrampBaselineContext = uniqueBy(directEdges
        .filter((edge) => edge.relationship_type === 'includes')
        .map((membershipEdge) => ({
          baselineNode: counterpartFor(membershipEdge, nodeId),
          membershipEdge,
        }))
        .filter((entry) => entry.baselineNode?.node_type === 'baseline' && entry.baselineNode?.metadata?.catalog_id === 'fedramp-rev5'), (entry) => entry.baselineNode.id);

      const familyMembership = uniqueBy(directEdges
        .filter((edge) => edge.relationship_type === 'includes')
        .map((familyEdge) => ({
          familyNode: counterpartFor(familyEdge, nodeId),
          familyEdge,
        }))
        .filter((entry) => entry.familyNode?.node_type === 'family'), (entry) => entry.familyNode.id);

      const categorizationContext = uniqueBy(baselineMembership.flatMap((entry) =>
        dataset.edges
          .filter((edge) => edge.publication_status === 'published'
            && (edge.source_node_id === entry.baselineNode.id || edge.target_node_id === entry.baselineNode.id))
          .map((categoryEdge) => ({
            categoryNode: counterpartFor(categoryEdge, entry.baselineNode.id),
            baselineNode: entry.baselineNode,
            categoryEdge,
            membershipEdge: entry.membershipEdge,
          }))
          .filter((item) => item.categoryNode?.node_type === 'impact_category')), (entry) => `${entry.categoryNode.id}:${entry.baselineNode.id}`);

      const minimumSecurityRequirements = uniqueBy(familyMembership.flatMap((entry) =>
        dataset.edges
          .filter((edge) => edge.publication_status === 'published'
            && (edge.source_node_id === entry.familyNode.id || edge.target_node_id === entry.familyNode.id))
          .map((requirementEdge) => ({
            requirementNode: counterpartFor(requirementEdge, entry.familyNode.id),
            familyNode: entry.familyNode,
            requirementEdge,
            familyEdge: entry.familyEdge,
          }))
          .filter((item) => item.requirementNode?.metadata?.catalog_id === 'fips-200')), (entry) => `${entry.requirementNode.id}:${entry.familyNode.id}`);

      const rmfLifecycle = uniqueBy([...baselineMembership.flatMap((entry) =>
        dataset.edges
          .filter((edge) => edge.publication_status === 'published'
            && (edge.source_node_id === entry.baselineNode.id || edge.target_node_id === entry.baselineNode.id))
          .map((contextEdge) => ({
            stepNode: counterpartFor(contextEdge, entry.baselineNode.id),
            viaNode: entry.baselineNode,
            contextEdge,
            supportingEdge: entry.membershipEdge,
          }))
          .filter((item) => item.stepNode?.node_type === 'rmf_step')),
      ...familyMembership.flatMap((entry) =>
        dataset.edges
          .filter((edge) => edge.publication_status === 'published'
            && (edge.source_node_id === entry.familyNode.id || edge.target_node_id === entry.familyNode.id))
          .map((contextEdge) => ({
            stepNode: counterpartFor(contextEdge, entry.familyNode.id),
            viaNode: entry.familyNode,
            contextEdge,
            supportingEdge: entry.familyEdge,
          }))
          .filter((item) => item.stepNode?.node_type === 'rmf_step'))], (entry) => `${entry.stepNode.id}:${entry.viaNode.id}`);

      const assessmentContext = uniqueBy(directEdges
        .filter((edge) => edge.relationship_type === 'assesses')
        .map((assessmentEdge) => ({
          assessmentNode: counterpartFor(assessmentEdge, nodeId),
          assessmentEdge,
        }))
        .filter((entry) => entry.assessmentNode?.node_type === 'assessment_procedure'), (entry) => entry.assessmentNode.id);

      const programCatalogs = new Set(['nist-800-171-rev2', 'nist-800-171', 'nist-800-172']);
      const programRequirementContext = uniqueBy(
        programCatalogs.has(node.metadata?.catalog_id)
          ? directEdges
            .map((relationshipEdge) => ({
              relatedNode: counterpartFor(relationshipEdge, nodeId),
              relationshipEdge,
            }))
            .filter((entry) => entry.relatedNode?.metadata?.catalog_id === 'cmmc-2')
          : [],
        (entry) => entry.relatedNode.id,
      );

      const cmmcProgramContext = uniqueBy(
        node.metadata?.catalog_id === 'cmmc-2'
          ? directEdges
            .map((relationshipEdge) => ({
              relatedNode: counterpartFor(relationshipEdge, nodeId),
              relationshipEdge,
            }))
            .filter((entry) => programCatalogs.has(entry.relatedNode?.metadata?.catalog_id))
          : [],
        (entry) => entry.relatedNode.id,
      );

      const cuiPolicyContext = uniqueBy(
        node.metadata?.catalog_id === 'cui-policy'
          ? directEdges
            .map((relationshipEdge) => ({
              relatedNode: counterpartFor(relationshipEdge, nodeId),
              relationshipEdge,
            }))
            .filter((entry) => programCatalogs.has(entry.relatedNode?.metadata?.catalog_id))
          : programCatalogs.has(node.metadata?.catalog_id)
            ? directEdges
              .map((relationshipEdge) => ({
                relatedNode: counterpartFor(relationshipEdge, nodeId),
                relationshipEdge,
              }))
              .filter((entry) => entry.relatedNode?.metadata?.catalog_id === 'cui-policy')
            : [],
        (entry) => entry.relatedNode.id,
      );

      return {
        baselineMembership,
        categorizationContext,
        minimumSecurityRequirements,
        rmfLifecycle,
        assessmentContext,
        fedrampBaselineContext,
        programRequirementContext,
        cmmcProgramContext,
        cuiPolicyContext,
      };
    },
  };
}

export function getFederalContext(runtime, nodeId) {
  return runtime.getFederalContext(nodeId);
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
  if (view === 'patterns' || view === 'templates' || view === 'start-here') return { ...base, view };
  return { ...base, view: 'search', query, filter: params.get('filter') || '' };
}

export function normalizeViewState(view, state = {}) {
  const base = state.mode ? { mode: state.mode } : {};
  if (view === 'retired') return { ...base, view: 'retired', query: state.query || '' };
  if (view === 'matrix') return { ...base, view: 'matrix', source: state.source || '', target: state.target || '', items: state.items || '' };
  if (view === 'browse') return { ...base, view: 'browse', framework: state.framework || '' };
  if (view === 'sources') return { ...base, view: 'sources' };
  if (view === 'patterns' || view === 'templates' || view === 'start-here') return { ...base, view };
  return { ...base, view: 'search', query: state.query || '', filter: state.filter || '' };
}

export function serializeViewState(state) {
  const params = new URLSearchParams();
  const view = state.view || 'search';
  if (view === 'retired') {
    params.set('view', 'retired');
    if (state.query) params.set('q', state.query);
  } else if (view === 'matrix') {
    params.set('view', 'matrix');
    if (state.source) params.set('source', state.source);
    if (state.target) params.set('target', state.target);
    if (state.items) params.set('items', state.items);
  } else if (view === 'browse') {
    params.set('view', 'browse');
    if (state.framework) params.set('framework', state.framework);
  } else if (view === 'sources') {
    params.set('view', 'sources');
  } else if (view === 'patterns' || view === 'templates' || view === 'start-here') {
    params.set('view', view);
  } else if (state.query || state.filter) {
    params.set('view', 'search');
    if (state.query) params.set('q', state.query);
    if (state.filter) params.set('filter', state.filter);
  }
  if (state.mode) params.set('mode', state.mode);
  const value = params.toString();
  return value ? `?${value}` : '';
}
