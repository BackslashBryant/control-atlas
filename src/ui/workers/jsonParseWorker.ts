type ParseRequest = {
  bytes: ArrayBuffer;
};

type ParseResponse =
  | { ok: true; value: unknown }
  | { message: string; ok: false };

const LIBRARY_DOCUMENT_FIELDS = [
  "id",
  "item_id",
  "title",
  "description_available",
  "object_type",
  "source_id",
  "source_name",
  "source_class",
  "catalog_id",
  "control_family",
  "severity",
] as const;

function compactLibrarySearchTransport(value: unknown) {
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

self.addEventListener("message", (event: MessageEvent<ParseRequest>) => {
  try {
    const text = new TextDecoder().decode(event.data.bytes);
    const response: ParseResponse = {
      ok: true,
      value: compactLibrarySearchTransport(JSON.parse(text)),
    };
    self.postMessage(response);
  } catch (error) {
    const response: ParseResponse = {
      message: error instanceof Error ? error.message : String(error),
      ok: false,
    };
    self.postMessage(response);
  }
});

export {};
