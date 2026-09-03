import type { AtlasGraph, AtlasGraphSourceNode } from "./atlasGraphModel";
import { recordDisplayTitle } from "./recordTitle";
import { ATLAS_TRUNK_ID, type AtlasTreeModel } from "./atlasTreeModel";

export type AtlasProjectionLevel =
  | "landscape"
  | "frameworks"
  | "ecosystem"
  | "area"
  | "publication"
  | "detail";
export type AtlasProjectionDrill =
  | { kind: "ecosystem"; targetId: string }
  | { kind: "area"; targetId: string }
  | { kind: "publication"; targetId: string }
  | { kind: "detail"; targetId: string }
  | { kind: "record"; targetId: string };

export type AtlasProjectionNode = {
  id: string;
  label: string;
  description: string;
  /** Compatibility only. UI surfaces use the separated axes below. */
  nodeType: string;
  nativeType: string;
  atlasClass: string;
  objectLayer: "atlas_structure" | "authority_document" | "publisher_content";
  atlasStructureRole: "root" | "area" | "publisher_ecosystem" | "";
  publisherEcosystemId: string;
  areaId: string;
  publicationId: string;
  lifecycleStatus: string;
  version: string;
  publicationKind: string;
  publisherItemId: string;
  includesContainerRecord: boolean;
  canonicalNodeIds: string[];
  canonicalRecordCount: number;
  internalRelationshipCount: number;
  importance: number;
  x: number;
  y: number;
  drill?: AtlasProjectionDrill;
};

export type AtlasProjectionEdge = {
  id: string;
  source: string;
  target: string;
  canonicalEdgeIds: string[];
  connectionSourceIds: string[];
  relationshipCount: number;
  relationshipTypes: string[];
  relationshipClasses: string[];
  directedCount: number;
  undirectedCount: number;
};

export type AtlasGraphProjection = {
  id: string;
  level: AtlasProjectionLevel;
  label: string;
  description: string;
  nodes: AtlasProjectionNode[];
  edges: AtlasProjectionEdge[];
  representedCanonicalNodeCount: number;
  representedCanonicalRelationshipCount: number;
  suppressedRelationshipCount: number;
};

/**
 * Two frameworks that land on the same records without anyone having published
 * a mapping between them.
 *
 * NIST wrote a Zero Trust to 800-53 mapping and DoD wrote one too; neither
 * wrote one to the other. Showing only published crosswalks therefore draws
 * them as strangers, when 53 of the controls they select are the same control.
 * That shared ground is the thing a practitioner is actually looking for, and
 * it is derivable from published mappings without inventing one: the records in
 * common are named, so the claim can be followed back to the source.
 */
export type AtlasSharedGroundEdge = {
  id: string;
  source: string;
  target: string;
  /** Records both frameworks map to. */
  sharedCount: number;
  /**
   * Share of the narrower framework's selections *in the shared publications*
   * that the wider one also makes, 0..1. Measured there rather than against
   * everything each side maps to: NIST Zero Trust also maps into CSF, and
   * counting those would dilute a statement that is only about the 800-53
   * controls the two actually meet on.
   */
  overlapRatio: number;
  /** Publications those shared records live in, most-shared first. */
  viaPublicationIds: string[];
  /** Enough shared records to show the reader what the overlap is made of. */
  sampleNodeIds: string[];
};

export type AtlasRecordLocation = {
  ecosystemId: string;
  areaId: string;
  publicationId: string;
  detailId?: string;
  label: string;
  nodeType: string;
};

export type AtlasSemanticProjectionArtifact = {
  schema_version: "2.2";
  generated_at: string;
  canonical: { node_count: number; edge_count: number };
  landscape: AtlasGraphProjection;
  /**
   * Every publication as one node, with the crosswalks between them as edges.
   *
   * The landscape groups by publisher, which answers "who publishes this?" but
   * never "how do these frameworks relate?" — the question the Atlas exists to
   * answer. Collapsing each catalog to a single node turns every intra-catalog
   * edge internal, so what survives here is exactly the cross-framework
   * crosswalk set: 800-53 to CSF, CSF to 800-171, ATT&CK to D3FEND.
   */
  frameworks: AtlasGraphProjection;
  /**
   * Framework pairs with no published crosswalk that nonetheless select the
   * same records. Kept apart from the projection's own edges so a derived
   * overlap can never be counted or drawn as a published mapping.
   */
  framework_shared_ground: AtlasSharedGroundEdge[];
  ecosystems: Record<string, AtlasGraphProjection>;
  areas: Record<string, AtlasGraphProjection>;
  publications: Record<string, AtlasGraphProjection>;
  details: Record<string, AtlasGraphProjection>;
  record_locations: Record<string, AtlasRecordLocation>;
};

/** Stable publisher-native record labels embedded in the initial Atlas projection. */
export function atlasProjectionRecordLabels(
  artifact: AtlasSemanticProjectionArtifact | null | undefined,
): ReadonlyMap<string, string> {
  const labels = new Map<string, string>();
  for (const [id, location] of Object.entries(artifact?.record_locations || {})) {
    labels.set(id, location.label);
  }
  for (const detail of Object.values(artifact?.details || {})) {
    for (const node of detail.nodes) {
      if (node.drill?.kind === "record") labels.set(node.id, node.label);
    }
  }
  return labels;
}

export type AtlasCatalogMembership = {
  catalogId: string;
  publicationSourceId: string;
  ecosystemId: string;
  ecosystemLabel: string;
  ecosystemDescription: string;
  publicationDescription: string;
  lifecycleStatus: string;
  version: string;
  publicationKind: string;
};

type Descriptor = Omit<AtlasProjectionNode, "canonicalRecordCount" | "internalRelationshipCount" | "importance" | "x" | "y">;
type EdgeBucket = Omit<AtlasProjectionEdge, "id" | "relationshipCount"> & { types: Set<string>; classes: Set<string>; sources: Set<string> };

/** Visible-node budgets per T4.3: exceeding one is a build-time failure, not a silent UX degradation. */
const LANDSCAPE_NODE_BUDGET = { min: 2, max: 20 } as const;
const AREA_NODE_BUDGET_MAX = 60;
/**
 * One node per published catalog. Past this the constellation stops being
 * readable. There is no floor: a corpus carrying a single catalog is a valid
 * corpus, and the landscape already fails closed on an empty build.
 */
const FRAMEWORK_NODE_BUDGET = { max: 40 } as const;

const AUTHORITY_GROUPS = [
  ["authority:statutes", "Statutes", "Laws that establish federal cybersecurity duties.", "statute"],
  ["authority:regulations", "Regulations & clauses", "Rules and clauses that turn authority into requirements.", "regulation"],
  ["authority:directives", "Policy & directives", "Executive and agency direction for federal cybersecurity.", "policy_directive"],
] as const;

const LANDSCAPE_POSITIONS: Record<string, readonly [number, number]> = {
  "authority:statutes": [-1.1, .9], "authority:regulations": [-1.3, 0], "authority:directives": [-1.1, -.9],
  [ATLAS_TRUNK_ID]: [0, 0], "atlas:LIMB-GOVERNANCE": [.8, 1.2], "atlas:LIMB-RISK": [1.65, .95],
  "atlas:LIMB-COMPLIANCE": [1.25, .35], "atlas:LIMB-ARCHITECTURE": [1.7, -.1],
  "atlas:LIMB-IMPLEMENTATION": [1.15, -.65], "atlas:LIMB-ASSESSMENT": [.55, -1.15],
  "atlas:LIMB-OPERATIONS": [-.25, -1.22], "atlas:LIMB-THREAT": [.45, -.55],
  "atlas:LIMB-KNOWLEDGE": [.35, .72],
};

function asRecord(value: unknown) {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}
function asText(value: unknown) { return typeof value === "string" ? value : ""; }
function metadata(node: AtlasGraphSourceNode) { return asRecord(node.metadata); }
function catalogId(node: AtlasGraphSourceNode) { return asText(metadata(node).catalog_id) || asText(node.catalog_id); }
function publicationCatalogId(publication: { id: string; itemId: string }) {
  return publication.id.endsWith(":CATALOG")
    ? publication.id.slice(0, -":CATALOG".length)
    : publication.itemId;
}
function nodeLabel(node: AtlasGraphSourceNode) { return asText(metadata(node).title) || asText(node.label) || asText(metadata(node).item_id) || node.id; }
function recordLabel(node: AtlasGraphSourceNode) {
  const values = metadata(node);
  return recordDisplayTitle({
    id: node.id,
    node_type: asText(node.node_type),
    label: asText(node.label),
    metadata: {
      item_id: asText(values.item_id),
      publisher_item_id: asText(values.publisher_item_id),
      title: asText(values.title),
    },
  }) || nodeLabel(node);
}
function nativeType(node: AtlasGraphSourceNode) {
  if (catalogId(node) === "disa-cci") return "cci";
  return asText(metadata(node).native_type) || asText(metadata(node).type) || asText(node.node_type);
}
function atlasClass(node: AtlasGraphSourceNode) {
  return asText(metadata(node).atlas_class) || (node.node_type === "requirement" ? "requirement" : "");
}
function objectLayer(node: AtlasGraphSourceNode): AtlasProjectionNode["objectLayer"] {
  const canonical = asText(metadata(node).object_layer);
  if (canonical === "atlas_structure" || canonical === "authority_document" || canonical === "publisher_content") return canonical;
  if (node.node_type === "trunk" || node.node_type === "limb" || node.source_id === "control-atlas-structure") return "atlas_structure";
  if (["statute", "regulation", "policy_directive"].includes(String(node.node_type))) return "authority_document";
  return "publisher_content";
}
function sourceIds(edge: Record<string, unknown>) {
  const refs = Array.isArray(edge.source_refs)
    ? edge.source_refs.map((ref) => asText(asRecord(ref).source_id))
    : [];
  return [...new Set([asText(edge.source_artifact_id), ...refs].filter(Boolean))].sort();
}
function enforceNodeBudget(projection: AtlasGraphProjection, bounds: { min?: number; max: number }) {
  const count = projection.nodes.length;
  if (count > bounds.max || (bounds.min !== undefined && count < bounds.min)) {
    const expected = bounds.min !== undefined ? `${bounds.min}-${bounds.max}` : `<=${bounds.max}`;
    throw new Error(`Atlas projection ${projection.id} has ${count} nodes, outside the T4.3 budget (${expected}).`);
  }
  return projection;
}
function projectionId(level: AtlasProjectionLevel, id: string) { return `${level}:${id}`; }
function stable(value: number) { return Number(value.toFixed(4)); }
/**
 * Places frameworks so the picture states the finding before anything is
 * clicked: the catalog everything crosswalks to sits at the centre, the ones
 * that connect to little sit at the rim, and a publisher's catalogs hold
 * together as one angular sector. Radius is crosswalk rank, angle is
 * publisher — both read off the canonical edges rather than being drawn in by
 * hand, so the layout stays true as the corpus grows.
 */
function assignFrameworkCoordinates(nodes: AtlasProjectionNode[], edges: AtlasProjectionEdge[]) {
  const weight = new Map(nodes.map((node) => [node.id, 0]));
  const partners = new Map(nodes.map((node) => [node.id, new Set<string>()]));
  for (const edge of edges) {
    weight.set(edge.source, (weight.get(edge.source) || 0) + edge.relationshipCount);
    weight.set(edge.target, (weight.get(edge.target) || 0) + edge.relationshipCount);
    partners.get(edge.source)?.add(edge.target);
    partners.get(edge.target)?.add(edge.source);
  }
  // Centrality is how many *different* frameworks a catalog crosswalks to, not
  // how many edges it carries. By raw volume the CCI catalog would sit at the
  // centre on the strength of one enormous pairing with the STIG rules, which
  // is an implementation detail rather than a statement about the landscape.
  // Counting distinct partners puts SP 800-53 at the centre, which is what the
  // crosswalk data actually says.
  const reach = (id: string) => partners.get(id)?.size || 0;
  const ranked = [...nodes].sort((a, b) =>
    reach(b.id) - reach(a.id)
    || (weight.get(b.id) || 0) - (weight.get(a.id) || 0)
    || a.id.localeCompare(b.id));
  const hub = ranked[0];
  if (!hub) return;
  hub.x = 0;
  hub.y = 0;

  // A radial tree outward from the hub, not concentric rings by reach.
  //
  // Rings placed a catalog by *how many* partners it had, which says nothing
  // about *whose* neighbour it is — so a framework's own dependants landed on
  // the far side of the diagram and every one of their edges had to cross the
  // middle to get home. Following the crosswalks instead gives each branch a
  // wedge of its own: the STIG and SRG catalogs sit outside the CCI catalog
  // that carries them, ATT&CK and its ICS variant sit outside D3FEND, and a
  // line only leaves its wedge when the data genuinely says two distant
  // branches touch.
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const parent = new Map<string, string>();
  const children = new Map<string, string[]>();
  const depth = new Map<string, number>([[hub.id, 0]]);
  const queue = [hub.id];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const id = queue[cursor]!;
    // Heaviest crosswalk first, so a catalog hangs off the framework it is
    // most bound to when several could claim it.
    const next = [...(partners.get(id) || [])]
      .filter((candidate) => !depth.has(candidate) && nodeById.has(candidate))
      .sort((a, b) => (weight.get(b) || 0) - (weight.get(a) || 0) || a.localeCompare(b));
    for (const child of next) {
      if (depth.has(child)) continue;
      depth.set(child, (depth.get(id) || 0) + 1);
      parent.set(child, id);
      children.set(id, [...(children.get(id) || []), child]);
      queue.push(child);
    }
  }

  // Siblings that crosswalk to each other are seated next to each other.
  //
  // The tree only decides who hangs off whom; two children of the same parent
  // can still be joined, and if they land on opposite sides of the circle that
  // one edge has to cross every branch between them. Chaining each run of
  // connected siblings before laying them out keeps those edges short — it is
  // why FIPS 199 ends up beside the 800-53B baselines and the 800-37 process
  // it belongs with, instead of a diagram-width away from both.
  for (const [id, kids] of children) {
    if (kids.length < 3) continue;
    const remaining = new Set(kids);
    const ordered: string[] = [];
    const heaviestOf = (pool: Iterable<string>) =>
      [...pool].sort((a, b) => (weight.get(b) || 0) - (weight.get(a) || 0) || a.localeCompare(b))[0];
    let current: string | undefined = kids[0];
    while (remaining.size) {
      if (!current || !remaining.has(current)) current = heaviestOf(remaining);
      ordered.push(current!);
      remaining.delete(current!);
      const joined = [...remaining].filter((other) => partners.get(current!)?.has(other));
      current = joined.length ? heaviestOf(joined) : undefined;
    }
    children.set(id, ordered);
  }

  // Angular space is shared out by how many leaves a branch ends in, so a wide
  // branch is not squeezed into the same wedge as a single catalog.
  const leaves = new Map<string, number>();
  function countLeaves(id: string): number {
    const kids = children.get(id) || [];
    const total = kids.length ? kids.reduce((sum, kid) => sum + countLeaves(kid), 0) : 1;
    leaves.set(id, total);
    return total;
  }
  countLeaves(hub.id);

  const RADIUS = [0, 1.05, 1.82, 2.42, 2.92];
  function place(id: string, from: number, to: number) {
    const level = depth.get(id) || 0;
    const middle = (from + to) / 2;
    const node = nodeById.get(id);
    if (node && level > 0) {
      const radius = RADIUS[Math.min(level, RADIUS.length - 1)]!;
      node.x = stable(Math.cos(middle) * radius);
      node.y = stable(Math.sin(middle) * radius);
    }
    const kids = children.get(id) || [];
    if (!kids.length) return;
    // Damped rather than proportional: a branch ending in four catalogs does
    // need more of the circle than one ending in a single catalog, but not four
    // times more, or the single ones are pinched into slivers their labels
    // cannot sit in.
    const share = (id: string) => Math.pow(leaves.get(id) || 1, 0.55);
    const total = kids.reduce((sum, kid) => sum + share(kid), 0) || 1;
    let cursor = from;
    for (const kid of kids) {
      const span = (to - from) * (share(kid) / total);
      place(kid, cursor, cursor + span);
      cursor += span;
    }
  }
  // Start at twelve o'clock so the busiest branch reads top-first.
  place(hub.id, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2);

  // Catalogs nothing crosswalks to are not part of this picture and are listed
  // beside it instead; parking them at the origin keeps them out of the way of
  // a layout that has no place for them.
  for (const node of nodes) {
    if (!depth.has(node.id)) {
      node.x = 0;
      node.y = 0;
    }
  }
}
function assignCoordinates(
  level: AtlasProjectionLevel,
  nodes: AtlasProjectionNode[],
  edges: AtlasProjectionEdge[],
) {
  if (level === "landscape") {
    nodes.forEach((node, index) => {
      const point = LANDSCAPE_POSITIONS[node.id] || [Math.cos(index) * 1.5, Math.sin(index) * 1.2];
      node.x = point[0]; node.y = point[1];
    });
    return;
  }
  if (level === "frameworks") {
    assignFrameworkCoordinates(nodes, edges);
    return;
  }
  const context = nodes.find((node) => node.id.startsWith("context:"));
  if (context) {
    context.x = 0;
    context.y = 0;
  }
  const positioned = [...nodes]
    .filter((node) => node !== context)
    .sort((a, b) => a.id.localeCompare(b.id));
  positioned.forEach((node, index, all) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / Math.max(1, all.length);
    const radius = level === "detail" ? 1.25 : 1.55;
    node.x = stable(Math.cos(angle) * radius); node.y = stable(Math.sin(angle) * radius);
  });
}

function buildProjection(options: {
  id: string; level: AtlasProjectionLevel; label: string; description: string;
  graph: AtlasGraph; descriptors: Descriptor[]; edgeLimit: number;
}): AtlasGraphProjection {
  const nodes = options.descriptors.map((descriptor) => ({
    ...descriptor,
    canonicalNodeIds: [...descriptor.canonicalNodeIds].sort(),
    canonicalRecordCount: descriptor.canonicalNodeIds.length,
    internalRelationshipCount: 0,
    importance: Math.min(10, 1 + Math.log1p(descriptor.canonicalNodeIds.length)),
    x: 0, y: 0,
  }));
  const membership = new Map<string, string>();
  for (const node of nodes) for (const canonicalId of node.canonicalNodeIds) {
    const previous = membership.get(canonicalId);
    if (previous) throw new Error(`Atlas projection ${options.id} maps ${canonicalId} to both ${previous} and ${node.id}.`);
    membership.set(canonicalId, node.id);
  }
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const buckets = new Map<string, EdgeBucket>();
  options.graph.forEachEdge((edgeId, attributes, sourceId, targetId) => {
    const source = membership.get(sourceId); const target = membership.get(targetId);
    if (!source || !target) return;
    if (source === target) { nodeById.get(source)!.internalRelationshipCount += 1; return; }
    const directed = attributes.display.directed;
    const [left, right] = directed || source.localeCompare(target) <= 0 ? [source, target] : [target, source];
    const key = `${directed ? "d" : "u"}:${left}\u0000${right}`;
    const bucket = buckets.get(key) || {
      source: left, target: right, canonicalEdgeIds: [], connectionSourceIds: [], relationshipTypes: [], relationshipClasses: [],
      directedCount: 0, undirectedCount: 0, types: new Set<string>(), classes: new Set<string>(), sources: new Set<string>(),
    };
    bucket.canonicalEdgeIds.push(edgeId);
    bucket.types.add(asText(attributes.display.relationshipType) || "unspecified");
    bucket.classes.add(asText(attributes.display.relationshipClass) || "unspecified");
    sourceIds(attributes.source).forEach((id) => bucket.sources.add(id));
    if (directed) bucket.directedCount += 1; else bucket.undirectedCount += 1;
    buckets.set(key, bucket);
  });
  const allEdges = [...buckets.entries()].map(([key, bucket]) => ({
    id: `aggregate:${options.id}:${key}`, source: bucket.source, target: bucket.target,
    canonicalEdgeIds: bucket.canonicalEdgeIds.sort(), connectionSourceIds: [...bucket.sources].sort(),
    relationshipCount: bucket.canonicalEdgeIds.length, relationshipTypes: [...bucket.types].sort(), relationshipClasses: [...bucket.classes].sort(),
    directedCount: bucket.directedCount, undirectedCount: bucket.undirectedCount,
  })).sort((a, b) => b.relationshipCount - a.relationshipCount || a.id.localeCompare(b.id));
  const edges = allEdges.slice(0, options.edgeLimit);
  assignCoordinates(options.level, nodes, edges);
  return {
    id: options.id, level: options.level, label: options.label, description: options.description,
    nodes: nodes.sort((a, b) => a.id.localeCompare(b.id)), edges,
    representedCanonicalNodeCount: membership.size,
    representedCanonicalRelationshipCount: edges.reduce((sum, edge) => sum + edge.relationshipCount, 0),
    suppressedRelationshipCount: allEdges.slice(options.edgeLimit).reduce((sum, edge) => sum + edge.relationshipCount, 0),
  };
}

function descriptor(options: {
  id: string; label: string; description: string; nodeType: string; ids: string[];
  ecosystemId?: string; areaId?: string; publicationId?: string; layer?: AtlasProjectionNode["objectLayer"];
  lifecycleStatus?: string; version?: string;
  publicationKind?: string;
  publisherItemId?: string;
  includesContainerRecord?: boolean;
  structureRole?: AtlasProjectionNode["atlasStructureRole"]; native?: string; atlasClass?: string; drill?: AtlasProjectionDrill;
}): Descriptor {
  return {
    id: options.id, label: options.label, description: options.description, nodeType: options.nodeType,
    nativeType: options.native || (options.layer === "atlas_structure" ? "" : options.nodeType), atlasClass: options.atlasClass || "",
    objectLayer: options.layer || "publisher_content", atlasStructureRole: options.structureRole || "",
    publisherEcosystemId: options.ecosystemId || "", areaId: options.areaId || "", publicationId: options.publicationId || "",
    lifecycleStatus: options.lifecycleStatus || "", version: options.version || "",
    publicationKind: options.publicationKind || "",
    publisherItemId: options.publisherItemId || "",
    includesContainerRecord: options.includesContainerRecord === true,
    canonicalNodeIds: options.ids, drill: options.drill,
  };
}

function detailFor(graph: AtlasGraph, parent: AtlasProjectionNode) {
  if (parent.canonicalNodeIds.length < 2 || parent.canonicalNodeIds.length > 250) return null;
  return buildProjection({
    id: projectionId("detail", parent.id), level: "detail", label: parent.label,
    description: `${parent.canonicalNodeIds.length.toLocaleString()} publisher-native records.`, graph, edgeLimit: 150,
    descriptors: parent.canonicalNodeIds.map((id) => {
      const source = graph.getNodeAttribute(id, "source"); const layer = objectLayer(source);
      return descriptor({ id, label: recordLabel(source), description: asText(metadata(source).description), nodeType: asText(source.node_type),
        publisherItemId: asText(metadata(source).publisher_item_id),
        native: nativeType(source), atlasClass: atlasClass(source), layer,
        structureRole: source.node_type === "trunk" ? "root" : source.node_type === "limb" ? "area" : "",
        ecosystemId: parent.publisherEcosystemId, areaId: parent.areaId,
        publicationId: parent.publicationId, lifecycleStatus: parent.lifecycleStatus, version: parent.version,
        ids: [id], drill: { kind: "record", targetId: id } });
    }),
  });
}

/**
 * Below this an overlap is coincidence rather than a finding, and saying so
 * would add noise to the one picture that has to stay readable.
 */
const MIN_SHARED_GROUND = 3;

/**
 * Derives framework pairs that meet on the same records. Reads published edges
 * only, and reports what the overlap is made of rather than asserting a
 * mapping that no publisher wrote.
 */
function buildSharedGround(options: {
  graph: AtlasGraph;
  catalogOf: Map<string, string>;
  nodeIdForCatalog: Map<string, string>;
  publishedPairs: Set<string>;
}): AtlasSharedGroundEdge[] {
  const { graph, catalogOf, nodeIdForCatalog, publishedPairs } = options;
  // Which outside records each catalog maps to.
  const selects = new Map<string, Set<string>>();
  graph.forEachEdge((_id, _attributes, sourceId, targetId) => {
    const from = catalogOf.get(sourceId);
    const to = catalogOf.get(targetId);
    if (!from || !to || from === to) return;
    if (!selects.has(from)) selects.set(from, new Set());
    if (!selects.has(to)) selects.set(to, new Set());
    selects.get(from)!.add(targetId);
    selects.get(to)!.add(sourceId);
  });
  const catalogs = [...selects.keys()].filter((id) => nodeIdForCatalog.has(id)).sort();
  const derived: AtlasSharedGroundEdge[] = [];
  for (let left = 0; left < catalogs.length; left += 1) {
    for (let right = left + 1; right < catalogs.length; right += 1) {
      const a = catalogs[left]!;
      const b = catalogs[right]!;
      // A published mapping is the better answer; overlap only speaks where
      // nobody has spoken.
      if (publishedPairs.has(`${a}|${b}`)) continue;
      const mine = selects.get(a)!;
      const theirs = selects.get(b)!;
      const [small, large] = mine.size <= theirs.size ? [mine, theirs] : [theirs, mine];
      const shared: string[] = [];
      for (const id of small) {
        if (!large.has(id)) continue;
        const owner = catalogOf.get(id);
        if (owner === a || owner === b) continue;
        shared.push(id);
      }
      if (shared.length < MIN_SHARED_GROUND) continue;
      const byCatalog = new Map<string, number>();
      for (const id of shared) {
        const owner = catalogOf.get(id) || "";
        if (owner) byCatalog.set(owner, (byCatalog.get(owner) || 0) + 1);
      }
      shared.sort();
      const viaCatalogs = new Set(shared.map((id) => catalogOf.get(id) || ""));
      const withinVia = (pool: Set<string>) => {
        let count = 0;
        for (const id of pool) if (viaCatalogs.has(catalogOf.get(id) || "")) count += 1;
        return count;
      };
      const narrower = Math.min(withinVia(mine), withinVia(theirs)) || 1;
      derived.push({
        id: `shared:${a} ${b}`,
        source: nodeIdForCatalog.get(a)!,
        target: nodeIdForCatalog.get(b)!,
        sharedCount: shared.length,
        overlapRatio: Number((shared.length / narrower).toFixed(3)),
        viaPublicationIds: [...byCatalog.entries()]
          .sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))
          .map(([id]) => id),
        sampleNodeIds: shared.slice(0, 8),
      });
    }
  }
  return derived.sort((x, y) => y.sharedCount - x.sharedCount || x.id.localeCompare(y.id));
}

/** Builds presentation-only graph projections; it never writes canonical graph attributes or relationships. */
export function buildAtlasSemanticProjections(options: {
  graph: AtlasGraph; model: AtlasTreeModel; generatedAt: string; catalogMemberships: AtlasCatalogMembership[];
}): AtlasSemanticProjectionArtifact {
  const { graph, model } = options;
  const membershipByCatalog = new Map(options.catalogMemberships.map((entry) => [entry.catalogId, entry]));
  const ecosystemMemberships = new Map<string, AtlasCatalogMembership[]>();
  for (const membership of options.catalogMemberships) {
    const entries = ecosystemMemberships.get(membership.ecosystemId) || [];
    entries.push(membership);
    ecosystemMemberships.set(membership.ecosystemId, entries);
  }
  const areaForCatalog = new Map(model.publications.filter((node) => node.parentId).map((node) => [publicationCatalogId(node), node.parentId!]));
  const idsForArea = new Map(model.areas.map((area) => [area.id, [] as string[]]));
  const idsForEcosystem = new Map([...ecosystemMemberships.keys()].map((id) => [id, [] as string[]]));
  const authorityIds = new Map(AUTHORITY_GROUPS.map(([id]) => [id, [] as string[]]));
  const trunkIds: string[] = []; const unclassified: string[] = [];
  const locations: Record<string, AtlasRecordLocation> = {};
  for (const id of graph.nodes()) {
    const source = graph.getNodeAttribute(id, "source"); const catalog = catalogId(source);
    const area = areaForCatalog.get(catalog) || (idsForArea.has(id) ? id : "");
    const ecosystem = membershipByCatalog.get(catalog)?.ecosystemId || "";
    const authority = AUTHORITY_GROUPS.find(([, , , type]) => type === source.node_type);
    if (authority) authorityIds.get(authority[0])!.push(id);
    else if (id === ATLAS_TRUNK_ID) trunkIds.push(id);
    else if (source.node_type === "limb" || source.source_id === "control-atlas-structure") {
      // Editorial organizing nodes remain available to legacy routes but are
      // not publisher/source ecosystems.
    } else if (ecosystem) idsForEcosystem.get(ecosystem)!.push(id);
    else if (!catalog) unclassified.push(id);
    if (area) idsForArea.get(area)!.push(id);
    if (area && catalog) locations[id] = {
      ecosystemId: ecosystem,
      areaId: area,
      publicationId: catalog,
      label: recordLabel(source),
      nodeType: asText(source.node_type),
    };
  }
  const landscape = enforceNodeBudget(buildProjection({
    id: projectionId("landscape", "control-atlas"), level: "landscape", label: "Cybersecurity landscape",
    description: "Published cybersecurity sources grouped by their publisher or source ecosystem. Open one to follow the publisher-native structure.", graph, edgeLimit: 32,
    descriptors: [
      descriptor({ id: ATLAS_TRUNK_ID, label: model.trunk.label, description: model.trunk.blurb, nodeType: "trunk", ids: trunkIds, layer: "atlas_structure", structureRole: "root" }),
      ...[...ecosystemMemberships.entries()].map(([id, memberships]) => descriptor({
        id,
        label: memberships[0]!.ecosystemLabel,
        description: memberships[0]!.ecosystemDescription,
        nodeType: "publisher_ecosystem",
        ids: idsForEcosystem.get(id) || [],
        layer: "publisher_content",
        structureRole: "publisher_ecosystem",
        ecosystemId: id,
        drill: { kind: "ecosystem", targetId: id },
      })),
      ...AUTHORITY_GROUPS.map(([id, label, description]) => descriptor({ id, label, description, nodeType: "authority_aggregate", ids: authorityIds.get(id) || [], layer: "authority_document" })).filter((item) => item.canonicalNodeIds.length),
      ...(unclassified.length ? [descriptor({ id: "derived:unclassified", label: "Unclassified published records", description: "An explicit presentation exception, not an Atlas taxonomy.", nodeType: "derived_aggregate", ids: unclassified })] : []),
    ],
  }), LANDSCAPE_NODE_BUDGET);
  // One pass over the graph for every per-catalog membership below, instead of
  // a full scan per publication.
  const idsForCatalog = new Map<string, string[]>();
  for (const id of graph.nodes()) {
    const catalog = catalogId(graph.getNodeAttribute(id, "source"));
    if (!catalog) continue;
    const entries = idsForCatalog.get(catalog) || [];
    entries.push(id);
    idsForCatalog.set(catalog, entries);
  }
  const frameworks = enforceNodeBudget(buildProjection({
    id: projectionId("frameworks", "control-atlas"), level: "frameworks", label: "Frameworks and their crosswalks",
    description: "Every published framework, sized by how much it holds and joined by the crosswalks between them. Open one to follow its own structure.",
    graph, edgeLimit: 160,
    descriptors: model.publications
      .map((publication) => {
        const publicationId = publicationCatalogId(publication);
        const membership = membershipByCatalog.get(publicationId);
        const ids = idsForCatalog.get(publicationId) || [];
        if (!ids.length) return null;
        return descriptor({
          id: publication.id,
          label: publication.label,
          description: membership?.publicationDescription || publication.blurb,
          nodeType: "catalog",
          native: "catalog",
          ids,
          ecosystemId: membership?.ecosystemId,
          areaId: publication.parentId || "",
          publicationId,
          lifecycleStatus: membership?.lifecycleStatus,
          version: membership?.version,
          publicationKind: membership?.publicationKind,
          includesContainerRecord: true,
          drill: { kind: "publication", targetId: publicationId },
        });
      })
      .filter((entry): entry is Descriptor => Boolean(entry)),
  }), FRAMEWORK_NODE_BUDGET);
  const ecosystems: Record<string, AtlasGraphProjection> = {};
  const areas: Record<string, AtlasGraphProjection> = {};
  const publications: Record<string, AtlasGraphProjection> = {};
  const details: Record<string, AtlasGraphProjection> = {};
  for (const [ecosystemId, memberships] of ecosystemMemberships) {
    const first = memberships[0]!;
    ecosystems[ecosystemId] = enforceNodeBudget(buildProjection({
      id: projectionId("ecosystem", ecosystemId),
      level: "ecosystem",
      label: first.ecosystemLabel,
      description: first.ecosystemDescription,
      graph,
      edgeLimit: 48,
      descriptors: memberships
        .map((membership) => {
          const publication = model.publications.find((entry) => publicationCatalogId(entry) === membership.catalogId);
          if (!publication) return null;
          const ids = idsForCatalog.get(membership.catalogId) || [];
          return descriptor({
            id: publication.id,
            label: publication.label,
            description: membership.publicationDescription || publication.blurb,
            nodeType: "catalog",
            native: "catalog",
            ids,
            ecosystemId,
            areaId: publication.parentId || "",
            publicationId: membership.catalogId,
            lifecycleStatus: membership.lifecycleStatus,
            version: membership.version,
            publicationKind: membership.publicationKind,
            includesContainerRecord: true,
            drill: { kind: "publication", targetId: membership.catalogId },
          });
        })
        .filter((entry): entry is Descriptor => Boolean(entry)),
    }), { max: AREA_NODE_BUDGET_MAX });
  }
  for (const area of model.areas) {
    const publicationNodes = model.publications.filter((publication) => publication.parentId === area.id);
    areas[area.id] = enforceNodeBudget(buildProjection({ id: projectionId("area", area.id), level: "area", label: area.label, description: area.blurb, graph, edgeLimit: 48,
      descriptors: [
        descriptor({ id: `context:${area.id}`, label: area.label, description: area.blurb, nodeType: "limb", ids: graph.hasNode(area.id) ? [area.id] : [], layer: "atlas_structure", structureRole: "area", areaId: area.id, includesContainerRecord: true }),
        ...publicationNodes.map((publication) => {
          const publicationId = publicationCatalogId(publication);
          const ids = idsForCatalog.get(publicationId) || [];
          const membership = membershipByCatalog.get(publicationId);
          return descriptor({ id: publication.id, label: publication.label, description: membership?.publicationDescription || publication.blurb, nodeType: "catalog", native: "catalog", ids,
            ecosystemId: membership?.ecosystemId, areaId: area.id, publicationId,
            lifecycleStatus: membership?.lifecycleStatus, version: membership?.version,
            publicationKind: membership?.publicationKind,
            includesContainerRecord: true,
            drill: { kind: "publication", targetId: publicationId } });
        }),
      ],
    }), { max: AREA_NODE_BUDGET_MAX });
  }
  for (const publication of model.publications) {
    const publicationId = publicationCatalogId(publication);
    const membership = membershipByCatalog.get(publicationId);
    const publicationIds = idsForCatalog.get(publicationId) || [];
    const grouped = new Map<string, string[]>();
    for (const id of publicationIds) {
      if (id === publication.id) continue;
      const source = graph.getNodeAttribute(id, "source"); const meta = metadata(source);
      const group = asText(meta.benchmark_title) || asText(meta.benchmark_id) || asText(meta.family) || nativeType(source) || "Other publisher records";
      const entries = grouped.get(group) || []; entries.push(id); grouped.set(group, entries);
    }
    const nativeGroups = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
    const groupChunks = nativeGroups.length > 48
      ? Array.from({ length: Math.ceil(nativeGroups.length / 48) }, (_, index) => nativeGroups.slice(index * 48, index * 48 + 48))
      : nativeGroups.map((entry) => [entry]);
    const groupDescriptors = groupChunks.map((chunk, index) => {
      const ids = chunk.flatMap(([, entries]) => entries).sort();
      const label = chunk.length === 1 ? chunk[0]![0] : `${chunk[0]![0]}–${chunk.at(-1)![0]}`;
      return descriptor({ id: `group:${publicationId}:${index}`, label, description: `${ids.length.toLocaleString()} publisher-native records.`, nodeType: "publisher_group", ids,
        ecosystemId: membership?.ecosystemId, areaId: publication.parentId || "", publicationId,
        lifecycleStatus: membership?.lifecycleStatus, version: membership?.version });
    });
    const projection = buildProjection({ id: projectionId("publication", publicationId), level: "publication", label: publication.label, description: membership?.publicationDescription || publication.blurb, graph, edgeLimit: 96,
      descriptors: [descriptor({ id: `context:${publication.id}`, label: publication.label, description: membership?.publicationDescription || publication.blurb, nodeType: "catalog", native: "catalog", ids: publicationIds.filter((id) => id === publication.id),
        ecosystemId: membership?.ecosystemId, areaId: publication.parentId || "", publicationId,
        lifecycleStatus: membership?.lifecycleStatus, version: membership?.version,
        publicationKind: membership?.publicationKind, includesContainerRecord: true }), ...groupDescriptors],
    });
    projection.nodes.forEach((node) => {
      const detail = detailFor(graph, node);
      if (!detail) return;
      node.drill = { kind: "detail", targetId: node.id };
      details[node.id] = detail;
      node.canonicalNodeIds.forEach((canonicalId) => {
        if (locations[canonicalId]) locations[canonicalId].detailId = node.id;
      });
    });
    publications[publicationId] = projection;
  }
  const catalogOf = new Map<string, string>();
  for (const [catalog, ids] of idsForCatalog) {
    for (const id of ids) catalogOf.set(id, catalog);
  }
  const nodeIdForCatalog = new Map(
    frameworks.nodes.map((node) => [node.publicationId, node.id]),
  );
  const publishedPairs = new Set(
    frameworks.edges.map((edge) => {
      const from = frameworks.nodes.find((node) => node.id === edge.source)?.publicationId || "";
      const to = frameworks.nodes.find((node) => node.id === edge.target)?.publicationId || "";
      return [from, to].sort().join("|");
    }),
  );
  const sharedGround = buildSharedGround({ graph, catalogOf, nodeIdForCatalog, publishedPairs });

  return { schema_version: "2.2", generated_at: options.generatedAt, canonical: { node_count: graph.order, edge_count: graph.size }, landscape, frameworks, framework_shared_ground: sharedGround, ecosystems, areas, publications, details, record_locations: locations };
}
