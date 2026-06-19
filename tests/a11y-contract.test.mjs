import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const compareHelpers = readFileSync('src/ui/lib/compareHelpers.tsx', 'utf8');
const css = readFileSync('src/styles/app.css', 'utf8');

test('provenance badges always render text labels alongside tone classes', () => {
  assert.match(compareHelpers, /function PublicationStatusBadge/);
  assert.match(compareHelpers, /Inferred link/);
  assert.match(compareHelpers, /Official link/);
  assert.match(compareHelpers, /function ProvenanceBadge/);
  assert.match(compareHelpers, /displayNameFor\('provenance_class'/);
});

test('fedramp provenance token uses teal, not primary blueprint blue', () => {
  assert.match(css, /--ca-provenance-fedramp:\s*#0D9488/i);
  assert.doesNotMatch(css, /--ca-provenance-fedramp:\s*#2563EB/i);
  assert.match(css, /--ca-primary:\s*#2563EB/i);
});

test('reduced motion preferences disable transitions and animations', () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /transition:\s*none !important/);
  assert.match(css, /animation:\s*none !important/);
});
