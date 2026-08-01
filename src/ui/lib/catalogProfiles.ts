export type CatalogProfile = {
  synopsis: string;
  recordLabel: string;
};

const RECORD_LABELS: Record<string, string> = {
  "nist-800-171-rev2": "requirements",
  "nist-800-171": "requirements",
  "nist-800-53": "controls",
  "fedramp-rev5": "baseline records",
  "disa-stig": "STIG rules",
  "disa-srg": "SRG requirements",
  "disa-cci": "identifiers",
  "nist-800-53a": "assessment procedures",
  "nist-800-53b": "baselines",
  "nist-800-37": "tasks",
  "nist-800-172": "requirements",
  "csf-2": "outcomes",
  "fips-199": "categorization records",
  "fips-200": "requirements",
  "cmmc-2": "program records",
  "cui-policy": "program records",
  "dod-zt": "activities",
  "dod-rai": "guidance records",
  "nist-ai-rmf": "practices",
  "nist-ssdf": "practices",
  "mitre-attack": "techniques",
  "mitre-attack-ics": "techniques",
  "mitre-d3fend": "countermeasures",
};

// One sentence per catalog: who it binds and when it applies. Not how the data
// got here — every record already carries its publisher and retrieval date in
// the source register, so restating "loaded from the cited publisher source"
// on every catalog said nothing.
const SYNOPSES: Record<string, string> = {
  "nist-800-53":
    "The federal control catalog. Federal agency systems select from it; almost every other framework on this site points back into it.",
  "nist-800-53b":
    "The Low, Moderate, and High baselines: which 800-53 controls you start with once the system has been categorized.",
  "fedramp-rev5":
    "What a cloud service must meet to be authorized for federal use, expressed as 800-53 plus FedRAMP's own additions and parameters.",
  "nist-800-171":
    "What a non-federal organization must do to protect controlled unclassified information on its own systems.",
  "nist-800-171-rev2":
    "The revision most DoD contracts still cite for protecting controlled unclassified information outside federal systems.",
  "nist-800-172":
    "Extra requirements layered on 800-171 when the threat is an advanced persistent adversary rather than ordinary risk.",
  "csf-2":
    "Outcomes, not controls. Useful for talking about a security program with people who do not read control catalogs.",
  "cmmc-2":
    "The assessment program that decides whether a defense contractor may hold controlled unclassified information at all.",
  "cui-policy":
    "The executive-branch rules governing what counts as controlled unclassified information and how it must be marked and handled.",
  "nist-ssdf":
    "Practices for building software so the things you ship are defensible, aimed at development teams rather than system owners.",
  "nist-ai-rmf":
    "How to identify and manage risk in an AI system across its life cycle, for teams fielding models rather than servers.",
  "dod-rai":
    "The Department of Defense's own conditions on building and fielding AI, layered on top of the civil AI guidance.",
  "nist-800-37":
    "The Risk Management Framework itself: the seven steps and the roles that sign at each one.",
  "fips-200":
    "The mandatory minimum security requirements for federal information systems — the floor 800-53 fills in.",
  "fips-199":
    "How to categorize a system as low, moderate, or high impact. This is the decision every baseline downstream depends on.",
  "disa-cci":
    "The identifiers that connect a control's individual statements to the specific settings that satisfy them.",
  "disa-srg":
    "Requirements for a class of technology — a web server, a database — before any specific product is named.",
  "disa-stig":
    "The settings themselves: what must be configured, how to check it, and how to fix it when it is wrong.",
  "nist-800-53a":
    "The procedures an assessor follows to decide whether a control is actually working, control by control.",
  "mitre-attack":
    "What adversaries actually do once they are inside, catalogued from observed intrusions.",
  "mitre-attack-ics":
    "The same adversary behavior catalogue, for industrial control and operational technology environments.",
  "mitre-d3fend":
    "Defensive countermeasures, described precisely enough to be matched against specific attacker techniques.",
  "dod-zt":
    "The Department of Defense's target architecture: the capabilities and activities a zero trust environment has to reach.",
};

export function catalogProfileFor(
  catalogId: string,
  catalogName = "this catalog",
): CatalogProfile {
  return {
    synopsis:
      SYNOPSES[catalogId] ||
      `${catalogName}, published by the source cited on every record below.`,
    recordLabel: RECORD_LABELS[catalogId] || "records",
  };
}
