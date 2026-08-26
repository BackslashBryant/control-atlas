#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeJsonAtomically } from "./lib/write-json-atomically.mjs";
import {
  artifactProfileId,
  publicationProfileId,
  resourceProfileId,
} from "../src/shared/entity-profiles.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const resourcePath = join(ROOT, "data", "commons-resource-dataset.json");
const sourcePath = join(ROOT, "data", "source-registry.json");
const mitreCatalogPaths = new Map([
  ["mitre-attack-enterprise", join(ROOT, "data", "attack-techniques-enterprise.json")],
  ["mitre-attack-ics", join(ROOT, "data", "attack-techniques-ics.json")],
  ["mitre-d3fend-ontology", join(ROOT, "data", "d3fend-countermeasures.json")],
  ["mitre-d3fend-mappings", join(ROOT, "maps", "attack-to-d3fend.json")],
]);
const genericAbsence = /(?:not documented|not stated|not available|no additional limitations|didn't state)/i;

function claim(fieldPath, origin, evidenceRefs, transformation = null) {
  return {
    fieldPath,
    origin,
    evidenceRefs: evidenceRefs.filter(Boolean),
    ...(transformation ? { transformation } : {}),
    reviewStatus: "reviewed",
  };
}

function migrateResources() {
  const dataset = JSON.parse(readFileSync(resourcePath, "utf8"));
  dataset.schemaVersion = "4.0";
  for (const resource of dataset.resources) {
    const sourceUrl = resource.sourceEvidence || resource.canonicalUrl;
    if (["free", "no_cost"].includes(resource.costType)) delete resource.costType;
    if (resource.audiences?.length === 1 && resource.audiences[0] === "Cybersecurity Practitioner") resource.audiences = [];
    if (JSON.stringify(resource.lifecycleStages) === JSON.stringify(["Implement", "Assess", "Monitor"])) resource.lifecycleStages = [];
    if (JSON.stringify(resource.technologyScopes) === JSON.stringify(["general_it"])) resource.technologyScopes = [];
    if (JSON.stringify(resource.platforms) === JSON.stringify(["all"])) resource.platforms = [];
    if (genericAbsence.test(resource.publicAccessNotes || "")) resource.publicAccessNotes = null;
    if (["official", "publisher-operated", "community"].includes(resource.officialStatus)) resource.officialStatus = null;
    if (resource.maturity === "stable") resource.maturity = null;
    if (resource.freshnessStatus === "current") resource.freshnessStatus = null;
    if (resource.maintenanceStatus === "active" && !resource.repositoryEvidence?.facts?.lastPushedAt) {
      resource.maintenanceStatus = "unknown";
    }

    for (const key of ["whoItIsFor", "limitations"]) {
      if (resource.presentationProfile?.[key]?.status !== "documented"
        || genericAbsence.test(resource.presentationProfile?.[key]?.text || "")) {
        delete resource.presentationProfile?.[key];
      }
    }
    if (resource.toolProfile) {
      for (const key of ["inputs", "outputs", "formats", "integrations", "installation", "usage", "license"]) {
        if (resource.toolProfile[key]?.status !== "documented"
          || genericAbsence.test(resource.toolProfile[key]?.text || "")) {
          delete resource.toolProfile[key];
        }
      }
      if (genericAbsence.test(resource.toolProfile.maintenance?.text || "")) delete resource.toolProfile.maintenance;
    }
    if (resource.compatibility?.status !== "documented") resource.compatibility.note = "";

    resource.entityKind = "resource";
    resource.profileId = resourceProfileId(resource.resourceType);
    resource.origin = "atlas_editorial";
    resource.sourceRefs = [sourceUrl];
    const historical = resource.resourceLane === "legacy" || ["archived", "deprecated", "superseded"].includes(resource.maintenanceStatus);
    resource.lifecycle = {
      status: historical
        ? (resource.maintenanceStatus === "superseded" ? "superseded" : resource.maintenanceStatus === "deprecated" ? "deprecated" : "historical")
        : resource.maintenanceStatus,
      evidenceRefs: historical ? [sourceUrl] : [],
      ...(resource.supersededBy ? { replacedBy: [resource.supersededBy] } : {}),
    };
    resource.claimEvidence = [
      claim("/name", "publisher_normalized", [sourceUrl]),
      claim("/publisher", "publisher_normalized", [sourceUrl]),
      claim("/summary", "atlas_editorial", [sourceUrl], "Atlas directory summary based on the linked destination."),
      claim("/whyIncluded", "atlas_editorial", [sourceUrl], "Atlas inclusion rationale."),
      claim("/accessType", "publisher_normalized", [sourceUrl]),
      ...(resource.publicAccessNotes ? [claim("/publicAccessNotes", "publisher_normalized", [sourceUrl])] : []),
      ...(resource.costType ? [claim("/costType", "publisher_normalized", [sourceUrl])] : []),
      ...(resource.maintenanceStatus !== "unknown" ? [claim("/maintenanceStatus", "publisher_normalized", [sourceUrl])] : []),
      ...(resource.supersededBy ? [claim("/lifecycle/replacedBy", "publisher_normalized", [sourceUrl])] : []),
    ];
  }
  writeJsonAtomically(resourcePath, dataset);
}

function migrateSourceRegistry() {
  const registry = JSON.parse(readFileSync(sourcePath, "utf8"));
  const mitreCatalogs = new Map([...mitreCatalogPaths].map(([id, path]) => [id, JSON.parse(readFileSync(path, "utf8"))]));
  const syncMitreIdentity = (entry, catalog, kind) => {
    entry.version = catalog.source_version;
    entry.retrieved_at = catalog.snapshot_date;
    entry.artifact_url = catalog.source_artifact;
    if (kind === "artifact") {
      entry.sha256 = catalog.checksum;
      entry.byte_length = catalog.source_artifact_byte_length;
      entry.record_count = catalog.records?.length || 0;
      entry.relationship_count = catalog.relationships?.length || 0;
      entry.retrieval_method = "direct_file_import";
      entry.metadata = { ...(entry.metadata || {}), checksum_basis: catalog.checksum_basis || "canonical_json" };
    }
    if (kind === "source") entry.checksum = catalog.checksum;
  };
  for (const publication of registry.publications || []) {
    const mitreCatalog = mitreCatalogs.get(publication.id);
    if (mitreCatalog) syncMitreIdentity(publication, mitreCatalog, "publication");
    if (publication.id === "fedramp-rev5") publication.lifecycle_status = "historical";
    const identityKind = publication.metadata?.identity_kind || "publication";
    publication.entity_kind = "publication";
    publication.profile_id = publicationProfileId(identityKind);
    publication.origin = identityKind === "editorial" ? "atlas_editorial" : "publisher_normalized";
  }
  for (const artifact of registry.artifacts || []) {
    const sourceId = artifact.id.replace(/^artifact-/, "");
    const mitreCatalog = mitreCatalogs.get(sourceId);
    if (mitreCatalog) syncMitreIdentity(artifact, mitreCatalog, "artifact");
    if (artifact.id === "artifact-fedramp-rev5") {
      artifact.lifecycle_status = "historical";
      artifact.source_role = "historical";
    }
    artifact.entity_kind = "artifact";
    artifact.profile_id = artifactProfileId(artifact.format);
    artifact.origin = artifact.authority_class === "publisher" ? "publisher_exact" : "publisher_normalized";
  }
  for (const source of registry.sources || []) {
    const mitreCatalog = mitreCatalogs.get(source.id);
    if (mitreCatalog) syncMitreIdentity(source, mitreCatalog, "source");
    if (source.id === "fedramp-rev5") source.lifecycle_status = "historical";
    source.entity_kind = "artifact";
    source.profile_id = artifactProfileId(source.artifact_type || "other");
    source.origin = source.provenance_class === "control_atlas_derived" ? "atlas_editorial" : "publisher_normalized";
  }
  for (const bundle of registry.catalog_source_bundles || []) {
    bundle.entity_kind = "assertion";
    bundle.profile_id = "assertion.source_bundle";
    bundle.origin = "atlas_editorial";
  }
  for (const freshness of registry.freshness?.sources || []) {
    const mitreCatalog = mitreCatalogs.get(freshness.source_id);
    if (!mitreCatalog) continue;
    freshness.hash = mitreCatalog.checksum;
    freshness.last_imported = mitreCatalog.snapshot_date;
    freshness.last_checked = mitreCatalog.snapshot_date;
  }
  writeJsonAtomically(sourcePath, registry);
}

migrateResources();
migrateSourceRegistry();
console.log("Migrated resource and source inventories to explicit entity profiles.");
