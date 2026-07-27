import { displayNameFor } from "../../app/display-names.mjs";
import { ProvenanceTerm } from "./ProvenanceTerm";
import { ProvenanceBadge } from "../lib/compareHelpers";

type TableRow = {
  edge: {
    id?: string;
    source_node_id?: string;
    target_node_id?: string;
    relationship_type: string;
    relationship_class?: string;
    provenance_class: string;
    publication_status: string;
    confidence: string;
    evidence_ids?: string[];
    source_refs?: Array<{
      source_id?: string;
      ref_type?: string;
      locator?: string;
    }>;
    rationale?: string;
    plain_language_rationale?: string;
  };
  counterpart: { id: string };
  itemId: string;
  title: string;
};

function conciseRationale(value?: string) {
  if (!value) return "No plain-language rationale recorded.";
  return value.replace(/\s+Review both sides of this .*$/i, "").trim() || value;
}

export function RelationshipGraphTable(props: {
  rows: TableRow[];
  onOpenNode: (nodeId: string) => void;
  conciseTrust?: boolean;
  centerNodeId?: string;
}) {
  const { rows, onOpenNode, conciseTrust = false, centerNodeId = "" } = props;

  if (!rows.length) {
    return (
      <p className="muted" id="relationship-table-empty">
        No connections match the current filters. Clear filters or include
        inferred links to see more.
      </p>
    );
  }

  return (
    <div className="compare-table-scroll">
      <table
        aria-label="Relationship table"
        className="detail-table relationship-graph-table"
      >
        <thead>
          <tr>
            <th scope="col">Connected item</th>
            <th scope="col">Connection</th>
            <th scope="col">Class and direction</th>
            <th scope="col">Source basis</th>
            <th scope="col">Trust level</th>
            <th scope="col">Why it matters</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ edge, counterpart, itemId, title }) => (
            <tr key={`${edge.id || edge.relationship_type}-${counterpart.id}`}>
              <td data-label="Connected item">
                <button
                  className="link-action"
                  onClick={() => onOpenNode(counterpart.id)}
                  type="button"
                >
                  <strong>{itemId}</strong> — {title}
                </button>
              </td>
              <td data-label="Connection">
                {displayNameFor("relationship_type", edge.relationship_type)}
              </td>
              <td data-label="Class and direction">
                <strong>
                  {edge.relationship_class === "structural"
                    ? "Structure"
                    : edge.relationship_class === "applicability"
                      ? "Applicability"
                      : "Correlation"}
                </strong>
                <br />
                {centerNodeId && edge.source_node_id === centerNodeId
                  ? "From selected record"
                  : centerNodeId && edge.target_node_id === centerNodeId
                    ? "To selected record"
                    : "Connected records"}
              </td>
              <td data-label="Source basis">
                {conciseTrust ? (
                  <span
                    className={`badge tone-${edge.publication_status === "candidate" ? "warning" : "success"}`}
                  >
                    <ProvenanceTerm
                      kind="provenance"
                      value={edge.provenance_class}
                    />
                  </span>
                ) : (
                  <ProvenanceBadge
                    provenanceClass={edge.provenance_class}
                    publicationStatus={edge.publication_status}
                  />
                )}
              </td>
              <td data-label="Trust level">
                {displayNameFor("confidence", edge.confidence)}
              </td>
              <td data-label="Why it matters">
                {conciseRationale(edge.plain_language_rationale)}
                {edge.source_refs?.length ? (
                  <details className="relationship-source-refs">
                    <summary>
                      {edge.source_refs.length} source reference
                      {edge.source_refs.length === 1 ? "" : "s"}
                    </summary>
                    <ul>
                      {edge.source_refs.map((reference, index) => (
                        <li key={`${reference.source_id || "source"}-${index}`}>
                          <strong>
                            {reference.source_id
                              ? displayNameFor("source_id", reference.source_id)
                              : "Source"}
                          </strong>
                          {reference.locator ? ` — ${reference.locator}` : ""}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
