import test from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { checkFiles } from '../tools/hygiene-check.mjs';

test('Hygiene Checker - Prohibited tracked paths', () => {
  const testFiles = [
    'some/path/walkthrough.md',
    '.gemini/config.json',
    'brain/history.json',
    'session-notes.txt',
    'src/components/cool-stuff.js',
    'docs/temp-download/file.zip'
  ];

  const violations = checkFiles({
    files: testFiles,
    readContent: () => ''
  });

  const pathViolations = violations.filter(v => v.type === 'path');
  assert.strictEqual(pathViolations.length, 5);
  assert.ok(pathViolations.some(v => v.file.includes('walkthrough.md')));
  assert.ok(pathViolations.some(v => v.file.includes('.gemini')));
  assert.ok(pathViolations.some(v => v.file.includes('brain/')));
  assert.ok(pathViolations.some(v => v.file.includes('session-notes')));
  assert.ok(pathViolations.some(v => v.file.includes('temp-download')));
  assert.ok(!pathViolations.some(v => v.file.includes('cool-stuff.js')));
});

test('Hygiene Checker - Prohibited content patterns', () => {
  const mockContent = {
    'src/index.js': 'const url = "file:///C:/Users/OrEo2/SecretFile";',
    'src/helper.js': 'console.log("C:\\Users\\John\\profile");',
    'README.md': 'We use OrEo2 profile for some local configurations.',
    'AGENTS.md': 'Do not commit OrEo2 or file:/// absolute paths.',
    'CLAUDE.md': 'Doctrine: follow C:\\Users\\OrEo2\\.engineering\\core-engineering-doctrine.md',
    'src/clean.js': 'console.log("Hello, World!");'
  };

  const violations = checkFiles({
    files: Object.keys(mockContent),
    readContent: (f) => mockContent[f]
  });

  const contentViolations = violations.filter(v => v.type === 'content');
  
  // README.md, AGENTS.md, and CLAUDE.md should be exempt from content checks
  assert.strictEqual(contentViolations.length, 4); // 3 violations in index.js, 1 in helper.js
  assert.ok(contentViolations.some(v => v.file === 'src/index.js'));
  assert.ok(contentViolations.some(v => v.file === 'src/helper.js'));
  assert.ok(!contentViolations.some(v => v.file === 'README.md'));
  assert.ok(!contentViolations.some(v => v.file === 'AGENTS.md'));
  assert.ok(!contentViolations.some(v => v.file === 'CLAUDE.md'));
  assert.ok(!contentViolations.some(v => v.file === 'src/clean.js'));
});

test('Hygiene Checker - .gitignore permits new legitimate source files', () => {
  const sampleSourcePaths = [
    'src/app/new-feature-test.mjs',
    'src/ui/components/NewComponentTest.tsx',
    'scripts/new-script-test.mjs',
    'tools/new-tool-test.mjs',
    'tests/new-test.test.mjs'
  ];

  for (const path of sampleSourcePaths) {
    try {
      execSync(`git check-ignore ${path}`, { stdio: 'pipe' });
      assert.fail(`Path ${path} was incorrectly ignored by .gitignore`);
    } catch (err) {
      // Exit code 1 from git check-ignore means the path is NOT ignored (which is expected)
      assert.strictEqual(err.status, 1, `Path ${path} should not be ignored by .gitignore`);
    }
  }
});

test('Repository line-ending policy is explicit and preserves attested binary sources', () => {
  const attributes = readFileSync('.gitattributes', 'utf8');
  assert.match(attributes, /^\* text=auto eol=lf$/m);
  assert.match(attributes, /^\*\.bat text eol=crlf$/m);
  for (const extension of ['gz', 'ico', 'png', 'woff2', 'xlsx', 'zip']) {
    assert.match(attributes, new RegExp(`^\\*\\.${extension} binary$`, 'm'));
  }
  assert.match(attributes, /^data\/curated\/\*\*\/source-fragments\/\*\.json -text$/m);
  assert.match(attributes, /^tools\/github-issue-complete\.mjs -text$/m);
});
