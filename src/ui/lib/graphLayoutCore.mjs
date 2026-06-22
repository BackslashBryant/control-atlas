/** @typedef {"full" | "incremental" | "reset" | "none"} LayoutMode */

/**
 * @param {string} centerNodeId
 * @param {string[]} nodeIds
 * @param {string[]} edgeIds
 */
export function topologyFingerprint(centerNodeId, nodeIds, edgeIds) {
  const nodes = [...nodeIds].sort().join(",");
  const edges = [...edgeIds].sort().join(",");
  return `${centerNodeId}|${nodes}|${edges}`;
}

/**
 * @param {string | null} prevFingerprint
 * @param {string} nextFingerprint
 * @param {Set<string>} prevNodeIds
 * @param {Set<string>} nextNodeIds
 * @returns {LayoutMode}
 */
export function resolveLayoutMode(
  prevFingerprint,
  nextFingerprint,
  prevNodeIds,
  nextNodeIds,
) {
  if (prevFingerprint === null) {
    return "full";
  }
  if (prevFingerprint === nextFingerprint) {
    return "none";
  }

  const added = [...nextNodeIds].filter((id) => !prevNodeIds.has(id));
  const removed = [...prevNodeIds].filter((id) => !nextNodeIds.has(id));

  const removedClusters =
    removed.length > 0 && removed.every((id) => id.startsWith("cluster:"));
  const addedClusters =
    added.length > 0 && added.every((id) => id.startsWith("cluster:"));
  const expand =
    removedClusters &&
    added.length > 0 &&
    !added.every((id) => id.startsWith("cluster:"));
  const collapse =
    addedClusters &&
    removed.length > 0 &&
    !removed.every((id) => id.startsWith("cluster:"));

  if (expand || collapse) {
    return "incremental";
  }
  return "full";
}
