import type { ReactNode } from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { IconArrowRight } from "@tabler/icons-react";
import { useState } from "react";

import { ProvenanceTerm } from "./ProvenanceTerm";
import { Button } from "./lsm/Button";

const PAGE_SIZE = 10;

export type RelationshipGroup = {
  id: string;
  label: string;
  description: string;
  items: Array<{
    counterpart: {
      id: string;
      label?: string;
      metadata?: {
        item_id?: string;
        title?: string;
        description?: string;
        catalog_id?: string;
      };
    };
    edge: { relationship_type?: string };
  }>;
};

export function RelationshipGroupsSection(props: {
  groups: RelationshipGroup[];
  formatRelationshipLabel: (edge: { relationship_type?: string }) => string;
  onOpenNode: (nodeId: string) => void;
  onOpenGroupIdsChange?: (groupIds: string[]) => void;
  openGroupIds?: string[];
  sourceTrustSummary: (source: unknown) => string;
  source: unknown;
}) {
  const totalItems = props.groups.reduce(
    (sum, group) => sum + group.items.length,
    0,
  );
  const defaultOpen =
    totalItems > 0 && totalItems <= PAGE_SIZE ? [props.groups[0]?.id] : [];

  return (
    <>
      {/* The per-group rollup used to enumerate every group and count here,
          immediately beside a sidebar listing the same eight groups with the
          same counts. The named group headers below and the sidebar jump nav
          both carry that detail, so this states the total only. */}
      <p className="connection-rollup">
        <strong>{totalItems} published links</strong> across{" "}
        {props.groups.length} group{props.groups.length === 1 ? "" : "s"}.
      </p>
      <Accordion.Root
        className="accordion-root relationship-groups-accordion"
        defaultValue={defaultOpen}
        onValueChange={props.onOpenGroupIdsChange}
        type="multiple"
        value={props.openGroupIds}
      >
        {props.groups.map((group) => (
          <RelationshipGroupItem
            formatRelationshipLabel={props.formatRelationshipLabel}
            group={group}
            key={group.id}
            onOpenNode={props.onOpenNode}
            source={props.source}
            sourceTrustSummary={props.sourceTrustSummary}
          />
        ))}
      </Accordion.Root>
    </>
  );
}

function RelationshipGroupItem(props: {
  group: RelationshipGroup;
  formatRelationshipLabel: (edge: { relationship_type?: string }) => string;
  onOpenNode: (nodeId: string) => void;
  sourceTrustSummary: (source: unknown) => string;
  source: unknown;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { group } = props;
  const visibleItems = group.items.slice(0, visibleCount);
  const remaining = group.items.length - visibleItems.length;

  return (
    <Accordion.Item
      className="accordion-item"
      id={`connection-group-${group.id}`}
      value={group.id}
    >
      <Accordion.Header>
        <Accordion.Trigger className="accordion-trigger relationship-group-trigger">
          <span>
            {group.label} ({group.items.length})
          </span>
          <IconArrowRight aria-hidden="true" size={18} stroke={1.8} />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="accordion-content">
        <p className="relationship-group-description">{group.description}</p>
        <div className="stack compact">
          {visibleItems.map((item) => (
            <button
              className="relationship-card"
              key={`${group.id}-${item.counterpart.id}`}
              onClick={() => props.onOpenNode(item.counterpart.id)}
              type="button"
            >
              <div>
                <strong>
                  {item.counterpart.metadata?.item_id || item.counterpart.id}
                </strong>
                <p>
                  {item.counterpart.metadata?.catalog_id === "disa-cci"
                    ? item.counterpart.metadata?.description ||
                      item.counterpart.metadata?.title ||
                      item.counterpart.label
                    : item.counterpart.metadata?.title || item.counterpart.label}
                </p>
              </div>
              <div className="relationship-meta">
                <span>{props.formatRelationshipLabel(item.edge)}</span>
                <ProvenanceTerm
                  kind="provenance"
                  value={(props.source as { provenance_class?: string })?.provenance_class || "federal_published"}
                />
              </div>
            </button>
          ))}
        </div>
        {group.items.length > PAGE_SIZE ? (
          <p className="list-progress">
            Showing {Math.min(visibleCount, group.items.length)} of{" "}
            {group.items.length}
          </p>
        ) : null}
        {remaining > 0 ? (
          <div className="card-actions">
            <Button
              variant="secondary"
              onClick={() =>
                setVisibleCount((current) => current + PAGE_SIZE)
              }
              type="button"
            >
              Show {Math.min(PAGE_SIZE, remaining)} more
            </Button>
          </div>
        ) : null}
      </Accordion.Content>
    </Accordion.Item>
  );
}

export function defaultOpenRelationshipGroups(
  groups: RelationshipGroup[],
): string[] {
  const totalItems = groups.reduce((sum, group) => sum + group.items.length, 0);
  return totalItems > 0 && totalItems <= PAGE_SIZE && groups[0]
    ? [groups[0].id]
    : [];
}

export function RelationshipGroupRollupNav(props: {
  groups: RelationshipGroup[];
  onJump: (groupId: string) => void;
}) {
  return (
    <nav aria-label="Connection groups" className="connection-group-nav">
      <ul>
        {props.groups.map((group) => (
          <li key={group.id}>
            <button
              className="connection-group-nav-link"
              onClick={() => props.onJump(group.id)}
              type="button"
            >
              <span>{group.label}</span>
              <strong>
                {group.items.length}
                <span className="visually-hidden">
                  {` connection${group.items.length === 1 ? "" : "s"}`}
                </span>
              </strong>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function ExpandableChipList(props: {
  items: Array<{ id: string; term: string }>;
  limit?: number;
  onSelect: (id: string) => void;
}) {
  const limit = props.limit ?? 12;
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? props.items : props.items.slice(0, limit);
  const hiddenCount = props.items.length - limit;

  return (
    <>
      <div className="chip-row">
        {visible.map((entry) => (
          <button
            className="chip chip-link"
            key={entry.id}
            onClick={() => props.onSelect(entry.id)}
            type="button"
          >
            {entry.term}
          </button>
        ))}
      </div>
      {!expanded && hiddenCount > 0 ? (
        <div className="card-actions">
          <Button
            variant="secondary-quiet"
            onClick={() => setExpanded(true)}
            type="button"
          >
            Show all {props.items.length} terms
          </Button>
        </div>
      ) : null}
    </>
  );
}

export function ExpandableControlList(props: {
  controls: Array<{
    control_node: {
      id: string;
      label?: string;
      metadata?: { item_id?: string; title?: string };
    };
    source_refs?: Array<Record<string, string>>;
  }>;
  onOpenNode: (nodeId: string) => void;
  sourceRefList: (refs?: Array<Record<string, string>>) => ReactNode;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = props.controls.slice(0, visibleCount);
  const remaining = props.controls.length - visible.length;

  if (!props.controls.length) {
    return <p className="muted">No controls in this section.</p>;
  }

  return (
    <>
      <ul className="source-ref-list">
        {visible.map((entry) => {
          const control = entry.control_node;
          const itemId = control.metadata?.item_id || control.id;
          const title = control.metadata?.title || control.label || itemId;
          return (
            <li key={control.id}>
              <button
                className="link-action"
                onClick={() => props.onOpenNode(control.id)}
                type="button"
              >
                <strong>{itemId}</strong> — {title}
              </button>
              {props.sourceRefList(entry.source_refs)}
            </li>
          );
        })}
      </ul>
      {props.controls.length > PAGE_SIZE ? (
        <p className="list-progress">
          Showing {visible.length} of {props.controls.length}
        </p>
      ) : null}
      {remaining > 0 ? (
        <div className="card-actions">
          <Button
            variant="secondary-quiet"
            onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
            type="button"
          >
            Show {Math.min(PAGE_SIZE, remaining)} more
          </Button>
        </div>
      ) : null}
    </>
  );
}
