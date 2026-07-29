export const SOURCE_STARTING_POINTS = Object.freeze([
  {
    catalogId: "nist-800-53",
    label: "NIST SP 800-53 Rev. 5",
    inclusionReason:
      "Listed because Control Atlas has public NIST control and control-enhancement records.",
  },
  {
    catalogId: "nist-800-53b",
    label: "NIST SP 800-53B",
    inclusionReason:
      "Listed because Control Atlas has public NIST baseline profiles.",
  },
  {
    catalogId: "fedramp-rev5",
    label: "FedRAMP Rev. 5",
    inclusionReason:
      "Listed because Control Atlas has public FedRAMP program records and baseline profiles.",
  },
  {
    catalogId: "disa-stig",
    label: "DISA STIG Library",
    inclusionReason:
      "Listed because Control Atlas has public DISA Security Technical Implementation Guide records.",
  },
  {
    catalogId: "disa-srg",
    label: "DISA SRG Library",
    inclusionReason:
      "Listed because Control Atlas has public DISA Security Requirements Guide records.",
  },
  {
    catalogId: "nist-800-171-rev2",
    label: "NIST SP 800-171 Rev. 2",
    inclusionReason:
      "Listed because Control Atlas has public records from this revision of NIST's CUI security requirements.",
  },
  {
    catalogId: "mitre-attack",
    label: "MITRE ATT&CK Enterprise",
    inclusionReason:
      "Listed because Control Atlas has public MITRE enterprise tactic and technique records.",
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
