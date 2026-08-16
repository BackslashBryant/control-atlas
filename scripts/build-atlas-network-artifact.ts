import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { analyzeAtlasGraph } from "../src/ui/lib/atlasGraphAnalysis";
import { applyAtlasGraphPositions, layoutAtlasGraph } from "../src/ui/lib/atlasGraphLayout";
import { buildAtlasGraphModel, type AtlasGraphSourceEdge, type AtlasGraphSourceNode } from "../src/ui/lib/atlasGraphModel";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GENERATED = join(ROOT, "data", "generated");
const LIMIT = 5_000;

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
const nodeById = new Map(nodes.map((node) => [node.id, node]));
const degree = new Map<string, number>();
for (const edge of edges) {
  degree.set(edge.source_node_id, (degree.get(edge.source_node_id) || 0) + 1);
  degree.set(edge.target_node_id, (degree.get(edge.target_node_id) || 0) + 1);
}

const selected = new Set<string>();
const keep = (id: string) => { if (nodeById.has(id)) selected.add(id); };
for (const node of nodes) {
  if (["statute", "regulation", "policy_directive", "catalog", "trunk", "limb"].includes(String(node.node_type))) keep(node.id);
}
const coveredKinds = new Set<string>();
for (const edge of [...edges].sort((a, b) => a.id.localeCompare(b.id))) {
  for (const kind of [`class:${edge.relationship_class || ""}`, `type:${edge.relationship_type || ""}`]) {
    if (!coveredKinds.has(kind)) {
      keep(edge.source_node_id);
      keep(edge.target_node_id);
      coveredKinds.add(kind);
    }
  }
}
for (const node of [...nodes].sort((a, b) => (degree.get(b.id) || 0) - (degree.get(a.id) || 0) || a.id.localeCompare(b.id))) {
  if (selected.size >= LIMIT) break;
  keep(node.id);
}

const selectedNodes = nodes.filter((node) => selected.has(node.id)).sort((a, b) => a.id.localeCompare(b.id));
const selectedEdges = edges.filter((edge) => selected.has(edge.source_node_id) && selected.has(edge.target_node_id)).sort((a, b) => a.id.localeCompare(b.id));
const graph = buildAtlasGraphModel({ nodes: selectedNodes, edges: selectedEdges });
const analysis = analyzeAtlasGraph(graph);
const positions = layoutAtlasGraph(graph);
applyAtlasGraphPositions(graph, positions);

const positionHash = createHash("sha256").update(JSON.stringify(positions)).digest("hex");
const serialized = graph.export();
serialized.nodes = serialized.nodes.map((node) => ({
  ...node,
  attributes: { ...node.attributes, analysis: analysis.nodes[node.key] },
}));
const artifact = {
  schema_version: "1.0",
  generated_at: nodeCollection.generatedAt,
  selection: {
    full_node_count: nodes.length,
    full_edge_count: edges.length,
    rendered_node_count: graph.order,
    rendered_edge_count: graph.size,
    relationship_classes: [...new Set(selectedEdges.map((edge) => edge.relationship_class || ""))].filter(Boolean).sort(),
    relationship_types: [...new Set(selectedEdges.map((edge) => edge.relationship_type || ""))].filter(Boolean).sort(),
  },
  layout: { algorithm: "forceatlas2-noverlap", position_hash: positionHash },
  graph: serialized,
};

const target = resolve(output);
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(artifact)}\n`, "utf8");
console.log(`Built Atlas network: ${graph.order} nodes, ${graph.size} edges, ${positionHash.slice(0, 12)} position hash.`);
