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

const CENTER_ID = "__atlas-center";
const ITEMS_ID = "__atlas-items";
const LAYOUT_PADDING = 16;

type MapLayout = {
  positions: Map<string, { x: number; y: number; w: number; h: number }>;
  width: number;
  height: number;
};

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef(new Map<string, HTMLElement>());
  const [zoom, setZoom] = useState(1);
  const [layout, setLayout] = useState<MapLayout | null>(null);
  const [fit, setFit] = useState(1);
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

  // Layout identity: recompute only when the shape of the map changes, not on
  // selection highlights.
  const layoutKey = [
    visibleGroups.map((group) => `${group.id}:${group.items.length}`).join("|"),
    expandedGroup?.id || "",
    visibleItems.length,
    centerLabel,
  ].join("::");

  // ELK (already a repo dependency; lazy so the Atlas route stays canvas-free)
  // computes overlap-free positions from the measured card boxes.
  useEffect(() => {
    if (compact) {
      return;
    }
    let cancelled = false;
    (async () => {
      const { default: ELK } = await import("elkjs/lib/elk.bundled.js");
      await new Promise(requestAnimationFrame);
      if (cancelled) {
        return;
      }
      const size = (id: string, fallbackW: number, fallbackH: number) => {
        const el = nodeRefs.current.get(id);
        return {
          width: el?.offsetWidth || fallbackW,
          height: el?.offsetHeight || fallbackH,
        };
      };
      const children = [
        { id: CENTER_ID, ...size(CENTER_ID, 240, 152) },
        ...visibleGroups.map((group) => ({
          id: group.id,
          ...size(group.id, 240, 86),
        })),
      ];
      const edges = visibleGroups.map((group) => ({
        id: `wire-${group.id}`,
        sources: [CENTER_ID],
        targets: [group.id],
      }));
      if (expandedGroup) {
        children.push({ id: ITEMS_ID, ...size(ITEMS_ID, 300, 420) });
        edges.push({
          id: "wire-items",
          sources: [expandedGroup.id],
          targets: [ITEMS_ID],
        });
      }
      const pad = `[top=${LAYOUT_PADDING},left=${LAYOUT_PADDING},bottom=${LAYOUT_PADDING},right=${LAYOUT_PADDING}]`;
      const graph = {
        id: "atlas-bounded-map",
        layoutOptions: expandedGroup
          ? {
              "elk.algorithm": "layered",
              "elk.direction": "RIGHT",
              "elk.layered.spacing.nodeNodeBetweenLayers": "72",
              "elk.spacing.nodeNode": "28",
              "elk.padding": pad,
            }
          : {
              "elk.algorithm": "radial",
              "elk.spacing.nodeNode": "36",
              "elk.padding": pad,
            },
        children,
        edges,
      };
      const result = (await new ELK().layout(graph)) as {
        children?: Array<{
          id: string;
          x?: number;
          y?: number;
          width?: number;
          height?: number;
        }>;
        width?: number;
        height?: number;
      };
      if (cancelled) {
        return;
      }
      setLayout({
        positions: new Map(
          (result.children || []).map((child: any) => [
            child.id,
            {
              x: child.x || 0,
              y: child.y || 0,
              w: child.width || 0,
              h: child.height || 0,
            },
          ]),
        ),
        width: result.width || 0,
        height: result.height || 0,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [compact, layoutKey]);

  // Fit the computed canvas into the bounded container (same fit-to-view
  // pattern React Flow uses); user zoom multiplies on top.
  useEffect(() => {
    if (compact || !layout || !containerRef.current) {
      return;
    }
    const container = containerRef.current;
    const applyFit = () => {
      const nextFit = Math.min(
        1,
        container.clientWidth / layout.width || 1,
        container.clientHeight / layout.height || 1,
      );
      setFit(nextFit > 0 ? nextFit : 1);
    };
    applyFit();
    const observer = new ResizeObserver(applyFit);
    observer.observe(container);
    return () => observer.disconnect();
  }, [compact, layout]);

  const registerNode = (id: string) => (el: HTMLElement | null) => {
    if (el) {
      nodeRefs.current.set(id, el);
    } else {
      nodeRefs.current.delete(id);
    }
  };

  const nodeStyle = (id: string) => {
    if (compact) {
      return undefined;
    }
    const pos = layout?.positions.get(id);
    if (!pos) {
      return { opacity: 0 } as const;
    }
    return { left: pos.x, top: pos.y };
  };

  const wires = useMemo(() => {
    if (compact || !layout) {
      return [];
    }
    const centerPos = layout.positions.get(CENTER_ID);
    if (!centerPos) {
      return [];
    }
    const centerPoint = {
      x: centerPos.x + centerPos.w / 2,
      y: centerPos.y + centerPos.h / 2,
    };
    const paths = visibleGroups
      .map((group) => {
        const pos = layout.positions.get(group.id);
        if (!pos) {
          return null;
        }
        return {
          id: group.id,
          point: { x: pos.x + pos.w / 2, y: pos.y + pos.h / 2 },
          centerPoint,
        };
      })
      .filter((wire): wire is NonNullable<typeof wire> => wire !== null);
    const expandedPos = expandedGroup
      ? layout.positions.get(expandedGroup.id)
      : null;
    const itemsPos = expandedGroup ? layout.positions.get(ITEMS_ID) : null;
    if (expandedPos && itemsPos) {
      paths.push({
        id: "items",
        point: { x: itemsPos.x, y: itemsPos.y + itemsPos.h / 2 },
        centerPoint: {
          x: expandedPos.x + expandedPos.w,
          y: expandedPos.y + expandedPos.h / 2,
        },
      });
    }
    return paths;
  }, [compact, layout, visibleGroups, expandedGroup]);

  return (
    <div
      aria-label={`${visibleGroups.length} connection groups around ${centerLabel}`}
      className={`atlas-spatial-map${expandedGroup ? " atlas-spatial-map--expanded" : ""}`}
      ref={containerRef}
      role="group"
    >
      <div
        className="atlas-spatial-map-inner"
        style={
          compact
            ? undefined
            : {
                width: layout?.width,
                height: layout?.height,
                transform: `translate(-50%, -50%) scale(${(fit * zoom).toFixed(3)})`,
              }
        }
      >
        <svg
          aria-hidden="true"
          className="atlas-spatial-wires"
          viewBox={`0 0 ${layout?.width || 1000} ${layout?.height || 620}`}
        >
          {wires.map(({ id, point, centerPoint }) => (
            <path
              d={`M ${centerPoint.x} ${centerPoint.y} C ${(centerPoint.x + point.x) / 2} ${centerPoint.y}, ${(centerPoint.x + point.x) / 2} ${point.y}, ${point.x} ${point.y}`}
              key={id}
            />
          ))}
        </svg>

        <article
          className="atlas-spatial-center"
          data-map-node="true"
          ref={registerNode(CENTER_ID)}
          style={nodeStyle(CENTER_ID)}
        >
          <span className="atlas-map-card-kicker">Selected record</span>
          <strong>{centerLabel}</strong>
          <span>{centerTitle}</span>
        </article>

        {visibleGroups.map((group) => {
          const GroupIcon = groupIcon(group.id);
          const expanded = group.id === expandedGroup?.id;
          return (
            <button
              aria-expanded={expanded}
              className={`atlas-spatial-group${expanded ? " atlas-spatial-group--expanded" : ""}`}
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
                if (trigger) {
                  triggerRefs.current.set(group.id, trigger);
                  nodeRefs.current.set(group.id, trigger);
                } else {
                  triggerRefs.current.delete(group.id);
                  nodeRefs.current.delete(group.id);
                }
              }}
              style={nodeStyle(group.id)}
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
            ref={registerNode(ITEMS_ID)}
            style={nodeStyle(ITEMS_ID)}
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
