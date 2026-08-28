import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isGitHubUrl } from "../scripts/lib/url-classification.mjs";

import { searchDirectoryResources } from "../src/ui/lib/resourcesDirectory.mjs";

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const dataset = readJson("data/commons-resource-dataset.json");
const manifest = readJson("data/commons-candidate-manifest.json");
const master = readJson("data/curated/commons-operator-ecosystem-master.json");
const index = readJson("data/generated/commons-search-index.json");
const byId = new Map(dataset.resources.map((resource) => [resource.id, resource]));
const acceptedByName = new Map(manifest.acceptedCandidates.map((candidate) => [candidate.candidateName, candidate]));
const rejectedByName = new Map(manifest.rejectedCandidates.map((candidate) => [candidate.candidateName, candidate]));

const daysBetween = (start, end) => (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000;

test("all 79 master candidates have one evidence-backed disposition", () => {
  assert.equal(master.candidates.length, 79);
  assert.equal(master.candidates.filter((candidate) => candidate.finalDisposition === "accepted").length, 78);
  assert.equal(master.candidates.filter((candidate) => candidate.finalDisposition === "rejected").length, 1);

  for (const candidate of master.candidates) {
    const accepted = acceptedByName.has(candidate.name);
    const rejected = rejectedByName.has(candidate.name);
    assert.notEqual(accepted, rejected, `${candidate.name} has exactly one disposition`);
    assert.ok(candidate.evidence.startsWith("https://"), `${candidate.name} has source evidence`);
    if (candidate.finalDisposition === "accepted") {
      const resource = byId.get(candidate.resourceId);
      assert.ok(resource, `${candidate.name} resolves to ${candidate.resourceId}`);
      assert.equal(resource.name, candidate.name);
      assert.equal(resource.lastCheckedAt, master.validatedAsOf);
      assert.ok(resource.sourceEvidence.startsWith("https://"));
    }
  }
});

test("supplemental candidates are evidence-backed accepted resources", () => {
  assert.equal(master.supplementalCandidates.length, 10);
  for (const candidate of master.supplementalCandidates) {
    assert.equal(acceptedByName.has(candidate.name), true, `${candidate.name} accepted`);
    assert.equal(rejectedByName.has(candidate.name), false, `${candidate.name} not rejected`);
    assert.equal(byId.get(candidate.resourceId)?.canonicalUrl, candidate.canonicalUrl);
    assert.match(candidate.scopeBasis, /user expansion/);
  }
});

test("Evaluate-STIG stays rejected while archived StigRepo remains discoverable", () => {
  assert.equal(acceptedByName.has("Evaluate-STIG"), false);
  assert.equal(dataset.resources.some((resource) => /evaluate-stig/i.test(`${resource.id} ${resource.name}`)), false);
  assert.match(rejectedByName.get("Evaluate-STIG")?.reason || "", /No current canonical NAVSEA distribution/);
  assert.doesNotMatch(rejectedByName.get("Evaluate-STIG")?.evidence || "", /cucker\/Evaluate-STIG/);

  const stigRepo = byId.get("reference-microsoft-stigrepo");
  assert.equal(acceptedByName.has("Microsoft StigRepo"), true);
  assert.equal(rejectedByName.has("Microsoft StigRepo"), false);
  assert.equal(stigRepo.resourceLane, "legacy");
  assert.equal(stigRepo.maintenanceStatus, "archived");
  assert.match(stigRepo.legacyReason, /archived/);
  assert.equal(stigRepo.supersededBy, undefined);
  assert.ok(stigRepo.companionResources.includes("tool-powerstig"));
  assert.equal(byId.get("tool-powerstig").communityLinks.some((url) => url === "https://github.com/Microsoft/PowerStig/wiki/"), true);
  assert.equal(byId.get("tool-powerstig").companionResources.some((id) => id === "reference-microsoft-stigrepo"), true);
  assert.equal(isGitHubUrl("https://github.com/Microsoft/PowerStig"), true);
  assert.equal(isGitHubUrl("https://github.com.evil.example/Microsoft/PowerStig"), false);
  assert.equal(isGitHubUrl("https://evil.example/?next=github.com"), false);
});

test("restricted resources disclose scoped access boundaries without classifying the public page", () => {
  for (const id of ["service-disa-acas", "service-disa-vms", "community-tenable-connect", "catalog-tenable-audit-files", "community-crowdstrike", "community-tanium"]) {
    const resource = byId.get(id);
    assert.ok(resource, `${id} accepted`);
    assert.equal(resource.accessType, undefined, `${id} does not conflate page and service access`);
    assert.equal(resource.authenticationRequired, undefined, `${id} does not invent a blanket authentication flag`);
    assert.ok(resource.publicAccessNotes.length >= 30, `${id} access note`);
    const accessClaim = resource.claimEvidence.find((claim) => claim.fieldPath === "/publicAccessNotes");
    assert.ok(accessClaim?.evidenceRefs.length, `${id} access note is evidence-backed`);
  }
  assert.equal(rejectedByName.has("Tenable Connect"), false);
  assert.equal(rejectedByName.has("Tenable Audit Files / Compliance Checks"), false);
  assert.equal(byId.get("reference-tenable-documentation")?.canonicalUrl, "https://docs.tenable.com/");
  assert.equal(byId.get("community-tenable-connect")?.alternateUrls.some((url) => url === "https://community.tenable.com/"), true);
});

test("community and topical metadata cannot become requirement authority", () => {
  const masterResources = master.candidates.filter((candidate) => candidate.resourceId).map((candidate) => byId.get(candidate.resourceId));
  for (const resource of masterResources) {
    assert.deepEqual(resource.controlFamilies, [], `${resource.id} has no inferred control mapping`);
  }
  for (const resource of masterResources.filter((entry) => entry.resourceType === "community_forum")) {
    assert.deepEqual(resource.officialCounterparts, [], `${resource.id} creates no authority relationship`);
    assert.deepEqual(resource.frameworks, [], `${resource.id} keeps community knowledge topical only`);
  }
});

test("DoDIN APL and YARA lifecycles match publisher evidence", () => {
  const apl = byId.get("directory-dodin-apl");
  assert.equal(apl.resourceLane, "legacy");
  assert.equal(apl.maintenanceStatus, "deprecated");
  assert.match(apl.officialStatus, /retired/);
  assert.match(apl.legacyReason, /sunset on September 30, 2025/);

  const yaraX = byId.get("tool-yara-x");
  assert.ok(yaraX);
  assert.equal(yaraX.searchAliases.some((alias) => alias === "YARA"), true);
  assert.equal(yaraX.communityLinks.some((url) => url === "https://github.com/VirusTotal/yara"), true);
  assert.match(yaraX.warnings.join(" "), /maintenance mode/);
  assert.equal(byId.has("tool-yara"), false);
});

test("LOLDrivers remains metadata-only and stores no binary locator", () => {
  const resource = byId.get("reference-loldrivers");
  assert.ok(resource);
  assert.deepEqual(resource.downloadLinks, []);
  assert.match(resource.warnings.join(" "), /does not copy, cache, mirror, or distribute driver binaries/);
});

test("freshness and rejected-candidate recheck cadences are enforceable", () => {
  for (const candidate of master.candidates.filter((entry) => entry.resourceId)) {
    const resource = byId.get(candidate.resourceId);
    const maximumDays = resource.resourceType === "community_forum" ? 45 : resource.resourceType === "dataset" ? 60 : 90;
    const cadence = daysBetween(resource.lastCheckedAt, resource.nextCheckAt);
    assert.ok(cadence > 0 && cadence <= maximumDays, `${resource.id} cadence ${cadence} days`);
    assert.equal(resource.freshnessStatus, undefined, `${resource.id} omits an unsupported publisher freshness claim`);
  }
  for (const candidate of manifest.rejectedCandidates) {
    assert.ok(candidate.evidence, `${candidate.candidateName} rejection evidence`);
    assert.match(candidate.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(candidate.recheckAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(daysBetween(candidate.checkedAt, candidate.recheckAt) > 0, `${candidate.candidateName} future recheck`);
  }
});

test("ecosystem and collection references resolve without duplicate resources", () => {
  assert.equal(new Set(dataset.resources.map((resource) => resource.id)).size, dataset.resources.length);
  assert.equal(new Set(dataset.resources.map((resource) => new URL(resource.canonicalUrl).href)).size, dataset.resources.length);
  assert.equal(new Set(dataset.resources.map((resource) => resource.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim())).size, dataset.resources.length);

  const collectionIds = new Set(dataset.collections.map((collection) => collection.id));
  for (const resource of dataset.resources) {
    if (resource.parentEcosystemId) assert.ok(byId.has(resource.parentEcosystemId), `${resource.id} parent`);
    for (const id of resource.childResourceIds) assert.ok(byId.has(id), `${resource.id} child ${id}`);
    for (const id of resource.companionResources) assert.ok(byId.has(id), `${resource.id} companion ${id}`);
    for (const id of resource.featuredCollections) assert.ok(collectionIds.has(id), `${resource.id} collection ${id}`);
  }
  for (const collection of dataset.collections) {
    for (const id of collection.resourceIds) {
      assert.ok(byId.has(id), `${collection.id} resource ${id}`);
      assert.ok(byId.get(id).featuredCollections.includes(collection.id), `${id} links back to ${collection.id}`);
    }
  }
});

test("operator aliases resolve the expected canonical resource", () => {
  const cases = [
    ["SecurityCenter", "service-disa-acas"],
    ["exploit probability", "dataset-first-epss"],
    ["Sigma rules", "ecosystem-sigmahq"],
    ["artifact exchange", "tool-velociraptor"],
    ["AD attack path", "tool-bloodhound-ce"],
    ["macOS compliance", "tool-nist-mscp"],
    ["M365DSC", "tool-microsoft365dsc"],
    ["PDISP", "service-disa-pdisp"],
    ["C-PAT", "tool-cpat"],
  ];
  for (const [query, expectedId] of cases) {
    assert.ok(searchDirectoryResources(dataset.resources, query).some((resource) => resource.id === expectedId), `${query} resolves ${expectedId}`);
  }
});

test("computed resource, manifest, collection, and index counts agree", () => {
  assert.equal(dataset.resources.length, 202);
  assert.equal(dataset.collections.length, 17);
  assert.equal(manifest.acceptedCount, dataset.resources.length);
  assert.equal(manifest.rejectedCount, manifest.rejectedCandidates.length);
  assert.equal(manifest.totalEvaluated, manifest.acceptedCount + manifest.rejectedCount);
  assert.equal(index.totalCount, dataset.resources.length);
  assert.equal(index.documents.length, dataset.resources.length);
});
