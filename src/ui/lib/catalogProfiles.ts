import { areaPresentationForCatalog } from "./areaVisualLanguage";

export type CatalogProfile = {
  synopsis: string;
  recordLabel: string;
  publicationKind: string;
  area: string;
};

// W10 — canonical publication-kind classification (docs/plans/audit-
// alignment-2026-08-02.md Phase 3c). Primary grouping on Catalog used to be
// the raw record-type enum below ("STIG rules", "identifiers"), which reads
// as a schema dump, not a map a newcomer can use to tell FedRAMP from a
// STIG. "Policy and regulation" is one addition beyond the fix spec's nine
// example kinds — CUI marking policy is not a control catalog, risk
// framework, or any of the other eight, and mislabeling it would be worse
// than naming a tenth kind for the one publication that needs it.
const PUBLICATION_KINDS: Record<string, string> = {
  "nist-800-53": "Control catalog",
  "nist-800-53a": "Control catalog",
  "nist-800-171": "Control catalog",
  "nist-800-171-rev2": "Control catalog",
  "nist-800-172": "Control catalog",
  "nist-800-53b": "Control-selection method",
  "nist-800-37": "Risk framework",
  "fips-199": "Risk framework",
  "fips-200": "Risk framework",
  "nist-ai-rmf": "Risk framework",
  "dod-rai": "Risk framework",
  "csf-2": "Outcome framework",
  "fedramp-rev5": "Authorization program",
  "cmmc-2": "Certification program",
  "disa-stig": "Implementation standard",
  "disa-srg": "Implementation standard",
  "disa-cci": "Implementation standard",
  "nist-ssdf": "Implementation standard",
  "dod-zt": "Implementation standard",
  "mitre-attack": "Threat knowledge base",
  "mitre-attack-ics": "Threat knowledge base",
  "mitre-d3fend": "Defensive knowledge base",
  "cui-policy": "Policy and regulation",
};

export function catalogAreaFor(catalogId: string): string {
  return areaPresentationForCatalog(catalogId)?.label || "";
}

const RECORD_LABELS: Record<string, string> = {
  "nist-800-171-rev2": "Requirements",
  "nist-800-171": "Requirements",
  "nist-800-53": "Controls",
  "fedramp-rev5": "Baselines",
  "disa-stig": "STIG rules",
  "disa-srg": "SRG requirements",
  "disa-cci": "Identifiers",
  "nist-800-53a": "Assessment procedures",
  "nist-800-53b": "Baselines",
  "nist-800-37": "Tasks",
  "nist-800-172": "Requirements",
  "csf-2": "Outcomes",
  "fips-199": "Categorization records",
  "fips-200": "Requirements",
  "cmmc-2": "Program records",
  "cui-policy": "Program records",
  "dod-zt": "Activities",
  "dod-rai": "Guidance records",
  "nist-ai-rmf": "Practices",
  "nist-ssdf": "Practices",
  "mitre-attack": "Techniques",
  "mitre-attack-ics": "Techniques",
  "mitre-d3fend": "Countermeasures",
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
    "Revision 3: what a non-federal organization must do to protect controlled unclassified information on its own systems.",
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
    recordLabel: RECORD_LABELS[catalogId] || "Records",
    publicationKind: PUBLICATION_KINDS[catalogId] || "Published structure",
    area: catalogAreaFor(catalogId),
  };
}
