import { displayNameFor } from "../../app/display-names.mjs";
import { ProvenanceBadge } from "../lib/compareHelpers";

type TableRow = {
  edge: {
    relationship_type: string;
    provenance_class: string;
    publication_status: string;
    confidence: string;
    plain_language_rationale?: string;
  };
  counterpart: { id: string };
  itemId: string;
  title: string;
};

export function RelationshipGraphTable(props: {
  rows: TableRow[];
  onOpenNode: (nodeId: string) => void;
}) {
  const { rows, onOpenNode } = props;

  if (!rows.length) {
    return (
      <p className="muted" id="relationship-table-empty">
        No connections match the current filters. Clear filters or include
        inferred links to see more.
      </p>
    );
  }

  return (
    <table
      aria-label="Relationship table"
      className="detail-table relationship-graph-table"
    >
      <thead>
        <tr>
          <th scope="col">Connected item</th>
          <th scope="col">Connection</th>
          <th scope="col">Source basis</th>
          <th scope="col">Trust level</th>
          <th scope="col">Plain-language rationale</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ edge, counterpart, itemId, title }) => (
          <tr key={`${edge.relationship_type}-${counterpart.id}`}>
            <td>
              <button
                className="link-action"
                onClick={() => onOpenNode(counterpart.id)}
                type="button"
              >
                <strong>{itemId}</strong> — {title}
              </button>
            </td>
            <td>
              {displayNameFor("relationship_type", edge.relationship_type)}
            </td>
            <td>
              <ProvenanceBadge
                provenanceClass={edge.provenance_class}
                publicationStatus={edge.publication_status}
              />
            </td>
            <td>{displayNameFor("confidence", edge.confidence)}</td>
            <td>
              {edge.plain_language_rationale ||
                "No plain-language rationale recorded."}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
