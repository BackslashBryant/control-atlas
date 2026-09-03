import { useMemo, useState, type CSSProperties } from "react";
import { IconArrowRight, IconChevronRight } from "@tabler/icons-react";

import type {
  AtlasGraphProjection,
  AtlasProjectionDrill,
  AtlasProjectionEdge,
  AtlasProjectionNode,
} from "../lib/atlasGraphProjection";
import { areaPresentationForCatalog } from "../lib/areaVisualLanguage";
import { catalogProfileFor, catalogShortNameFor } from "../lib/catalogProfiles";

type AtlasConstellationMapProps = {
  frameworks: AtlasGraphProjection;
  onDrill: (drill: AtlasProjectionDrill) => void;
  compact: boolean;
};

/**
 * Projection coordinates run about -2.2..2.2. Mapping that to 10%..90% leaves
 * the outer ring a tenth of the box on every side to put its label in.
 */
const COORDINATE_EXTENT = 2.4;
const USABLE_HALF_SPAN = 40;

function toPercent(value: number): number {
  return 50 + (value / COORDINATE_EXTENT) * USABLE_HALF_SPAN;
}

/**
 * Crosswalk counts span four orders of magnitude — one STIG-to-CCI pairing
 * carries 25,771 edges where CMMC-to-800-171 carries 111. On a linear scale
 * every line but one would be a hairline, so weight is logarithmic: it still
 * ranks the pairings correctly while keeping the thin ones visible.
 */
function edgeWeight(count: number): number {
  return Math.max(1, Math.min(7, 0.9 + Math.log2(Math.max(1, count)) * 0.44));
}

function formatCount(count: number): string {
  return count.toLocaleString("en-US");
}

type ConstellationNode = {
  node: AtlasProjectionNode;
  catalogId: string;
  shortName: string;
  x: number;
  y: number;
  areaToken: string;
  areaLabel: string;
  publicationKind: string;
  synopsis: string;
  recordLabel: string;
  reach: number;
  crosswalkTotal: number;
  scale: "sm" | "md" | "lg";
};

function scaleFor(records: number): ConstellationNode["scale"] {
  if (records >= 1000) return "lg";
  if (records >= 120) return "md";
  return "sm";
}

/**
 * The landscape, drawn as what it is: every published framework, joined by the
 * crosswalks that actually exist between them.
 *
 * Position is read off the data rather than arranged by hand — distance from
 * the centre is how many other frameworks a catalog crosswalks to, so 800-53
 * lands in the middle because everything maps to it, and the rim holds the
 * catalogs nothing maps to yet. Line weight is the size of each crosswalk. The
 * picture therefore states the finding before anything is clicked: this is the
 * hub, these are its neighbours, that cluster over there is its own world.
 */
export function AtlasConstellationMap(props: AtlasConstellationMapProps) {
  const { frameworks, onDrill, compact } = props;
  const [activeId, setActiveId] = useState("");

  const nodes = useMemo<ConstellationNode[]>(() => {
    const reach = new Map<string, Set<string>>();
    const total = new Map<string, number>();
    for (const edge of frameworks.edges) {
      if (!reach.has(edge.source)) reach.set(edge.source, new Set());
      if (!reach.has(edge.target)) reach.set(edge.target, new Set());
      reach.get(edge.source)!.add(edge.target);
      reach.get(edge.target)!.add(edge.source);
      total.set(edge.source, (total.get(edge.source) || 0) + edge.relationshipCount);
      total.set(edge.target, (total.get(edge.target) || 0) + edge.relationshipCount);
    }
    return frameworks.nodes.map((node) => {
      const catalogId = node.publicationId;
      const area = areaPresentationForCatalog(catalogId);
      const profile = catalogProfileFor(catalogId);
      return {
        node,
        catalogId,
        shortName: catalogShortNameFor(catalogId, node.label),
        x: toPercent(node.x),
        y: toPercent(node.y),
        areaToken: area?.token || "--ca-area-operations",
        areaLabel: area?.label || "",
        publicationKind: node.publicationKind || profile.publicationKind,
        synopsis: profile.synopsis || node.description || "",
        recordLabel: profile.recordLabel,
        reach: reach.get(node.id)?.size || 0,
        crosswalkTotal: total.get(node.id) || 0,
        scale: scaleFor(Math.max(0, node.canonicalRecordCount - 1)),
      };
    });
  }, [frameworks]);

  const nodeById = useMemo(
    () => new Map(nodes.map((entry) => [entry.node.id, entry])),
    [nodes],
  );

  // Edges are drawn heaviest-last so a thin pairing is never buried under the
  // STIG-to-CCI band.
  const edges = useMemo(
    () => [...frameworks.edges].sort((a, b) => a.relationshipCount - b.relationshipCount),
    [frameworks.edges],
  );

  const active = activeId ? nodeById.get(activeId) : undefined;
  const activeEdges = useMemo(() => {
    if (!activeId) return [] as AtlasProjectionEdge[];
    return frameworks.edges
      .filter((edge) => edge.source === activeId || edge.target === activeId)
      .sort((a, b) => b.relationshipCount - a.relationshipCount);
  }, [activeId, frameworks.edges]);
  const adjacentIds = useMemo(
    () =>
      new Set(
        activeEdges.map((edge) => (edge.source === activeId ? edge.target : edge.source)),
      ),
    [activeEdges, activeId],
  );

  function nodeStyle(entry: ConstellationNode): CSSProperties {
    return {
      left: `${entry.x}%`,
      top: `${entry.y}%`,
      "--ca-area-color": `var(${entry.areaToken})`,
    } as CSSProperties;
  }

  function nodeState(entry: ConstellationNode): string {
    if (!activeId) return "rest";
    if (entry.node.id === activeId) return "active";
    return adjacentIds.has(entry.node.id) ? "adjacent" : "muted";
  }

  const summary = (
    <p className="atlas-constellation__lede">
      Every published framework in Control Atlas, joined by the crosswalks
      between them. The closer to the centre, the more other frameworks map to
      it. Open one to follow its own structure.
    </p>
  );

  if (compact) {
    // A twenty-eight node diagram is unreadable at phone width long before the
    // labels are. The same reading — what connects to what, and how heavily —
    // survives as a list ordered by reach.
    const ordered = [...nodes].sort(
      (a, b) => b.reach - a.reach || b.crosswalkTotal - a.crosswalkTotal,
    );
    return (
      <section className="atlas-constellation atlas-constellation--stacked" data-testid="atlas-constellation">
        {summary}
        <ul className="atlas-constellation__list">
          {ordered.map((entry) => (
            <li key={entry.node.id}>
              <button
                className="atlas-constellation__list-item"
                onClick={() => entry.node.drill && onDrill(entry.node.drill)}
                style={{ "--ca-area-color": `var(${entry.areaToken})` } as CSSProperties}
                type="button"
              >
                <span className="atlas-constellation__list-identity">
                  <strong>{entry.shortName}</strong>
                  <small>{entry.publicationKind}</small>
                </span>
                <span className="atlas-constellation__list-meta">
                  {formatCount(Math.max(0, entry.node.canonicalRecordCount - 1))}{" "}
                  {entry.recordLabel.toLocaleLowerCase()}
                  {entry.reach > 0 ? (
                    <em>
                      crosswalks to {entry.reach}{" "}
                      {entry.reach === 1 ? "framework" : "frameworks"}
                    </em>
                  ) : (
                    <em>no crosswalks mapped yet</em>
                  )}
                </span>
                <IconChevronRight aria-hidden="true" size={16} stroke={2} />
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="atlas-constellation" data-testid="atlas-constellation">
      {summary}
      <div className="atlas-constellation__stage">
        <div
          aria-label="Frameworks and the crosswalks between them"
          className="atlas-constellation__canvas"
          onMouseLeave={() => setActiveId("")}
          role="group"
        >
          <svg
            aria-hidden="true"
            className="atlas-constellation__wires"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            {edges.map((edge) => {
              const from = nodeById.get(edge.source);
              const to = nodeById.get(edge.target);
              if (!from || !to) return null;
              const touchesActive =
                !activeId || edge.source === activeId || edge.target === activeId;
              // A gentle bow away from the midpoint keeps two lines between the
              // same neighbourhood from lying on top of one another.
              const midX = (from.x + to.x) / 2;
              const midY = (from.y + to.y) / 2;
              const bowX = midX + (to.y - from.y) * 0.085;
              const bowY = midY - (to.x - from.x) * 0.085;
              return (
                <path
                  className="atlas-constellation__wire"
                  d={`M${from.x} ${from.y} Q${bowX} ${bowY} ${to.x} ${to.y}`}
                  data-state={touchesActive ? "lit" : "muted"}
                  key={edge.id}
                  stroke={`var(${from.areaToken})`}
                  strokeWidth={edgeWeight(edge.relationshipCount)}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>

          {nodes.map((entry) => (
            <button
              className="atlas-constellation__node"
              data-scale={entry.scale}
              data-state={nodeState(entry)}
              key={entry.node.id}
              onBlur={() => setActiveId("")}
              onClick={() => entry.node.drill && onDrill(entry.node.drill)}
              onFocus={() => setActiveId(entry.node.id)}
              onMouseEnter={() => setActiveId(entry.node.id)}
              style={nodeStyle(entry)}
              type="button"
            >
              <span className="atlas-constellation__node-label">{entry.shortName}</span>
              <span className="atlas-constellation__node-count">
                {formatCount(Math.max(0, entry.node.canonicalRecordCount - 1))}
              </span>
            </button>
          ))}
        </div>

        {/* The detail panel sits beside the map, never under it: a reader who
            has just pointed at a framework should not have to go looking for
            what they pointed at. */}
        <aside className="atlas-constellation__panel">
          {active ? (
            <>
              <p className="atlas-constellation__panel-kind">{active.publicationKind}</p>
              <h3>{active.node.label}</h3>
              {active.synopsis ? <p>{active.synopsis}</p> : null}
              <dl className="atlas-constellation__facts">
                <div>
                  <dt>{active.recordLabel}</dt>
                  <dd>{formatCount(Math.max(0, active.node.canonicalRecordCount - 1))}</dd>
                </div>
                <div>
                  <dt>Area</dt>
                  <dd>{active.areaLabel || "—"}</dd>
                </div>
              </dl>
              {activeEdges.length ? (
                <>
                  <h4>Crosswalks to</h4>
                  <ul className="atlas-constellation__crosswalks">
                    {activeEdges.map((edge) => {
                      const otherId = edge.source === active.node.id ? edge.target : edge.source;
                      const other = nodeById.get(otherId);
                      if (!other) return null;
                      return (
                        <li key={edge.id}>
                          <button
                            onClick={() => other.node.drill && onDrill(other.node.drill)}
                            style={
                              { "--ca-area-color": `var(${other.areaToken})` } as CSSProperties
                            }
                            type="button"
                          >
                            <span aria-hidden="true" className="atlas-constellation__dot" />
                            <span className="atlas-constellation__crosswalk-name">
                              {other.shortName}
                            </span>
                            <span className="atlas-constellation__crosswalk-count">
                              {formatCount(edge.relationshipCount)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <p className="atlas-constellation__absence">
                  No crosswalks to other frameworks are mapped for this
                  publication yet. Its records are still fully browsable.
                </p>
              )}
              <button
                className="atlas-constellation__open"
                onClick={() => active.node.drill && onDrill(active.node.drill)}
                type="button"
              >
                Open {active.shortName}
                <IconArrowRight aria-hidden="true" size={15} stroke={2} />
              </button>
            </>
          ) : (
            <div className="atlas-constellation__panel-rest">
              <h3>Pick a framework</h3>
              <p>
                Point at any framework to see what it covers and what it
                crosswalks to. Click it to go inside.
              </p>
              <dl className="atlas-constellation__facts">
                <div>
                  <dt>Frameworks</dt>
                  <dd>{formatCount(nodes.length)}</dd>
                </div>
                <div>
                  <dt>Crosswalk pairings</dt>
                  <dd>{formatCount(frameworks.edges.length)}</dd>
                </div>
              </dl>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
