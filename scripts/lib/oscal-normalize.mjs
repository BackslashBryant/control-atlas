#!/usr/bin/env node
/**
 * Normalize NIST OSCAL catalog JSON into GovFrame source record arrays.
 */

const MAX_DESCRIPTION = 1200;

function collectProse(parts, out) {
  for (const part of parts || []) {
    if (part.prose) out.push(part.prose.replace(/\{\{[^}]+\}\}/g, '').trim());
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

export function normalize80053Id(oscalId) {
  return String(oscalId || '').toUpperCase();
}

export function normalize800171Id(oscalId) {
  const match = String(oscalId || '').match(/(\d{2})\.(\d{2})\.(\d{2})/);
  if (!match) return oscalId;
  return `${Number(match[1])}.${Number(match[2])}.${Number(match[3])}`;
}

function walk80053(nodes, familyTitle, records) {
  for (const node of nodes || []) {
    const family = node.class === 'family' ? node.title : familyTitle;
    if (node.controls) walk80053(node.controls, family, records);
    if (node.groups) walk80053(node.groups, family, records);

    const cls = node.class || '';
    if (!node.id) continue;
    if (cls === 'SP800-53' || cls === 'SP800-53-enhancement') {
      records.push({
        id: normalize80053Id(node.id),
        type: '800-53-control',
        framework: '800-53',
        title: node.title || normalize80053Id(node.id),
        family: family || 'General',
        description: descriptionFromControl(node),
      });
    }
  }
}

export function parse80053Catalog(catalogJson, sourceKey) {
  const records = [];
  walk80053(catalogJson.catalog?.groups, null, records);
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
  const records = [];
  walk800171(catalogJson.catalog?.groups, null, records);
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
