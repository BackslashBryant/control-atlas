import { createFederalGraphRuntime } from '../../app/runtime.mjs';

const CACHE_VERSION = '20260619-3';
const artifactCache = new Map<string, Promise<unknown>>();

export type TemplateRegistry = {
  templates?: Array<Record<string, unknown>>;
};

export type RuntimeBundle = {
  runtime: ReturnType<typeof createFederalGraphRuntime>;
  templateRegistry: TemplateRegistry;
  graphReady: boolean;
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
  if (artifact.schema_version !== '1.0' || !Array.isArray(artifact[key])) {
    throw new Error(`Invalid ${key} graph artifact.`);
  }
  return artifact[key];
}

function artifactPath(name: string) {
  return `./data/generated/${name}?v=${CACHE_VERSION}`;
}

export async function loadLibrarySearchPhase(): Promise<RuntimeBundle> {
  const [libraryArtifact, templateRegistryRaw] = await Promise.all([
    fetchArtifact(artifactPath('library-search.json')),
    fetchArtifact('./data/template-registry.json'),
  ]);
  const templateRegistry = templateRegistryRaw as TemplateRegistry;

  const runtime = createFederalGraphRuntime({
    sources: [],
    nodes: [],
    edges: [],
    evidence: [],
    findings: [],
    librarySearch: libraryArtifact.library_search,
  });

  return {
    runtime,
    templateRegistry,
    graphReady: false,
  };
}

export async function loadFullGraphPhase(
  libraryArtifact: Awaited<ReturnType<typeof fetchArtifact>>,
  templateRegistry: TemplateRegistry,
): Promise<RuntimeBundle> {
  const [sources, nodes, edges, evidence, findings] = await Promise.all([
    fetchCollection(artifactPath('sources.json'), 'sources'),
    fetchCollection(artifactPath('nodes.json'), 'nodes'),
    fetchCollection(artifactPath('edges.json'), 'edges'),
    fetchCollection(artifactPath('evidence.json'), 'evidence'),
    fetchCollection(artifactPath('graph-health.json'), 'findings'),
  ]);

  const runtime = createFederalGraphRuntime({
    sources,
    nodes,
    edges,
    evidence,
    findings,
    librarySearch: libraryArtifact.library_search,
  });

  return {
    runtime,
    templateRegistry,
    graphReady: true,
  };
}

export async function loadRuntimeDataset(): Promise<RuntimeBundle> {
  const [libraryArtifact, templateRegistryRaw] = await Promise.all([
    fetchArtifact(artifactPath('library-search.json')),
    fetchArtifact('./data/template-registry.json'),
  ]);

  return loadFullGraphPhase(
    libraryArtifact,
    templateRegistryRaw as TemplateRegistry,
  );
}

export async function loadRuntimeDatasetStaged(handlers: {
  onSearchReady: (bundle: RuntimeBundle) => void;
  onFullReady: (bundle: RuntimeBundle) => void;
  onError: (error: unknown) => void;
  includeFullGraph: boolean;
}) {
  try {
    const libraryArtifact = await fetchArtifact(artifactPath('library-search.json'));
    const templateRegistry = (await fetchArtifact(
      './data/template-registry.json',
    )) as TemplateRegistry;
    const searchRuntime = createFederalGraphRuntime({
      sources: [],
      nodes: [],
      edges: [],
      evidence: [],
      findings: [],
      librarySearch: libraryArtifact.library_search,
    });
    handlers.onSearchReady({
      runtime: searchRuntime,
      templateRegistry,
      graphReady: false,
    });
    if (!handlers.includeFullGraph) {
      return;
    }
    const fullBundle = await loadFullGraphPhase(libraryArtifact, templateRegistry);
    handlers.onFullReady(fullBundle);
  } catch (error) {
    handlers.onError(error);
  }
}
