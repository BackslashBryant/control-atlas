import assert from "node:assert/strict";
import test from "node:test";

import {
  compactLibrarySearchTransport,
  expandLibrarySearchTransport,
  LIBRARY_DOCUMENT_FIELDS,
} from "../../src/ui/lib/librarySearchTransport";

test("library search transport preserves every result-answer field", async () => {
  const document = {
    id: "nist-800-53:AC-2",
    item_id: "AC-2",
    title: "Account Management",
    description_available: true,
    official_text_preview: "Manage system accounts, including establishing, activating, modifying, reviewing, disabling, and removing accounts.",
    object_type: "control",
    source_id: "nist-800-53",
    source_name: "SP 800-53 Rev. 5",
    publisher_name: "NIST",
    source_class: "federal_published",
    catalog_id: "nist-800-53",
    control_family: "Access Control",
    severity: "",
    published_connection_count: 7,
    published_connection_catalog_count: 4,
  };
  const artifact = {
    schema_version: "1.0",
    library_search: {
      document_count: 1,
      facets: { publishers: ["NIST"] },
      documents: [document],
    },
  };

  const compacted = compactLibrarySearchTransport(artifact) as {
    library_search: {
      documents?: unknown;
      transport_columns: unknown[][];
      transport_format: string;
    };
  };
  assert.equal(compacted.library_search.documents, undefined);
  assert.equal(compacted.library_search.transport_format, "columns-v1");
  assert.equal(
    compacted.library_search.transport_columns.length,
    LIBRARY_DOCUMENT_FIELDS.length,
  );

  const expanded = await expandLibrarySearchTransport(compacted) as typeof artifact;
  assert.deepEqual(expanded.library_search.documents, [document]);
  assert.deepEqual(expanded.library_search.facets.publishers, ["NIST"]);
});
