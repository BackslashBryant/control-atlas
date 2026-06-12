import { createHash } from 'node:crypto';
import { read, utils } from 'xlsx';
import { normalize80053Id } from './oscal-normalize.mjs';

export function checksum(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

export function parseOlirExcel(buffer, options = {}) {
  const workbook = read(buffer);
  const sheetName = workbook.SheetNames.find((name) =>
    ['relationships', 'olir', 'mapping', 'crosswalk'].some((k) => name.toLowerCase().includes(k))
  ) || workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`Relationships sheet not found in workbook: ${sheetName}`);

  const rows = utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const relationships = [];
  const seen = new Set();

  if (!rows.length) return [];

  const headers = rows[0].map((h) => String(h).trim().replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').toLowerCase());
  const focalIdx = headers.findIndex((h) => h.includes('focal'));
  const referenceIdx = headers.findIndex((h) => h.includes('reference'));
  const commentIdx = headers.findIndex((h) => h.includes('comment'));
  const strengthIdx = headers.findIndex((h) => h.includes('strength') || h.includes('relationship'));

  if (focalIdx === -1 || referenceIdx === -1) {
    throw new Error('Focal or Reference columns not found in OLIR sheet');
  }

  for (const row of rows.slice(1)) {
    const focalCell = String(row[focalIdx] || '').trim();
    const referenceCell = String(row[referenceIdx] || '').trim();
    if (!focalCell || !referenceCell) continue;

    const focalId = focalCell.replace(/\r?\n/g, '').trim();
    // Split references by comma, semicolon, or newline
    const refIds = referenceCell.split(/[,;\n]/).map((r) => r.trim()).filter(Boolean);

    for (const rawRefId of refIds) {
      const refId = rawRefId.replace(/\r?\n/g, '').trim();
      const controlId = normalize80053Id(refId);
      if (!controlId) continue;

      const signature = `${controlId}|${focalId}`;
      if (seen.has(signature)) continue;
      seen.add(signature);

      const comment = row[commentIdx] ? String(row[commentIdx]).trim() : '';
      const strength = row[strengthIdx] ? String(row[strengthIdx]).trim() : '';

      relationships.push({
        source_id: controlId,
        target_id: focalId,
        relationship_type: strength.toLowerCase() === 'equivalent' ? 'equivalent_to' : 'maps_to',
        why: comment || `NIST OLIR concept crosswalk associates SP 800-53 ${controlId} with CSF 2.0 ${focalId}.`,
        source_locator: `${sheetName}#${focalId}->${controlId}`,
        olir_status: options.status || 'draft',
        owner_authority: options.ownerAuthority !== false,
        submitter: options.submitter || 'NIST',
      });
    }
  }

  return relationships.sort((a, b) => a.source_id.localeCompare(b.source_id) || a.target_id.localeCompare(b.target_id));
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
  const url = options.url || 'https://csrc.nist.gov/csrc/media/projects/olir/documents/submissions/Cybersecurity_Framework_v2-0_Concept_Crosswalk_800-53_5_2_0_draft.xlsx';
  const buffer = options.buffer || await fetchBuffer(url);
  const checksumValue = checksum(buffer);

  const relationships = parseOlirExcel(buffer, {
    status: 'draft',
    ownerAuthority: true,
    submitter: 'NIST',
  });

  return {
    schema_version: '2.0',
    source_key: 'nist-olir-csf2-to-sp800-53',
    source_artifact: url,
    source_version: '2.0-draft',
    snapshot_date: new Date().toISOString().slice(0, 10),
    checksum: checksumValue,
    provenance: 'Official NIST Cybersecurity Framework 2.0 to SP 800-53 Rev 5.2.0 Concept Crosswalk (Draft)',
    olir_status: 'draft',
    owner_authority: true,
    submitter: 'NIST',
    relationships,
  };
}
