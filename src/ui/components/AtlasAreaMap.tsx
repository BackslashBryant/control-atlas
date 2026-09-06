import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";

/** One cell of the map: a thing, and how much of it there is. */
export type AtlasAreaNode = {
  id: string;
  label: string;
  value: number;
  areaToken: string;
  /** False when there is nothing beneath it to open. */
  openable: boolean;
};

type AtlasAreaMapProps = {
  nodes: AtlasAreaNode[];
  /** What the number counts, singular — "publication", "record". */
  unit?: string;
  /** Accessible name for the region. */
  label: string;
  selectedId?: string;
  /**
   * What the selected cell actually crosswalks to. Everything else dims, so
   * the relationship is shown by the data rather than asserted by the layout.
   */
  connectedIds?: Set<string>;
  onOpen: (id: string) => void;
  onHighlight?: (id: string) => void;
  /** Taller when this is the whole map rather than a panel inside something. */
  tall?: boolean;
};

type Laid = {
  id: string;
  label: string;
  value: number;
  areaToken: string;
  openable: boolean;
  left: number;
  top: number;
  width: number;
  height: number;
};

function formatCount(count: number): string {
  return count.toLocaleString("en-US");
}

/** "1 publication", "8 publications" — the count decides, not the caller. */
function withUnit(count: number, unit?: string): string {
  if (!unit) return formatCount(count);
  return `${formatCount(count)} ${unit}${count === 1 ? "" : "s"}`;
}

/**
 * The whole map, in one idiom: a cell per thing, sized by what it holds.
 *
 * This replaced three drawings that used to be stacked on one screen — tiles
 * with proportional strips, bordered cards joined by curves, and a treemap —
 * each of which asked the reader to learn a different way of seeing on the way
 * down.
 *
 * Deliberately flat. An earlier cut nested each framework inside whatever it
 * builds on, which would have made the layout itself assert the curated
 * dependency spine — a file we wrote by hand because the crosswalk data cannot
 * supply direction, covering twenty-two of twenty-eight publications and only
 * three levels deep. Putting an authored claim in the skeleton of the picture
 * is the same mistake as the landing that sat SP 800-53 above everything.
 * Relationship is shown instead by selection: pick a cell and the ones it
 * genuinely crosswalks to stay lit while the rest dim, which is the published
 * data talking rather than the layout.
 *
 * Squarified layout is d3-hierarchy's; the cells are absolutely positioned
 * buttons rather than SVG so every one of them is focusable and readable by a
 * screen reader.
 */
export function AtlasAreaMap(props: AtlasAreaMapProps) {
  const {
    nodes,
    label,
    unit,
    selectedId,
    connectedIds,
    onOpen,
    onHighlight,
    tall,
  } = props;
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    const measure = () => setWidth(frame.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const height = Math.round(
    tall
      ? Math.max(320, Math.min(680, width * (width < 640 ? 1.3 : 0.56)))
      : Math.max(220, Math.min(520, width * (width < 640 ? 1.1 : 0.42))),
  );

  const laid = useMemo<Laid[]>(() => {
    if (!width || !nodes.length) return [];
    const root = hierarchy<{ children?: AtlasAreaNode[] } & Partial<AtlasAreaNode>>(
      { children: nodes },
      (node) => node.children,
    )
      // A cell with nothing in it still exists and still has to be clickable,
      // so it gets a floor rather than a rectangle of zero area.
      .sum((node) => (node.children ? 0 : Math.max(1, node.value || 0)))
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    treemap<{ children?: AtlasAreaNode[] } & Partial<AtlasAreaNode>>()
      .tile(treemapSquarify)
      .size([width, height])
      .paddingInner(3)(root);

    return root.leaves().map((leaf) => {
      const box = leaf as unknown as { x0: number; y0: number; x1: number; y1: number };
      const data = leaf.data as AtlasAreaNode;
      return {
        id: data.id,
        label: data.label,
        value: data.value,
        areaToken: data.areaToken,
        openable: data.openable,
        left: box.x0,
        top: box.y0,
        width: Math.max(0, box.x1 - box.x0),
        height: Math.max(0, box.y1 - box.y0),
      };
    });
  }, [nodes, width, height]);

  // Below this there is no room for area to say anything: twenty families in a
  // 340px column are slivers a thumb cannot hit and a name cannot fit, and the
  // squarified rectangles round into each other. The same reading — what is
  // here and how much of it — survives as a list in size order.
  //
  // The wrapper is the same element either way. Putting the ref on one branch
  // and not the other detached the measurement the moment the width crossed
  // the threshold, so the component measured zero and drew nothing at all.
  const stacked = width > 0 && width < 480;

  return (
    <div
      aria-label={label}
      className={`atlas-area${stacked ? " atlas-area--stacked" : ""}`}
      data-testid="atlas-area-map"
      onMouseLeave={() => onHighlight?.("")}
      ref={frameRef}
      role="group"
      style={stacked ? undefined : { height: `${height}px` }}
    >
      {stacked
        ? [...nodes]
          .sort((a, b) => b.value - a.value)
          .map((node) => {
            const Tag = node.openable ? "button" : "span";
            return (
              <Tag
                aria-current={node.id === selectedId ? "true" : undefined}
                className="atlas-area__row"
                data-selected={node.id === selectedId ? "true" : undefined}
                data-static={node.openable ? undefined : "true"}
                key={node.id}
                onClick={node.openable ? () => onOpen(node.id) : undefined}
                style={{ "--ca-area-color": `var(${node.areaToken})` } as CSSProperties}
                type={node.openable ? "button" : undefined}
              >
                <span className="atlas-area__name">{node.label}</span>
                <span className="atlas-area__count">{withUnit(node.value, unit)}</span>
              </Tag>
            );
          })
        : laid.map((cell) => {
          const showName = cell.width > 68 && cell.height > 28;
          const showCount = cell.width > 50 && cell.height > 42;
          // Dimmed only while something is selected and this is not part of
          // what that thing connects to.
          const dim = Boolean(
            connectedIds
              && selectedId
              && cell.id !== selectedId
              && !connectedIds.has(cell.id),
          );
          const Tag = cell.openable ? "button" : "span";
          return (
            <Tag
              aria-current={cell.id === selectedId ? "true" : undefined}
              className="atlas-area__cell"
              data-dim={dim ? "true" : undefined}
              data-selected={cell.id === selectedId ? "true" : undefined}
              data-static={cell.openable ? undefined : "true"}
              key={cell.id}
              onClick={cell.openable ? () => onOpen(cell.id) : undefined}
              onFocus={cell.openable ? () => onHighlight?.(cell.id) : undefined}
              onMouseEnter={cell.openable ? () => onHighlight?.(cell.id) : undefined}
              style={
                {
                  "--ca-area-color": `var(${cell.areaToken})`,
                  left: `${cell.left}px`,
                  top: `${cell.top}px`,
                  width: `${cell.width}px`,
                  height: `${cell.height}px`,
                } as CSSProperties
              }
              title={`${cell.label} — ${withUnit(cell.value, unit)}`}
              type={cell.openable ? "button" : undefined}
            >
              <span className="visually-hidden">
                {cell.label} — {withUnit(cell.value, unit)}
              </span>
              {showName ? (
                <span aria-hidden="true" className="atlas-area__name">
                  {cell.label}
                </span>
              ) : null}
              {showCount ? (
                <span aria-hidden="true" className="atlas-area__count">
                  {withUnit(cell.value, unit)}
                </span>
              ) : null}
            </Tag>
          );
        })}
    </div>
  );
}
