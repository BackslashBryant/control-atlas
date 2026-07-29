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

export type LibrarySearchArtifact = {
  document_count?: number;
  documents: Array<Record<string, unknown>>;
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
  }>;
  published_connection_count: number;
  candidate_connection_count: number;
};

type AtlasNeighborhoodShardRecord = {
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

export async function fetchArtifact(path: string) {
  const cached = artifactCache.get(path);
  if (cached) {
    return cached;
  }

  const request = fetch(compressedArtifactPath(path)).then(async (response) => {
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
    structural_path: (shardRecord.structural_path || []).flatMap((id) => {
      const node = nodeById.get(id);
      return node
        ? [{
            id,
            label: node.metadata?.title || id,
            node_type: node.node_type || "",
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

export async function loadRuntimeDatasetStaged(handlers: {
  onSearchReady: (bundle: RuntimeBundle) => void;
  onFullReady: (bundle: RuntimeBundle) => void;
  onError: (error: unknown) => void;
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

    const searchRuntime = createSearchRuntime(libraryBootstrap);
    handlers.onSearchReady({
      runtime: searchRuntime,
      templateRegistry,
      officialArtifactRegistry,
      complianceWorkflowRegistry,
      complianceToolRegistry,
      fedrampTransitionIndex,
      commonsSearchIndex,
      commonsDataset,
      graphReady: false,
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
    );
    handlers.onFullReady(fullBundle);
  } catch (error) {
    handlers.onError(error);
  }
}
