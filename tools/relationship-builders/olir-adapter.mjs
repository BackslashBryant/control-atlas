import { createHash } from 'node:crypto';
import readXlsxFile from 'read-excel-file/node';
import { normalize80053Id } from '../normalizers/oscal-normalize.mjs';

export function checksum(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function normalizeCell(value) {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export async function parseOlirExcel(buffer, options = {}) {
  const sheets = await readXlsxFile(buffer);
  const selected = sheets.find((entry) =>
    ['relationships', 'olir', 'mapping', 'crosswalk'].some((keyword) => entry.sheet.toLowerCase().includes(keyword)),
  ) || sheets[0];
  if (!selected) throw new Error('Relationships sheet not found in workbook');

  const rows = selected.data.map((row) => row.map(normalizeCell));
  const relationships = [];
  const seen = new Set();

  if (!rows.length) return [];

  const headers = rows[0].map((header) => String(header).trim().replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').toLowerCase());
  const focalIdx = headers.findIndex((header) => header.includes('focal'));
  const referenceIdx = headers.findIndex((header) => header.includes('reference'));
  const commentIdx = headers.findIndex((header) => header.includes('comment'));
  const strengthIdx = headers.findIndex((header) => header.includes('strength') || header.includes('relationship'));

  if (focalIdx === -1 || referenceIdx === -1) {
    throw new Error('Focal or Reference columns not found in OLIR sheet');
  }

  for (const row of rows.slice(1)) {
    const focalCell = String(row[focalIdx] || '').trim();
    const referenceCell = String(row[referenceIdx] || '').trim();
    if (!focalCell || !referenceCell) continue;

    const focalId = focalCell.replace(/\r?\n/g, '').trim();
    const refIds = referenceCell.split(/[,;\n]/).map((ref) => ref.trim()).filter(Boolean);

    for (const rawRefId of refIds) {
      const refId = rawRefId.replace(/\r?\n/g, '').trim();
      const controlId = normalize80053Id(refId);
      if (!controlId) continue;

      const signature = `${controlId}|${focalId}`;
      if (seen.has(signature)) continue;
      seen.add(signature);

      const comment = row[commentIdx] ? String(row[commentIdx]).trim() : '';
      const strength = row[strengthIdx] ? String(row[strengthIdx]).trim() : '';

      const rawRelationshipType = strength || 'Concept Crosswalk';
      let relationshipType = 'Concept Crosswalk';
      const sLower = rawRelationshipType.toLowerCase();
      if (sLower.includes('equal') || sLower.includes('equivalent')) relationshipType = 'Set Theory: Equal';
      else if (sLower.includes('subset')) relationshipType = 'Set Theory: Subset';
      else if (sLower.includes('superset')) relationshipType = 'Set Theory: Superset';
      else if (sLower.includes('support')) relationshipType = 'Supportive';
      else if (sLower.includes('derived')) relationshipType = 'Derived Relationship Mapping';

      relationships.push({
        source_id: controlId,
        target_id: focalId,
        relationship_type: relationshipType,
        raw_relationship_type: rawRelationshipType,
        why: comment || `NIST OLIR concept crosswalk associates SP 800-53 ${controlId} with CSF 2.0 ${focalId}.`,
        source_locator: `${selected.sheet}#${focalId}->${controlId}`,
        olir_status: options.status || 'final',
        owner_authority: options.ownerAuthority !== false,
        submitter: options.submitter || 'NIST',
      });
    }
  }

  return relationships.sort((left, right) => left.source_id.localeCompare(right.source_id) || left.target_id.localeCompare(right.target_id));
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
      relationship_type: cols[relationshipIdx]?.trim() || 'Concept Crosswalk',
      raw_relationship_type: cols[relationshipIdx]?.trim() || 'Concept Crosswalk',
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
  const url = options.url || 'https://csrc.nist.gov/csrc/media/projects/olir/documents/submissions/CSFv2.0_to_SP800_53r5_olir.xlsx';
  const buffer = options.buffer || await fetchBuffer(url);
  const checksumValue = checksum(buffer);

  const relationships = await parseOlirExcel(buffer, {
    status: 'final',
    ownerAuthority: true,
    submitter: 'NIST',
  });

  return {
    schema_version: '2.0',
    source_key: 'nist-olir-csf2-to-sp800-53',
    source_artifact: url,
    source_version: '2.0-final',
    snapshot_date: new Date().toISOString().slice(0, 10),
    checksum: checksumValue,
    provenance: 'Official NIST Cybersecurity Framework 2.0 to SP 800-53 Rev 5.2.0 Concept Crosswalk (Final)',
    olir_status: 'final',
    owner_authority: true,
    submitter: 'NIST',
    relationships,
  };
}
