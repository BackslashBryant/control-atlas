import { existsSync, readFileSync } from 'node:fs';

function withoutGeneratedAt(document) {
  const { generated_at: _generatedAt, ...stable } = document || {};
  return stable;
}

/** Preserve the previous generation time when the generated payload is equal. */
export function preserveGeneratedAt(path, nextDocument) {
  if (!existsSync(path)) return nextDocument;
  try {
    const previous = JSON.parse(readFileSync(path, 'utf8'));
    const unchanged = JSON.stringify(withoutGeneratedAt(previous))
      === JSON.stringify(withoutGeneratedAt(nextDocument));
    return unchanged && previous.generated_at
      ? { ...nextDocument, generated_at: previous.generated_at }
      : nextDocument;
  } catch {
    return nextDocument;
  }
}
