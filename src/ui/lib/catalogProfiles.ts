export type CatalogProfile = {
  synopsis: string;
  appliesWhen: string;
  recordLabel: string;
};

const CATALOG_PROFILES: Record<string, CatalogProfile> = {
  "nist-800-171-rev2": {
    synopsis:
      "Security requirements for protecting Controlled Unclassified Information in nonfederal systems and organizations.",
    appliesWhen:
      "Use this revision only when a contract, agreement, or program requirement points to SP 800-171 Rev. 2. Confirm the required revision with the responsible authority.",
    recordLabel: "requirements",
  },
  "nist-800-171": {
    synopsis:
      "Security requirements for protecting Controlled Unclassified Information in nonfederal systems and organizations.",
    appliesWhen:
      "Use the revision named by your contract, agreement, or program requirement. Do not assume a contractor environment alone makes this catalog applicable.",
    recordLabel: "requirements",
  },
  "nist-800-53": {
    synopsis:
      "A catalog of security and privacy controls used to manage risk in federal information systems and organizations.",
    appliesWhen:
      "Use it with the Risk Management Framework and the baseline or tailoring decisions established for the system.",
    recordLabel: "controls",
  },
  "fedramp-rev5": {
    synopsis:
      "FedRAMP Rev. 5 baselines organize the controls used to assess and authorize cloud services for federal use.",
    appliesWhen:
      "Use the baseline and authorization path established for the cloud service. The catalog is a starting reference, not an authorization decision.",
    recordLabel: "baseline records",
  },
  "disa-stig": {
    synopsis:
      "DISA Security Technical Implementation Guides contain technical configuration checks for specific technologies.",
    appliesWhen:
      "Use the STIG and version required for the technology and DoD environment you are assessing.",
    recordLabel: "STIG rules",
  },
  "disa-srg": {
    synopsis:
      "DISA Security Requirements Guides define technology-area requirements that STIGs can inherit or refine.",
    appliesWhen:
      "Use the SRG that matches the technology or cloud impact context established for the system.",
    recordLabel: "SRG requirements",
  },
  "disa-cci": {
    synopsis:
      "Control Correlation Identifiers break high-level policy statements into single, measurable items that connect requirements to STIG checks.",
    appliesWhen:
      "Use CCIs to trace a requirement between policy, controls, and the STIG rules that assess it. They support tracing, not authorization.",
    recordLabel: "identifiers",
  },
  "nist-800-53a": {
    synopsis:
      "Assessment procedures for determining whether SP 800-53 controls are implemented correctly and producing the intended outcome.",
    appliesWhen:
      "Use it alongside the SP 800-53 baseline selected for the system, following the assessment plan set by the responsible assessor.",
    recordLabel: "assessment procedures",
  },
  "nist-800-53b": {
    synopsis:
      "The control baselines — low, moderate, high, and privacy — that tailor SP 800-53 to a system's impact level.",
    appliesWhen:
      "Use it with the FIPS 199 categorization to select a starting baseline, then tailor as the program requires.",
    recordLabel: "baselines",
  },
  "nist-800-37": {
    synopsis:
      "The Risk Management Framework process: Prepare, Categorize, Select, Implement, Assess, Authorize, and Monitor.",
    appliesWhen:
      "Use it as the process that ties categorization, control selection, assessment, and authorization together for a system.",
    recordLabel: "tasks",
  },
  "nist-800-172": {
    synopsis:
      "Enhanced security requirements for protecting Controlled Unclassified Information against advanced persistent threats, supplementing SP 800-171.",
    appliesWhen:
      "Use it only when a contract or program requires the enhanced requirements in addition to SP 800-171. Confirm the requirement with the responsible authority.",
    recordLabel: "requirements",
  },
  "csf-2": {
    synopsis:
      "The NIST Cybersecurity Framework 2.0, organizing outcomes across the Govern, Identify, Protect, Detect, Respond, and Recover functions.",
    appliesWhen:
      "Use it to organize a security program and communicate risk. It is an outcome framework, not a control catalog or authorization basis.",
    recordLabel: "outcomes",
  },
  "fips-199": {
    synopsis:
      "The federal standard for categorizing information and systems by the potential impact of a loss of confidentiality, integrity, or availability.",
    appliesWhen:
      "Use it to set the system's security category, which drives baseline selection under FIPS 200 and SP 800-53.",
    recordLabel: "categorization records",
  },
  "fips-200": {
    synopsis:
      "The federal standard defining minimum security requirements across the security-related areas for information and systems.",
    appliesWhen:
      "Use it with the FIPS 199 categorization to determine the SP 800-53 baseline a federal system must meet.",
    recordLabel: "requirements",
  },
  "cmmc-2": {
    synopsis:
      "The Cybersecurity Maturity Model Certification program and its levels for safeguarding information across the defense industrial base.",
    appliesWhen:
      "Use it when a Department of Defense contract requires a specific CMMC level. Confirm the required level and assessment path with the contracting authority.",
    recordLabel: "records",
  },
  "cui-policy": {
    synopsis:
      "The federal Controlled Unclassified Information program rule (32 CFR Part 2002) governing how CUI is marked, safeguarded, and shared.",
    appliesWhen:
      "Use it to understand CUI handling obligations. Specific safeguarding requirements are set by SP 800-171 and your agency or contract.",
    recordLabel: "records",
  },
  "dod-zt": {
    synopsis:
      "The Department of Defense Zero Trust Reference Architecture and its pillars, capabilities, and activities.",
    appliesWhen:
      "Use it for DoD zero trust planning and alignment. Confirm the current version and target activities with the responsible program.",
    recordLabel: "activities",
  },
  "dod-rai": {
    synopsis:
      "The Department of Defense Responsible AI Toolkit and its tenets for developing and fielding artificial intelligence responsibly.",
    appliesWhen:
      "Use it for DoD responsible-AI planning and alignment. It provides guidance rather than a compliance baseline.",
    recordLabel: "records",
  },
  "nist-ai-rmf": {
    synopsis:
      "The NIST AI Risk Management Framework, organizing AI risk practices across the Govern, Map, Measure, and Manage functions.",
    appliesWhen:
      "Use it to structure AI risk management. It is voluntary guidance, not a mandatory control set or authorization decision.",
    recordLabel: "practices",
  },
  "nist-ssdf": {
    synopsis:
      "The Secure Software Development Framework (SP 800-218): practices for building security into the software development lifecycle.",
    appliesWhen:
      "Use it to align development practices with federal secure-software expectations. Confirm which practices apply with the responsible program.",
    recordLabel: "practices",
  },
  "mitre-attack": {
    synopsis:
      "A curated knowledge base of real-world adversary tactics and techniques for enterprise systems.",
    appliesWhen:
      "Use it to understand threat behavior and inform detection and defense. It is a reference model, not a compliance requirement.",
    recordLabel: "techniques",
  },
  "mitre-attack-ics": {
    synopsis:
      "Adversary tactics and techniques observed against industrial control systems and operational technology.",
    appliesWhen:
      "Use it when assessing threats to ICS and OT environments. It informs defensive planning rather than setting a compliance baseline.",
    recordLabel: "techniques",
  },
  "mitre-d3fend": {
    synopsis:
      "A knowledge graph of defensive countermeasures and their relationships to offensive techniques.",
    appliesWhen:
      "Use it to map candidate defenses to the threats they address. It complements ATT&CK and does not define required controls.",
    recordLabel: "countermeasures",
  },
};

export function catalogProfileFor(
  catalogId: string,
  catalogName = "this catalog",
): CatalogProfile {
  return (
    CATALOG_PROFILES[catalogId] || {
      synopsis: `${catalogName} records available in the Control Atlas public data set.`,
      appliesWhen:
        "Confirm applicability and the required version with the authoritative source before using these records for an assessment or authorization decision.",
      recordLabel: "records",
    }
  );
}
