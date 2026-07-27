import { Fragment, useMemo } from "react";
import { IconChevronRight } from "@tabler/icons-react";

import { ancestorChain, buildAncestorGraph } from "../lib/ancestorPath";
import type { RuntimeBundle } from "../lib/runtimeLoader";

/**
 * W7.2 — the persistent "Where this sits" tree path. Walks the W1.6
 * structural ancestor chain (the only relationship class this doctrine
 * lets a breadcrumb walk — docs/tree-model.md #3) and renders it
 * root-first. Reuses the atlas-path-breadcrumb idiom already built for
 * the Atlas decomposition board instead of inventing a new breadcrumb.
 */
export function WhereThisSitsRail(props: {
  bundle: RuntimeBundle;
  nodeId: string;
  onOpenNode: (nodeId: string) => void;
}) {
  const { bundle, nodeId, onOpenNode } = props;
  const graph = useMemo(
    () =>
      buildAncestorGraph(
        bundle.runtime.dataset.nodes,
        bundle.runtime.dataset.edges,
      ),
    [bundle.runtime],
  );
  const chain = useMemo(() => ancestorChain(nodeId, graph), [nodeId, graph]);

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
