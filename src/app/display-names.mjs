/** @type {Record<string, Record<string, string>>} */
const DISPLAY_NAMES = {
  provenance_class: {
    mandated: 'Mandated source',
    federal_published: 'Federal published',
    federal_program: 'Federal program',
    federal_utilized: 'Federal utilized',
    federal_referenced: 'Federal referenced',
    inferred: 'Inferred',
    official: 'Official',
    dod_published: 'DoD published',
    nist_published: 'NIST published',
    disa_published: 'DISA published',
    fedramp_published: 'FedRAMP published',
    mitre_published: 'MITRE published',
    community_open_source: 'Community open source',
  },
  eligibility_status: {
    eligible: 'Included in map',
    excluded: 'Excluded from map',
    limited: 'Limited use',
    pending_review: 'Pending review',
  },
  lifecycle_status: {
    active: 'Active',
    deprecated: 'Deprecated',
    draft: 'Draft',
  },
  access_status: {
    public: 'Publicly available',
    restricted: 'Restricted access',
    private: 'Private access',
  },
  relationship_type: {
    maps_to: 'Maps to',
    supports: 'Supports',
    implements: 'Implements',
    overlaps: 'Overlaps with',
    references: 'References',
    derived_from: 'Derived from',
    supersedes: 'Supersedes',
    related_to: 'Related to',
    includes: 'Includes',
    selects: 'Selects',
    assesses: 'Assesses',
    requires: 'Requires',
    depends_on: 'Depends on',
    protects: 'Protects',
    mitigates: 'Mitigates',
    uses: 'Uses',
    provides_context_for: 'Provides context for',
    leads_to: 'Leads to',
  },
  confidence: {
    direct: 'Direct match',
    inferred_high: 'Strong inference',
    inferred_medium: 'Moderate inference',
    inferred_low: 'Weak inference',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  },
  evidence_quality: {
    primary: 'Primary source',
    secondary: 'Supporting source',
    tertiary: 'Indirect source',
  },
  publication_status: {
    published: 'Official link',
    candidate: 'Inferred link',
  },
  object_type: {
    control: 'Control',
    control_enhancement: 'Control enhancement',
    assessment_procedure: 'Assessment procedure',
    baseline: 'Baseline',
    catalog: 'Catalog',
    family: 'Control family',
    cci: 'CCI',
    stig_rule: 'STIG rule',
    srg_requirement: 'SRG requirement',
    capability: 'Capability',
    pillar: 'Pillar',
    program_requirement: 'Program requirement',
    attack_technique: 'ATT&CK technique',
    defend_countermeasure: 'D3FEND countermeasure',
  },
  retrieval_method: {
    download: 'Downloaded copy',
    api: 'API retrieval',
    manual: 'Manual capture',
    import: 'Imported file',
  },
  artifact_type: {
    json: 'JSON data file',
    xml: 'XML document',
    pdf: 'PDF document',
    csv: 'CSV spreadsheet',
    xlsx: 'Excel workbook',
    oscal: 'OSCAL document',
  },
  node_type: {
    control: 'Control',
    control_enhancement: 'Control enhancement',
    assessment_procedure: 'Assessment procedure',
    baseline: 'Baseline',
    catalog: 'Catalog',
    family: 'Control family',
    attack_technique: 'ATT&CK technique',
    defend_countermeasure: 'D3FEND countermeasure',
  },
};

/**
 * @param {string} domain
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function displayNameFor(domain, value) {
  if (!value) return 'Unknown';
  const mapped = DISPLAY_NAMES[domain]?.[value];
  if (mapped) return mapped;
  return String(value).replaceAll('_', ' ');
}

/** @type {Record<string, { title: string, why: string }>} */
export const CONTEXT_SECTION_COPY = {
  'Baseline membership': {
    title: 'Baseline membership',
    why: 'Shows which published baselines include this control.',
  },
  'FedRAMP baseline context': {
    title: 'FedRAMP baseline context',
    why: 'Shows FedRAMP baseline membership when this control applies to cloud authorization.',
  },
  'Categorization context': {
    title: 'Categorization context',
    why: 'Shows how security categorization connects this control to impact levels.',
  },
  'Minimum security requirements': {
    title: 'Minimum security requirements',
    why: 'Links this control to minimum security requirements for its family.',
  },
  'RMF lifecycle': {
    title: 'RMF lifecycle',
    why: 'Places this item in the Risk Management Framework steps.',
  },
  'Assessment procedures': {
    title: 'Assessment procedures',
    why: 'Lists official assessment procedures tied to this control.',
  },
  'Program requirement context': {
    title: 'Program requirement context',
    why: 'Connects this item to program-specific requirements.',
  },
  'CMMC program context': {
    title: 'CMMC program context',
    why: 'Shows CMMC program links when they apply.',
  },
  'CUI policy context': {
    title: 'CUI policy context',
    why: 'Shows Controlled Unclassified Information policy connections.',
  },
  'Additional published relationships': {
    title: 'Additional published relationships',
    why: 'Other official connections not shown in the sections above.',
  },
};

/**
 * @param {string} title
 * @returns {string}
 */
export function contextSectionHeading(title) {
  const copy = CONTEXT_SECTION_COPY[title];
  if (!copy) return title;
  return `${copy.title} — ${copy.why}`;
}

/**
 * @param {Error | string} error
 * @returns {string}
 */
export function userFacingLoadError(error) {
  const message = typeof error === 'string' ? error : error.message;
  if (/Unable to load/i.test(message) || /Invalid .* artifact/i.test(message) || /graph/i.test(message)) {
    return 'The library data could not load. Check your connection and try again.';
  }
  return 'Something went wrong while loading Control Atlas. Try again in a moment.';
}
