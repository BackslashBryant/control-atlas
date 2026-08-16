import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildAtlasGraphModel, type AtlasGraphSourceEdge, type AtlasGraphSourceNode } from "../src/ui/lib/atlasGraphModel";
import { buildAtlasSemanticProjections } from "../src/ui/lib/atlasGraphProjection";
import type { AtlasSpine } from "../src/ui/lib/atlasDrilldown";
import { buildAtlasTreeModel } from "../src/ui/lib/atlasTreeModel";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GENERATED = join(ROOT, "data", "generated");

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
const graph = buildAtlasGraphModel({ nodes, edges });
const artifact = buildAtlasSemanticProjections({
  graph,
  model: buildAtlasTreeModel(spineArtifact.atlas_spine),
  generatedAt: nodeCollection.generatedAt,
});

const target = resolve(output);
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(artifact)}\n`, "utf8");
console.log(`Built semantic Atlas: ${artifact.landscape.nodes.length} landscape landmarks, ${artifact.landscape.edges.length} landscape relationships, ${Object.keys(artifact.publications).length} publication projections.`);
