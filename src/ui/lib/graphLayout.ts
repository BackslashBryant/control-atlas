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

export function buildDagreOptions(
  reducedMotion: boolean,
  direction: "LR" | "TB" = "LR",
): cytoscape.LayoutOptions {
  return {
    name: "dagre",
    rankDir: direction,
    nodeSep: 48,
    rankSep: 72,
    fit: false,
    animate: !reducedMotion,
    animationDuration: 400,
    padding: 48,
  } as cytoscape.LayoutOptions;
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
    fit: false,
    padding: 64,
    randomize: mode === "reset",
  } as cytoscape.LayoutOptions;
}

export function buildConcentricOptions(
  reducedMotion: boolean,
): cytoscape.LayoutOptions {
  return {
    name: "concentric",
    fit: false,
    animate: !reducedMotion,
    animationDuration: 400,
    padding: 64,
    minNodeSpacing: 56,
    concentric(node: cytoscape.NodeSingular) {
      const role = String(node.data("graphRole") || "");
      if (role === "nist-control") return 100;
      if (role === "control-catalog") return 80;
      if (role === "baseline-overlay-profile") return 60;
      if (
        role === "assessment-scoping" ||
        role === "implementation-standard"
      ) {
        return 40;
      }
      if (role === "mapping-crosswalk" || role === "threat-defense") return 20;
      return 0;
    },
    levelWidth: () => 1,
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
