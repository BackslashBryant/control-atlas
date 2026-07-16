import { useEffect, useMemo, useRef } from "react";

/**
 * Minimal structural types compatible with both the Foundation page's
 * VisibleGraphNode/Edge model and the runtime neighborhood graph.
 */
type MatrixNode = {
  id: string;
  label?: string;
  node_type?: string;
  graphRole?: string;
  metadata?: {
    item_id?: string;
    title?: string;
    hierarchyTier?: string;
  };
};

type MatrixEdge = {
  source_node_id: string;
  target_node_id: string;
  provenance_class?: string;
};

type AtlasMatrixProps = {
  nodes: MatrixNode[];
  edges: MatrixEdge[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
};

type Coverage = "official" | "inferred" | "none";

// Canonical purpose hierarchy, ordered rules → supporting sources. Columns are the
// subset of these that the current graph actually contains.
const LAYER_ORDER = [
  "Rules",
  "Frameworks",
  "Controls",
  "Baselines",
  "Implementation",
  "Assessment",
  "Mappings",
  "Threat / Defense",
  "Supporting Sources",
] as const;

type Layer = (typeof LAYER_ORDER)[number];

const TIER_TO_LAYER: Record<string, Layer> = {
  authority: "Rules",
  "governance-risk-framework": "Frameworks",
  "control-catalog-requirement-set": "Controls",
  "baseline-overlay-program-profile": "Baselines",
  "implementation-configuration-standard": "Implementation",
  "assessment-scoping-procedure": "Assessment",
  "control-mapping-crosswalk": "Mappings",
  "threat-defensive-mapping": "Threat / Defense",
  "supporting-reference": "Supporting Sources",
};

const ROLE_TO_LAYER: Record<string, Layer> = {
  authority: "Rules",
  "governance-framework": "Frameworks",
  "nist-control": "Controls",
  "control-catalog": "Controls",
  "baseline-overlay-profile": "Baselines",
  "implementation-standard": "Implementation",
  "assessment-scoping": "Assessment",
  "mapping-crosswalk": "Mappings",
  "threat-defense": "Threat / Defense",
  "supporting-reference": "Supporting Sources",
};

function layerOf(node: MatrixNode): Layer | null {
  const tier = node.metadata?.hierarchyTier ?? "";
  if (TIER_TO_LAYER[tier]) return TIER_TO_LAYER[tier];
  const role = node.graphRole ?? "";
  if (ROLE_TO_LAYER[role]) return ROLE_TO_LAYER[role];
  return null;
}

function classifyProvenance(provenance: string | undefined): Coverage {
  const value = (provenance ?? "").toLowerCase();
  if (
    value.includes("inferred") ||
    value.includes("community") ||
    value.includes("candidate")
  ) {
    return "inferred";
  }
  return "official";
}

function rowLabel(node: MatrixNode): string {
  return node.metadata?.item_id || node.label || node.metadata?.title || node.id;
}

// Hierarchy/scaffold ids that should never appear as their own matrix rows.
function isRowEligible(node: MatrixNode): boolean {
  if (node.id.startsWith("starter:")) return false;
  return Boolean(node.metadata?.item_id || node.label);
}

const COVERAGE_LABEL: Record<Coverage, string> = {
  official: "Official mapping",
  inferred: "Inferred or community mapping",
  none: "Not mapped",
};

export function AtlasMatrix(props: AtlasMatrixProps) {
  const { nodes, edges, selectedNodeId, onSelectNode } = props;
  const selectedRowRef = useRef<HTMLTableRowElement | null>(null);

  const { rows, columns, coverageFor } = useMemo(() => {
    const eligible = nodes.filter(isRowEligible);

    const layerById = new Map<string, Layer | null>();
    for (const node of nodes) {
      layerById.set(node.id, layerOf(node));
    }

    // Columns: layers present among eligible rows, in canonical order.
    const present = new Set<Layer>();
    for (const node of eligible) {
      const layer = layerById.get(node.id);
      if (layer) present.add(layer);
    }
    const cols = LAYER_ORDER.filter((layer) => present.has(layer));

    // Index edges by the nodes they touch for quick neighbour lookups.
    const neighbours = new Map<string, MatrixEdge[]>();
    for (const edge of edges) {
      for (const id of [edge.source_node_id, edge.target_node_id]) {
        const list = neighbours.get(id);
        if (list) list.push(edge);
        else neighbours.set(id, [edge]);
      }
    }

    function coverage(node: MatrixNode, column: Layer): Coverage {
      if (layerById.get(node.id) === column) return "official";
      let best: Coverage = "none";
      for (const edge of neighbours.get(node.id) ?? []) {
        const otherId =
          edge.source_node_id === node.id
            ? edge.target_node_id
            : edge.source_node_id;
        if (layerById.get(otherId) === column) {
          const provenance = classifyProvenance(edge.provenance_class);
          if (provenance === "official") return "official";
          best = "inferred";
        }
      }
      return best;
    }

    return { rows: eligible, columns: cols, coverageFor: coverage };
  }, [nodes, edges]);

  useEffect(() => {
    selectedRowRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedNodeId]);

  return (
    <section aria-label="Coverage matrix" className="atlas-matrix">
      <div className="atlas-matrix-scroll">
        <table aria-label="Atlas coverage matrix">
          <thead>
            <tr>
              <th scope="col">Item</th>
              {columns.map((column) => (
                <th key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((node) => {
              const selected = node.id === selectedNodeId;
              return (
                <tr
                  aria-selected={selected}
                  key={node.id}
                  onClick={() => onSelectNode(node.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectNode(node.id);
                    }
                  }}
                  ref={selected ? selectedRowRef : undefined}
                  tabIndex={0}
                >
                  <th className="atlas-matrix-row-head" scope="row">
                    {rowLabel(node)}
                  </th>
                  {columns.map((column) => {
                    const kind = coverageFor(node, column);
                    return (
                      <td className="coverage-cell" key={column}>
                        <span
                          aria-label={COVERAGE_LABEL[kind]}
                          className={`atlas-coverage-dot atlas-coverage-dot--${kind}`}
                          role="img"
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="atlas-matrix-legend">
        <span>
          <span className="atlas-coverage-dot atlas-coverage-dot--official" />{" "}
          Official mapping
        </span>
        <span>
          <span className="atlas-coverage-dot atlas-coverage-dot--inferred" />{" "}
          Inferred / community
        </span>
        <span>
          <span className="atlas-coverage-dot atlas-coverage-dot--none" /> Not
          mapped
        </span>
      </p>
    </section>
  );
}
