export const RELATIONSHIP_TYPES = new Set([
  'equivalent_to',
  'maps_to',
  'implements',
  'supports',
  'includes',
  'inherits',
  'related_to',
]);

export const RELATIONSHIP_COMPOSITION_RULES = {
  maps_to: new Set(['maps_to', 'implements', 'supports', 'includes', 'inherits']),
  implements: new Set(['maps_to', 'implements', 'supports']),
  supports: new Set(['maps_to', 'supports']),
  includes: new Set(['maps_to', 'includes']),
  inherits: new Set(['maps_to', 'inherits']),
  equivalent_to: new Set(['equivalent_to']),
};

const PATH_RELATIONSHIP_TYPES = new Set([...RELATIONSHIP_TYPES].filter((type) => type !== 'related_to'));
const TIER_ORDER = ['gold', 'silver', 'bronze'];

function authorityTypeForEvidence(entry) {
  return entry?.authority_type || null;
}

function isMappingAuthorityEvidence(entry) {
  const type = authorityTypeForEvidence(entry);
  return entry?.tier === 'gold' && (type === 'owner_authority_mapping' || type === 'mapping_authority');
}

function isCatalogAuthorityEvidence(entry) {
  return entry?.tier === 'gold' && authorityTypeForEvidence(entry) === 'catalog_authority';
}

function collectWarnings(evidence = []) {
  return evidence
    .filter((entry) => entry.tier === 'silver' && entry.agreement === 'conflicts')
    .map((entry) => ({
      code: 'conflicting_silver_evidence',
      source_id: entry.source_id,
      message: `Silver source ${entry.source_id} conflicts with other evidence.`,
    }));
}

export function buildEvidenceEntry(assertion) {
  const warnings = assertion.warnings || collectWarnings(assertion.evidence);
  let confidence = 'blocked';
  if (assertion.status === 'published') {
    confidence = warnings.length ? 'derived' : 'direct';
  } else if (assertion.status === 'candidate') {
    confidence = 'candidate';
  }

  return {
    assertion_id: assertion.id,
    status: assertion.status || 'blocked',
    block_reason: assertion.block_reason || null,
    candidate_reason: assertion.candidate_reason || null,
    confidence,
    gaps: assertion.evidence_gaps || [],
    warnings,
    sources: (assertion.evidence || []).map((entry) => ({
      ...entry,
      authority_type: authorityTypeForEvidence(entry),
    })),
  };
}

export function reconcileAssertions(assertions) {
  const published = [];
  const blocked = [];
  const candidates = [];

  for (const assertion of assertions) {
    if (!RELATIONSHIP_TYPES.has(assertion.relationship_type)) {
      blocked.push({ ...assertion, status: 'blocked', block_reason: 'unsupported_relationship_type' });
      continue;
    }

    const evidence = assertion.evidence || [];
    const goldMapping = evidence.filter((entry) => isMappingAuthorityEvidence(entry) && entry.agreement !== 'conflicts');
    const goldCatalogOnly = evidence.filter((entry) => isCatalogAuthorityEvidence(entry));
    const goldConflicts = evidence.filter((entry) => entry.tier === 'gold' && entry.agreement === 'conflicts');
    const bronzeOnly = evidence.length > 0 && evidence.every((entry) => entry.tier === 'bronze');
    const warnings = collectWarnings(evidence);

    if (bronzeOnly) {
      candidates.push({
        ...assertion,
        status: 'candidate',
        candidate_reason: 'bronze_only_evidence',
        warnings,
      });
      continue;
    }

    if (goldConflicts.some((entry) => isMappingAuthorityEvidence(entry) || isCatalogAuthorityEvidence(entry))) {
      blocked.push({ ...assertion, status: 'blocked', block_reason: 'conflicting_gold_evidence', warnings });
      continue;
    }

    if (goldCatalogOnly.length && !goldMapping.length) {
      blocked.push({ ...assertion, status: 'blocked', block_reason: 'catalog_source_used_for_crosswalk', warnings });
      continue;
    }

    if (!goldMapping.length) {
      blocked.push({ ...assertion, status: 'blocked', block_reason: 'missing_gold_evidence', warnings });
      continue;
    }

    const presentTiers = new Set(evidence.map((entry) => entry.tier));
    published.push({
      ...assertion,
      status: 'published',
      evidence_gaps: TIER_ORDER.filter((tier) => !presentTiers.has(tier)),
      warnings,
      conflicts: evidence.filter((entry) => entry.agreement === 'conflicts'),
    });
  }

  return { published, blocked, candidates };
}

function canComposeRelationship(fromType, toType) {
  return RELATIONSHIP_COMPOSITION_RULES[fromType]?.has(toType) ?? false;
}

function hopEvidenceSummary(edge) {
  const primary = (edge.evidence || [])[0];
  return {
    assertion_id: edge.id,
    source_key: edge.source_key,
    target_key: edge.target_key,
    relationship_type: edge.relationship_type,
    direction: edge.direction || 'forward',
    source_id: primary?.source_id || null,
    locator: primary?.locator || null,
    tier: primary?.tier || null,
    authority_type: primary?.authority_type || null,
    evidence_gaps: edge.evidence_gaps || [],
  };
}

export function buildCalculatedPaths(mappings, options = {}) {
  const maxHops = Math.min(Math.max(options.maxHops || 3, 2), 3);
  const forwardGraph = new Map();
  const reverseGraph = new Map();

  for (const mapping of mappings) {
    if (!PATH_RELATIONSHIP_TYPES.has(mapping.relationship_type)) continue;

    if (!forwardGraph.has(mapping.source_key)) forwardGraph.set(mapping.source_key, []);
    forwardGraph.get(mapping.source_key).push({
      edge: mapping,
      target: mapping.target_key,
      direction: 'forward',
    });

    if (!reverseGraph.has(mapping.target_key)) reverseGraph.set(mapping.target_key, []);
    reverseGraph.get(mapping.target_key).push({
      edge: mapping,
      target: mapping.source_key,
      direction: 'reverse',
    });
  }

  const results = [];
  const seen = new Set();

  // Walk forward
  const walkForward = (startKey, currentKey, hops, itemKeys) => {
    if (hops.length >= maxHops) return;
    for (const step of forwardGraph.get(currentKey) || []) {
      if (itemKeys.includes(step.target)) continue;
      const previous = hops[hops.length - 1];
      if (previous && !canComposeRelationship(previous.relationship_type, step.edge.relationship_type)) continue;

      const nextHops = [...hops, { ...step.edge, direction: 'forward' }];
      const nextItems = [...itemKeys, step.target];

      if (nextHops.length >= 2) {
        const signature = `${startKey}|${step.target}|${nextHops.map((item) => item.id).join('>')}`;
        if (!seen.has(signature)) {
          seen.add(signature);
          
          let confidence = 'derived';
          if (nextHops.some((h) => h.status === 'blocked')) {
            confidence = 'blocked';
          } else if (nextHops.some((h) => h.status === 'candidate')) {
            confidence = 'candidate';
          }

          results.push({
            id: `path:${signature}`,
            source_key: startKey,
            target_key: step.target,
            item_keys: nextItems,
            confidence,
            hops: nextHops.map((item) => hopEvidenceSummary(item)),
            evidence_gaps: [...new Set(nextHops.flatMap((item) => item.evidence_gaps || []))],
          });
        }
      }
      walkForward(startKey, step.target, nextHops, nextItems);
    }
  };

  // Walk reverse
  const walkReverse = (startKey, currentKey, hops, itemKeys) => {
    if (hops.length >= maxHops) return;
    for (const step of reverseGraph.get(currentKey) || []) {
      if (itemKeys.includes(step.target)) continue;
      const previous = hops[hops.length - 1];
      if (previous && !canComposeRelationship(step.edge.relationship_type, previous.relationship_type)) continue;

      const nextHops = [...hops, { ...step.edge, direction: 'reverse' }];
      const nextItems = [...itemKeys, step.target];

      if (nextHops.length >= 2) {
        const signature = `${startKey}|${step.target}|${nextHops.map((item) => item.id).join('>')}`;
        if (!seen.has(signature)) {
          seen.add(signature);

          let confidence = 'derived';
          if (nextHops.some((h) => h.status === 'blocked')) {
            confidence = 'blocked';
          } else if (nextHops.some((h) => h.status === 'candidate')) {
            confidence = 'candidate';
          }

          results.push({
            id: `path:${signature}`,
            source_key: startKey,
            target_key: step.target,
            item_keys: nextItems,
            confidence,
            hops: nextHops.map((item) => hopEvidenceSummary(item)),
            evidence_gaps: [...new Set(nextHops.flatMap((item) => item.evidence_gaps || []))],
          });
        }
      }
      walkReverse(startKey, step.target, nextHops, nextItems);
    }
  };

  const allKeys = new Set([...forwardGraph.keys(), ...reverseGraph.keys()]);
  for (const startKey of allKeys) {
    walkForward(startKey, startKey, [], [startKey]);
    walkReverse(startKey, startKey, [], [startKey]);
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

function hopEvidenceSources(path) {
  return (path.hops || [])
    .map((hop) => [hop.source_id, hop.locator].filter(Boolean).join('@'))
    .join(' > ');
}

export function buildMatrixCsv(matrix) {
  const headers = [
    'Source framework',
    'Source ID',
    'Target framework',
    'Target ID',
    'Match type',
    'Next action',
    'Evidence source',
    'Source type',
    'Notes',
  ];
  const sourceFw = matrix.request?.source_framework || '';
  const targetFw = matrix.request?.target_framework || '';

  const rows = matrix.rows.map((row) => {
    const sourceId = row.source_key.split(':')[1] || row.source_key;
    let matchType = 'No known match';
    let nextAction = 'Assess separately.';
    let targetId = '';
    let evidenceSource = '';
    let sourceType = '';
    let notes = '';

    if (row.classification === 'direct') {
      matchType = 'Official match';
      nextAction = 'Review and cite the source.';
      targetId = [...new Set(row.direct.map((item) => {
        const key = item.matrix_target_key || item.target_key;
        return `${key.split(':')[1] || key} (${item.matrix_direction || 'outgoing'})`;
      }))].join('|');
      evidenceSource = [...new Set(row.direct.flatMap((item) =>
        (item.evidence || []).map((entry) => `${entry.source_id}${entry.locator ? `@${entry.locator}` : ''}`),
      ))].filter(Boolean).join('|') || 'NIST references';
      sourceType = 'Official';
      const gaps = [...new Set(row.direct.flatMap((item) => item.evidence_gaps || []))];
      notes = gaps.length ? `Needs supporting source: missing ${gaps.join(', ')}` : 'Verified';
    } else if (row.classification === 'calculated') {
      matchType = 'Possible connection';
      nextAction = 'Review each step.';
      targetId = [...new Set(row.paths.map((item) => item.target_key.split(':')[1] || item.target_key))].join('|');
      evidenceSource = row.paths.map((item) => hopEvidenceSources(item)).join('|');
      sourceType = 'Research lead';
      const gaps = [...new Set(row.paths.flatMap((item) => item.evidence_gaps || []))];
      notes = `Calculated path. ${gaps.length ? `Gaps: missing ${gaps.join(', ')}` : 'Corroborated'}`;
    }

    return [
      sourceFw,
      sourceId,
      targetFw,
      targetId,
      matchType,
      nextAction,
      evidenceSource,
      sourceType,
      notes,
    ].map(csvCell).join(',');
  });
  return [headers.map(csvCell).join(','), ...rows].join('\n');
}
