import { lazy, Suspense, useMemo, useState } from "react";

import {
  type AtlasConnectionGroup,
  type AtlasRelationshipRow,
} from "../lib/atlasModel";
import { RELATIONSHIP_LENS_LEGEND, lensColor } from "../lib/graphTheme";
import { Badge } from "../lib/pagePrimitives";
import type { AtlasNeighborhoodNode } from "../lib/runtimeLoader";

const RelationshipGraph = lazy(() => import("./RelationshipGraph"));

type AtlasConnectionMapProps = {
  center: AtlasNeighborhoodNode;
  groups: AtlasConnectionGroup[];
  // Despite the name (kept to avoid touching the URL param it's persisted
  // under), this carries a relationship-LENS key here (e.g.
  // "implementation"), not one source group's id — see the lens-summary
  // comment below.
  expandedGroupId: string;
  compact: boolean;
  selectedItemId: string;
  onExpandedGroupChange: (lensKey: string) => void;
  onOpenList: () => void;
  onSelectItem: (row: AtlasRelationshipRow) => void;
};

export function AtlasConnectionMap(props: AtlasConnectionMapProps) {
  const {
    center,
    groups,
    expandedGroupId,
    compact,
    selectedItemId,
    onExpandedGroupChange,
    onOpenList,
    onSelectItem,
  } = props;
  const [showGraph, setShowGraph] = useState(false);
  // Structure (base control / enhancements) is publisher-declared parentage,
  // never a peer of applicability/implementation/cross-framework correlation
  // (docs/tree-model.md's four relationship classes). Rendered as its own
  // full set of structural-child tags, never mixed with the lens summary
  // below.
  const structureGroups = groups.filter(
    (group) => group.lens === "structure" && group.items.length > 0,
  );
  const explorationGroups = groups.filter((group) => group.lens !== "structure");
  // The default view answers one question at a time: "what kinds of
  // relationships does this record have, and how many of each" (the lens
  // summary), then "show me that one" (the selected lens's own record
  // list) — never a mixed diagram of every kind of relationship at once.
  // `expandedGroupId` carries a LENS key here (e.g. "implementation"), not
  // one source group's id — a lens can bundle more than one source group
  // (Applicability = NIST baselines + FedRAMP baselines).
  const groupsByLens = RELATIONSHIP_LENS_LEGEND.map((entry) => ({
    entry,
    groups: explorationGroups.filter((group) => group.lens === entry.key),
    total: explorationGroups
      .filter((group) => group.lens === entry.key)
      .reduce((sum, group) => sum + group.items.length, 0),
  })).filter(({ groups: lensGroups }) => lensGroups.length > 0);
  const activeLensKey =
    expandedGroupId || (groupsByLens.length ? groupsByLens[0].entry.key : "");
  const activeLens = groupsByLens.find(
    (entry) => entry.entry.key === activeLensKey,
  );
  const activeItems = useMemo(
    () =>
      activeLens
        ? activeLens.groups
            .flatMap((group) =>
              group.items.map((row) => ({ row, groupLabel: group.label })),
            )
            .sort((left, right) => left.row.itemId.localeCompare(right.row.itemId))
        : [],
    [activeLens],
  );
  const visibleRows = activeItems.slice(0, compact ? 8 : 14).map((e) => e.row);
  const groupLabelByNodeId = new Map(
    activeItems.map((e) => [e.row.counterpart.id, e.groupLabel] as const),
  );
  const rowByNodeId = new Map(
    visibleRows.map((row) => [row.counterpart.id, row]),
  );
  // Color nodes/edges by relationship class (docs/tree-model.md), not by
  // source/publisher — the class (applicability vs correlation vs
  // implementation vs assessment) is the load-bearing distinction here.
  const nodes = [
    center,
    ...visibleRows.map((row) => ({
      ...row.counterpart,
      graphRole: activeLensKey,
    })),
  ];
  const edges = visibleRows.map((row) => ({
    ...row.edge,
    relationship_lens: activeLensKey,
  }));
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <section className="atlas-relationship-map" aria-label="Relationship map">
      <div className="atlas-compact-map-center">
        <strong>{center.metadata?.item_id || center.label || center.id}</strong>
        {center.metadata?.title ? <span>{center.metadata.title}</span> : null}
      </div>

      {/* Answers "what kinds of relationships does this record have, and how
          many of each" first — a record neighborhood is several distinct
          relationship classes, not one network. Selecting a card answers
          "show me that one" below; it never draws every class at once. */}
      <div
        aria-label="Relationship types"
        className="atlas-lens-summary"
        role="group"
      >
        {groupsByLens.map(({ entry, total }) => (
          <button
            aria-pressed={entry.key === activeLensKey}
            key={entry.key}
            onClick={() => onExpandedGroupChange(entry.key)}
            type="button"
          >
            <span
              aria-hidden="true"
              className="legend-swatch"
              style={{ backgroundColor: lensColor(entry.key) }}
            />
            {entry.label}
            <strong>{total}</strong>
          </button>
        ))}
      </div>

      {activeLens ? (
        <div
          aria-label={`${activeLens.entry.label} records`}
          className="atlas-compact-map"
          role="group"
        >
          <ul>
            {visibleRows.map((row) => (
              <li key={row.counterpart.id}>
                <button
                  aria-pressed={row.counterpart.id === selectedItemId}
                  onClick={() => onSelectItem(row)}
                  type="button"
                >
                  <span>{groupLabelByNodeId.get(row.counterpart.id)}</span>
                  <strong>{row.itemId}</strong>
                  <small>{row.title}</small>
                </button>
              </li>
            ))}
          </ul>
          {activeItems.length > visibleRows.length ? (
            <button className="atlas-spatial-more" onClick={onOpenList} type="button">
              View all {activeItems.length} in List
            </button>
          ) : null}
        </div>
      ) : null}

      {!compact && activeLens ? (
        <details className="atlas-graph-toggle" open={showGraph}>
          <summary
            className="ca-legend-trigger"
            onClick={(event) => {
              event.preventDefault();
              setShowGraph((current) => !current);
            }}
          >
            {showGraph ? "Hide" : "View as"} graph
          </summary>
          {showGraph ? (
            <div className="ca-canvas-container atlas-shared-graph">
              <Suspense
                fallback={<p role="status">Loading the bounded relationship map…</p>}
              >
                <RelationshipGraph
                  centerNodeId={center.id}
                  edges={edges}
                  layoutMode="focus"
                  nodes={nodes}
                  onSelectNode={(nodeId) => {
                    const row = rowByNodeId.get(nodeId);
                    if (row) onSelectItem(row);
                  }}
                  reducedMotion={reducedMotion}
                  searchHighlightIds={new Set()}
                  selectedNodeId={selectedItemId || null}
                />
              </Suspense>
            </div>
          ) : null}
        </details>
      ) : null}

      {structureGroups.map((group) => (
        <div className="record-decomposition-block" key={group.id}>
          <span className="record-decomposition-label">{group.label}</span>
          <div className="badge-row">
            {group.items.map((row) => (
              <button
                aria-pressed={row.counterpart.id === selectedItemId}
                className="badge-button"
                key={row.counterpart.id}
                onClick={() => onSelectItem(row)}
                type="button"
              >
                <Badge>{row.itemId}</Badge>
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
