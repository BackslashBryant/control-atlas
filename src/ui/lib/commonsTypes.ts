export type CommonsResourceLane =
  | "official"
  | "open_source"
  | "practitioner"
  | "commercial"
  | "legacy";

export type CommonsAccessType =
  | "public"
  | "free_account"
  | "membership"
  | "customer_only"
  | "cac_or_piv"
  | "paid"
  | "restricted"
  | "unknown";

export type CommonsCollection = {
  id: string;
  title: string;
  summary: string;
  whyCurated: string;
  icon: string;
  resourceIds: string[];
  libraryLinks?: Array<{ label: string; query: string; reason: string }>;
};

export type CommonsMaintenanceStatus =
  | "active"
  | "maintained"
  | "slow"
  | "inactive"
  | "archived"
  | "deprecated"
  | "superseded"
  | "unknown";

export type CommonsPopularitySignals = {
  stars?: number;
  forks?: number;
  subscribers?: number;
  citations?: number;
};

export type CommonsEvidenceSection = {
  status: "documented" | "not_documented" | "not_applicable";
  text: string;
  sourceUrl: string;
  values?: string[];
};

export type CommonsReleaseEvidence = {
  status: "published" | "not_published" | "not_documented";
  version: string | null;
  name: string | null;
  url: string;
  publishedAt: string | null;
  prerelease: boolean;
};

export type CommonsResource = {
  id: string;
  name: string;
  shortName: string;
  cardPurpose: string;
  slug: string;
  summary: string;
  whyIncluded: string;
  canonicalUrl: string;
  alternateUrls?: string[];
  publisher: string;
  maintainer?: string | null;
  publisherType?: string;
  resourceLane: CommonsResourceLane;
  resourceType: string;
  frameworks: string[];
  programs?: string[];
  controlFamilies?: string[];
  lifecycleStages: string[];
  audiences: string[];
  artifactTypes: string[];
  technologyScopes?: string[];
  platforms?: string[];
  jurisdictions?: string[];
  governmentBranches?: string[];
  formats?: string[];
  accessType: CommonsAccessType;
  costType?: string;
  accountRequired?: boolean;
  authenticationRequired?: boolean;
  publicAccessNotes?: string | null;
  openSource?: boolean;
  repositoryUrl?: string | null;
  license?: string | null;
  licenseUrl?: string | null;
  redistributionPolicy?: string | null;
  officialStatus?: string | null;
  maturity?: string | null;
  maintenanceStatus: CommonsMaintenanceStatus;
  currentVersion?: string | null;
  publisherUpdatedAt?: string | null;
  lastReleaseAt?: string | null;
  lastCommitAt?: string | null;
  lastCheckedAt: string;
  lastChangedAt?: string | null;
  nextCheckAt?: string | null;
  updateMethod?: string | null;
  updateCadence?: string | null;
  freshnessStatus?: string | null;
  supersedes?: string | null;
  supersededBy?: string | null;
  legacyReason?: string | null;
  officialCounterparts?: string[];
  companionResources?: string[];
  communityLinks?: string[];
  trainingLinks?: string[];
  downloadLinks?: string[];
  apiLinks?: string[];
  feedLinks?: string[];
  popularitySignals?: CommonsPopularitySignals;
  editorialNotes?: string | null;
  warnings?: string[];
  searchAliases?: string[];
  searchKeywords?: string[];
  featuredCollections?: string[];
  parentEcosystemId?: string | null;
  childResourceIds?: string[];
  brandKey?: string;
  sourceEvidence?: string | null;
  verificationMethod?: "public_url" | "official_repository" | "manual_restricted";
  overview?: {
    text: string;
    sourceUrl: string;
    sourceType: "repository_readme" | "publisher_source";
    exactPublisherText: boolean;
  };
  compatibility?: {
    status: "documented" | "not_stated" | "not_applicable";
    operatingSystems: string[];
    environments: string[];
    sourceUrl: string;
    note: string;
  };
  media?: {
    status: "available" | "not_available";
    sourceUrl: string;
    reason?: string;
    items: Array<{
      kind: "publisher_screenshot";
      url: string;
      alt: string;
      sourceUrl: string;
      sha256: string;
      byteLength: number;
      contentType: string;
      width: number;
      height: number;
      license: string;
      licenseBasis: "repository_license" | "publisher_media_license";
      retrievedAt: string;
      commitSha: string;
    }>;
  };
  presentationProfile?: {
    profileType: string;
    template: "tool" | "reference" | "training" | "directory" | "community" | "data" | "ecosystem" | "destination" | "artifact";
    whatItDoes: CommonsEvidenceSection;
    whoItIsFor?: CommonsEvidenceSection;
    limitations?: CommonsEvidenceSection;
  };
  toolProfile?: {
    inputs?: CommonsEvidenceSection;
    outputs?: CommonsEvidenceSection;
    formats?: CommonsEvidenceSection;
    integrations?: CommonsEvidenceSection;
    installation?: CommonsEvidenceSection;
    usage?: CommonsEvidenceSection;
    license?: CommonsEvidenceSection;
    maintenance?: { status: string; text: string; sourceUrl: string };
    release?: CommonsReleaseEvidence;
  };
  repositoryEvidence?: {
    capturedAt: string;
    repositoryScope: "repository" | "organization_profile";
    repositoryApiUrl: string;
    commitSha: string;
    commitUrl: string;
    readmePath: string;
    readmeUrl: string;
    readmeSha256: string;
    readmeByteLength: number;
    release: CommonsReleaseEvidence;
  } | null;
  automatedFields?: string[];
  manualFields?: string[];
  entityKind: "resource";
  profileId: string;
  origin: "publisher_exact" | "publisher_normalized" | "publisher_derived" | "atlas_editorial" | "atlas_inferred";
  sourceRefs: string[];
  lifecycle: { status: string; evidenceRefs: string[]; replacedBy?: string[] };
  claimEvidence: Array<{
    fieldPath: string;
    origin: "publisher_exact" | "publisher_normalized" | "publisher_derived" | "atlas_editorial" | "atlas_inferred";
    evidenceRefs: string[];
    transformation?: string;
    reviewStatus: "reviewed" | "pending" | "rejected";
  }>;
};

export type CommonsResourceDataset = {
  schemaVersion: string;
  lastUpdated: string;
  collections: CommonsCollection[];
  resources: CommonsResource[];
};

export type CommonsSearchIndexDoc = {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  summary: string;
  whyIncluded: string;
  canonicalUrl: string;
  publisher: string;
  resourceLane: CommonsResourceLane;
  resourceType: string;
  frameworks: string[];
  programs: string[];
  lifecycleStages: string[];
  audiences: string[];
  artifactTypes: string[];
  accessType: CommonsAccessType;
  costType?: string;
  maintenanceStatus: CommonsMaintenanceStatus;
  openSource: boolean;
  popularitySignals: CommonsPopularitySignals;
  companionResources: string[];
  featuredCollections: string[];
  searchableText: string;
};

export type CommonsSearchIndex = {
  builtAt: string;
  totalCount: number;
  collections: CommonsCollection[];
  documents: CommonsSearchIndexDoc[];
};
