#!/usr/bin/env node
/*
 Lightweight ticket header validator (non-blocking)
 Scans docs/tickets/*.md and warns if frontmatter is malformed or missing required fields.
 Required fields: id (TKT-123), title, status (Open|In Progress|Done), priority (Low|Medium|High)
*/
import fs from 'fs';
import path from 'path';

function readTicketFiles(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.md'))
      .map((e) => path.join(dir, e.name));
  } catch {
    return [];
  }
}

function parseFrontmatter(content) {
  const lines = content.split(/\r?\n/);
  if (lines[0] !== '---') return null;
  let i = 1;
  const fmLines = [];
  while (i < lines.length && lines[i] !== '---') {
    fmLines.push(lines[i]);
    i += 1;
  }
  if (i >= lines.length) return null;
  const obj = {};
  for (const rawLine of fmLines) {
    const line = rawLine.replace(/\s+#.*$/, '').trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const valueRaw = line.slice(idx + 1).trim();
    if (valueRaw.startsWith('[') && valueRaw.endsWith(']')) {
      const inside = valueRaw.slice(1, -1).trim();
      const arr = inside
        ? inside.split(',').map((s) => s.trim().replace(/^"|^'|"$|'$/g, '')).filter(Boolean)
        : [];
      obj[key] = arr;
    } else {
      obj[key] = valueRaw.replace(/^"|^'|"$|'$/g, '');
    }
  }
  return obj;
}

function validateHeader(filePath, header) {
  const warnings = [];
  if (!header) {
    warnings.push('missing frontmatter block');
    return warnings;
  }
  // id
  if (!header.id || typeof header.id !== 'string') {
    warnings.push('missing id');
  } else if (!/^TKT-\d+$/.test(header.id)) {
    warnings.push(`invalid id '${header.id}' (expected TKT-123)`);
  }
  // title
  if (!header.title || typeof header.title !== 'string' || header.title.trim().length === 0) {
    warnings.push('missing title');
  }
  // status
  const validStatus = ['Open', 'In Progress', 'Done'];
  if (!header.status || !validStatus.includes(header.status)) {
    warnings.push(`invalid status '${header.status ?? ''}' (Open|In Progress|Done)`);
  }
  // priority
  const validPriority = ['Low', 'Medium', 'High'];
  if (!header.priority || !validPriority.includes(header.priority)) {
    warnings.push(`invalid priority '${header.priority ?? ''}' (Low|Medium|High)`);
  }
  return warnings;
}

function main() {
  const dir = path.join(process.cwd(), 'docs', 'tickets');
  let files = readTicketFiles(dir);
  // Ignore plan table
  files = files.filter((f) => path.basename(f).toLowerCase() !== 'ticket_plan.md');
  let totalWarnings = 0;
  for (const f of files) {
    const content = fs.readFileSync(f, 'utf8');
    const header = parseFrontmatter(content);
    const warnings = validateHeader(f, header);
    if (warnings.length > 0) {
      totalWarnings += warnings.length;
      console.warn(`WARNING: ${path.relative(process.cwd(), f)} -> ${warnings.join('; ')}`);
    }
  }
  if (files.length === 0) {
    console.log('Ticket header validation: no ticket files found.');
  } else if (totalWarnings === 0) {
    console.log(`Ticket header validation: OK (${files.length} files checked).`);
  } else {
    console.warn(`Ticket header validation completed with ${totalWarnings} warning(s) across ${files.length} file(s).`);
  }
  // Always succeed (non-blocking)
  process.exit(0);
}

main();


