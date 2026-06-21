import { groupRelationships } from "../../app/relationship-groups.mjs";
import { displayNameFor } from "../../app/display-names.mjs";
import type { RuntimeBundle } from "../lib/runtimeLoader";

type SelectedItemPanelProps = {
  runtime: RuntimeBundle["runtime"];
  selectedNodeId: string | null;
  centerNodeId: string;
  connectionCount: number;
  onOpenRecord: (nodeId: string) => void;
  onOpenCompare: (itemId: string) => void;
  onOpenTemplates: () => void;
  onCopyLink: () => void;
};

export function SelectedItemPanel(props: SelectedItemPanelProps) {
  const {
    runtime,
    selectedNodeId,
    centerNodeId,
    connectionCount,
    onOpenRecord,
    onOpenCompare,
    onOpenTemplates,
    onCopyLink,
  } = props;

  if (!selectedNodeId) {
    return (
      <aside aria-label="Selected item" className="atlas-selected-panel empty">
        <p className="muted">
          Search for an item or select a node on the map to see details here.
        </p>
      </aside>
    );
  }

  const node = runtime.getNode(selectedNodeId);
  const document = runtime.getLibraryDocument(selectedNodeId);
  const source = document
    ? runtime.getSource(document.source_id)
    : runtime.getSource(node?.source_id);
  const itemId = document?.item_id || node?.metadata?.item_id || selectedNodeId;
  const title = document?.title || node?.metadata?.title || node?.label || itemId;
  const edges = node
    ? runtime.getEdgesForNode(node.id, { publication_status: "published" })
    : [];
  const grouped = node
    ? groupRelationships(edges, node.id, runtime)
    : [];
  const groupSummary = grouped
    .map((group) => `${group.items.length} ${group.label.toLowerCase()}`)
    .join(", ");

  return (
    <aside aria-label="Selected item" className="atlas-selected-panel">
      <p className="eyebrow">{itemId}</p>
      <h2>{title}</h2>
      <dl className="atlas-selected-meta">
        <div>
          <dt>Type</dt>
          <dd>{displayNameFor("object_type", document?.object_type || node?.node_type || "")}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{source?.display_name || source?.name || "Unavailable"}</dd>
        </div>
        <div>
          <dt>Connections</dt>
          <dd>{connectionCount || edges.length}</dd>
        </div>
      </dl>

      <div className="card-actions atlas-selected-actions">
        {selectedNodeId !== centerNodeId || document ? (
          <button
            className="primary"
            onClick={() => onOpenRecord(selectedNodeId)}
            type="button"
          >
            Open record
          </button>
        ) : null}
        {document ? (
          <button
            className="secondary"
            onClick={() => onOpenCompare(document.item_id)}
            type="button"
          >
            Compare
          </button>
        ) : null}
        <button className="secondary" onClick={onOpenTemplates} type="button">
          Open related templates
        </button>
        <button className="secondary quiet" onClick={onCopyLink} type="button">
          Copy link
        </button>
      </div>

      {grouped.length ? (
        <section className="atlas-connected-groups">
          <h3>Connected to</h3>
          <p className="muted">
            {connectionCount || edges.length} connections across {grouped.length}{" "}
            groups{groupSummary ? `: ${groupSummary}.` : "."}
          </p>
          <ul className="atlas-group-list">
            {grouped.map((group) => (
              <li key={group.id}>
                <strong>
                  {group.items.length} {group.label}
                </strong>
                {group.items[0]?.counterpart ? (
                  <span className="muted">
                    {" "}
                    · e.g.{" "}
                    {group.items[0].counterpart.metadata?.item_id ||
                      group.items[0].counterpart.id}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {node && !document ? (
        <p className="muted">Starter group — select Explore or search to open records.</p>
      ) : null}
    </aside>
  );
}
