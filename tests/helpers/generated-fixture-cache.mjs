import { readGeneratedCollection } from '../../scripts/lib/generated-graph-artifacts.mjs';

export function createGeneratedFixtureReader(options = {}) {
  const root = options.root ?? '.';
  const read = options.read ?? readGeneratedCollection;
  const cache = new Map();

  return (name) => {
    if (!cache.has(name)) cache.set(name, read(root, name));
    return cache.get(name);
  };
}
