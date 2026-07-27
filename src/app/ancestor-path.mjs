import {
  isValidatedStructuralEdge,
  isValidatedStructuralPointer,
} from "./structural-hierarchy.mjs";

export function buildAncestorGraph(nodes, edges) {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const structuralParentsOf = new Map();
  for (const edge of edges) {
    const parent = nodesById.get(edge.source_node_id);
    const child = nodesById.get(edge.target_node_id);
    if (!isValidatedStructuralEdge(edge, parent, child)) continue;
    const list = structuralParentsOf.get(edge.target_node_id) || [];
    list.push(edge.source_node_id);
    structuralParentsOf.set(edge.target_node_id, list);
  }
  return { nodesById, structuralParentsOf };
}

function parentCandidates(id, graph) {
  const node = graph.nodesById.get(id);
  if (node?.parent_id) {
    const parent = graph.nodesById.get(node.parent_id);
    if (isValidatedStructuralPointer(node, parent)) return [node.parent_id];
  }
  return graph.structuralParentsOf.get(id) || [];
}

const depthMemo = new WeakMap();

function shallowestDepth(id, graph, visiting) {
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
  let depth;
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

export function pickCanonicalParent(childId, candidateIds, graph) {
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

function canonicalParentId(id, graph) {
  const node = graph.nodesById.get(id);
  if (node?.parent_id) {
    const parent = graph.nodesById.get(node.parent_id);
    if (isValidatedStructuralPointer(node, parent)) return node.parent_id;
  }
  return pickCanonicalParent(
    id,
    graph.structuralParentsOf.get(id) || [],
    graph,
  );
}

function toLink(node) {
  const structuralLabel =
    node.node_type === "catalog" || node.node_type === "family"
      ? node.metadata?.title
      : "";
  return {
    id: node.id,
    label:
      structuralLabel ||
      node.label ||
      node.metadata?.title ||
      node.metadata?.catalog_id ||
      node.id,
    node_type: node.node_type || "",
  };
}

export function ancestorChain(nodeId, graph) {
  const startNode = graph.nodesById.get(nodeId);
  if (!startNode) return [];

  const chain = [toLink(startNode)];
  const visited = new Set([nodeId]);
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
