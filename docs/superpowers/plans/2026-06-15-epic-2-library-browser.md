# Epic 2: Library + Search — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver Epic 2 completely by adding a generated MiniSearch-backed library index, stable deep-link object detail state, and live library filters for object type, source class, and family or severity.

**Architecture:** Extend the existing static shell instead of replacing it. Generate a new additive library search artifact from the same normalized graph inputs, load it in the client runtime for library search and filtering, and promote object detail views to first-class URL state while preserving the five-artifact graph runtime contract for context, evidence, and provenance.

**Tech Stack:** Node.js, static ES modules, MiniSearch npm package, existing `src/app` shell, `scripts/build-framework-data.mjs`, `tools/build-static-site.mjs`, Node test runner, Playwright

---

### Task 1: Add failing contract tests for the Epic 2 artifact and URL state

**Files:**
- Modify: `tests/framework-data.test.mjs`
- Modify: `tests/framework-runtime.test.mjs`
- Modify: `tests/browser-contract.test.mjs`
- Test: `tests/framework-data.test.mjs`
- Test: `tests/framework-runtime.test.mjs`
- Test: `tests/browser-contract.test.mjs`

- [ ] **Step 1: Write the failing data-build contract test for the library artifact**

```javascript
test('epic 2 graph build emits a library search artifact with filter facets', () => {
  buildFrameworkData();
  const library = generated('library-search');

  assert.equal(library.schema_version, '1.0');
  assert.ok(Array.isArray(library.library_search.documents));
  assert.ok(typeof library.library_search.serialized_index === 'string');

  const ac2 = library.library_search.documents.find((entry) => entry.id === 'nist-800-53:AC-2');
  assert.ok(ac2, 'missing AC-2 library document');
  assert.equal(ac2.object_type, 'control');
  assert.equal(ac2.source_class, 'federal_published');
  assert.equal(ac2.control_family, 'Access Control');
});
```

- [ ] **Step 2: Run the data-build test to verify it fails**

Run: `node --test tests/framework-data.test.mjs`
Expected: FAIL because `data/generated/library-search.json` and `library_search` payload do not exist yet.

- [ ] **Step 3: Write the failing runtime URL-state and library-query tests**

```javascript
test('library view state supports direct object detail links', () => {
  assert.deepEqual(parseViewState('?view=library-detail&node=nist-800-53%3AAC-2'), {
    view: 'library-detail',
    node: 'nist-800-53:AC-2',
  });

  assert.equal(
    serializeViewState({ view: 'library-detail', node: 'nist-800-53:AC-2' }),
    '?view=library-detail&node=nist-800-53%3AAC-2',
  );
});

test('runtime filters library documents by keyword and facets', () => {
  const runtime = createFederalGraphRuntime({
    ...fixture,
    librarySearch: {
      serialized_index: '',
      documents: [
        {
          id: 'nist-800-53:AC-2',
          item_id: 'AC-2',
          title: 'Account Management',
          description: 'Manage system accounts.',
          object_type: 'control',
          source_id: 'nist-oscal',
          source_class: 'federal_published',
          catalog_id: 'nist-800-53',
          control_family: 'Access Control',
          severity: '',
        },
      ],
    },
  });

  const results = runtime.searchLibrary('account', { object_type: 'control', source_class: 'federal_published' });
  assert.deepEqual(results.map((entry) => entry.id), ['nist-800-53:AC-2']);
});
```

- [ ] **Step 4: Run the runtime test to verify it fails**

Run: `node --test tests/framework-runtime.test.mjs`
Expected: FAIL because `library-detail` state and `searchLibrary` do not exist.

- [ ] **Step 5: Write the failing browser-contract assertions for the new Library Browser controls**

```javascript
test('library browser exposes epic 2 filter controls and deep-link detail actions', () => {
  assert.match(app, /library-object-type-filter/);
  assert.match(app, /library-source-class-filter/);
  assert.match(app, /library-family-filter/);
  assert.match(app, /library-severity-filter/);
  assert.match(app, /view === 'library-detail'/);
  assert.match(app, /Copy link/);
});
```

- [ ] **Step 6: Run the browser-contract test to verify it fails**

Run: `node --test tests/browser-contract.test.mjs`
Expected: FAIL because the new filter controls and `library-detail` surface are missing.

- [ ] **Step 7: Commit the failing-test baseline**

```bash
git add tests/framework-data.test.mjs tests/framework-runtime.test.mjs tests/browser-contract.test.mjs
git commit -m "test: define epic 2 library browser contracts"
```

### Task 2: Generate and publish the Epic 2 library search artifact

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `scripts/build-framework-data.mjs`
- Modify: `tools/build-static-site.mjs`
- Modify: `tests/framework-data.test.mjs`
- Modify: `tests/build-layout-contract.test.mjs`
- Test: `tests/framework-data.test.mjs`
- Test: `tests/build-layout-contract.test.mjs`

- [ ] **Step 1: Add the failing build-layout contract for the new generated artifact**

```javascript
test('staged build publishes the generated library search artifact', () => {
  const siteBuilder = readFileSync('tools/build-static-site.mjs', 'utf8');
  assert.match(siteBuilder, /library-search\.json/);
});
```

- [ ] **Step 2: Run the build-layout contract test to verify it fails**

Run: `node --test tests/build-layout-contract.test.mjs`
Expected: FAIL because the staged build contract does not mention `library-search.json`.

- [ ] **Step 3: Implement minimal graph-build support for the library search artifact**

```javascript
function buildLibrarySearch(graph) {
  const documents = graph.nodes.map((node) => {
    const source = graph.sources.find((entry) => entry.id === node.source_id);
    return {
      id: node.id,
      item_id: node.metadata?.item_id || node.id,
      title: node.metadata?.title || node.label,
      description: node.metadata?.description || '',
      object_type: node.node_type,
      source_id: node.source_id,
      source_class: source?.provenance_class || '',
      catalog_id: node.metadata?.catalog_id || '',
      control_family: node.metadata?.family || '',
      severity: node.metadata?.severity || '',
    };
  });

  const index = new MiniSearch({
    fields: ['item_id', 'title', 'description'],
    storeFields: ['id'],
    searchOptions: { prefix: true, boost: { item_id: 5, title: 3, description: 1 } },
  });
  index.addAll(documents);

  return {
    serialized_index: JSON.stringify(index.toJSON()),
    documents,
  };
}
```

- [ ] **Step 4: Add the MiniSearch package dependency**

Run: `npm install minisearch --save`
Expected: `package.json` and `package-lock.json` gain the new dependency without unrelated changes.

- [ ] **Step 5: Wire the artifact into generated output without replacing the five-artifact runtime contract**

```javascript
const GOVERNANCE_FILES = ['build-manifest.json', 'source-manifests.json', 'graph-diff-summary.json', 'library-search.json'];

writeFileSync(
  join(GENERATED, 'library-search.json'),
  `${JSON.stringify(artifact('library_search', buildLibrarySearch(graph), generatedAt), null, 2)}\n`,
  'utf8',
);
```

- [ ] **Step 6: Publish the new artifact through the staged static-site build**

```javascript
const COPY_PATHS = [
  ['src/index.html', 'index.html'],
  ['src/favicon.svg', 'favicon.svg'],
  ['src/app', 'app'],
  ['src/content', 'content'],
  ['src/styles', 'styles'],
  ['data', 'data'],
  ['maps', 'maps'],
  ['lib', 'lib'],
];
```

Expected behavior: no new top-level copy path is needed because `data/generated/library-search.json` travels with the existing `data` tree, but the contract tests must prove that explicitly.

- [ ] **Step 7: Run the focused data-build and layout tests to verify they pass**

Run: `node --test tests/framework-data.test.mjs tests/build-layout-contract.test.mjs`
Expected: PASS, including assertions for `data/generated/library-search.json`.

- [ ] **Step 8: Commit the artifact-generation change**

```bash
git add package.json package-lock.json scripts/build-framework-data.mjs tools/build-static-site.mjs tests/framework-data.test.mjs tests/build-layout-contract.test.mjs
git commit -m "feat: generate library search artifact"
```

### Task 3: Extend the runtime for MiniSearch queries and routeable library detail state

**Files:**
- Modify: `src/app/runtime.mjs`
- Modify: `tests/framework-runtime.test.mjs`
- Test: `tests/framework-runtime.test.mjs`

- [ ] **Step 1: Expand the fixture to include a minimal `librarySearch` payload**

```javascript
librarySearch: {
  serialized_index: JSON.stringify({
    documentCount: 2,
    nextId: 2,
    documentIds: { '0': 'nist-800-53:AC-2', '1': 'disa-stig:V-100001' },
    fieldIds: { item_id: 0, title: 1, description: 2 },
    fieldLength: {},
    averageFieldLength: {},
    storedFields: {},
    termIndex: {},
  }),
  documents: [
    {
      id: 'nist-800-53:AC-2',
      item_id: 'AC-2',
      title: 'Account Management',
      description: 'Manage system accounts.',
      object_type: 'control',
      source_id: 'nist-oscal',
      source_class: 'federal_published',
      catalog_id: 'nist-800-53',
      control_family: 'Access Control',
      severity: '',
    },
  ],
},
```

- [ ] **Step 2: Run the runtime test to verify the expanded fixture still fails only on missing behavior**

Run: `node --test tests/framework-runtime.test.mjs`
Expected: FAIL on missing `searchLibrary` or `library-detail` behavior, not on malformed fixture setup.

- [ ] **Step 3: Implement minimal MiniSearch-backed library query support**

```javascript
import MiniSearch from 'minisearch';

function matchesFacet(document, filters = {}) {
  return (!filters.object_type || document.object_type === filters.object_type)
    && (!filters.source_class || document.source_class === filters.source_class)
    && (!filters.control_family || document.control_family === filters.control_family)
    && (!filters.severity || document.severity === filters.severity)
    && (!filters.catalog_id || document.catalog_id === filters.catalog_id);
}

searchLibrary(query, filters = {}) {
  const needle = normalize(query);
  const documents = dataset.librarySearch?.documents || [];
  const index = dataset.librarySearchIndex;
  if (!needle) return documents.filter((document) => matchesFacet(document, filters));
  const hits = index.search(query, { prefix: true });
  return hits
    .map((hit) => documents.find((document) => document.id === hit.id))
    .filter((document) => document && matchesFacet(document, filters));
}
```

- [ ] **Step 4: Promote object detail to explicit Library URL state**

```javascript
if (view === 'library-detail') return { ...base, view, node: params.get('node') || '' };

if (view === 'library-detail') {
  params.set('view', 'library-detail');
  if (state.node) params.set('node', state.node);
}
```

- [ ] **Step 5: Add runtime helpers for library documents and filter facets**

```javascript
getLibraryDocument(id) {
  return (dataset.librarySearch?.documents || []).find((entry) => entry.id === id) || null;
},
getLibraryFacets() {
  const documents = dataset.librarySearch?.documents || [];
  return {
    objectTypes: [...new Set(documents.map((entry) => entry.object_type).filter(Boolean))].sort(),
    sourceClasses: [...new Set(documents.map((entry) => entry.source_class).filter(Boolean))].sort(),
    controlFamilies: [...new Set(documents.map((entry) => entry.control_family).filter(Boolean))].sort(),
    severities: [...new Set(documents.map((entry) => entry.severity).filter(Boolean))].sort(),
  };
},
```

- [ ] **Step 6: Run the runtime test to verify it passes**

Run: `node --test tests/framework-runtime.test.mjs`
Expected: PASS, including `library-detail` state and facet-filtered library queries.

- [ ] **Step 7: Commit the runtime extension**

```bash
git add src/app/runtime.mjs tests/framework-runtime.test.mjs
git commit -m "feat: add library runtime search and detail state"
```

### Task 4: Rework the Library UI around the new artifact and filters

**Files:**
- Modify: `src/app/app.mjs`
- Modify: `src/styles/app.css`
- Modify: `tests/browser-contract.test.mjs`
- Test: `tests/browser-contract.test.mjs`

- [ ] **Step 1: Add the failing browser assertions for result metadata**

```javascript
test('library result cards surface object type and defining source', () => {
  assert.match(app, /Defining source/);
  assert.match(app, /Object type/);
  assert.match(app, /library-results/);
});
```

- [ ] **Step 2: Run the browser-contract test to verify it fails**

Run: `node --test tests/browser-contract.test.mjs`
Expected: FAIL because the Library UI does not yet render those controls or labels.

- [ ] **Step 3: Replace the current search-card rendering with the library result model**

```javascript
function libraryResultCard(document) {
  const source = runtime.getSource(document.source_id);
  return `
    <article class="item-card workbench-card">
      <div class="badge-row">
        <span class="badge">${escapeHtml(document.object_type.replaceAll('_', ' '))}</span>
        ${source ? sourceBadge(source.provenance_class) : ''}
      </div>
      <h3 class="workbench-card-title">${escapeHtml(document.item_id)} - ${escapeHtml(document.title)}</h3>
      <p class="workbench-card-meta">Object type: ${escapeHtml(document.object_type)}  -  Defining source: ${escapeHtml(source?.name || document.source_id)}</p>
      <button class="primary" type="button" data-open-library-node="${escapeHtml(document.id)}">Open detail</button>
    </article>`;
}
```

- [ ] **Step 4: Add the live Library filter form and wire it to URL state**

```javascript
function libraryFilterMarkup(selected = {}) {
  const facets = runtime.getLibraryFacets();
  return `
    <form id="library-filters" class="relationship-filter-grid">
      <div class="field">
        <label for="library-object-type-filter">Object type</label>
        <select id="library-object-type-filter">${optionMarkup(facets.objectTypes, selected.objectType, 'All object types')}</select>
      </div>
      <div class="field">
        <label for="library-source-class-filter">Source class</label>
        <select id="library-source-class-filter">${optionMarkup(facets.sourceClasses, selected.sourceClass, 'All source classes')}</select>
      </div>
      <div class="field">
        <label for="library-family-filter">Control family</label>
        <select id="library-family-filter">${optionMarkup(facets.controlFamilies, selected.controlFamily, 'All control families')}</select>
      </div>
      <div class="field">
        <label for="library-severity-filter">Severity</label>
        <select id="library-severity-filter">${optionMarkup(facets.severities, selected.severity, 'All severities')}</select>
      </div>
    </form>`;
}
```

- [ ] **Step 5: Add `library-detail` rendering and copy-link support**

```javascript
async function renderLibraryDetail(state) {
  await withGraph(async () => {
    const node = runtime.getNode(state.node);
    if (!node) return;
    app.innerHTML = `
      <section class="panel detail-layout">
        <div class="detail-main">
          <p class="eyebrow">Library detail</p>
          <h2>${escapeHtml(node.metadata?.title || node.label)}</h2>
          <p class="item-id">${escapeHtml(node.metadata?.item_id || node.id)}</p>
          <button class="secondary" id="copy-library-link" type="button">Copy link</button>
        </div>
      </section>`;
  });
}
```

- [ ] **Step 6: Run the browser-contract test to verify it passes**

Run: `node --test tests/browser-contract.test.mjs`
Expected: PASS, including filter IDs, `library-detail`, and result metadata labels.

- [ ] **Step 7: Commit the Library UI changes**

```bash
git add src/app/app.mjs src/styles/app.css tests/browser-contract.test.mjs
git commit -m "feat: ship epic 2 library browser UI"
```

### Task 5: Prove direct-link and end-to-end Library Browser behavior

**Files:**
- Modify: `tests/e2e/control-atlas-shell.spec.mjs`
- Modify: `tests/browser-contract.test.mjs`
- Test: `tests/e2e/control-atlas-shell.spec.mjs`
- Test: `tests/browser-contract.test.mjs`

- [ ] **Step 1: Write the failing direct-link Playwright scenario**

```javascript
test('library detail opens from a copied deep link', async ({ page }) => {
  await page.goto('/?view=library-detail&node=nist-800-53%3AAC-2');
  await expect(page.getByRole('heading', { name: 'Account Management' })).toBeVisible();
  await expect(page.getByText('AC-2')).toBeVisible();
});
```

- [ ] **Step 2: Run the Playwright test to verify it fails**

Run: `npm run test:e2e -- --grep "library detail opens from a copied deep link"`
Expected: FAIL because direct `library-detail` navigation is not complete yet.

- [ ] **Step 3: Add one browse-to-filter interaction scenario**

```javascript
test('library filters narrow results without a page reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Library' }).click();
  await page.getByLabel('ID, title, or topic').fill('AC');
  await page.getByLabel('Object type').selectOption('control');
  await expect(page.locator('#library-results .item-card')).toHaveCount(1);
});
```

- [ ] **Step 4: Run the focused end-to-end scenarios to verify they pass**

Run: `npm run test:e2e -- --grep "library"`
Expected: PASS for deep-link and filter flows.

- [ ] **Step 5: Commit the end-to-end coverage**

```bash
git add tests/e2e/control-atlas-shell.spec.mjs tests/browser-contract.test.mjs
git commit -m "test: cover epic 2 library browser flows"
```

### Task 6: Run the full verification gate and prepare branch completion

**Files:**
- Modify: implementation files already touched as needed
- Test: full repo verification

- [ ] **Step 1: Run targeted test lanes after all tasks are green**

Run: `node --test tests/framework-data.test.mjs tests/framework-runtime.test.mjs tests/browser-contract.test.mjs tests/build-layout-contract.test.mjs`
Expected: PASS

- [ ] **Step 2: Run the full ship gate**

Run: `npm run precommit`
Expected: PASS, including build, lint, typecheck, runtime tests, browser tests, smoke checks, public verification, and Playwright.

- [ ] **Step 3: Inspect the working tree for the final diff**

Run: `git status --short --branch`
Expected: only Epic 2 implementation files are modified or staged.

- [ ] **Step 4: Commit the final verification adjustments if needed**

```bash
git add src/app/app.mjs src/app/runtime.mjs src/styles/app.css scripts/build-framework-data.mjs tools/build-static-site.mjs tests/framework-data.test.mjs tests/framework-runtime.test.mjs tests/browser-contract.test.mjs tests/build-layout-contract.test.mjs tests/e2e/control-atlas-shell.spec.mjs
git commit -m "feat: complete epic 2 library browser"
```

- [ ] **Step 5: Hand off to development-branch completion workflow**

Next required skill: `superpowers:finishing-a-development-branch`
