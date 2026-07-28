// Start Here is a source navigator. Answers are retained only as the user's
// own context for a governing-program conversation; they never select a
// baseline, classification, authorization route, or recommended action.
const PUBLIC_SOURCE_CATALOGS = [
  ["nist-800-53", "NIST SP 800-53 Rev. 5", "Official NIST control catalog."],
  ["nist-800-53b", "NIST SP 800-53B", "Official NIST control baselines; confirm applicability with the governing program."],
  ["fedramp-rev5", "FedRAMP Rev. 5", "Public FedRAMP authorization materials."],
  ["disa-stig", "DISA STIG Library", "Public DISA Security Technical Implementation Guides."],
  ["disa-srg", "DISA SRG Library", "Public DISA Security Requirements Guides."],
  ["nist-800-171-rev2", "NIST SP 800-171 Rev. 2", "Published CUI security requirements reference."],
  ["mitre-attack", "MITRE ATT&CK Enterprise", "Public adversary tactics and techniques knowledge base."],
];

export function hasCompleteStartHereContext(answers) {
  return Boolean(answers.systemType && answers.dataSensitivity && answers.environment);
}

export function buildStartHereRecommendations(answers) {
  if (!hasCompleteStartHereContext(answers)) return null;
  return {
    situation: {
      answers: { ...answers },
      pathLabel: "Source navigator",
      narrative: "These answers do not determine a classification, baseline, authorization path, or applicability result. Use them to formulate questions for the governing program while browsing the public sources below.",
      assumptions: [],
    },
    library: PUBLIC_SOURCE_CATALOGS.map(([catalogId, label, rationale]) => ({
      kind: "library-catalog",
      catalogId,
      label,
      rationale,
    })),
    compare: [],
    patterns: [],
    templates: [],
  };
}
