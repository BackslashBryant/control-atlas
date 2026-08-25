const SIGNAL_CATEGORIES = new Set(["source", "content", "topic", "action"]);

const SOURCE_RULES = Object.freeze([
  { id: "source-nist", label: "NIST", pattern: /\bNIST\b|National Institute of Standards and Technology/i, priority: 100 },
  { id: "source-disa", label: "DISA", pattern: /\bDISA\b|Defense Information Systems Agency/i, priority: 98 },
  { id: "source-mitre", label: "MITRE", pattern: /\bMITRE\b/i, priority: 90 },
  { id: "source-dod", label: "DoD", pattern: /\bDoD\b|Department of Defense/i, priority: 86 },
]);

const CONTENT_RULES = Object.freeze([
  { id: "content-stig", label: "STIG", pattern: /\bSTIGs?\b/i, priority: 99 },
  { id: "content-zero-trust", label: "Zero Trust", pattern: /Zero Trust/i, priority: 97 },
  { id: "content-attack", label: "ATT&CK", pattern: /ATT&CK/i, priority: 95 },
  { id: "content-d3fend", label: "D3FEND", pattern: /D3FEND/i, priority: 92 },
  { id: "content-cmmc", label: "CMMC", pattern: /\bCMMC\b/i, priority: 89 },
  { id: "content-srg", label: "SRG", pattern: /\bSRGs?\b/i, priority: 87 },
  { id: "content-fedramp", label: "FedRAMP", pattern: /\bFedRAMP\b/i, priority: 84 },
  { id: "content-cui", label: "CUI", pattern: /\bCUI\b|Controlled Unclassified Information/i, priority: 80 },
]);

const TOPIC_RULES = Object.freeze([
  { id: "topic-servers", label: "Servers", tagId: "asset.server", priority: 78 },
  { id: "topic-identity", label: "Identity", tagId: "asset.identity-system", priority: 77 },
  { id: "topic-cloud", label: "Cloud", tagId: "environment.cloud", priority: 76 },
  { id: "topic-network", label: "Network", tagId: "asset.network-device", priority: 75 },
  { id: "topic-containers", label: "Containers", tagId: "asset.container", priority: 74 },
]);

const ACTION_RULES = Object.freeze([
  { id: "action-find", label: "Find", capability: "search", priority: 72 },
  { id: "action-check", label: "Check", capability: "sources", priority: 71 },
  { id: "action-compare", label: "Compare", capability: "compare", priority: 70 },
  { id: "action-learn", label: "Learn", capability: "guides", priority: 69 },
  { id: "action-trace", label: "Trace", capability: "connections", priority: 68 },
]);

function positiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`Atlas presentation metric ${label} must be a positive integer.`);
  }
  return value;
}

export function compactAtlasCount(value) {
  return value >= 1000 ? `${Math.floor(value / 1000)}K+` : value.toLocaleString("en-US");
}

/**
 * Corpus-wide count semantics:
 * - records: documents in the generated Library search index;
 * - connections: published links in the generated connection inventory;
 * - publications: distinct identities in the publication identity index.
 * Every value is required and cross-checked against its sibling generated data.
 */
export function deriveAtlasScopeMetrics({
  librarySearchIndex,
  connectionInventory,
  publicationIdentityIndex,
}) {
  const records = positiveInteger(
    librarySearchIndex?.library_search_index?.document_count,
    "records",
  );
  const shardedRecords = positiveInteger(
    librarySearchIndex?.sharded_collection?.record_count,
    "sharded records",
  );
  if (records !== shardedRecords) {
    throw new Error(`Atlas presentation record counts disagree: ${records} !== ${shardedRecords}.`);
  }

  const connections = positiveInteger(
    connectionInventory?.connection_inventory?.publishedLinks,
    "connections",
  );
  const publications = positiveInteger(
    publicationIdentityIndex?.identity_count,
    "publications",
  );
  const identities = publicationIdentityIndex?.identities;
  if (!Array.isArray(identities) || identities.length !== publications) {
    throw new Error("Atlas presentation publication identities do not match identity_count.");
  }

  return Object.freeze({
    records,
    connections,
    publications,
    compact: Object.freeze({
      records: compactAtlasCount(records),
      connections: compactAtlasCount(connections),
      publications: compactAtlasCount(publications),
    }),
  });
}

export function countLibraryTaxonomyTags(librarySearchIndex, shardArtifacts) {
  const fields = librarySearchIndex?.library_search_index?.fields;
  const expectedShards = librarySearchIndex?.sharded_collection?.shards;
  if (!Array.isArray(fields) || !Array.isArray(expectedShards)) {
    throw new Error("Atlas brand signals require a valid Library search index manifest.");
  }
  if (!Array.isArray(shardArtifacts) || shardArtifacts.length !== expectedShards.length) {
    throw new Error("Atlas brand signals require every Library search index shard.");
  }

  const taxonomyColumn = fields.indexOf("taxonomy_tags");
  if (taxonomyColumn < 0) {
    throw new Error("Atlas brand signals require the taxonomy_tags search field.");
  }

  const counts = new Map();
  shardArtifacts.forEach((artifact, index) => {
    const columns = artifact?.library_search_index?.columns;
    const tagsByRecord = columns?.[taxonomyColumn];
    const expectedCount = expectedShards[index]?.record_count;
    if (!Array.isArray(tagsByRecord) || tagsByRecord.length !== expectedCount) {
      throw new Error(`Atlas brand signal shard ${index} is missing taxonomy coverage.`);
    }
    for (const tags of tagsByRecord) {
      for (const tag of Array.isArray(tags) ? tags : []) {
        if (typeof tag?.id === "string") {
          counts.set(tag.id, (counts.get(tag.id) || 0) + 1);
        }
      }
    }
  });
  return counts;
}

function identityCoverage(identities, pattern) {
  let count = 0;
  for (const identity of identities) {
    const haystack = [identity?.name, identity?.publisher, identity?.catalog_id]
      .filter(Boolean)
      .join(" ");
    if (!pattern.test(haystack)) continue;
    count += identity?.catalog_counts?.normalized_records || 1;
  }
  return count;
}

function publisherCoverage(identities, pattern) {
  return identities.filter((identity) => pattern.test(String(identity?.publisher || ""))).length;
}

function isPresentationEligible(signal) {
  return (
    SIGNAL_CATEGORIES.has(signal.category) &&
    Number.isSafeInteger(signal.count) &&
    signal.count > 0 &&
    signal.label.length <= 18 &&
    !/runtime|taxonomy|ontology|provenance|canonical/i.test(signal.label)
  );
}

export function buildAtlasBrandSignals({
  publicationIdentityIndex,
  tagCounts,
  capabilities,
}) {
  const identities = publicationIdentityIndex?.identities;
  if (!Array.isArray(identities) || !(tagCounts instanceof Map)) {
    throw new Error("Atlas brand signals require publication identities and taxonomy coverage.");
  }

  const candidates = [
    ...SOURCE_RULES.map((rule) => ({
      id: rule.id,
      label: rule.label,
      category: "source",
      count: publisherCoverage(identities, rule.pattern),
      priority: rule.priority,
      splashEligible: true,
    })),
    ...CONTENT_RULES.map((rule) => ({
      id: rule.id,
      label: rule.label,
      category: "content",
      count: identityCoverage(identities, rule.pattern),
      priority: rule.priority,
      splashEligible: true,
    })),
    ...TOPIC_RULES.map((rule) => ({
      id: rule.id,
      label: rule.label,
      category: "topic",
      count: tagCounts.get(rule.tagId) || 0,
      priority: rule.priority,
      splashEligible: true,
    })),
    ...ACTION_RULES.map((rule) => ({
      id: rule.id,
      label: rule.label,
      category: "action",
      count: capabilities?.[rule.capability] ? 1 : 0,
      priority: rule.priority,
      splashEligible: true,
    })),
  ];

  const labels = new Set();
  return Object.freeze(
    candidates
      .filter(isPresentationEligible)
      .sort((left, right) => right.priority - left.priority || left.label.localeCompare(right.label))
      .filter((signal) => {
        const key = signal.label.toLocaleLowerCase("en-US");
        if (labels.has(key)) return false;
        labels.add(key);
        return true;
      })
      .map((signal) => Object.freeze(signal)),
  );
}
