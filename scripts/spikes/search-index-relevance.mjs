#!/usr/bin/env node
import MiniSearch from 'minisearch';
import { readFileSync } from 'node:fs';

import { readGeneratedCollection } from '../lib/generated-graph-artifacts.mjs';

const PROBES = [
  ['Platform One', 'resource:portal-software-af'],
  ['access control', 'record:nist-800-53:FAMILY-AC'],
  ['AC-2', 'record:nist-800-53:AC-2'],
  ['phishing', 'record:mitre-attack:T1566'],
  ['FIPS 140-2', 'record:fips-200:AC'],
  ['CMMC level 2', 'record:cmmc-2:LEVEL-2'],
  ['eMASS', 'resource:service-dcsa-nisp-emass'],
];
const engine = process.argv.find((argument) => argument.startsWith('--engine='))?.slice('--engine='.length)
  || 'minisearch-field-weighted-v1';
if (engine !== 'minisearch-field-weighted-v1') {
  throw new Error(`Unsupported spike engine: ${engine}`);
}

function normalize(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function buildDocuments() {
  const library = readGeneratedCollection('.', 'library-search').library_search;
  const nodes = readGeneratedCollection('.', 'nodes').nodes;
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const records = library.documents.map((document) => {
    const node = byId.get(document.id);
    return {
      id: `record:${document.id}`,
      kind: document.object_type || 'record',
      identifier: document.item_id || document.id,
      title: document.title,
      publisher: document.source_name,
      text: normalize(node?.metadata?.description),
    };
  });
  const resources = JSON.parse(readFileSync('data/generated/commons-search-index.json', 'utf8')).documents
    .map((resource) => ({
      id: `resource:${resource.id}`,
      kind: 'resource',
      identifier: resource.shortName || resource.id,
      title: resource.name,
      publisher: resource.publisher,
      text: normalize([resource.summary, resource.whyIncluded, resource.cardPurpose, ...(resource.searchAliases || [])].join(' ')),
    }));
  return [...records, ...resources];
}

function buildIndex(documents) {
  const index = new MiniSearch({
    fields: ['identifier', 'title', 'publisher', 'text'],
    storeFields: ['kind', 'identifier', 'title', 'publisher', 'text'],
    searchOptions: { boost: { identifier: 14, title: 12, publisher: 4, text: 1 }, prefix: true },
  });
  index.addAll(documents);
  return index;
}

function search(index, query) {
  const phrase = normalize(query).toLocaleLowerCase();
  const grouped = new Map();
  for (const hit of index.search(query, { combineWith: 'AND' })) {
    const phraseHit = [hit.identifier, hit.title, hit.publisher, hit.text]
      .some((field) => String(field || '').toLocaleLowerCase().includes(phrase));
    const candidate = { ...hit, score: hit.score + (phraseHit ? 100 : 0) };
    const entries = grouped.get(hit.kind) || [];
    entries.push(candidate);
    grouped.set(hit.kind, entries);
  }
  const ordered = [...grouped.values()].flatMap((entries) => entries.sort((a, b) => b.score - a.score));
  const result = [];
  const perKind = new Map();
  for (const entry of ordered.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))) {
    const count = perKind.get(entry.kind) || 0;
    if (result.length < 10 && count >= 6) continue;
    perKind.set(entry.kind, count + 1);
    result.push(entry);
  }
  return result;
}

const documents = buildDocuments();
const index = buildIndex(documents);
const results = PROBES.map(([query, expected]) => {
  const hits = search(index, query);
  const rank = hits.findIndex((hit) => hit.id === expected);
  return { query, expected, rank: rank === -1 ? null : rank + 1, top: hits.slice(0, 10).map((hit) => hit.id) };
});
const failures = results.filter((result) => result.rank === null || result.rank > 3);
process.stdout.write(`${JSON.stringify({ engine, documents: documents.length, results, failures }, null, 2)}\n`);
process.exitCode = failures.length ? 1 : 0;
