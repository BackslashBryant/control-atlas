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

  await t.test('every template advertises only Word or Excel', () => {
    const { registry } = loadTemplateRegistry(join(ROOT, 'data', 'template-registry.json'));
    const allowedFormats = new Set(['docx', 'xlsx']);
    for (const template of registry.templates) {
      assert.ok(template.supported_formats.length > 0, `${template.name} must offer a document format`);
      for (const format of template.supported_formats) {
        assert.ok(allowedFormats.has(format), `${template.name} advertises removed format: ${format}`);
      }
    }
  });

  await t.test('required inputs are explicit subsets of visible inputs', () => {
    const { registry } = loadTemplateRegistry(join(ROOT, 'data', 'template-registry.json'));
    for (const template of registry.templates) {
      assert.ok(Array.isArray(template.required_input_options));
      for (const option of template.required_input_options) {
        assert.ok(template.input_options.includes(option));
      }
    }
  });
});
