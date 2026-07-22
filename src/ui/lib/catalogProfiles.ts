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
