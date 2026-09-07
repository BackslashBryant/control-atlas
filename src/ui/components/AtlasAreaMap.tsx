import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { withUnitNoun } from "../lib/atlasUnits";

/** One cell of the map: a thing, and how much of it there is. */
export type AtlasAreaNode = {
  id: string;
  label: string;
  value: number;
  areaToken: string;
  /** False when there is nothing beneath it to open. */
  openable: boolean;
  /**
   * What this cell's number counts, in the publisher's own word — "Controls",
   * "Techniques", "STIG rules". Overrides the level's unit, because a row of
   * frameworks holds a different kind of thing in every cell.
   */
  unitLabel?: string;
  /** A short line under the name: what kind of document this is. */
  note?: string;
  /** What is inside, named. Shown when the cell is tall enough to hold them. */
  members?: string[];
};

type AtlasAreaMapProps = {
  nodes: AtlasAreaNode[];
  /** What the numbers count when a cell does not name its own unit. */
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

type Laid = AtlasAreaNode & {
  left: number;
  top: number;
  width: number;
  height: number;
  /**
   * True when proportion asked for less height than the name and the thumb
   * need, so this cell is drawn at its floor. Its size is then a floor rather
   * than a quantity, and the drawing says so rather than letting the reader
   * compare it with cells that are drawn true.
   */
  floored: boolean;
};

const GAP = 6;
/** Narrower than this and a family name stops fitting on one line. */
const MIN_COLUMN = 230;
/** The touch-target floor. No cell is ever smaller than a thumb. */
const MIN_CELL = 44;
/** Average advance of the 13px name face — enough to count lines, not to set them. */
const NAME_CHAR = 6.6;
const NAME_LINE = 17;
/** Past this a name is long enough that the cell would swallow its column. */
const MAX_NAME_LINES = 2;

/** Room the count takes when it sits beside the name rather than under it. */
const COUNT_WIDTH = 96;

/** How many lines this name needs when it has the column to itself. */
function nameLinesFor(label: string, columnWidth: number): number {
  const perLine = Math.max(8, Math.floor((columnWidth - 26) / NAME_CHAR));
  return Math.min(MAX_NAME_LINES, Math.max(1, Math.ceil(label.length / perLine)));
}

/**
 * Whether the name still fits with the number alongside it.
 *
 * Measured against the width the name actually gets, not the column's. Judging
 * it on the full width put "Program Management" and "Supply Chain Risk
 * Management" on a single line beside their counts, where they had about sixty
 * per cent of the room and ended in an ellipsis.
 */
function fitsBesideCount(label: string, columnWidth: number): boolean {
  const perLine = Math.max(6, Math.floor((columnWidth - 26 - COUNT_WIDTH) / NAME_CHAR));
  return label.length <= perLine;
}

/**
 * A cell is never shorter than its own name.
 *
 * Proportion sets every height above this; below it, quantity has run out of
 * room to say anything and legibility wins. The concession is small and it is
 * the same one the old treemap made silently, by dealing cells too small to
 * read and then cutting the name to fit them.
 */
function minHeightFor(label: string, columnWidth: number): number {
  if (fitsBesideCount(label, columnWidth)) return MIN_CELL;
  const lines = nameLinesFor(label, columnWidth);
  return Math.max(MIN_CELL, lines * NAME_LINE + 15 + 20);
}

type Column = { nodes: AtlasAreaNode[]; total: number };

/**
 * Longest-processing-time packing: the biggest thing goes into the emptiest
 * column, so the column totals finish close together and the ragged bottoms
 * stay shallow. It also puts the largest cells along the top, which is the
 * order the eye reads them in anyway.
 */
function packIntoColumns(nodes: AtlasAreaNode[], count: number): Column[] {
  const columns: Column[] = Array.from({ length: count }, () => ({
    nodes: [],
    total: 0,
  }));
  for (const node of [...nodes].sort((a, b) => b.value - a.value)) {
    let target = columns[0];
    for (const column of columns) {
      if (column.total < target.total) target = column;
    }
    target.nodes.push(node);
    target.total += Math.max(1, node.value);
  }
  return columns;
}

/** A board small enough to partition exhaustively rather than greedily. */
const EXHAUSTIVE_PACK_LIMIT = 8;

/**
 * The bottom of the map is a line the eye reads, and greedy packing does not
 * always find the flush answer even when one exists. Five groups holding
 * 8/6/6/4/4 frameworks cannot balance across three columns - the best split is
 * 10/10/8, which leaves a notch the height of two frameworks in the corner -
 * but across two columns 8+6 and 6+4+4 are both 14, and the mosaic ends flush.
 *
 * Small boards are searched exhaustively for the flattest split. Larger ones
 * keep the greedy pack, which is close enough and stays cheap.
 */
export function packBalanced(nodes: AtlasAreaNode[], count: number): Column[] {
  const ordered = [...nodes].sort((a, b) => b.value - a.value);
  if (count < 2 || ordered.length > EXHAUSTIVE_PACK_LIMIT) {
    return packIntoColumns(ordered, count);
  }

  const values = ordered.map((node) => Math.max(1, node.value));
  const assignment = new Array<number>(ordered.length).fill(0);
  let best: number[] | null = null;
  let bestSpread = Infinity;

  const walk = (index: number, totals: number[]) => {
    if (index === ordered.length) {
      if (totals.some((total) => total === 0)) return;
      const spread = Math.max(...totals) - Math.min(...totals);
      if (spread < bestSpread) {
        bestSpread = spread;
        best = [...assignment];
      }
      return;
    }
    // The largest item is pinned to the first column: every distinct split is
    // still reachable, and it removes the count! duplicate relabelings.
    const limit = index === 0 ? 1 : count;
    for (let column = 0; column < limit; column += 1) {
      assignment[index] = column;
      totals[column] += values[index];
      if (Math.max(...totals) - Math.min(...totals) < bestSpread) {
        walk(index + 1, totals);
      }
      totals[column] -= values[index];
    }
  };
  walk(0, new Array<number>(count).fill(0));

  if (!best) return packIntoColumns(ordered, count);
  const chosen = best as number[];
  const columns: Column[] = Array.from({ length: count }, () => ({
    nodes: [],
    total: 0,
  }));
  ordered.forEach((node, index) => {
    const column = columns[chosen[index]];
    column.nodes.push(node);
    column.total += Math.max(1, node.value);
  });
  return columns;
}

export function packSpread(columns: Column[]): number {
  const totals = columns.map((column) => column.total);
  return Math.max(...totals) - Math.min(...totals);
}

/**
 * The whole map, in one idiom: a cell per thing, sized by what it holds.
 *
 * Columns of a fixed width, each cell as tall as its share. Width is constant,
 * so height alone carries the quantity and area still reads true — a cell
 * twice the size of another is twice the size wherever the two sit — but
 * without the aspect-ratio lottery a squarified treemap runs. That lottery was
 * the whole problem: it decided the shape, and the shapes it dealt had no room
 * for anything. Half the cells inside SP 800-53 came out narrower than the
 * word "Maintenance", while the biggest came out 500px wide holding a name and
 * a four-word count over an acre of empty paint.
 *
 * So the floor is a column no narrower than a family name, and the space the
 * encoding buys gets spent: a cell with room names what is inside it.
 *
 * Deliberately flat. An earlier cut nested each framework inside whatever it
 * builds on, which would have made the layout itself assert the curated
 * dependency spine — a file we wrote by hand because the crosswalk data cannot
 * supply direction, covering twenty-two of twenty-eight frameworks and only
 * three levels deep. Putting an authored claim in the skeleton of the picture
 * is the same mistake as the landing that sat SP 800-53 above everything.
 * Relationship is shown instead by selection: pick a cell and the ones it
 * genuinely crosswalks to stay lit while the rest dim, which is the published
 * data talking rather than the layout.
 *
 * Cells are absolutely positioned buttons rather than SVG so every one of them
 * is focusable and readable by a screen reader.
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
  const [frame, setFrame] = useState({ width: 0, available: 0 });

  useLayoutEffect(() => {
    const element = frameRef.current;
    if (!element) return undefined;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      // Document-relative, so a resize while the reader is scrolled down does
      // not measure the map against whatever is above the fold at that moment.
      const documentTop = rect.top + globalThis.scrollY;
      setFrame({
        width: rect.width,
        available: Math.round(globalThis.innerHeight - documentTop - 24),
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    globalThis.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      globalThis.removeEventListener("resize", measure);
    };
  }, []);

  const { width, available } = frame;

  // A shape that reads well at this width...
  const natural = tall
    ? Math.max(320, Math.min(680, width * (width < 640 ? 1.3 : 0.56)))
    : Math.max(220, Math.min(520, width * (width < 640 ? 1.1 : 0.42)));
  // ...but never taller than the screen it has to fit inside. Sized from its
  // own width alone the map ran 39px past the fold at 1440x900 and 208px past
  // it at 1024x800, so the one thing the reader came for was the one thing
  // they never saw whole.
  const wanted = Math.round(
    tall && available > 0 ? Math.max(300, Math.min(natural, available)) : natural,
  );

  const { laid, height } = useMemo<{ laid: Laid[]; height: number }>(() => {
    if (!width || !nodes.length) return { laid: [], height: wanted };

    const fitsAcross = Math.max(1, Math.floor((width + GAP) / (MIN_COLUMN + GAP)));
    // Enough columns that every cell can clear its minimum height, so a level
    // holding twenty-eight families does not force them all below reading size.
    const neededForHeight = Math.ceil((nodes.length * (MIN_CELL + GAP)) / wanted);
    const preferredCount = Math.max(
      1,
      Math.min(
        fitsAcross,
        Math.max(neededForHeight, Math.ceil(Math.sqrt(nodes.length))),
      ),
    );

    // The square-ish count is the right shape almost always, but it is chosen
    // without looking at what the cells actually hold, so it can pick a count
    // no split can balance. Check one step either side and take the flattest
    // bottom; ties keep the preferred shape. Bounded to a step so a board never
    // collapses into one long column just because that is trivially flush.
    const candidates = [preferredCount - 1, preferredCount, preferredCount + 1]
      .filter(
        (count) =>
          count >= Math.max(1, neededForHeight) && count <= fitsAcross,
      );
    let columnCount = preferredCount;
    let columns = packBalanced(nodes, preferredCount);
    if (nodes.length <= EXHAUSTIVE_PACK_LIMIT) {
      let bestSpread = packSpread(columns);
      for (const count of candidates) {
        if (count === preferredCount) continue;
        const candidate = packBalanced(nodes, count);
        if (packSpread(candidate) < bestSpread) {
          bestSpread = packSpread(candidate);
          columnCount = count;
          columns = candidate;
        }
      }
    }
    const columnWidth = (width - GAP * (columnCount - 1)) / columnCount;

    const tallestTotal = Math.max(...columns.map((column) => column.total), 1);
    const mostCells = Math.max(...columns.map((column) => column.nodes.length), 1);
    let unitPx = Math.max(
      0.0001,
      (wanted - GAP * (mostCells - 1)) / tallestTotal,
    );

    // Cells held at their minimum cannot shrink, so one pass can overshoot.
    // Settle it by measuring and easing the scale down rather than solving it.
    const heightsFor = (column: Column) =>
      column.nodes.map((node) =>
        Math.max(
          minHeightFor(node.label, columnWidth),
          Math.max(1, node.value) * unitPx,
        ));
    for (let pass = 0; pass < 8; pass += 1) {
      const tallest = Math.max(
        ...columns.map(
          (column) =>
            heightsFor(column).reduce((sum, value) => sum + value, 0)
            + GAP * (column.nodes.length - 1),
        ),
      );
      if (tallest <= wanted + 0.5) break;
      unitPx *= (wanted / tallest) * 0.99;
    }

    // Every column carries the same number of gaps' worth of height regardless
    // of how many cells it holds, so a column of two used to finish a gap short
    // of a column of three and the mosaic ended on a ragged line. The extra is
    // spent widening that column's own gaps, never its cells: heights still say
    // exactly what each group holds, and the bottom reads as one edge.
    const columnExtents = columns.map((column) => {
      const heights = heightsFor(column);
      return (
        heights.reduce((sum, value) => sum + value, 0)
        + GAP * (column.nodes.length - 1)
      );
    });
    const flushTo = Math.max(...columnExtents, 0);

    const cells: Laid[] = [];
    let tallestColumn = 0;
    columns.forEach((column, columnIndex) => {
      let top = 0;
      const heights = heightsFor(column);
      const seams = column.nodes.length - 1;
      const contentHeight = heights.reduce((sum, value) => sum + value, 0);
      const columnGap =
        seams > 0 ? Math.max(GAP, (flushTo - contentHeight) / seams) : GAP;
      column.nodes.forEach((node, index) => {
        const cellHeight = heights[index];
        cells.push({
          ...node,
          left: columnIndex * (columnWidth + GAP),
          top,
          width: columnWidth,
          height: cellHeight,
          floored: Math.max(1, node.value) * unitPx < cellHeight - 0.5,
        });
        top += cellHeight + columnGap;
      });
      tallestColumn = Math.max(tallestColumn, top - columnGap);
    });

    return { laid: cells, height: Math.round(Math.max(wanted, tallestColumn)) };
  }, [nodes, width, wanted]);

  // Below this a column cannot reach its minimum width, so the mosaic has
  // nothing left to say with shape. The same reading — what is here and how
  // much of it — survives as a list in size order.
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
                <span className="atlas-area__count">
                  {withUnitNoun(node.value, node.unitLabel || unit)}
                </span>
              </Tag>
            );
          })
        : laid.map((cell) => {
          // One cell, three amounts of room. A tall cell is a plate: display
          // type, and what is inside it named. A short one is a strip, name
          // and number on one line — but only when the name actually fits on
          // one line, or the number would push it off the side.
          const band = cell.height >= 148
            ? "plate"
            : cell.height >= 66 || !fitsBesideCount(cell.label, cell.width)
              ? "card"
              : "strip";
          // Dimmed only while something is selected and this is not part of
          // what that thing connects to.
          const dim = Boolean(
            connectedIds
              && selectedId
              && cell.id !== selectedId
              && !connectedIds.has(cell.id),
          );
          const reading = withUnitNoun(cell.value, cell.unitLabel || unit);
          // Chips follow the room, not the band. Tying them to "plate" meant
          // the two smallest groups on the landing named nothing while the
          // three larger ones listed everything, which read as a rendering
          // fault rather than a size.
          const chipRows = Math.max(0, Math.floor((cell.height - 92) / 26));
          const members = chipRows > 0 ? cell.members || [] : [];
          const shown = members.slice(0, chipRows * 3);
          const Tag = cell.openable ? "button" : "span";
          return (
            <Tag
              aria-current={cell.id === selectedId ? "true" : undefined}
              className="atlas-area__cell"
              data-band={band}
              data-dim={dim ? "true" : undefined}
              data-floored={cell.floored ? "true" : undefined}
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
              title={`${cell.label} — ${reading}`}
              type={cell.openable ? "button" : undefined}
            >
              <span className="visually-hidden">
                {cell.label} — {reading}
              </span>
              <span aria-hidden="true" className="atlas-area__head">
                <span className="atlas-area__name">{cell.label}</span>
                <span className="atlas-area__count">{reading}</span>
              </span>
              {band !== "strip" && cell.note ? (
                <span aria-hidden="true" className="atlas-area__note">{cell.note}</span>
              ) : null}
              {shown.length ? (
                <span aria-hidden="true" className="atlas-area__members">
                  {shown.map((member) => (
                    <em key={member}>{member}</em>
                  ))}
                  {members.length > shown.length ? (
                    <em data-more="true">+{members.length - shown.length}</em>
                  ) : null}
                </span>
              ) : null}
            </Tag>
          );
        })}
    </div>
  );
}
