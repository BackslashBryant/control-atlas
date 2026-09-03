import type { AtlasSemanticProjectionArtifact } from "./atlasGraphProjection";
import { catalogShortNameFor } from "./catalogProfiles";

/**
 * Where a reader crossed from one framework into another.
 *
 * The scope parameters already describe where you are, and the decomposition
 * breadcrumb can recover how you got there — but only downwards. A crosswalk
 * pivot is a sideways move: arriving at CSF from 800-53 leaves no trace in
 * CSF's own ancestry, because 800-53 is not one of its ancestors. This is the
 * record of those crossings, so the reader can see the route they actually
 * took and step back along it.
 */
export type AtlasPivotStep = {
  ecosystemId: string;
  publicationId: string;
  nodeId: string;
};

/**
 * Long enough to hold a real exploration, short enough that the URL stays
 * usable. Older crossings fall off the front; the reader keeps the recent
 * route, which is the part they are still reasoning about.
 */
export const PIVOT_TRAIL_LIMIT = 6;

const STEP_SEPARATOR = "~";
const FIELD_SEPARATOR = "|";

function clean(value: string): string {
  // The separators are the only characters that could corrupt the encoding,
  // and no id in the corpus contains them.
  return String(value || "").split(STEP_SEPARATOR).join("").split(FIELD_SEPARATOR).join("");
}

export function parsePivotTrail(serialized: string): AtlasPivotStep[] {
  if (!serialized) return [];
  return serialized
    .split(STEP_SEPARATOR)
    .map((chunk) => chunk.split(FIELD_SEPARATOR))
    .filter((parts) => parts.length === 3 && parts[1])
    .map(([ecosystemId, publicationId, nodeId]) => ({
      ecosystemId: ecosystemId || "",
      publicationId: publicationId || "",
      nodeId: nodeId || "",
    }))
    .slice(-PIVOT_TRAIL_LIMIT);
}

export function serializePivotTrail(steps: AtlasPivotStep[]): string {
  return steps
    .slice(-PIVOT_TRAIL_LIMIT)
    .map((step) =>
      [clean(step.ecosystemId), clean(step.publicationId), clean(step.nodeId)].join(
        FIELD_SEPARATOR,
      ),
    )
    .join(STEP_SEPARATOR);
}

/**
 * Adds a crossing to the trail.
 *
 * Returning to a framework already on the trail truncates back to it rather
 * than appending: going 800-53 to CSF and back is one round trip, not a
 * three-step journey, and showing it as three would misdescribe the route.
 */
export function pushPivot(
  serialized: string,
  step: AtlasPivotStep,
): string {
  if (!step.publicationId) return serialized;
  const steps = parsePivotTrail(serialized);
  const existing = steps.findIndex(
    (entry) => entry.publicationId === step.publicationId,
  );
  if (existing >= 0) return serializePivotTrail(steps.slice(0, existing + 1));
  return serializePivotTrail([...steps, step]);
}

/** Drops everything after the given position, for stepping back along the trail. */
export function truncatePivotTrail(serialized: string, index: number): string {
  return serializePivotTrail(parsePivotTrail(serialized).slice(0, index));
}

export type AtlasPivotLabel = AtlasPivotStep & {
  /** What to call the framework left behind. */
  label: string;
  /** The record the reader pivoted from, when they were on one. */
  recordLabel: string;
};

export function describePivotTrail(
  serialized: string,
  artifact: AtlasSemanticProjectionArtifact | null | undefined,
): AtlasPivotLabel[] {
  return parsePivotTrail(serialized).map((step) => ({
    ...step,
    label: catalogShortNameFor(
      step.publicationId,
      artifact?.publications?.[step.publicationId]?.label || "",
    ),
    recordLabel: step.nodeId
      ? artifact?.record_locations?.[step.nodeId]?.label || ""
      : "",
  }));
}
