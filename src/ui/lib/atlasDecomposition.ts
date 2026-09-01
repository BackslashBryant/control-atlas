import treeSpine from "../../../data/curated/tree-spine.json";

import type {
  AtlasGraphProjection,
  AtlasProjectionDrill,
  AtlasProjectionNode,
  AtlasSemanticProjectionArtifact,
} from "./atlasGraphProjection";

/**
 * The Atlas data is a complete containment tree: every canonical record is
 * reachable from the root with no orphans. This models it as a decomposition
 * tree — one column per level, each row labelled with a real name and a real
 * count, and the selected row connected to the level it opens.
 *
 * A decomposition tree rather than a node-link graph because every node keeps a
 * readable label at every depth, which is exactly what a force or radial layout
 * cannot promise once a level holds more than a handful of items.
 */

export type AtlasTreeRow = {
  id: string;
  label: string;
  description: string;
  /** Records contained by this row, excluding the row itself. Always 0 for a leaf. */
  count: number;
  /** Magnitude bar fill, 0..1, relative to the largest row in the same column. */
  share: number;
  drill?: AtlasProjectionDrill;
  /** A container holding nothing. Never offers a drill. */
  empty: boolean;
  /** A leaf record. Reports a kind rather than a count. */
  leaf: boolean;
  kind: string;
  lifecycleStatus: string;
  version: string;
  publicationKind: string;
  /** Rows group under a heading when a column mixes two kinds of thing. */
  group: "" | "ecosystem" | "area" | "authority";
  /**
   * Where an area lives when its content is not a published catalog.
   *
   * Knowledge and Operations hold real content — the resource directory and
   * the operations templates — but neither is a federal catalog, so neither
   * is in the record graph. tree-spine.json has carried a destination for
   * both since the spine was authored, with the note "so no area is ever
   * shown empty". Nothing read it, so the Atlas fell back to a zero count and
   * labelled them "Not yet modeled", which was never true.
   */
  destination?: AtlasAreaDestination;
};

export type AtlasAreaDestination = {
  view: string;
  actionLabel: string;
  summary: string;
};

const AREA_DESTINATIONS = ((treeSpine as { areaDestinations?: Record<string, AtlasAreaDestination> })
  .areaDestinations || {}) as Record<string, AtlasAreaDestination>;

export function areaDestinationFor(id: string): AtlasAreaDestination | undefined {
  return AREA_DESTINATIONS[id];
}

export type AtlasTreeColumn = {
  key: "area" | "publication" | "detail" | "record";
  title: string;
  caption: string;
  rows: AtlasTreeRow[];
  /** Index of the opened row, or -1 when nothing in this column is open. */
  selectedIndex: number;
};

export type AtlasTreeStep = {
  id: string;
  label: string;
  level: "root" | "ecosystem" | "area" | "publication" | "detail";
};

export type AtlasTreeModel = {
  columns: AtlasTreeColumn[];
  /** Clickable ancestry, root first. The last entry is the current scope. */
  path: AtlasTreeStep[];
  scopeCount: number;
  scopeDescription: string;
};

/**
 * One branch holds 81% of the corpus. Raw proportion would collapse every other
 * branch to an invisible sliver, so magnitude uses a compressed power scale:
 * large branches still read as clearly dominant, small ones stay visible.
 */
const MAGNITUDE_EXPONENT = 0.55;
/** Floor so "few" never renders as "none". */
const MIN_SHARE = 0.05;

export function magnitudeShare(count: number, max: number): number {
  if (count <= 0 || max <= 0) return 0;
  const scaled = Math.pow(count, MAGNITUDE_EXPONENT) / Math.pow(max, MAGNITUDE_EXPONENT);
  return Math.max(MIN_SHARE, Math.min(1, Math.round(scaled * 1000) / 1000));
}

/** The projection carries a `context:` node for the parent itself; it is not a child. */
function isContextNode(node: AtlasProjectionNode): boolean {
  return node.id.startsWith("context:");
}

/**
 * `canonicalRecordCount` includes the node itself, so a container holding
 * nothing reports 1. Subtracting it is what stops empty areas reading as
 * populated. A leaf legitimately reports 1 and has nothing inside it.
 */
function containedCount(node: AtlasProjectionNode): number {
  if (node.drill?.kind === "record") return 0;
  return Math.max(
    0,
    (node.canonicalRecordCount || 0) - (node.includesContainerRecord ? 1 : 0),
  );
}

/** Turns a stored type token into ordinary product language. */
function readableKind(node: AtlasProjectionNode): string {
  const raw = node.nativeType || node.nodeType || "";
  if (!raw) return "Record";
  return raw.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const naturalOrder = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

const GROUP_ORDER: Record<AtlasTreeRow["group"], number> = {
  ecosystem: 0,
  area: 1,
  authority: 2,
  "": 3,
};

function groupOf(node: AtlasProjectionNode): AtlasTreeRow["group"] {
  if (node.atlasStructureRole === "publisher_ecosystem") return "ecosystem";
  if (node.atlasStructureRole === "area") return "area";
  if (node.objectLayer === "authority_document") return "authority";
  return "";
}

function toRow(node: AtlasProjectionNode): AtlasTreeRow {
  const leaf = node.drill?.kind === "record";
  const count = containedCount(node);
  const empty = !leaf && count === 0;
  return {
    id: node.id,
    label: node.label,
    description: node.description || "",
    count,
    share: 0,
    drill: empty ? undefined : node.drill,
    empty,
    leaf,
    kind: leaf ? readableKind(node) : "",
    lifecycleStatus: node.lifecycleStatus,
    version: node.version,
    publicationKind: node.publicationKind,
    destination: empty ? areaDestinationFor(node.id) : undefined,
    group: groupOf(node),
  };
}

function compareRows(a: AtlasTreeRow, b: AtlasTreeRow): number {
  const byGroup = GROUP_ORDER[a.group] - GROUP_ORDER[b.group];
  if (byGroup !== 0) return byGroup;
  if (a.leaf && b.leaf) return naturalOrder.compare(a.label, b.label);
  return b.count - a.count || naturalOrder.compare(a.label, b.label);
}

/** Shares are relative to the column, so each level is readable on its own terms. */
function withShares(rows: AtlasTreeRow[]): AtlasTreeRow[] {
  const max = rows.reduce((peak, row) => Math.max(peak, row.count), 0);
  return rows.map((row) => ({ ...row, share: magnitudeShare(row.count, max) }));
}

function rowsFrom(projection: AtlasGraphProjection): AtlasTreeRow[] {
  return withShares(
    projection.nodes.filter((node) => !isContextNode(node)).map(toRow).sort(compareRows),
  );
}

export type AtlasDecompositionScope = {
  areaId: string;
  publicationId: string;
  detailId: string;
};

/**
 * Beyond three side-by-side columns the labels stop being readable, so deeper
 * scopes slide the window forward and the breadcrumb carries the ancestors.
 */
export const VISIBLE_COLUMN_LIMIT = 3;

/** Columns longer than this collapse their tail behind an explicit control. */
export const COLUMN_VISIBLE_LIMIT = 14;

export function splitColumnRows(
  rows: AtlasTreeRow[],
  expanded: boolean,
): { visible: AtlasTreeRow[]; hidden: number } {
  if (expanded || rows.length <= COLUMN_VISIBLE_LIMIT) {
    return { visible: rows, hidden: 0 };
  }
  return { visible: rows.slice(0, COLUMN_VISIBLE_LIMIT), hidden: rows.length - COLUMN_VISIBLE_LIMIT };
}

export function buildAtlasTree(
  artifact: AtlasSemanticProjectionArtifact,
  scope: AtlasDecompositionScope,
): AtlasTreeModel {
  const columns: AtlasTreeColumn[] = [];
  const path: AtlasTreeStep[] = [{ id: "", label: "Cybersecurity", level: "root" }];

  const areaRows = withShares(
    artifact.landscape.nodes
      .filter((node) => node.atlasStructureRole !== "root")
      .map(toRow)
      .sort(compareRows),
  );
  columns.push({
    key: "area",
    title: "Publishers & sources",
    caption: "Authoritative ecosystems represented in Control Atlas",
    rows: areaRows,
    selectedIndex: areaRows.findIndex((row) => row.id === scope.areaId),
  });

  const ecosystemProjection = scope.areaId ? artifact.ecosystems[scope.areaId] : undefined;
  const areaProjection = ecosystemProjection || (scope.areaId ? artifact.areas[scope.areaId] : undefined);
  if (areaProjection) {
    const rows = rowsFrom(areaProjection);
    const selectedId = scope.publicationId ? `${scope.publicationId}:CATALOG` : "";
    path.push({
      id: scope.areaId,
      label: areaProjection.label,
      level: ecosystemProjection ? "ecosystem" : "area",
    });
    columns.push({
      key: "publication",
      title: "Publications",
      caption: ecosystemProjection
        ? `Authoritative sources from ${areaProjection.label}`
        : `Published in ${areaProjection.label}`,
      rows,
      selectedIndex: rows.findIndex((row) => row.id === selectedId),
    });
  }

  const publicationProjection =
    areaProjection && scope.publicationId ? artifact.publications[scope.publicationId] : undefined;
  if (publicationProjection) {
    const rows = rowsFrom(publicationProjection);
    path.push({
      id: scope.publicationId,
      label: publicationProjection.label,
      level: "publication",
    });
    columns.push({
      key: "detail",
      title: "Sections",
      caption: `Inside ${publicationProjection.label}`,
      rows,
      selectedIndex: rows.findIndex((row) => row.id === scope.detailId),
    });
  }

  const detailProjection =
    publicationProjection && scope.detailId ? artifact.details[scope.detailId] : undefined;
  if (detailProjection) {
    const rows = rowsFrom(detailProjection);
    path.push({ id: scope.detailId, label: detailProjection.label, level: "detail" });
    columns.push({
      key: "record",
      title: "Records",
      caption: `Inside ${detailProjection.label}`,
      rows,
      selectedIndex: -1,
    });
  }

  const current = detailProjection || publicationProjection || areaProjection;
  // Context rows carry the opened container but are not part of the visible record column.
  const hiddenContextRecordCount = current
    ? current.nodes
        .filter(isContextNode)
        .reduce((sum, node) => sum + (node.canonicalRecordCount || 0), 0)
    : 0;
  const scopeCount = current
    ? Math.max(0, (current.representedCanonicalNodeCount || 0) - hiddenContextRecordCount)
    : areaRows.reduce((sum, row) => sum + row.count, 0);

  return {
    columns: columns.slice(-VISIBLE_COLUMN_LIMIT),
    path,
    scopeCount,
    scopeDescription: current ? current.description || "" : "",
  };
}
