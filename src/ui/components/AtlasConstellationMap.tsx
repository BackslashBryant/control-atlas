import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { IconArrowRight, IconChevronRight } from "@tabler/icons-react";

import type {
  AtlasGraphProjection,
  AtlasProjectionDrill,
  AtlasProjectionEdge,
  AtlasProjectionNode,
  AtlasSharedGroundEdge,
} from "../lib/atlasGraphProjection";
import {
  FRAMEWORK_ROOT_CATALOG_IDS,
  frameworkDependencyDepth,
  frameworkDependencyParent,
} from "../lib/atlasGraphProjection";
import { areaPresentationForCatalog } from "../lib/areaVisualLanguage";
import { catalogProfileFor, catalogShortNameFor } from "../lib/catalogProfiles";

type AtlasConstellationMapProps = {
  frameworks: AtlasGraphProjection;
  /** Pairs that select the same records without a published mapping. */
  sharedGround: AtlasSharedGroundEdge[];
  onDrill: (drill: AtlasProjectionDrill) => void;
  compact: boolean;
  /**
   * Names the set on screen when it is one group rather than the whole corpus.
   * The sentence about how they are arranged is added here, because only this
   * component knows whether anything in the set builds on anything else.
   */
  subject?: string;
};

/**
 * Where each drawn card actually landed, measured from the DOM after layout.
 *
 * The hierarchy is laid out by the browser — rows of uniform cards that wrap
 * on their own — so the only way to draw a line between two of them is to ask
 * where they ended up. The previous version positioned cards at percentage
 * coordinates baked in at build time, which cannot be responsive: one set of
 * numbers stretched across every viewport put twenty-four pairs of cards on
 * top of each other, and no choice of numbers would have fixed it.
 */
type CardGeometry = {
  width: number;
  height: number;
  points: Record<string, { cx: number; top: number; bottom: number }>;
  groups: Record<string, { cx: number; left: number; right: number; top: number }>;
};

const EMPTY_GEOMETRY: CardGeometry = { width: 0, height: 0, points: {}, groups: {} };

/**
 * A connector with vertical tangents at both ends: it leaves the parent going
 * straight down and arrives at the child going straight down, so a line reads
 * as descent rather than as a wire strung across the picture. The retired
 * version bowed each edge sideways by a fraction of its own vertical span,
 * which is why long edges swung across unrelated frameworks.
 */
function descent(from: { cx: number; bottom: number }, to: { cx: number; top: number }) {
  const midY = (from.bottom + to.top) / 2;
  return `M ${from.cx} ${from.bottom} C ${from.cx} ${midY} ${to.cx} ${midY} ${to.cx} ${to.top}`;
}

/**
 * Parent card down to the cluster holding its children. The landing point
 * slides along the cluster's top edge to sit under the parent wherever it can,
 * so the line stays as close to vertical as the layout allows.
 */
function descentToGroup(
  from: { cx: number; bottom: number },
  to: { left: number; right: number; top: number },
) {
  const inset = Math.min(28, (to.right - to.left) / 2);
  const tx = Math.max(to.left + inset, Math.min(to.right - inset, from.cx));
  return descent(from, { cx: tx, top: to.top });
}

/** Centre-to-centre, for the crosswalk layer that sits behind the hierarchy. */
function link(
  from: { cx: number; top: number; bottom: number },
  to: { cx: number; top: number; bottom: number },
) {
  const fromY = (from.top + from.bottom) / 2;
  const toY = (to.top + to.bottom) / 2;
  const midY = (fromY + toY) / 2;
  return `M ${from.cx} ${fromY} C ${from.cx} ${midY} ${to.cx} ${midY} ${to.cx} ${toY}`;
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
  areaToken: string;
  areaLabel: string;
  publicationKind: string;
  synopsis: string;
  recordLabel: string;
  reach: number;
  crosswalkTotal: number;
};

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
  const { frameworks, sharedGround, onDrill, compact, subject } = props;
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
        areaToken: area?.token || "--ca-area-operations",
        areaLabel: area?.label || "",
        publicationKind: node.publicationKind || profile.publicationKind,
        synopsis: profile.synopsis || node.description || "",
        recordLabel: profile.recordLabel,
        reach: reach.get(node.id)?.size || 0,
        crosswalkTotal: total.get(node.id) || 0,
      };
    });
  }, [frameworks]);

  // A catalog the dependency spine does not place has no row to sit in, and
  // on this corpus that is exactly the set carrying no crosswalk at all.
  // Drawing them anyway made six boxes float with no lines touching them,
  // which reads as a rendering fault rather than as the true statement it is.
  // They are named underneath instead, where the absence is the point.
  const placed = useMemo(
    () => nodes.filter((entry) => frameworkDependencyDepth(entry.catalogId) >= 0),
    [nodes],
  );
  const nodeById = useMemo(
    () => new Map(placed.map((entry) => [entry.node.id, entry])),
    [placed],
  );

  // Depth is read against the set actually on screen, not against the whole
  // corpus. Drawn over all 28 publications this is identical to the curated
  // spine's own depth; drawn over one family it lets a framework whose parent
  // is in a different family stand as a root of what is here, instead of
  // sitting at depth 3 with nothing above it.
  const localTree = useMemo(() => {
    const present = new Set(placed.map((entry) => entry.catalogId));
    const parentOf = (catalogId: string) => {
      const parent = frameworkDependencyParent(catalogId);
      return parent && present.has(parent) ? parent : "";
    };
    const depthOf = (catalogId: string) => {
      const seen = new Set<string>([catalogId]);
      let depth = 0;
      let cursor = catalogId;
      for (;;) {
        const parent = parentOf(cursor);
        if (!parent || seen.has(parent)) return depth;
        seen.add(parent);
        cursor = parent;
        depth += 1;
      }
    };
    return { parentOf, depthOf };
  }, [placed]);

  const byCatalogId = useMemo(
    () => new Map(placed.map((entry) => [entry.catalogId, entry])),
    [placed],
  );

  // One row per depth, and inside each row one bounded cluster per parent.
  //
  // The previous version put every framework at a depth into a single wrapping
  // row, which scattered a parent's children across three wrap lines and turned
  // each of the seventeen parent-child lines into a long diagonal through the
  // same band. Grouping does the work the lines were failing to do: children
  // sit inside a box that says whose they are, so one short line per cluster
  // replaces seventeen crossing ones.
  //
  // Clusters are ordered by where their parent landed on the row above, so the
  // tree never crosses itself.
  const rows = useMemo(() => {
    const byDepth = new Map<number, ConstellationNode[]>();
    for (const entry of placed) {
      const depth = localTree.depthOf(entry.catalogId);
      const bucket = byDepth.get(depth) || [];
      bucket.push(entry);
      byDepth.set(depth, bucket);
    }
    const order = new Map<string, number>();
    let cursor = 0;
    return [...byDepth.keys()]
      .sort((left, right) => left - right)
      .map((depth) => {
        const byParent = new Map<string, ConstellationNode[]>();
        for (const entry of byDepth.get(depth) || []) {
          const parentCatalogId = localTree.parentOf(entry.catalogId);
          const bucket = byParent.get(parentCatalogId) || [];
          bucket.push(entry);
          byParent.set(parentCatalogId, bucket);
        }
        const groups = [...byParent.entries()]
          .map(([parentCatalogId, entries]) => ({
            parentCatalogId,
            parent: byCatalogId.get(parentCatalogId),
            entries: entries.sort((a, b) => a.shortName.localeCompare(b.shortName)),
          }))
          .sort(
            (a, b) =>
              (order.get(a.parentCatalogId) ?? -1) - (order.get(b.parentCatalogId) ?? -1),
          );
        for (const group of groups) {
          for (const entry of group.entries) order.set(entry.catalogId, cursor++);
        }
        return { depth, groups };
      });
  }, [placed, byCatalogId, localTree]);

  const unlinked = useMemo(
    () =>
      nodes
        .filter((entry) => frameworkDependencyDepth(entry.catalogId) < 0)
        .sort((a, b) => b.node.canonicalRecordCount - a.node.canonicalRecordCount),
    [nodes],
  );

  // Cards are sized by the stylesheet and wrapped by the browser, so their
  // positions are only knowable after layout. Measured here, and re-measured
  // whenever the container resizes, which is what keeps the connectors
  // attached at every width.
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const [geometry, setGeometry] = useState<CardGeometry>(EMPTY_GEOMETRY);
  const [remeasureToken, setRemeasureToken] = useState(0);

  // Left to right by where each cluster's parent actually landed. Build-time
  // sequence is not enough: a row wraps differently at every width, so the
  // parent that renders third can end up leftmost, and its line then has to
  // cross two other clusters to reach its children. Sorting on the measured
  // position keeps every descent short and stops the tree crossing itself.
  //
  // This settles in one pass — a cluster's sort key comes from the row above,
  // which reordering this row cannot move.
  const orderedRows = useMemo(
    () =>
      rows.map((row) => ({
        depth: row.depth,
        groups: [...row.groups].sort((a, b) => {
          const left = a.parent ? geometry.points[a.parent.node.id]?.cx : undefined;
          const right = b.parent ? geometry.points[b.parent.node.id]?.cx : undefined;
          if (left === undefined || right === undefined) return 0;
          return left - right;
        }),
      })),
    [rows, geometry.points],
  );

  useLayoutEffect(() => {
    const container = fieldRef.current;
    if (!container) return undefined;
    const measure = () => {
      const base = container.getBoundingClientRect();
      const points: CardGeometry["points"] = {};
      for (const card of container.querySelectorAll<HTMLElement>("[data-node-id]")) {
        const rect = card.getBoundingClientRect();
        const id = card.dataset.nodeId;
        if (!id) continue;
        points[id] = {
          cx: rect.x - base.x + rect.width / 2,
          top: rect.y - base.y,
          bottom: rect.y - base.y + rect.height,
        };
      }
      const groups: CardGeometry["groups"] = {};
      for (const box of container.querySelectorAll<HTMLElement>("[data-group-id]")) {
        const rect = box.getBoundingClientRect();
        const id = box.dataset.groupId;
        if (!id) continue;
        groups[id] = {
          cx: rect.x - base.x + rect.width / 2,
          left: rect.x - base.x,
          right: rect.x - base.x + rect.width,
          top: rect.y - base.y,
        };
      }
      setGeometry((previous) => {
        const same =
          previous.width === base.width
          && previous.height === base.height
          && Object.keys(points).length === Object.keys(previous.points).length
          && Object.keys(groups).length === Object.keys(previous.groups).length
          && Object.entries(points).every(([id, point]) => {
            const before = previous.points[id];
            return before && before.cx === point.cx && before.top === point.top;
          })
          && Object.entries(groups).every(([id, group]) => {
            const before = previous.groups[id];
            return before && before.left === group.left && before.top === group.top;
          });
        return same ? previous : { width: base.width, height: base.height, points, groups };
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [orderedRows, remeasureToken]);

  // Fonts land after first paint and change card heights; re-run the measure
  // once they do, so the connectors are not left attached to where the cards
  // used to be.
  useEffect(() => {
    const fonts = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
    if (!fonts?.ready) return undefined;
    let cancelled = false;
    void fonts.ready.then(() => {
      if (!cancelled) setRemeasureToken((token) => token + 1);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // The backbone: one line per cluster, from the parent card down to the box
  // holding its children. Six lines where there were seventeen, none of them
  // long enough to cross another.
  const structuralEdges = useMemo(
    () =>
      rows.flatMap((row) =>
        row.groups.flatMap((group) => {
          if (!group.parent) return [];
          return [{
            id: `spine:${group.parentCatalogId}`,
            groupId: group.parentCatalogId,
            parentId: group.parent.node.id,
            areaToken: group.parent.areaToken,
            memberIds: group.entries.map((entry) => entry.node.id),
          }];
        }),
      ),
    [rows],
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

  function nodeState(entry: ConstellationNode): string {
    if (!activeId) return "rest";
    if (entry.node.id === activeId) return "active";
    if (adjacentIds.has(entry.node.id)) return "adjacent";
    return sharedIds.has(entry.node.id) ? "shared" : "muted";
  }

  // Saying "laid out by what builds on what" above a row of frameworks that
  // build on nothing here is a small lie the reader can see. Several groups
  // are genuinely flat — the publications in them are peers — and the honest
  // sentence is more useful than the reassuring one.
  const summary = (
    <p className="atlas-constellation__lede">
      {subject ? (
        <>
          {subject}{" "}
          {structuralEdges.length
            ? "Arranged by what builds on what; open one to follow its own structure."
            : "None of these builds on another, so they sit side by side. Open one to follow its own structure."}
        </>
      ) : (
        `Every published framework in Control Atlas, top to bottom by what
         depends on what. Open one to follow its own structure.`
      )}
    </p>
  );

  if (compact) {
    // A drawn hierarchy is unreadable at phone width long before its labels
    // are. The same reading survives as a list in hierarchy order — each root
    // followed by what builds on it — so the phone and the desktop tell the
    // reader the same thing about what depends on what. Ordering by crosswalk
    // reach instead, as this did, put the frameworks in an order the desktop
    // never shows and that nothing on the row explains.
    const ordered = orderedRows.flatMap((row) =>
      row.groups.flatMap((group) => group.entries),
    );
    const listed = [
      ...ordered,
      ...unlinked.filter(
        (entry) => !ordered.some((placed) => placed.node.id === entry.node.id),
      ),
    ];
    return (
      <section className="atlas-constellation atlas-constellation--stacked" data-testid="atlas-constellation">
        {summary}
        <ul className="atlas-constellation__list">
          {listed.map((entry) => (
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
          ref={fieldRef}
          role="group"
        >
          {/* Drawn from measured card positions, so it stays attached at any
              width. Sized in real pixels rather than a stretched unit box:
              a non-uniform scale would skew every curve. */}
          <svg
            aria-hidden="true"
            className="atlas-constellation__wires"
            height={geometry.height || undefined}
            viewBox={`0 0 ${geometry.width || 1} ${geometry.height || 1}`}
            width={geometry.width || undefined}
          >
            {edges.map((edge) => {
              const from = geometry.points[edge.source];
              const to = geometry.points[edge.target];
              const source = nodeById.get(edge.source);
              if (!from || !to || !source) return null;
              const touchesActive =
                !activeId || edge.source === activeId || edge.target === activeId;
              return (
                <path
                  className="atlas-constellation__wire"
                  d={link(from, to)}
                  data-state={touchesActive ? "lit" : "muted"}
                  key={edge.id}
                  stroke={`var(${source.areaToken})`}
                  strokeWidth={edgeWeight(edge.relationshipCount)}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
            {/* The hierarchy is drawn last so it sits above the crosswalk
                layer: the backbone should never be the faint thing. */}
            {structuralEdges.map((edge) => {
              const from = geometry.points[edge.parentId];
              const to = geometry.groups[edge.groupId];
              if (!from || !to) return null;
              const touchesActive =
                !activeId
                || edge.parentId === activeId
                || edge.memberIds.includes(activeId);
              return (
                <path
                  className="atlas-constellation__spine"
                  d={descentToGroup(from, to)}
                  data-state={touchesActive ? "lit" : "muted"}
                  key={edge.id}
                  stroke={`var(${edge.areaToken})`}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
            {activeSharedGround.map((edge) => {
              const from = geometry.points[edge.source];
              const to = geometry.points[edge.target];
              if (!from || !to) return null;
              return (
                <path
                  className="atlas-constellation__wire atlas-constellation__wire--shared"
                  d={link(from, to)}
                  key={edge.id}
                  strokeWidth={Math.max(1, 1 + edge.overlapRatio * 2)}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>

          {orderedRows.map((row) => (
            <div className="atlas-constellation__row" key={row.depth}>
              {row.groups.map((group) => (
                <div
                  className="atlas-constellation__group"
                  data-group-id={group.parent ? group.parentCatalogId : undefined}
                  key={group.parentCatalogId || "roots"}
                  style={
                    group.parent
                      ? ({ "--ca-area-color": `var(${group.parent.areaToken})` } as CSSProperties)
                      : undefined
                  }
                >
                  {/* Naming the parent on the box is what lets the reader see
                      whose children these are without tracing a line back up
                      — and it says it in words, so no legend is needed. */}
                  {group.parent ? (
                    <p className="atlas-constellation__group-label">
                      {/* Only the lead-in is upper-cased. Running the parent's
                          name through text-transform turned "CCIs" into
                          "CCIS" and "800-171 r2" into "800-171 R2", which are
                          not what those documents are called. */}
                      <span>Builds on</span> <strong>{group.parent.shortName}</strong>
                    </p>
                  ) : null}
                  <div className="atlas-constellation__group-cards">
                    {group.entries.map((entry) => (
                      <button
                        className="atlas-constellation__node"
                        data-hub={
                          FRAMEWORK_ROOT_CATALOG_IDS.has(entry.catalogId) ? "true" : undefined
                        }
                        data-node-id={entry.node.id}
                        data-state={nodeState(entry)}
                        key={entry.node.id}
                        onBlur={() => setActiveId("")}
                        onClick={() => entry.node.drill && onDrill(entry.node.drill)}
                        onFocus={() => setActiveId(entry.node.id)}
                        onMouseEnter={() => setActiveId(entry.node.id)}
                        style={
                          { "--ca-area-color": `var(${entry.areaToken})` } as CSSProperties
                        }
                        title={
                          entry.synopsis
                            ? `${entry.shortName} — ${entry.synopsis}`
                            : entry.shortName
                        }
                        type="button"
                      >
                        <span className="atlas-constellation__node-label">
                          {entry.shortName}
                        </span>
                        {entry.synopsis ? (
                          <span className="atlas-constellation__node-synopsis">
                            {entry.synopsis}
                          </span>
                        ) : null}
                        <span className="atlas-constellation__node-count">
                          {formatCount(Math.max(0, entry.node.canonicalRecordCount - 1))}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
                  see?" without the reader having to hunt for it. Inside a
                  group there may be none, and a heading over an empty list
                  reads as a failure rather than as the finding it is. */}
              <h4>{heaviest.length ? "Heaviest crosswalks" : "Crosswalks here"}</h4>
              {heaviest.length ? null : (
                <p className="atlas-constellation__absence">
                  Nobody has published a mapping between these frameworks. Each
                  one still crosswalks to frameworks in other groups — the
                  group board names those.
                </p>
              )}
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
