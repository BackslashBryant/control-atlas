export const RELATIONSHIP_TYPES = new Set([
  'equivalent_to',
  'maps_to',
  'implements',
  'supports',
  'includes',
  'inherits',
  'related_to',
]);

const PATH_RELATIONSHIP_TYPES = new Set([...RELATIONSHIP_TYPES].filter((type) => type !== 'related_to'));
const TIER_ORDER = ['gold', 'silver', 'bronze'];

export function reconcileAssertions(assertions) {
  const published = [];
  const blocked = [];

  for (const assertion of assertions) {
    if (!RELATIONSHIP_TYPES.has(assertion.relationship_type)) {
      blocked.push({ ...assertion, block_reason: 'unsupported_relationship_type' });
      continue;
    }
    const gold = (assertion.evidence || []).filter((item) => item.tier === 'gold');
    if (!gold.length) {
      blocked.push({ ...assertion, block_reason: 'missing_gold_evidence' });
      continue;
    }
    if (gold.some((item) => item.agreement === 'conflicts')) {
      blocked.push({ ...assertion, block_reason: 'conflicting_gold_evidence' });
      continue;
    }
    const presentTiers = new Set((assertion.evidence || []).map((item) => item.tier));
    published.push({
      ...assertion,
      status: 'published',
      evidence_gaps: TIER_ORDER.filter((tier) => !presentTiers.has(tier)),
      conflicts: (assertion.evidence || []).filter((item) => item.agreement === 'conflicts'),
    });
  }

  return { published, blocked };
}

export function buildCalculatedPaths(mappings, options = {}) {
  const maxHops = Math.min(Math.max(options.maxHops || 3, 2), 3);
  const graph = new Map();
  for (const mapping of mappings) {
    if (!PATH_RELATIONSHIP_TYPES.has(mapping.relationship_type)) continue;
    if (!graph.has(mapping.source_key)) graph.set(mapping.source_key, []);
    graph.get(mapping.source_key).push(mapping);
  }

  const results = [];
  const seen = new Set();
  for (const sourceKey of graph.keys()) {
    const walk = (currentKey, hops, itemKeys) => {
      if (hops.length >= maxHops) return;
      for (const edge of graph.get(currentKey) || []) {
        if (itemKeys.includes(edge.target_key)) continue;
        const nextHops = [...hops, edge];
        const nextItems = [...itemKeys, edge.target_key];
        if (nextHops.length >= 2) {
          const signature = `${sourceKey}|${edge.target_key}|${nextHops.map((item) => item.id).join('>')}`;
          if (!seen.has(signature)) {
            seen.add(signature);
            results.push({
              id: `path:${signature}`,
              source_key: sourceKey,
              target_key: edge.target_key,
              item_keys: nextItems,
              hops: nextHops.map((item) => ({
                assertion_id: item.id,
                source_key: item.source_key,
                target_key: item.target_key,
                relationship_type: item.relationship_type,
                evidence_gaps: item.evidence_gaps || [],
              })),
              evidence_gaps: [...new Set(nextHops.flatMap((item) => item.evidence_gaps || []))],
            });
          }
        }
        walk(edge.target_key, nextHops, nextItems);
      }
    };
    walk(sourceKey, [], [sourceKey]);
  }

  return results.sort((a, b) => a.hops.length - b.hops.length || a.target_key.localeCompare(b.target_key));
}

export function buildMappingMatrix(request, dataset) {
  const sourceItems = dataset.items.filter((item) =>
    item.framework_id === request.source_framework
    && (!request.item_keys?.length || request.item_keys.includes(item.key)));
  const targetFramework = request.target_framework;

  const rows = sourceItems.map((source) => {
    const direct = dataset.mappings.flatMap((mapping) => {
      const outgoing = mapping.source_key === source.key
        && dataset.items.some((item) => item.key === mapping.target_key && item.framework_id === targetFramework);
      const incoming = mapping.target_key === source.key
        && dataset.items.some((item) => item.key === mapping.source_key && item.framework_id === targetFramework);
      if (!outgoing && !incoming) return [];
      return [{
        ...mapping,
        matrix_target_key: outgoing ? mapping.target_key : mapping.source_key,
        matrix_direction: outgoing ? 'outgoing' : 'incoming',
      }];
    });
    const calculated = dataset.paths.filter((path) =>
      path.source_key === source.key
      && dataset.items.some((item) => item.key === path.target_key && item.framework_id === targetFramework));
    if (direct.length) return { source_key: source.key, classification: 'direct', direct, paths: [] };
    if (calculated.length) return { source_key: source.key, classification: 'calculated', direct: [], paths: calculated };
    return { source_key: source.key, classification: 'unmapped', direct: [], paths: [] };
  });

  return {
    request,
    generated_at: new Date().toISOString(),
    rows,
    summary: {
      total: rows.length,
      direct: rows.filter((row) => row.classification === 'direct').length,
      calculated: rows.filter((row) => row.classification === 'calculated').length,
      unmapped: rows.filter((row) => row.classification === 'unmapped').length,
    },
  };
}

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export function buildMatrixCsv(matrix) {
  const headers = [
    'source_key',
    'classification',
    'target_keys',
    'relationship_types',
    'assertion_directions',
    'path',
    'evidence_gaps',
  ];
  const rows = matrix.rows.map((row) => {
    const directTargets = row.direct.map((item) => item.matrix_target_key || item.target_key);
    const pathTargets = row.paths.map((item) => item.target_key);
    const relationshipTypes = [
      ...row.direct.map((item) => item.relationship_type),
      ...row.paths.flatMap((path) => path.hops.map((hop) => hop.relationship_type)),
    ];
    const evidenceGaps = [
      ...row.direct.flatMap((item) => item.evidence_gaps || []),
      ...row.paths.flatMap((item) => item.evidence_gaps || []),
    ];
    return [
      row.source_key,
      row.classification,
      [...new Set([...directTargets, ...pathTargets])].join('|'),
      [...new Set(relationshipTypes)].join('|'),
      [...new Set(row.direct.map((item) => item.matrix_direction || 'outgoing'))].join('|'),
      row.paths.map((item) => item.item_keys.join(' > ')).join('|'),
      [...new Set(evidenceGaps)].join('|'),
    ].map(csvCell).join(',');
  });
  return [headers.map(csvCell).join(','), ...rows].join('\n');
}
