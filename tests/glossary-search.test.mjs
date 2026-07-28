import assert from 'node:assert/strict';
import test from 'node:test';
import { glossaryTermsForDocument, glossaryTermsForPattern, searchGlossary } from '../src/ui/lib/glossarySearch.mjs';

test('searchGlossary finds reciprocity and ATO terms', () => {
  const reciprocity = searchGlossary('reciprocity');
  assert.ok(reciprocity.some((entry) => entry.id === 'reciprocity'));
  assert.ok(Array.isArray(reciprocity[0].relatedTemplateIds));

  const ato = searchGlossary('ATO');
  assert.ok(ato.some((entry) => entry.id === 'ato'));
});

test('glossaryTermsForPattern returns linked terms', () => {
  const terms = glossaryTermsForPattern('reciprocity-basics');
  assert.ok(terms.some((entry) => entry.id === 'reciprocity'));
});

test('glossaryTermsForDocument maps stig items to stig and cci terms', () => {
  const terms = glossaryTermsForDocument({ item_id: 'V-220708', object_type: 'stig_rule' });
  assert.ok(terms.some((entry) => entry.id === 'stig'));
  assert.ok(terms.some((entry) => entry.id === 'cci'));
});
