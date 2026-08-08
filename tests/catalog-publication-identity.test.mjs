import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validateCatalogPublicationIdentity } from "../src/app/catalog-publication-identity.mjs";
import { readGeneratedCollection } from "../scripts/lib/generated-graph-artifacts.mjs";

const nodes = readGeneratedCollection(".", "nodes").nodes;
const sources = JSON.parse(
  readFileSync("data/generated/sources.json", "utf8"),
).sources;

const exactOscalPublicationByCatalog = new Map([
  ["nist-800-53", ["nist-800-53", "nist-oscal"]],
  ["nist-800-171", ["nist-800-171", "nist-oscal"]],
  ["csf-2", ["nist-csf-2", "nist-oscal"]],
  ["nist-ssdf", ["nist-ssdf", "nist-ssdf-oscal"]],
]);

test("OSCAL-fed records resolve exact publication identity separately from ingestion provenance", () => {
  for (const [
    catalogId,
    [publicationSourceId, ingestionSourceId],
  ] of exactOscalPublicationByCatalog) {
    const catalogNodes = nodes.filter(
      (node) => node.metadata?.catalog_id === catalogId,
    );
    assert.ok(catalogNodes.length > 0, `missing generated nodes for ${catalogId}`);
    for (const node of catalogNodes) {
      assert.equal(
        node.source_id,
        publicationSourceId,
        `${node.id} must use the exact publication identity`,
      );
      assert.equal(
        node.metadata?.ingestion_source_id,
        ingestionSourceId,
        `${node.id} must retain OSCAL ingestion provenance separately`,
      );
    }
  }
});

test("the full generated corpus has exact publication identity and ingestion provenance", () => {
  assert.deepEqual(validateCatalogPublicationIdentity(nodes, sources), []);
});

test("missing or mismatched publication identity fails closed", () => {
  const missing = structuredClone(nodes[0]);
  delete missing.metadata.ingestion_source_id;
  const mismatched = structuredClone(
    nodes.find((node) => node.metadata?.catalog_id === "csf-2"),
  );
  mismatched.source_id = "nist-oscal";

  const errors = validateCatalogPublicationIdentity(
    [missing, mismatched],
    sources,
  );
  assert.ok(errors.some((error) => error.includes("ingestion provenance")));
  assert.ok(errors.some((error) => error.includes("ingestion source")));
});
