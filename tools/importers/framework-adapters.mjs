import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const AI_RMF_SOURCE = 'nist-ai-rmf-playbook';
const SSDF_SOURCE = 'nist-ssdf-oscal';
const FEDRAMP_SOURCE = 'fedramp-rev5';
const FIPS_199_SOURCE = 'nist-fips-199';
const FIPS_200_SOURCE = 'nist-fips-200';
const NIST_800_37_SOURCE = 'nist-800-37-rev2';
const NIST_800_53B_SOURCE = 'nist-800-53b-baselines';
const CMMC_SOURCE = 'dod-cmmc-rule';
const DOD_RAI_SOURCE = 'dod-rai-toolkit';
const DOD_ZT_RA_SOURCE = 'dod-zt-reference-architecture-v2';
const DOD_ZT_CAPABILITIES_SOURCE = 'dod-zt-capabilities';
const DOD_ZT_OVERLAYS_SOURCE = 'dod-zt-overlays-2024';
const ISOO_CUI_SOURCE = 'isoo-cui-regulation';
const NARA_CUI_SOURCE = 'nara-cui-registry';

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

export function buildFedrampPublicCatalog(snapshotDate, baselineMembership = null) {
  return publicCatalog(FEDRAMP_SOURCE, snapshotDate, [
    { id: 'LI-SAAS', type: 'fedramp-baseline', framework: 'fedramp', title: 'LI-SaaS Baseline', family: 'Rev. 5 Baselines', description: 'FedRAMP Tailored baseline for low-impact software-as-a-service offerings.', locator: 'rev5/documents-templates/#LI-SaaS', metadata: { controls: baselineMembership?.['LI-SAAS'] || [] } },
    { id: 'LOW', type: 'fedramp-baseline', framework: 'fedramp', title: 'Low Baseline', family: 'Rev. 5 Baselines', description: 'FedRAMP Rev. 5 Low security control baseline.', locator: 'rev5/documents-templates/#Low', metadata: { controls: baselineMembership?.['LOW'] || [] } },
    { id: 'MODERATE', type: 'fedramp-baseline', framework: 'fedramp', title: 'Moderate Baseline', family: 'Rev. 5 Baselines', description: 'FedRAMP Rev. 5 Moderate security control baseline.', locator: 'rev5/documents-templates/#Moderate', metadata: { controls: baselineMembership?.['MODERATE'] || [] } },
    { id: 'HIGH', type: 'fedramp-baseline', framework: 'fedramp', title: 'High Baseline', family: 'Rev. 5 Baselines', description: 'FedRAMP Rev. 5 High security control baseline.', locator: 'rev5/documents-templates/#High', metadata: { controls: baselineMembership?.['HIGH'] || [] } },
  ]);
}

export function buildFips199Catalog(snapshotDate) {
  return publicCatalog(FIPS_199_SOURCE, snapshotDate, [
    {
      id: 'FIPS-199-LOW',
      type: 'fips-199-impact-category',
      framework: 'fips-199',
      title: 'Low Impact',
      family: 'Security Categorization',
      description: 'Potential impact is low when a loss of confidentiality, integrity, or availability could be expected to have a limited adverse effect on organizational operations, organizational assets, or individuals.',
      locator: 'fips-199#low-impact',
      metadata: {
        relationships: [
          { target_catalog: 'nist-800-53b', target_id: 'LOW', relationship_type: 'selects' },
        ],
      },
    },
    {
      id: 'FIPS-199-MODERATE',
      type: 'fips-199-impact-category',
      framework: 'fips-199',
      title: 'Moderate Impact',
      family: 'Security Categorization',
      description: 'Potential impact is moderate when a loss of confidentiality, integrity, or availability could be expected to have a serious adverse effect on organizational operations, organizational assets, or individuals.',
      locator: 'fips-199#moderate-impact',
      metadata: {
        relationships: [
          { target_catalog: 'nist-800-53b', target_id: 'MODERATE', relationship_type: 'selects' },
        ],
      },
    },
    {
      id: 'FIPS-199-HIGH',
      type: 'fips-199-impact-category',
      framework: 'fips-199',
      title: 'High Impact',
      family: 'Security Categorization',
      description: 'Potential impact is high when a loss of confidentiality, integrity, or availability could be expected to have a severe or catastrophic adverse effect on organizational operations, organizational assets, or individuals.',
      locator: 'fips-199#high-impact',
      metadata: {
        relationships: [
          { target_catalog: 'nist-800-53b', target_id: 'HIGH', relationship_type: 'selects' },
        ],
      },
    },
  ]);
}

export function buildFips200Catalog(snapshotDate) {
  return publicCatalog(FIPS_200_SOURCE, snapshotDate, [
    { id: 'AC', type: 'fips-200-requirement', framework: 'fips-200', title: 'Access Control', family: 'Minimum Security Requirements', description: 'Limit information system access to authorized users, processes acting on behalf of authorized users, and devices.', locator: 'fips-200#access-control', metadata: { relationships: [{ target_catalog: 'nist-800-53', target_id: 'FAMILY-AC', relationship_type: 'references' }] } },
    { id: 'AT', type: 'fips-200-requirement', framework: 'fips-200', title: 'Awareness and Training', family: 'Minimum Security Requirements', description: 'Ensure that managers and users understand and practice security responsibilities before authorizing access.', locator: 'fips-200#awareness-and-training', metadata: { relationships: [{ target_catalog: 'nist-800-53', target_id: 'FAMILY-AT', relationship_type: 'references' }] } },
    { id: 'AU', type: 'fips-200-requirement', framework: 'fips-200', title: 'Audit and Accountability', family: 'Minimum Security Requirements', description: 'Create, protect, and retain information system audit records and provide accountability for actions affecting the system.', locator: 'fips-200#audit-and-accountability', metadata: { relationships: [{ target_catalog: 'nist-800-53', target_id: 'FAMILY-AU', relationship_type: 'references' }] } },
    { id: 'CA', type: 'fips-200-requirement', framework: 'fips-200', title: 'Security Assessment and Authorization', family: 'Minimum Security Requirements', description: 'Assess security controls, determine residual risk, and authorize information systems before operation.', locator: 'fips-200#security-assessment-and-authorization', metadata: { relationships: [{ target_catalog: 'nist-800-53', target_id: 'FAMILY-CA', relationship_type: 'references' }] } },
    { id: 'CM', type: 'fips-200-requirement', framework: 'fips-200', title: 'Configuration Management', family: 'Minimum Security Requirements', description: 'Establish and maintain baseline configurations and controlled changes to information systems.', locator: 'fips-200#configuration-management', metadata: { relationships: [{ target_catalog: 'nist-800-53', target_id: 'FAMILY-CM', relationship_type: 'references' }] } },
    { id: 'CP', type: 'fips-200-requirement', framework: 'fips-200', title: 'Contingency Planning', family: 'Minimum Security Requirements', description: 'Establish, maintain, and test emergency response, backup, and recovery capabilities for information systems.', locator: 'fips-200#contingency-planning', metadata: { relationships: [{ target_catalog: 'nist-800-53', target_id: 'FAMILY-CP', relationship_type: 'references' }] } },
    { id: 'IA', type: 'fips-200-requirement', framework: 'fips-200', title: 'Identification and Authentication', family: 'Minimum Security Requirements', description: 'Identify system users, processes, and devices and authenticate identities before allowing access.', locator: 'fips-200#identification-and-authentication', metadata: { relationships: [{ target_catalog: 'nist-800-53', target_id: 'FAMILY-IA', relationship_type: 'references' }] } },
    { id: 'IR', type: 'fips-200-requirement', framework: 'fips-200', title: 'Incident Response', family: 'Minimum Security Requirements', description: 'Establish operational capabilities to respond to and recover from security incidents.', locator: 'fips-200#incident-response', metadata: { relationships: [{ target_catalog: 'nist-800-53', target_id: 'FAMILY-IR', relationship_type: 'references' }] } },
    { id: 'MA', type: 'fips-200-requirement', framework: 'fips-200', title: 'Maintenance', family: 'Minimum Security Requirements', description: 'Perform timely and controlled maintenance on information systems and system components.', locator: 'fips-200#maintenance', metadata: { relationships: [{ target_catalog: 'nist-800-53', target_id: 'FAMILY-MA', relationship_type: 'references' }] } },
    { id: 'MP', type: 'fips-200-requirement', framework: 'fips-200', title: 'Media Protection', family: 'Minimum Security Requirements', description: 'Protect information system media during transport, storage, access, and disposal.', locator: 'fips-200#media-protection', metadata: { relationships: [{ target_catalog: 'nist-800-53', target_id: 'FAMILY-MP', relationship_type: 'references' }] } },
    { id: 'PE', type: 'fips-200-requirement', framework: 'fips-200', title: 'Physical and Environmental Protection', family: 'Minimum Security Requirements', description: 'Limit physical access to information systems and protect facilities and infrastructure from environmental hazards.', locator: 'fips-200#physical-and-environmental-protection', metadata: { relationships: [{ target_catalog: 'nist-800-53', target_id: 'FAMILY-PE', relationship_type: 'references' }] } },
    { id: 'PL', type: 'fips-200-requirement', framework: 'fips-200', title: 'Planning', family: 'Minimum Security Requirements', description: 'Develop, document, and maintain security plans describing system boundaries, controls, and operating conditions.', locator: 'fips-200#planning', metadata: { relationships: [{ target_catalog: 'nist-800-53', target_id: 'FAMILY-PL', relationship_type: 'references' }] } },
    { id: 'PS', type: 'fips-200-requirement', framework: 'fips-200', title: 'Personnel Security', family: 'Minimum Security Requirements', description: 'Ensure that individuals occupying positions of responsibility are trustworthy and meet established security criteria.', locator: 'fips-200#personnel-security', metadata: { relationships: [{ target_catalog: 'nist-800-53', target_id: 'FAMILY-PS', relationship_type: 'references' }] } },
    { id: 'RA', type: 'fips-200-requirement', framework: 'fips-200', title: 'Risk Assessment', family: 'Minimum Security Requirements', description: 'Assess risk to organizational operations, assets, individuals, and other organizations resulting from system operation.', locator: 'fips-200#risk-assessment', metadata: { relationships: [{ target_catalog: 'nist-800-53', target_id: 'FAMILY-RA', relationship_type: 'references' }] } },
    { id: 'SA', type: 'fips-200-requirement', framework: 'fips-200', title: 'System and Services Acquisition', family: 'Minimum Security Requirements', description: 'Integrate security into acquisition, development, and external service usage throughout the system lifecycle.', locator: 'fips-200#system-and-services-acquisition', metadata: { relationships: [{ target_catalog: 'nist-800-53', target_id: 'FAMILY-SA', relationship_type: 'references' }] } },
    { id: 'SC', type: 'fips-200-requirement', framework: 'fips-200', title: 'System and Communications Protection', family: 'Minimum Security Requirements', description: 'Monitor, control, and protect organizational communications and system boundaries.', locator: 'fips-200#system-and-communications-protection', metadata: { relationships: [{ target_catalog: 'nist-800-53', target_id: 'FAMILY-SC', relationship_type: 'references' }] } },
    { id: 'SI', type: 'fips-200-requirement', framework: 'fips-200', title: 'System and Information Integrity', family: 'Minimum Security Requirements', description: 'Identify, report, and correct information and information system flaws in a timely manner and protect against malicious code.', locator: 'fips-200#system-and-information-integrity', metadata: { relationships: [{ target_catalog: 'nist-800-53', target_id: 'FAMILY-SI', relationship_type: 'references' }] } },
  ]);
}

export function buildNist80053BBaselineCatalog(snapshotDate) {
  return publicCatalog(NIST_800_53B_SOURCE, snapshotDate, [
    { id: 'LOW', type: 'nist-800-53b-baseline', framework: 'nist-800-53b', title: 'Low Impact Baseline', family: 'NIST SP 800-53B Baselines', description: 'NIST SP 800-53B low impact baseline for federal information systems.', locator: 'sp800-53b#low' },
    { id: 'MODERATE', type: 'nist-800-53b-baseline', framework: 'nist-800-53b', title: 'Moderate Impact Baseline', family: 'NIST SP 800-53B Baselines', description: 'NIST SP 800-53B moderate impact baseline for federal information systems.', locator: 'sp800-53b#moderate' },
    { id: 'HIGH', type: 'nist-800-53b-baseline', framework: 'nist-800-53b', title: 'High Impact Baseline', family: 'NIST SP 800-53B Baselines', description: 'NIST SP 800-53B high impact baseline for federal information systems.', locator: 'sp800-53b#high' },
    { id: 'PRIVACY', type: 'nist-800-53b-baseline', framework: 'nist-800-53b', title: 'Privacy Baseline', family: 'NIST SP 800-53B Baselines', description: 'NIST SP 800-53B privacy baseline for federal information systems.', locator: 'sp800-53b#privacy' },
  ]);
}

export function buildRmfCatalog(snapshotDate) {
  return publicCatalog(NIST_800_37_SOURCE, snapshotDate, [
    {
      id: 'RMF-PREPARE',
      type: '800-37-step',
      framework: '800-37',
      title: 'Prepare',
      family: 'Risk Management Framework',
      description: 'Carry out essential activities to prepare the organization and system for managing security and privacy risk using the RMF.',
      locator: 'sp800-37#prepare',
      metadata: {
        relationships: [
          { target_catalog: 'fips-200', target_id: 'AC', relationship_type: 'references' },
        ],
      },
    },
    {
      id: 'RMF-CATEGORIZE',
      type: '800-37-step',
      framework: '800-37',
      title: 'Categorize',
      family: 'Risk Management Framework',
      description: 'Categorize the system and the information processed, stored, and transmitted by the system based on impact analysis.',
      locator: 'sp800-37#categorize',
      metadata: {
        relationships: [
          { target_catalog: 'fips-199', target_id: 'FIPS-199-LOW', relationship_type: 'uses' },
          { target_catalog: 'fips-199', target_id: 'FIPS-199-MODERATE', relationship_type: 'uses' },
          { target_catalog: 'fips-199', target_id: 'FIPS-199-HIGH', relationship_type: 'uses' },
        ],
      },
    },
    {
      id: 'RMF-SELECT',
      type: '800-37-step',
      framework: '800-37',
      title: 'Select',
      family: 'Risk Management Framework',
      description: 'Select an initial set of security and privacy controls for the system and tailor them as needed.',
      locator: 'sp800-37#select',
      metadata: {
        relationships: [
          { target_catalog: 'nist-800-53b', target_id: 'LOW', relationship_type: 'selects' },
          { target_catalog: 'nist-800-53b', target_id: 'MODERATE', relationship_type: 'selects' },
          { target_catalog: 'nist-800-53b', target_id: 'HIGH', relationship_type: 'selects' },
          { target_catalog: 'nist-800-53b', target_id: 'PRIVACY', relationship_type: 'selects' },
        ],
      },
    },
    {
      id: 'RMF-IMPLEMENT',
      type: '800-37-step',
      framework: '800-37',
      title: 'Implement',
      family: 'Risk Management Framework',
      description: 'Implement the selected controls within the system and organization and document how they are deployed.',
      locator: 'sp800-37#implement',
      metadata: {
        relationships: [
          { target_catalog: 'nist-800-53', target_id: 'FAMILY-AC', relationship_type: 'uses' },
        ],
      },
    },
    {
      id: 'RMF-ASSESS',
      type: '800-37-step',
      framework: '800-37',
      title: 'Assess',
      family: 'Risk Management Framework',
      description: 'Assess the implemented controls to determine if they are effective and producing the intended outcomes.',
      locator: 'sp800-37#assess',
      metadata: {
        relationships: [
          { target_catalog: 'nist-800-53', target_id: 'FAMILY-AC', relationship_type: 'uses' },
        ],
      },
    },
    {
      id: 'RMF-AUTHORIZE',
      type: '800-37-step',
      framework: '800-37',
      title: 'Authorize',
      family: 'Risk Management Framework',
      description: 'Determine if the remaining risk is acceptable and authorize the system or common controls for operation.',
      locator: 'sp800-37#authorize',
      metadata: {
        relationships: [
          { target_catalog: 'nist-800-53b', target_id: 'LOW', relationship_type: 'applies_to' },
          { target_catalog: 'nist-800-53b', target_id: 'MODERATE', relationship_type: 'applies_to' },
          { target_catalog: 'nist-800-53b', target_id: 'HIGH', relationship_type: 'applies_to' },
        ],
      },
    },
    {
      id: 'RMF-MONITOR',
      type: '800-37-step',
      framework: '800-37',
      title: 'Monitor',
      family: 'Risk Management Framework',
      description: 'Continuously monitor controls and system changes to maintain ongoing awareness of risk and security posture.',
      locator: 'sp800-37#monitor',
      metadata: {
        relationships: [
          { target_catalog: 'nist-800-53', target_id: 'FAMILY-AC', relationship_type: 'uses' },
        ],
      },
    },
  ]);
}

export function buildCmmcPublicCatalog(snapshotDate) {
  return publicCatalog(CMMC_SOURCE, snapshotDate, [
    { id: 'LEVEL-1', type: 'cmmc-level', framework: 'cmmc', title: 'CMMC Level 1', family: 'CMMC 2.0 Levels', description: 'Safeguarding Federal Contract Information using the 15 requirements in FAR 52.204-21.', locator: '32-CFR-170.14(c)(2)', metadata: { dependencies: ['FAR 52.204-21'] } },
    { id: 'LEVEL-2', type: 'cmmc-level', framework: 'cmmc', title: 'CMMC Level 2', family: 'CMMC 2.0 Levels', description: 'Protecting Controlled Unclassified Information using the 110 requirements in NIST SP 800-171 Revision 2.', locator: '32-CFR-170.14(c)(3)', metadata: { dependencies: ['NIST SP 800-171 Rev. 2'], requires_800_171_rev: 'rev2' } },
    { id: 'LEVEL-3', type: 'cmmc-level', framework: 'cmmc', title: 'CMMC Level 3', family: 'CMMC 2.0 Levels', description: 'Protecting Controlled Unclassified Information using selected NIST SP 800-172 requirements and DoD-defined parameters.', locator: '32-CFR-170.14(c)(4)', metadata: { dependencies: ['NIST SP 800-171 Rev. 2', 'NIST SP 800-172'], requires_800_172: true } },
  ]);
}

export function buildCuiPolicyCatalog(snapshotDate) {
  return {
    schema_version: '1.0',
    source_key: ISOO_CUI_SOURCE,
    records: [
      {
        id: 'CUI-PROGRAM',
        type: 'cui-policy',
        framework: 'cui-policy',
        title: 'CUI Program',
        family: 'Controlled Unclassified Information',
        description: 'The CUI Program is the executive branch-wide program to standardize CUI handling across federal agencies.',
        source: source(ISOO_CUI_SOURCE, snapshotDate, '32-cfr-part-2002#cui-program'),
      },
      {
        id: 'CUI-BASIC',
        type: 'cui-policy',
        framework: 'cui-policy',
        title: 'CUI Basic',
        family: 'Controlled Unclassified Information',
        description: 'CUI Basic covers information for which the underlying authority does not specify handling controls beyond the uniform CUI controls.',
        source: source(NARA_CUI_SOURCE, snapshotDate, 'cui-glossary#cui-basic'),
      },
      {
        id: 'CUI-SPECIFIED',
        type: 'cui-policy',
        framework: 'cui-policy',
        title: 'CUI Specified',
        family: 'Controlled Unclassified Information',
        description: 'CUI Specified covers information whose underlying authority provides specific handling or dissemination controls.',
        source: source(NARA_CUI_SOURCE, snapshotDate, 'cui-glossary#cui-specified'),
      },
    ],
  };
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

function capabilityRecordId(rawId) {
  return `CAP-${String(rawId).replace('.', '-')}`;
}

function activityRecordId(rawId) {
  return `ACT-${String(rawId).replace(/\./g, '-')}`;
}

export function buildDodZeroTrustCatalog(snapshotDate, curatedRoot) {
  const readJson = (filename) => JSON.parse(readFileSync(join(curatedRoot, filename), 'utf8'));
  const taxonomy = readJson('taxonomy.json');
  const capabilitiesDoc = readJson('capabilities.json');
  const activitiesDoc = readJson('activities.json');
  const records = [];

  records.push({
    id: 'OVERLAYS-CATALOG',
    type: 'zt-overlay-catalog',
    framework: 'dod-zt',
    title: 'DoD Zero Trust Overlays',
    family: 'Control Overlays',
    description: 'DoD control overlays on Zero Trust pillars (RMF overlay sense). Not overlay networks or ZTNA.',
    locator: 'ZeroTrustOverlays-2024Feb.pdf#executive-summary',
    source: source(DOD_ZT_OVERLAYS_SOURCE, snapshotDate, 'ZeroTrustOverlays-2024Feb.pdf#executive-summary'),
    metadata: {
      disambiguation: 'DoD control overlays on ZT pillars (RMF overlay sense), not overlay networks or ZTNA.',
    },
  });

  for (const tenet of taxonomy.tenets) {
    records.push({
      id: tenet.id,
      type: 'zt_tenet',
      framework: 'dod-zt',
      title: tenet.title,
      family: 'Zero Trust Tenets',
      description: tenet.description,
      locator: tenet.locator,
      source: source(tenet.source_key || DOD_ZT_RA_SOURCE, snapshotDate, tenet.locator),
    });
  }

  for (const pillar of taxonomy.pillars) {
    records.push({
      id: pillar.id,
      type: 'zt_pillar',
      framework: 'dod-zt',
      title: pillar.title,
      family: pillar.family || 'Zero Trust Pillars',
      description: pillar.description,
      locator: pillar.locator,
      source: source(pillar.source_key || DOD_ZT_RA_SOURCE, snapshotDate, pillar.locator),
      metadata: { pillar_number: pillar.number || null },
    });
  }

  for (const section of taxonomy.overlay_sections) {
    records.push({
      id: section.id,
      type: 'zt_overlay_section',
      framework: 'dod-zt',
      title: section.title,
      family: 'Zero Trust Overlays',
      description: `Overlay section for ${section.title}.`,
      locator: section.locator,
      source: source(section.source_key || DOD_ZT_OVERLAYS_SOURCE, snapshotDate, section.locator),
      metadata: {
        pillar_id: section.pillar_id,
        appendix: section.appendix,
        relationships: [{ target_catalog: 'dod-zt', target_id: section.pillar_id, relationship_type: 'references' }],
      },
    });
  }

  for (const doc of taxonomy.documents) {
    records.push({
      id: doc.id,
      type: 'zt_document',
      framework: 'dod-zt',
      title: doc.title,
      family: 'Zero Trust Documents',
      description: doc.title,
      locator: doc.locator,
      source: source(doc.source_key, snapshotDate, doc.locator),
      metadata: {
        disambiguation: doc.disambiguation || null,
        relationships: (doc.relationships || []).map((relationship) => ({
          ...relationship,
          rationale: `${doc.title} references ${relationship.target_id}.`,
        })),
      },
    });
  }

  for (const capability of capabilitiesDoc.records) {
    const id = capabilityRecordId(capability.id);
    records.push({
      id,
      type: 'zt_capability',
      framework: 'dod-zt',
      title: `${capability.id} ${capability.title}`,
      family: capability.pillar_name || capability.pillar_id,
      description: [capability.description, capability.outcome, capability.impact].filter(Boolean).join(' '),
      locator: capability.locator,
      source: source(DOD_ZT_CAPABILITIES_SOURCE, snapshotDate, capability.locator),
      metadata: {
        capability_id: capability.id,
        pillar_id: capability.pillar_id,
        level: capability.level,
      },
    });
  }

  for (const activity of activitiesDoc.records) {
    const capabilityId = capabilityRecordId(activity.capability_id);
    records.push({
      id: activityRecordId(activity.id),
      type: 'zt_activity',
      framework: 'dod-zt',
      title: `${activity.id} ${activity.title}`,
      family: 'Zero Trust Activities',
      description: activity.title,
      locator: activity.locator,
      source: source(activity.source_key || DOD_ZT_OVERLAYS_SOURCE, snapshotDate, activity.locator),
      metadata: {
        activity_id: activity.id,
        capability_id: capabilityId,
        level: activity.level,
      },
    });
  }

  return { schema_version: '1.0', source_key: DOD_ZT_RA_SOURCE, records };
}
