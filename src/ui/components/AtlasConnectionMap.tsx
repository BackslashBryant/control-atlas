import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconAdjustments,
  IconChevronRight,
  IconClipboardCheck,
  IconFileDescription,
  IconFocusCentered,
  IconLayersIntersect,
  IconListDetails,
  IconMinus,
  IconPlus,
  IconShield,
} from "@tabler/icons-react";

import type {
  AtlasConnectionGroup,
  AtlasRelationshipRow,
} from "../lib/atlasModel";
import { selectAtlasOverviewGroups } from "../lib/atlasModel";
import type { AtlasNeighborhoodNode } from "../lib/runtimeLoader";

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

const MAX_GROUPS = 6;
const MAX_DESKTOP_BRANCH_ITEMS = 4;
const MAX_COMPACT_BRANCH_ITEMS = 3;

const OVERVIEW_POINTS = [
  { x: 190, y: 105 },
  { x: 500, y: 105 },
  { x: 150, y: 310 },
  { x: 850, y: 310 },
  { x: 290, y: 520 },
  { x: 710, y: 520 },
];

const EXPANDED_POINTS = [
  { x: 135, y: 105 },
  { x: 400, y: 105 },
  { x: 120, y: 310 },
  { x: 720, y: 310 },
  { x: 210, y: 520 },
  { x: 500, y: 520 },
];

function groupIcon(groupId: string) {
  if (groupId.includes("Baseline")) return IconLayersIntersect;
  if (groupId === "nistControl" || groupId === "baseControl") return IconShield;
  if (groupId === "disa" || groupId === "stig") return IconAdjustments;
  if (groupId === "assessment") return IconClipboardCheck;
  if (groupId === "csf" || groupId === "sp171") return IconListDetails;
  return IconFileDescription;
}

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
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocusGroup = useRef("");
  const [zoom, setZoom] = useState(1);
  const visibleGroups = selectAtlasOverviewGroups(groups, MAX_GROUPS);
  const expandedGroup = visibleGroups.find(
    (group) => group.id === expandedGroupId,
  );
  const centerLabel = center.metadata?.item_id || center.id;
  const centerTitle = center.metadata?.title || center.label || centerLabel;
  const itemLimit = compact
    ? MAX_COMPACT_BRANCH_ITEMS
    : MAX_DESKTOP_BRANCH_ITEMS;
  const visibleItems = expandedGroup?.items.slice(0, itemLimit) || [];

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || !expandedGroupId) return;
      event.preventDefault();
      pendingFocusGroup.current = expandedGroupId;
      onExpandedGroupChange("");
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [expandedGroupId, onExpandedGroupChange]);

  useEffect(() => {
    if (expandedGroupId || !pendingFocusGroup.current) return;
    const groupId = pendingFocusGroup.current;
    pendingFocusGroup.current = "";
    window.setTimeout(() => triggerRefs.current.get(groupId)?.focus(), 0);
  }, [expandedGroupId]);

  const wires = useMemo(() => {
    const expanded = Boolean(expandedGroup);
    const centerPoint = expanded ? { x: 400, y: 310 } : { x: 500, y: 310 };
    const points = expanded ? EXPANDED_POINTS : OVERVIEW_POINTS;
    return visibleGroups.map((group, index) => ({
      id: group.id,
      point:
        expanded && group.id === expandedGroup?.id
          ? { x: 720, y: 310 }
          : points[index] || points[points.length - 1],
      centerPoint,
    }));
  }, [expandedGroup, visibleGroups]);

  return (
    <div
      aria-label={`${visibleGroups.length} connection groups around ${centerLabel}`}
      className={`atlas-spatial-map${expandedGroup ? " atlas-spatial-map--expanded" : ""}`}
      role="group"
    >
      <div
        className="atlas-spatial-map-inner"
        style={{ transform: `scale(${zoom})` }}
      >
        <svg
          aria-hidden="true"
          className="atlas-spatial-wires"
          preserveAspectRatio="none"
          viewBox={expandedGroup ? "0 0 1200 620" : "0 0 1000 620"}
        >
          {wires.map(({ id, point, centerPoint }) => (
            <path
              d={`M ${centerPoint.x} ${centerPoint.y} C ${(centerPoint.x + point.x) / 2} ${centerPoint.y}, ${(centerPoint.x + point.x) / 2} ${point.y}, ${point.x} ${point.y}`}
              key={id}
            />
          ))}
          {expandedGroup ? (
            <path d="M 720 310 L 920 310" />
          ) : null}
        </svg>

        <article className="atlas-spatial-center" data-map-node="true">
          <span className="atlas-map-card-kicker">Selected record</span>
          <strong>{centerLabel}</strong>
          <span>{centerTitle}</span>
        </article>

        {visibleGroups.map((group, index) => {
          const GroupIcon = groupIcon(group.id);
          const expanded = group.id === expandedGroup?.id;
          return (
            <button
              aria-expanded={expanded}
              className={`atlas-spatial-group atlas-spatial-slot-${index}${expanded ? " atlas-spatial-group--expanded" : ""}`}
              data-map-node="true"
              key={group.id}
              onClick={(event) => {
                triggerRefs.current.set(group.id, event.currentTarget);
                if (expanded) {
                  pendingFocusGroup.current = group.id;
                  onExpandedGroupChange("");
                } else {
                  onExpandedGroupChange(group.id);
                }
              }}
              ref={(trigger) => {
                if (trigger) triggerRefs.current.set(group.id, trigger);
                else triggerRefs.current.delete(group.id);
              }}
              type="button"
            >
              <GroupIcon aria-hidden="true" size={28} stroke={1.7} />
              <span>
                <strong>{group.label}</strong>
                <small>{group.items.length} related</small>
              </span>
              <span aria-hidden="true" className="atlas-spatial-expand">
                {expanded ? "−" : "+"}
              </span>
            </button>
          );
        })}

        {expandedGroup ? (
          <section
            aria-label={`${expandedGroup.label} records`}
            className="atlas-spatial-items"
          >
            <header>
              <p className="eyebrow">{expandedGroup.label}</p>
              <span>{expandedGroup.items.length} records</span>
            </header>
            {visibleItems.map((row) => {
              const selected = row.counterpart.id === selectedItemId;
              return (
                <button
                  aria-pressed={selected}
                  className={selected ? "active" : ""}
                  key={`${row.edge.id}:${row.counterpart.id}`}
                  onClick={() => onSelectItem(row)}
                  type="button"
                >
                  <span>
                    <strong>{row.itemId}</strong>
                    <small>{row.title}</small>
                  </span>
                  <IconChevronRight aria-hidden="true" size={18} />
                </button>
              );
            })}
            {expandedGroup.items.length > visibleItems.length ? (
              <button className="atlas-spatial-more" onClick={onOpenList} type="button">
                + {expandedGroup.items.length - visibleItems.length} more in List
              </button>
            ) : null}
          </section>
        ) : null}
      </div>

      <div aria-label="Map zoom" className="atlas-spatial-controls" role="group">
        <button
          aria-label="Zoom in"
          disabled={zoom >= 1.1}
          onClick={() => setZoom((current) => Math.min(1.1, current + 0.1))}
          type="button"
        >
          <IconPlus aria-hidden="true" size={18} />
        </button>
        <button
          aria-label="Zoom out"
          disabled={zoom <= 0.9}
          onClick={() => setZoom((current) => Math.max(0.9, current - 0.1))}
          type="button"
        >
          <IconMinus aria-hidden="true" size={18} />
        </button>
        <button aria-label="Reset zoom" onClick={() => setZoom(1)} type="button">
          <IconFocusCentered aria-hidden="true" size={18} />
        </button>
      </div>

      {groups.length > visibleGroups.length ? (
        <button className="atlas-spatial-overflow" onClick={onOpenList} type="button">
          + {groups.length - visibleGroups.length} more connection groups in List
        </button>
      ) : null}
      <p aria-live="polite" className="visually-hidden">
        {visibleGroups.length} connection groups are visible.
        {expandedGroup
          ? ` ${expandedGroup.label} is expanded with ${visibleItems.length} records visible.`
          : " Select a group to reveal its records."}
      </p>
    </div>
  );
}
