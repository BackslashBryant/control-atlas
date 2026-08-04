export type AtlasAreaPosition = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const AREA_WIDTH = 188;
const AREA_HEIGHT = 68;

// A deliberate canopy silhouette, not a radial hub. The measured rectangles
// are shared by the renderer and cheap collision-contract tests.
export const ATLAS_UNIVERSE_POSITIONS: AtlasAreaPosition[] = [
  { id: "atlas:LIMB-GOVERNANCE", x: 62, y: 82, width: AREA_WIDTH, height: AREA_HEIGHT },
  { id: "atlas:LIMB-RISK", x: 268, y: 28, width: AREA_WIDTH, height: AREA_HEIGHT },
  { id: "atlas:LIMB-COMPLIANCE", x: 474, y: 0, width: AREA_WIDTH, height: AREA_HEIGHT },
  { id: "atlas:LIMB-IMPLEMENTATION", x: 680, y: 0, width: AREA_WIDTH, height: AREA_HEIGHT },
  { id: "atlas:LIMB-ASSESSMENT", x: 886, y: 28, width: AREA_WIDTH, height: AREA_HEIGHT },
  { id: "atlas:LIMB-OPERATIONS", x: 1092, y: 82, width: AREA_WIDTH, height: AREA_HEIGHT },
  { id: "atlas:LIMB-ARCHITECTURE", x: 150, y: 224, width: AREA_WIDTH, height: AREA_HEIGHT },
  { id: "atlas:LIMB-KNOWLEDGE", x: 580, y: 174, width: AREA_WIDTH, height: AREA_HEIGHT },
  { id: "atlas:LIMB-THREAT", x: 1000, y: 224, width: 212, height: AREA_HEIGHT },
];

export function atlasUniverseCollisions(
  positions: AtlasAreaPosition[] = ATLAS_UNIVERSE_POSITIONS,
  gap = 18,
): Array<[string, string]> {
  const collisions: Array<[string, string]> = [];
  for (let leftIndex = 0; leftIndex < positions.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < positions.length; rightIndex += 1) {
      const left = positions[leftIndex];
      const right = positions[rightIndex];
      const separated =
        left.x + left.width + gap <= right.x ||
        right.x + right.width + gap <= left.x ||
        left.y + left.height + gap <= right.y ||
        right.y + right.height + gap <= left.y;
      if (!separated) collisions.push([left.id, right.id]);
    }
  }
  return collisions;
}
