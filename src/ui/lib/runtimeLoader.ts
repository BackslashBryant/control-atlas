import { createFederalGraphRuntime } from '../../app/runtime.mjs';

export async function fetchArtifact(path: string) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Unable to load ${path}.`);
  }
  return response.json();
}

async function fetchCollection(path: string, key: string) {
  const artifact = await fetchArtifact(path);
  if (artifact.schema_version !== '1.0' || !Array.isArray(artifact[key])) {
    throw new Error(`Invalid ${key} graph artifact.`);
  }
  return artifact[key];
}

export async function loadRuntimeDataset() {
  const [sources, nodes, edges, evidence, findings, libraryArtifact, templateRegistry] =
    await Promise.all([
      fetchCollection('./data/generated/sources.json?v=20260619-2', 'sources'),
      fetchCollection('./data/generated/nodes.json?v=20260619-2', 'nodes'),
      fetchCollection('./data/generated/edges.json?v=20260619-2', 'edges'),
      fetchCollection('./data/generated/evidence.json?v=20260619-2', 'evidence'),
      fetchCollection('./data/generated/graph-health.json?v=20260619-2', 'findings'),
      fetchArtifact('./data/generated/library-search.json?v=20260619-2'),
      fetchArtifact('./data/template-registry.json'),
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
  };
}
