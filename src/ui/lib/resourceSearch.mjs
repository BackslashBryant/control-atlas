import MiniSearch from "minisearch";

const indexes = new WeakMap();

function indexFor(documents) {
  const cached = indexes.get(documents);
  if (cached) return cached;
  const index = new MiniSearch({
    fields: [
      "name",
      "shortName",
      "summary",
      "whyIncluded",
      "searchableText",
    ],
    storeFields: ["id"],
    searchOptions: {
      boost: { name: 4, shortName: 4, whyIncluded: 2 },
      prefix: true,
      fuzzy: 0.15,
    },
  });
  index.addAll(documents.map((document) => ({
    ...document,
    searchableText: [
      document.searchableText,
      document.cardPurpose,
      document.publisher,
      document.publisherType,
      document.resourceType,
      document.accessType,
      document.costType,
      ...(document.searchAliases || []),
      ...(document.searchKeywords || []),
      ...(document.frameworks || []),
      ...(document.programs || []),
      ...(document.lifecycleStages || []),
      ...(document.audiences || []),
      ...(document.technologyScopes || []),
      ...(document.featuredCollections || []),
    ].filter(Boolean).join(" "),
  })));
  indexes.set(documents, index);
  return index;
}

export function searchResourceDocuments(documents, query, limit = Infinity) {
  const normalized = String(query || "").trim();
  if (!normalized) {
    return documents.slice(0, limit).map((document) => ({
      document,
      evidence: [],
    }));
  }
  const byId = new Map(documents.map((document) => [document.id, document]));
  return indexFor(documents)
    .search(normalized)
    .slice(0, limit)
    .map((result) => ({
      document: byId.get(result.id),
      evidence: Object.keys(result.match || {}),
    }))
    .filter((entry) => entry.document);
}
