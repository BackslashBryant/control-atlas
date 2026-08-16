import { UndirectedGraph } from "graphology";
import louvain from "graphology-communities-louvain";

import type { AtlasGraph } from "./atlasGraphModel";

export type AtlasAnalysisNodeAttributes = {
  sourceNodeId: string;
  degree: number;
  weightedDegree: number;
  computedCommunity: number;
  size: number;
  x?: number;
  y?: number;
};

export type AtlasAnalysisEdgeAttributes = {
  layoutWeight: number;
  canonicalEdgeIds: readonly string[];
};

export type AtlasAnalysisGraph = UndirectedGraph<
  AtlasAnalysisNodeAttributes,
  AtlasAnalysisEdgeAttributes
>;

export type AtlasGraphNodeAnalysis = {
  degree: number;
  weightedDegree: number;
  computedCommunity: number;
};

export type AtlasGraphAnalysisOptions = {
  seed?: number | string;
  resolution?: number;
  randomWalk?: boolean;
};

export type AtlasGraphAnalysisResult = {
  projection: AtlasAnalysisGraph;
  nodes: Readonly<Record<string, Readonly<AtlasGraphNodeAnalysis>>>;
};

type AggregatedConnection = {
  source: string;
  target: string;
  canonicalEdgeIds: string[];
};

const DEFAULT_ANALYSIS_SEED = "control-atlas-louvain-v1";

function analysisEdgeId(source: string, target: string) {
  return `analysis:${source.length}:${source}${target.length}:${target}`;
}

function presentationSize(descendantRecordCount: number) {
  return Math.min(8, Math.max(1, 1 + Math.log1p(descendantRecordCount)));
}

/**
 * Collapse canonical direction and parallel edges only in a disposable analysis
 * graph. Each canonical connection contributes one unit of layout weight.
 */
export function buildAtlasAnalysisProjection(graph: AtlasGraph): AtlasAnalysisGraph {
  const projection = new UndirectedGraph<
    AtlasAnalysisNodeAttributes,
    AtlasAnalysisEdgeAttributes
  >({ allowSelfLoops: true });

  for (const nodeId of [...graph.nodes()].sort()) {
    const attributes = graph.getNodeAttributes(nodeId);
    projection.addNode(nodeId, {
      sourceNodeId: nodeId,
      degree: 0,
      weightedDegree: 0,
      computedCommunity: -1,
      size: presentationSize(attributes.display.descendantRecordCount),
    });
  }

  const connections = new Map<string, AggregatedConnection>();
  graph.forEachEdge((edgeId, _attributes, sourceId, targetId) => {
    const [source, target] = sourceId.localeCompare(targetId) <= 0
      ? [sourceId, targetId]
      : [targetId, sourceId];
    const key = analysisEdgeId(source, target);
    const connection = connections.get(key) || {
      source,
      target,
      canonicalEdgeIds: [],
    };
    connection.canonicalEdgeIds.push(edgeId);
    connections.set(key, connection);
  });

  for (const [edgeId, connection] of [...connections.entries()].sort()) {
    const canonicalEdgeIds = connection.canonicalEdgeIds.sort();
    projection.addUndirectedEdgeWithKey(
      edgeId,
      connection.source,
      connection.target,
      {
        layoutWeight: canonicalEdgeIds.length,
        canonicalEdgeIds: Object.freeze([...canonicalEdgeIds]),
      },
    );
  }

  return projection;
}

function hashSeed(value: number | string) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value >>> 0;
  }
  let hash = 0x811c9dc5;
  for (const character of String(value)) {
    hash ^= character.codePointAt(0) || 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function seededRandom(seed: number | string) {
  let state = hashSeed(seed);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function normalizedCommunities(
  nodeIds: string[],
  raw: Record<string, number>,
) {
  const members = new Map<number, string[]>();
  for (const nodeId of nodeIds) {
    const rawCommunity = raw[nodeId] ?? Number.MAX_SAFE_INTEGER;
    const community = members.get(rawCommunity) || [];
    community.push(nodeId);
    members.set(rawCommunity, community);
  }
  const normalized = new Map<string, number>();
  [...members.values()]
    .map((community) => community.sort())
    .sort((left, right) => left[0]!.localeCompare(right[0]!))
    .forEach((community, index) => {
      for (const nodeId of community) normalized.set(nodeId, index);
    });
  return normalized;
}

function weightedDegree(projection: AtlasAnalysisGraph, nodeId: string) {
  let total = 0;
  projection.forEachEdge(nodeId, (edgeId, attributes) => {
    total += attributes.layoutWeight * (projection.isSelfLoop(edgeId) ? 2 : 1);
  });
  return total;
}

export function analyzeAtlasGraph(
  graph: AtlasGraph,
  options: AtlasGraphAnalysisOptions = {},
): AtlasGraphAnalysisResult {
  const projection = buildAtlasAnalysisProjection(graph);
  const nodeIds = [...projection.nodes()].sort();
  const rawCommunities = projection.size === 0
    ? Object.fromEntries(nodeIds.map((nodeId, index) => [nodeId, index]))
    : louvain(projection, {
        getEdgeWeight: "layoutWeight",
        randomWalk: options.randomWalk ?? true,
        resolution: options.resolution ?? 1,
        rng: seededRandom(options.seed ?? DEFAULT_ANALYSIS_SEED),
      });
  const communities = normalizedCommunities(nodeIds, rawCommunities);
  const nodes: Record<string, Readonly<AtlasGraphNodeAnalysis>> = {};

  for (const nodeId of nodeIds) {
    const analysis = Object.freeze({
      degree: projection.degree(nodeId),
      weightedDegree: weightedDegree(projection, nodeId),
      computedCommunity: communities.get(nodeId)!,
    });
    projection.mergeNodeAttributes(nodeId, analysis);
    nodes[nodeId] = analysis;
  }

  return {
    projection,
    nodes: Object.freeze(nodes),
  };
}
