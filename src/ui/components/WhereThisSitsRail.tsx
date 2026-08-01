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
        Structural path unavailable. Control Atlas will not infer a parent from
        applicability, mappings, implementation, assessment, or evidence links.
      </p>
    );
  }

  if (chain.length === 0) return null;

  const organizingLabel = "Control Atlas structure, not publisher-declared";
  // Every organizing hop stays visually distinct and keeps its aria-label, but
  // the word badge prints once. A CCI chain has four of them, and repeating
  // "Atlas" four times across one breadcrumb read as noise, not as provenance.
  const firstOrganizingId = chain.find((link) => link.origin === "organizing")?.id;

  return (
    <nav aria-label="Where this sits" className="atlas-path-breadcrumb tree-path-rail">
      {chain.map((link, index) => {
        const isOrganizing = link.origin === "organizing";
        const isSubject = index === chain.length - 1;
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
                {isOrganizing && link.id === firstOrganizingId ? (
                  <span className="atlas-path-crumb-badge" aria-hidden="true">
                    Atlas structure
                  </span>
                ) : null}
              </button>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
