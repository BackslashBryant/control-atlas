import { createFederalGraphRuntime } from "../../app/runtime.mjs";
import { atlasNeighborhoodShardId } from "../../app/atlas-neighborhood.mjs";
import { RUNTIME_CACHE_VERSION } from "../../shared/runtime-cache-version.mjs";
import type {
  CommonsResourceDataset,
  CommonsSearchIndex,
} from "./commonsTypes";
import type { ViewState } from "./viewState";

const CACHE_VERSION = RUNTIME_CACHE_VERSION;
const artifactCache = new Map<string, Promise<unknown>>();

export type TemplateRegistry = {
  templates?: Array<Record<string, unknown>>;
};

export type OfficialArtifactRegistry = {
  retrieved_on?: string;
  compatibility_levels?: string[];
  artifacts?: Array<Record<string, unknown>>;
};

export type ComplianceWorkflowRegistry = {
  retrieved_on?: string;
  workflows?: Array<Record<string, unknown>>;
};

export type ComplianceToolRegistry = {
  retrieved_on?: string;
  tools?: Array<Record<string, unknown>>;
};

export type FedrampTransitionIndex = {
  retrieved_on?: string;
  source?: Record<string, unknown>;
  interpretation_notice?: string;
  official_links?: Record<string, string>;
  milestones?: Array<Record<string, unknown>>;
  process_statuses?: Array<Record<string, unknown>>;
  current_artifact_rules?: Record<string, string[]>;
  legacy_mappings?: Array<Record<string, unknown>>;
  resolved_rules?: Array<Record<string, unknown>>;
  legacy_assets?: Array<Record<string, unknown>>;
};

export type LibrarySearchArtifact = {
  document_count?: number;
  facets?: {
    objectTypes: string[];
    sourceClasses: string[];
    controlFamilies: string[];
    severities: string[];
  };
  documents: Array<Record<string, unknown>>;
};

export type RuntimeBundle = {
  runtime: ReturnType<typeof createFederalGraphRuntime>;
  templateRegistry: TemplateRegistry;
  catalogSummaries?: Array<Record<string, any>>;
  catalogRecordsReady?: boolean;
  officialArtifactRegistry?: OfficialArtifactRegistry;
  complianceWorkflowRegistry?: ComplianceWorkflowRegistry;
  complianceToolRegistry?: ComplianceToolRegistry;
  fedrampTransitionIndex?: FedrampTransitionIndex;
  commonsSearchIndex?: CommonsSearchIndex;
  commonsDataset?: CommonsResourceDataset;
  mappingSources?: Record<string, Array<{ value: string; label: string }>>;
  routeReady: boolean;
  graphReady: boolean;
};

export type AtlasNeighborhoodNode = {
  id: string;
  node_type?: string;
  label?: string;
  parent_id?: string;
  source_id?: string;
  metadata?: {
    item_id?: string;
    title?: string;
    catalog_id?: string;
    family?: string;
  };
};

export type AtlasNeighborhoodEdge = {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: string;
  relationship_class: "structural" | "applicability" | "correlation";
  provenance_class: string;
  publication_status: string;
  confidence: string;
  evidence_ids?: string[];
  source_refs?: Array<{
    source_id?: string;
    ref_type?: string;
    locator?: string;
  }>;
  rationale?: string;
  navigation_note?: string;
};

export type AtlasNeighborhoodRecord = {
  center_node: AtlasNeighborhoodNode;
  nodes: AtlasNeighborhoodNode[];
  edges: AtlasNeighborhoodEdge[];
  structural_path: Array<{
    id: string;
    label: string;
    node_type: string;
    origin: "structural" | "organizing";
  }>;
  published_connection_count: number;
  candidate_connection_count: number;
};

type AtlasNeighborhoodShardRecord = {
  center_node?: Record<string, unknown>;
  nodes: Array<[string, string, string, string, string, string, string, string]>;
  edges: Array<[
    string,
    string,
    string,
    string,
    "structural" | "applicability" | "correlation",
    string,
    string,
    string,
    Array<[string, string, string]>,
  ]>;
  structural_path: string[];
  published_connection_count: number;
  candidate_connection_count: number;
};

type LibrarySearchBootstrap = {
  librarySearch: LibrarySearchArtifact;
};

export type RuntimeArtifactPlan = {
  catalogBootstrap: boolean;
  catalogId: string;
  commons: boolean;
  fullGraph: boolean;
  librarySearch: boolean;
  recordNodeId: string;
  registries: boolean;
  sources: boolean;
};

export function runtimeArtifactPlan(
  state: ViewState,
  options: {
    graphRequested?: boolean;
    searchOverlayOpen?: boolean;
  } = {},
): RuntimeArtifactPlan {
  const buildDetailRequested =
    state.view === "templates" &&
    (state.buildSection !== "overview" ||
      Boolean(state.task) ||
      Boolean(state.templateType));
  const fullGraph =
    Boolean(options.graphRequested) ||
    // The Atlas landing renders from the compact catalog bootstrap. Load the
    // full graph only after a graph-dependent drilldown is requested. A
    // focused Atlas record still works from one neighborhood shard. Keep this
    // in step with requiresFullGraph in navigationState.ts.
    (state.view === "atlas-map" &&
      !state.node &&
      Boolean(
        state.atlasAxis ||
          state.atlasFramework ||
          state.atlasBaseline ||
          state.atlasFamily ||
          state.atlasRmfStep ||
          state.sourceView === "rmf" ||
          state.sourceView === "rmf-lifecycle" ||
          state.relationshipView === "rmf",
      )) ||
    (state.view === "matrix" &&
      (state.compareRun === "true" ||
        state.crosswalk === "stig-chain" ||
        state.crosswalk === "baseline-compare" ||
        state.crosswalk === "threat-chain")) ||
    (state.view === "templates" && Boolean(state.templateType));
  return {
    catalogBootstrap:
      state.view === "atlas-map" ||
      state.view === "catalog-detail" ||
      state.view === "matrix" ||
      buildDetailRequested,
    catalogId:
      state.view === "catalog-detail" ? state.catalog : "",
    commons:
      state.view === "commons" ||
      state.view === "commons-detail" ||
      state.view === "library-detail" ||
      state.view === "search" ||
      buildDetailRequested ||
      Boolean(options.searchOverlayOpen),
    fullGraph,
    librarySearch:
      state.view === "search" ||
      state.view === "atlas-map" ||
      state.view === "retired" ||
      Boolean(options.searchOverlayOpen),
    recordNodeId:
      state.view === "library-detail" ||
      (state.view === "atlas-map" &&
        Boolean(state.node) &&
        state.node !== "foundation" &&
        state.node !== "landscape" &&
        !state.node.startsWith("hierarchy:"))
        ? state.node
        : "",
    registries:
      state.view === "search" ||
      buildDetailRequested ||
      Boolean(options.searchOverlayOpen),
    sources:
      state.view === "sources" ||
      state.view === "catalog-detail" ||
      state.view === "library-detail" ||
      state.view === "matrix" ||
      state.view === "search" ||
      buildDetailRequested ||
      Boolean(options.searchOverlayOpen),
  };
}

/**
 * Start route-scoped data requests while the React route modules are still
 * downloading. fetchArtifact owns the shared promise cache, so the staged
 * loader consumes these exact requests instead of starting a second fetch.
 */
export async function preloadRuntimeArtifacts(state: ViewState) {
  const plan = runtimeArtifactPlan(state);
  const requests: Array<Promise<unknown>> = [];
  const add = (path: string) => requests.push(fetchArtifact(path));
  const atlasLanding = state.view === "atlas-map" && !state.node && !state.atlasAxis;

  if ((plan.librarySearch && !atlasLanding) || plan.fullGraph) {
    add(artifactPath("library-search.json"));
  }
  if (plan.sources || plan.fullGraph) {
    add(artifactPath("sources.json"));
  }
  if (plan.catalogBootstrap) {
    add(artifactPath("catalog-bootstrap.json"));
  }
  // A catalog route first paints from sources + catalog-bootstrap. Its larger
  // record shard starts after that shell is ready instead of competing with
  // the files needed for orientation.
  if (plan.recordNodeId) {
    requests.push(loadAtlasNeighborhood(plan.recordNodeId));
  }
  if (plan.registries) {
    add("./data/template-registry.json");
    add("./data/official-artifact-registry.json");
    add("./data/compliance-workflows.json");
    add("./data/compliance-tool-registry.json");
    add("./data/fedramp-transition-index.json");
  }
  if (plan.commons && state.view !== "library-detail") {
    add("./data/generated/commons-search-index.json");
    add("./data/commons-resource-dataset.json");
  }
  if (plan.fullGraph) {
    add(artifactPath("nodes.json"));
    add(artifactPath("edges.json"));
    add(artifactPath("evidence.json"));
    add(artifactPath("graph-health.json"));
  }

  await Promise.allSettled(requests);
}

export async function fetchArtifact(path: string) {
  const cached = artifactCache.get(path);
  if (cached) {
    return cached;
  }

  const request = (async () => {
    // Only a rejected compressed fetch used to take the whole artifact down
    // with it: the .then() never ran, so the uncompressed fallback never got
    // its turn. Under load that intermittently left Resources reporting an
    // empty directory. Any failure of the compressed path now falls through.
    try {
      const response = await fetch(compressedArtifactPath(path));
      if (response.ok && typeof DecompressionStream !== "undefined") {
        const ds = new DecompressionStream("gzip");
        const decompressedStream = response.body!.pipeThrough(ds);
        return await new Response(decompressedStream).json();
      }
    } catch {
      // Compressed fetch or decompression failed; use the uncompressed file.
    }
    const fallbackResponse = await fetch(path);
    if (!fallbackResponse.ok) {
      throw new Error(`Unable to load ${path}.`);
    }
    return fallbackResponse.json();
  })();
  artifactCache.set(path, request);

  try {
    return await request;
  } catch (error) {
    artifactCache.delete(path);
    throw error;
  }
}

export function compressedArtifactPath(path: string) {
  const queryIndex = path.indexOf("?");
  if (queryIndex === -1) {
    return `${path}.gz`;
  }
  return `${path.slice(0, queryIndex)}.gz${path.slice(queryIndex)}`;
}

async function fetchCollection(path: string, key: string) {
  const artifact = await fetchArtifact(path);
  if (artifact.schema_version !== "1.0" || !Array.isArray(artifact[key])) {
    throw new Error(`Invalid ${key} graph artifact.`);
  }
  return artifact[key];
}

function artifactPath(name: string) {
  return `./data/generated/${name}?v=${CACHE_VERSION}`;
}

export async function loadAtlasNeighborhood(
  nodeId: string,
): Promise<AtlasNeighborhoodRecord | null> {
  const manifestArtifact = (await fetchArtifact(
    artifactPath("atlas-neighborhood-manifest.json"),
  )) as { atlas_neighborhood_manifest?: { shard_count?: number } };
  const shardCount =
    manifestArtifact.atlas_neighborhood_manifest?.shard_count || 128;
  const shardId = atlasNeighborhoodShardId(nodeId, shardCount);
  const shardArtifact = (await fetchArtifact(
    artifactPath(`atlas-neighborhood/${shardId}.json`),
  )) as {
    atlas_neighborhood_shard?: {
      records?: Record<string, AtlasNeighborhoodShardRecord>;
    };
  };
  const shardRecord =
    shardArtifact.atlas_neighborhood_shard?.records?.[nodeId] || null;
  if (!shardRecord) return null;
  const nodeById = new Map(
    (shardRecord.nodes || []).map(
      ([
        id,
        nodeType,
        itemId,
        title,
        catalogId,
        sourceId,
        family,
        parentId,
      ]) => [
        id,
        {
          id,
          node_type: nodeType,
          source_id: sourceId,
          parent_id: parentId || undefined,
          metadata: {
            item_id: itemId,
            title,
            catalog_id: catalogId,
            family,
          },
        } satisfies AtlasNeighborhoodNode,
      ],
    ),
  );
  const centerNode =
    (shardRecord.center_node as AtlasNeighborhoodNode | undefined) ||
    nodeById.get(nodeId);
  if (!centerNode) return null;
  const counterpartIds = new Set<string>();
  const edges = shardRecord.edges.map((compactEdge) => {
    const [
      id,
      sourceNodeId,
      targetNodeId,
      relationshipType,
      relationshipClass,
      provenanceClass,
      publicationStatus,
      confidence,
      compactSourceRefs,
    ] = compactEdge;
    const edge: AtlasNeighborhoodEdge = {
      id,
      source_node_id: sourceNodeId,
      target_node_id: targetNodeId,
      relationship_type: relationshipType,
      relationship_class: relationshipClass,
      provenance_class: provenanceClass,
      publication_status: publicationStatus,
      confidence,
      source_refs: compactSourceRefs.map(
        ([sourceId, refType, locator]) => ({
          source_id: sourceId,
          ref_type: refType,
          locator,
        }),
      ),
    };
    counterpartIds.add(
      edge.source_node_id === nodeId
        ? edge.target_node_id
        : edge.source_node_id,
    );
    return edge;
  });
  const nodes = [
    centerNode,
    ...[...counterpartIds]
      .flatMap((id) => {
        const node = nodeById.get(id);
        return node ? [node] : [];
      }),
  ];
  return {
    center_node: centerNode,
    nodes,
    edges,
    // Trunk/limb hops in this chain are Control Atlas's own organizing
    // scaffold (applyOrganizingSpine in build-framework-data.mjs), never
    // publisher-declared containment — every other hop (catalog/family/...)
    // is genuine structural parentage. The shard only stores bare ids here,
    // so origin is derived from node_type rather than carried from the
    // build-time ancestor_path (which isn't present on shard nodes).
    structural_path: (shardRecord.structural_path || []).flatMap((id) => {
      const node = nodeById.get(id);
      return node
        ? [{
            id,
            label: node.metadata?.title || id,
            node_type: node.node_type || "",
            origin: (node.node_type === "trunk" || node.node_type === "limb"
              ? "organizing"
              : "structural") as "structural" | "organizing",
          }]
        : [];
    }),
    published_connection_count: shardRecord.published_connection_count,
    candidate_connection_count: shardRecord.candidate_connection_count,
  };
}

async function loadLibrarySearchBootstrap(): Promise<LibrarySearchBootstrap> {
  try {
    const artifact = (await fetchArtifact(
      artifactPath("library-search.json"),
    )) as {
      library_search: LibrarySearchArtifact;
    };
    return { librarySearch: artifact.library_search };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to load the library search artifact: ${message}`, {
      cause: error,
    });
  }
}

function createSearchRuntime(libraryBootstrap: LibrarySearchBootstrap) {
  const runtime = createFederalGraphRuntime({
    sources: [],
    nodes: [],
    edges: [],
    evidence: [],
    findings: [],
    librarySearch: libraryBootstrap.librarySearch,
  });
  return runtime;
}

export async function loadLibrarySearchPhase(): Promise<RuntimeBundle> {
  const [
    libraryBootstrap,
    templateRegistryRaw,
    officialArtifactRegistryRaw,
    complianceWorkflowRegistryRaw,
    complianceToolRegistryRaw,
    fedrampTransitionIndexRaw,
    commonsSearchIndexRaw,
    commonsDatasetRaw,
  ] = await Promise.all([
    loadLibrarySearchBootstrap(),
    fetchArtifact("./data/template-registry.json"),
    fetchArtifact("./data/official-artifact-registry.json"),
    fetchArtifact("./data/compliance-workflows.json"),
    fetchArtifact("./data/compliance-tool-registry.json"),
    fetchArtifact("./data/fedramp-transition-index.json"),
    fetchArtifact("./data/generated/commons-search-index.json").catch(() => null),
    fetchArtifact("./data/commons-resource-dataset.json").catch(() => null),
  ]);
  const templateRegistry = templateRegistryRaw as TemplateRegistry;
  const runtime = createSearchRuntime(libraryBootstrap);

  return {
    runtime,
    templateRegistry,
    officialArtifactRegistry:
      officialArtifactRegistryRaw as OfficialArtifactRegistry,
    complianceWorkflowRegistry:
      complianceWorkflowRegistryRaw as ComplianceWorkflowRegistry,
    complianceToolRegistry: complianceToolRegistryRaw as ComplianceToolRegistry,
    fedrampTransitionIndex:
      fedrampTransitionIndexRaw as FedrampTransitionIndex,
    commonsSearchIndex: (commonsSearchIndexRaw as CommonsSearchIndex) || undefined,
    commonsDataset: (commonsDatasetRaw as CommonsResourceDataset) || undefined,
    routeReady: true,
    graphReady: false,
  };
}

export async function loadFullGraphPhase(
  libraryBootstrap: LibrarySearchBootstrap,
  templateRegistry: TemplateRegistry,
  officialArtifactRegistry: OfficialArtifactRegistry,
  complianceWorkflowRegistry: ComplianceWorkflowRegistry,
  complianceToolRegistry: ComplianceToolRegistry,
  fedrampTransitionIndex: FedrampTransitionIndex,
  commonsSearchIndex?: CommonsSearchIndex,
  commonsDataset?: CommonsResourceDataset,
  catalogSummaries: Array<Record<string, any>> = [],
  mappingSources: Record<string, Array<{ value: string; label: string }>> = {},
): Promise<RuntimeBundle> {
  const [sources, nodes, edges, evidence, findings] = await Promise.all([
    fetchCollection(artifactPath("sources.json"), "sources"),
    fetchCollection(artifactPath("nodes.json"), "nodes"),
    fetchCollection(artifactPath("edges.json"), "edges"),
    fetchCollection(artifactPath("evidence.json"), "evidence"),
    fetchCollection(artifactPath("graph-health.json"), "findings"),
  ]);

  const runtime = createFederalGraphRuntime({
    sources,
    nodes,
    edges,
    evidence,
    findings,
    librarySearch: libraryBootstrap.librarySearch,
  });

  return {
    runtime,
    templateRegistry,
    officialArtifactRegistry,
    complianceWorkflowRegistry,
    complianceToolRegistry,
    fedrampTransitionIndex,
    commonsSearchIndex,
    commonsDataset,
    catalogSummaries,
    mappingSources,
    routeReady: true,
    graphReady: true,
  };
}

export async function loadRuntimeDataset(): Promise<RuntimeBundle> {
  const [
    libraryBootstrap,
    templateRegistryRaw,
    officialArtifactRegistryRaw,
    complianceWorkflowRegistryRaw,
    complianceToolRegistryRaw,
    fedrampTransitionIndexRaw,
    commonsSearchIndexRaw,
    commonsDatasetRaw,
  ] = await Promise.all([
    loadLibrarySearchBootstrap(),
    fetchArtifact("./data/template-registry.json"),
    fetchArtifact("./data/official-artifact-registry.json"),
    fetchArtifact("./data/compliance-workflows.json"),
    fetchArtifact("./data/compliance-tool-registry.json"),
    fetchArtifact("./data/fedramp-transition-index.json"),
    fetchArtifact("./data/generated/commons-search-index.json").catch(() => null),
    fetchArtifact("./data/commons-resource-dataset.json").catch(() => null),
  ]);

  return loadFullGraphPhase(
    libraryBootstrap,
    templateRegistryRaw as TemplateRegistry,
    officialArtifactRegistryRaw as OfficialArtifactRegistry,
    complianceWorkflowRegistryRaw as ComplianceWorkflowRegistry,
    complianceToolRegistryRaw as ComplianceToolRegistry,
    fedrampTransitionIndexRaw as FedrampTransitionIndex,
    (commonsSearchIndexRaw as CommonsSearchIndex) || undefined,
    (commonsDatasetRaw as CommonsResourceDataset) || undefined,
  );
}

type CatalogBootstrap = {
  catalogs?: Array<Record<string, unknown>>;
  mapping_sources?: Record<
    string,
    Array<{ value: string; label: string }>
  >;
};

function emptyLibraryBootstrap(): LibrarySearchBootstrap {
  return {
    librarySearch: {
      document_count: 0,
      documents: [],
    },
  };
}

function libraryFromNodes(nodes: Array<Record<string, any>>): LibrarySearchArtifact {
  return {
    document_count: nodes.length,
    documents: nodes.map((node) => ({
      id: node.id,
      item_id: node.metadata?.item_id || node.id,
      title: node.metadata?.title || node.label || node.id,
      description: node.metadata?.description || "",
      description_available: Boolean(node.metadata?.description),
      object_type: node.node_type || "",
      source_id: node.source_id || "",
      catalog_id: node.metadata?.catalog_id || "",
      control_family: node.metadata?.family || "",
      severity: node.metadata?.severity || "",
    })),
  };
}

async function loadRouteScopedPhase(
  plan: RuntimeArtifactPlan,
): Promise<{
  bundle: RuntimeBundle;
  libraryBootstrap: LibrarySearchBootstrap;
  templateRegistry: TemplateRegistry;
  officialArtifactRegistry: OfficialArtifactRegistry;
  complianceWorkflowRegistry: ComplianceWorkflowRegistry;
  complianceToolRegistry: ComplianceToolRegistry;
  fedrampTransitionIndex: FedrampTransitionIndex;
}> {
  const [
    libraryBootstrap,
    sourcesArtifact,
    catalogArtifact,
    catalogRecordsArtifact,
    record,
    templateRegistryRaw,
    officialArtifactRegistryRaw,
    complianceWorkflowRegistryRaw,
    complianceToolRegistryRaw,
    fedrampTransitionIndexRaw,
    commonsSearchIndexRaw,
    commonsDatasetRaw,
  ] = await Promise.all([
    plan.librarySearch
      ? loadLibrarySearchBootstrap()
      : Promise.resolve(emptyLibraryBootstrap()),
    plan.sources || plan.fullGraph
      ? fetchArtifact(artifactPath("sources.json"))
      : Promise.resolve(null),
    plan.catalogBootstrap
      ? fetchArtifact(artifactPath("catalog-bootstrap.json"))
      : Promise.resolve(null),
    plan.catalogId
      ? fetchArtifact(
          artifactPath(`catalog-records/${encodeURIComponent(plan.catalogId)}.json`),
        )
      : Promise.resolve(null),
    plan.recordNodeId
      ? loadAtlasNeighborhood(plan.recordNodeId)
      : Promise.resolve(null),
    plan.registries
      ? fetchArtifact("./data/template-registry.json")
      : Promise.resolve({ templates: [] }),
    plan.registries
      ? fetchArtifact("./data/official-artifact-registry.json")
      : Promise.resolve({ artifacts: [] }),
    plan.registries
      ? fetchArtifact("./data/compliance-workflows.json")
      : Promise.resolve({ workflows: [] }),
    plan.registries
      ? fetchArtifact("./data/compliance-tool-registry.json")
      : Promise.resolve({ tools: [] }),
    plan.registries
      ? fetchArtifact("./data/fedramp-transition-index.json")
      : Promise.resolve({}),
    plan.commons
      ? fetchArtifact("./data/generated/commons-search-index.json").catch(
          () => null,
        )
      : Promise.resolve(null),
    plan.commons
      ? fetchArtifact("./data/commons-resource-dataset.json").catch(() => null)
      : Promise.resolve(null),
  ]);

  const sources =
    (sourcesArtifact as { sources?: Array<Record<string, unknown>> } | null)
      ?.sources || [];
  const catalogBootstrap =
    (
      catalogArtifact as
        | { catalog_bootstrap?: CatalogBootstrap }
        | null
    )?.catalog_bootstrap || {};
  const catalogNodes =
    (
      catalogRecordsArtifact as
        | { catalog_records?: { nodes?: Array<Record<string, any>> } }
        | null
    )?.catalog_records?.nodes || [];
  const recordNodes = record?.nodes || [];
  const nodes = catalogNodes.length
    ? catalogNodes
    : recordNodes;
  const edges = record?.edges || [];
  const effectiveLibrary =
    plan.librarySearch || !nodes.length
      ? libraryBootstrap
      : { librarySearch: libraryFromNodes(nodes) };
  const runtime = createFederalGraphRuntime({
    sources,
    nodes,
    edges,
    evidence: [],
    findings: [],
    catalogs: catalogBootstrap.catalogs || [],
    librarySearch: effectiveLibrary.librarySearch,
  });
  const templateRegistry = templateRegistryRaw as TemplateRegistry;
  const officialArtifactRegistry =
    officialArtifactRegistryRaw as OfficialArtifactRegistry;
  const complianceWorkflowRegistry =
    complianceWorkflowRegistryRaw as ComplianceWorkflowRegistry;
  const complianceToolRegistry =
    complianceToolRegistryRaw as ComplianceToolRegistry;
  const fedrampTransitionIndex =
    fedrampTransitionIndexRaw as FedrampTransitionIndex;

  return {
    bundle: {
      runtime,
      templateRegistry,
      officialArtifactRegistry,
      complianceWorkflowRegistry,
      complianceToolRegistry,
      fedrampTransitionIndex,
      commonsSearchIndex:
        (commonsSearchIndexRaw as CommonsSearchIndex) || undefined,
      commonsDataset:
        (commonsDatasetRaw as CommonsResourceDataset) || undefined,
      mappingSources: catalogBootstrap.mapping_sources || {},
      catalogSummaries: catalogBootstrap.catalogs || [],
      catalogRecordsReady: plan.catalogId ? true : undefined,
      routeReady: true,
      graphReady: false,
    },
    libraryBootstrap: effectiveLibrary,
    templateRegistry,
    officialArtifactRegistry,
    complianceWorkflowRegistry,
    complianceToolRegistry,
    fedrampTransitionIndex,
  };
}

async function loadCatalogShellPhase(
  plan: RuntimeArtifactPlan,
): Promise<RuntimeBundle> {
  const [sourcesArtifact, catalogArtifact] = await Promise.all([
    fetchArtifact(artifactPath("sources.json")),
    fetchArtifact(artifactPath("catalog-bootstrap.json")),
  ]);
  const sources =
    (sourcesArtifact as { sources?: Array<Record<string, unknown>> }).sources ||
    [];
  const catalogBootstrap =
    (
      catalogArtifact as {
        catalog_bootstrap?: CatalogBootstrap;
      }
    ).catalog_bootstrap || {};

  return {
    runtime: createFederalGraphRuntime({
      sources,
      nodes: [],
      edges: [],
      evidence: [],
    }),
    templateRegistry: { templates: [] },
    mappingSources: catalogBootstrap.mapping_sources || {},
    catalogSummaries: catalogBootstrap.catalogs || [],
    catalogRecordsReady: false,
    routeReady: true,
    graphReady: false,
  };
}

export async function loadRuntimeDatasetStaged(handlers: {
  onSearchReady: (bundle: RuntimeBundle) => void;
  onFullReady: (bundle: RuntimeBundle) => void;
  onError: (error: unknown) => void;
  state: ViewState;
  graphRequested?: boolean;
  searchOverlayOpen?: boolean;
}) {
  try {
    const plan = runtimeArtifactPlan(handlers.state, {
      graphRequested: handlers.graphRequested,
      searchOverlayOpen: handlers.searchOverlayOpen,
    });
    if (plan.catalogId) {
      handlers.onSearchReady(await loadCatalogShellPhase(plan));
      const catalogPhase = await loadRouteScopedPhase(plan);
      handlers.onFullReady(catalogPhase.bundle);
      return;
    }
    if (
      handlers.state.view === "atlas-map" &&
      !handlers.state.node &&
      !handlers.state.atlasAxis &&
      !plan.fullGraph
    ) {
      const orientationPhase = await loadRouteScopedPhase({
        ...plan,
        librarySearch: false,
      });
      handlers.onSearchReady(orientationPhase.bundle);
      const searchPhase = await loadRouteScopedPhase(plan);
      handlers.onFullReady(searchPhase.bundle);
      return;
    }
    if (handlers.state.view === "library-detail" && plan.commons) {
      const officialPhase = await loadRouteScopedPhase({
        ...plan,
        commons: false,
      });
      handlers.onSearchReady(officialPhase.bundle);
      const contextualPhase = await loadRouteScopedPhase(plan);
      handlers.onFullReady(contextualPhase.bundle);
      return;
    }
    const routePhase = await loadRouteScopedPhase(plan);
    handlers.onSearchReady(routePhase.bundle);
    if (!plan.fullGraph) {
      return;
    }
    const libraryBootstrap = plan.librarySearch
      ? routePhase.libraryBootstrap
      : await loadLibrarySearchBootstrap();
    const fullBundle = await loadFullGraphPhase(
      libraryBootstrap,
      routePhase.templateRegistry,
      routePhase.officialArtifactRegistry,
      routePhase.complianceWorkflowRegistry,
      routePhase.complianceToolRegistry,
      routePhase.fedrampTransitionIndex,
      routePhase.bundle.commonsSearchIndex,
      routePhase.bundle.commonsDataset,
      routePhase.bundle.catalogSummaries || [],
      routePhase.bundle.mappingSources || {},
    );
    handlers.onFullReady(fullBundle);
  } catch (error) {
    handlers.onError(error);
  }
}
