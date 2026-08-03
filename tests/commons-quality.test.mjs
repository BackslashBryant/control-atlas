import assert from "assert";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const DATASET_PATH = resolve("data/commons-resource-dataset.json");
const MANIFEST_PATH = resolve("data/commons-candidate-manifest.json");
const INDEX_PATH = resolve("data/generated/commons-search-index.json");
const SCHEMA_PATH = resolve("data/schemas/commons-resource-schema.json");
const CATALOG_BOOTSTRAP_PATH = resolve("data/generated/catalog-bootstrap.json");

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

// 3. Validate minimum resource count & category targets
// 2026-08-02: 13 official-lane resources removed — each duplicated a
// publication already canonically ingested as its own Catalog/Source
// (SP 800-53/53A/53B/37/171/172, CSF 2.0, AI RMF, SSDF, DISA STIG/SRG, CMMC
// rule, FedRAMP baselines). See docs/plans/audit-alignment-2026-08-02.md
// Phase 2a — an ingested publication must not also render as an ordinary
// Resource card.
assert.ok(dataset.resources.length >= 83, `Expected >= 83 resources, found ${dataset.resources.length}`);
console.log(`  ✓ Resource Count: ${dataset.resources.length} indexed resources`);

const officialCount = dataset.resources.filter(r => r.resourceLane === "official").length;
const openSourceCount = dataset.resources.filter(r => r.resourceLane === "open_source").length;
const practitionerCount = dataset.resources.filter(r => r.resourceLane === "practitioner" || r.resourceType === "community_forum").length;
const templateCount = dataset.resources.filter(r => r.resourceType === "template" || r.artifactTypes.includes("template")).length;
const toolCount = dataset.resources.filter(r => r.resourceType === "tool" || r.resourceLane === "open_source").length;
const datasetFeedCount = dataset.resources.filter(r => r.resourceType === "dataset" || r.resourceType === "specification" || r.formats.includes("JSON") || r.formats.includes("REST API")).length;
const commercialCount = dataset.resources.filter(r => r.resourceLane === "commercial" || r.costType === "freemium").length;
const legacyCount = dataset.resources.filter(r => r.resourceLane === "legacy" || r.maintenanceStatus === "archived").length;

assert.ok(officialCount >= 37, `Expected >= 37 official resources, found ${officialCount}`);
assert.ok(openSourceCount >= 32, `Expected >= 32 open-source resources, found ${openSourceCount}`);
assert.ok(practitionerCount >= 7, `Expected >= 7 practitioner resources, found ${practitionerCount}`);
assert.ok(templateCount >= 8, `Expected >= 8 template resources, found ${templateCount}`);
assert.ok(toolCount >= 33, `Expected >= 33 tool resources, found ${toolCount}`);
assert.ok(datasetFeedCount >= 7, `Expected >= 7 dataset/API resources, found ${datasetFeedCount}`);
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
  assert.equal(
    Object.hasOwn(r, "editorialRecommendation"),
    false,
    `Resource ${r.id} must not carry an editorial recommendation`,
  );
  assert.doesNotMatch(
    r.whyIncluded,
    /\b(?:authoritative|essential|governing|leading|mandatory|popular|recommended|widely used|widely recognized|industry-standard|battle-tested|pioneering)\b/i,
    `Resource ${r.id} whyIncluded must state an observable inclusion reason`,
  );
}
console.log("  ✓ Uniqueness and whyIncluded Statement Audits Passed");

// 3b. Ownership: an ingested Catalog publication must not also render as an
// ordinary Resource (docs/tree-model.md ownership rule; audit-alignment
// 2026-08-02 Phase 2a / Workstream 4). Each pattern is a distinctive token
// from a real ingested catalog's own name — specific enough that only a
// genuine duplicate-identity Resource would carry it too. Tool/template
// resources are exempt: a STIG viewer or an SSP template legitimately
// mentions its framework without duplicating the framework's own identity.
if (existsSync(CATALOG_BOOTSTRAP_PATH)) {
  const catalogBootstrap = JSON.parse(readFileSync(CATALOG_BOOTSTRAP_PATH, "utf-8"));
  const CATALOG_IDENTITY_TOKENS = {
    "cmmc-2": /\bcmmc\b.*\b(2\.0|32 cfr|170)\b/i,
    "csf-2": /\bcybersecurity framework\b.*\b2\.0\b|\bcsf\b.*\b2\.0\b/i,
    "disa-srg": /\bdisa\b.*\bsrg\b|\bsecurity requirements guides?\b/i,
    "disa-stig": /\bdisa\b.*\bstig\b|\bsecurity technical implementation guides?\b/i,
    "fedramp-rev5": /\bfedramp\b.*\bbaseline/i,
    "nist-800-171": /\bsp\s?800-171\b(?!a)/i,
    "nist-800-171-rev2": /\bsp\s?800-171\b.*\brev(?:ision)?\.?\s?2\b/i,
    "nist-800-172": /\bsp\s?800-172\b/i,
    "nist-800-37": /\bsp\s?800-37\b/i,
    "nist-800-53": /\bsp\s?800-53\b(?!a|b)/i,
    "nist-800-53a": /\bsp\s?800-53a\b/i,
    "nist-800-53b": /\bsp\s?800-53b\b/i,
    "nist-ai-rmf": /\bai rmf\b/i,
    "nist-ssdf": /\bssdf\b/i,
  };
  const EXEMPT_RESOURCE_TYPES = new Set(["tool", "template"]);

  for (const catalog of catalogBootstrap.catalog_bootstrap.catalogs) {
    const pattern = CATALOG_IDENTITY_TOKENS[catalog.id];
    if (!pattern) continue;
    const duplicate = dataset.resources.find(
      (r) =>
        r.resourceLane === "official" &&
        !EXEMPT_RESOURCE_TYPES.has(r.resourceType) &&
        pattern.test(r.name),
    );
    assert.equal(
      duplicate,
      undefined,
      `Resource '${duplicate?.id}' duplicates ingested catalog '${catalog.id}' (${catalog.name}, ${catalog.leaf_record_count} records) as an ordinary Resource — this publication already has a canonical Catalog/Source identity and must not have a second one.`,
    );
  }
  console.log("  ✓ Catalog Ownership Audit Passed (no ingested publication duplicated as a Resource)");
}

// 4. Validate collection integrity
assert.deepEqual(dataset.collections, [], "Superseded editorial collections stay removed");
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

// CMMC 2.0, DISA STIG, and FedRAMP baselines are canonical Catalog/Source
// publications now, not ordinary Resources (see 2026-08-02 note above) —
// these queries assert against the Resources that legitimately remain.
testSearch("CMMC", "community-cmmc-practitioner-discord");
testSearch("STIG", "tool-disa-stig-viewer");
testSearch("OSCAL", "official-nist-oscal");
testSearch("FedRAMP", "official-fedramp-marketplace");
testSearch("Trestle", "tool-compliance-trestle");
testSearch("PowerSTIG", "tool-powerstig");

console.log("  ✓ Search Relevance & Benchmark Queries Passed");
console.log("\n🎉 Control Commons Quality & Integrity Benchmark: 100% SUCCESS!\n");
