import { lazy, Suspense, useMemo } from "react";

import {
  selectAtlasOverviewGroups,
  type AtlasConnectionGroup,
  type AtlasRelationshipRow,
} from "../lib/atlasModel";
import type { AtlasNeighborhoodNode } from "../lib/runtimeLoader";

const RelationshipGraph = lazy(() => import("./RelationshipGraph"));

type AtlasConnectionMapProps = {
  center: AtlasNeighborhoodNode;
  groups: AtlasConnectionGroup[];
  expandedGroupId: string;
  compact: boolean;
  selectedItemId: string;
  onExpandedGroupChange: (groupId: string) => void;
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
  const visibleGroups = selectAtlasOverviewGroups(groups, compact ? 4 : 6);
  const expandedGroup = visibleGroups.find(
    (group) => group.id === expandedGroupId,
  );
  const visibleRows = useMemo(
    () =>
      expandedGroup
        ? expandedGroup.items.slice(0, compact ? 6 : 12)
        : visibleGroups.flatMap((group) => group.items.slice(0, 1)),
    [compact, expandedGroup, visibleGroups],
  );
  const rowByNodeId = new Map(
    visibleRows.map((row) => [row.counterpart.id, row]),
  );
  const groupLabelByNodeId = new Map(
    visibleGroups.flatMap((group) =>
      group.items.map((row) => [row.counterpart.id, group.label] as const),
    ),
  );
  const nodes = [center, ...visibleRows.map((row) => row.counterpart)];
  const edges = visibleRows.map((row) => row.edge);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <section className="atlas-relationship-map" aria-label="Relationship map">
      <p className="atlas-scope-count">
        Map shows {visibleGroups.length} of {groups.length} connection groups
        {expandedGroup
          ? ` and ${visibleRows.length} of ${expandedGroup.items.length} records in ${expandedGroup.label}`
          : ""}
        . List contains the complete same scope.
      </p>
      <div
        aria-label="Visible connection group"
        className="atlas-map-group-controls"
        role="group"
      >
        {visibleGroups.map((group) => (
          <button
            aria-pressed={group.id === expandedGroupId}
            key={group.id}
            onClick={() =>
              onExpandedGroupChange(
                group.id === expandedGroupId ? "" : group.id,
              )
            }
            type="button"
          >
            {group.label} ({group.items.length})
          </button>
        ))}
        {groups.length > visibleGroups.length ? (
          <button onClick={onOpenList} type="button">
            {groups.length - visibleGroups.length} more groups in List
          </button>
        ) : null}
      </div>
      {compact ? (
        <div
          aria-label="Compact relationship map"
          className="atlas-compact-map"
          role="group"
        >
          <div className="atlas-compact-map-center">
            <strong>{center.metadata?.item_id || center.label || center.id}</strong>
            {center.metadata?.title ? <span>{center.metadata.title}</span> : null}
          </div>
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
        </div>
      ) : (
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
      )}
      {expandedGroup && expandedGroup.items.length > visibleRows.length ? (
        <button className="atlas-spatial-more" onClick={onOpenList} type="button">
          {expandedGroup.items.length - visibleRows.length} more records in List
        </button>
      ) : null}
    </section>
  );
}
