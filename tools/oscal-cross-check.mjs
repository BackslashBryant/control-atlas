#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';

import {
  classifyOscalDocument,
  parse80053Catalog,
} from './normalizers/oscal-normalize.mjs';

const catalogPath = 'tests/fixtures/oscal/sample-800-53-assessment.json';
const profilePath = 'tests/fixtures/oscal/sample-profile.json';
const outputPath = join('artifacts', 'oscal-cli', 'cross-check.json');

function runCli(args) {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const child = spawn(process.execPath, ['./tools/run-oscal-cli.mjs', ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('exit', (code) => resolve({
      code: code ?? 1,
      durationMs: Math.round(performance.now() - started),
      output: `${stdout}\n${stderr}`.trim().slice(0, 4000),
    }));
  });
}

const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const profile = JSON.parse(await readFile(profilePath, 'utf8'));
const invalidCatalog = structuredClone(catalog);
delete invalidCatalog.catalog.metadata;
const invalidProfile = { profile: { uuid: profile.profile.uuid } };

const invalidCatalogPath = join('artifacts', 'oscal-cli', 'invalid-catalog.json');
const invalidProfilePath = join('artifacts', 'oscal-cli', 'invalid-profile.json');
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(invalidCatalogPath, `${JSON.stringify(invalidCatalog, null, 2)}\n`);
await writeFile(invalidProfilePath, `${JSON.stringify(invalidProfile, null, 2)}\n`);

const currentValidation = {
  catalogModel: classifyOscalDocument(catalog),
  catalogRecords: parse80053Catalog(catalog, 'nist-oscal').records.length,
  invalidCatalogAcceptedByNormalizer:
    parse80053Catalog(invalidCatalog, 'nist-oscal').records.length > 0,
  profileModel: classifyOscalDocument(profile),
  invalidProfileAcceptedByClassifier:
    classifyOscalDocument(invalidProfile) === 'profile',
  ajvOscalValidationPresent: false,
};

const cli = {
  validCatalog: await runCli(['catalog', 'validate', catalogPath]),
  validProfile: await runCli(['profile', 'validate', profilePath]),
  invalidCatalog: await runCli(['catalog', 'validate', invalidCatalogPath]),
  invalidProfile: await runCli(['profile', 'validate', invalidProfilePath]),
};

if (cli.validCatalog.code !== 0 || cli.validProfile.code !== 0) {
  throw new Error(`NIST OSCAL CLI rejected a valid fixture: ${JSON.stringify(cli)}`);
}
if (cli.invalidCatalog.code === 0 || cli.invalidProfile.code === 0) {
  throw new Error(`NIST OSCAL CLI failed to reject an invalid fixture: ${JSON.stringify(cli)}`);
}

const result = {
  generatedAt: new Date().toISOString(),
  oscalCliVersion: '1.0.3',
  fixtureOscalVersion: '1.1.2',
  currentValidation,
  cli,
  conclusion:
    'The NIST CLI catches missing required OSCAL metadata that the current classifier and normalizer accept.',
};
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
