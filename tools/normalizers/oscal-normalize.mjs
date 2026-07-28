#!/usr/bin/env node
/**
 * Normalize NIST OSCAL documents into Control Atlas source record arrays.
 */

const MAX_DESCRIPTION = 1200;
const ASSESSMENT_SOURCE_KEY = 'nist-800-53a-assessment-procedures';
const SUPPORTED_OSCAL_MODELS = ['catalog', 'profile', 'component-definition', 'assessment-plan'];

const ASSESSMENT_PART_NAMES = new Set(['assessment-objective', 'assessment-method', 'assessment-objects', 'objective']);
const INSERT_PATTERN = /\{\{\s*insert:\s*param,\s*([\w.-]+)\s*\}\}/g;
const UNRESOLVED_ASSIGNMENT = '[Assignment: organization-defined value]';

/**
 * Build a resolver function that substitutes `{{ insert: param, <id> }}` moustaches
 * with human-readable Assignment/Selection brackets, given one or more OSCAL
 * `params` arrays to look the referenced param up in (control's own params first,
 * then parent-control params for enhancements, then any additional pools supplied).
 */
function createParamResolver(...paramSources) {
  const paramIndex = new Map();
  for (const source of paramSources) {
    for (const param of source || []) {
      if (param?.id && !paramIndex.has(param.id)) paramIndex.set(param.id, param);
    }
  }

  function resolveParam(paramId, seen) {
    const param = paramIndex.get(paramId);
    if (!param) return UNRESOLVED_ASSIGNMENT;
    if (seen.has(paramId)) return UNRESOLVED_ASSIGNMENT;
    seen.add(paramId);
    if (param.select) {
      const select = param.select;
      const choices = (select.choice || []).map((choice) => resolveText(String(choice || ''), seen));
      const label = select['how-many'] === 'one-or-more' ? 'Selection (one or more): ' : 'Selection: ';
      return `[${label}${choices.join('; ')}]`;
    }
    if (param.label) {
      return `[Assignment: ${resolveText(String(param.label), seen)}]`;
    }
    return UNRESOLVED_ASSIGNMENT;
  }

  function resolveText(text, seen = new Set()) {
    return String(text || '').replace(INSERT_PATTERN, (_match, paramId) => resolveParam(paramId, new Set(seen)));
  }

  return resolveText;
}

function cleanText(value, resolveInserts) {
  const text = resolveInserts ? resolveInserts(String(value || '')) : String(value || '').replace(/\{\{[^}]+\}\}/g, '');
  return text.replace(/\s+/g, ' ').trim();
}

function collectProse(parts, out, resolveInserts) {
  for (const part of parts || []) {
    if (ASSESSMENT_PART_NAMES.has(part.name)) continue;
    const prose = cleanText(part.prose, resolveInserts);
    if (prose) out.push(prose);
    if (part.parts) collectProse(part.parts, out, resolveInserts);
  }
}

function truncateAtBracket(text) {
  if (text.length <= MAX_DESCRIPTION) return text;
  const truncated = text.slice(0, MAX_DESCRIPTION);
  const lastCloseBracket = truncated.lastIndexOf(']');
  const lastOpenBracket = truncated.lastIndexOf('[');
  let cut;
  if (lastOpenBracket > lastCloseBracket) {
    // Mid-bracket: cut before the open bracket instead of splitting it.
    cut = lastOpenBracket;
  } else {
    const lastSentenceEnd = Math.max(truncated.lastIndexOf('. '), lastCloseBracket + 1);
    cut = lastSentenceEnd > 0 ? lastSentenceEnd : truncated.length;
  }
  return `${truncated.slice(0, cut).trim()}...`;
}

function descriptionFromControl(control, resolveInserts) {
  const chunks = [];
  collectProse(control.parts, chunks, resolveInserts);
  if (!chunks.length && control.title) chunks.push(control.title);
  const text = chunks.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  if (!text) return control.title || control.id;
  return truncateAtBracket(text);
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

function splitAssessmentObjects(value, resolveInserts) {
  return String(value || '')
    .split(/\n\s*\n/g)
    .map((entry) => cleanText(entry, resolveInserts))
    .filter(Boolean);
}

function flattenAssessmentObjectives(parts, resolveInserts, entries = []) {
  for (const part of parts || []) {
    if (part.name !== 'assessment-objective') continue;
    const prose = cleanText(part.prose, resolveInserts);
    if (prose) {
      entries.push({
        id: part.id || '',
        label: propValue(part.props, 'label') || part.id || '',
        prose,
        statement_refs: assessmentLinks(part),
      });
    }
    flattenAssessmentObjectives(part.parts, resolveInserts, entries);
  }
  return entries;
}

function collectAssessmentMethods(parts, resolveInserts) {
  return (parts || [])
    .filter((part) => part.name === 'assessment-method')
    .map((part) => ({
      id: part.id || '',
      label: propValue(part.props, 'label') || part.id || '',
      method: propValue(part.props, 'method') || '',
      objects: (part.parts || [])
        .filter((child) => child.name === 'assessment-objects')
        .flatMap((child) => splitAssessmentObjects(child.prose, resolveInserts)),
    }))
    .filter((entry) => entry.method || entry.objects.length);
}

function buildAssessmentMetadata(control, resolveInserts) {
  const objectives = flattenAssessmentObjectives(control.parts, resolveInserts);
  const methods = collectAssessmentMethods(control.parts, resolveInserts);
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

function isWithdrawn(node) {
  return propValue(node.props, 'status') === 'withdrawn';
}

function supersededByIds(node) {
  return (node.links || [])
    .filter((link) => link.rel === 'incorporated-into')
    .map((link) => normalize80053Id(String(link.href || '').replace(/^#/, '')))
    .filter(Boolean);
}

function buildControlRecord(node, family, sourceKey, resolveInserts) {
  const withdrawn = isWithdrawn(node);
  const assessment = withdrawn ? null : buildAssessmentMetadata(node, resolveInserts);
  const desc = withdrawn
    ? (node.title || normalize80053Id(node.id))
    : descriptionFromControl(node, resolveInserts);
  const supersededBy = withdrawn ? supersededByIds(node) : [];
  const metadata = {
    ...(assessment ? { assessment } : {}),
    ...(supersededBy.length ? { superseded_by: supersededBy } : {}),
  };
  return {
    id: normalize80053Id(node.id),
    type: '800-53-control',
    framework: '800-53',
    title: node.title || normalize80053Id(node.id),
    family: family || 'General',
    description: desc,
    source: { key: sourceKey },
    status: withdrawn ? 'withdrawn' : undefined,
    metadata: Object.keys(metadata).length ? metadata : undefined,
  };
}

function walk80053(nodes, familyTitle, records, sourceKey, parentParams) {
  for (const node of nodes || []) {
    const family = node.class === 'family' ? node.title : familyTitle;
    const cls = node.class || '';

    if (cls === 'SP800-53' && node.controls) {
      // Base control: build a sibling pool of enhancement params so cross-references
      // between enhancements under the same base (e.g. SC-42(2) -> SC-42(1) params)
      // resolve without a control needing every param defined on itself.
      const siblingEnhancementParams = node.controls.flatMap((enhancement) => enhancement.params || []);
      walk80053(node.controls, family, records, sourceKey, [...(node.params || []), ...siblingEnhancementParams]);
    } else if (node.controls) {
      walk80053(node.controls, family, records, sourceKey, parentParams);
    }
    if (node.groups) walk80053(node.groups, family, records, sourceKey, parentParams);

    if (!node.id) continue;
    if (cls === 'SP800-53' || cls === 'SP800-53-enhancement') {
      const resolveInserts = createParamResolver(node.params, parentParams);
      records.push(buildControlRecord(node, family, sourceKey, resolveInserts));
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

function walkCsf(nodes, functionCtx, categoryCtx, records) {
  for (const node of nodes || []) {
    const nextFunctionCtx =
      node.class === 'function'
        ? { id: node.id, title: node.title }
        : functionCtx;
    const nextCategoryCtx =
      node.class === 'category' ? { id: node.id, title: node.title } : categoryCtx;
    if (node.controls) walkCsf(node.controls, nextFunctionCtx, nextCategoryCtx, records);
    if (node.groups) walkCsf(node.groups, nextFunctionCtx, nextCategoryCtx, records);
    if (node.class === 'subcategory' && node.id) {
      const desc = descriptionFromControl(node);
      records.push({
        id: node.id,
        type: 'csf-subcategory',
        framework: 'csf',
        title: node.title || node.id,
        description: desc,
        function_id: nextFunctionCtx?.id || null,
        function: nextFunctionCtx?.title || null,
        category_id: nextCategoryCtx?.id || null,
        category: nextCategoryCtx?.title || null,
      });
    }
  }
}

export function parseCsfCatalog(catalogJson, sourceKey) {
  if (classifyOscalDocument(catalogJson) !== 'catalog') {
    throw new Error('Expected OSCAL catalog document');
  }
  const records = [];
  walkCsf(catalogJson.catalog?.groups, null, null, records);
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
      const desc = descriptionFromControl(node);
      records.push({
        id,
        type: '800-171-requirement',
        framework: '800-171',
        title: node.title || id,
        family: family || 'Requirements',
        description: desc,
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
    .map((row) => {
      const desc = cleanText([row[requirementColumn], row[discussionColumn]].filter(Boolean).join(' '));
      const id = normalize800171Id(row[identifierColumn]);
      return {
        id,
        type: '800-171-requirement',
        framework: '800-171',
        title: id,
        family: cleanText(row[familyColumn]) || 'Requirements',
        description: desc,
      };
    });

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
      const desc = descriptionFromControl(node);
      records.push({
        id,
        type: '800-172-requirement',
        framework: '800-172',
        title: node.title || id,
        family: family || 'Requirements',
        description: desc,
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
