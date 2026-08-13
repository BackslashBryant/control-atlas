#!/usr/bin/env node

// This report deliberately keeps structural reconciliation separate from a
// semantic-review verdict. A parser can prove counts and declared containment;
// it cannot prove that a terse publisher record contains all the context a
// practitioner wants. Keeping the latter explicit prevents green ingestion
// gates from being misread as a completed source-content audit.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { CATALOG_STRUCTURE_PROFILES } from "../src/shared/catalog-structure.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (path) => JSON.parse(readFileSync(join(ROOT, path), "utf8"));

const coverage = readJson("data/source-coverage-manifest.json");
const inventory = readJson("data/generated/catalog-source-inventory.json");
const ledger = readJson("data/generated/source-count-ledger.json");
const sourceRegister = readJson("data/generated/sources.json").sources;
const sourcesByCatalog = new Map();

for (const source of sourceRegister) {
  for (const catalogId of source.metadata?.frameworks || []) {
    const entries = sourcesByCatalog.get(catalogId) || [];
    entries.push({
      source_id: source.id,
      display_name: source.display_name || source.name,
      version: source.version || null,
      retrieved_at: source.retrieved_at || null,
      last_checked: source.last_checked || null,
      artifact_url: source.artifact_url || null,
      checksum: source.hash || source.checksum || null,
      parser: source.metadata?.parser || null,
    });
    sourcesByCatalog.set(catalogId, entries);
  }
}

const auditRows = coverage.catalogs.map((entry) => {
  const catalogId = entry.catalog_id;
  const structuralProfile = CATALOG_STRUCTURE_PROFILES[catalogId];
  const sourceInventory = inventory.catalogs[catalogId];
  const counts = ledger.catalogs[catalogId]?.counts || {};
  const sourceEntries = (sourcesByCatalog.get(catalogId) || [])
    .sort((left, right) => left.source_id.localeCompare(right.source_id));
  const countReconciled =
    entry.completeness_status === "reconciled" &&
    entry.expected_records === entry.imported_records + entry.excluded_records &&
    entry.missing_records === 0 &&
    sourceInventory?.unique_record_ids === sourceInventory?.normalized_records;

  return {
    catalog_id: catalogId,
    automated_evidence: {
      status: countReconciled ? "reconciled" : "attention_required",
      expected_records: entry.expected_records,
      imported_records: entry.imported_records,
      excluded_records: entry.excluded_records,
      exclusions: entry.exclusions,
      missing_records: entry.missing_records,
      source_inventory: sourceInventory || null,
      published_source_relationships: counts.published_source_relationships || 0,
      graph_nodes: counts.graph_nodes || 0,
      graph_edges_incident: counts.graph_edges_incident || 0,
    },
    declared_publisher_structure: structuralProfile
      ? {
          containment_paths: structuralProfile.paths,
          multi_parent_node_types: structuralProfile.multiParentNodeTypes,
          classification: "publisher_native_containment_only",
        }
      : null,
    publisher_artifacts: sourceEntries,
    evidence_boundary: {
      semantic_content_review: "unverified",
      locator_only_review: "unverified",
      upstream_currentness_review: "unverified",
      statement:
        "Automated reconciliation verifies declared source counts, identifiers, parser output, and containment contract only. It does not certify semantic completeness, whether a source is too terse for a task, or current upstream content beyond the recorded retrieval.",
    },
  };
});

const report = {
  schema_version: "1.0",
  generated_from: {
    source_coverage_manifest: coverage.generated_at,
    catalog_source_inventory: inventory.generated_at,
    source_count_ledger: ledger.generated_at,
  },
  purpose:
    "Per-catalog audit boundary for publisher structure, parser reconciliation, artifact provenance, and intentionally unverified semantic review.",
  catalog_count: auditRows.length,
  catalogs: auditRows,
};

writeFileSync(
  join(ROOT, "data/generated/source-semantic-audit.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);
console.log(`source-semantic-audit: ${auditRows.length} catalog boundaries recorded.`);
