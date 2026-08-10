import type { AtlasTreeModel, AtlasTreeNode } from "./atlasTreeModel";

export const ATLAS_RENDER_NODE_CAP = 120;
export const ATLAS_CHILD_BUCKET_THRESHOLD = 40;
export const TECHNOLOGY_GATE_THRESHOLD = 60;

export type AtlasAggregateNode = AtlasTreeNode & {
  level: "summary";
  aggregate: true;
  memberIds: string[];
  rangeStart: string;
  rangeEnd: string;
};

export type AtlasRenderableNode = AtlasTreeNode | AtlasAggregateNode;

function lexical(left: AtlasTreeNode, right: AtlasTreeNode) {
  return left.itemId.localeCompare(right.itemId, undefined, {
    numeric: true,
    sensitivity: "base",
  }) || left.id.localeCompare(right.id);
}

function aggregateNode(
  parentId: string,
  key: string,
  members: AtlasTreeNode[],
): AtlasAggregateNode {
  const sorted = [...members].sort(lexical);
  const first = sorted[0]!;
  const last = sorted.at(-1)!;
  const label = first.itemId === last.itemId
    ? first.itemId
    : `${first.itemId}–${last.itemId}`;
  return {
    id: `aggregate:${parentId}:${key}:${first.id}:${last.id}`,
    itemId: label,
    label: `${label} · ${sorted.length.toLocaleString()}`,
    blurb: `${sorted.length.toLocaleString()} publisher records`,
    nodeType: "aggregate",
    parentId,
    childCount: sorted.length,
    descendantRecordCount: sorted.reduce(
      (total, member) => total + Math.max(1, member.descendantRecordCount),
      0,
    ),
    level: "summary",
    alsoRequiredBy: [],
    sourceRefs: [],
    rationale: "Deterministic summary of publisher records.",
    aggregate: true,
    memberIds: sorted.map((member) => member.id),
    rangeStart: first.itemId,
    rangeEnd: last.itemId,
  };
}

export function aggregateAtlasChildren(
  parentId: string,
  input: AtlasTreeNode[],
  limit = ATLAS_CHILD_BUCKET_THRESHOLD,
): AtlasRenderableNode[] {
  const children = [...input].sort(lexical);
  if (children.length <= limit) return children;

  const suppliedGroups = new Map<string, AtlasTreeNode[]>();
  for (const child of children) {
    if (!child.groupingKey) continue;
    const group = suppliedGroups.get(child.groupingKey) || [];
    group.push(child);
    suppliedGroups.set(child.groupingKey, group);
  }
  if (suppliedGroups.size > 0 && suppliedGroups.size <= limit) {
    const groupedIds = new Set([...suppliedGroups.values()].flat().map((child) => child.id));
    const grouped = [...suppliedGroups.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, members]) => aggregateNode(parentId, `group:${key}`, members));
    const ungrouped = children.filter((child) => !groupedIds.has(child.id));
    return [...grouped, ...chunkRanges(parentId, ungrouped, limit)].sort(lexical);
  }
  return chunkRanges(parentId, children, limit);
}

function chunkRanges(parentId: string, children: AtlasTreeNode[], limit: number) {
  const chunks: AtlasAggregateNode[] = [];
  for (let offset = 0; offset < children.length; offset += limit) {
    chunks.push(aggregateNode(parentId, `range:${offset}`, children.slice(offset, offset + limit)));
  }
  return chunks;
}

export function requiresTechnologyGate(
  node: Pick<AtlasTreeNode, "childCount" | "level">,
) {
  return node.level === "publication" && node.childCount > TECHNOLOGY_GATE_THRESHOLD;
}

export function technologyGateChildren(
  node: AtlasTreeNode,
  children: AtlasTreeNode[],
  selectedTechnologyId = "",
): AtlasRenderableNode[] {
  const sorted = [...children].sort(lexical);
  if (!requiresTechnologyGate(node)) return aggregateAtlasChildren(node.id, sorted);
  if (selectedTechnologyId) {
    const selected = sorted.find((child) => child.id === selectedTechnologyId);
    if (selected) return [selected];
  }
  return [{
    id: `technology-gate:${node.id}`,
    itemId: "CHOOSE",
    label: `Choose a technology · ${node.childCount.toLocaleString()} available`,
    blurb: "Search the publisher's technologies to continue this branch.",
    nodeType: "technology_gate",
    parentId: node.id,
    childCount: node.childCount,
    descendantRecordCount: node.descendantRecordCount,
    level: "summary",
    alsoRequiredBy: [],
    sourceRefs: [],
    rationale: "Large publisher branches are selected one technology at a time.",
    aggregate: true,
    memberIds: sorted.map((child) => child.id),
    rangeStart: sorted[0]?.itemId || "",
    rangeEnd: sorted.at(-1)?.itemId || "",
  }];
}

export function renderedAtlasSet(options: {
  model: AtlasTreeModel;
  focusId?: string;
  selectedTechnologyId?: string;
  dynamicChildren?: AtlasTreeNode[];
}) {
  const { model, focusId = "", selectedTechnologyId = "", dynamicChildren = [] } = options;
  if (!focusId) {
    const orientation = [...model.authorityNodes, model.trunk, ...model.areas];
    if (orientation.length > ATLAS_RENDER_NODE_CAP) throw new Error("Atlas orientation exceeds the node cap.");
    return orientation satisfies AtlasRenderableNode[];
  }
  const focus = model.nodesById.get(focusId);
  if (!focus) return renderedAtlasSet({ model });

  const canonicalPath: AtlasTreeNode[] = [];
  let current: AtlasTreeNode | undefined = focus;
  const seen = new Set<string>();
  while (current) {
    if (seen.has(current.id)) throw new Error(`Atlas tree cycle at ${current.id}.`);
    seen.add(current.id);
    canonicalPath.unshift(current);
    current = current.parentId ? model.nodesById.get(current.parentId) : undefined;
  }

  const parent = focus.parentId ? model.nodesById.get(focus.parentId) : undefined;
  const siblings = parent
    ? technologyGateChildren(
        parent,
        model.childrenByParent.get(parent.id) || [],
        selectedTechnologyId,
      )
    : [];
  const nativeChildren = model.childrenByParent.get(focus.id) || [];
  const children = technologyGateChildren(
    focus,
    dynamicChildren.length ? dynamicChildren : nativeChildren,
    selectedTechnologyId,
  );
  const unique = new Map<string, AtlasRenderableNode>();
  for (const node of [...canonicalPath, ...siblings, ...children]) unique.set(node.id, node);
  const rendered = [...unique.values()];
  if (rendered.length > ATLAS_RENDER_NODE_CAP) {
    throw new Error(`Atlas rendered set exceeds ${ATLAS_RENDER_NODE_CAP}: ${rendered.length}.`);
  }
  return rendered;
}

export function maxRenderedAtlasNodes(model: AtlasTreeModel) {
  let max = renderedAtlasSet({ model }).length;
  for (const node of model.nodes) {
    const selectedTechnologyId = requiresTechnologyGate(node)
      ? model.childrenByParent.get(node.id)?.[0]?.id || ""
      : "";
    max = Math.max(max, renderedAtlasSet({ model, focusId: node.id, selectedTechnologyId }).length);
  }
  return max;
}
