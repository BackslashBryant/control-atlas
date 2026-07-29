#!/usr/bin/env node

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import ts from 'typescript';

const OUTPUT = join(process.cwd(), 'artifacts', 'vale', 'ui-copy.md');
const SPEAKER_MANIFEST = join(
  process.cwd(),
  'data',
  'ui-copy-speaker-manifest.json',
);

async function sourceFiles(directory, extensions) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory()
        ? sourceFiles(path, extensions)
        : Promise.resolve(extensions.some((extension) => path.endsWith(extension)) ? [path] : []);
    }),
  );
  return nested.flat();
}

function clean(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function extractVisibleStrings(sourceFile) {
  const strings = [];
  function visit(node, insideJsxExpression = false) {
    if (ts.isJsxText(node)) {
      const value = clean(node.getText(sourceFile));
      if (value) strings.push(value);
      return;
    }
    if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
      const value = clean(node.initializer.text);
      if (value) strings.push(value);
      return;
    }
    if (insideJsxExpression && ts.isStringLiteral(node)) {
      let parent = node.parent;
      let isRenderedLiteral = true;
      while (parent && !ts.isJsxExpression(parent)) {
        if (
          ts.isCallExpression(parent) ||
          ts.isObjectLiteralExpression(parent) ||
          ts.isArrayLiteralExpression(parent)
        ) {
          isRenderedLiteral = false;
          break;
        }
        parent = parent.parent;
      }
      if (!isRenderedLiteral) return;
      const value = clean(node.text);
      if (value) strings.push(value);
      return;
    }
    const nextInside = insideJsxExpression || ts.isJsxExpression(node);
    ts.forEachChild(node, (child) => visit(child, nextInside));
  }
  visit(sourceFile);
  return [...new Set(strings)].filter(
    (value) => /[A-Za-z]{2}/.test(value) && !/^[.#/][\w./:-]+$/.test(value),
  );
}

function extractModuleStrings(source, file) {
  const parsed = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  const strings = [];
  function visit(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const value = clean(node.text);
      if (/[A-Za-z]{2}/.test(value)) strings.push(value);
    }
    ts.forEachChild(node, visit);
  }
  visit(parsed);
  return [...new Set(strings)];
}

function extractJsonStrings(value, strings = []) {
  if (typeof value === 'string') {
    const cleaned = clean(value);
    if (/[A-Za-z]{2}/.test(cleaned)) strings.push(cleaned);
  } else if (Array.isArray(value)) {
    value.forEach((entry) => extractJsonStrings(entry, strings));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((entry) => extractJsonStrings(entry, strings));
  }
  return [...new Set(strings)];
}

const manifest = JSON.parse(await readFile(SPEAKER_MANIFEST, 'utf8'));
const sections = [];
for (const rule of manifest.rules) {
  const files = [
    ...(rule.root
      ? await sourceFiles(
          join(process.cwd(), rule.root),
          rule.extensions || [],
        )
      : []),
    ...(rule.files || []).map((file) => join(process.cwd(), file)),
  ];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    let strings = [];
    if (rule.extraction === 'jsx-visible') {
      const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      strings = extractVisibleStrings(parsed);
    } else if (rule.extraction === 'module-literals') {
      strings = extractModuleStrings(source, file);
    } else if (rule.extraction === 'json-values') {
      strings = extractJsonStrings(JSON.parse(source));
    }
    if (strings.length === 0) continue;
    sections.push(
      `## ${relative(process.cwd(), file).replaceAll('\\', '/')}\n\nSpeaker: \`${rule.speaker}\`\n\n${strings.join('\n\n')}`,
    );
  }
}

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(
  OUTPUT,
  `# Speaker-aware Control Atlas copy inventory\n\nGenerated from the governed speaker manifest. Official-source exemptions remain subject to source-identity validation. Human editorial review remains authoritative.\n\n${sections.join('\n\n')}\n`,
);
console.log(`Extracted governed copy from ${sections.length} files to ${OUTPUT}`);
