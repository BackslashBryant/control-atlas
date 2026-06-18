import { test } from 'node:test';
import assert from 'node:assert';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTemplateRegistry } from '../tools/validators/template-registry.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

test('Template Registry Validation', async (t) => {
  await t.test('data/template-registry.json is valid', () => {
    const { registry, errors } = loadTemplateRegistry(join(ROOT, 'data', 'template-registry.json'));
    assert.deepEqual(errors, [], `Validation errors found:\n${errors.join('\n')}`);
    assert.ok(registry.templates.length > 0, 'Registry must contain templates');
  });
});
