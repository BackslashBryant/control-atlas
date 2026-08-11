import type { RuntimeBundle } from "../lib/runtimeLoader";
import { canonicalBreadcrumbForNode } from "../lib/canonicalBreadcrumb";

export function CanonicalBreadcrumb(props: {
  bundle: RuntimeBundle;
  nodeId: string;
  recordLabel?: string;
}) {
  const breadcrumb = canonicalBreadcrumbForNode(
    props.bundle,
    props.nodeId,
    props.recordLabel,
  );
  if (!breadcrumb.text) return null;
  return (
    <nav aria-label="Canonical breadcrumb" className="canonical-breadcrumb" data-canonical-breadcrumb={breadcrumb.text}>
      <span>{breadcrumb.text}</span>
    </nav>
  );
}
