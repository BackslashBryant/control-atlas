type AtlasSearchDocument = {
  id: string;
  item_id?: string;
  title?: string;
};

type AtlasSearchRuntime = {
  searchLibrary: (query: string) => AtlasSearchDocument[];
};

export type AtlasSearchTransition =
  | {
      kind: "focus";
      nodeId: string;
      query: string;
      announcement: string;
    }
  | {
      kind: "search";
      query: string;
      announcement: string;
    }
  | {
      kind: "no-match";
      query: string;
      announcement: string;
    };

function normalizedIdentifier(value: string) {
  return value.trim().toLocaleUpperCase();
}

export function resolveAtlasSearchTransition(
  runtime: AtlasSearchRuntime,
  rawQuery: string,
): AtlasSearchTransition {
  const query = rawQuery.trim();
  const results = runtime.searchLibrary(query);
  const normalizedQuery = normalizedIdentifier(query);
  const exact = results.filter(
    (entry) => normalizedIdentifier(entry.item_id || "") === normalizedQuery,
  );

  if (exact.length === 1) {
    const itemId = exact[0].item_id || query;
    return {
      kind: "focus",
      nodeId: exact[0].id,
      query,
      announcement: `Opening ${itemId} in the focused Atlas.`,
    };
  }
  if (results.length > 0) {
    return {
      kind: "search",
      query,
      announcement: `Showing search results for ${query}.`,
    };
  }
  return {
    kind: "no-match",
    query,
    announcement: `No Atlas record matches ${query}. Try Search or browse the Catalog.`,
  };
}
