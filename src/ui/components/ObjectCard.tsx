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
  const missingSummary = !summary;

  return (
    <article className="result-card object-card">
      <div className="result-card-header">
        <div>
          <p className="result-meta">{displayNameFor("object_type", objectType)}</p>
          <h3>{title}</h3>
        </div>
        {typeof connectionCount === "number" ? (
          <span className="badge tone-info">
            {connectionCount} connection{connectionCount === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>
      <p className="result-summary">
        {summary ||
          "Plain-language summary missing — open the record to review source text."}
      </p>
      {missingSummary ? (
        <p className="warning-inline">Plain-language summary missing.</p>
      ) : null}
      <div className="card-actions">
        {provenanceClass ? (
          <ProvenanceTerm kind="provenance" value={provenanceClass} />
        ) : null}
        <button className="primary" onClick={onOpen} type="button">
          Open record
        </button>
      </div>
      <p className="support-meta">
        <code>{itemId}</code>
      </p>
    </article>
  );
}
