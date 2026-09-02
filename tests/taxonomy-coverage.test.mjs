import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { TAXONOMY_CONTRACT } from "../src/shared/taxonomy-contract.mjs";
import { readGeneratedCollection } from "../scripts/lib/generated-graph-artifacts.mjs";

const nodes = readGeneratedCollection(".", "nodes").nodes;

test("generated taxonomy coverage reconciles governed dimensions to the published corpus", () => {
  const report = JSON.parse(readFileSync("data/generated/taxonomy-coverage.json", "utf8"));
  const coverage = report.taxonomy_coverage;

  assert.equal(coverage.contract_version, TAXONOMY_CONTRACT.version);
  assert.ok(coverage.record_count > 0);
  assert.ok(coverage.catalogs.length >= 27);
  assert.ok(coverage.catalogs.every((catalog) => catalog.record_count >= catalog.tagged_record_count));
  assert.equal(
    coverage.record_dimension_decision_count,
    coverage.record_count * TAXONOMY_CONTRACT.dimensions.length,
  );
  assert.equal(
    Object.values(coverage.decision_counts).reduce((total, count) => total + count, 0),
    coverage.record_dimension_decision_count,
  );
  for (const group of [...coverage.catalogs, ...coverage.record_types]) {
    for (const dimension of TAXONOMY_CONTRACT.dimensions) {
      const states = group.dimensions[dimension.id];
      assert.equal(
        states.applicable_record_count + states.not_applicable_record_count + states.unreviewed_record_count,
        group.record_count,
      );
    }
  }
  assert.deepEqual(
    coverage.dimensions.map((dimension) => dimension.dimension).sort(),
    TAXONOMY_CONTRACT.dimensions.map((dimension) => dimension.id).sort(),
  );
  assert.ok(coverage.source_fields.every((field) => field.source_field !== "unrecorded"));
  assert.ok(coverage.source_fields.every((field) => field.record_count > 0));
  assert.ok(coverage.source_basis.every((basis) => basis.taxonomy_layer === "atlas_evidence" || basis.taxonomy_layer === "publisher"));
  assert.ok(coverage.source_basis.every((basis) => basis.assignment_provenance === "inferred" || basis.assignment_provenance === "publisher"));
  assert.ok(coverage.source_basis.every((basis) => basis.source_field !== "unrecorded" && basis.rule !== "unrecorded"));
  assert.equal(
    coverage.not_applicable_source_basis.reduce((total, basis) => total + basis.record_count, 0),
    coverage.decision_counts.not_applicable,
  );
  assert.ok(coverage.not_applicable_source_basis.every((basis) => basis.source_field && basis.rule));
  assert.ok(coverage.decision_counts.unreviewed > 0);
  assert.equal(
    coverage.assignment_layers.reduce((total, layer) => total + layer.tag_assignments, 0),
    coverage.dimensions.reduce((total, dimension) => total + dimension.tag_assignments, 0),
  );
  assert.deepEqual(
    coverage.assignment_layers.map((layer) => layer.taxonomy_layer),
    ["atlas_evidence", "publisher"],
  );
  assert.equal(
    Number(coverage.assignment_layers.reduce((total, layer) => total + layer.assignment_percentage, 0).toFixed(2)),
    100,
  );
  assert.ok(coverage.rules.every((rule) => rule.rule !== "unrecorded"));
  assert.equal(
    coverage.rules.reduce((total, rule) => total + rule.tag_assignments, 0),
    coverage.dimensions.reduce((total, dimension) => total + dimension.tag_assignments, 0),
  );
  assert.equal(coverage.identity_coverage.unresolved_identity_term_count, 0);
  assert.ok(coverage.identity_coverage.identity_tag_assignment_count > 0);
  assert.equal(coverage.mark_coverage.official_mark_count, 0);
  assert.equal(coverage.mark_coverage.fallback_identity_count, coverage.mark_coverage.identity_count);
  assert.equal(coverage.unresolved_legacy_labels.length, 0);

  const cci = coverage.catalogs.find((catalog) => catalog.catalog_id === "disa-cci");
  assert.ok(cci, "DISA CCI coverage row is required");
  assert.equal(cci.record_count, 5137);
  assert.equal(cci.tagged_record_count, 5137);
  assert.equal(cci.dimensions.domain.applicable_record_count, 4913);
  assert.equal(cci.dimensions.domain.unreviewed_record_count, 224);
  assert.ok(coverage.source_basis.some((basis) =>
    basis.taxonomy_layer === "publisher" &&
    basis.source_field === "metadata.related_categories[]" &&
    basis.rule === "exact-publisher-related-category" &&
    basis.record_count === 4913
  ));
});

test("generated assignments retain Apple iOS, exclude Cisco IOS, and cite the field that matched", () => {
  const assignments = nodes.flatMap((node) =>
    (node.metadata?.taxonomy_tags || []).map((tag) => ({ node, tag })),
  );
  assert.equal(assignments.length, 92_233);
  assert.equal(assignments.filter(({ tag }) => tag.basis?.rule === "explicit-mobile-term").length, 839);
  assert.equal(assignments.filter(({ tag }) => tag.id === "technology.ios").length, 176);

  const cisco = nodes.filter((node) =>
    /^Cisco\s+IOS\b/i.test(node.metadata?.benchmark_title || ""),
  );
  const apple = nodes.filter((node) =>
    /^Apple\s+iOS\/iPadOS\b/i.test(node.metadata?.benchmark_title || ""),
  );
  assert.equal(cisco.length, 651);
  assert.equal(apple.length, 176);
  assert.ok(cisco.every((node) =>
    !(node.metadata?.taxonomy_tags || []).some((tag) =>
      tag.id === "technology.ios" || tag.id === "asset.mobile"),
  ));
  assert.ok(apple.every((node) =>
    (node.metadata?.taxonomy_tags || []).some((tag) => tag.id === "technology.ios") &&
    (node.metadata?.taxonomy_tags || []).some((tag) => tag.id === "asset.mobile"),
  ));

  const sourcePatterns = new Map([
    ["explicit-database-term", /\b(?:database|dbms|postgres(?:ql)?|mysql|mariadb|sql server)\b/i],
    ["explicit-network-device-term", /\b(?:router|switch|firewall|network (?:device|element)|network infrastructure)\b/i],
    ["explicit-application-term", /\b(?:application|web server|browser|agent)\b/i],
    ["explicit-virtualization-term", /\b(?:virtualization|virtual machine|hypervisor|vsphere|esxi)\b/i],
    ["explicit-identity-term", /\b(?:active directory|identity|directory service|pki)\b/i],
    ["explicit-mobile-term", /\b(?:mobile|uem|mdm|android)\b|\bapple\s+(?:ios|ipados)\b|\bios\s*\/\s*ipados\b|\bipados\b/i],
    ["explicit-cloud-term", /\b(?:cloud|azure|aws|iaas|saas)\b/i],
  ]);
  const mismatches = assignments.filter(({ node, tag }) => {
    const pattern = sourcePatterns.get(tag.basis?.rule);
    if (!pattern) return false;
    const sourceValue = tag.basis.source_field === "family"
      ? node.metadata?.family
      : tag.basis.source_field === "metadata.identity_category"
        ? node.metadata?.identity_category
        : node.metadata?.benchmark_title;
    return !pattern.test(String(sourceValue || ""));
  });
  assert.deepEqual(mismatches, []);
});
