/**
 * W1.6 — the canonical ancestor (structural, Class 1) chain for a node,
 * root-first. This is what the "Where this sits" rail (W7.2) walks.
 *
 * A node's parent comes from one of two validated sources:
 *   1. a native-catalog `node.parent_id` explicitly marked structural;
 *   2. a native-catalog structural edge targeting the node.
 *      When more than one structural edge exists, the canonical-parent
 *      tie-break picks one:
 *      same `catalog_id` as the child, then the shallower candidate, then
 *      lexical order by id, in that priority.
 *
 * Pure and synchronous: never throws, never fetches. A missing parent
 * returns the partial chain built so far. A cycle (bad data) is detected via
 * a visited-set guard and stops the walk rather than looping forever.
 */

import {
  ancestorChain as buildAncestorChain,
  buildAncestorGraph as buildGraph,
  pickCanonicalParent as pickParent,
} from "../../app/ancestor-path.mjs";

export type AncestorNode = {
  id: string;
  label?: string;
  node_type?: string;
  parent_id?: string | null;
  parent_relationship_class?: string | null;
  metadata?: { catalog_id?: string };
};

export type AncestorEdge = {
  source_node_id: string;
  target_node_id: string;
  relationship_type: string;
  relationship_class?: string;
};

export type AncestorLink = {
  id: string;
  label: string;
  node_type: string;
};

export interface Graph {
  nodesById: Map<string, AncestorNode>;
  structuralParentsOf: Map<string, string[]>;
}

export function buildAncestorGraph(
  nodes: AncestorNode[],
  edges: AncestorEdge[],
): Graph {
  return buildGraph(nodes, edges) as Graph;
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
  return pickParent(childId, candidateIds, graph) as string | null;
}

/**
 * The full ancestor chain for `nodeId`, root-first, ending with `nodeId`
 * itself. Missing data along the way truncates the chain rather than
 * throwing; a cycle stops the walk at the point it would repeat.
 */
export function ancestorChain(nodeId: string, graph: Graph): AncestorLink[] {
  return buildAncestorChain(nodeId, graph) as AncestorLink[];
}
