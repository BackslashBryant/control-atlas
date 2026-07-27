#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { buildTemplateDocument } from '../src/app/template-engine.mjs';
import { renderOfficeDocument } from '../src/app/office-export.mjs';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

const outArg = process.argv.find((arg) => arg.startsWith('--out='));
const outputDirectory = resolve(outArg ? outArg.slice('--out='.length) : 'artifacts/template-qa');

const registry = readJson('data/template-registry.json');
const dataset = {
  nodes: readJson('data/generated/nodes.json').nodes || [],
  edges: readJson('data/generated/edges.json').edges || [],
  sources: readJson('data/generated/sources.json').sources || [],
};

mkdirSync(outputDirectory, { recursive: true });

const manifest = [];
for (const template of registry.templates) {
  for (const format of template.supported_formats || []) {
    const options = {
      templateType: template.name,
      framework: template.input_options.includes('framework') ? 'nist-800-53' : '',
      baseline: template.input_options.includes('baseline') ? 'MODERATE' : '',
      environment: 'Cloud SaaS',
      includePlaceholders: true,
      includeImplementationPrompts: true,
      includeEvidenceExpectations: true,
      includeInheritancePrompts: true,
      includeReciprocityPrompts: true,
      includeSourceFootnotes: true,
      includeStigReferences: true,
      sourceRefs: template.source_refs || [],
      sources: dataset.sources,
    };
    const { doc, frameworkResolutionError } = buildTemplateDocument(options, dataset);
    if (frameworkResolutionError) {
      throw new Error(`${template.name}: ${frameworkResolutionError}`);
    }
    const rendered = renderOfficeDocument(doc, format);
    const filename = `${template.name}.${rendered.extension}`;
    writeFileSync(resolve(outputDirectory, filename), rendered.bytes);
    manifest.push({
      template_id: template.template_id,
      template_name: template.name,
      display_name: template.display_name,
      compatibility: template.compatibility?.classification || 'Unspecified',
      format,
      filename,
      bytes: rendered.bytes.byteLength,
      sections: doc.sections.length,
      tables: doc.sections.filter((section) => section.type === 'table').map((section) => ({
        heading: section.heading,
        columns: section.headers.length,
        rows: section.rows.length,
      })),
    });
    console.log(`Generated ${filename} (${rendered.bytes.byteLength} bytes)`);
  }
}

writeFileSync(
  resolve(outputDirectory, 'manifest.json'),
  `${JSON.stringify({ generated_on: new Date().toISOString(), outputs: manifest }, null, 2)}\n`,
);
console.log(`Generated ${manifest.length} Office outputs in ${outputDirectory}`);
