import forceAtlas2, {
  type ForceAtlas2Settings,
} from "graphology-layout-forceatlas2";
import noverlap, {
  type NoverlapSettings,
} from "graphology-layout-noverlap";

import {
  buildAtlasAnalysisProjection,
  type AtlasAnalysisGraph,
} from "./atlasGraphAnalysis";
import type { AtlasGraph } from "./atlasGraphModel";

export const ATLAS_LAYOUT_MAX_FORCE_ITERATIONS = 1_000;
export const ATLAS_LAYOUT_MAX_NOVERLAP_ITERATIONS = 1_000;

export type AtlasGraphPosition = {
  id: string;
  x: number;
  y: number;
};

export type AtlasGraphLayoutOptions = {
  iterations?: number;
  noverlapIterations?: number;
  barnesHutThreshold?: number;
  forceAtlas2Settings?: ForceAtlas2Settings;
  noverlapSettings?: NoverlapSettings;
};

function hash(value: string) {
  let result = 0x811c9dc5;
  for (const character of value) {
    result ^= character.codePointAt(0) || 0;
    result = Math.imul(result, 0x01000193);
  }
  return result >>> 0;
}

function unit(value: string) {
  return hash(value) / 0xffff_ffff;
}

function initialPosition(nodeId: string, order: number) {
  const scale = Math.max(10, Math.sqrt(Math.max(1, order)) * 10);
  let x = (unit(`x:${nodeId}`) * 2 - 1) * scale;
  let y = (unit(`y:${nodeId}`) * 2 - 1) * scale;
  if (x === 0 && y === 0) x = scale / 2;
  return { x, y };
}

function boundedIterations(
  value: number | undefined,
  fallback: number,
  maximum: number,
) {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Atlas layout iteration counts must be non-negative numbers.");
  }
  return Math.min(maximum, Math.floor(value));
}

function assignInitialPositions(projection: AtlasAnalysisGraph) {
  for (const nodeId of [...projection.nodes()].sort()) {
    projection.mergeNodeAttributes(
      nodeId,
      initialPosition(nodeId, projection.order),
    );
  }
}

function assignPositionMap(
  projection: AtlasAnalysisGraph,
  positions: Record<string, { x: number; y: number }>,
) {
  for (const nodeId of [...projection.nodes()].sort()) {
    const position = positions[nodeId];
    if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) {
      throw new Error(`Atlas layout did not place node ${nodeId}.`);
    }
    projection.mergeNodeAttributes(nodeId, position);
  }
}

function coordinate(value: number) {
  if (!Number.isFinite(value)) throw new Error("Atlas layout returned a non-finite coordinate.");
  return Number(value.toFixed(6));
}

/** Compute a complete, stable global layout without mutating the semantic graph. */
export function layoutAtlasGraph(
  graph: AtlasGraph,
  options: AtlasGraphLayoutOptions = {},
): AtlasGraphPosition[] {
  const projection = buildAtlasAnalysisProjection(graph);
  if (projection.order === 0) return [];
  assignInitialPositions(projection);

  if (projection.order > 1 && projection.size > 0) {
    const iterations = boundedIterations(
      options.iterations,
      160,
      ATLAS_LAYOUT_MAX_FORCE_ITERATIONS,
    );
    if (iterations > 0) {
      const inferred = forceAtlas2.inferSettings(projection);
      const forcePositions = forceAtlas2(projection, {
        iterations,
        getEdgeWeight: "layoutWeight",
        settings: {
          ...inferred,
          barnesHutOptimize:
            options.forceAtlas2Settings?.barnesHutOptimize ??
            projection.order >= (options.barnesHutThreshold ?? 500),
          ...options.forceAtlas2Settings,
        },
      });
      assignPositionMap(projection, forcePositions);
    }
  }

  if (projection.order > 1) {
    const maxIterations = boundedIterations(
      options.noverlapIterations,
      300,
      ATLAS_LAYOUT_MAX_NOVERLAP_ITERATIONS,
    );
    if (maxIterations > 0) {
      const noverlapPositions = noverlap(projection, {
        maxIterations,
        settings: {
          margin: 1,
          ratio: 1.1,
          ...options.noverlapSettings,
        },
      });
      assignPositionMap(projection, noverlapPositions);
    }
  }

  return [...projection.nodes()]
    .sort()
    .map((nodeId) => {
      const attributes = projection.getNodeAttributes(nodeId);
      return {
        id: nodeId,
        x: coordinate(attributes.x!),
        y: coordinate(attributes.y!),
      };
    });
}

/** Apply one complete precomputed coordinate set to the semantic graph. */
export function applyAtlasGraphPositions(
  graph: AtlasGraph,
  positions: readonly AtlasGraphPosition[],
) {
  if (positions.length !== graph.order) {
    throw new Error(
      `Atlas positions contain ${positions.length} nodes; expected ${graph.order}.`,
    );
  }
  const checked = new Map<string, { x: number; y: number }>();
  for (const position of positions) {
    if (!graph.hasNode(position.id)) {
      throw new Error(`Atlas positions reference unknown node ${position.id}.`);
    }
    if (checked.has(position.id)) {
      throw new Error(`Atlas positions contain duplicate node ${position.id}.`);
    }
    if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) {
      throw new Error(`Atlas position for ${position.id} is not finite.`);
    }
    checked.set(position.id, { x: position.x, y: position.y });
  }
  for (const nodeId of graph.nodes()) {
    const position = checked.get(nodeId);
    if (!position) throw new Error(`Atlas positions omit node ${nodeId}.`);
  }
  for (const [nodeId, position] of checked) {
    graph.mergeNodeAttributes(nodeId, position);
  }
  return graph;
}

export function serializeAtlasGraphPositions(
  positions: readonly AtlasGraphPosition[],
) {
  return JSON.stringify(
    [...positions]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map(({ id, x, y }) => ({ id, x, y })),
  );
}
