export const ADD_LATER_SOURCES = [
  {
    sourceId: "nist-sp-800-30",
    displayName: "NIST SP 800-30",
    category: "Risk assessment reference",
    canonicalUrl: "https://csrc.nist.gov/pubs/sp/800/30/r1/final",
    addCondition: "Add if risk assessment lane becomes first-class",
  },
  {
    sourceId: "nist-sp-800-39",
    displayName: "NIST SP 800-39",
    category: "Enterprise risk reference",
    canonicalUrl: "https://csrc.nist.gov/pubs/sp/800/39/final",
    addCondition: "Add if enterprise risk lane becomes first-class",
  },
  {
    sourceId: "nist-sp-800-137",
    displayName: "NIST SP 800-137",
    category: "Continuous monitoring reference",
    canonicalUrl: "https://csrc.nist.gov/pubs/sp/800/137/final",
    addCondition: "Add if ConMon lane becomes first-class",
  },
  {
    sourceId: "nist-sp-800-60",
    displayName: "NIST SP 800-60",
    category: "Categorization support",
    canonicalUrl: "https://csrc.nist.gov/pubs/sp/800/60/vol-1/r1/final",
    addCondition: "Add if categorization support is expanded",
  },
  {
    sourceId: "cisa-kev",
    displayName: "CISA KEV",
    category: "Vulnerability prioritization support",
    canonicalUrl:
      "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
    addCondition: "Add if vulnerability prioritization becomes a lane",
  },
  {
    sourceId: "nist-privacy-framework",
    displayName: "NIST Privacy Framework",
    category: "Privacy governance support",
    canonicalUrl: "https://www.nist.gov/privacy-framework",
    addCondition: "Add if privacy becomes first-class",
  },
] as const;
