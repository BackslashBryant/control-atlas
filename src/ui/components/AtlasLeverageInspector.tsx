import type {
  CrossFrameworkGroup,
  ImpactBreakdown,
} from "../lib/recordTitle";

type AtlasLeverageInspectorProps = {
  /** Human title of the focused record, e.g. "AC-2 — Account Management". */
  title: string;
  impact: ImpactBreakdown;
  /** Equivalents in other requirement frameworks (CSF, 800-171, …). */
  equivalents?: CrossFrameworkGroup[];
  /** Open the full record (all connections, provenance). */
  onOpenRecord?: () => void;
  /** Focus the map on a single connected type (e.g. only the CCIs). */
  onExploreType?: (nodeType: string) => void;
  /** Open a connected node (e.g. a cross-framework equivalent). */
  onOpenNode?: (nodeId: string) => void;
};

/**
 * Floating "leverage" inspector for a focused control/record: answers the
 * practitioner's core question — "if I implement this, what else do I satisfy?"
 * — by surfacing the birds-per-stone impact breakdown right on the canvas
 * (Phase D2). Collapsible so it never obscures the graph.
 */
export function AtlasLeverageInspector(props: AtlasLeverageInspectorProps) {
  const { title, impact, equivalents, onOpenRecord, onExploreType, onOpenNode } =
    props;
  const showEquivalents = equivalents !== undefined;
  return (
    <details className="atlas-leverage" open>
      <summary>
        <span className="atlas-leverage-eyebrow">Leverage</span>
        Implementing this also satisfies
      </summary>
      <div className="atlas-leverage-body">
        <p className="atlas-leverage-record">{title}</p>
        {impact.total > 0 ? (
          <>
            <p className="atlas-leverage-total">
              <strong>{impact.total}</strong> connected requirement
              {impact.total === 1 ? "" : "s"} across the frameworks you get
              assessed on:
            </p>
            <ul className="atlas-leverage-list">
              {impact.byType.slice(0, 6).map((entry) =>
                onExploreType ? (
                  <li key={entry.nodeType}>
                    <button
                      className="atlas-leverage-row"
                      onClick={() => onExploreType(entry.nodeType)}
                      type="button"
                    >
                      <span className="atlas-leverage-count">{entry.count}</span>
                      <span>{entry.label}</span>
                    </button>
                  </li>
                ) : (
                  <li key={entry.nodeType}>
                    <span className="atlas-leverage-row atlas-leverage-row--static">
                      <span className="atlas-leverage-count">{entry.count}</span>
                      <span>{entry.label}</span>
                    </span>
                  </li>
                ),
              )}
              {impact.byType.length > 6 ? (
                <li className="atlas-leverage-more">
                  …and{" "}
                  {impact.byType
                    .slice(6)
                    .reduce((sum, entry) => sum + entry.count, 0)}{" "}
                  more
                </li>
              ) : null}
            </ul>
          </>
        ) : (
          <p className="muted">No published connections yet for this record.</p>
        )}
        {showEquivalents ? (
          <div className="atlas-leverage-frameworks">
            <p className="atlas-leverage-subhead">Cross-framework equivalents</p>
            {equivalents && equivalents.length > 0 ? (
              <ul className="atlas-leverage-list">
                {equivalents.map((group) => (
                  <li key={group.catalogId} className="atlas-leverage-fw">
                    <span className="atlas-leverage-fw-label">{group.label}</span>
                    <span className="atlas-leverage-fw-items">
                      {group.items.slice(0, 4).map((item, index) => (
                        <span key={item.nodeId}>
                          {index > 0 ? ", " : ""}
                          {onOpenNode ? (
                            <button
                              className="atlas-leverage-chip"
                              onClick={() => onOpenNode(item.nodeId)}
                              type="button"
                            >
                              {item.itemId}
                            </button>
                          ) : (
                            item.itemId
                          )}
                        </span>
                      ))}
                      {group.items.length > 4
                        ? ` +${group.items.length - 4}`
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">
                No published cross-framework mapping ingested for this record
                yet.
              </p>
            )}
          </div>
        ) : null}
        {onOpenRecord ? (
          <button
            className="secondary atlas-leverage-open"
            onClick={onOpenRecord}
            type="button"
          >
            See full record
          </button>
        ) : null}
      </div>
    </details>
  );
}
