#!/usr/bin/env node

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import ts from 'typescript';

const UI_ROOT = join(process.cwd(), 'src', 'ui');
const OUTPUT = join(process.cwd(), 'artifacts', 'vale', 'ui-copy.md');

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory()
        ? sourceFiles(path)
        : Promise.resolve(path.endsWith('.tsx') ? [path] : []);
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

const sections = [];
for (const file of await sourceFiles(UI_ROOT)) {
  const source = await readFile(file, 'utf8');
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const strings = extractVisibleStrings(parsed);
  if (strings.length === 0) continue;
  sections.push(`## ${relative(process.cwd(), file).replaceAll('\\', '/')}\n\n${strings.join('\n\n')}`);
}

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(
  OUTPUT,
  `# Mounted React UI copy\n\nGenerated from JSX text and attributes. Human review remains authoritative.\n\n${sections.join('\n\n')}\n`,
);
console.log(`Extracted mounted UI copy from ${sections.length} TSX files to ${OUTPUT}`);
