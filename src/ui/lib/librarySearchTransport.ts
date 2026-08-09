export const LIBRARY_DOCUMENT_FIELDS = [
  "id",
  "item_id",
  "title",
  "description_available",
  "official_text_preview",
  "object_type",
  "source_id",
  "source_name",
  "publisher_name",
  "source_class",
  "catalog_id",
  "control_family",
  "severity",
  "published_connection_count",
  "published_connection_catalog_count",
] as const;

export function compactLibrarySearchTransport(value: unknown) {
  if (!value || typeof value !== "object") return value;
  const artifact = value as Record<string, unknown>;
  const library = artifact.library_search;
  if (!library || typeof library !== "object") return value;
  const documents = (library as { documents?: unknown }).documents;
  if (!Array.isArray(documents)) return value;
  const columns = LIBRARY_DOCUMENT_FIELDS.map((field) =>
    documents.map((document) => (document as Record<string, unknown>)[field]),
  );
  const metadata = { ...(library as Record<string, unknown>) };
  delete metadata.documents;
  return {
    ...artifact,
    library_search: {
      ...metadata,
      transport_columns: columns,
      transport_format: "columns-v1",
    },
  };
}

export async function expandLibrarySearchTransport(value: unknown) {
  if (!value || typeof value !== "object") return value;
  const artifact = value as Record<string, unknown>;
  const library = artifact.library_search;
  if (!library || typeof library !== "object") return value;
  const transport = library as {
    transport_columns?: unknown[][];
    transport_format?: string;
  } & Record<string, unknown>;
  if (
    transport.transport_format !== "columns-v1" ||
    !Array.isArray(transport.transport_columns) ||
    transport.transport_columns.length !== LIBRARY_DOCUMENT_FIELDS.length
  ) {
    return value;
  }
  const columns = transport.transport_columns;
  const documents: Array<Record<string, unknown>> = [];
  const chunkSize = 500;
  for (let index = 0; index < columns[0].length; index += chunkSize) {
    const end = Math.min(index + chunkSize, columns[0].length);
    for (let documentIndex = index; documentIndex < end; documentIndex += 1) {
      documents.push(Object.fromEntries(
        LIBRARY_DOCUMENT_FIELDS.map((field, fieldIndex) => [
          field,
          columns[fieldIndex][documentIndex],
        ]),
      ));
    }
    if (end < columns[0].length) {
      await new Promise<void>((resume) => window.setTimeout(resume, 0));
    }
  }
  const metadata = { ...transport };
  delete metadata.transport_columns;
  delete metadata.transport_format;
  return {
    ...artifact,
    library_search: { ...metadata, documents },
  };
}
