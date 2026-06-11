import { normalize80053Id } from './oscal-normalize.mjs';

const FEDRAMP_BASELINE_URLS = {
  LOW: 'https://raw.githubusercontent.com/GSA/fedramp-automation/master/dist/content/rev5/baselines/json/FedRAMP_rev5_LOW-baseline_profile.json',
  MODERATE: 'https://raw.githubusercontent.com/GSA/fedramp-automation/master/dist/content/rev5/baselines/json/FedRAMP_rev5_MODERATE-baseline_profile.json',
  HIGH: 'https://raw.githubusercontent.com/GSA/fedramp-automation/master/dist/content/rev5/baselines/json/FedRAMP_rev5_HIGH-baseline_profile.json',
  'LI-SAAS': 'https://raw.githubusercontent.com/GSA/fedramp-automation/master/dist/content/rev5/baselines/json/FedRAMP_rev5_LI-SaaS-baseline_profile.json',
};

function collectBaselineControls(node, controls = []) {
  if (node?.id && /^(AC|AT|AU|CA|CM|CP|IA|IR|MA|MP|PE|PL|PM|PS|PT|RA|SA|SC|SI|SR)-/.test(node.id)) {
    controls.push(normalize80053Id(node.id));
  }
  for (const child of node?.controls || []) collectBaselineControls(child, controls);
  for (const child of node?.groups || []) collectBaselineControls(child, controls);
  return controls;
}

export async function fetchFedrampBaselineMembership() {
  const membership = {};
  for (const [baseline, url] of Object.entries(FEDRAMP_BASELINE_URLS)) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`FedRAMP baseline fetch failed (${response.status}): ${url}`);
    const profile = await response.json();
    const controls = new Set();
    for (const importEntry of profile.profile?.imports || []) {
      for (const include of importEntry['include-controls'] || []) {
        for (const withId of include['with-ids'] || []) controls.add(normalize80053Id(withId));
      }
    }
    collectBaselineControls(profile.profile, [...controls]).forEach((id) => controls.add(id));
    membership[baseline] = [...controls].sort();
  }
  return membership;
}

export async function fetch80053BBaselines() {
  const urls = [
    'https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53B-r5/json/NIST_SP-800-53B-r5_LOW-baseline_profile.json',
    'https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53B-r5/json/NIST_SP-800-53B-r5_MODERATE-baseline_profile.json',
    'https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53B-r5/json/NIST_SP-800-53B-r5_HIGH-baseline_profile.json',
    'https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53B-r5/json/NIST_SP-800-53B-r5_PRIVACY-baseline_profile.json',
  ];
  const membership = {};
  for (const url of urls) {
    const response = await fetch(url);
    if (!response.ok) continue;
    const profile = await response.json();
    const label = profile.profile?.metadata?.title || url.split('/').pop();
    const controls = new Set();
    for (const importEntry of profile.profile?.imports || []) {
      for (const include of importEntry['include-controls'] || []) {
        for (const withId of include['with-ids'] || []) controls.add(normalize80053Id(withId));
      }
    }
    membership[label] = [...controls].sort();
  }
  return membership;
}

export function enrichCatalogMetadata(records, enrichment = {}) {
  return records.map((record) => ({
    ...record,
    metadata: {
      ...(record.metadata || {}),
      ...enrichment[record.id],
    },
  }));
}
