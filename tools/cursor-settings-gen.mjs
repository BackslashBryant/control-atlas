#!/usr/bin/env node

/**
 * Regenerates a minimal Cursor settings guide.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const outputPath = path.join(repoRoot, 'docs', 'cursor', 'SETTINGS_GUIDE.md');

const guide = `# Cursor Settings Guide

Keep Cursor setup simple.

## Recommended

- Enable Agent Mode.
- Enable codebase indexing.
- Keep \`.cursorignore\` current so generated or heavy artifacts do not pollute context.
- Use the project rules and agents from \`.cursor/\`.
- Keep MCP servers limited to the project's actual needs.

## First-Run Agent Path

Ask the agent to bootstrap the repo. It should run:

\`\`\`bash
npm run agent:bootstrap -- --apply
\`\`\`

Manual setup is still available:

\`\`\`bash
npm run status
npm run setup:agents
npm run mcp:suggest
\`\`\`

## Notes

Pinned agents are optional. The repo works through rules and skills even without manually creating every agent in the Cursor sidebar.
`;

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, guide, 'utf8');
console.log(`Generated: ${path.relative(repoRoot, outputPath)}`);
