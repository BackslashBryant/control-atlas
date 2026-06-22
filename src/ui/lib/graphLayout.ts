import type cytoscape from "cytoscape";

import {
  resolveLayoutMode as resolveLayoutModeCore,
  topologyFingerprint as topologyFingerprintCore,
} from "./graphLayoutCore.mjs";

export type LayoutMode = "full" | "incremental" | "reset" | "none";

export function topologyFingerprint(
  centerNodeId: string,
  nodeIds: string[],
  edgeIds: string[],
): string {
  return topologyFingerprintCore(centerNodeId, nodeIds, edgeIds);
}

export function resolveLayoutMode(
  prevFingerprint: string | null,
  nextFingerprint: string,
  prevNodeIds: Set<string>,
  nextNodeIds: Set<string>,
): LayoutMode {
  return resolveLayoutModeCore(
    prevFingerprint,
    nextFingerprint,
    prevNodeIds,
    nextNodeIds,
  );
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
