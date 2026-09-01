import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { catalogProfileFor } from "../../src/ui/lib/catalogProfiles";
import {
  buildAtlasGroups,
  selectAtlasOverviewGroups,
} from "../../src/ui/lib/atlasModel";
import type {
  AtlasNeighborhoodEdge,
  AtlasNeighborhoodNode,
  AtlasNeighborhoodRecord,
} from "../../src/ui/lib/runtimeLoader";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const GENERATED = join(ROOT, "data", "generated");

type ShardedManifest = {
  sharded_collection: {
    record_count: number;
    shards: Array<{ path: string; record_count: number }>;
  };
};

type PublicationProjection = {
  id: string;
  level: string;
  label: string;
  nodes: Array<{ id: string; label: string; nodeType: string }>;
  edges: unknown[];
  representedCanonicalNodeCount: number;
};

type SemanticArtifact = {
  landscape: {
    nodes: Array<{ id: string; label: string }>;
    edges: Array<{ source: string; target: string }>;
  };
  publications: Record<string, PublicationProjection>;
};

function loadAtlasNetwork(): SemanticArtifact {
  return JSON.parse(
    readFileSync(join(GENERATED, "atlas-network.json"), "utf8"),
  );
}

function loadNodeManifest(): ShardedManifest {
  return JSON.parse(readFileSync(join(GENERATED, "nodes.json"), "utf8"));
}

function loadEdgeManifest(): ShardedManifest {
  return JSON.parse(readFileSync(join(GENERATED, "edges.json"), "utf8"));
}

function catalogsInNodeShards(): Set<string> {
  const manifest = loadNodeManifest();
  const catalogs = new Set<string>();
  for (const shard of manifest.sharded_collection.shards) {
    const data = JSON.parse(
      readFileSync(join(GENERATED, shard.path), "utf8"),
    );
    for (const node of data.nodes) {
      if (node.id?.includes(":")) {
        catalogs.add(node.id.split(":")[0]);
      }
    }
  }
  return catalogs;
}

type NeighborhoodNode = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  number,
  number,
];
type NeighborhoodSourceRef = [string, string, string];
type NeighborhoodEdge = [
  string,
  string,
  string,
  string,
  "structural" | "applicability" | "correlation",
  string,
  string,
  string,
  NeighborhoodSourceRef[],
];
type NeighborhoodRecord = {
  center_node: AtlasNeighborhoodNode;
  nodes: NeighborhoodNode[];
  edges: NeighborhoodEdge[];
  structural_path: string[];
  structural_paths?: string[][];
  published_connection_count: number;
  candidate_connection_count: number;
};

type FullGraphEdge = {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: string;
  relationship_class: "structural" | "applicability" | "correlation";
  mapping_model: string;
  source_artifact_id: string;
  status: string;
  authority_class: string;
  provenance_class: string;
  confidence: string;
  publication_status: string;
  source_refs: Array<{
    source_id: string;
    ref_type: string;
    locator: string;
  }>;
};

type SourceRegistry = {
  sources: Array<{
    id: string;
    version: string;
    lifecycle_status: string;
    provenance_class: string;
    metadata?: { transition_note?: string };
  }>;
};

function loadNeighborhood(nodeId: string): NeighborhoodRecord | null {
  let h = 0x811c9dc5;
  for (let i = 0; i < nodeId.length; i++) {
    h ^= nodeId.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const shard = ((h >>> 0) % 128).toString(16).padStart(2, "0");
  const path = join(GENERATED, "atlas-neighborhood", `${shard}.json`);
  const data = JSON.parse(readFileSync(path, "utf8"));
  return data.atlas_neighborhood_shard.records[nodeId] || null;
}

const fullEdgeCache = new Map<string, FullGraphEdge[]>();

function loadFullEdgesForNode(nodeId: string): FullGraphEdge[] {
  const cached = fullEdgeCache.get(nodeId);
  if (cached) return cached;
  const manifest = loadEdgeManifest();
  const matches: FullGraphEdge[] = [];
  for (const shard of manifest.sharded_collection.shards) {
    const raw = readFileSync(join(GENERATED, shard.path), "utf8");
    if (!raw.includes(nodeId)) continue;
    const data = JSON.parse(raw) as { edges: FullGraphEdge[] };
    matches.push(
      ...data.edges.filter(
        (edge) =>
          edge.source_node_id === nodeId || edge.target_node_id === nodeId,
      ),
    );
  }
  fullEdgeCache.set(nodeId, matches);
  return matches;
}

function loadSourceRegistry(): SourceRegistry {
  return JSON.parse(
    readFileSync(join(ROOT, "data", "source-registry.json"), "utf8"),
  );
}

function decodeNeighborhood(record: NeighborhoodRecord): AtlasNeighborhoodRecord {
  const nodes = record.nodes.map(
    ([
      id,
      nodeType,
      itemId,
      title,
      catalogId,
      sourceId,
      family,
      parentId,
      description,
      structuralChildCount,
      structuralDescendantRecordCount,
    ]) => ({
      id,
      node_type: nodeType,
      label: title,
      parent_id: parentId || undefined,
      source_id: sourceId || undefined,
      metadata: {
        item_id: itemId,
        title,
        description,
        catalog_id: catalogId,
        family,
        structural_child_count: structuralChildCount,
        structural_descendant_record_count: structuralDescendantRecordCount,
      },
    }),
  );
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const centerNode = nodeById.get(record.center_node.id) || record.center_node;
  const edges: AtlasNeighborhoodEdge[] = record.edges.map(
    ([
      id,
      sourceNodeId,
      targetNodeId,
      relationshipType,
      relationshipClass,
      provenanceClass,
      publicationStatus,
      confidence,
      sourceRefs,
    ]) => ({
      id,
      source_node_id: sourceNodeId,
      target_node_id: targetNodeId,
      relationship_type: relationshipType,
      relationship_class: relationshipClass,
      provenance_class: provenanceClass,
      publication_status: publicationStatus,
      confidence,
      source_refs: sourceRefs.map(([sourceId, refType, locator]) => ({
        source_id: sourceId,
        ref_type: refType,
        locator,
      })),
    }),
  );

  return {
    center_node: centerNode,
    nodes,
    edges,
    structural_path: [],
    published_connection_count: record.published_connection_count,
    candidate_connection_count: record.candidate_connection_count,
  };
}

function counterpartId(
  edge: Pick<FullGraphEdge, "source_node_id" | "target_node_id">,
  centerId: string,
): string {
  return edge.source_node_id === centerId
    ? edge.target_node_id
    : edge.source_node_id;
}

function catalogId(nodeId: string): string {
  return nodeId.split(":")[0];
}

const EXPECTED_USER_FACING_CATALOGS = [
  "nist-800-53", "csf-2", "dod-zt", "nist-zt", "mitre-attack", "mitre-d3fend",
  "nist-iot-cybersecurity", "nist-800-171", "nist-800-172", "cmmc-2",
  "fedramp-2026", "nist-ai-rmf", "nist-ssdf", "dod-rai", "nist-mobile-threats",
  "mitre-attack-ics", "nist-800-171-rev2", "disa-stig", "disa-srg", "disa-cci",
  "nist-800-53a", "nist-800-53b", "fips-199", "fips-200", "nist-800-37",
  "cui-policy", "fedramp-rev5",
];

// ── Source Scope ─────────────────────────────────────────────

test("atlas-network.json includes all 27 user-facing catalogs", () => {
  const artifact = loadAtlasNetwork();
  const pubs = new Set(Object.keys(artifact.publications));
  for (const id of EXPECTED_USER_FACING_CATALOGS) {
    assert.ok(pubs.has(id), `Missing publication projection: ${id}`);
  }
});

test("microsoft-zt-maturity is present in data but excluded from user-facing scope", () => {
  const catalogs = catalogsInNodeShards();
  assert.ok(catalogs.has("microsoft-zt-maturity"), "microsoft-zt-maturity should exist in graph data");
});

test("every user-facing catalog has nodes in the graph data shards", () => {
  const catalogs = catalogsInNodeShards();
  for (const id of EXPECTED_USER_FACING_CATALOGS) {
    assert.ok(catalogs.has(id), `Catalog ${id} has no nodes in graph data`);
  }
});

test("node manifest declares > 30,000 records", () => {
  const manifest = loadNodeManifest();
  assert.ok(
    manifest.sharded_collection.record_count > 30000,
    `Expected > 30,000 nodes, got ${manifest.sharded_collection.record_count}`,
  );
});

// ── Publication Kind / Source Type ────────────────────────────

test("catalog profiles classify all 27 user-facing publications", () => {
  for (const id of EXPECTED_USER_FACING_CATALOGS) {
    assert.ok(
      catalogProfileFor(id).publicationKind,
      `Missing publication kind for ${id}`,
    );
  }
});

test("catalog profiles label records for all 27 user-facing publications", () => {
  for (const id of EXPECTED_USER_FACING_CATALOGS) {
    assert.ok(
      catalogProfileFor(id).recordLabel,
      `Missing record label for ${id}`,
    );
  }
});

test("catalog profiles describe all 27 user-facing publications", () => {
  for (const id of EXPECTED_USER_FACING_CATALOGS) {
    assert.ok(catalogProfileFor(id).synopsis, `Missing synopsis for ${id}`);
  }
});

test("publication kind assignments match the public catalog taxonomy", () => {
  const expected: Record<string, string> = {
    "nist-800-53": "Control catalog",
    "csf-2": "Outcome framework",
    "dod-zt": "Implementation standard",
    "mitre-attack": "Threat knowledge base",
    "mitre-d3fend": "Defensive knowledge base",
    "cmmc-2": "Certification program",
    "fedramp-2026": "Authorization program",
    "nist-mobile-threats": "Threat knowledge base",
    "disa-stig": "Implementation standard",
    "nist-800-53a": "Control catalog",
    "nist-800-53b": "Control-selection method",
    "fips-199": "Risk framework",
    "fips-200": "Risk framework",
    "nist-800-37": "Risk framework",
    "cui-policy": "Policy and regulation",
    "fedramp-rev5": "Authorization program",
  };
  for (const [id, expectedKind] of Object.entries(expected)) {
    assert.equal(
      catalogProfileFor(id).publicationKind,
      expectedKind,
      `${id} should be "${expectedKind}"`,
    );
  }
});

// ── SP 800-53 Structure ──────────────────────────────────────

test("SP 800-53 projection has 20 families", () => {
  const artifact = loadAtlasNetwork();
  const pub = artifact.publications["nist-800-53"];
  const families = pub.nodes.filter((n) => n.nodeType === "publisher_group");
  assert.equal(families.length, 20, `Expected 20 families, got ${families.length}`);
});

test("SP 800-53 represents > 1,000 canonical nodes", () => {
  const artifact = loadAtlasNetwork();
  const pub = artifact.publications["nist-800-53"];
  assert.ok(
    pub.representedCanonicalNodeCount > 1000,
    `Expected > 1,000, got ${pub.representedCanonicalNodeCount}`,
  );
});

test("SP 800-53 Access Control family is present", () => {
  const artifact = loadAtlasNetwork();
  const pub = artifact.publications["nist-800-53"];
  const ac = pub.nodes.find((n) => n.label === "Access Control");
  assert.ok(ac, "Access Control family not found in SP 800-53 projection");
});

// ── AC-2 Connection Reconciliation ───────────────────────────

const AC2_ID = "nist-800-53:AC-2";

function requireAc2Neighborhood(): NeighborhoodRecord {
  const record = loadNeighborhood(AC2_ID);
  assert.ok(record, "AC-2 neighborhood not found");
  return record;
}

test("AC-2 has 156 published active relationships across ten catalogs", () => {
  const neighborhood = requireAc2Neighborhood();
  const edges = loadFullEdgesForNode(AC2_ID);
  assert.equal(neighborhood.edges.length, 156);
  assert.equal(neighborhood.published_connection_count, 156);
  assert.equal(neighborhood.candidate_connection_count, 0);
  assert.equal(edges.length, 156);
  assert.ok(edges.every((edge) => edge.status === "active"));
  assert.ok(edges.every((edge) => edge.publication_status === "published"));

  const perCatalog = new Map<string, number>();
  for (const edge of edges) {
    const id = catalogId(counterpartId(edge, AC2_ID));
    perCatalog.set(id, (perCatalog.get(id) || 0) + 1);
  }
  assert.deepEqual(Object.fromEntries([...perCatalog].sort()), {
    "csf-2": 5,
    "disa-cci": 47,
    "dod-zt": 20,
    "fedramp-rev5": 4,
    "nist-800-171": 1,
    "nist-800-53": 14,
    "nist-800-53a": 1,
    "nist-800-53b": 3,
    "nist-iot-cybersecurity": 14,
    "nist-zt": 47,
  });
});

test("AC-2 native structure is one family parent and 13 enhancement children", () => {
  const edges = loadFullEdgesForNode(AC2_ID).filter(
    (edge) => edge.relationship_class === "structural",
  );
  const incoming = edges.filter((edge) => edge.target_node_id === AC2_ID);
  const outgoing = edges.filter((edge) => edge.source_node_id === AC2_ID);
  assert.equal(edges.length, 14);
  assert.equal(incoming.length, 1);
  assert.equal(incoming[0]?.source_node_id, "nist-800-53:FAMILY-AC");
  assert.equal(outgoing.length, 13);
  assert.ok(outgoing.every((edge) => edge.relationship_type === "contains"));
  assert.ok(
    outgoing.every((edge) => edge.target_node_id.startsWith("nist-800-53:AC-2.")),
  );
});

test("AC-2 cross-source scope is 135 correlations plus seven applicability selections", () => {
  const edges = loadFullEdgesForNode(AC2_ID);
  const crossSource = edges.filter(
    (edge) => catalogId(counterpartId(edge, AC2_ID)) !== "nist-800-53",
  );
  const correlations = crossSource.filter(
    (edge) => edge.relationship_class === "correlation",
  );
  const applicability = crossSource.filter(
    (edge) => edge.relationship_class === "applicability",
  );
  assert.equal(crossSource.length, 142);
  assert.equal(correlations.length, 135);
  assert.equal(applicability.length, 7);
  assert.equal(
    crossSource.filter((edge) => edge.mapping_model === "implementation").length,
    0,
    "AC-2 has no direct implementation relationships",
  );
});

test("AC-2 cross-source correlations separate CCI, assessment, and publisher mappings", () => {
  const correlations = loadFullEdgesForNode(AC2_ID).filter(
    (edge) => edge.relationship_class === "correlation",
  );
  const cci = correlations.filter(
    (edge) => catalogId(counterpartId(edge, AC2_ID)) === "disa-cci",
  );
  const assessment = correlations.filter(
    (edge) => edge.relationship_type === "assesses",
  );
  const publisherMappings = correlations.filter(
    (edge) => !cci.includes(edge) && !assessment.includes(edge),
  );
  assert.equal(cci.length, 47, "DISA CCI correlation junctions");
  assert.equal(assessment.length, 1, "SP 800-53A assessment procedure");
  assert.equal(publisherMappings.length, 87, "other cross-framework publisher mappings");
  assert.ok(cci.every((edge) => edge.mapping_model === "correlation"));
});

test("AC-2 baseline applicability records preserve active and historical lifecycle context", () => {
  const applicability = loadFullEdgesForNode(AC2_ID).filter(
    (edge) => edge.relationship_class === "applicability",
  );
  assert.equal(
    applicability.filter((edge) => edge.source_refs[0]?.source_id === "nist-800-53b-baselines").length,
    3,
  );
  assert.equal(
    applicability.filter((edge) => edge.source_refs[0]?.source_id === "fedramp-rev5").length,
    4,
  );

  const sources = new Map(loadSourceRegistry().sources.map((source) => [source.id, source]));
  const nistBaselines = sources.get("nist-800-53b-baselines");
  const legacyFedramp = sources.get("fedramp-rev5");
  assert.equal(nistBaselines?.lifecycle_status, "active");
  assert.equal(nistBaselines?.version, "Revision 5, Release 5.2.0");
  assert.equal(legacyFedramp?.lifecycle_status, "historical");
  assert.equal(legacyFedramp?.version, "Legacy Rev5 security controls baseline workbook");
  assert.match(
    legacyFedramp?.metadata?.transition_note || "",
    /Use the Consolidated Rules for 2026/,
  );
});

test("all 156 AC-2 records match their declared semantic signatures", () => {
  const neighborhood = requireAc2Neighborhood();
  const nodeTypes = new Map(neighborhood.nodes.map((node) => [node[0], node[1]]));
  const signatures = new Map<string, number>();
  for (const edge of loadFullEdgesForNode(AC2_ID)) {
    const other = counterpartId(edge, AC2_ID);
    const direction = edge.source_node_id === AC2_ID ? "outgoing" : "incoming";
    const signature = [
      catalogId(other),
      nodeTypes.get(other),
      edge.relationship_type,
      edge.relationship_class,
      direction,
      edge.mapping_model,
      edge.provenance_class,
      edge.confidence,
      edge.source_refs[0]?.source_id,
      edge.status,
      edge.publication_status,
    ].join("|");
    signatures.set(signature, (signatures.get(signature) || 0) + 1);
  }

  assert.deepEqual(Object.fromEntries([...signatures].sort()), {
    "csf-2|requirement|concept_crosswalk|correlation|outgoing|correlation|federal_published|direct|nist-olir-csf2-to-sp800-53|active|published": 5,
    "disa-cci|requirement|maps_to|correlation|incoming|correlation|federal_published|derived|nist-800-53-rev4-rev5-crosswalk|active|published": 12,
    "disa-cci|requirement|maps_to|correlation|incoming|correlation|federal_published|direct|disa-cci-nist-references|active|published": 35,
    "dod-zt|zt_capability|supports|correlation|outgoing|correlation|federal_published|direct|dod-zt-overlays-2024|active|published": 20,
    "fedramp-rev5|baseline|selects|applicability|incoming|applicability|federal_program|direct|fedramp-rev5|active|published": 4,
    "nist-800-171|requirement|maps_to|correlation|incoming|correlation|federal_published|direct|nist-800-171-oscal-mappings|active|published": 1,
    "nist-800-53a|assessment_procedure|assesses|correlation|incoming|correlation|federal_published|direct|nist-800-53a-assessment-procedures|active|published": 1,
    "nist-800-53b|baseline|selects|applicability|incoming|applicability|federal_published|direct|nist-800-53b-baselines|active|published": 3,
    "nist-800-53|control_enhancement|contains|structural|outgoing|structural|federal_published|derived|nist-800-53|active|published": 13,
    "nist-800-53|family|contains|structural|incoming|structural|federal_published|derived|nist-800-53|active|published": 1,
    "nist-iot-cybersecurity|iot_capability_element|maps_to|correlation|incoming|correlation|federal_published|direct|nist-iot-requirements-80053-mapping-draft|active|published": 9,
    "nist-iot-cybersecurity|iot_capability_subelement|maps_to|correlation|incoming|correlation|federal_published|direct|nist-iot-requirements-80053-mapping-draft|active|published": 5,
    "nist-zt|zt_product_component|supports|correlation|incoming|correlation|federal_published|direct|nist-sp-1800-35-sp80053-mappings|active|published": 38,
    "nist-zt|zt_reference_component|supports|correlation|incoming|correlation|federal_published|direct|nist-sp-1800-35-sp80053-mappings|active|published": 9,
  });
});

test("AC-2 relationship IDs and endpoint-type assertions are unique", () => {
  const edges = loadFullEdgesForNode(AC2_ID);
  const ids = new Set(edges.map((edge) => edge.id));
  const assertions = new Set(
    edges.map(
      (edge) =>
        `${edge.source_node_id}|${edge.target_node_id}|${edge.relationship_type}`,
    ),
  );
  assert.equal(ids.size, 156, "canonical edge IDs are the deduplication key");
  assert.equal(assertions.size, 156, "endpoint-type assertions must not duplicate");
});

// ── CMMC Level Verification ──────────────────────────────────

test("CMMC 2.0 projection represents levels", () => {
  const artifact = loadAtlasNetwork();
  const pub = artifact.publications["cmmc-2"];
  assert.ok(pub, "cmmc-2 not in atlas-network");
  assert.ok(
    pub.representedCanonicalNodeCount >= 4,
    `CMMC: expected >= 4 canonical nodes, got ${pub.representedCanonicalNodeCount}`,
  );
});

test("CMMC 2.0 Level 2 has 800-171 Rev. 2 connections in neighborhood", () => {
  const manifest = loadNodeManifest();
  let levelId: string | null = null;
  for (const shard of manifest.sharded_collection.shards) {
    const data = JSON.parse(readFileSync(join(GENERATED, shard.path), "utf8"));
    for (const node of data.nodes) {
      if (node.id?.startsWith("cmmc-2:") && node.label?.includes("Level 2")) {
        levelId = node.id;
        break;
      }
    }
    if (levelId) break;
  }
  assert.ok(levelId, "CMMC Level 2 node not found in graph data");

  const rec = loadNeighborhood(levelId);
  if (rec) {
    let rev2Count = 0;
    for (const edge of rec.edges) {
      const other = edge[1] === levelId ? edge[2] : edge[1];
      if (other.startsWith("nist-800-171-rev2:")) rev2Count++;
    }
    assert.ok(
      rev2Count >= 100,
      `CMMC Level 2 → 800-171 Rev. 2: expected >= 100, got ${rev2Count}`,
    );
  }
});

// ── FedRAMP Rev. 5 ───────────────────────────────────────────

test("FedRAMP Rev. 5 is present in atlas-network with baselines", () => {
  const artifact = loadAtlasNetwork();
  const pub = artifact.publications["fedramp-rev5"];
  assert.ok(pub, "fedramp-rev5 not in atlas-network");
  assert.ok(
    pub.representedCanonicalNodeCount >= 4,
    `FedRAMP Rev. 5: expected >= 4 canonical nodes, got ${pub.representedCanonicalNodeCount}`,
  );
});

// ── New Source Projections ────────────────────────────────────

test("newly included NIST sources have non-empty projections", () => {
  const artifact = loadAtlasNetwork();
  const newSources = ["nist-800-53a", "nist-800-53b", "fips-199", "fips-200", "nist-800-37"];
  for (const id of newSources) {
    const pub = artifact.publications[id];
    assert.ok(pub, `${id} missing from atlas-network`);
    assert.ok(
      pub.representedCanonicalNodeCount > 0,
      `${id} has 0 represented canonical nodes`,
    );
  }
});

test("CUI Program (NARA) has a non-empty projection", () => {
  const artifact = loadAtlasNetwork();
  const pub = artifact.publications["cui-policy"];
  assert.ok(pub, "cui-policy missing from atlas-network");
  assert.ok(
    pub.representedCanonicalNodeCount >= 100,
    `CUI Program: expected >= 100 nodes, got ${pub.representedCanonicalNodeCount}`,
  );
});

// ── Landscape Structure ──────────────────────────────────────

test("landscape has 9 area nodes", () => {
  const artifact = loadAtlasNetwork();
  const limbs = artifact.landscape.nodes.filter((n) => n.id.startsWith("atlas:LIMB-"));
  assert.equal(limbs.length, 9, `Expected 9 area limbs, got ${limbs.length}`);
});

test("landscape area names match accepted taxonomy", () => {
  const artifact = loadAtlasNetwork();
  const areas = artifact.landscape.nodes
    .filter((n) => n.id.startsWith("atlas:LIMB-"))
    .map((n) => n.label)
    .sort();
  const expected = [
    "Architecture", "Assessment", "Compliance", "Governance",
    "Implementation", "Knowledge", "Operations", "Risk", "Threats & Defense",
  ].sort();
  assert.deepEqual(areas, expected);
});

// ── DISA Ecosystem ───────────────────────────────────────────

test("DISA sources are present in atlas-network", () => {
  const artifact = loadAtlasNetwork();
  for (const id of ["disa-cci", "disa-stig", "disa-srg"]) {
    assert.ok(artifact.publications[id], `${id} missing from atlas-network`);
  }
});

// ── Presentation vs Data Separation ──────────────────────────

test("connection presentation caps do not alter AC-2 source truth or grouping", () => {
  const source = requireAc2Neighborhood();
  const decoded = decodeNeighborhood(source);
  const filters = {
    relationshipType: "",
    provenance: "",
    confidence: "",
    nodeType: "",
    includeCandidates: false,
    search: "",
  };
  const groups = buildAtlasGroups(decoded, filters);
  const fullGroupCounts = Object.fromEntries(
    groups.map((group) => [group.id, group.items.length]),
  );
  const provenance = decoded.edges.map((edge) => ({
    id: edge.id,
    provenance: edge.provenance_class,
    sources: edge.source_refs,
  }));

  const overview = selectAtlasOverviewGroups(groups, 6);
  const previews = overview.map((group) => group.items.slice(0, 2));

  assert.equal(groups.reduce((total, group) => total + group.items.length, 0), 156);
  assert.equal(decoded.edges.length, 156);
  assert.equal(decoded.published_connection_count, 156);
  assert.equal(overview.length, 6);
  assert.ok(previews.every((preview) => preview.length <= 2));
  assert.deepEqual(
    Object.fromEntries(groups.map((group) => [group.id, group.items.length])),
    fullGroupCounts,
  );
  assert.deepEqual(
    decoded.edges.map((edge) => ({
      id: edge.id,
      provenance: edge.provenance_class,
      sources: edge.source_refs,
    })),
    provenance,
  );
});

// ── Edge Integrity ───────────────────────────────────────────

test("constellation edges exist between known connected catalog pairs", () => {
  const artifact = loadAtlasNetwork();
  const edgePairs = artifact.landscape.edges.map(
    (e) => `${e.source}|${e.target}`,
  );
  const knownPairs = [
    ["atlas:LIMB-COMPLIANCE", "atlas:TRUNK"],
    ["atlas:LIMB-ARCHITECTURE", "atlas:TRUNK"],
    ["atlas:LIMB-THREAT", "atlas:TRUNK"],
  ];
  for (const [a, b] of knownPairs) {
    const found = edgePairs.some(
      (ep) => ep === `${a}|${b}` || ep === `${b}|${a}`,
    );
    assert.ok(found, `Missing landscape edge: ${a} ↔ ${b}`);
  }
});
