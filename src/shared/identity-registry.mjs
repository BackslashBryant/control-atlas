import registry from "../../data/generated/taxonomy-registry.json" with { type: "json" };

const byKey = new Map(registry.identities.map((entry) => [entry.key, entry]));
const byTermId = new Map();
for (const entry of registry.identities) {
  for (const tid of entry.term_ids) {
    byTermId.set(tid, entry);
  }
}

export const IDENTITY_REGISTRY = registry.identities;

export function resolveIdentity(termId) {
  return byTermId.get(termId) ?? null;
}

export function resolveIdentityByKey(key) {
  return byKey.get(key) ?? null;
}
