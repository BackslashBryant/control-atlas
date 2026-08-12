import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const CURATED = join(ROOT, 'data', 'curated', 'dod-zt');
const FRAGMENTS = join(CURATED, 'source-fragments');
const MAPS = join(ROOT, 'maps');
const CONTROL_RE = /\b([A-Z]{2,3})-(\d+(?:\(\d+\))?)(?![\w(])/g;
const CAPABILITY_HEADER_RE = /Capability\s+(\d+\.\d+):\s+([^\n]+)/g;
const INVALID_CONTROL_REFERENCE_REASONS = new Map([
  ['NSM-8', 'NSM-8 is a National Security Memorandum identifier, not an SP 800-53 control.'],
  ['EC-1', 'Figure EC-1 is a figure label in the Application and Workload appendix, not an SP 800-53 control.'],
  ['SAC-16(3)', 'The publisher prose writes SAC-16(3), but its same-sentence bracket citation identifies SC-16(3), which is captured separately.'],
  ['SC-4(26)', 'The publisher prose writes SC-4(26), but its same-sentence bracket citation identifies AC-4(26), which is captured separately.'],
  ['SC-4(10)', 'The publisher prose writes SC-4(10), but its same-sentence bracket citation identifies SI-4(10), which is captured separately.'],
  ['SA-18(8)', 'The publisher prose writes SA-18(8), but its same-sentence bracket citation identifies SA-17(8), which is captured separately.'],
  ['IA-4(14)', 'The publisher prose writes IA-4(14), but its same-sentence bracket citation identifies IR-4(14), which is captured separately.'],
]);

const DOCUMENTS = [
  {
    id: 'DOC-RA', title: 'DoD Zero Trust Reference Architecture v2.0',
    sourceKey: 'dod-zt-reference-architecture-v2', fragmentFile: 'ra.json', atlasRole: 'primary_publication',
    summary: { page: 9, start: 'Zero Trust is the term', end: '1.2 Purpose' },
    sections: [{ page: 9, title: 'Purpose and strategic goals' }, { page: 10, title: 'Scope and stakeholders' }],
  },
  {
    id: 'DOC-STRATEGY', title: 'DoD Zero Trust Strategy',
    sourceKey: 'dod-zt-strategy', fragmentFile: 'strategy.json', atlasRole: 'primary_publication',
    summary: { page: 6, start: 'This strategy lays out', end: 'To accelerate Zero Trust' },
    sections: [{ page: 5, title: 'Executive summary' }, { page: 6, title: 'Strategy and goals' }],
  },
  {
    id: 'DOC-CAPABILITIES', title: 'DoD Zero Trust Capabilities and Activities',
    sourceKey: 'dod-zt-capabilities', fragmentFile: 'capabilities.json', atlasRole: 'primary_publication',
    summary: { page: 1, start: 'Roadmap Updates', end: 'Notes' },
    sections: [{ page: 1, title: 'Roadmap updates' }, { page: 2, title: 'Capability model' }],
  },
  {
    id: 'DOC-ROADMAP', title: 'DoD Zero Trust Capability Execution Roadmap v1.1',
    sourceKey: 'dod-zt-execution-roadmap', fragmentFile: 'roadmap.json', atlasRole: 'primary_publication',
    summary: { page: 3, start: 'This update', end: '3' },
    sections: [{ page: 3, title: 'Roadmap update' }, { page: 4, title: 'Fiscal Year 2027 objective' }],
  },
  {
    id: 'DOC-OVERLAYS', title: 'DoD Zero Trust Overlays',
    sourceKey: 'dod-zt-overlays-2024', fragmentFile: 'overlays.json', atlasRole: 'primary_publication',
    summary: { page: 2, start: 'The Zero Trust Overlays are based', end: '• User.' },
    sections: [{ page: 2, title: 'Executive summary' }, { page: 3, title: 'Control mapping purpose' }],
    relationships: [
      { target_catalog: 'dod-zt', target_id: 'DOC-RA', relationship_type: 'references', source_locator: 'overlays.pdf#page=2' },
      { target_catalog: 'dod-zt', target_id: 'DOC-ROADMAP', relationship_type: 'references', source_locator: 'overlays.pdf#page=2' },
    ],
  },
  {
    id: 'DOC-OT', title: 'Zero Trust for Operational Technology Activities and Outcomes',
    sourceKey: 'dod-zt-operational-technology', fragmentFile: 'ot.json', atlasRole: 'primary_publication',
    summary: { page: 1, start: 'The ZT for OT Activities and Outcomes build', end: 'As defined in NIST SP 800-82' },
    sections: [{ page: 1, title: 'Scope and purpose' }, { page: 2, title: 'Operational technology considerations' }],
  },
  {
    id: 'DOC-NEWSLETTER-2024-11', title: 'DoD Zero Trust PfMO Newsletter — November 2024',
    sourceKey: 'dod-zt-newsletter-2024-11', fragmentFile: 'newsletter.json', atlasRole: 'supporting_resource',
    summary: { page: 1, start: 'MESSAGE FROM', end: null },
    sections: [{ page: 1, title: 'November 2024 newsletter' }],
  },
  {
    id: 'DOC-PLACEMATS', title: 'DoD Zero Trust Strategy Placemats',
    sourceKey: 'dod-zt-strategy-placemats', fragmentFile: 'placemats.json', atlasRole: 'supporting_resource',
    summary: { page: 1, start: 'DoD Information Enterprise', end: null },
    sections: [{ page: 1, title: 'Zero Trust framework placemat' }, { page: 2, title: 'Strategy placemat' }],
  },
];

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function cleanText(value) {
  return String(value || '').replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').trim();
}

function titleText(value) {
  return cleanText(value).replace(/\s+/g, ' ');
}

function tableRows(document, pattern) {
  const output = [];
  for (const page of document.pages || []) {
    for (const table of page.tables || []) {
      for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex += 1) {
        const row = table.rows[rowIndex];
        const id = cleanText(row[0]?.text);
        if (!pattern.test(id)) continue;
        output.push({ page: page.page, table: table.id, rowIndex, cells: row });
      }
    }
  }
  return output;
}

function sourceFragments(document, row) {
  return row.cells
    .map((cell) => ({
      document_key: document.document_key,
      page: row.page,
      table: row.table,
      row: cell.row,
      column: cell.column,
      bbox: cell.bbox,
      text: cleanText(cell.text),
      checksum: `sha256:${createHash('sha256').update(cleanText(cell.text)).digest('hex')}`,
      extraction_method: `pdfplumber-${document.extractor.version}-table-cell`,
    }))
    .filter((fragment) => fragment.text);
}

function locator(document, row) {
  return `${document.source.filename}#page=${row.page}&table=${row.table}&row=${row.rowIndex}`;
}

function splitList(value) {
  return cleanText(value)
    .split(/\n|\s*;\s*/)
    .map((entry) => entry.replace(/^\s*(?:\*|\d+[.)])\s*/, '').trim())
    .filter((entry) => entry && !/^none$/i.test(entry));
}

function assertUnique(records, label) {
  const seen = new Set();
  for (const record of records) {
    if (seen.has(record.id)) throw new Error(`Duplicate ${label} id: ${record.id}`);
    seen.add(record.id);
  }
}

export function parseCapabilitiesFromFragments(document) {
  const records = tableRows(document, /^\d+\.\d+$/).map((row) => {
    const values = row.cells.map((cell) => cleanText(cell.text));
    const id = values[0];
    const pillarNumber = Number(values[2].match(/^([1-7])\b/)?.[1] || id.split('.')[0]);
    return {
      id,
      pillar_id: `PILLAR-${pillarNumber}`,
      pillar_name: titleText(values[2].replace(/^\d+\s*-\s*/, '')),
      title: titleText(values[1]),
      description: values[3],
      outcome: values[4],
      impact: values[5],
      associated_activities: splitList(values[6]),
      level: 'Target',
      locator: locator(document, row),
      source_key: document.document_key,
      source_fragments: sourceFragments(document, row),
    };
  });
  assertUnique(records, 'DoD ZT capability');
  if (!records.length) throw new Error('DoD ZT capabilities source contained no capability table rows');
  return records;
}

export function parseActivitiesFromFragments(document) {
  const records = tableRows(document, /^\d+\.\d+\.\d+$/).map((row) => {
    const values = row.cells.map((cell) => cleanText(cell.text));
    const id = values[0];
    return {
      id,
      capability_id: id.split('.').slice(0, 2).join('.'),
      title: titleText(values[1]),
      pillar: titleText(values[2]),
      responsibility: values[3],
      activity_type: titleText(values[4]),
      duration: values[5],
      description: values[6],
      outcomes: values[7],
      end_state: values[8],
      predecessors: splitList(values[9]),
      successors: splitList(values[10]),
      level: /advanced/i.test(values[4]) ? 'Advanced' : 'Target',
      locator: locator(document, row),
      source_key: document.document_key,
      source_fragments: sourceFragments(document, row),
    };
  });
  assertUnique(records, 'DoD ZT activity');
  if (!records.length) throw new Error('DoD ZT activities source contained no activity table rows');
  return records;
}

export function parseOtActivitiesFromFragments(document) {
  const records = tableRows(document, /^\d+\.\d+\.\d+\.OT$/i).map((row) => {
    const values = row.cells.map((cell) => cleanText(cell.text));
    const id = values[0].toUpperCase();
    return {
      id,
      capability_id: id.split('.').slice(0, 2).join('.'),
      title: titleText(values[1]),
      pillar: titleText(values[2]),
      activity_type: titleText(values[3]),
      description: values[4],
      outcomes: values[5],
      predecessors: splitList(values[6]),
      successors: splitList(values[7]),
      level: /advanced/i.test(values[3]) ? 'Advanced' : 'Target',
      operational_technology: true,
      locator: locator(document, row),
      source_key: document.document_key,
      source_fragments: sourceFragments(document, row),
    };
  });
  assertUnique(records, 'DoD ZT OT activity');
  if (!records.length) throw new Error('DoD ZT OT source contained no activity table rows');
  return records;
}

function lineFragment(document, pageNumber, text) {
  const page = document.pages.find((entry) => entry.page === pageNumber);
  const line = page?.lines.find((entry) => entry.text.includes(text));
  return {
    document_key: document.document_key,
    page: pageNumber,
    bbox: line?.bbox || [0, 0, page?.width || 0, page?.height || 0],
    text,
    checksum: `sha256:${createHash('sha256').update(text).digest('hex')}`,
    extraction_method: `pdfplumber-${document.extractor.version}-line`,
  };
}

function lineBlockFragments(document, pageNumber, startMarker, endMarker = null) {
  const page = document.pages.find((entry) => entry.page === pageNumber);
  const lines = page?.lines || [];
  const start = lines.findIndex((entry) => entry.text.includes(startMarker));
  if (start < 0) throw new Error(`Could not locate ${startMarker} on page ${pageNumber} of ${document.document_key}`);
  const end = endMarker
    ? lines.findIndex((entry, index) => index > start && entry.text.includes(endMarker))
    : -1;
  return lines.slice(start, end < 0 ? lines.length : end).map((line) => ({
    document_key: document.document_key,
    page: pageNumber,
    bbox: line.bbox,
    text: line.text,
    checksum: `sha256:${createHash('sha256').update(line.text).digest('hex')}`,
    extraction_method: `pdfplumber-${document.extractor.version}-line`,
  }));
}

function extractNamedParagraphs(text, names) {
  const escaped = names.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const marker = new RegExp(`(?:^|\\n)(?:•\\s*)?(${escaped.join('|')}):?\\s*`, 'g');
  const matches = [...text.matchAll(marker)];
  return matches.map((match, index) => ({
    title: match[1],
    description: cleanText(text.slice(match.index + match[0].length, matches[index + 1]?.index ?? text.length)),
  }));
}

export function parseRaTaxonomy(document) {
  const page21 = document.pages.find((page) => page.page === 21)?.text || '';
  const pillarText = [22, 23].map((number) => document.pages.find((page) => page.page === number)?.text || '').join('\n');
  const tenetNames = ['Assume a Hostile Environment', 'Presume Breach', 'Never Trust, Always Verify', 'Scrutinize Explicitly', 'Apply Unified Analytics'];
  const pillarNames = ['User', 'Device', 'Network/Environment', 'Applications and Workload', 'Data', 'Visibility and Analytics', 'Automation and Orchestration'];
  const tenets = extractNamedParagraphs(page21, tenetNames).map((entry, index) => ({
    id: `TENET-${index + 1}`,
    title: entry.title,
    description: entry.description.replace(/^[.:]\s*/, ''),
    source_key: document.document_key,
    locator: `${document.source.filename}#page=21`,
    source_fragments: lineBlockFragments(document, 21, entry.title, tenetNames[index + 1]),
  }));
  const pillars = extractNamedParagraphs(pillarText, pillarNames).map((entry, index) => ({
    id: `PILLAR-${index + 1}`,
    number: index + 1,
    title: entry.title.replace('Network/Environment', 'Network and Environment'),
    family: 'Zero Trust Pillars',
    description: entry.description.replace(/^[.:]\s*/, '').replace(/\n\d+$/, '').trim(),
    source_key: document.document_key,
    locator: `${document.source.filename}#page=${index < 3 ? 22 : 23}`,
    source_fragments: lineBlockFragments(
      document,
      index < 3 ? 22 : 23,
      entry.title,
      (index === 2 || index === pillarNames.length - 1) ? null : pillarNames[index + 1],
    ),
  }));
  if (tenets.length !== 5) throw new Error(`Expected 5 DoD ZT tenets from source; found ${tenets.length}`);
  if (pillars.length !== 7) throw new Error(`Expected 7 DoD ZT pillars from source; found ${pillars.length}`);
  return { tenets, pillars };
}

export function normalizeControlId(raw) {
  const match = String(raw).match(/^([A-Z]{2,3})-(\d+)(?:\((\d+)\))?$/);
  if (!match) return null;
  return match[3] ? `${match[1]}-${match[2]}(${match[3]})` : `${match[1]}-${match[2]}`;
}

export function capabilityNodeId(capabilityId) {
  return `CAP-${String(capabilityId).replace('.', '-')}`;
}

export function activityNodeId(activityId) {
  return `ACT-${String(activityId).replace(/\./g, '-')}`;
}

export function extractOverlayRelationships(text, sourceKey = 'dod-zt-overlays-2024', validControlIds = null) {
  const headers = [];
  let match;
  while ((match = CAPABILITY_HEADER_RE.exec(text)) !== null) headers.push({ id: match[1], title: match[2].trim(), index: match.index });
  const relationships = [];
  const rejectedReferences = [];
  const rejectedSeen = new Set();
  const seen = new Set();
  for (let index = 0; index < headers.length; index += 1) {
    const block = text.slice(headers[index].index, headers[index + 1]?.index ?? text.length);
    for (const controlMatch of block.matchAll(CONTROL_RE)) {
      const controlId = normalizeControlId(controlMatch[0]);
      if (!controlId) continue;
      if (INVALID_CONTROL_REFERENCE_REASONS.has(controlId) || (validControlIds && !validControlIds.has(controlId))) {
        const rejectedKey = `${controlId}:${headers[index].id}`;
        if (!rejectedSeen.has(rejectedKey)) {
          rejectedSeen.add(rejectedKey);
          rejectedReferences.push({
            source_id: controlId,
            target_id: capabilityNodeId(headers[index].id),
            reason: INVALID_CONTROL_REFERENCE_REASONS.get(controlId)
              || 'Token is not a valid control identity in the attested NIST SP 800-53 Rev. 5 catalog; excluded rather than publishing a dangling relationship.',
          });
        }
        continue;
      }
      const targetId = capabilityNodeId(headers[index].id);
      const key = `${controlId}:${targetId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      relationships.push({
        source_id: controlId,
        target_id: targetId,
        relationship_type: 'supports',
        why: `DoD Zero Trust Overlays associates NIST SP 800-53 ${controlId} with capability ${headers[index].id} ${headers[index].title}.`,
        source_locator: `ZeroTrustOverlays-2024Feb.pdf#Capability-${headers[index].id}`,
        evidence_source: sourceKey,
      });
    }
  }
  return { relationships, capabilities: headers, rejected_references: rejectedReferences };
}

function documentLineFragments(extracted, pageNumber) {
  const page = extracted.pages.find((entry) => entry.page === pageNumber);
  if (!page) throw new Error(`Missing page ${pageNumber} of ${extracted.document_key}`);
  return (page.lines || []).map((line) => ({
    document_key: extracted.document_key,
    page: pageNumber,
    bbox: line.bbox,
    text: line.text,
    checksum: `sha256:${createHash('sha256').update(line.text).digest('hex')}`,
    extraction_method: `pdfplumber-${extracted.extractor.version}-line`,
  }));
}

function documentSummary(fragmentRoot, document) {
  const extracted = readJson(join(fragmentRoot, document.fragmentFile));
  const summaryFragments = lineBlockFragments(
    extracted,
    document.summary.page,
    document.summary.start,
    document.summary.end,
  );
  const documentSections = document.sections.map((section) => {
    const page = extracted.pages.find((entry) => entry.page === section.page);
    if (!page) throw new Error(`Missing page ${section.page} of ${extracted.document_key}`);
    return {
      id: `${document.id}-PAGE-${section.page}`,
      title: section.title,
      locator: `${extracted.source.filename}#page=${section.page}`,
      structured_content: [{
        type: 'paragraph',
        text: page.text,
        source_offset: { start: 0, end: page.text.length },
      }],
      source_fragments: documentLineFragments(extracted, section.page),
    };
  });
  return {
    id: document.id,
    title: document.title,
    source_key: document.sourceKey,
    locator: `${extracted.source.filename}#page=1`,
    description: summaryFragments.map((fragment) => fragment.text).join('\n'),
    description_source_fragments: summaryFragments,
    document_sections: documentSections,
    atlas_role: document.atlasRole,
    page_count: extracted.source.pages,
    byte_length: extracted.source.byte_length,
    retrieved_at: extracted.source.retrieved_at,
    checksum: extracted.source.sha256,
    source_url: extracted.source.url,
    relationships: document.relationships || [],
  };
}

export async function extractDodZeroTrust(options = {}) {
  const curatedRoot = options.curatedRoot || CURATED;
  const fragmentRoot = options.fragmentRoot || join(curatedRoot, 'source-fragments');
  mkdirSync(curatedRoot, { recursive: true });
  mkdirSync(MAPS, { recursive: true });
  for (const filename of ['ra.json', 'capabilities.json', 'ot.json', 'strategy.json', 'roadmap.json', 'overlays.json', 'newsletter.json', 'placemats.json']) {
    if (!existsSync(join(fragmentRoot, filename))) throw new Error(`Missing required DoD ZT source fragments: ${filename}`);
  }

  const ra = readJson(join(fragmentRoot, 'ra.json'));
  const capabilitiesSource = readJson(join(fragmentRoot, 'capabilities.json'));
  const otSource = readJson(join(fragmentRoot, 'ot.json'));
  const { tenets, pillars } = parseRaTaxonomy(ra);
  const capabilities = parseCapabilitiesFromFragments(capabilitiesSource);
  const activities = parseActivitiesFromFragments(capabilitiesSource);
  const otActivities = parseOtActivitiesFromFragments(otSource);
  const capabilityIds = new Set(capabilities.map((record) => record.id));
  const missingParents = [...activities, ...otActivities].filter((record) => !capabilityIds.has(record.capability_id));
  if (missingParents.length) throw new Error(`DoD ZT activities reference ${missingParents.length} missing capabilities`);

  const nistControls = readJson(join(ROOT, 'data', 'controls-800-53.json')).records || [];
  const validControlIds = new Set(nistControls.flatMap((record) => {
    const id = String(record.id);
    const parenthetical = id.replace(/^(\w+-\d+)\.(\d+)$/, '$1($2)');
    return parenthetical === id ? [id] : [id, parenthetical];
  }));
  const overlaySource = readJson(join(fragmentRoot, 'overlays.json'));
  const overlayText = (overlaySource.pages || []).map((page) => page.text).join('\n');
  const overlay = extractOverlayRelationships(overlayText, 'dod-zt-overlays-2024', validControlIds);
  const capabilityTitles = new Map(capabilities.map((record) => [capabilityNodeId(record.id), record.title]));
  for (const relationship of overlay.relationships) {
    const title = capabilityTitles.get(relationship.target_id);
    if (title) relationship.why = `DoD Zero Trust Overlays associates NIST SP 800-53 ${relationship.source_id} with ${title}.`;
  }
  const priorOverlayMap = readJson(join(MAPS, '800-53-to-dod-zt-overlays.json'));
  writeJson(join(MAPS, '800-53-to-dod-zt-overlays.json'), {
    ...priorOverlayMap,
    checksum: overlaySource.source.sha256,
    relationships: overlay.relationships,
    rejected_references: overlay.rejected_references,
  });

  const documents = DOCUMENTS.map((document) => documentSummary(fragmentRoot, document));
  const atlasDocuments = documents.filter((document) => document.atlas_role === 'primary_publication');
  const supportingDocuments = documents.filter((document) => document.atlas_role === 'supporting_resource');
  const taxonomy = {
    schema_version: '2.0',
    tenets,
    pillars,
    overlay_sections: [],
    documents,
  };
  const sourceManifest = {
    schema_version: '1.0',
    documents: documents.map((document) => ({
      source_key: document.source_key,
      source_url: document.source_url,
      retrieved_at: document.retrieved_at,
      byte_length: document.byte_length,
      checksum: document.checksum,
      pages: document.page_count,
      atlas_role: document.atlas_role,
    })),
    reconciliation: {
      documents_extracted: documents.length,
      atlas_documents: atlasDocuments.length,
      supporting_documents: supportingDocuments.length,
      pages_extracted: documents.reduce((total, document) => total + document.page_count, 0),
      tenets: tenets.length,
      pillars: pillars.length,
      capabilities: capabilities.length,
      enterprise_activities: activities.length,
      operational_technology_activities: otActivities.length,
      total_activities: activities.length + otActivities.length,
      atlas_records_expected: atlasDocuments.length + tenets.length + pillars.length + capabilities.length + activities.length + otActivities.length,
      synthetic_records: 0,
      parser_failures: 0,
      overlay_relationships_discovered: overlay.relationships.length + overlay.rejected_references.length,
      overlay_relationships_published: overlay.relationships.length,
      overlay_relationships_rejected: overlay.rejected_references.length,
    },
  };
  writeJson(join(curatedRoot, 'taxonomy.json'), taxonomy);
  writeJson(join(curatedRoot, 'capabilities.json'), { schema_version: '2.0', source_key: 'dod-zt-capabilities', records: capabilities });
  writeJson(join(curatedRoot, 'activities.json'), { schema_version: '2.0', source_key: 'dod-zt-capabilities', records: [...activities, ...otActivities] });
  writeJson(join(curatedRoot, 'source-manifest.json'), sourceManifest);

  return { taxonomy, ...sourceManifest.reconciliation };
}

async function main() {
  const result = await extractDodZeroTrust();
  const { taxonomy: _taxonomy, ...summary } = result;
  console.log(JSON.stringify(summary, null, 2));
}

if (process.argv[1] && process.argv[1].endsWith('dod-zt-extract.mjs')) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
