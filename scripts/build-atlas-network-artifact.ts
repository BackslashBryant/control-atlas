import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildAtlasGraphModel, type AtlasGraphSourceEdge, type AtlasGraphSourceNode } from "../src/ui/lib/atlasGraphModel";
import { buildAtlasSemanticProjections } from "../src/ui/lib/atlasGraphProjection";
import {
  buildAtlasCatalogMemberships,
  type AtlasSourceRegistry,
} from "../src/ui/lib/atlasPublisherHierarchy";
import type { AtlasSpine } from "../src/ui/lib/atlasDrilldown";
import { buildAtlasTreeModel } from "../src/ui/lib/atlasTreeModel";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GENERATED = join(ROOT, "data", "generated");
const SOURCE_REGISTRY = join(ROOT, "data", "source-registry.json");

type ShardedManifest = { generated_at: string; sharded_collection: { record_count: number; shards: Array<{ path: string }> } };

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function loadCollection<T>(manifestName: string, key: string) {
  const manifest = JSON.parse(readFileSync(join(GENERATED, manifestName), "utf8")) as ShardedManifest;
  const records = manifest.sharded_collection.shards.flatMap((shard) => {
    const artifact = JSON.parse(readFileSync(join(GENERATED, shard.path), "utf8")) as Record<string, T[]>;
    return artifact[key] || [];
  });
  if (records.length !== manifest.sharded_collection.record_count) {
    throw new Error(`${manifestName} declared ${manifest.sharded_collection.record_count} records but yielded ${records.length}.`);
  }
  return { generatedAt: manifest.generated_at, records };
}

const output = argument("--output");
if (!output) throw new Error("build:atlas-network requires --output <path>.");

const nodeCollection = loadCollection<AtlasGraphSourceNode>("nodes.json", "nodes");
const edgeCollection = loadCollection<AtlasGraphSourceEdge>("edges.json", "edges");
const nodes = nodeCollection.records;
const edges = edgeCollection.records;
const spineArtifact = JSON.parse(readFileSync(join(GENERATED, "atlas-spine.json"), "utf8")) as { atlas_spine: AtlasSpine };
const registry = JSON.parse(readFileSync(SOURCE_REGISTRY, "utf8")) as AtlasSourceRegistry;
const graph = buildAtlasGraphModel({ nodes, edges });
const artifact = buildAtlasSemanticProjections({
  graph,
  model: buildAtlasTreeModel(spineArtifact.atlas_spine),
  generatedAt: nodeCollection.generatedAt,
  catalogMemberships: buildAtlasCatalogMemberships(registry),
});

const target = resolve(output);
mkdirSync(dirname(target), { recursive: true });

// The Atlas landing draws five group cards, but the artifact feeding it
// carried the whole graph: `details` and `record_locations` are 21MB of its
// 30MB and answer only a drilldown or a record search, neither of which has
// happened on first paint. They ship as a companion the route fetches after
// it has drawn, so opening the Atlas costs the board rather than the corpus.
const { details, record_locations: recordLocations, ...landing } = artifact;
const detailsTarget = target.replace(/[.]json$/, "-details.json");
writeFileSync(target, `${JSON.stringify(landing)}
`, "utf8");
writeFileSync(
  detailsTarget,
  `${JSON.stringify({ details, record_locations: recordLocations })}
`,
  "utf8",
);
console.log(`Built semantic Atlas: ${Object.keys(artifact.ecosystems).length} publisher ecosystems, ${artifact.landscape.edges.length} landscape relationships, ${Object.keys(artifact.publications).length} publication projections, plus ${Object.keys(details).length} deferred detail projections and ${Object.keys(recordLocations).length} record locations.`);
