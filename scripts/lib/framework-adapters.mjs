const AI_RMF_SOURCE = 'nist-ai-rmf-playbook';
const SSDF_SOURCE = 'nist-ssdf-oscal';
const FEDRAMP_SOURCE = 'fedramp-rev5';
const CMMC_SOURCE = 'dod-cmmc-rule';
const DOD_RAI_SOURCE = 'dod-rai-toolkit';

function source(key, snapshotDate, locator) {
  return { key, snapshot_date: snapshotDate, locator };
}

function cleanText(value) {
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean).join(' ');
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function parseAiRmfPlaybook(playbook, snapshotDate) {
  const records = (playbook || [])
    .filter((entry) => entry.title && entry.description)
    .map((entry) => ({
      id: cleanText(entry.title),
      type: 'ai-rmf-outcome',
      framework: 'ai-rmf',
      title: cleanText(entry.description),
      family: cleanText(entry.category || entry.type || 'AI RMF'),
      description: cleanText([
        entry.description,
        entry.section_about,
        entry.section_actions,
      ]),
      source: source(AI_RMF_SOURCE, snapshotDate, `playbook.json#${cleanText(entry.title)}`),
    }));
  return { schema_version: '1.0', source_key: AI_RMF_SOURCE, records };
}

function collectProse(parts = []) {
  return parts.flatMap((part) => [
    cleanText(part.prose),
    ...collectProse(part.parts || []),
  ]).filter(Boolean);
}

function walkSsdf(nodes, family, snapshotDate, records) {
  for (const node of nodes || []) {
    const nextFamily = node.controls?.length && !family ? cleanText(node.title) : family;
    if (node.controls?.length) {
      walkSsdf(node.controls, nextFamily, snapshotDate, records);
      continue;
    }
    if (!node.id) continue;
    const id = String(node.id).toUpperCase().replace(/-/g, '.');
    records.push({
      id,
      type: 'ssdf-task',
      framework: 'ssdf',
      title: cleanText(node.title) || id,
      family: nextFamily || 'SSDF',
      description: cleanText(collectProse(node.parts || [])) || cleanText(node.title),
      source: source(SSDF_SOURCE, snapshotDate, `NIST_SP800-218_ver1_catalog.json#${node.id}`),
    });
  }
}

export function parseSsdfCatalog(catalogJson, snapshotDate) {
  const records = [];
  walkSsdf(catalogJson.catalog?.groups, null, snapshotDate, records);
  return { schema_version: '1.0', source_key: SSDF_SOURCE, records };
}

function publicCatalog(sourceKey, snapshotDate, definitions) {
  return {
    schema_version: '1.0',
    source_key: sourceKey,
    records: definitions.map((record) => ({
      ...record,
      source: source(sourceKey, snapshotDate, record.locator),
      locator: undefined,
    })),
  };
}

export function buildFedrampPublicCatalog(snapshotDate) {
  return publicCatalog(FEDRAMP_SOURCE, snapshotDate, [
    { id: 'LI-SAAS', type: 'fedramp-baseline', framework: 'fedramp', title: 'LI-SaaS Baseline', family: 'Rev. 5 Baselines', description: 'FedRAMP Tailored baseline for low-impact software-as-a-service offerings.', locator: 'rev5/documents-templates/#LI-SaaS' },
    { id: 'LOW', type: 'fedramp-baseline', framework: 'fedramp', title: 'Low Baseline', family: 'Rev. 5 Baselines', description: 'FedRAMP Rev. 5 Low security control baseline.', locator: 'rev5/documents-templates/#Low' },
    { id: 'MODERATE', type: 'fedramp-baseline', framework: 'fedramp', title: 'Moderate Baseline', family: 'Rev. 5 Baselines', description: 'FedRAMP Rev. 5 Moderate security control baseline.', locator: 'rev5/documents-templates/#Moderate' },
    { id: 'HIGH', type: 'fedramp-baseline', framework: 'fedramp', title: 'High Baseline', family: 'Rev. 5 Baselines', description: 'FedRAMP Rev. 5 High security control baseline.', locator: 'rev5/documents-templates/#High' },
  ]);
}

export function buildCmmcPublicCatalog(snapshotDate) {
  return publicCatalog(CMMC_SOURCE, snapshotDate, [
    { id: 'LEVEL-1', type: 'cmmc-level', framework: 'cmmc', title: 'CMMC Level 1', family: 'CMMC 2.0 Levels', description: 'Safeguarding Federal Contract Information using the 15 requirements in FAR 52.204-21.', locator: '32-CFR-170.14(c)(2)' },
    { id: 'LEVEL-2', type: 'cmmc-level', framework: 'cmmc', title: 'CMMC Level 2', family: 'CMMC 2.0 Levels', description: 'Protecting Controlled Unclassified Information using the 110 requirements in NIST SP 800-171 Revision 2.', locator: '32-CFR-170.14(c)(3)' },
    { id: 'LEVEL-3', type: 'cmmc-level', framework: 'cmmc', title: 'CMMC Level 3', family: 'CMMC 2.0 Levels', description: 'Protecting Controlled Unclassified Information using selected NIST SP 800-172 requirements and DoD-defined parameters.', locator: '32-CFR-170.14(c)(4)' },
  ]);
}

export function buildDodRaiPublicCatalog(snapshotDate) {
  return publicCatalog(DOD_RAI_SOURCE, snapshotDate, [
    { id: 'PRINCIPLE-MODULAR', type: 'rai-toolkit-principle', framework: 'dod-rai', title: 'Modular and Tailorable', family: 'Toolkit Focus Principles', description: 'Apply the toolkit in a modular and tailorable way.', locator: 'executive-summary#modular-and-tailorable' },
    { id: 'PRINCIPLE-RASCI', type: 'rai-toolkit-principle', framework: 'dod-rai', title: 'Aligned to RASCI Matrix', family: 'Toolkit Focus Principles', description: 'Align responsible AI activities with accountable roles.', locator: 'executive-summary#rasci-matrix' },
    { id: 'PRINCIPLE-HOLISTIC', type: 'rai-toolkit-principle', framework: 'dod-rai', title: 'Holistic', family: 'Toolkit Focus Principles', description: 'Assess responsible AI holistically across the lifecycle.', locator: 'executive-summary#holistic' },
    { id: 'PRINCIPLE-ETHICS', type: 'rai-toolkit-principle', framework: 'dod-rai', title: 'DoW AI Ethical Principles', family: 'Toolkit Focus Principles', description: 'Operationalize Department of War AI Ethical Principles.', locator: 'executive-summary#ethical-principles' },
    { id: 'PRINCIPLE-TOOLS', type: 'rai-toolkit-principle', framework: 'dod-rai', title: 'Tools List', family: 'Toolkit Focus Principles', description: 'Use a maintained list of supporting responsible AI tools.', locator: 'executive-summary#tools-list' },
    { id: 'SHIELD-SET', type: 'rai-shield-activity', framework: 'dod-rai', title: 'Set Foundations', family: 'SHIELD Activities', description: 'Set foundations for responsible AI.', locator: 'executive-summary#shield-set' },
    { id: 'SHIELD-HONE', type: 'rai-shield-activity', framework: 'dod-rai', title: 'Hone Operationalizations', family: 'SHIELD Activities', description: 'Hone responsible AI operationalizations.', locator: 'executive-summary#shield-hone' },
    { id: 'SHIELD-IMPROVE', type: 'rai-shield-activity', framework: 'dod-rai', title: 'Improve and Innovate', family: 'SHIELD Activities', description: 'Improve and innovate responsible AI practices.', locator: 'executive-summary#shield-improve' },
    { id: 'SHIELD-EVALUATE', type: 'rai-shield-activity', framework: 'dod-rai', title: 'Evaluate Status', family: 'SHIELD Activities', description: 'Evaluate responsible AI status.', locator: 'executive-summary#shield-evaluate' },
    { id: 'SHIELD-LOG', type: 'rai-shield-activity', framework: 'dod-rai', title: 'Log for Traceability', family: 'SHIELD Activities', description: 'Log responsible AI decisions and evidence for traceability.', locator: 'executive-summary#shield-log' },
    { id: 'SHIELD-DETECT', type: 'rai-shield-activity', framework: 'dod-rai', title: 'Detect via Continuous Monitoring', family: 'SHIELD Activities', description: 'Detect responsible AI concerns through continuous monitoring.', locator: 'executive-summary#shield-detect' },
  ]);
}
