import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { strFromU8, unzipSync } from 'fflate';
import readXlsxFile from 'read-excel-file/node';
import { buildTemplateDocument } from '../src/app/template-engine.mjs';
import { docToDocx, docToXlsx, renderOfficeDocument } from '../src/app/office-export.mjs';

const dataset = {
  nodes: [
    {
      id: 'nist-800-53:AC-2',
      node_type: 'control',
      label: 'AC-2 Account Management',
      lifecycle_status: 'active',
      metadata: {
        catalog_id: 'nist-800-53',
        item_id: 'AC-2',
        title: 'Account Management',
        control_family: 'Access Control',
      },
    },
  ],
  sources: [{ id: 'nist-oscal', display_name: 'SP 800-53 Rev. 5', version: '2026-06-09' }],
};

function buildDoc(templateType) {
  const { doc } = buildTemplateDocument(
    {
      templateType,
      framework: 'nist-800-53',
      environment: 'Cloud SaaS',
      sourceRefs: ['nist-oscal'],
      sources: dataset.sources,
    },
    dataset,
  );
  return doc;
}

function isZip(bytes) {
  // Local file header magic "PK\x03\x04".
  return bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

test('xlsx export is a valid zip with a workbook, a data sheet, and a Notes sheet', () => {
  const bytes = docToXlsx(buildDoc('poam_starter'));
  assert.ok(isZip(bytes), 'xlsx must be a ZIP package');

  const entries = unzipSync(bytes);
  const names = Object.keys(entries);
  assert.ok(names.includes('[Content_Types].xml'), 'missing content types part');
  assert.ok(names.includes('xl/workbook.xml'), 'missing workbook part');
  assert.ok(names.includes('xl/_rels/workbook.xml.rels'), 'missing workbook rels');
  assert.ok(names.includes('xl/worksheets/sheet1.xml'), 'missing first worksheet');

  const workbook = strFromU8(entries['xl/workbook.xml']);
  assert.match(workbook, /<sheet /, 'workbook must declare at least one sheet');

  // The Notes sheet always carries the disclaimer; find it in any worksheet.
  const allSheets = names
    .filter((n) => n.startsWith('xl/worksheets/'))
    .map((n) => strFromU8(entries[n]))
    .join('\n');
  assert.match(allSheets, /open-source reference tool/, 'disclaimer must be present in the workbook');
  assert.match(allSheets, /inlineStr/, 'cells should be written as inline strings');
});

test('xlsx export enumerates control rows for a tabular template', () => {
  const bytes = docToXlsx(buildDoc('implementation_statement_worksheet'));
  const entries = unzipSync(bytes);
  const sheets = Object.keys(entries)
    .filter((n) => n.startsWith('xl/worksheets/'))
    .map((n) => strFromU8(entries[n]))
    .join('\n');
  assert.match(sheets, /AC-2/, 'control ID must appear as a cell value');
});

test('docx export is a valid zip with a document body, a table, and the disclaimer', () => {
  const bytes = docToDocx(buildDoc('security_plan_starter'));
  assert.ok(isZip(bytes), 'docx must be a ZIP package');

  const entries = unzipSync(bytes);
  const names = Object.keys(entries);
  assert.ok(names.includes('[Content_Types].xml'), 'missing content types part');
  assert.ok(names.includes('word/document.xml'), 'missing document part');
  assert.ok(names.includes('_rels/.rels'), 'missing package rels');

  const document = strFromU8(entries['word/document.xml']);
  assert.match(document, /<w:document/, 'document must be wordprocessingml');
  assert.match(document, /<w:tbl>/, 'SSP docx must contain a table');
  assert.match(document, /Account Management|AC-2/, 'control content must be present');
  assert.match(document, /open-source reference tool/, 'disclaimer must be present');
  assert.match(document, /<w:sectPr>/, 'body must end with section properties');
});

test('renderOfficeDocument returns bytes, mime, and extension per format', () => {
  const doc = buildDoc('poam_starter');
  const xlsx = renderOfficeDocument(doc, 'xlsx');
  assert.equal(xlsx.extension, 'xlsx');
  assert.match(xlsx.mimeType, /spreadsheetml\.sheet$/);
  assert.ok(xlsx.bytes instanceof Uint8Array);

  const docx = renderOfficeDocument(doc, 'docx');
  assert.equal(docx.extension, 'docx');
  assert.match(docx.mimeType, /wordprocessingml\.document$/);

  assert.throws(() => renderOfficeDocument(doc, 'pdf'), /Unsupported office format/);
});

test('xlsx round-trips through a real spreadsheet reader (Excel-compatible)', async () => {
  const bytes = docToXlsx(buildDoc('poam_starter'));
  const dir = mkdtempSync(join(tmpdir(), 'ca-office-'));
  const file = join(dir, 'poam.xlsx');
  try {
    writeFileSync(file, bytes);
    // read-excel-file is an independent OOXML parser; a clean parse proves the
    // workbook is genuinely spreadsheet-readable, not just well-formed XML.
    const parsed = await readXlsxFile(file);
    // This reader returns either a flat rows array (single sheet) or an array of
    // { sheet, data } objects (multi-sheet); normalize to the first sheet's rows.
    const rows = Array.isArray(parsed[0]) ? parsed : parsed[0].data;
    assert.ok(rows.length >= 2, 'reader must recover the header + at least one row');
    assert.ok(
      rows[0].some((cell) => String(cell).includes('POA&M ID')),
      'header row must survive the round-trip',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('xml special characters in cell values are escaped, not injected', () => {
  const doc = {
    title: 'Ampersand & <Angle> "Quote"',
    description: 'x',
    sections: [{ type: 'table', heading: 'T', headers: ['A & B'], rows: [['<script>']] }],
  };
  const xlsx = strFromU8(unzipSync(docToXlsx(doc))['xl/worksheets/sheet1.xml']);
  assert.match(xlsx, /A &amp; B/);
  assert.match(xlsx, /&lt;script&gt;/);
  assert.doesNotMatch(xlsx, /<script>/);
});
