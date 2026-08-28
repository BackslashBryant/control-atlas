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

/** Compare mark text and label on letters and digits only ("ATT&CK" vs "ATTCK"). */
function markComparisonKey(value) {
  return String(value || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

/**
 * A fallback monogram that repeats the visible label renders as a duplicated
 * word ("NIST NIST") and adds no recognition. Show a mark only when it is an
 * approved official asset or its fallback text differs from the label.
 */
export function identityMarkAddsSignal(termId, label) {
  const identity = resolveIdentity(termId);
  if (!identity) return false;
  if (identity.verification_status === "verified_official" && identity.asset_path) {
    return true;
  }
  const fallbackKey = markComparisonKey(identity.fallback?.value);
  return Boolean(fallbackKey) && fallbackKey !== markComparisonKey(label);
}
