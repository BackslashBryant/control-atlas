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

export function truncateCanvasLabel(label: string, maxLength = 18): string {
  if (label.length <= maxLength) {
    return label;
  }
  return `${label.slice(0, maxLength - 1)}...`;
}
