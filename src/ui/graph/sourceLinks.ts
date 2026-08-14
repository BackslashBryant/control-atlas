/**
 * Confidence tier for a source URL.
 *
 * - `verified`   — Confirmed from the official source's own URL scheme or
 *                  specification. Safe to display as a definitive link.
 * - `best_effort`— Derived from public references or observed patterns, not
 *                  from an official URL-scheme specification. Show with a
 *                  fallback to the official catalog/document URL.
 * - `unavailable`— No verified or best-effort per-element URL exists. Record
 *                  the gap explicitly; do not fabricate a URL.
 */
export type SourceLinkConfidence = "verified" | "best_effort" | "unavailable";

export type SourceDeepLink = {
  /** The deep link URL, or null when confidence is `unavailable`. */
  url: string | null;
  confidence: SourceLinkConfidence;
  /** Human-readable label for this link slot. */
  label: string;
};

export type SourceLinkRecord = {
  sourceId: string;
  displayName: string;
  /** Authoritative landing page or dataset URL. Always verified. */
  canonicalUrl: string;
  dataUrl?: string;
  repoUrl?: string;
  notes?: string;
  /**
   * Optional convenience deep link into a browser-navigable element view.
   * May be `best_effort` or `unavailable`. Never fabricate a URL here.
   * Use `resolveSourceLink()` to apply the correct fallback.
   */
  deepLink?: SourceDeepLink;
};

export const SOURCE_LINKS: SourceLinkRecord[] = [
  { sourceId: "fisma-44-usc-3551", displayName: "FISMA / 44 U.S.C. Chapter 35, Subchapter II", canonicalUrl: "https://www.govinfo.gov/content/pkg/USCODE-2023-title44/html/USCODE-2023-title44-chap35-subchapII.htm" },
  { sourceId: "omb-a-130", displayName: "OMB Circular A-130", canonicalUrl: "https://www.whitehouse.gov/wp-content/uploads/legacy_drupal_files/omb/circulars/A130/a130revised.pdf" },
  { sourceId: "cui-32-cfr-2002", displayName: "32 CFR Part 2002 CUI", canonicalUrl: "https://www.ecfr.gov/current/title-32/part-2002" },
  { sourceId: "fips-199", displayName: "FIPS 199", canonicalUrl: "https://csrc.nist.gov/pubs/fips/199/final" },
  { sourceId: "fips-200", displayName: "FIPS 200", canonicalUrl: "https://csrc.nist.gov/pubs/fips/200/final" },
  { sourceId: "cnssi-1253", displayName: "CNSSI 1253", canonicalUrl: "https://www.cnss.gov/CNSS/issuances/Instructions.cfm" },
  { sourceId: "dodi-8500-01", displayName: "DoDI 8500.01 Cybersecurity", canonicalUrl: "https://www.esd.whs.mil/Directives/issuances/dodi/", notes: "Use the canonical collection page if the direct document URL changes." },
  { sourceId: "dodi-8510-01", displayName: "DoDI 8510.01 RMF for DoD Systems", canonicalUrl: "https://www.esd.whs.mil/Portals/54/Documents/DD/issuances/dodi/851001p.pdf" },
  { sourceId: "dodi-8530-01", displayName: "DoDI 8530.01 Cybersecurity Activities Support", canonicalUrl: "https://www.esd.whs.mil/Portals/54/Documents/DD/issuances/dodi/853001p.pdf" },
  { sourceId: "far-52-204-21", displayName: "FAR 52.204-21", canonicalUrl: "https://www.acquisition.gov/far/52.204-21" },
  { sourceId: "dfars-252-204-7012", displayName: "DFARS 252.204-7012", canonicalUrl: "https://www.acquisition.gov/dfars/252.204-7012-safeguarding-covered-defense-information-and-cyber-incident-reporting." },
  { sourceId: "dfars-252-204-7021", displayName: "DFARS 252.204-7021", canonicalUrl: "https://www.acquisition.gov/dfars", notes: "Use the canonical collection page if the exact document URL changes." },
  { sourceId: "nist-sp-800-37-r2", displayName: "NIST SP 800-37 Rev. 2 RMF", canonicalUrl: "https://csrc.nist.gov/pubs/sp/800/37/r2/final" },
  { sourceId: "nist-csf-2-0", displayName: "NIST Cybersecurity Framework 2.0", canonicalUrl: "https://www.nist.gov/cyberframework" },
  { sourceId: "nist-ai-rmf", displayName: "NIST AI RMF", canonicalUrl: "https://www.nist.gov/itl/ai-risk-management-framework" },
  { sourceId: "nist-ai-rmf-playbook", displayName: "NIST AI RMF Playbook", canonicalUrl: "https://airc.nist.gov/AI_RMF_Knowledge_Base/Playbook" },
  { sourceId: "dod-rai-toolkit", displayName: "CDAO AI Assurance Toolkit", canonicalUrl: "https://www.ai.mil/Initiatives/About/Resources/Pathway-to-AI-Readiness/Responsible-AI/" },
  { sourceId: "dod-zero-trust-strategy", displayName: "DoD Zero Trust Strategy", canonicalUrl: "https://dodcio.defense.gov/Portals/0/Documents/Library/DoD-ZTStrategy.pdf" },
  { sourceId: "dod-zero-trust-ra-v2", displayName: "DoD Zero Trust Reference Architecture v2.0", canonicalUrl: "https://dodcio.defense.gov/Portals/0/Documents/Library/%28U%29ZT_RA_v2.0%28U%29_Sep22.pdf" },
  {
    sourceId: "nist-sp-800-53-r5",
    displayName: "NIST SP 800-53 Rev. 5",
    canonicalUrl: "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
    deepLink: {
      url: "https://csrc.nist.gov/projects/cprt/catalog#/cprt/framework/version/SP_800_53_5_2_0/home",
      confidence: "best_effort",
      label: "NIST CPRT catalog (best-effort route)",
    },
  },
  { sourceId: "nist-sp-800-53-oscal", displayName: "NIST SP 800-53 OSCAL Content", canonicalUrl: "https://github.com/usnistgov/oscal-content", repoUrl: "https://github.com/usnistgov/oscal-content" },
  { sourceId: "nist-sp-800-171-r2", displayName: "NIST SP 800-171 Rev. 2", canonicalUrl: "https://csrc.nist.gov/pubs/sp/800/171/r2/final" },
  { sourceId: "nist-sp-800-171-r3", displayName: "NIST SP 800-171 Rev. 3", canonicalUrl: "https://csrc.nist.gov/pubs/sp/800/171/r3/final" },
  { sourceId: "nist-sp-800-172-r3", displayName: "NIST SP 800-172 Rev. 3", canonicalUrl: "https://csrc.nist.gov/pubs/sp/800/172/r3/final" },
  { sourceId: "nist-ssdf-sp-800-218", displayName: "NIST SSDF / SP 800-218", canonicalUrl: "https://csrc.nist.gov/pubs/sp/800/218/final" },
  { sourceId: "nist-sp-800-53b", displayName: "NIST SP 800-53B Baselines", canonicalUrl: "https://csrc.nist.gov/pubs/sp/800/53/b/upd1/final" },
  { sourceId: "fedramp-rev5-baselines", displayName: "FedRAMP Rev. 5 Baselines", canonicalUrl: "https://www.fedramp.gov/documents-templates/" },
  { sourceId: "cmmc-2-0", displayName: "CMMC 2.0", canonicalUrl: "https://dodcio.defense.gov/CMMC/" },
  { sourceId: "cmmc-32-cfr-170", displayName: "32 CFR Part 170 CMMC Program", canonicalUrl: "https://www.ecfr.gov/current/title-32/part-170" },
  { sourceId: "dod-zero-trust-overlays", displayName: "DoD Zero Trust Overlays", canonicalUrl: "https://dodcio.defense.gov/Library/" },
  { sourceId: "dod-zero-trust-capabilities-activities", displayName: "DoD Zero Trust Capabilities and Activities", canonicalUrl: "https://dodcio.defense.gov/Library/" },
  { sourceId: "dod-zero-trust-roadmap", displayName: "DoD Zero Trust Capability Execution Roadmap", canonicalUrl: "https://dodcio.defense.gov/Library/" },
  { sourceId: "nist-sp-800-53a-r5", displayName: "NIST SP 800-53A Rev. 5", canonicalUrl: "https://csrc.nist.gov/pubs/sp/800/53/a/r5/final" },
  { sourceId: "nist-sp-800-171a-r3", displayName: "NIST SP 800-171A Rev. 3", canonicalUrl: "https://csrc.nist.gov/pubs/sp/800/171/a/r3/final" },
  { sourceId: "nist-sp-800-172a-r3", displayName: "NIST SP 800-172A Rev. 3", canonicalUrl: "https://csrc.nist.gov/pubs/sp/800/172/a/r3/final" },
  { sourceId: "cmmc-assessment-guides", displayName: "CMMC Assessment Guides", canonicalUrl: "https://dodcio.defense.gov/CMMC/Documentation/" },
  { sourceId: "cmmc-scoping-guides", displayName: "CMMC Scoping Guides", canonicalUrl: "https://dodcio.defense.gov/CMMC/Documentation/" },
  { sourceId: "fedramp-assessment-artifacts", displayName: "FedRAMP Assessment Artifacts", canonicalUrl: "https://www.fedramp.gov/documents-templates/" },
  { sourceId: "disa-srg-library", displayName: "DISA SRG Library", canonicalUrl: "https://www.cyber.mil/stigs/" },
  { sourceId: "disa-stig-library", displayName: "DISA STIG Library", canonicalUrl: "https://www.cyber.mil/stigs/" },
  { sourceId: "disa-stig-srg-cci-references", displayName: "DISA STIG/SRG CCI References", canonicalUrl: "https://www.cyber.mil/stigs/" },
  { sourceId: "disa-stig-compilations", displayName: "DISA STIG Compilations Landing Page", canonicalUrl: "https://www.cyber.mil/stigs/" },
  { sourceId: "disa-stig-downloads", displayName: "DISA STIG Downloads Landing Page", canonicalUrl: "https://www.cyber.mil/stigs/" },
  { sourceId: "disa-stig-gpo", displayName: "DISA STIG GPO Landing Page", canonicalUrl: "https://www.cyber.mil/stigs/gpo/" },
  {
    sourceId: "disa-cci-list",
    displayName: "DISA CCI List",
    canonicalUrl: "https://www.cyber.mil/stigs/cci/",
    deepLink: {
      url: null,
      confidence: "unavailable",
      label: "No verified official per-CCI deep link",
    },
  },
  { sourceId: "disa-cci-to-nist-800-53", displayName: "CCI to NIST SP 800-53 References", canonicalUrl: "https://www.cyber.mil/stigs/cci/" },
  { sourceId: "nist-800-53-csf-mapping", displayName: "CSF 1.1 to SP 800-53 Supplemental Mapping", canonicalUrl: "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final" },
  { sourceId: "nist-csf-1-1-to-2-0-olir", displayName: "CSF 1.1 to CSF 2.0 OLIR Crosswalk", canonicalUrl: "https://csrc.nist.gov/projects/olir" },
  { sourceId: "nist-800-171-r3-control-references", displayName: "SP 800-171 Rev. 3 OSCAL Control References", canonicalUrl: "https://github.com/usnistgov/oscal-content", repoUrl: "https://github.com/usnistgov/oscal-content" },
  { sourceId: "olir-csf-2-to-800-53-r5-2", displayName: "OLIR CSF 2.0 to SP 800-53 Rev. 5.2.0 Mapping", canonicalUrl: "https://csrc.nist.gov/projects/olir" },
  { sourceId: "olir-csf-2-to-800-171-r3", displayName: "OLIR CSF 2.0 to SP 800-171 Rev. 3 Mapping", canonicalUrl: "https://csrc.nist.gov/projects/olir" },
  { sourceId: "nist-informative-references", displayName: "NIST Informative References", canonicalUrl: "https://csrc.nist.gov/projects/olir" },
  { sourceId: "mitre-cis-cci-mappings", displayName: "MITRE CIS/CCI Mappings", canonicalUrl: "https://www.mitre.org/" },
  { sourceId: "community-cci-research", displayName: "Community CCI Research", canonicalUrl: "registry-local-only" },
  { sourceId: "mitre-attack-enterprise", displayName: "MITRE ATT&CK Enterprise", canonicalUrl: "https://attack.mitre.org/" },
  { sourceId: "mitre-attack-ics", displayName: "MITRE ATT&CK for ICS", canonicalUrl: "https://attack.mitre.org/matrices/ics/" },
  { sourceId: "mitre-attack-stix-data", displayName: "MITRE ATT&CK STIX Data", canonicalUrl: "https://github.com/mitre-attack/attack-stix-data", repoUrl: "https://github.com/mitre-attack/attack-stix-data" },
  { sourceId: "mitre-d3fend", displayName: "MITRE D3FEND Ontology", canonicalUrl: "https://d3fend.mitre.org/" },
  { sourceId: "mitre-d3fend-resources", displayName: "MITRE D3FEND Resources", canonicalUrl: "https://d3fend.mitre.org/resources/" },
  { sourceId: "mitre-d3fend-github", displayName: "MITRE D3FEND GitHub", canonicalUrl: "https://github.com/d3fend", repoUrl: "https://github.com/d3fend" },
  { sourceId: "nara-cui-registry", displayName: "NARA CUI Registry", canonicalUrl: "https://www.archives.gov/cui/registry/category-list" },
  { sourceId: "stig-viewer-public-catalog", displayName: "STIG Viewer Public Catalog", canonicalUrl: "https://www.cyber.mil/stigs/stig-viewing-tools/" },
  { sourceId: "stig-viewer-clkb-api-announcement", displayName: "STIG Viewer CLKB API Announcement", canonicalUrl: "https://www.cyber.mil/stigs/" },
  { sourceId: "nuwcdivnpt-github", displayName: "NUWCDIVNPT GitHub Organization", canonicalUrl: "https://github.com/NUWCDIVNPT" },
  { sourceId: "nuwcdivnpt-stig-manager", displayName: "NUWCDIVNPT STIG Manager", canonicalUrl: "https://github.com/NUWCDIVNPT/stig-manager", repoUrl: "https://github.com/NUWCDIVNPT/stig-manager" },
];

const SOURCE_LINKS_BY_ID = new Map(
  SOURCE_LINKS.map((source) => [source.sourceId, source]),
);

export function sourceLinkFor(sourceId: string): SourceLinkRecord {
  const source = SOURCE_LINKS_BY_ID.get(sourceId);
  if (!source) {
    throw new Error(`Unknown sourceId: ${sourceId}`);
  }
  return source;
}

export type ResolvedSourceLink = {
  href: string;
  label: string;
  confidence: SourceLinkConfidence;
  isDeepLink: boolean;
};

/**
 * Resolves a source link with automatic fallback logic.
 *
 * If a controlId is provided and a best_effort/verified deep link is available,
 * constructs the deep link. Otherwise, falls back to the authoritative canonical URL.
 */
export function resolveSourceLink(
  sourceId: string,
  controlId?: string,
): ResolvedSourceLink {
  const source = sourceLinkFor(sourceId);
  if (
    controlId &&
    source.deepLink &&
    source.deepLink.confidence !== "unavailable" &&
    source.deepLink.url
  ) {
    let deepUrl = source.deepLink.url;
    if (deepUrl.includes("cprt/catalog")) {
      deepUrl = `${deepUrl}?element=${encodeURIComponent(controlId)}`;
    }
    return {
      href: deepUrl,
      label: `Open ${controlId} in ${source.displayName}`,
      confidence: source.deepLink.confidence,
      isDeepLink: true,
    };
  }

  return {
    href: source.canonicalUrl,
    label: `Open ${source.displayName} official publication`,
    confidence: "verified",
    isDeepLink: false,
  };
}
