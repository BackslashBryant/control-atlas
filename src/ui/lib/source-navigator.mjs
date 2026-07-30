export const SOURCE_STARTING_POINTS = Object.freeze([
  {
    catalogId: "nist-800-53",
    label: "NIST SP 800-53 Rev. 5",
    inclusionReason: "Controls and control enhancements from Revision 5.",
  },
  {
    catalogId: "nist-800-53b",
    label: "NIST SP 800-53B",
    inclusionReason: "Low, Moderate, and High control baseline profiles.",
  },
  {
    catalogId: "fedramp-rev5",
    label: "FedRAMP Rev. 5",
    inclusionReason: "FedRAMP program controls and Revision 5 baseline profiles.",
  },
  {
    catalogId: "disa-stig",
    label: "DISA STIG Library",
    inclusionReason: "Security Technical Implementation Guide records from DISA.",
  },
  {
    catalogId: "disa-srg",
    label: "DISA SRG Library",
    inclusionReason: "Security Requirements Guide records from DISA.",
  },
  {
    catalogId: "nist-800-171-rev2",
    label: "NIST SP 800-171 Rev. 2",
    inclusionReason: "CUI security requirements from Revision 2.",
  },
  {
    catalogId: "mitre-attack",
    label: "MITRE ATT&CK Enterprise",
    inclusionReason: "Enterprise tactics and techniques from MITRE ATT&CK.",
  },
]);

export function validateSourceStartingPoints(points = SOURCE_STARTING_POINTS) {
  const errors = [];
  const seen = new Set();
  for (const point of points) {
    if (!point.catalogId || seen.has(point.catalogId)) {
      errors.push(`invalid or duplicate source starting point: ${point.catalogId || "missing"}`);
    }
    seen.add(point.catalogId);
    if (!point.label || !point.inclusionReason) {
      errors.push(`source starting point ${point.catalogId || "missing"} lacks identity or inclusion reason`);
    }
  }
  return errors;
}
