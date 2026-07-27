import assert from "assert";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import Ajv from "ajv";
import addFormats from "ajv-formats";

import { execSync } from "child_process";

const DATASET_PATH = resolve("data/commons-resource-dataset.json");
const MANIFEST_PATH = resolve("data/commons-candidate-manifest.json");
const INDEX_PATH = resolve("data/generated/commons-search-index.json");
const SCHEMA_PATH = resolve("data/schemas/commons-resource-schema.json");

console.log("⚡ Running Control Commons Quality & Integrity Benchmark...");

// Rebuild so the index contract checks the dataset under test, not a stale
// generated artifact left by a previous build.
execSync("node scripts/build-commons-index.mjs");

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

// 3. Validate minimum resource count & category targets
assert.ok(dataset.resources.length >= 96, `Expected >= 96 resources, found ${dataset.resources.length}`);
console.log(`  ✓ Resource Count: ${dataset.resources.length} indexed resources`);

const officialCount = dataset.resources.filter(r => r.resourceLane === "official").length;
const openSourceCount = dataset.resources.filter(r => r.resourceLane === "open_source").length;
const practitionerCount = dataset.resources.filter(r => r.resourceLane === "practitioner" || r.resourceType === "community_forum").length;
const templateCount = dataset.resources.filter(r => r.resourceType === "template" || r.artifactTypes.includes("template")).length;
const toolCount = dataset.resources.filter(r => r.resourceType === "tool" || r.resourceLane === "open_source").length;
const datasetFeedCount = dataset.resources.filter(r => r.resourceType === "dataset" || r.resourceType === "specification" || r.formats.includes("JSON") || r.formats.includes("REST API")).length;
const commercialCount = dataset.resources.filter(r => r.resourceLane === "commercial" || r.costType === "freemium").length;
const legacyCount = dataset.resources.filter(r => r.resourceLane === "legacy" || r.maintenanceStatus === "archived").length;

assert.ok(officialCount >= 50, `Expected >= 50 official resources, found ${officialCount}`);
assert.ok(openSourceCount >= 32, `Expected >= 32 open-source resources, found ${openSourceCount}`);
assert.ok(practitionerCount >= 7, `Expected >= 7 practitioner resources, found ${practitionerCount}`);
assert.ok(templateCount >= 8, `Expected >= 8 template resources, found ${templateCount}`);
assert.ok(toolCount >= 33, `Expected >= 33 tool resources, found ${toolCount}`);
assert.ok(datasetFeedCount >= 9, `Expected >= 9 dataset/API resources, found ${datasetFeedCount}`);
assert.ok(commercialCount >= 3, `Expected >= 3 commercial resources, found ${commercialCount}`);
assert.ok(legacyCount >= 4, `Expected >= 4 legacy resources, found ${legacyCount}`);

console.log("  ✓ Category Breakdown Targets Passed:");
console.log(`    - Official: ${officialCount} | Open Source: ${openSourceCount} | Practitioner: ${practitionerCount}`);
console.log(`    - Templates: ${templateCount} | Tools: ${toolCount} | Datasets/APIs: ${datasetFeedCount}`);
console.log(`    - Commercial: ${commercialCount} | Legacy: ${legacyCount}`);

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
assert.ok(dataset.collections.length >= 10, `Expected >= 10 collections, found ${dataset.collections.length}`);
for (const col of dataset.collections) {
  assert.ok(col.id && col.title && col.whyCurated, `Collection ${col.id} missing metadata`);
  assert.ok(col.resourceIds.length >= 2, `Collection ${col.id} has too few resources`);
  for (const rid of col.resourceIds) {
    assert.ok(idSet.has(rid), `Collection ${col.id} references invalid resource ID: ${rid}`);
  }
}
console.log(`  ✓ Collection Integrity Audit Passed (${dataset.collections.length} collections verified)`);

// 5. Candidate Manifest & Rejection Audit
assert.strictEqual(manifest.totalEvaluated, manifest.acceptedCount + manifest.rejectedCount, "Manifest total matches sum");
assert.ok(manifest.totalEvaluated >= 106, `Expected >= 106 total evaluated candidates, found ${manifest.totalEvaluated}`);
assert.ok(manifest.acceptedCount === dataset.resources.length, "Manifest accepted count matches dataset");
assert.ok(manifest.rejectedCandidates.length >= 10, "Manifest records rejected candidates");
for (const rej of manifest.rejectedCandidates) {
  assert.ok(rej.candidateName && rej.url && rej.reason, "Rejected candidate missing required fields");
}
console.log(`  ✓ Candidate Manifest Audit Passed (${manifest.totalEvaluated} total evaluated: ${manifest.acceptedCount} accepted, ${manifest.rejectedCount} rejected with rationale)`);

// 6. Search Index Relevance & Benchmark Audits
assert.strictEqual(index.documents.length, dataset.resources.length, "Index document count matches dataset");
assert.strictEqual(
  index.builtAt,
  new Date(`${dataset.lastUpdated}T00:00:00.000Z`).toISOString(),
  "Index build stamp is deterministic and follows the source dataset freshness date",
);

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
