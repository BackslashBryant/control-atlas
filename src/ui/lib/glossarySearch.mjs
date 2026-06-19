import { glossaryData } from '../../app/glossary-data.mjs';
import { patternsData } from '../../app/patterns-data.mjs';

function normalize(value) {
  return value.trim().toLowerCase();
}

export function templatesForPatterns(patternIds) {
  const templateIds = patternIds.flatMap((patternId) => {
    const pattern = patternsData.find((entry) => entry.id === patternId);
    return pattern?.templates || [];
  });
  return [...new Set(templateIds)];
}

export function searchGlossary(query) {
  const needle = normalize(query);
  if (!needle) {
    return [];
  }

  return glossaryData
    .filter((entry) => {
      const haystack = [entry.id, entry.term, entry.expansion || '', entry.definition, entry.source].join(' ').toLowerCase();
      return haystack.includes(needle);
    })
    .map((entry) => ({
      ...entry,
      relatedTemplateIds: templatesForPatterns(entry.related_patterns),
    }));
}

export function glossaryTermsForDocument(document) {
  const itemId = document.item_id || '';
  const objectType = document.object_type || '';
  const defaultsByType = {
    stig_rule: ['stig', 'cci'],
    srg_requirement: ['srg', 'stig'],
    cci: ['cci', 'stig'],
    baseline: ['baseline', 'profile'],
    profile: ['baseline', 'profile'],
    control: ['rmf', 'baseline'],
  };

  const defaultIds = defaultsByType[objectType] || [];
  const matched = glossaryData.filter((entry) => entry.related_controls.includes(itemId));
  const fallback = glossaryData.filter((entry) => defaultIds.includes(entry.id));
  const combined = [...matched, ...fallback];
  const seen = new Set();

  return combined.filter((entry) => {
    if (seen.has(entry.id)) {
      return false;
    }
    seen.add(entry.id);
    return true;
  });
}

export function glossaryTermsForPattern(patternId) {
  return glossaryData.filter((entry) => entry.related_patterns.includes(patternId));
}

export function getGlossaryEntry(termId) {
  return glossaryData.find((entry) => entry.id === termId);
}
