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

export function catalogProfileFor(
  catalogId: string,
  catalogName = "this catalog",
): CatalogProfile {
  return {
    synopsis: `${catalogName} records loaded from the cited publisher source.`,
    recordLabel: RECORD_LABELS[catalogId] || "records",
  };
}
