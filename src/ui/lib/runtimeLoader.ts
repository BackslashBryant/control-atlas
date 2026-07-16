import { createFederalGraphRuntime } from "../../app/runtime.mjs";

const CACHE_VERSION = "20260710-1";
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
  graphReady: boolean;
  librarySearchRevision?: number;
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

  const request = fetch(path).then((response) => {
    if (!response.ok) {
      throw new Error(`Unable to load ${path}.`);
    }
    return response.json();
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
) {
  if (lazyShardIds.length === 0) {
    return;
  }

  const pending = [...lazyShardIds];
  const loadNext = () => {
    const catalogId = pending.shift();
    if (!catalogId) {
      return;
    }
    fetchArtifact(artifactPath(`library-search/${catalogId}.json`))
      .then((artifact: { library_search_shard: LibrarySearchShard }) => {
        runtime.appendLibrarySearchShard(artifact.library_search_shard);
        onShardLoaded?.();
      })
      .catch((error) => {
        console.warn(`Failed to lazy-load library shard ${catalogId}:`, error);
      })
      .finally(() => {
        if (pending.length > 0) {
          const scheduler =
            typeof window !== "undefined" && "requestIdleCallback" in window
              ? window.requestIdleCallback.bind(window)
              : (callback: () => void) => window.setTimeout(callback, 100);
          scheduler(loadNext);
        }
      });
  };

  const scheduler =
    typeof window !== "undefined" && "requestIdleCallback" in window
      ? window.requestIdleCallback.bind(window)
      : (callback: () => void) => window.setTimeout(callback, 100);
  scheduler(loadNext);
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
  scheduleLazyLibraryShards(
    runtime,
    libraryBootstrap.lazyShardIds,
    onShardLoaded,
  );
  return runtime;
}

export async function loadLibrarySearchPhase(): Promise<RuntimeBundle> {
  const [
    libraryBootstrap,
    templateRegistryRaw,
    officialArtifactRegistryRaw,
    complianceWorkflowRegistryRaw,
    complianceToolRegistryRaw,
  ] = await Promise.all([
    loadLibrarySearchBootstrap(),
    fetchArtifact("./data/template-registry.json"),
    fetchArtifact("./data/official-artifact-registry.json"),
    fetchArtifact("./data/compliance-workflows.json"),
    fetchArtifact("./data/compliance-tool-registry.json"),
  ]);
  const templateRegistry = templateRegistryRaw as TemplateRegistry;

  return {
    runtime: createSearchRuntime(libraryBootstrap, templateRegistry),
    templateRegistry,
    officialArtifactRegistry:
      officialArtifactRegistryRaw as OfficialArtifactRegistry,
    complianceWorkflowRegistry:
      complianceWorkflowRegistryRaw as ComplianceWorkflowRegistry,
    complianceToolRegistry: complianceToolRegistryRaw as ComplianceToolRegistry,
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
  scheduleLazyLibraryShards(
    runtime,
    libraryBootstrap.lazyShardIds,
    onShardLoaded,
  );

  return {
    runtime,
    templateRegistry,
    officialArtifactRegistry,
    complianceWorkflowRegistry,
    complianceToolRegistry,
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
  ] = await Promise.all([
    loadLibrarySearchBootstrap(),
    fetchArtifact("./data/template-registry.json"),
    fetchArtifact("./data/official-artifact-registry.json"),
    fetchArtifact("./data/compliance-workflows.json"),
    fetchArtifact("./data/compliance-tool-registry.json"),
  ]);

  return loadFullGraphPhase(
    libraryBootstrap,
    templateRegistryRaw as TemplateRegistry,
    officialArtifactRegistryRaw as OfficialArtifactRegistry,
    complianceWorkflowRegistryRaw as ComplianceWorkflowRegistry,
    complianceToolRegistryRaw as ComplianceToolRegistry,
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
    ] = await Promise.all([
      loadLibrarySearchBootstrap(),
      fetchArtifact("./data/template-registry.json"),
      fetchArtifact("./data/official-artifact-registry.json"),
      fetchArtifact("./data/compliance-workflows.json"),
      fetchArtifact("./data/compliance-tool-registry.json"),
    ]);
    const templateRegistry = templateRegistryRaw as TemplateRegistry;
    const officialArtifactRegistry =
      officialArtifactRegistryRaw as OfficialArtifactRegistry;
    const complianceWorkflowRegistry =
      complianceWorkflowRegistryRaw as ComplianceWorkflowRegistry;
    const complianceToolRegistry =
      complianceToolRegistryRaw as ComplianceToolRegistry;
    const searchRuntime = createSearchRuntime(
      libraryBootstrap,
      templateRegistry,
      handlers.onShardLoaded,
    );
    handlers.onSearchReady({
      runtime: searchRuntime,
      templateRegistry,
      officialArtifactRegistry,
      complianceWorkflowRegistry,
      complianceToolRegistry,
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
      handlers.onShardLoaded,
    );
    handlers.onFullReady(fullBundle);
  } catch (error) {
    handlers.onError(error);
  }
}
