/**
 * W1.6 — the canonical ancestor (structural, Class 1) chain for a node,
 * root-first. This is what the "Where this sits" rail (W7.2) walks.
 *
 * A node's parent comes from one of two places, checked in this order:
 *   1. `node.parent_id` — a compact derived pointer (W1.5: assessment
 *      procedures, CCIs) set directly on the node instead of a full edge.
 *   2. `includes`-typed edges targeting the node — the pre-existing
 *      tier-membership mechanism (family/category/enhancement grouping).
 *      When more than one such edge exists (1,590+ nodes have multiple
 *      `includes` parents), the canonical-parent tie-break (W1.4) picks one:
 *      same `catalog_id` as the child, then the shallower candidate, then
 *      lexical order by id, in that priority.
 *
 * Pure and synchronous: never throws, never fetches. A missing parent
 * returns the partial chain built so far. A cycle (bad data) is detected via
 * a visited-set guard and stops the walk rather than looping forever.
 */

export type AncestorNode = {
  id: string;
  label?: string;
  node_type?: string;
  parent_id?: string | null;
  metadata?: { catalog_id?: string };
};

export type AncestorEdge = {
  source_node_id: string;
  target_node_id: string;
  relationship_type: string;
};

export type AncestorLink = {
  id: string;
  label: string;
  node_type: string;
};

interface Graph {
  nodesById: Map<string, AncestorNode>;
  includesParentsOf: Map<string, string[]>;
}

export function buildAncestorGraph(
  nodes: AncestorNode[],
  edges: AncestorEdge[],
): Graph {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const includesParentsOf = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.relationship_type !== "includes") continue;
    const list = includesParentsOf.get(edge.target_node_id) || [];
    list.push(edge.source_node_id);
    includesParentsOf.set(edge.target_node_id, list);
  }
  return { nodesById, includesParentsOf };
}

/** Every direct parent candidate for a node, from whichever mechanism supplied it. */
function parentCandidates(id: string, graph: Graph): string[] {
  const node = graph.nodesById.get(id);
  if (node?.parent_id) return [node.parent_id];
  return graph.includesParentsOf.get(id) || [];
}

const depthMemo = new WeakMap<Graph, Map<string, number>>();

/** Shallowest possible depth to a root, used only as a tie-break signal (W1.4). */
function shallowestDepth(id: string, graph: Graph, visiting: Set<string>): number {
  let memo = depthMemo.get(graph);
  if (!memo) {
    memo = new Map();
    depthMemo.set(graph, memo);
  }
  const cached = memo.get(id);
  if (cached !== undefined) return cached;
  if (visiting.has(id)) return Infinity;
  visiting.add(id);
  const candidates = parentCandidates(id, graph);
  let depth: number;
  if (candidates.length === 0) {
    depth = 0;
  } else {
    let min = Infinity;
    for (const candidateId of candidates) {
      const candidateDepth = shallowestDepth(candidateId, graph, visiting);
      if (candidateDepth < min) min = candidateDepth;
    }
    depth = min === Infinity ? Infinity : min + 1;
  }
  visiting.delete(id);
  memo.set(id, depth);
  return depth;
}

/**
 * W1.4 canonical-parent tie-break. Exported standalone so it can be unit
 * tested against plain candidate lists, independent of the full graph walk.
 */
export function pickCanonicalParent(
  childId: string,
  candidateIds: string[],
  graph: Graph,
): string | null {
  if (candidateIds.length === 0) return null;
  if (candidateIds.length === 1) return candidateIds[0];

  const childCatalog = graph.nodesById.get(childId)?.metadata?.catalog_id;
  let pool = candidateIds;
  if (childCatalog) {
    const sameCatalog = pool.filter(
      (id) => graph.nodesById.get(id)?.metadata?.catalog_id === childCatalog,
    );
    if (sameCatalog.length > 0) pool = sameCatalog;
  }
  if (pool.length === 1) return pool[0];

  let shallowest = Infinity;
  for (const id of pool) {
    const depth = shallowestDepth(id, graph, new Set());
    if (depth < shallowest) shallowest = depth;
  }
  const shallowestPool = pool.filter(
    (id) => shallowestDepth(id, graph, new Set()) === shallowest,
  );
  if (shallowestPool.length === 1) return shallowestPool[0];

  return [...shallowestPool].sort()[0];
}

function canonicalParentId(id: string, graph: Graph): string | null {
  const node = graph.nodesById.get(id);
  if (node?.parent_id) return node.parent_id;
  const candidates = graph.includesParentsOf.get(id) || [];
  return pickCanonicalParent(id, candidates, graph);
}

function toLink(node: AncestorNode): AncestorLink {
  return {
    id: node.id,
    label: node.label || node.metadata?.catalog_id || node.id,
    node_type: node.node_type || "",
  };
}

/**
 * The full ancestor chain for `nodeId`, root-first, ending with `nodeId`
 * itself. Missing data along the way truncates the chain rather than
 * throwing; a cycle stops the walk at the point it would repeat.
 */
export function ancestorChain(nodeId: string, graph: Graph): AncestorLink[] {
  const startNode = graph.nodesById.get(nodeId);
  if (!startNode) return [];

  const chain: AncestorLink[] = [toLink(startNode)];
  const visited = new Set<string>([nodeId]);
  let currentId = nodeId;

  for (;;) {
    const parentId = canonicalParentId(currentId, graph);
    if (!parentId || visited.has(parentId)) break;
    const parentNode = graph.nodesById.get(parentId);
    if (!parentNode) break;
    chain.push(toLink(parentNode));
    visited.add(parentId);
    currentId = parentId;
  }

  return chain.reverse();
}
