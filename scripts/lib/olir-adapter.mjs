import { createHash } from 'node:crypto';
import { read, utils } from 'xlsx';
import { normalize80053Id } from './oscal-normalize.mjs';

export function checksum(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function parseControlList(value = '') {
  return String(value)
    .split(/[,;]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => normalize80053Id(item.replace(/\s*\([^)]*\)/g, '').trim()))
    .filter(Boolean);
}

function extractSubcategoryId(value = '') {
  const match = String(value).trim().match(/^([A-Z]{2,3}\.[A-Z]{2,3}-\d{2})/);
  return match ? match[1] : null;
}

function extractCsf11Id(value = '') {
  const match = String(value).trim().match(/^([A-Z]{2,3}\.[A-Z]{2,3}-\d+)/);
  return match ? match[1] : null;
}

export function parseCsf11To80053Sheet(buffer) {
  const workbook = read(buffer);
  const sheet = workbook.Sheets['CSF to SP 800-53r5'];
  if (!sheet) throw new Error('CSF to SP 800-53r5 sheet not found');
  const rows = utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const relationships = [];
  let currentSubcategory = null;

  for (const row of rows) {
    const subcategoryCell = row[2] || '';
    const controlsCell = row[3] || '';
    const subcategoryId = extractCsf11Id(subcategoryCell);
    if (subcategoryId) currentSubcategory = subcategoryId;
    if (!currentSubcategory || !controlsCell) continue;
    for (const controlId of parseControlList(controlsCell)) {
      relationships.push({
        source_id: controlId,
        target_id: currentSubcategory,
        relationship_type: 'maps_to',
        why: `Official NIST supplemental mapping associates SP 800-53 ${controlId} with CSF 1.1 ${currentSubcategory}.`,
        source_locator: `CSF to SP 800-53r5#${controlId}->${currentSubcategory}`,
        olir_status: 'final',
        owner_authority: true,
        submitter: 'NIST',
      });
    }
  }

  return relationships;
}

export function parseCsf11ToCsf20Crosswalk(buffer) {
  const workbook = read(buffer);
  const sheet = workbook.Sheets.Relationships || workbook.Sheets[workbook.SheetNames[0]];
  const rows = utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const csf20ToCsf11 = new Map();

  for (const row of rows.slice(1)) {
    const csf20 = extractSubcategoryId(row[0] || '');
    const csf11 = extractCsf11Id(row[2] || '');
    if (!csf20 || !csf11) continue;
    if (!csf20ToCsf11.has(csf20)) csf20ToCsf11.set(csf20, new Set());
    csf20ToCsf11.get(csf20).add(csf11);
  }

  return csf20ToCsf11;
}

export function compose80053ToCsf20Relationships(csf11To80053, csf20ToCsf11) {
  const csf11ByControl = new Map();
  for (const rel of csf11To80053) {
    if (!csf11ByControl.has(rel.source_id)) csf11ByControl.set(rel.source_id, new Set());
    csf11ByControl.get(rel.source_id).add(rel.target_id);
  }

  const relationships = [];
  const seen = new Set();
  for (const [csf20, csf11Set] of csf20ToCsf11.entries()) {
    for (const controlId of csf11ByControl.keys()) {
      const csf11Targets = csf11ByControl.get(controlId);
      const overlap = [...csf11Set].filter((id) => csf11Targets.has(id));
      if (!overlap.length) continue;
      const signature = `${controlId}|${csf20}`;
      if (seen.has(signature)) continue;
      seen.add(signature);
      relationships.push({
        source_id: controlId,
        target_id: csf20,
        relationship_type: 'maps_to',
        why: `Composed from official NIST CSF 1.1→800-53 supplemental mapping and CSF 1.1→2.0 OLIR crosswalk via ${overlap.join(', ')}.`,
        source_locator: `composed#${controlId}->${csf20}`,
        olir_status: 'final',
        owner_authority: true,
        submitter: 'NIST',
      });
    }
  }

  return relationships;
}

export function parseOlirCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return [];
  const headers = lines[0].split(',').map((item) => item.trim().toLowerCase());
  const focalIdx = headers.findIndex((item) => item.includes('focal'));
  const referenceIdx = headers.findIndex((item) => item.includes('reference'));
  const relationshipIdx = headers.findIndex((item) => item.includes('relationship'));
  const statusIdx = headers.findIndex((item) => item.includes('status'));

  return lines.slice(1).map((line) => {
    const cols = line.split(',');
    return {
      source_id: cols[focalIdx]?.trim(),
      target_id: cols[referenceIdx]?.trim(),
      relationship_type: cols[relationshipIdx]?.trim() || 'maps_to',
      olir_status: cols[statusIdx]?.trim() || 'final',
      why: 'Parsed from OLIR CSV fixture.',
      source_locator: `csv#${cols[focalIdx]?.trim()}->${cols[referenceIdx]?.trim()}`,
      owner_authority: true,
      submitter: 'NIST',
    };
  }).filter((item) => item.source_id && item.target_id);
}

export async function fetchBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

export async function build80053ToCsf20Map(options = {}) {
  const supplementalUrl = options.supplementalUrl
    || 'https://csrc.nist.gov/files/pubs/sp/800/53/r5/upd1/final/docs/csf-pf-to-sp800-53r5-mappings.xlsx';
  const crosswalkUrl = options.crosswalkUrl
    || 'https://csrc.nist.gov/csrc/media/Projects/olir/documents/submissions/CSFv1.1_to_CSFv2.0_CROSSWALK_20240220.xlsx';

  const supplementalBuffer = options.supplementalBuffer || await fetchBuffer(supplementalUrl);
  const crosswalkBuffer = options.crosswalkBuffer || await fetchBuffer(crosswalkUrl);
  const checksumValue = checksum(Buffer.concat([supplementalBuffer, crosswalkBuffer]));

  const csf11To80053 = parseCsf11To80053Sheet(supplementalBuffer);
  const csf20ToCsf11 = parseCsf11ToCsf20Crosswalk(crosswalkBuffer);
  const relationships = compose80053ToCsf20Relationships(csf11To80053, csf20ToCsf11);

  return {
    schema_version: '2.0',
    source_key: 'nist-csf-53-supplemental',
    source_artifact: supplementalUrl,
    source_version: 'csf11-csf20-composed',
    snapshot_date: new Date().toISOString().slice(0, 10),
    checksum: checksumValue,
    provenance: 'Official NIST CSF 1.1→800-53 supplemental mapping composed with CSF 1.1→2.0 OLIR crosswalk',
    olir_status: 'final',
    owner_authority: true,
    submitter: 'NIST',
    relationships,
  };
}
