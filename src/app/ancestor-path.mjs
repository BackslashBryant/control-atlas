import {
  isValidatedStructuralEdge,
  isValidatedStructuralPointer,
  ORGANIZING_RELATIONSHIP_TYPES,
  RELATIONSHIP_CLASSES,
} from "./structural-hierarchy.mjs";

export function buildAncestorGraph(nodes, edges) {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const structuralParentsOf = new Map();
  const organizingParentsOf = new Map();
  for (const edge of edges) {
    const parent = nodesById.get(edge.source_node_id);
    const child = nodesById.get(edge.target_node_id);
    if (isValidatedStructuralEdge(edge, parent, child)) {
      const list = structuralParentsOf.get(edge.target_node_id) || [];
      list.push(edge.source_node_id);
      structuralParentsOf.set(edge.target_node_id, list);
    } else if (
      edge.relationship_class === RELATIONSHIP_CLASSES.organizing &&
      ORGANIZING_RELATIONSHIP_TYPES.has(edge.relationship_type)
    ) {
      // Class-4 organizing hop (trunk/limb/catalog spine, or a derived junction
      // home). Only used as a fallback parent when no structural parent exists.
      const list = organizingParentsOf.get(edge.target_node_id) || [];
      list.push(edge.source_node_id);
      organizingParentsOf.set(edge.target_node_id, list);
    }
  }
  return { nodesById, structuralParentsOf, organizingParentsOf };
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
  let preferDeepest = false;
  if (childCatalog) {
    const sameCatalog = pool.filter(
      (id) => graph.nodesById.get(id)?.metadata?.catalog_id === childCatalog,
    );
    if (sameCatalog.length > 0) {
      pool = sameCatalog;
      preferDeepest = true;
    }
  }
  if (pool.length === 1) return pool[0];

  if (preferDeepest) {
    const finiteDepthPool = pool.filter((id) =>
      Number.isFinite(shallowestDepth(id, graph, new Set())),
    );
    if (finiteDepthPool.length > 0) pool = finiteDepthPool;
  }

  let selectedDepth = preferDeepest ? -Infinity : Infinity;
  for (const id of pool) {
    const depth = shallowestDepth(id, graph, new Set());
    if (
      (preferDeepest && depth > selectedDepth) ||
      (!preferDeepest && depth < selectedDepth)
    ) {
      selectedDepth = depth;
    }
  }
  const depthPool = pool.filter(
    (id) => shallowestDepth(id, graph, new Set()) === selectedDepth,
  );
  if (depthPool.length === 1) return depthPool[0];
  return [...depthPool].sort()[0];
}

function canonicalParentWithOrigin(id, graph) {
  const node = graph.nodesById.get(id);
  if (node?.parent_id) {
    const parent = graph.nodesById.get(node.parent_id);
    if (isValidatedStructuralPointer(node, parent)) {
      return { parentId: node.parent_id, origin: "structural" };
    }
  }
  const structural = pickCanonicalParent(
    id,
    graph.structuralParentsOf.get(id) || [],
    graph,
  );
  if (structural) return { parentId: structural, origin: "structural" };
  // No structural parent — fall back to a single Class-4 organizing hop.
  const organizing = graph.organizingParentsOf?.get(id) || [];
  if (organizing.length > 0) {
    const parentId =
      organizing.length === 1 ? organizing[0] : [...organizing].sort()[0];
    return { parentId, origin: "organizing" };
  }
  return null;
}

function toLink(node, origin) {
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
    origin,
  };
}

export function ancestorChain(nodeId, graph) {
  const startNode = graph.nodesById.get(nodeId);
  if (!startNode) return [];

  // The viewed node itself is never reached via a hop; label its origin
  // "structural" so only genuine organizing hops above it get badged.
  const chain = [toLink(startNode, "structural")];
  const visited = new Set([nodeId]);
  let currentId = nodeId;
  for (;;) {
    const next = canonicalParentWithOrigin(currentId, graph);
    if (!next || visited.has(next.parentId)) break;
    const parentNode = graph.nodesById.get(next.parentId);
    if (!parentNode) break;
    chain.push(toLink(parentNode, next.origin));
    visited.add(next.parentId);
    currentId = next.parentId;
  }
  return chain.reverse();
}
