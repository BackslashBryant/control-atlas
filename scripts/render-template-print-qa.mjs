#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { chromium } from 'playwright';

import { buildTemplateDocument } from '../src/app/template-engine.mjs';
import { officeDocumentToSheets } from '../src/app/office-export.mjs';
import { PRODUCT_DISCLAIMER } from '../src/shared/disclaimer.mjs';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function textBlock(value) {
  return String(value ?? '')
    .split(/\r?\n/)
    .map((line) => {
      const clean = line.replace(/^[-*]\s+/, '').replaceAll('**', '');
      return /^[-*]\s+/.test(line)
        ? `<li>${escapeHtml(clean)}</li>`
        : `<p>${escapeHtml(clean)}</p>`;
    })
    .join('');
}

function promptFieldTable(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed.includes(' | ') || /\r|\n/.test(trimmed)) {
    return '';
  }
  const content = trimmed.startsWith('[') && trimmed.endsWith(']')
    ? trimmed.slice(1, -1)
    : trimmed;
  const rows = content.split(' | ').map((rawField) => {
    const field = rawField.trim();
    const separator = field.indexOf(':');
    return separator > 0
      ? [field.slice(0, separator).trim(), field.slice(separator + 1).trim()]
      : [field, ''];
  });
  return `<table><thead><tr><th>Field</th><th>Response</th></tr></thead><tbody>${rows
    .map((row) => `<tr><td>${escapeHtml(row[0])}</td><td>${escapeHtml(row[1])}</td></tr>`)
    .join('')}</tbody></table>`;
}

function printableTable(title, headers, rows, note = '') {
  const sampleRows = rows.slice(0, 8);
  const omitted = Math.max(0, rows.length - sampleRows.length);
  return `<section class="sheet">
    <div class="sheet-heading"><div><p class="eyebrow">Print QA view</p><h2>${escapeHtml(title)}</h2></div><p class="sheet-note">${escapeHtml(note)}</p></div>
    <table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
    <tbody>${sampleRows.map((row) => `<tr>${headers.map((_, index) => `<td>${escapeHtml(row[index] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table>
    ${omitted ? `<p class="omitted">${omitted} repetitive rows omitted from this visual QA sample. The generated Office file retains them.</p>` : ''}
  </section>`;
}

function workbookHtml(template, doc) {
  const sheets = officeDocumentToSheets(doc);
  const sections = sheets.map((sheet) => printableTable(
    sheet.name,
    sheet.rows[0] || [],
    sheet.rows.slice(1),
    sheet.kind === 'notes' ? 'Instructions, provenance, and limitations' : 'Matches the generated XLSX sheet split',
  )).join('');
  return pageHtml(template.display_name, template.compatibility?.classification, sections);
}

function documentHtml(template, doc) {
  const sections = doc.sections.map((section) => {
    if (section.type === 'text') {
      return `<section><h2>${escapeHtml(section.heading)}</h2>${promptFieldTable(section.content) || textBlock(section.content)}</section>`;
    }
    if (section.heading === 'Control Baseline') {
      return `<section><h2>${escapeHtml(section.heading)}</h2>${section.rows.slice(0, 5).map((row) => {
        const details = section.headers.slice(2).map((header, index) => `<tr><th>${escapeHtml(header)}</th><td>${escapeHtml(row[index + 2] ?? '')}</td></tr>`).join('');
        return `<article class="record"><h3>${escapeHtml([row[0], row[1]].filter(Boolean).join(' - '))}</h3><table><tbody>${details}</tbody></table></article>`;
      }).join('')}<p class="omitted">Additional control records omitted from this visual QA sample. The generated DOCX retains them.</p></section>`;
    }
    return printableTable(section.heading, section.headers, section.rows);
  }).join('');
  return pageHtml(template.display_name, template.compatibility?.classification, sections);
}

function pageHtml(title, classification, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: Letter landscape; margin: 0.45in; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #20242c; font-family: Arial, sans-serif; font-size: 9pt; line-height: 1.35; }
    header { border-bottom: 2px solid #17365d; margin-bottom: 18px; padding-bottom: 12px; }
    h1 { color: #17365d; font-size: 24pt; margin: 0 0 5px; }
    h2 { color: #17365d; font-size: 15pt; margin: 0 0 10px; }
    h3 { color: #17365d; font-size: 11pt; margin: 0 0 6px; }
    p { margin: 0 0 8px; }
    .classification { color: #475467; font-weight: 700; }
    .disclaimer { background: #f4f6f9; border: 1px solid #d6dee8; padding: 10px 12px; }
    section { break-before: page; }
    header + section { break-before: auto; }
    .sheet-heading { align-items: end; display: flex; justify-content: space-between; gap: 20px; }
    .eyebrow { color: #667085; font-size: 8pt; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    .sheet-note { color: #667085; font-size: 8pt; text-align: right; }
    table { border-collapse: collapse; table-layout: fixed; width: 100%; }
    thead { display: table-header-group; }
    th { background: #17365d; color: white; font-weight: 700; text-align: left; }
    td, th { border: 1px solid #c7d1de; overflow-wrap: anywhere; padding: 5px 6px; vertical-align: top; }
    tr { break-inside: avoid; }
    td { font-size: 7.5pt; }
    .record { break-inside: avoid; margin-bottom: 12px; }
    .record table th { width: 24%; }
    .omitted { color: #667085; font-size: 8pt; font-style: italic; margin-top: 8px; }
    li { margin-bottom: 4px; }
  </style></head><body><header><h1>${escapeHtml(title)}</h1><p class="classification">${escapeHtml(classification || 'Control Atlas companion')}</p><p class="disclaimer">${escapeHtml(PRODUCT_DISCLAIMER)}</p></header>${body}</body></html>`;
}

const outArg = process.argv.find((arg) => arg.startsWith('--out='));
const outputDirectory = resolve(outArg ? outArg.slice('--out='.length) : 'artifacts/template-print-qa');
const registry = readJson('data/template-registry.json');
const sourceDataset = {
  nodes: readJson('data/generated/nodes.json').nodes || [],
  edges: readJson('data/generated/edges.json').edges || [],
  sources: readJson('data/generated/sources.json').sources || [],
};
const sampleControlIds = new Set(
  sourceDataset.nodes
    .filter((node) => node.node_type === 'control' && node.metadata?.catalog_id === 'nist-800-53')
    .slice(0, 8)
    .map((node) => node.id),
);
const dataset = {
  ...sourceDataset,
  nodes: sourceDataset.nodes.filter((node) => node.node_type !== 'control' || sampleControlIds.has(node.id)),
  edges: sourceDataset.edges.filter((edge) => !edge.source_node_id?.startsWith('nist-800-53:') || sampleControlIds.has(edge.source_node_id)),
};

mkdirSync(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const manifest = [];
try {
  for (const template of registry.templates) {
    const options = {
      templateType: template.name,
      framework: template.input_options.includes('framework') ? 'nist-800-53' : '',
      environment: 'Cloud SaaS',
      sourceRefs: template.source_refs || [],
      sources: dataset.sources,
    };
    const { doc } = buildTemplateDocument(options, dataset);
    const format = template.office_formats?.[0] || 'xlsx';
    const html = format === 'docx' ? documentHtml(template, doc) : workbookHtml(template, doc);
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const filename = `${template.name}-print-qa.pdf`;
    await page.pdf({
      path: resolve(outputDirectory, filename),
      format: 'Letter',
      landscape: true,
      printBackground: true,
      margin: { top: '0.45in', right: '0.45in', bottom: '0.45in', left: '0.45in' },
    });
    await page.close();
    manifest.push({ template: template.name, filename, office_format: format });
    console.log(`Rendered ${filename}`);
  }
} finally {
  await browser.close();
}
writeFileSync(resolve(outputDirectory, 'manifest.json'), `${JSON.stringify({ outputs: manifest }, null, 2)}\n`);
