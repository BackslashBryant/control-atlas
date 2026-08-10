import { Fragment, useMemo } from "react";
import { IconChevronRight } from "@tabler/icons-react";

import {
  ancestorChain,
  buildAncestorGraph,
  type AncestorLink,
} from "../lib/ancestorPath";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import authoritySpine from "../../../data/curated/authority-spine.json";
import {
  buildAtlasTreeModel,
  extendDisplayedAuthorityTrace,
  type AtlasTraceHop,
} from "../lib/atlasTreeModel";
import { RecordLink } from "./RecordLink";

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
  canonicalBreadcrumb?: string;
  onOpenNode: (nodeId: string) => void;
}) {
  const { bundle, canonicalBreadcrumb, nodeId = "", links, onOpenNode } = props;
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
  const displayedChain: AncestorLink[] | null = selectedNode?.display_path
    ?.length
    ? [
        ...(selectedNode.display_path as AncestorLink[]),
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
  const baseChain =
    links ||
    displayedChain ||
    (attachedChain && attachedChain.length > derivedChain.length
      ? attachedChain
      : derivedChain);
  const chain = useMemo(
    () => bundle?.atlasSpine && baseChain.length
      ? extendDisplayedAuthorityTrace(
          buildAtlasTreeModel(bundle.atlasSpine, authoritySpine),
          baseChain as AtlasTraceHop[],
        )
      : baseChain,
    [baseChain, bundle?.atlasSpine],
  );
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

  const organizingLabel = "Control Atlas structure";
  const authorityLabel = "Official authority";
  const lastId = chain[chain.length - 1].id;

  // Separate rails preserve three different claims: a source-verified
  // authority hop composed for display, Control Atlas's curated organizing
  // spine, and the publisher's native hierarchy. None is allowed to borrow
  // the attribution of another.
  const segments: { origin: AncestorLink["origin"]; links: AtlasTraceHop[] }[] = [];
  for (const link of chain) {
    const current = segments[segments.length - 1];
    if (current && current.origin === link.origin) {
      current.links.push(link);
    } else {
      segments.push({ origin: link.origin, links: [link] });
    }
  }

  return (
    <nav
      aria-label="Where this sits"
      className="tree-path-rail"
      data-canonical-breadcrumb={canonicalBreadcrumb || undefined}
      data-displayed-trace={chain.map((link) => link.id).join(">")}
    >
      {segments.map((segment, segmentIndex) => {
        const isOrganizing = segment.origin === "organizing";
        const isAuthority = segment.origin === "authority";
        const segmentLabel = isAuthority
          ? "Authority"
          : isOrganizing
            ? "Control Atlas structure"
            : "Publisher hierarchy";
        return (
          <Fragment key={segmentIndex}>
            <div
              className={
                isAuthority
                  ? "tree-path-rail-row tree-path-rail-row-authority"
                  : isOrganizing
                  ? "tree-path-rail-row tree-path-rail-row-organizing"
                  : "tree-path-rail-row tree-path-rail-row-structural"
              }
            >
              <span className="tree-path-rail-label">
                {segmentLabel}
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
                            isAuthority
                              ? "atlas-path-crumb-subject atlas-path-crumb-authority"
                              : isOrganizing
                              ? "atlas-path-crumb-subject atlas-path-crumb-organizing"
                              : "atlas-path-crumb-subject"
                          }
                        >
                          {link.label}
                          {link.rationale || link.source_refs?.length ? (
                            <span className="sr-only">. {link.rationale || ""} {link.source_refs?.map((ref) => ref.locator || ref.source_id).filter(Boolean).join(". ") || ""}</span>
                          ) : null}
                        </span>
                      ) : (
                        <RecordLink
                          className={
                            isAuthority
                              ? "atlas-path-crumb-link atlas-path-crumb-authority"
                              : isOrganizing
                              ? "atlas-path-crumb-link atlas-path-crumb-organizing"
                              : "atlas-path-crumb-link"
                          }
                          nodeId={link.id}
                          onOpenNode={onOpenNode}
                          aria-label={
                            isAuthority
                              ? `${link.label} — ${authorityLabel}`
                              : isOrganizing
                                ? `${link.label} — ${organizingLabel}`
                                : undefined
                          }
                          title={
                            isAuthority
                              ? authorityLabel
                              : isOrganizing
                                ? organizingLabel
                                : undefined
                          }
                        >
                          {link.label}
                          {link.rationale || link.source_refs?.length ? (
                            <span className="sr-only">. {link.rationale || ""} {link.source_refs?.map((ref) => ref.locator || ref.source_id).filter(Boolean).join(". ") || ""}</span>
                          ) : null}
                        </RecordLink>
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
