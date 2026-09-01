import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const registry = JSON.parse(readFileSync('data/source-registry.json', 'utf8'));
const index = JSON.parse(readFileSync('data/generated/publication-identity-index.json', 'utf8'));
const publicationsById = new Map(registry.publications.map((publication) => [publication.id, publication]));
const artifactsById = new Map(registry.artifacts.map((artifact) => [artifact.id, artifact]));

test('the canonical publication-identity index has no unresolved metadata gaps', () => {
  for (const pub of registry.publications) {
    assert.ok(pub.metadata?.identity_kind, `${pub.id} is missing metadata.identity_kind`);
  }
});

test('every canonical identity is a "publication"-kind row, one per id', () => {
  const canonicalIds = registry.publications
    .filter((pub) => pub.metadata?.identity_kind === 'publication')
    .map((pub) => pub.id);
  assert.equal(index.identities.length, canonicalIds.length);
  assert.deepEqual(
    index.identities.map((identity) => identity.id).sort(),
    [...canonicalIds].sort(),
  );
  assert.equal(new Set(index.identities.map((identity) => identity.id)).size, index.identities.length);
});

test('every supplemental/mapping alias is reachable from exactly one canonical identity', () => {
  const aliasKinds = new Set(['supplemental', 'mapping']);
  const aliasIds = registry.publications
    .filter((pub) => aliasKinds.has(pub.metadata?.identity_kind))
    .map((pub) => pub.id);

  const reachable = new Map();
  for (const identity of index.identities) {
    for (const aliasId of identity.alias_source_ids) {
      assert.ok(!reachable.has(aliasId), `${aliasId} is reachable from more than one canonical identity`);
      reachable.set(aliasId, identity.id);
    }
  }

  for (const aliasId of aliasIds) {
    assert.ok(reachable.has(aliasId), `${aliasId} is a supplemental/mapping row not reachable from any canonical identity`);
    const pub = registry.publications.find((candidate) => candidate.id === aliasId);
    assert.equal(
      reachable.get(aliasId),
      pub.metadata.canonical_publication_id,
      `${aliasId} is grouped under a different identity than its own canonical_publication_id`,
    );
  }
});

test('no canonical, supplemental, or mapping row is left as an unexplained orphan', () => {
  const explainedKinds = new Set(['publication', 'supplemental', 'mapping']);
  const byId = new Map(registry.publications.map((pub) => [pub.id, pub]));
  for (const orphanId of index.orphans.publications) {
    const kind = byId.get(orphanId)?.metadata?.identity_kind;
    assert.ok(
      !explainedKinds.has(kind),
      `${orphanId} (identity_kind: ${kind}) should have been attached to a canonical identity, not orphaned`,
    );
  }
});

test('connection evidence never doubles as a source material within the same identity', () => {
  for (const identity of index.identities) {
    const materials = [
      ...identity.source_materials.primary,
      ...identity.source_materials.enrichment,
      ...identity.source_materials.reference,
      ...identity.source_materials.other,
    ];
    for (const evidenceId of identity.connection_evidence) {
      assert.ok(!materials.includes(evidenceId), `${evidenceId} appears as both source material and connection evidence under ${identity.id}`);
    }
  }
});

test('canonical material memberships resolve once with meaningful identity and publication linkage', () => {
  for (const identity of index.identities) {
    const materialRoles = Object.entries(identity.source_materials);
    const materialIds = materialRoles.flatMap(([, ids]) => ids);
    assert.equal(
      new Set(materialIds).size,
      materialIds.length,
      `${identity.id} repeats a material across membership roles`,
    );

    for (const [role, ids] of materialRoles) {
      for (const id of ids) {
        const source = artifactsById.get(id) || publicationsById.get(id);
        assert.ok(source, `${identity.id} ${role} material ${id} does not resolve`);
        const displayIdentity = [source.display_name, source.name].find(
          (value) => typeof value === 'string' && value.trim() && value !== source.id,
        );
        assert.ok(displayIdentity, `${identity.id} ${role} material ${id} has no meaningful identity`);

        if (artifactsById.has(id)) {
          assert.ok(
            source.publication_source_id === identity.id
              || identity.alias_source_ids.includes(source.publication_source_id),
            `${identity.id} ${role} artifact ${id} has invalid publication linkage`,
          );
        } else {
          assert.equal(
            source.metadata?.canonical_publication_id,
            identity.id,
            `${identity.id} ${role} alias ${id} has invalid canonical linkage`,
          );
        }
      }
    }

    const canonicalMembershipIds = new Set([
      ...materialIds,
      ...identity.connection_evidence,
    ]);
    for (const aliasId of identity.alias_source_ids) {
      const attachedArtifactIds = registry.artifacts
        .filter((artifact) => artifact.publication_source_id === aliasId)
        .map((artifact) => artifact.id);
      if (attachedArtifactIds.some((id) => canonicalMembershipIds.has(id))) {
        assert.ok(
          !canonicalMembershipIds.has(aliasId),
          `${identity.id} counts alias ${aliasId} and its artifact as separate memberships`,
        );
      }
    }
  }
});

test('connection evidence resolves once and remains outside canonical material memberships', () => {
  for (const identity of index.identities) {
    const materialIds = Object.values(identity.source_materials).flat();
    assert.equal(
      new Set(identity.connection_evidence).size,
      identity.connection_evidence.length,
      `${identity.id} repeats connection evidence`,
    );
    for (const id of identity.connection_evidence) {
      assert.ok(
        artifactsById.has(id) || publicationsById.has(id),
        `${identity.id} connection evidence ${id} does not resolve`,
      );
      assert.ok(
        !materialIds.includes(id),
        `${identity.id} connection evidence ${id} is also a source material`,
      );
    }
  }
});

test('DoD Zero Trust conceptual duplicates reconcile to one canonical identity', () => {
  const zt = index.identities.find((identity) => identity.id === 'dod-zt-reference-architecture-v2');
  assert.ok(zt, 'dod-zt-reference-architecture-v2 must be a canonical identity');
  for (const alias of [
    'dod-zt-capabilities', 'dod-zt-execution-roadmap', 'dod-zt-newsletter-2024-11',
    'dod-zt-operational-technology', 'dod-zt-overlays-2024', 'dod-zt-strategy',
    'dod-zt-strategy-placemats',
  ]) {
    assert.ok(zt.alias_source_ids.includes(alias), `${alias} must alias to the canonical DoD Zero Trust identity`);
  }
});

test('the SP 800-171 canonical identity is the real publication, not its OSCAL ingestion artifact', () => {
  const bundle = registry.catalog_source_bundles.find((entry) => entry.catalog_id === 'nist-800-171');
  assert.equal(bundle.publication_source_id, 'nist-800-171');
  const identity = index.identities.find((candidate) => candidate.id === 'nist-800-171');
  assert.ok(identity, 'nist-800-171 must be a canonical identity');
  assert.equal(identity.catalog_id, 'nist-800-171');
  assert.ok(identity.alias_source_ids.includes('nist-800-171-oscal-mappings'));
  assert.ok(identity.connection_evidence.includes('artifact-nist-800-171-oscal-mappings'));
  assert.ok(!identity.source_materials.other.includes('nist-800-171-oscal-mappings'));

  const mapping = registry.publications.find(
    (candidate) => candidate.id === 'nist-800-171-oscal-mappings',
  );
  assert.equal(mapping.metadata.identity_kind, 'mapping');
  assert.equal(mapping.metadata.canonical_publication_id, 'nist-800-171');
});
