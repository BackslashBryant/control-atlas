import { useEffect, useRef } from "react";

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
  onExpandedGroupChange: (groupId: string) => void;
  onOpenList: () => void;
  onRecenter: (nodeId: string) => void;
};

const MAX_GROUPS = 6;
const MAX_DESKTOP_BRANCH_ITEMS = 10;
const MAX_COMPACT_BRANCH_ITEMS = 6;

function itemLabel(item: AtlasRelationshipRow) {
  return item.itemId === item.title
    ? item.itemId
    : `${item.itemId} — ${item.title}`;
}

export function AtlasConnectionMap(props: AtlasConnectionMapProps) {
  const {
    center,
    groups,
    expandedGroupId,
    compact,
    onExpandedGroupChange,
    onOpenList,
    onRecenter,
  } = props;
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocusGroup = useRef("");
  const visibleGroups = selectAtlasOverviewGroups(groups, MAX_GROUPS);
  const expandedGroup = visibleGroups.find(
    (group) => group.id === expandedGroupId,
  );
  const centerLabel = center.metadata?.item_id || center.id;
  const centerTitle = center.metadata?.title || center.label || centerLabel;
  const itemLimit = compact
    ? MAX_COMPACT_BRANCH_ITEMS
    : MAX_DESKTOP_BRANCH_ITEMS;

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

  if (expandedGroup) {
    const visibleItems = expandedGroup.items.slice(0, itemLimit);
    return (
      <div
        aria-label={`Expanded ${expandedGroup.label} connections`}
        className="atlas-bounded-map atlas-bounded-map--expanded"
        role="group"
      >
        <article className="atlas-map-center" data-map-node="true">
          <span className="atlas-map-card-kicker">Selected record</span>
          <strong>{centerLabel}</strong>
          <span>{centerTitle}</span>
        </article>

        <div aria-hidden="true" className="atlas-map-connector" />

        <section className="atlas-map-branch">
          <header>
            <div>
              <span className="atlas-map-card-kicker">Connection group</span>
              <h3>{expandedGroup.label}</h3>
              <p>{expandedGroup.description}</p>
            </div>
            <button
              aria-expanded="true"
              className="secondary quiet"
              onClick={() => {
                pendingFocusGroup.current = expandedGroup.id;
                onExpandedGroupChange("");
              }}
              type="button"
            >
              Back to groups
            </button>
          </header>
          <div className="atlas-map-branch-grid">
            {visibleItems.map((item) => (
              <button
                className="atlas-map-item-card"
                data-map-node="true"
                key={`${item.edge.id}:${item.counterpart.id}`}
                onClick={() => onRecenter(item.counterpart.id)}
                title={`Recenter the Atlas on ${itemLabel(item)}`}
                type="button"
              >
                <strong>{item.itemId}</strong>
                <span>{item.title}</span>
                <small>Recenter map</small>
              </button>
            ))}
          </div>
          {expandedGroup.items.length > visibleItems.length ? (
            <button className="link-action" onClick={onOpenList} type="button">
              + {expandedGroup.items.length - visibleItems.length} more in List
            </button>
          ) : null}
        </section>
        <p aria-live="polite" className="visually-hidden">
          {expandedGroup.label} expanded. {visibleItems.length} of{" "}
          {expandedGroup.items.length} connections are visible.
        </p>
      </div>
    );
  }

  const regions = [
    {
      id: "upstream",
      label: "Where this comes from",
      groups: visibleGroups.filter((group) => group.placement === "upstream"),
    },
    {
      id: "lateral",
      label: "Equivalent and related requirements",
      groups: visibleGroups.filter((group) => group.placement === "lateral"),
    },
    {
      id: "downstream",
      label: "What this leads to",
      groups: visibleGroups.filter((group) => group.placement === "downstream"),
    },
  ].filter((region) => region.groups.length > 0);

  return (
    <div
      aria-label={`${visibleGroups.length} connection groups around ${centerLabel}`}
      className="atlas-bounded-map"
      role="group"
    >
      {regions
        .filter((region) => region.id === "upstream")
        .map((region) => (
          <MapRegion
            key={region.id}
            label={region.label}
            placement={region.id}
            groups={region.groups}
            registerTrigger={(groupId, trigger) => {
              if (trigger) triggerRefs.current.set(groupId, trigger);
              else triggerRefs.current.delete(groupId);
            }}
            onExpand={(groupId, trigger) => {
              triggerRefs.current.set(groupId, trigger);
              onExpandedGroupChange(groupId);
            }}
          />
        ))}

      <article className="atlas-map-center" data-map-node="true">
        <span className="atlas-map-card-kicker">Selected record</span>
        <strong>{centerLabel}</strong>
        <span>{centerTitle}</span>
      </article>

      {regions
        .filter((region) => region.id !== "upstream")
        .map((region) => (
          <MapRegion
            key={region.id}
            label={region.label}
            placement={region.id}
            groups={region.groups}
            registerTrigger={(groupId, trigger) => {
              if (trigger) triggerRefs.current.set(groupId, trigger);
              else triggerRefs.current.delete(groupId);
            }}
            onExpand={(groupId, trigger) => {
              triggerRefs.current.set(groupId, trigger);
              onExpandedGroupChange(groupId);
            }}
          />
        ))}

      {groups.length > visibleGroups.length ? (
        <button className="link-action atlas-map-overflow" onClick={onOpenList} type="button">
          + {groups.length - visibleGroups.length} more connection groups in List
        </button>
      ) : null}
      <p aria-live="polite" className="visually-hidden">
        {visibleGroups.length} connection groups and{" "}
        {visibleGroups.reduce((total, group) => total + group.items.length, 0)}{" "}
        connections are visible.
      </p>
    </div>
  );
}

function MapRegion(props: {
  label: string;
  placement: string;
  groups: AtlasConnectionGroup[];
  onExpand: (groupId: string, trigger: HTMLButtonElement) => void;
  registerTrigger: (groupId: string, trigger: HTMLButtonElement | null) => void;
}) {
  return (
    <section
      aria-label={props.label}
      className={`atlas-map-region atlas-map-region--${props.placement}`}
    >
      <h3>{props.label}</h3>
      <div className="atlas-map-region-grid">
        {props.groups.map((group) => (
          <button
            aria-expanded="false"
            className="atlas-map-group-card"
            data-map-node="true"
            key={group.id}
            ref={(trigger) => props.registerTrigger(group.id, trigger)}
            onClick={(event) => props.onExpand(group.id, event.currentTarget)}
            type="button"
          >
            <strong>{group.label}</strong>
            <span>
              {group.items.filter(
                (item) => item.edge.publication_status === "published",
              ).length}{" "}
              published
              {group.items.some(
                (item) => item.edge.publication_status !== "published",
              )
                ? ` + ${group.items.filter((item) => item.edge.publication_status !== "published").length} candidate`
                : ""}
            </span>
            <small>Open group</small>
          </button>
        ))}
      </div>
    </section>
  );
}
