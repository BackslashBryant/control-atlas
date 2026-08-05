import test from 'node:test';
import assert from 'node:assert';
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
