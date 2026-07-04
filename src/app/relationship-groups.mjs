export function groupRelationships(edges, runtimeNodeLookupId, runtime) {
  const groups = {
    disa: { label: 'DISA CCIs', description: 'These CCIs map DISA implementation and assessment requirements back to this control.', items: [] },
    nistBaseline: { label: 'NIST baselines', description: 'Included in these published NIST baselines.', items: [] },
    fedrampBaseline: { label: 'FedRAMP baselines', description: 'Included in these FedRAMP baselines.', items: [] },
    assessment: { label: 'Assessment procedures', description: 'Assessment procedures related to this item.', items: [] },
    stig: { label: 'STIG / SRG references', description: 'Related STIG and SRG requirements.', items: [] },
    mitre: { label: 'MITRE references', description: 'Related MITRE ATT&CK or mitigations.', items: [] },
    enhancements: { label: 'Enhancements', description: 'Control enhancements that extend this control.', items: [] },
    baseControl: { label: 'Base control', description: 'The base control this enhancement extends.', items: [] },
    nistControl: { label: 'Related controls', description: 'Connections to other NIST controls.', items: [] },
    other: { label: 'Other public mappings', description: 'Other relationships in the public map.', items: [] }
  };

  const recordNode = runtime.getNode(runtimeNodeLookupId);
  const recordItemId = recordNode?.metadata?.item_id || '';

  for (const edge of edges) {
    const counterpartId = edge.source_node_id === runtimeNodeLookupId ? edge.target_node_id : edge.source_node_id;
    const counterpart = runtime.getNode(counterpartId);
    if (!counterpart) continue;

    const counterpartItemId = counterpart.metadata?.item_id || '';

    if (counterpartId.startsWith('disa-cci')) groups.disa.items.push({edge, counterpart});
    else if (counterpartId.startsWith('nist-800-53b') || counterpartId.startsWith('nist-baseline')) groups.nistBaseline.items.push({edge, counterpart});
    else if (counterpartId.startsWith('fedramp-')) groups.fedrampBaseline.items.push({edge, counterpart});
    else if (counterpart.node_type === 'assessment_procedure') groups.assessment.items.push({edge, counterpart});
    else if (counterpartId.includes('stig') || counterpartId.includes('srg')) groups.stig.items.push({edge, counterpart});
    else if (counterpartId.startsWith('mitre-')) groups.mitre.items.push({edge, counterpart});
    else if (
      counterpart.node_type === 'control_enhancement' &&
      recordItemId &&
      counterpartItemId.startsWith(`${recordItemId}.`)
    ) {
      // Counterpart is an enhancement of the record's own control
      // (record AC-2, counterpart AC-2.1) — group as this record's enhancements.
      groups.enhancements.items.push({edge, counterpart});
    } else if (
      counterpart.node_type === 'control' &&
      counterpartItemId &&
      recordItemId.startsWith(`${counterpartItemId}.`)
    ) {
      // The record itself is an enhancement (AC-2.1) and the counterpart is
      // its base control (AC-2) — group as the base control.
      groups.baseControl.items.push({edge, counterpart});
    }
    else if (counterpart.node_type === 'control' || counterpart.node_type === 'control_enhancement') groups.nistControl.items.push({edge, counterpart});
    else groups.other.items.push({edge, counterpart});
  }

  return Object.entries(groups)
    .map(([id, group]) => ({ id, ...group }))
    .filter(g => g.items.length > 0);
}
