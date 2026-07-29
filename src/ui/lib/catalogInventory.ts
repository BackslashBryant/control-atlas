export function publicationSourceForCatalog(
  runtime: {
    getNodes: (filters?: Record<string, string>) => any[];
    getSource: (id: string) => any;
  },
  catalogId: string,
) {
  const catalogRoot = runtime
    .getNodes({ catalog_id: catalogId })
    .find(
      (node: any) =>
        node.node_type === "catalog" &&
        node.metadata?.catalog_id === catalogId &&
        node.source_id,
    );
  return catalogRoot?.source_id
    ? runtime.getSource(catalogRoot.source_id) || null
    : null;
}

export function paginateCatalogRecords<T>(
  records: readonly T[],
  requestedPage: number,
  pageSize: number,
) {
  const pageCount = Math.max(1, Math.ceil(records.length / pageSize));
  const valid =
    Number.isInteger(requestedPage) &&
    requestedPage >= 1 &&
    requestedPage <= pageCount;
  const start = valid ? (requestedPage - 1) * pageSize : 0;
  return {
    valid,
    pageCount,
    total: records.length,
    records: valid ? records.slice(start, start + pageSize) : [],
  };
}
