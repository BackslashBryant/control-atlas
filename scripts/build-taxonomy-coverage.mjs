import { readFileSync } from "node:fs";

import { buildTaxonomyCoverage } from "./build-framework-data.mjs";
import { readGeneratedCollection } from "./lib/generated-graph-artifacts.mjs";
import { writeJsonAtomically } from "./lib/write-json-atomically.mjs";

const nodesArtifact = readGeneratedCollection(".", "nodes");
const catalogArtifact = JSON.parse(
  readFileSync("data/generated/catalog-bootstrap.json", "utf8"),
);

if (!nodesArtifact?.nodes?.length) {
  throw new Error("Generated nodes are required before taxonomy coverage can be built.");
}
if (!catalogArtifact?.catalog_bootstrap?.catalogs?.length) {
  throw new Error("Generated catalog bootstrap is required before taxonomy coverage can be built.");
}
const coverage = buildTaxonomyCoverage(
  nodesArtifact.nodes,
  catalogArtifact.catalog_bootstrap.catalogs,
);

writeJsonAtomically("data/generated/taxonomy-coverage.json", {
  schema_version: "1.0",
  generated_at: nodesArtifact.generated_at,
  taxonomy_coverage: coverage,
});

console.log(
  `taxonomy-coverage: ${coverage.record_count} records, ` +
  `${coverage.decision_counts.applicable} applicable, ` +
  `${coverage.decision_counts.not_applicable} not applicable, ` +
  `${coverage.decision_counts.unreviewed} unreviewed decisions.`,
);
