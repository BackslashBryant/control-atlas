import type { RuntimeBundle } from "./runtimeLoader";

const SECTION_TYPES = new Set([
  "benchmark",
  "category",
  "family",
  "function",
  "group",
  "section",
  "tactic",
  "zt_overlay_section",
  "zt_pillar",
]);

export type CanonicalBreadcrumb = {
  items: string[];
  text: string;
};

function clean(value: unknown): string {
  return String(value || "").trim();
}

export function canonicalBreadcrumbForNode(
  bundle: RuntimeBundle,
  nodeId: string,
  recordLabel?: string,
): CanonicalBreadcrumb {
  const node = bundle.runtime.getNode(nodeId);
  const document = bundle.runtime.getLibraryDocument(nodeId);
  if (!node || !document) return { items: [], text: "" };

  const catalog = bundle.runtime
    .getCatalogs()
    .find((entry: any) => entry.id === document.catalog_id);
  const source = bundle.runtime.getSource(node.source_id);
  const path = (node.ancestor_path || []) as Array<Record<string, unknown>>;
  const area = [...path].reverse().find((entry) => entry.node_type === "limb");
  const section = [...path]
    .reverse()
    .find((entry) => SECTION_TYPES.has(clean(entry.node_type)));
  const publisher =
    clean(document.publisher_name) ||
    clean(catalog?.display_group) ||
    clean(source?.publisher) ||
    clean(source?.owner) ||
    "Publisher unavailable";
  const publication =
    clean(catalog?.name) || clean(document.catalog_name) || clean(document.catalog_id);
  const record = clean(recordLabel) || clean(document.item_id) || clean(node.label) || node.id;
  const items = [clean(area?.label), publisher, publication, clean(section?.label), record]
    .filter(Boolean)
    .filter((value, index, values) => index === 0 || value !== values[index - 1]);
  return { items, text: items.join(" › ") };
}
