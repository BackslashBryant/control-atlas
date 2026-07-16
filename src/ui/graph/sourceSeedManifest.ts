import { sourceDispositionReason } from "./sourceDisposition.ts";
import { sourceLinkFor } from "./sourceLinks.ts";
import type {
  SourceHierarchyTier,
  SourceManifestRecord,
  SourceMapDisposition,
} from "./sourceManifest.ts";
import { defaultSourceViewMemberships } from "./sourceViews.ts";

type SeedDefinition = {
  sourceId: string;
  publisher: string;
  hierarchyTier: SourceHierarchyTier;
  subcategory: string;
  disposition: SourceMapDisposition;
  sourceBasis?: SourceManifestRecord["sourceBasis"];
  isAuthoritative?: boolean;
  isActive?: boolean;
};

function manifestRecord(definition: SeedDefinition): SourceManifestRecord {
  const link = sourceLinkFor(definition.sourceId);
  const viewMemberships = defaultSourceViewMemberships(definition.hierarchyTier);
  const source: SourceManifestRecord = {
    sourceId: definition.sourceId,
    displayName: link.displayName,
    artifactName: link.displayName,
    publisher: definition.publisher,
    hierarchyTier: definition.hierarchyTier,
    noviceQuestions: viewMemberships.noviceQuestions,
    rmfLifecycle: viewMemberships.rmfLifecycle,
    subcategory: definition.subcategory,
    disposition: definition.disposition,
    canonicalUrl: link.canonicalUrl,
    dataUrl: link.dataUrl,
    repoUrl: link.repoUrl,
    isAuthoritative: definition.isAuthoritative ?? true,
    isActive: definition.isActive ?? true,
    isDefaultMapEligible:
      definition.disposition === "default-map" ||
      definition.disposition === "add-to-default-map",
    sourceBasis: definition.sourceBasis ?? "official",
    defaultMapReason: "",
  };
  source.defaultMapReason = sourceDispositionReason(source);
  return source;
}

const AUTHORITY: SeedDefinition[] = [
  ["fisma-44-usc-3551", "U.S. Congress", "Statutory / Regulatory Authority", "add-to-default-map"],
  ["omb-a-130", "OMB", "Federal Policy Authority", "add-to-default-map"],
  ["cui-32-cfr-2002", "National Archives and Records Administration", "Statutory / Regulatory Authority", "default-map"],
  ["fips-199", "NIST", "Federal Policy Authority", "default-map"],
  ["fips-200", "NIST", "Federal Policy Authority", "default-map"],
  ["cnssi-1253", "CNSS", "NSS Authority", "add-to-default-map"],
  ["dodi-8500-01", "Department of Defense", "DoD Policy Authority", "add-to-default-map"],
  ["dodi-8510-01", "Department of Defense", "DoD Policy Authority", "add-to-default-map"],
  ["dodi-8530-01", "Department of Defense", "DoD Policy Authority", "add-to-default-map"],
  ["far-52-204-21", "Federal Acquisition Regulation", "Contractual Authority", "add-to-default-map"],
  ["dfars-252-204-7012", "Department of Defense", "Contractual Authority", "add-to-default-map"],
  ["dfars-252-204-7021", "Department of Defense", "Contractual Authority", "add-to-default-map"],
].map(([sourceId, publisher, subcategory, disposition]) => ({
  sourceId,
  publisher,
  hierarchyTier: "authority",
  subcategory,
  disposition: disposition as SourceMapDisposition,
}));

const GOVERNANCE: SeedDefinition[] = [
  ["nist-sp-800-37-r2", "NIST", "Federal risk governance", "default-map"],
  ["nist-csf-2-0", "NIST", "Federal risk governance", "add-to-default-map"],
  ["nist-ai-rmf", "NIST", "AI / emerging technology governance", "default-map"],
  ["nist-ai-rmf-playbook", "NIST", "AI / emerging technology governance", "default-map"],
  ["dod-rai-toolkit", "Department of Defense", "AI / emerging technology governance", "default-map"],
  ["dod-zero-trust-strategy", "DoD CIO", "Zero Trust governance", "default-map"],
  ["dod-zero-trust-ra-v2", "DoD CIO", "Zero Trust governance", "default-map"],
].map(([sourceId, publisher, subcategory, disposition]) => ({
  sourceId,
  publisher,
  hierarchyTier: "governance-risk-framework",
  subcategory,
  disposition: disposition as SourceMapDisposition,
}));

const CONTROL_CATALOGS: SeedDefinition[] = [
  ["nist-sp-800-53-r5", "NIST", "Federal control catalog", "default-map"],
  ["nist-sp-800-53-oscal", "NIST", "Federal control catalog", "default-map"],
  ["nist-sp-800-171-r2", "NIST", "CUI security requirements", "default-map"],
  ["nist-sp-800-171-r3", "NIST", "CUI security requirements", "add-to-default-map"],
  ["nist-sp-800-172-r3", "NIST", "Enhanced CUI requirements", "default-map"],
  ["nist-ssdf-sp-800-218", "NIST", "Secure development requirements", "default-map"],
].map(([sourceId, publisher, subcategory, disposition]) => ({
  sourceId,
  publisher,
  hierarchyTier: "control-catalog-requirement-set",
  subcategory,
  disposition: disposition as SourceMapDisposition,
}));

const BASELINES: SeedDefinition[] = [
  ["nist-sp-800-53b", "NIST", "Federal baseline", "default-map"],
  ["fedramp-rev5-baselines", "FedRAMP", "Federal program baseline", "default-map"],
  ["cmmc-2-0", "Department of Defense", "Contractor program profile", "default-map"],
  ["cmmc-32-cfr-170", "Department of Defense", "Contractor program profile", "add-to-default-map"],
  ["dod-zero-trust-overlays", "DoD CIO", "DoD overlay", "default-map"],
  ["dod-zero-trust-capabilities-activities", "DoD CIO", "DoD overlay / capability model", "default-map"],
  ["dod-zero-trust-roadmap", "DoD CIO", "DoD roadmap / maturity overlay", "default-map"],
].map(([sourceId, publisher, subcategory, disposition]) => ({
  sourceId,
  publisher,
  hierarchyTier: "baseline-overlay-program-profile",
  subcategory,
  disposition: disposition as SourceMapDisposition,
}));

const ASSESSMENTS: SeedDefinition[] = [
  ["nist-sp-800-53a-r5", "NIST", "Control assessment procedure", "default-map"],
  ["nist-sp-800-171a-r3", "NIST", "CUI assessment procedure", "add-to-default-map"],
  ["nist-sp-800-172a-r3", "NIST", "Enhanced CUI assessment procedure", "add-to-default-map"],
  ["cmmc-assessment-guides", "Department of Defense", "CMMC assessment procedure", "add-to-default-map"],
  ["cmmc-scoping-guides", "Department of Defense", "CMMC scoping procedure", "add-to-default-map"],
  ["fedramp-assessment-artifacts", "FedRAMP", "FedRAMP assessment artifacts", "add-to-default-map"],
].map(([sourceId, publisher, subcategory, disposition]) => ({
  sourceId,
  publisher,
  hierarchyTier: "assessment-scoping-procedure",
  subcategory,
  disposition: disposition as SourceMapDisposition,
}));

const IMPLEMENTATION: SeedDefinition[] = [
  ["disa-srg-library", "DISA", "Security requirements guide", "default-map"],
  ["disa-stig-library", "DISA", "Product hardening guide", "default-map"],
  ["disa-stig-srg-cci-references", "DISA", "Technical check/fix content", "default-map"],
  ["disa-stig-compilations", "DISA", "Landing page", "registry-only"],
  ["disa-stig-downloads", "DISA", "Landing page", "registry-only"],
  ["disa-stig-gpo", "DISA", "Implementation artifact landing page", "registry-only"],
].map(([sourceId, publisher, subcategory, disposition]) => ({
  sourceId,
  publisher,
  hierarchyTier: "implementation-configuration-standard",
  subcategory,
  disposition: disposition as SourceMapDisposition,
}));

const MAPPINGS: SeedDefinition[] = [
  ["disa-cci-list", "DISA", "Control mapping", "default-map", "official"],
  ["disa-cci-to-nist-800-53", "DISA", "STIG/SRG-to-control mapping", "default-map", "official"],
  ["nist-800-53-csf-mapping", "NIST", "Framework crosswalk", "default-map", "official"],
  ["nist-csf-1-1-to-2-0-olir", "NIST", "Framework crosswalk", "default-map", "official"],
  ["nist-800-171-r3-control-references", "NIST", "Control mapping", "default-map", "official"],
  ["olir-csf-2-to-800-53-r5-2", "NIST", "Draft framework crosswalk", "draft-gated", "source-backed"],
  ["olir-csf-2-to-800-171-r3", "NIST", "Draft framework crosswalk", "draft-gated", "source-backed"],
  ["nist-informative-references", "NIST", "Draft/legacy reference mapping", "registry-only", "deprecated"],
  ["mitre-cis-cci-mappings", "MITRE", "Supporting mapping", "supporting-reference-only", "source-backed"],
  ["community-cci-research", "Community", "Community/draft mapping", "registry-only", "inferred"],
].map(([sourceId, publisher, subcategory, disposition, sourceBasis]) => ({
  sourceId,
  publisher,
  hierarchyTier: "control-mapping-crosswalk" as const,
  subcategory,
  disposition: disposition as SourceMapDisposition,
  sourceBasis: sourceBasis as SourceManifestRecord["sourceBasis"],
  isAuthoritative: sourceBasis === "official",
}));

const THREAT_DEFENSE: SeedDefinition[] = [
  ["mitre-attack-enterprise", "MITRE", "Adversary behavior", "default-map"],
  ["mitre-attack-ics", "MITRE", "ICS adversary behavior", "default-map"],
  ["mitre-attack-stix-data", "MITRE", "Adversary behavior data", "default-map"],
  ["mitre-d3fend", "MITRE", "Defensive technique model", "default-map"],
  ["mitre-d3fend-resources", "MITRE", "Threat-to-defense mapping", "default-map"],
  ["mitre-d3fend-github", "MITRE", "Defensive technique model repository", "default-map"],
].map(([sourceId, publisher, subcategory, disposition]) => ({
  sourceId,
  publisher,
  hierarchyTier: "threat-defensive-mapping",
  subcategory,
  disposition: disposition as SourceMapDisposition,
}));

const SUPPORTING: SeedDefinition[] = [
  ["nara-cui-registry", "National Archives and Records Administration", "CUI reference / authority support", "default-map", true],
  ["stig-viewer-public-catalog", "DISA", "Tooling reference", "supporting-reference-only", false],
  ["stig-viewer-clkb-api-announcement", "DISA", "Announcement / tooling context", "registry-only", false],
  ["nuwcdivnpt-github", "NUWCDIVNPT", "Tooling organization page", "registry-only", false],
  ["nuwcdivnpt-stig-manager", "NUWCDIVNPT", "Tooling reference", "supporting-reference-only", false],
].map(([sourceId, publisher, subcategory, disposition, isAuthoritative]) => ({
  sourceId: String(sourceId),
  publisher: String(publisher),
  hierarchyTier: "supporting-reference" as const,
  subcategory: String(subcategory),
  disposition: disposition as SourceMapDisposition,
  isAuthoritative: Boolean(isAuthoritative),
  sourceBasis: isAuthoritative ? ("official" as const) : ("source-backed" as const),
}));

export const SOURCE_SEED_MANIFEST: SourceManifestRecord[] = [
  ...AUTHORITY,
  ...GOVERNANCE,
  ...CONTROL_CATALOGS,
  ...BASELINES,
  ...ASSESSMENTS,
  ...IMPLEMENTATION,
  ...MAPPINGS,
  ...THREAT_DEFENSE,
  ...SUPPORTING,
].map(manifestRecord);
