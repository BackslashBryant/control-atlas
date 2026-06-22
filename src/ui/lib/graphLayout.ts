import type cytoscape from "cytoscape";

export type LayoutMode = "full" | "incremental" | "reset" | "none";

export function topologyFingerprint(
  centerNodeId: string,
  nodeIds: string[],
  edgeIds: string[],
): string {
  const nodes = [...nodeIds].sort().join(",");
  const edges = [...edgeIds].sort().join(",");
  return `${centerNodeId}|${nodes}|${edges}`;
}

export function resolveLayoutMode(
  prevFingerprint: string | null,
  nextFingerprint: string,
  prevNodeIds: Set<string>,
  nextNodeIds: Set<string>,
): LayoutMode {
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
    removedClusters && added.length > 0 && !added.every((id) => id.startsWith("cluster:"));
  const collapse =
    addedClusters && removed.length > 0 && !removed.every((id) => id.startsWith("cluster:"));

  if (expand || collapse) {
    return "incremental";
  }
  return "full";
}

export function buildFcoseOptions(
  mode: Exclude<LayoutMode, "none">,
  reducedMotion: boolean,
): cytoscape.LayoutOptions {
  const animate = !reducedMotion;

  if (mode === "incremental") {
    return {
      name: "fcose",
      quality: "proof",
      randomize: false,
      fit: false,
      animate,
      animationDuration: 400,
      initialEnergyOnIncremental: 0.3,
      packComponents: true,
      padding: 64,
    } as cytoscape.LayoutOptions;
  }

  return {
    name: "fcose",
    nodeDimensionsIncludeLabels: true,
    quality: "default",
    packComponents: true,
    animate,
    animationDuration: 400,
    fit: true,
    padding: 64,
    randomize: true,
  } as cytoscape.LayoutOptions;
}

export function placeNewNodesNearAnchor(
  graph: cytoscape.Core,
  newNodeIds: string[],
  anchor: { x: number; y: number },
): void {
  const spread = 48;
  newNodeIds.forEach((id, index) => {
    const node = graph.getElementById(id);
    if (!node.nonempty()) {
      return;
    }
    const angle = (2 * Math.PI * index) / Math.max(newNodeIds.length, 1);
    node.position({
      x: anchor.x + Math.cos(angle) * spread,
      y: anchor.y + Math.sin(angle) * spread,
    });
  });
}

export function truncateCanvasLabel(label: string, maxLength = 18): string {
  if (label.length <= maxLength) {
    return label;
  }
  return `${label.slice(0, maxLength - 1)}…`;
}
