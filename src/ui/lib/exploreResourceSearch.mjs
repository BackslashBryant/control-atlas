const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

function normalize(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/poa\s*&\s*m/gi, "poam")
    .replace(/poa\s+and\s+m/gi, "poam")
    .replace(/&/g, " and ")
    .replace(/[_/]+/g, " ")
    .replace(/[^a-zA-Z0-9.-]+/g, " ")
    .trim()
    .toLowerCase();
}

function queryTokens(query) {
  return normalize(query)
    .split(/\s+/)
    .filter((term) => term.length > 1 && !STOP_WORDS.has(term));
}

function matchesAllTokens(text, tokens) {
  return tokens.every((token) => text.includes(token));
}

function scoreResource(
  title,
  id,
  searchableText,
  phrase,
  classification,
  priorityBoost = 0,
) {
  const normalizedTitle = normalize(title);
  const normalizedId = normalize(id);
  const currentBoost =
    (classification === "official_current" ? -2 : 0) + priorityBoost;
  if (normalizedTitle === phrase || normalizedId === phrase) return currentBoost;
  if (normalizedTitle.includes(phrase) || normalizedId.includes(phrase)) {
    return 2 + currentBoost;
  }
  if (searchableText.startsWith(phrase)) return 4 + currentBoost;
  return 6 + currentBoost;
}

function compareResults(left, right) {
  return left.score - right.score || left.title.localeCompare(right.title);
}

export function searchExploreResources(
  query,
  { templates = [], artifacts = [] } = {},
  limit = 8,
) {
  const tokens = queryTokens(query);
  if (tokens.length === 0) {
    return { templates: [], artifacts: [] };
  }
  const phrase = tokens.join(" ");

  const templateResults = templates
    .map((template) => {
      const searchableText = normalize(
        [
          template.template_id,
          template.name,
          template.display_name,
          template.description,
          template.artifact_type,
          template.compatibility?.classification,
          template.compatibility?.claim,
          template.official_alternative?.label,
        ].join(" "),
      );
      return {
        type: "template",
        id: template.template_id || template.name,
        title: template.display_name || template.name,
        summary: template.description || "",
        classification:
          template.compatibility?.classification || "Starter document",
        templateType: template.name,
        score: scoreResource(
          template.display_name || template.name,
          template.template_id || template.name,
          searchableText,
          phrase,
          "",
        ),
        searchableText,
      };
    })
    .filter((result) => matchesAllTokens(result.searchableText, tokens))
    .sort(compareResults)
    .slice(0, limit)
    .map(({ searchableText, ...result }) => result);

  const artifactResults = artifacts
    .map((artifact) => {
      const searchableText = normalize(
        [
          artifact.artifact_id,
          artifact.title,
          artifact.artifact_family,
          artifact.publisher,
          artifact.classification,
          artifact.status,
          artifact.version,
          artifact.summary,
        ].join(" "),
      );
      return {
        type: "official-resource",
        id: artifact.artifact_id,
        title: artifact.title,
        summary: artifact.summary || "",
        classification: artifact.classification || "unverified",
        status: artifact.status || "",
        version: artifact.version || "",
        href: artifact.landing_url || artifact.download_url || "",
        score: scoreResource(
          artifact.title,
          artifact.artifact_id,
          searchableText,
          phrase,
          artifact.classification,
          artifact.status === "current_source_of_truth"
            ? -4
            : artifact.artifact_family === "fedramp_rules_source"
              ? -2
              : 0,
        ),
        searchableText,
      };
    })
    .filter((result) => matchesAllTokens(result.searchableText, tokens))
    .sort(compareResults)
    .slice(0, limit)
    .map(({ searchableText, ...result }) => result);

  return { templates: templateResults, artifacts: artifactResults };
}
