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
  costType: string;
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
  automatedFields?: string[];
  manualFields?: string[];
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
  costType: string;
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
