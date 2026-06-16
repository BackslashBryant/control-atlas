import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  capabilityNodeId,
  extractActivitiesFromOverlays,
  extractOverlayRelationships,
  normalizeControlId,
} from '../tools/importers/dod-zt-extract.mjs';

test('normalizeControlId preserves NIST 800-53 Rev 5 identifiers', () => {
  assert.equal(normalizeControlId('AC-2'), 'AC-2');
  assert.equal(normalizeControlId('AC-2(7)'), 'AC-2(7)');
  assert.equal(normalizeControlId('IA-5(1)'), 'IA-5(1)');
  assert.equal(normalizeControlId('bad'), null);
});

test('capabilityNodeId maps dotted capability ids to graph ids', () => {
  assert.equal(capabilityNodeId('1.1'), 'CAP-1-1');
  assert.equal(capabilityNodeId('7.6'), 'CAP-7-6');
});

test('extractOverlayRelationships parses control to capability mappings from overlay text', () => {
  const sample = `
Capability 1.1: User Inventory
AC-2 Account Management X
AC-2(7) Privileged User Accounts X
IA-2 Identification and Authentication X

Capability 1.2: Conditional User Access
AC-3 Access Enforcement X
AC-2 Account Management X
`;
  const { relationships } = extractOverlayRelationships(sample);
  assert.ok(relationships.some((entry) =>
    entry.source_id === 'AC-2'
    && entry.target_id === 'CAP-1-1'
    && entry.relationship_type === 'supports'));
  assert.ok(relationships.some((entry) =>
    entry.source_id === 'AC-3'
    && entry.target_id === 'CAP-1-2'));
  assert.equal(new Set(relationships.map((entry) => `${entry.source_id}:${entry.target_id}`)).size, relationships.length);
});

test('extractActivitiesFromOverlays filters invalid pillar prefixes', () => {
  const sample = `
1.1.1 Inventory User
1.2.1 Implement Application Based Permissions per Enterprise
8.1.1 Invalid Pillar Activity
`;
  const activities = extractActivitiesFromOverlays(sample);
  assert.ok(activities.some((entry) => entry.id === '1.1.1'));
  assert.ok(activities.some((entry) => entry.id === '1.2.1'));
  assert.ok(!activities.some((entry) => entry.id === '8.1.1'));
});

test('committed dod-zt overlay map uses capability graph ids', () => {
  const map = JSON.parse(readFileSync('maps/800-53-to-dod-zt-overlays.json', 'utf8'));
  assert.equal(map.source_key, 'dod-zt-overlays-2024');
  assert.ok(map.relationships.length > 100);
  assert.ok(map.relationships.every((entry) => entry.target_id.startsWith('CAP-')));
  assert.ok(map.relationships.every((entry) => entry.relationship_type === 'supports'));
});
