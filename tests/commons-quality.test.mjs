import assert from "assert";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const DATASET_PATH = resolve("data/commons-resource-dataset.json");
const MANIFEST_PATH = resolve("data/commons-candidate-manifest.json");
const INDEX_PATH = resolve("data/generated/commons-search-index.json");
const SCHEMA_PATH = resolve("data/schemas/commons-resource-schema.json");

console.log("⚡ Running Control Commons Quality & Integrity Benchmark...");

// 1. Check file existence
assert.ok(existsSync(DATASET_PATH), "Dataset file exists");
assert.ok(existsSync(MANIFEST_PATH), "Candidate manifest exists");
assert.ok(existsSync(INDEX_PATH), "Generated search index exists");
assert.ok(existsSync(SCHEMA_PATH), "JSON schema exists");

const dataset = JSON.parse(readFileSync(DATASET_PATH, "utf-8"));
const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));
const index = JSON.parse(readFileSync(INDEX_PATH, "utf-8"));
const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf-8"));

// 2. Validate against JSON Schema with AJV
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);
const valid = validate(dataset);

if (!valid) {
  console.error("AJV Validation Errors:", validate.errors);
  assert.fail("Commons dataset failed JSON schema validation");
}
console.log("  ✓ Schema Validation Passed");

// 3. Validate minimum resource count & field integrity
assert.ok(dataset.resources.length >= 75, `Expected >= 75 resources, found ${dataset.resources.length}`);
console.log(`  ✓ Resource Count: ${dataset.resources.length} indexed resources`);

const idSet = new Set();
const urlSet = new Set();

for (const r of dataset.resources) {
  assert.ok(r.id, "Resource ID is present");
  assert.ok(!idSet.has(r.id), `Duplicate resource ID: ${r.id}`);
  idSet.add(r.id);

  assert.ok(r.canonicalUrl, `Resource ${r.id} missing canonicalUrl`);
  assert.ok(!urlSet.has(r.canonicalUrl), `Duplicate canonical URL: ${r.canonicalUrl}`);
  urlSet.add(r.canonicalUrl);

  assert.ok(r.whyIncluded && r.whyIncluded.trim().length > 10, `Resource ${r.id} missing valid whyIncluded statement`);
  assert.ok(r.resourceLane, `Resource ${r.id} missing resourceLane`);
  assert.ok(r.publisher, `Resource ${r.id} missing publisher`);
}
console.log("  ✓ Uniqueness and whyIncluded Statement Audits Passed");

// 4. Validate collection integrity
assert.ok(dataset.collections.length >= 8, `Expected >= 8 collections, found ${dataset.collections.length}`);
for (const col of dataset.collections) {
  assert.ok(col.id && col.title && col.whyCurated, `Collection ${col.id} missing metadata`);
  assert.ok(col.resourceIds.length >= 2, `Collection ${col.id} has too few resources`);
  for (const rid of col.resourceIds) {
    assert.ok(idSet.has(rid), `Collection ${col.id} references invalid resource ID: ${rid}`);
  }
}
console.log(`  ✓ Collection Integrity Audit Passed (${dataset.collections.length} collections verified)`);

// 5. Candidate Manifest & Rejection Audit
assert.ok(manifest.acceptedCount === dataset.resources.length, "Manifest accepted count matches dataset");
assert.ok(manifest.rejectedCandidates.length >= 5, "Manifest records rejected candidates");
for (const rej of manifest.rejectedCandidates) {
  assert.ok(rej.candidateName && rej.url && rej.reason, "Rejected candidate missing required fields");
}
console.log(`  ✓ Research Manifest Audit Passed (${manifest.rejectedCandidates.length} rejected candidates logged with reasons)`);

// 6. Search Index Relevance & Benchmark Audits
assert.strictEqual(index.documents.length, dataset.resources.length, "Index document count matches dataset");

function testSearch(query, expectedId) {
  const q = query.toLowerCase();
  const matches = index.documents.filter((doc) =>
    doc.name.toLowerCase().includes(q) ||
    doc.shortName.toLowerCase().includes(q) ||
    doc.searchableText.includes(q)
  );
  assert.ok(matches.length > 0, `Search query '${query}' returned no results`);
  const found = matches.some((m) => m.id === expectedId);
  assert.ok(found, `Search query '${query}' did not contain expected resource ID '${expectedId}'`);
}

testSearch("CMMC", "official-cmmc-32cfr-170");
testSearch("STIG", "official-disa-stig-library");
testSearch("OSCAL", "official-nist-oscal");
testSearch("FedRAMP", "official-fedramp-baselines");
testSearch("Trestle", "tool-compliance-trestle");
testSearch("PowerSTIG", "tool-powerstig");

console.log("  ✓ Search Relevance & Benchmark Queries Passed");
console.log("\n🎉 Control Commons Quality & Integrity Benchmark: 100% SUCCESS!\n");
