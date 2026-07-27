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
  const chain = links || derivedChain;
  const selectedNode = nodeId ? bundle?.runtime.getNode(nodeId) : null;
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

  return (
    <nav aria-label="Where this sits" className="atlas-path-breadcrumb tree-path-rail">
      {chain.map((link, index) => (
        <Fragment key={link.id}>
          {index > 0 ? <IconChevronRight aria-hidden="true" size={15} /> : null}
          {index === chain.length - 1 ? (
            <span className="atlas-path-crumb-subject">{link.label}</span>
          ) : (
            <button
              className="atlas-path-crumb-link"
              onClick={() => onOpenNode(link.id)}
              type="button"
            >
              {link.label}
            </button>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
