function textMatch(value, query) {
  return String(value || "").toLowerCase().includes(query);
}

function metadataMatch(resource, contextType, query) {
  if (contextType === "template") {
    return resource.resourceType === "template" || (resource.artifactTypes || []).includes("template")
      ? "resource type or artifact metadata"
      : "";
  }
  if (contextType === "stig") {
    return textMatch(resource.id, "stig") || (resource.frameworks || []).some((value) => textMatch(value, "stig"))
      ? "resource ID or framework metadata"
      : "";
  }
  if (contextType === "workforce") {
    return ["8140", "nice", "dcwf"].some((value) => textMatch(resource.id, value) || (resource.frameworks || []).some((framework) => textMatch(framework, value)))
      ? "resource ID or framework metadata"
      : "";
  }
  if (!query) return "";
  if (textMatch(resource.name, query) || textMatch(resource.shortName, query)) return "resource name metadata";
  if ((resource.frameworks || []).some((value) => textMatch(value, query))) return "framework metadata";
  if ((resource.searchKeywords || []).some((value) => textMatch(value, query))) return "search keyword metadata";
  if (textMatch(resource.summary, query)) return "resource summary metadata";
  return "";
}

export function contextualResourceRecommendations({ resources, contextType, contextId = "", query = "", framework = "", maxItems = 3 }) {
  const normalizedQuery = String(query || contextId || framework).toLowerCase().trim();
  return resources
    .map((resource) => ({ resource, match: metadataMatch(resource, contextType, normalizedQuery) }))
    .filter(({ match }) => Boolean(match))
    .sort((left, right) => {
      if (Boolean(right.resource.editorialRecommendation) !== Boolean(left.resource.editorialRecommendation)) {
        return right.resource.editorialRecommendation ? 1 : -1;
      }
      if (left.resource.resourceLane === "official" && right.resource.resourceLane !== "official") return -1;
      if (right.resource.resourceLane === "official" && left.resource.resourceLane !== "official") return 1;
      return left.resource.name.localeCompare(right.resource.name);
    })
    .slice(0, maxItems)
    .map(({ resource, match }) => ({
      resource,
      target: `${contextType}:${contextId || query || framework || "current"}`,
      relation: "contextual metadata match",
      reason: `Derived from ${match}.`,
      provenance: "Derived from existing Resources metadata",
      reviewDate: resource.lastCheckedAt,
      structural: false,
    }));
}
