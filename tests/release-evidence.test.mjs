import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const evidencePath =
  'docs/audits/control-atlas-v1-holistic-correction-local-evidence-2026-07-28.md';

test('current release evidence retains its artifacts and honest external boundaries', () => {
  if (!existsSync(evidencePath)) {
    console.log(`[SKIPPED] Release evidence file not present on disk: ${evidencePath}`);
    return;
  }
  const evidence = readFileSync(evidencePath, 'utf8');
  const artifactPaths = [
    ...evidence.matchAll(/^- [^:\n]+: `([^`]+)`$/gm),
  ].map((match) => match[1]);

  assert.ok(artifactPaths.length >= 10, 'release packet must enumerate its artifacts');
  for (const path of artifactPaths) {
    assert.ok(existsSync(path), `missing release evidence artifact: ${path}`);
  }

  for (const pending of [
    'Five-practitioner validation and replay.',
    'Human editorial sign-off.',
    'Human NVDA desktop session.',
    'Human VoiceOver or TalkBack mobile session.',
    'Physical phone and tablet checks.',
    'Actual browser 200% zoom session.',
    'Owner review and final `GO` or `NO-GO`.',
  ]) {
    assert.match(evidence, new RegExp(`- ${pending.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  }

  assert.doesNotMatch(evidence, /^\|[^|\n]*\|\s*Not tested\s*\|/gmi);
});
