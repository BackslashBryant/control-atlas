import { useMemo } from "react";

import {
  type AtlasConnectionGroup,
  type AtlasRelationshipRow,
} from "../lib/atlasModel";
import { RELATIONSHIP_LENS_LEGEND, lensColor } from "../lib/graphTheme";
import type { AtlasNeighborhoodNode } from "../lib/runtimeLoader";

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

// A representative label for a connected record: the human title when it
// differs from the ID (most records), the ID alone otherwise (CCIs, whose
// title usually repeats the ID).
function previewLabel(row: AtlasRelationshipRow): string {
  const title = row.title.trim();
  const itemId = row.itemId.trim();
  return title && title !== itemId ? title : itemId;
}

/**
 * One record, centered, with its relationship classes radiating outward —
 * the operational map this workspace is built around. Only class-level
 * summaries (not individual edges) are placed in the diagram: a dense
 * record's 95 connections would otherwise either overflow the viewport or
 * force zooming, both of which the map must avoid. Individual records live
 * in the bounded detail list below, which the selected spoke drives.
 */
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
  // Structure (base control / enhancements) is publisher-declared parentage,
  // never a peer of applicability/implementation/cross-framework correlation
  // (docs/DATA_POLICY.md's relationship classes) — it is hierarchy, not a
  // connection, and the workspace's Hierarchy panel and "Published children"
  // list are its one home. Rendering it a second time here would duplicate
  // that list under a different label.
  const explorationGroups = groups.filter((group) => group.lens !== "structure");
  const groupsByLens = RELATIONSHIP_LENS_LEGEND.map((entry) => {
    const lensGroups = explorationGroups.filter((group) => group.lens === entry.key);
    const items = lensGroups
      .flatMap((group) => group.items.map((row) => ({ row, groupLabel: group.label })))
      .sort((left, right) => left.row.itemId.localeCompare(right.row.itemId));
    return { entry, groups: lensGroups, items, total: items.length };
  }).filter(({ items }) => items.length > 0);

  const activeLensKey =
    expandedGroupId || (groupsByLens.length ? groupsByLens[0].entry.key : "");
  const activeLens = groupsByLens.find((entry) => entry.entry.key === activeLensKey);
  const visibleRows = (activeLens?.items || [])
    .slice(0, compact ? 8 : 14)
    .map((e) => e.row);
  const groupLabelByNodeId = new Map(
    (activeLens?.items || []).map((e) => [e.row.counterpart.id, e.groupLabel] as const),
  );

  // Evenly spaced around the center, starting at 12 o'clock. Positions are
  // percentages of the container box, so the diagram reflows with its
  // container instead of needing a resize observer.
  const spokes = useMemo(() => {
    const count = groupsByLens.length;
    return groupsByLens.map((group, index) => {
      const angle = (-90 + (360 / Math.max(count, 1)) * index) * (Math.PI / 180);
      const radius = 36;
      return {
        ...group,
        x: 50 + radius * Math.cos(angle),
        y: 50 + radius * Math.sin(angle),
        preview: group.items.slice(0, 2).map(({ row }) => previewLabel(row)),
      };
    });
  }, [groupsByLens]);

  const centerLabel = center.metadata?.item_id || center.label || center.id;
  const centerTitle = center.metadata?.title || "";

  return (
    <section className="atlas-relationship-map" aria-label="Relationship map">
      {compact ? (
        // Mobile: a readable vertical neighborhood, not a shrunken diagram.
        // Radial label positions become illegible well before a phone-width
        // canvas would, so the same group data renders as a stack instead.
        <div
          aria-label="Relationship types"
          className="atlas-radial-map atlas-radial-map--stacked"
          role="group"
        >
          <div className="atlas-radial-center">
            <strong>{centerLabel}</strong>
            {centerTitle ? <span>{centerTitle}</span> : null}
          </div>
          <ul className="atlas-radial-stack-list">
            {spokes.map((group) => (
              <li key={group.entry.key}>
                <button
                  aria-pressed={group.entry.key === activeLensKey}
                  className="atlas-radial-group"
                  onClick={() => onExpandedGroupChange(group.entry.key)}
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className="atlas-radial-group-swatch"
                    style={{ backgroundColor: lensColor(group.entry.key) }}
                  />
                  <span className="atlas-radial-group-label">{group.entry.label}</span>
                  <strong className="atlas-radial-group-count">{group.total}</strong>
                  {group.preview.length ? (
                    <small className="atlas-radial-group-preview">
                      {group.preview.join(" · ")}
                    </small>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div aria-label="Relationship types" className="atlas-radial-map" role="group">
          <svg
            aria-hidden="true"
            className="atlas-radial-lines"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            {spokes.map((group) => (
              <line
                key={group.entry.key}
                stroke={lensColor(group.entry.key)}
                strokeWidth={group.entry.key === activeLensKey ? 0.9 : 0.5}
                x1={50}
                x2={group.x}
                y1={50}
                y2={group.y}
              />
            ))}
          </svg>
          <div className="atlas-radial-center">
            <strong>{centerLabel}</strong>
            {centerTitle ? <span>{centerTitle}</span> : null}
          </div>
          {spokes.map((group) => (
            <button
              aria-pressed={group.entry.key === activeLensKey}
              className="atlas-radial-group"
              key={group.entry.key}
              onClick={() => onExpandedGroupChange(group.entry.key)}
              style={{ left: `${group.x}%`, top: `${group.y}%` }}
              type="button"
            >
              <span
                aria-hidden="true"
                className="atlas-radial-group-swatch"
                style={{ backgroundColor: lensColor(group.entry.key) }}
              />
              <span className="atlas-radial-group-label">{group.entry.label}</span>
              <strong className="atlas-radial-group-count">{group.total}</strong>
              {group.preview.length ? (
                <small className="atlas-radial-group-preview">
                  {group.preview.join(" · ")}
                </small>
              ) : null}
            </button>
          ))}
        </div>
      )}

      {activeLens ? (
        <div
          aria-label={`${activeLens.entry.label} records`}
          className="atlas-lens-detail"
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
          {activeLens.total > visibleRows.length ? (
            <button className="atlas-spatial-more" onClick={onOpenList} type="button">
              View all {activeLens.total} in List
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
