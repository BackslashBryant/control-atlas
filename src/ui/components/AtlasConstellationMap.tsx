import { useMemo, useState, type CSSProperties } from "react";
import { IconArrowRight, IconChevronRight } from "@tabler/icons-react";

import type {
  AtlasGraphProjection,
  AtlasProjectionDrill,
  AtlasProjectionEdge,
  AtlasProjectionNode,
  AtlasSharedGroundEdge,
} from "../lib/atlasGraphProjection";
import { FRAMEWORK_ROOT_CATALOG_IDS } from "../lib/atlasGraphProjection";
import { areaPresentationForCatalog } from "../lib/areaVisualLanguage";
import { catalogProfileFor, catalogShortNameFor } from "../lib/catalogProfiles";

type AtlasConstellationMapProps = {
  frameworks: AtlasGraphProjection;
  /** Pairs that select the same records without a published mapping. */
  sharedGround: AtlasSharedGroundEdge[];
  onDrill: (drill: AtlasProjectionDrill) => void;
  compact: boolean;
};

/**
 * The drawn tree is fitted to the canvas from its own bounding box rather than
 * against a fixed coordinate range.
 *
 * A fixed range has to assume how far out the tree reaches, and this one is
 * only as deep as the crosswalk data makes it — so most branches stopped two
 * levels in and the whole diagram sat in a band across the middle with a third
 * of the canvas empty above and below. Measuring what is actually there fills
 * the space at any depth, and keeps filling it when the corpus changes.
 */
const SPAN_X = 45;
const SPAN_Y = 44;

function fitToCanvas(points: Array<{ x: number; y: number }>) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const rangeX = Math.max(...xs) - minX || 1;
  const rangeY = Math.max(...ys) - minY || 1;
  return (point: { x: number; y: number }) => ({
    x: 50 - SPAN_X + ((point.x - minX) / rangeX) * SPAN_X * 2,
    y: 50 - SPAN_Y + ((point.y - minY) / rangeY) * SPAN_Y * 2,
  });
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
  /** Percent of the canvas box; assigned once the drawn set is known. */
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
 * The landscape, drawn as a dependency hierarchy: the frameworks nothing here
 * depends on sit at the top, and everything that selects from, is assessed
 * against, correlates to, or otherwise builds on one sits exactly one row
 * below it.
 *
 * Row is read off data/curated/framework-dependency-spine.json's curated
 * roots and parents, not off crosswalk weight or connectivity — see that
 * file's own doc comment for why the crosswalk data cannot supply direction.
 * Line weight is still the size of each crosswalk. The picture states the
 * finding before anything is clicked: these are the frameworks nothing here
 * depends on, these build on them, and a line only crosses rows when the data
 * genuinely says two frameworks meet.
 */
export function AtlasConstellationMap(props: AtlasConstellationMapProps) {
  const { frameworks, sharedGround, onDrill, compact } = props;
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
        x: 0,
        y: 0,
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

  // A catalog nothing crosswalks to has no place on a diagram of crosswalks.
  // Drawing it anyway made six boxes float with no lines touching them, which
  // reads as a rendering fault rather than as the true statement it is. They
  // are named underneath instead, where the absence is the point.
  const placed = useMemo(() => {
    const drawn = nodes.filter((entry) => entry.reach > 0);
    if (!drawn.length) return drawn;
    const fit = fitToCanvas(drawn.map((entry) => ({ x: entry.node.x, y: entry.node.y })));
    return drawn.map((entry) => ({ ...entry, ...fit({ x: entry.node.x, y: entry.node.y }) }));
  }, [nodes]);
  const nodeById = useMemo(
    () => new Map(placed.map((entry) => [entry.node.id, entry])),
    [placed],
  );

  const unlinked = useMemo(
    () =>
      nodes
        .filter((entry) => entry.reach === 0)
        .sort((a, b) => b.node.canonicalRecordCount - a.node.canonicalRecordCount),
    [nodes],
  );
  // Edges are drawn heaviest-last so a thin pairing is never buried under the
  // STIG-to-CCI band.
  const edges = useMemo(
    () =>
      frameworks.edges
        .filter((edge) => nodeById.has(edge.source) && nodeById.has(edge.target))
        .sort((a, b) => a.relationshipCount - b.relationshipCount),
    [frameworks.edges, nodeById],
  );

  const heaviest = useMemo(
    () => [...frameworks.edges].sort((a, b) => b.relationshipCount - a.relationshipCount).slice(0, 8),
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

  // Overlaps are revealed on demand, never at rest. Forty-eight more lines
  // would bury the twenty-seven published ones, and the published mapping is
  // the stronger claim — so the resting picture stays the map of what
  // publishers have actually stated, and pointing at a framework adds what the
  // records say underneath it.
  const activeSharedGround = useMemo(() => {
    if (!activeId) return [] as AtlasSharedGroundEdge[];
    return sharedGround
      .filter(
        (edge) =>
          (edge.source === activeId || edge.target === activeId)
          && nodeById.has(edge.source)
          && nodeById.has(edge.target),
      )
      .sort((a, b) => b.overlapRatio - a.overlapRatio || b.sharedCount - a.sharedCount);
  }, [activeId, sharedGround, nodeById]);
  const sharedIds = useMemo(
    () =>
      new Set(
        activeSharedGround.map((edge) =>
          edge.source === activeId ? edge.target : edge.source,
        ),
      ),
    [activeSharedGround, activeId],
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
    if (adjacentIds.has(entry.node.id)) return "adjacent";
    return sharedIds.has(entry.node.id) ? "shared" : "muted";
  }

  const summary = (
    <p className="atlas-constellation__lede">
      Every published framework in Control Atlas, top to bottom by what
      depends on what. Frameworks at the top are the ones nothing here selects
      from, is assessed against, or otherwise builds on. Open one to follow
      its own structure.
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
        <div className="atlas-constellation__field">
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
            {activeSharedGround.map((edge) => {
              const from = nodeById.get(edge.source);
              const to = nodeById.get(edge.target);
              if (!from || !to) return null;
              const midX = (from.x + to.x) / 2;
              const midY = (from.y + to.y) / 2;
              const bowX = midX + (to.y - from.y) * 0.085;
              const bowY = midY - (to.x - from.x) * 0.085;
              return (
                <path
                  className="atlas-constellation__wire atlas-constellation__wire--shared"
                  d={`M${from.x} ${from.y} Q${bowX} ${bowY} ${to.x} ${to.y}`}
                  key={edge.id}
                  strokeWidth={Math.max(1, 1 + edge.overlapRatio * 2)}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>

          {placed.map((entry) => (
            <button
              className="atlas-constellation__node"
              data-hub={FRAMEWORK_ROOT_CATALOG_IDS.has(entry.catalogId) ? "true" : undefined}
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
              {entry.synopsis ? (
                <span className="atlas-constellation__node-synopsis">{entry.synopsis}</span>
              ) : null}
              <span className="atlas-constellation__node-count">
                {formatCount(Math.max(0, entry.node.canonicalRecordCount - 1))}
              </span>
            </button>
          ))}
        </div>

        {unlinked.length ? (
          <div className="atlas-constellation__unlinked">
            <p>
              No crosswalks mapped yet
              <span>{unlinked.length}</span>
            </p>
            <ul>
              {unlinked.map((entry) => (
                <li key={entry.node.id}>
                  <button
                    onClick={() => entry.node.drill && onDrill(entry.node.drill)}
                    style={
                      { "--ca-area-color": `var(${entry.areaToken})` } as CSSProperties
                    }
                    type="button"
                  >
                    {entry.shortName}
                    <small>
                      {formatCount(Math.max(0, entry.node.canonicalRecordCount - 1))}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
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
              {activeSharedGround.length ? (
                <>
                  <h4>
                    Lands on the same records as
                    <span title="Derived from published mappings, not a published mapping itself">
                      derived
                    </span>
                  </h4>
                  <ul className="atlas-constellation__crosswalks atlas-constellation__crosswalks--shared">
                    {activeSharedGround.slice(0, 8).map((edge) => {
                      const otherId =
                        edge.source === active.node.id ? edge.target : edge.source;
                      const other = nodeById.get(otherId);
                      if (!other) return null;
                      return (
                        <li key={edge.id}>
                          <button
                            onClick={() => other.node.drill && onDrill(other.node.drill)}
                            style={
                              { "--ca-area-color": `var(${other.areaToken})` } as CSSProperties
                            }
                            title={`${edge.sharedCount} records in common, via ${edge.viaPublicationIds
                              .map((id) => catalogShortNameFor(id))
                              .join(", ")} — ${Math.round(edge.overlapRatio * 100)}% of the narrower framework's selections there`}
                            type="button"
                          >
                            <span aria-hidden="true" className="atlas-constellation__dot" />
                            <span className="atlas-constellation__crosswalk-name">
                              {other.shortName}
                              <em>
                                via {catalogShortNameFor(edge.viaPublicationIds[0] || "")}
                                {" · "}
                                {Math.round(edge.overlapRatio * 100)}%
                              </em>
                            </span>
                            <span className="atlas-constellation__crosswalk-count">
                              {formatCount(edge.sharedCount)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : null}
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
              {/* The resting panel would otherwise be an empty column beside a
                  dense picture. The heaviest pairings are the honest thing to
                  put there: they answer "where is there actually something to
                  see?" without the reader having to hunt for it. */}
              <h4>Heaviest crosswalks</h4>
              <ul className="atlas-constellation__crosswalks">
                {heaviest.map((edge) => {
                  const from = nodeById.get(edge.source);
                  const to = nodeById.get(edge.target);
                  if (!from || !to) return null;
                  return (
                    <li key={edge.id}>
                      <button
                        onClick={() => from.node.drill && onDrill(from.node.drill)}
                        onFocus={() => setActiveId(from.node.id)}
                        onMouseEnter={() => setActiveId(from.node.id)}
                        style={
                          { "--ca-area-color": `var(${from.areaToken})` } as CSSProperties
                        }
                        type="button"
                      >
                        <span aria-hidden="true" className="atlas-constellation__dot" />
                        <span className="atlas-constellation__crosswalk-name">
                          {from.shortName} ↔ {to.shortName}
                        </span>
                        <span className="atlas-constellation__crosswalk-count">
                          {formatCount(edge.relationshipCount)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
