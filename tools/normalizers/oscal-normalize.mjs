#!/usr/bin/env node
/**
 * Normalize NIST OSCAL documents into Control Atlas source record arrays.
 */

const MAX_DESCRIPTION = 1200;
const ASSESSMENT_SOURCE_KEY = 'nist-800-53a-assessment-procedures';
const SUPPORTED_OSCAL_MODELS = ['catalog', 'profile', 'component-definition', 'assessment-plan'];

function cleanText(value) {
  return String(value || '')
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function collectProse(parts, out) {
  for (const part of parts || []) {
    const prose = cleanText(part.prose);
    if (prose) out.push(prose);
    if (part.parts) collectProse(part.parts, out);
  }
}

function descriptionFromControl(control) {
  const chunks = [];
  collectProse(control.parts, chunks);
  if (!chunks.length && control.title) chunks.push(control.title);
  const text = chunks.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  if (!text) return control.title || control.id;
  return text.length > MAX_DESCRIPTION ? `${text.slice(0, MAX_DESCRIPTION)}...` : text;
}

function propValue(props, name) {
  return (props || []).find((entry) => entry.name === name)?.value || '';
}

function assessmentLinks(part) {
  return (part.links || [])
    .map((entry) => entry.href || '')
    .filter(Boolean)
    .map((entry) => entry.replace(/^#/, ''));
}

function splitAssessmentObjects(value) {
  return String(value || '')
    .split(/\n\s*\n/g)
    .map((entry) => cleanText(entry))
    .filter(Boolean);
}

function flattenAssessmentObjectives(parts, entries = []) {
  for (const part of parts || []) {
    if (part.name !== 'assessment-objective') continue;
    const prose = cleanText(part.prose);
    if (prose) {
      entries.push({
        id: part.id || '',
        label: propValue(part.props, 'label') || part.id || '',
        prose,
        statement_refs: assessmentLinks(part),
      });
    }
    flattenAssessmentObjectives(part.parts, entries);
  }
  return entries;
}

function collectAssessmentMethods(parts) {
  return (parts || [])
    .filter((part) => part.name === 'assessment-method')
    .map((part) => ({
      id: part.id || '',
      label: propValue(part.props, 'label') || part.id || '',
      method: propValue(part.props, 'method') || '',
      objects: (part.parts || [])
        .filter((child) => child.name === 'assessment-objects')
        .flatMap((child) => splitAssessmentObjects(child.prose)),
    }))
    .filter((entry) => entry.method || entry.objects.length);
}

function buildAssessmentMetadata(control) {
  const objectives = flattenAssessmentObjectives(control.parts);
  const methods = collectAssessmentMethods(control.parts);
  if (!objectives.length && !methods.length) return null;
  return {
    source_key: ASSESSMENT_SOURCE_KEY,
    objectives,
    methods,
    objects: methods.map((entry) => entry.objects),
    procedure_text: objectives.map((entry) => entry.prose).join(' ').trim(),
  };
}

function oscalModel(document) {
  if (document?.catalog) return 'catalog';
  if (document?.profile) return 'profile';
  if (document?.['component-definition']) return 'component-definition';
  if (document?.['assessment-plan']) return 'assessment-plan';
  return null;
}

export function classifyOscalDocument(document) {
  const model = oscalModel(document);
  if (!model) {
    throw new Error(`Unsupported OSCAL document model. Supported models: ${SUPPORTED_OSCAL_MODELS.join(', ')}`);
  }
  return model;
}

export function normalize80053Id(oscalId) {
  return String(oscalId || '').toUpperCase();
}

export function normalize800171Id(oscalId) {
  const match = String(oscalId || '').match(/(\d{2})\.(\d{2})\.(\d{2})/);
  if (!match) return oscalId;
  return `${Number(match[1])}.${Number(match[2])}.${Number(match[3])}`;
}

export function normalize800172Id(oscalId) {
  const match = String(oscalId || '').match(/(\d{2})\.(\d{2})\.(\d{2})([A-Z]?)/i);
  if (!match) return oscalId;
  return `${Number(match[1])}.${Number(match[2])}.${Number(match[3])}${match[4]?.toUpperCase() || ''}`;
}

function walk80053(nodes, familyTitle, records, sourceKey) {
  for (const node of nodes || []) {
    const family = node.class === 'family' ? node.title : familyTitle;
    if (node.controls) walk80053(node.controls, family, records, sourceKey);
    if (node.groups) walk80053(node.groups, family, records, sourceKey);

    const cls = node.class || '';
    if (!node.id) continue;
    if (cls === 'SP800-53' || cls === 'SP800-53-enhancement') {
      const assessment = buildAssessmentMetadata(node);
      records.push({
        id: normalize80053Id(node.id),
        type: '800-53-control',
        framework: '800-53',
        title: node.title || normalize80053Id(node.id),
        family: family || 'General',
        description: descriptionFromControl(node),
        source: { key: sourceKey },
        metadata: assessment ? { assessment } : undefined,
      });
    }
  }
}

export function parse80053Catalog(catalogJson, sourceKey) {
  if (classifyOscalDocument(catalogJson) !== 'catalog') {
    throw new Error('Expected OSCAL catalog document');
  }
  const records = [];
  walk80053(catalogJson.catalog?.groups, null, records, sourceKey);
  return {
    schema_version: '1.0',
    source_key: sourceKey,
    records,
  };
}

function walkCsf(nodes, records) {
  for (const node of nodes || []) {
    if (node.controls) walkCsf(node.controls, records);
    if (node.groups) walkCsf(node.groups, records);
    if (node.class === 'subcategory' && node.id) {
      records.push({
        id: node.id,
        type: 'csf-subcategory',
        framework: 'csf',
        title: node.title || node.id,
        description: descriptionFromControl(node),
      });
    }
  }
}

export function parseCsfCatalog(catalogJson, sourceKey) {
  if (classifyOscalDocument(catalogJson) !== 'catalog') {
    throw new Error('Expected OSCAL catalog document');
  }
  const records = [];
  walkCsf(catalogJson.catalog?.groups, records);
  return {
    schema_version: '1.0',
    source_key: sourceKey,
    records,
  };
}

function walk800171(nodes, familyTitle, records) {
  for (const node of nodes || []) {
    const family = node.class === 'family' ? node.title : familyTitle;
    if (node.controls) walk800171(node.controls, family, records);
    if (node.groups) walk800171(node.groups, family, records);
    if (node.class === 'requirement' && node.id) {
      const id = normalize800171Id(node.id);
      records.push({
        id,
        type: '800-171-requirement',
        framework: '800-171',
        title: node.title || id,
        family: family || 'Requirements',
        description: descriptionFromControl(node),
      });
    }
  }
}

export function parse800171Catalog(catalogJson, sourceKey) {
  if (classifyOscalDocument(catalogJson) !== 'catalog') {
    throw new Error('Expected OSCAL catalog document');
  }
  const records = [];
  walk800171(catalogJson.catalog?.groups, null, records);
  return {
    schema_version: '1.0',
    source_key: sourceKey,
    records,
  };
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
      continue;
    }
    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(field);
      if (row.some((entry) => entry.trim())) rows.push(row);
      row = [];
      field = '';
      continue;
    }
    field += char;
  }
  row.push(field);
  if (row.some((entry) => entry.trim())) rows.push(row);
  return rows;
}

export function parse800171CsvCatalog(csvText, sourceKey) {
  const [header = [], ...rows] = parseCsvRows(csvText);
  const columnIndex = (name) => header.findIndex((entry) => cleanText(entry).toLowerCase() === name.toLowerCase());
  const familyColumn = columnIndex('Family');
  const identifierColumn = columnIndex('Identifier');
  const requirementColumn = columnIndex('Security Requirement');
  const discussionColumn = columnIndex('Discussion');

  const records = rows
    .filter((row) => row[identifierColumn])
    .map((row) => ({
      id: normalize800171Id(row[identifierColumn]),
      type: '800-171-requirement',
      framework: '800-171',
      title: normalize800171Id(row[identifierColumn]),
      family: cleanText(row[familyColumn]) || 'Requirements',
      description: cleanText([row[requirementColumn], row[discussionColumn]].filter(Boolean).join(' ')),
    }));

  return {
    schema_version: '1.0',
    source_key: sourceKey,
    records,
  };
}

function walk800172(nodes, familyTitle, records) {
  for (const node of nodes || []) {
    const family = node.class === 'family' ? node.title : familyTitle;
    if (node.controls) walk800172(node.controls, family, records);
    if (node.groups) walk800172(node.groups, family, records);
    if (node.class === 'security_requirement' && node.id) {
      const id = normalize800172Id(node.id);
      records.push({
        id,
        type: '800-172-requirement',
        framework: '800-172',
        title: node.title || id,
        family: family || 'Requirements',
        description: descriptionFromControl(node),
      });
    }
  }
}

export function parse800172Catalog(catalogJson, sourceKey) {
  if (classifyOscalDocument(catalogJson) !== 'catalog') {
    throw new Error('Expected OSCAL catalog document');
  }
  const records = [];
  walk800172(catalogJson.catalog?.groups, null, records);
  return {
    schema_version: '1.0',
    source_key: sourceKey,
    records,
  };
}

export function buildSearchTokens(record) {
  const parts = [record.id, record.title, record.family, record.framework, record.type]
    .filter(Boolean)
    .join(' ');
  return parts.toLowerCase();
}
