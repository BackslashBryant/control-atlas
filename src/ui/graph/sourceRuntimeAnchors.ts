/**
 * Bridges manifest sources to a representative node in the runtime graph so
 * the Atlas drill-down can continue from "source" into its actual records
 * (baselines, controls, capabilities). Only sources with ingested runtime
 * data appear here; callers must verify the anchor exists via
 * runtime.getNode() before offering navigation.
 */
export const SOURCE_RUNTIME_ANCHORS: Record<string, string> = {
  "nist-sp-800-53-r5": "nist-800-53:FAMILY-AC",
  "nist-sp-800-171-r2": "nist-800-171-rev2:CATALOG",
  "nist-sp-800-171-r3": "nist-800-171:CATALOG",
  "nist-sp-800-172-r3": "nist-800-172:CATALOG",
  "nist-sp-800-53b": "nist-800-53b:MODERATE",
  "fedramp-rev5-baselines": "fedramp-rev5:HIGH",
  "cmmc-2-0": "cmmc-2:LEVEL-2",
  "nist-sp-800-37-r2": "nist-800-37:RMF-CATEGORIZE",
  "cui-32-cfr-2002": "cui-policy:CUI-BASIC",
  "fips-199": "fips-199:FIPS-199-MODERATE",
  "dod-zero-trust-strategy": "dod-zt:DOC-STRATEGY",
  "dod-zero-trust-ra-v2": "dod-zt:DOC-RA",
  "dod-zero-trust-overlays": "dod-zt:DOC-OVERLAYS",
  "dod-zero-trust-roadmap": "dod-zt:DOC-ROADMAP",
  "dod-zero-trust-capabilities-activities": "dod-zt:CATALOG",
};
