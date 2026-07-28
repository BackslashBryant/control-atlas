export type RelationshipExplanation = {
  label: "Published rationale" | "Navigation note" | "No published rationale";
  text: string;
};

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
  return {
    label: "No published rationale",
    text: "No published rationale was supplied for this relationship.",
  };
}
