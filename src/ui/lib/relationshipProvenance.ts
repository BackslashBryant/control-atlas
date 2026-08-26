export type RelationshipExplanation = {
  label: "Published rationale" | "Navigation note";
  text: string;
} | null;

/** Separates published relationship text from Control Atlas navigation context. */
export function relationshipExplanation(edge: {
  rationale?: string;
  navigation_note?: string;
}): RelationshipExplanation {
  if (edge.rationale) {
    return { label: "Published rationale", text: edge.rationale };
  }
  if (edge.navigation_note) {
    return { label: "Navigation note", text: edge.navigation_note };
  }
  return null;
}
