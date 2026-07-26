import { createFederalGraphRuntime } from "../../app/runtime.mjs";
import { atlasNeighborhoodShardId } from "../../app/atlas-neighborhood.mjs";
import type {
  CommonsResourceDataset,
  CommonsSearchIndex,
} from "./commonsTypes";

const CACHE_VERSION = "20260716-2";
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

export type LibrarySearchShard = {
  catalog_id: string;
  document_count?: number;
  documents: Array<Record<string, unknown>>;
  serialized_index: string;
};

export type RuntimeBundle = {
  runtime: ReturnType<typeof createFederalGraphRuntime>;
  templateRegistry: TemplateRegistry;
  officialArtifactRegistry?: OfficialArtifactRegistry;
  complianceWorkflowRegistry?: ComplianceWorkflowRegistry;
  complianceToolRegistry?: ComplianceToolRegistry;
  fedrampTransitionIndex?: FedrampTransitionIndex;
  commonsSearchIndex?: CommonsSearchIndex;
  commonsDataset?: CommonsResourceDataset;
  graphReady: boolean;
  librarySearchRevision?: number;
  /** Jump a lazily-queued library-search shard ahead of the idle queue. No-op
   * if the catalog is already loaded, in flight, or was never queued. */
  prioritizeLibraryShard?: (catalogId: string) => void;
};

export type AtlasNeighborhoodNode = {
  id: string;
  node_type?: string;
  label?: string;
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
  plain_language_rationale?: string;
};

export type AtlasNeighborhoodRecord = {
  center_node: AtlasNeighborhoodNode;
  nodes: AtlasNeighborhoodNode[];
  edges: AtlasNeighborhoodEdge[];
  published_connection_count: number;
  candidate_connection_count: number;
};

type AtlasNeighborhoodShardRecord = {
  edges: Array<[
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    Array<[string, string, string]>,
  ]>;
  published_connection_count: number;
  candidate_connection_count: number;
};

type LibrarySearchBootstrap = {
  librarySearch: {
    documents: Array<Record<string, unknown>>;
    serialized_index: string;
  };
  librarySearchShards: LibrarySearchShard[];
  lazyShardIds: string[];
};

export async function fetchArtifact(path: string) {
  const cached = artifactCache.get(path);
  if (cached) {
    return cached;
  }

  const request = fetch(path + ".gz").then(async (response) => {
    if (response.ok && typeof DecompressionStream !== "undefined") {
      try {
        const ds = new DecompressionStream("gzip");
        const decompressedStream = response.body!.pipeThrough(ds);
        return await new Response(decompressedStream).json();
      } catch {
        // Decompression failed; fall through to uncompressed fetch
      }
    }
    // Fallback to uncompressed
    const fallbackResponse = await fetch(path);
    if (!fallbackResponse.ok) {
      throw new Error(`Unable to load ${path}.`);
    }
    return fallbackResponse.json();
  });
  artifactCache.set(path, request);

  try {
    return await request;
  } catch (error) {
    artifactCache.delete(path);
    throw error;
  }
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

const RELATIONSHIP_GUIDANCE: Record<string, string> = {
  maps_to:
    "Compare the two records; this mapping does not transfer compliance by itself.",
  supports: "Use this as supporting context, not proof that the requirement is met.",
  implements: "This describes one way to put the selected requirement into practice.",
  includes: "The selected record contains or selects this item.",
  assesses: "Use this procedure to examine the selected requirement.",
  overlaps: "The records cover some of the same ground but are not interchangeable.",
  references: "The selected record points to this item for additional context.",
  derived_from: "This item was derived from the selected source record.",
  supersedes: "This item replaces an earlier record; confirm the effective version.",
  mitigates: "This item can reduce the threat or weakness described by the selected record.",
  protects: "This item identifies protection related to the selected record.",
  related_to: "The source records a relationship without claiming equivalence.",
};

function atlasRelationshipGuidance(
  relationshipType: string,
  publicationStatus: string,
) {
  const guidance =
    RELATIONSHIP_GUIDANCE[relationshipType] ||
    "Use the source reference to understand how these records are connected.";
  return publicationStatus === "published"
    ? guidance
    : `Candidate only: ${guidance.charAt(0).toLowerCase()}${guidance.slice(1)}`;
}

export async function loadAtlasNeighborhood(
  nodeId: string,
): Promise<AtlasNeighborhoodRecord | null> {
  const [manifestArtifact, nodeIndexArtifact] = await Promise.all([
    fetchArtifact(artifactPath("atlas-neighborhood-manifest.json")),
    fetchArtifact(artifactPath("atlas-node-index.json")),
  ]) as [
    { atlas_neighborhood_manifest?: { shard_count?: number } },
    { atlas_nodes?: Array<[string, string, string, string, string]> },
  ];
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
    (nodeIndexArtifact.atlas_nodes || []).map(
      ([id, nodeType, itemId, title, catalogId]) => [
        id,
        {
          id,
          node_type: nodeType,
          metadata: {
            item_id: itemId,
            title,
            catalog_id: catalogId,
          },
        } satisfies AtlasNeighborhoodNode,
      ],
    ),
  );
  const centerNode = nodeById.get(nodeId);
  if (!centerNode) return null;
  const counterpartIds = new Set<string>();
  const edges = shardRecord.edges.map((compactEdge) => {
    const [
      id,
      sourceNodeId,
      targetNodeId,
      relationshipType,
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
    return {
      ...edge,
      plain_language_rationale: atlasRelationshipGuidance(
        relationshipType,
        publicationStatus,
      ),
    };
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
    published_connection_count: shardRecord.published_connection_count,
    candidate_connection_count: shardRecord.candidate_connection_count,
  };
}

function mergeLibraryShards(shards: LibrarySearchShard[]) {
  const documents = shards.flatMap((shard) => shard.documents);
  return {
    documents,
    serialized_index: shards[0]?.serialized_index || "",
  };
}

function scheduleLazyLibraryShards(
  runtime: ReturnType<typeof createFederalGraphRuntime>,
  lazyShardIds: string[],
  onShardLoaded?: () => void,
): (catalogId: string) => void {
  const noopPrioritize = () => {};
  if (lazyShardIds.length === 0) {
    return noopPrioritize;
  }

  const scheduler =
    typeof window !== "undefined" && "requestIdleCallback" in window
      ? window.requestIdleCallback.bind(window)
      : (callback: () => void) => window.setTimeout(callback, 100);

  const pending = [...lazyShardIds];
  const ingestShard = (catalogId: string) =>
    fetchArtifact(artifactPath(`library-search/${catalogId}.json`))
      .then((artifact: { library_search_shard: LibrarySearchShard }) => {
        runtime.appendLibrarySearchShard(artifact.library_search_shard);
        onShardLoaded?.();
      })
      .catch((error) => {
        console.warn(`Failed to lazy-load library shard ${catalogId}:`, error);
      });

  const loadNext = () => {
    const catalogId = pending.shift();
    if (!catalogId) {
      return;
    }
    ingestShard(catalogId).finally(() => {
      if (pending.length > 0) {
        scheduler(loadNext);
      }
    });
  };
  scheduler(loadNext);

  // Called on a cold deep link into a non-eager catalog: fetch that one
  // shard immediately instead of waiting for its turn in the idle queue.
  // Always attempts the fetch (not just the first time) so a manual retry
  // after a failed attempt actually retries — `fetchArtifact`'s cache only
  // dedupes an in-flight or successfully-resolved request; a failed one is
  // evicted from that cache and genuinely refetched. Removing the catalog
  // from `pending` (if it's still queued there) only prevents the idle
  // queue from fetching it a second time; it never gates whether this call
  // proceeds.
  return (catalogId: string) => {
    const index = pending.indexOf(catalogId);
    if (index !== -1) {
      pending.splice(index, 1);
    }
    void ingestShard(catalogId);
  };
}

async function loadLibrarySearchBootstrap(): Promise<LibrarySearchBootstrap> {
  try {
    const manifestArtifact = (await fetchArtifact(
      artifactPath("library-search-manifest.json"),
    )) as {
      library_search_manifest: {
        eager_shard_ids: string[];
        shards: Array<{ catalog_id: string }>;
      };
    };
    const manifest = manifestArtifact.library_search_manifest;
    const eagerShardIds = manifest.eager_shard_ids || [];
    const shardArtifacts = await Promise.all(
      eagerShardIds.map((catalogId) =>
        fetchArtifact(artifactPath(`library-search/${catalogId}.json`)),
      ),
    );
    const librarySearchShards = shardArtifacts.map((artifact, index) => {
      const payload = artifact as { library_search_shard: LibrarySearchShard };
      return {
        catalog_id: eagerShardIds[index],
        ...payload.library_search_shard,
      };
    });
    const lazyShardIds = (manifest.shards || [])
      .map((shard) => shard.catalog_id)
      .filter((catalogId) => !eagerShardIds.includes(catalogId));

    return {
      librarySearch: mergeLibraryShards(librarySearchShards),
      librarySearchShards,
      lazyShardIds,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to load library search manifest: ${message}`, {
      cause: error,
    });
  }
}

function createSearchRuntime(
  libraryBootstrap: LibrarySearchBootstrap,
  _templateRegistry: TemplateRegistry,
  onShardLoaded?: () => void,
) {
  const runtime = createFederalGraphRuntime({
    sources: [],
    nodes: [],
    edges: [],
    evidence: [],
    findings: [],
    librarySearch: libraryBootstrap.librarySearch,
    librarySearchShards: libraryBootstrap.librarySearchShards,
  });
  const prioritizeLibraryShard = scheduleLazyLibraryShards(
    runtime,
    libraryBootstrap.lazyShardIds,
    onShardLoaded,
  );
  return { runtime, prioritizeLibraryShard };
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
  const { runtime, prioritizeLibraryShard } = createSearchRuntime(
    libraryBootstrap,
    templateRegistry,
  );

  return {
    runtime,
    prioritizeLibraryShard,
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
    graphReady: false,
    librarySearchRevision: 0,
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
  onShardLoaded?: () => void,
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
    librarySearchShards: libraryBootstrap.librarySearchShards,
  });
  const prioritizeLibraryShard = scheduleLazyLibraryShards(
    runtime,
    libraryBootstrap.lazyShardIds,
    onShardLoaded,
  );

  return {
    runtime,
    prioritizeLibraryShard,
    templateRegistry,
    officialArtifactRegistry,
    complianceWorkflowRegistry,
    complianceToolRegistry,
    fedrampTransitionIndex,
    commonsSearchIndex,
    commonsDataset,
    graphReady: true,
    librarySearchRevision: 0,
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

export async function loadRuntimeDatasetStaged(handlers: {
  onSearchReady: (bundle: RuntimeBundle) => void;
  onFullReady: (bundle: RuntimeBundle) => void;
  onError: (error: unknown) => void;
  onShardLoaded?: () => void;
  includeFullGraph: boolean;
}) {
  try {
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
    const officialArtifactRegistry =
      officialArtifactRegistryRaw as OfficialArtifactRegistry;
    const complianceWorkflowRegistry =
      complianceWorkflowRegistryRaw as ComplianceWorkflowRegistry;
    const complianceToolRegistry =
      complianceToolRegistryRaw as ComplianceToolRegistry;
    const fedrampTransitionIndex =
      fedrampTransitionIndexRaw as FedrampTransitionIndex;
    const commonsSearchIndex = (commonsSearchIndexRaw as CommonsSearchIndex) || undefined;
    const commonsDataset = (commonsDatasetRaw as CommonsResourceDataset) || undefined;

    const { runtime: searchRuntime, prioritizeLibraryShard } =
      createSearchRuntime(
        libraryBootstrap,
        templateRegistry,
        handlers.onShardLoaded,
      );
    handlers.onSearchReady({
      runtime: searchRuntime,
      prioritizeLibraryShard,
      templateRegistry,
      officialArtifactRegistry,
      complianceWorkflowRegistry,
      complianceToolRegistry,
      fedrampTransitionIndex,
      commonsSearchIndex,
      commonsDataset,
      graphReady: false,
      librarySearchRevision: 0,
    });
    if (!handlers.includeFullGraph) {
      return;
    }
    const fullBundle = await loadFullGraphPhase(
      libraryBootstrap,
      templateRegistry,
      officialArtifactRegistry,
      complianceWorkflowRegistry,
      complianceToolRegistry,
      fedrampTransitionIndex,
      commonsSearchIndex,
      commonsDataset,
      handlers.onShardLoaded,
    );
    handlers.onFullReady(fullBundle);
  } catch (error) {
    handlers.onError(error);
  }
}
