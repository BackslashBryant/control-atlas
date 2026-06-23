import { displayNameFor } from "../../app/display-names.mjs";
import { ProvenanceTerm } from "./ProvenanceTerm";

type ObjectCardProps = {
  itemId: string;
  title: string;
  objectType: string;
  summary?: string;
  connectionCount?: number;
  provenanceClass?: string;
  onOpen: () => void;
};

export function ObjectCard(props: ObjectCardProps) {
  const {
    itemId,
    title,
    objectType,
    summary,
    connectionCount,
    provenanceClass,
    onOpen,
  } = props;
  return (
    <article className="result-card object-card">
      <div className="result-card-header">
        <div className="object-card-meta">
          <span className="result-meta">
            {displayNameFor("object_type", objectType)}
          </span>
          <code className="object-card-id">{itemId}</code>
        </div>
        {typeof connectionCount === "number" ? (
          <span className="badge tone-info">
            {connectionCount} connection{connectionCount === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>
      <h3>{title}</h3>
      <p className="result-summary">
        {summary ||
          "No plain-language summary available — open to review source text."}
      </p>
      {!summary ? (
        <p className="warning-inline">Plain-language summary missing.</p>
      ) : null}
      <div className="card-actions">
        {provenanceClass ? (
          <ProvenanceTerm kind="provenance" value={provenanceClass} />
        ) : null}
        <button className="secondary" onClick={onOpen} type="button">
          Open record
        </button>
      </div>
    </article>
  );
}
