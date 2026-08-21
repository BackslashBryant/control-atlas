import { memo, useMemo, useState, type CSSProperties } from "react";
import {
  IconChevronRight,
  IconLayoutColumns,
  IconLayoutRows,
} from "@tabler/icons-react";

import type {
  AtlasProjectionDrill,
  AtlasSemanticProjectionArtifact,
} from "../lib/atlasGraphProjection";
import {
  buildAtlasTree,
  splitColumnRows,
  type AtlasDecompositionScope,
  type AtlasTreeColumn,
  type AtlasTreeRow,
} from "../lib/atlasDecomposition";

type AtlasOrientation = "across" | "down";

type AtlasDecompositionMapProps = {
  artifact: AtlasSemanticProjectionArtifact;
  scope: AtlasDecompositionScope;
  onDrill: (drill: AtlasProjectionDrill) => void;
  /** Move the scope back to an ancestor. An empty id returns to the root. */
  onTrail: (level: "root" | "area" | "publication" | "detail", id: string) => void;
};

/**
 * Connector geometry. Rows are a fixed height so the curves can be drawn from
 * arithmetic instead of DOM measurement, which keeps them correct during
 * layout changes and avoids a resize-observer on the hot path.
 */
const ROW_HEIGHT = 44;
const ROW_GAP = 4;
const ROW_STRIDE = ROW_HEIGHT + ROW_GAP;
const COLUMN_HEAD_HEIGHT = 58;
const GUTTER_WIDTH = 34;

function rowCenterY(index: number): number {
  return COLUMN_HEAD_HEIGHT + index * ROW_STRIDE + ROW_HEIGHT / 2;
}

function formatCount(count: number): string {
  return count.toLocaleString("en-US");
}

function rowMeta(row: AtlasTreeRow): string {
  if (row.leaf) return row.kind;
  if (row.count === 0) return "Nothing yet";
  return `${formatCount(row.count)} ${row.count === 1 ? "record" : "records"}`;
}

function TreeRow(props: {
  row: AtlasTreeRow;
  selected: boolean;
  groupHeading: string;
  onDrill: (drill: AtlasProjectionDrill) => void;
}) {
  const { row, selected, groupHeading, onDrill } = props;
  const style = { "--atlas-decomp-row-share": row.share } as CSSProperties;
  const meta = rowMeta(row);
  const drill = row.drill;

  return (
    <>
      {groupHeading ? (
        <li className="atlas-decomp__group" role="presentation">
          {groupHeading}
        </li>
      ) : null}
      <li className="atlas-decomp__row" style={style}>
        {/* A row is only a control when it can actually open something. The
            authority landmarks carry a count but have no destination, so they
            render as readable rows rather than buttons that do nothing. */}
        {drill ? (
          <button
            aria-current={selected ? "true" : undefined}
            className="atlas-decomp__node"
            data-state={selected ? "selected" : "available"}
            onClick={() => onDrill(drill)}
            title={`${row.label} — ${meta}`}
            type="button"
          >
            <span aria-hidden="true" className="atlas-decomp__bar" />
            <span className="atlas-decomp__label">{row.label}</span>
            <span className="atlas-decomp__meta">{meta}</span>
            <IconChevronRight
              aria-hidden="true"
              className="atlas-decomp__chevron"
              size={15}
              stroke={2}
            />
          </button>
        ) : (
          <div
            className="atlas-decomp__node"
            data-state={row.empty ? "empty" : "static"}
            title={`${row.label} — ${meta}`}
          >
            <span aria-hidden="true" className="atlas-decomp__bar" />
            <span className="atlas-decomp__label">{row.label}</span>
            <span className="atlas-decomp__meta">{meta}</span>
          </div>
        )}
      </li>
    </>
  );
}

function TreeColumn(props: {
  column: AtlasTreeColumn;
  expanded: boolean;
  onExpand: (expanded: boolean) => void;
  onDrill: (drill: AtlasProjectionDrill) => void;
}) {
  const { column, expanded, onExpand, onDrill } = props;
  const { visible, hidden } = splitColumnRows(column.rows, expanded);
  const headingId = `atlas-decomp-${column.key}`;
  const selectedId = column.selectedIndex >= 0 ? column.rows[column.selectedIndex]?.id : "";

  return (
    <section
      aria-labelledby={headingId}
      className="atlas-decomp__column"
      data-column={column.key}
      data-row-count={column.rows.length}
    >
      <header className="atlas-decomp__column-head">
        <h3 id={headingId}>
          {column.title}
          <span className="atlas-decomp__column-count">{column.rows.length}</span>
        </h3>
        <p>{column.caption}</p>
      </header>
      <ul className="atlas-decomp__rows">
        {visible.map((row, index) => (
          <TreeRow
            groupHeading={
              row.group === "authority" && visible[index - 1]?.group !== "authority"
                ? "Authorities"
                : ""
            }
            key={row.id}
            onDrill={onDrill}
            row={row}
            selected={row.id === selectedId}
          />
        ))}
      </ul>
      {hidden > 0 ? (
        <button className="atlas-decomp__more" onClick={() => onExpand(true)} type="button">
          Show {formatCount(hidden)} more
        </button>
      ) : null}
      {expanded ? (
        <button className="atlas-decomp__more" onClick={() => onExpand(false)} type="button">
          Show fewer
        </button>
      ) : null}
    </section>
  );
}

/**
 * Curves from the opened row of one column to every row of the next. Stroke
 * weight follows the target's magnitude, so the connector carries the same
 * information as the bar it lands on.
 */
function TreeConnector(props: { fromIndex: number; targets: AtlasTreeRow[] }) {
  const { fromIndex, targets } = props;
  if (fromIndex < 0 || targets.length === 0) {
    return <div aria-hidden="true" className="atlas-decomp__gutter" />;
  }
  const startY = rowCenterY(fromIndex);
  const height = COLUMN_HEAD_HEIGHT + targets.length * ROW_STRIDE;
  const span = Math.max(height, startY + ROW_HEIGHT);

  return (
    <div aria-hidden="true" className="atlas-decomp__gutter">
      <svg
        className="atlas-decomp__gutter-svg"
        height={span}
        preserveAspectRatio="none"
        viewBox={`0 0 ${GUTTER_WIDTH} ${span}`}
        width={GUTTER_WIDTH}
      >
        {targets.map((row, index) => {
          const endY = rowCenterY(index);
          return (
            <path
              d={`M0 ${startY} C ${GUTTER_WIDTH * 0.55} ${startY}, ${GUTTER_WIDTH * 0.45} ${endY}, ${GUTTER_WIDTH} ${endY}`}
              key={row.id}
              strokeWidth={1 + row.share * 5}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Memoised because the Atlas page re-renders on every keystroke in its search
 * box. Re-rendering forty labelled rows and their connector geometry on each
 * character was both wasted work and enough render pressure to drop the first
 * characters typed straight after a drill.
 */
export const AtlasDecompositionMap = memo(function AtlasDecompositionMap(
  props: AtlasDecompositionMapProps,
) {
  const { artifact, scope, onDrill, onTrail } = props;
  const { areaId, publicationId, detailId } = scope;
  const [orientation, setOrientation] = useState<AtlasOrientation>("across");
  const [expandedColumns, setExpandedColumns] = useState<Record<string, boolean>>({});
  // Depend on the scope's values, not the object identity: the caller rebuilds
  // the object on every render and would otherwise defeat the memo.
  const model = useMemo(
    () => buildAtlasTree(artifact, { areaId, publicationId, detailId }),
    [artifact, areaId, publicationId, detailId],
  );

  return (
    <div
      className="atlas-decomp"
      data-atlas-map="tree"
      data-level-count={model.columns.length}
      data-orientation={orientation}
      data-scope-level={model.path[model.path.length - 1].level}
      data-testid="atlas-map"
    >
      <div className="atlas-decomp__toolbar">
        <nav aria-label="Atlas scope" className="atlas-decomp__path">
          <ol>
            {model.path.map((step, index) => {
              const last = index === model.path.length - 1;
              return (
                <li key={`${step.level}:${step.id || "root"}`}>
                  {last ? (
                    <span aria-current="page">{step.label}</span>
                  ) : (
                    <button onClick={() => onTrail(step.level, step.id)} type="button">
                      {step.label}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
          <p className="atlas-decomp__scope-count">
            {formatCount(model.scopeCount)} records in view
          </p>
        </nav>
        <div className="atlas-decomp__orientation" role="group" aria-label="Map layout">
          <button
            aria-pressed={orientation === "across"}
            className="atlas-decomp__orientation-button"
            onClick={() => setOrientation("across")}
            type="button"
          >
            <IconLayoutColumns aria-hidden="true" size={15} stroke={1.8} />
            Across
          </button>
          <button
            aria-pressed={orientation === "down"}
            className="atlas-decomp__orientation-button"
            onClick={() => setOrientation("down")}
            type="button"
          >
            <IconLayoutRows aria-hidden="true" size={15} stroke={1.8} />
            Down
          </button>
        </div>
      </div>

      {model.scopeDescription ? (
        <p className="atlas-decomp__description">{model.scopeDescription}</p>
      ) : null}

      <div className="atlas-decomp__levels">
        {model.columns.map((column, index) => {
          const previous = model.columns[index - 1];
          const previousExpanded = previous ? expandedColumns[previous.key] === true : false;
          const previousVisible = previous
            ? splitColumnRows(previous.rows, previousExpanded).visible.length
            : 0;
          const connectorFrom =
            previous && previous.selectedIndex >= 0 && previous.selectedIndex < previousVisible
              ? previous.selectedIndex
              : -1;
          return (
            <div className="atlas-decomp__level" key={column.key}>
              {previous ? (
                <TreeConnector
                  fromIndex={connectorFrom}
                  targets={splitColumnRows(column.rows, expandedColumns[column.key] === true).visible}
                />
              ) : null}
              <TreeColumn
                column={column}
                expanded={expandedColumns[column.key] === true}
                onDrill={onDrill}
                onExpand={(next) =>
                  setExpandedColumns((current) => ({ ...current, [column.key]: next }))
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});
