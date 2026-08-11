import ELK from "elkjs/lib/elk.bundled.js";

import type { AtlasRenderableNode } from "./atlasTreeAggregation";
import type { AtlasTreeModel } from "./atlasTreeModel";

export const ATLAS_NODE_WIDTH = 220;
export const ATLAS_NODE_HEIGHT = 72;
export const ATLAS_NODE_GAP = 16;

export type AtlasTreePosition = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type ElkNode = {
  id: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
};

type ElkEdge = {
  id: string;
  sources: string[];
  targets: string[];
};

type ElkGraph = ElkNode & {
  layoutOptions: Record<string, string>;
  children: ElkNode[];
  edges: ElkEdge[];
};

const elk = new ELK();

function lexical(left: AtlasRenderableNode, right: AtlasRenderableNode) {
  return left.itemId.localeCompare(right.itemId, undefined, {
    numeric: true,
    sensitivity: "base",
  }) || left.id.localeCompare(right.id);
}

function atlasLayoutEdges(
  model: AtlasTreeModel,
  rendered: AtlasRenderableNode[],
  focusId: string,
) {
  const visible = new Set(rendered.map((node) => node.id));
  const structural = rendered.flatMap((node) => {
    if (!node.parentId || !visible.has(node.parentId)) return [];
    return [{
      id: `tree:${node.parentId}->${node.id}`,
      sources: [node.parentId],
      targets: [node.id],
    } satisfies ElkEdge];
  });
  if (focusId) return structural;
  const authority = rendered
    .filter((node) => node.nodeType === "authority_aggregate")
    .map((node) => ({
      id: `authority-overview:${node.id}->${model.trunk.id}`,
      sources: [node.id],
      targets: [model.trunk.id],
    } satisfies ElkEdge));
  return [...authority, ...structural];
}

function atlasElkGraph(options: {
  model: AtlasTreeModel;
  rendered: AtlasRenderableNode[];
  focusId: string;
}): ElkGraph {
  const rendered = [...options.rendered].sort(lexical);
  return {
    id: "control-atlas-tree",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.edgeRouting": "SPLINES",
      "elk.layered.layering.strategy": "NETWORK_SIMPLEX",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
      "elk.layered.spacing.nodeNodeBetweenLayers": "96",
      "elk.spacing.nodeNode": "16",
      "elk.padding": "[top=24,left=24,bottom=24,right=24]",
      "elk.aspectRatio": "1.45",
    },
    children: rendered.map((node) => ({
      id: node.id,
      width: ATLAS_NODE_WIDTH,
      height: ATLAS_NODE_HEIGHT,
    })),
    edges: atlasLayoutEdges(options.model, rendered, options.focusId)
      .sort((left, right) => left.id.localeCompare(right.id)),
  };
}

export async function layoutAtlasTree(options: {
  model: AtlasTreeModel;
  rendered: AtlasRenderableNode[];
  focusId?: string;
}) {
  const graph = atlasElkGraph({
    ...options,
    focusId: options.focusId || "",
  });
  const laidOut = await elk.layout(graph) as ElkGraph;
  const positions = (laidOut.children || []).map((node) => ({
    id: node.id,
    x: Math.round(node.x || 0),
    y: Math.round(node.y || 0),
    width: node.width || ATLAS_NODE_WIDTH,
    height: node.height || ATLAS_NODE_HEIGHT,
  }));
  if (positions.length !== options.rendered.length) {
    throw new Error(
      `ELK placed ${positions.length} of ${options.rendered.length} Atlas nodes.`,
    );
  }
  return positions.sort((left, right) => left.id.localeCompare(right.id));
}

export function atlasTreeCollisions(
  positions: AtlasTreePosition[],
  gap = ATLAS_NODE_GAP,
) {
  const collisions: Array<[string, string]> = [];
  for (let leftIndex = 0; leftIndex < positions.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < positions.length; rightIndex += 1) {
      const left = positions[leftIndex]!;
      const right = positions[rightIndex]!;
      const separated =
        left.x + left.width + gap <= right.x ||
        right.x + right.width + gap <= left.x ||
        left.y + left.height + gap <= right.y ||
        right.y + right.height + gap <= left.y;
      if (!separated) collisions.push([left.id, right.id]);
    }
  }
  return collisions;
}

export function serializeAtlasCoordinates(positions: AtlasTreePosition[]) {
  return JSON.stringify(
    [...positions]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map(({ id, x, y, width, height }) => ({ id, x, y, width, height })),
  );
}
