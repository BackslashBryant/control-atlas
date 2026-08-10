import { hierarchy, tree } from "d3-hierarchy";

import type { AtlasRenderableNode } from "./atlasTreeAggregation";
import type { AtlasTreeModel, AtlasTreeNode } from "./atlasTreeModel";

export const ATLAS_NODE_WIDTH = 240;
export const ATLAS_NODE_HEIGHT = 88;
export const ATLAS_NODE_GAP = 28;

export type AtlasTreePosition = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const AREA_ORDER = [
  "atlas:LIMB-GOVERNANCE",
  "atlas:LIMB-RISK",
  "atlas:LIMB-COMPLIANCE",
  "atlas:LIMB-ARCHITECTURE",
  "atlas:LIMB-IMPLEMENTATION",
  "atlas:LIMB-ASSESSMENT",
  "atlas:LIMB-OPERATIONS",
  "atlas:LIMB-THREAT",
  "atlas:LIMB-KNOWLEDGE",
] as const;

function position(id: string, x: number, y: number): AtlasTreePosition {
  return { id, x, y, width: ATLAS_NODE_WIDTH, height: ATLAS_NODE_HEIGHT };
}

function lexical(left: AtlasTreeNode, right: AtlasTreeNode) {
  return left.itemId.localeCompare(right.itemId, undefined, {
    numeric: true,
    sensitivity: "base",
  }) || left.id.localeCompare(right.id);
}

export function stableAtlasPositions(model: AtlasTreeModel) {
  const result = new Map<string, AtlasTreePosition>();
  const authorityRoots = model.authorityNodes.filter((node) => !node.parentId).sort(lexical);
  const authorityChildren = model.authorityNodes.filter((node) => node.parentId).sort(lexical);
  const centeredX = (index: number, count: number, spacing: number) =>
    (index - (count - 1) / 2) * spacing;
  authorityRoots.forEach((node, index) => {
    result.set(node.id, position(node.id, centeredX(index, authorityRoots.length, 292), -900));
  });
  authorityChildren.forEach((node, index) => {
    result.set(node.id, position(node.id, centeredX(index, authorityChildren.length, 292), -700));
  });
  result.set(model.trunk.id, position(model.trunk.id, -ATLAS_NODE_WIDTH / 2, -420));

  const areaById = new Map(model.areas.map((area) => [area.id, area]));
  AREA_ORDER.forEach((areaId, index) => {
    const area = areaById.get(areaId);
    if (!area) return;
    const x = centeredX(index, AREA_ORDER.length, 360) - ATLAS_NODE_WIDTH / 2;
    result.set(area.id, position(area.id, x, -120));
    const publications = (model.childrenByParent.get(area.id) || [])
      .filter((node) => node.level === "publication")
      .sort(lexical);
    publications.forEach((publication, publicationIndex) => {
      result.set(
        publication.id,
        position(publication.id, x, 120 + publicationIndex * 128),
      );
    });
  });
  return result;
}

function layoutChildBand(
  parent: AtlasTreePosition,
  children: AtlasRenderableNode[],
  y: number,
) {
  const sorted = [...children].sort(lexical);
  const root = hierarchy<{ id: string; children?: Array<{ id: string }> }>({
    id: parent.id,
    children: sorted.map((child) => ({ id: child.id })),
  });
  tree<{ id: string; children?: Array<{ id: string }> }>()
    .nodeSize([ATLAS_NODE_WIDTH + 44, 150])(root);
  const offsetX = parent.x + ATLAS_NODE_WIDTH / 2;
  return root.children?.map((child) =>
    position(child.data.id, Math.round(offsetX + child.x - ATLAS_NODE_WIDTH / 2), y),
  ) || [];
}

export function layoutAtlasTree(options: {
  model: AtlasTreeModel;
  rendered: AtlasRenderableNode[];
  focusId?: string;
}) {
  const { model, rendered, focusId = "" } = options;
  if (!focusId) {
    const authority = rendered
      .filter((node) => node.nodeType === "authority_aggregate");
    const areas = AREA_ORDER
      .map((id) => rendered.find((node) => node.id === id))
      .filter((node): node is AtlasRenderableNode => Boolean(node));
    const overview = new Map<string, AtlasTreePosition>();
    authority.forEach((node, index) => {
      overview.set(node.id, position(node.id, index * 280, 0));
    });
    overview.set(model.trunk.id, position(model.trunk.id, 280, 150));
    areas.forEach((area, index) => {
      overview.set(area.id, position(area.id, (index % 3) * 280, 330 + Math.floor(index / 3) * 130));
    });
    return [...overview.values()].sort((left, right) => left.id.localeCompare(right.id));
  }
  const stable = stableAtlasPositions(model);
  const renderedById = new Map(rendered.map((node) => [node.id, node]));
  const laidOut = new Map<string, AtlasTreePosition>();
  for (const node of rendered) {
    const fixed = stable.get(node.id);
    if (fixed) laidOut.set(node.id, fixed);
  }

  const focus = renderedById.get(focusId);
  if (focus) {
    const parentPosition = focus.parentId ? stable.get(focus.parentId) || laidOut.get(focus.parentId) : undefined;
    if (parentPosition) {
      const siblings = rendered.filter(
        (node) => node.parentId === focus.parentId && !stable.has(node.id),
      );
      for (const childPosition of layoutChildBand(parentPosition, siblings, parentPosition.y + 170)) {
        laidOut.set(childPosition.id, childPosition);
      }
    }
    const focusPosition = stable.get(focus.id) || laidOut.get(focus.id);
    if (focusPosition) {
      const children = rendered.filter((node) => node.parentId === focus.id);
      const lowestFixed = Math.max(...[...laidOut.values()].map((entry) => entry.y), focusPosition.y);
      for (const childPosition of layoutChildBand(focusPosition, children, lowestFixed + 180)) {
        laidOut.set(childPosition.id, childPosition);
      }
    }
  }

  for (const node of rendered) {
    if (!laidOut.has(node.id)) {
      const parent = node.parentId ? laidOut.get(node.parentId) : undefined;
      laidOut.set(node.id, position(node.id, parent?.x || 0, (parent?.y || 0) + 180));
    }
  }
  return [...laidOut.values()].sort((left, right) => left.id.localeCompare(right.id));
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
