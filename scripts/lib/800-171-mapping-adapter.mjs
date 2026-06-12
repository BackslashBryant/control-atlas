import { createHash } from 'node:crypto';
import { normalize800171Id, normalize80053Id } from './oscal-normalize.mjs';

export function checksum(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function is80053ControlTitle(title = '') {
  return /^[A-Z]{2,3}(-\d+)?(\(\d+\))?$/.test(String(title).trim());
}

function normalize80053Title(title = '') {
  const raw = String(title).trim();
  const match = raw.match(/^([A-Z]{2,3})-?(\d+)?(?:\((\d+)\))?$/);
  if (!match) return normalize80053Id(raw);
  const family = match[1];
  const base = match[2] || '';
  const enhancement = match[3];
  if (!base) return normalize80053Id(raw);
  return enhancement ? `${family}-${base}.${Number.parseInt(enhancement, 10)}` : `${family}-${base}`;
}

export function parse800171OscalMappings(catalogJson) {
  const resourceByUuid = new Map();
  for (const resource of catalogJson.catalog?.['back-matter']?.resources || []) {
    if (resource.uuid && resource.title) resourceByUuid.set(resource.uuid, resource.title);
  }

  const relationships = [];
  const seen = new Set();

  function walk(nodes) {
    for (const node of nodes || []) {
      if (node.controls) walk(node.controls);
      if (!node.id || !node.links) continue;
      const requirementId = normalize800171Id(node.id.replace(/^SP_800_171_/, '').replace(/_/g, '.'));
      for (const link of node.links) {
        if (link.rel !== 'reference' || !link.href?.startsWith('#')) continue;
        const title = resourceByUuid.get(link.href.slice(1));
        if (!title || !is80053ControlTitle(title)) continue;
        const controlId = normalize80053Title(title);
        const signature = `${controlId}|${requirementId}`;
        if (seen.has(signature)) continue;
        seen.add(signature);
        relationships.push({
          source_id: requirementId,
          target_id: controlId,
          relationship_type: 'maps_to',
          why: `Official NIST SP 800-171 Rev. 3 OSCAL catalog references SP 800-53 ${controlId} for requirement ${requirementId}.`,
          source_locator: `${node.id}#${link.href}`,
          olir_status: 'final',
          owner_authority: true,
          submitter: 'NIST',
        });
      }
    }
  }

  walk(catalogJson.catalog?.groups);
  return relationships;
}

export async function build80053To800171Map(options = {}) {
  const artifact = options.artifact
    || 'https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-171/rev3/json/NIST_SP800-171_rev3_catalog.json';
  const json = options.catalogJson || await (await fetch(artifact)).json();
  const body = JSON.stringify(json);
  const relationships = parse800171OscalMappings(json);

  return {
    schema_version: '2.0',
    source_key: 'nist-800-171-oscal-mappings',
    source_artifact: artifact,
    source_version: json.catalog?.metadata?.version || 'rev3',
    snapshot_date: new Date().toISOString().slice(0, 10),
    checksum: checksum(body),
    provenance: 'Official NIST SP 800-171 Rev. 3 OSCAL references to SP 800-53 controls',
    olir_status: 'final',
    owner_authority: true,
    submitter: 'NIST',
    relationships,
  };
}
