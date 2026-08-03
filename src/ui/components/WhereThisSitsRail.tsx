import { Fragment, useMemo } from "react";
import { IconChevronRight } from "@tabler/icons-react";

import {
  ancestorChain,
  buildAncestorGraph,
  type AncestorLink,
} from "../lib/ancestorPath";
import type { RuntimeBundle } from "../lib/runtimeLoader";

/**
 * W7.2 — the persistent "Where this sits" tree path. Walks the W1.6
 * structural ancestor chain (the only relationship class this doctrine
 * lets a breadcrumb walk — docs/tree-model.md #3) and renders it
 * root-first. Reuses the atlas-path-breadcrumb idiom already built for
 * the Atlas decomposition board instead of inventing a new breadcrumb.
 */
export function WhereThisSitsRail(props: {
  bundle?: RuntimeBundle;
  nodeId?: string;
  links?: AncestorLink[];
  onOpenNode: (nodeId: string) => void;
}) {
  const { bundle, nodeId = "", links, onOpenNode } = props;
  const graph = useMemo(
    () =>
      buildAncestorGraph(
        bundle?.runtime.dataset.nodes || [],
        bundle?.runtime.dataset.edges || [],
      ),
    [bundle?.runtime],
  );
  const derivedChain = useMemo(
    () => ancestorChain(nodeId, graph),
    [nodeId, graph],
  );
  const selectedNode = nodeId ? bundle?.runtime.getNode(nodeId) : null;
  // Records ship with their path to the trunk attached (see
  // attachAncestorPaths in scripts/build-framework-data.mjs). The record page
  // holds one neighborhood shard, not the whole graph, so a runtime walk here
  // can only reach one hop up; the precomputed path is the complete one.
  const attachedChain: AncestorLink[] | null = selectedNode?.ancestor_path
    ?.length
    ? [
        ...(selectedNode.ancestor_path as AncestorLink[]),
        {
          id: selectedNode.id,
          label:
            selectedNode.metadata?.title ||
            selectedNode.label ||
            selectedNode.id,
          node_type: selectedNode.node_type || "",
          origin: "structural" as const,
        },
      ]
    : null;
  const chain =
    links ||
    (attachedChain && attachedChain.length > derivedChain.length
      ? attachedChain
      : derivedChain);
  const unavailable =
    !links &&
    Boolean(nodeId) &&
    (chain.length === 0 ||
      (chain.length === 1 &&
        chain[0]?.id === nodeId &&
        selectedNode?.node_type !== "catalog"));

  if (unavailable) {
    return (
      <p className="tree-path-unavailable" role="status">
        No structural path published for this record.
      </p>
    );
  }

  if (chain.length === 0) return null;

  const organizingLabel = "Control Atlas structure, not publisher-declared";
  const lastId = chain[chain.length - 1].id;

  // Two rails, not one mixed breadcrumb: consecutive hops of the same origin
  // group under one label ("Control Atlas structure" or "Publisher
  // hierarchy") instead of one heading claiming the whole chain is
  // publisher-declared when some hops are Control Atlas's own spine. Most
  // chains produce exactly two groups (organizing spine, then the publisher's
  // native tree); a record whose own parent is itself organizing-derived
  // (e.g. a CCI) can produce more, and each still renders under its true rail.
  const segments: { origin: AncestorLink["origin"]; links: AncestorLink[] }[] = [];
  for (const link of chain) {
    const current = segments[segments.length - 1];
    if (current && current.origin === link.origin) {
      current.links.push(link);
    } else {
      segments.push({ origin: link.origin, links: [link] });
    }
  }

  return (
    <nav aria-label="Where this sits" className="tree-path-rail">
      {segments.map((segment, segmentIndex) => {
        const isOrganizing = segment.origin === "organizing";
        return (
          <Fragment key={segmentIndex}>
            {segmentIndex > 0 ? (
              <span aria-hidden="true" className="tree-path-rail-connector">
                <IconChevronRight size={13} />
              </span>
            ) : null}
            <div
              className={
                isOrganizing
                  ? "tree-path-rail-row tree-path-rail-row-organizing"
                  : "tree-path-rail-row tree-path-rail-row-structural"
              }
            >
              <span className="tree-path-rail-label">
                {isOrganizing ? "Control Atlas structure" : "Publisher hierarchy"}
              </span>
              <div className="atlas-path-breadcrumb">
                {segment.links.map((link, index) => {
                  const isSubject = link.id === lastId;
                  return (
                    <Fragment key={link.id}>
                      {index > 0 ? <IconChevronRight aria-hidden="true" size={15} /> : null}
                      {isSubject ? (
                        <span
                          className={
                            isOrganizing
                              ? "atlas-path-crumb-subject atlas-path-crumb-organizing"
                              : "atlas-path-crumb-subject"
                          }
                        >
                          {link.label}
                        </span>
                      ) : (
                        <button
                          className={
                            isOrganizing
                              ? "atlas-path-crumb-link atlas-path-crumb-organizing"
                              : "atlas-path-crumb-link"
                          }
                          onClick={() => onOpenNode(link.id)}
                          type="button"
                          aria-label={isOrganizing ? `${link.label} — ${organizingLabel}` : undefined}
                          title={isOrganizing ? organizingLabel : undefined}
                        >
                          {link.label}
                        </button>
                      )}
                    </Fragment>
                  );
                })}
              </div>
            </div>
          </Fragment>
        );
      })}
    </nav>
  );
}
