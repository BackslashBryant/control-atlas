import {
  IconArrowRight,
  IconChecklist,
  IconExternalLink,
  IconFileDescription,
  IconFolderOpen,
  IconGavel,
  IconSearch,
  IconSettings,
  IconShield,
} from "@tabler/icons-react";

import {
  ATLAS_PATH_STAGES,
  ATLAS_RMF_STAGES,
  type AtlasConnectionGroup,
  type AtlasRelationshipRow,
} from "../lib/atlasModel";
import type { AtlasNeighborhoodNode } from "../lib/runtimeLoader";

type AtlasLens = "purpose" | "rmf";

type AtlasDecompositionBoardProps = {
  center: AtlasNeighborhoodNode;
  groups: AtlasConnectionGroup[];
  lens: AtlasLens;
  selectedItemId: string;
  onOpenList: () => void;
  onOpenRecord: (nodeId: string) => void;
  onOpenSources: (sourceId?: string) => void;
  onSelect: (row: AtlasRelationshipRow | null) => void;
};

const PURPOSE_ICONS = [
  IconFileDescription,
  IconShield,
  IconSettings,
  IconFolderOpen,
  IconSearch,
  IconGavel,
];

const RMF_ICONS = [
  IconFileDescription,
  IconChecklist,
  IconShield,
  IconSettings,
  IconSearch,
  IconGavel,
];

export function AtlasDecompositionBoard(props: AtlasDecompositionBoardProps) {
  const centerLabel = props.center.metadata?.item_id || props.center.id;
  const centerTitle =
    props.center.metadata?.title || props.center.label || centerLabel;
  const selectedRow = props.groups
    .flatMap((group) => group.items)
    .find((row) => row.counterpart.id === props.selectedItemId);
  const definitions =
    props.lens === "rmf" ? ATLAS_RMF_STAGES : ATLAS_PATH_STAGES;
  const centerStage = props.lens === "rmf" ? "prepare" : "control";
  const icons = props.lens === "rmf" ? RMF_ICONS : PURPOSE_ICONS;

  return (
    <section
      aria-label={`${props.lens === "rmf" ? "RMF" : "Purpose"} decomposition path`}
      className="atlas-decomposition"
    >
      <div className="atlas-decomposition-board">
        {definitions.map((stage, index) => {
          const stageRows = props.groups
            .filter((group) =>
              props.lens === "rmf"
                ? group.rmfStage === stage.id
                : group.stage === stage.id,
            )
            .flatMap((group) => group.items);
          const includesCenter = stage.id === centerStage;
          const total = stageRows.length + (includesCenter ? 1 : 0);
          const visibleRows = stageRows.slice(0, includesCenter ? 2 : 3);
          const StageIcon = icons[index] || IconFileDescription;

          return (
            <section
              aria-labelledby={`atlas-decomposition-${props.lens}-${stage.id}`}
              className="atlas-decomposition-stage"
              data-stage={stage.id}
              key={stage.id}
            >
              <header>
                <h2 id={`atlas-decomposition-${props.lens}-${stage.id}`}>
                  {index + 1}. {stage.label}
                </h2>
                <span aria-label={`${total} records in ${stage.label}`}>{total}</span>
              </header>
              <div className="atlas-decomposition-stage-body">
                {includesCenter ? (
                  <button
                    aria-pressed={!selectedRow}
                    className={`atlas-decomposition-card atlas-decomposition-card--center${!selectedRow ? " active" : ""}`}
                    onClick={() => props.onSelect(null)}
                    type="button"
                  >
                    <StageIcon aria-hidden="true" size={28} stroke={1.7} />
                    <span>
                      <strong>{centerLabel}</strong>
                      <small>{centerTitle}</small>
                    </span>
                  </button>
                ) : null}

                {visibleRows.map((row) => {
                  const active = selectedRow?.counterpart.id === row.counterpart.id;
                  return (
                    <button
                      aria-pressed={active}
                      className={`atlas-decomposition-card${active ? " active" : ""}`}
                      key={`${row.edge.id}:${row.counterpart.id}`}
                      onClick={() => props.onSelect(row)}
                      type="button"
                    >
                      <StageIcon aria-hidden="true" size={26} stroke={1.6} />
                      <span>
                        <strong>{row.itemId}</strong>
                        <small>{row.title}</small>
                      </span>
                    </button>
                  );
                })}

                {total === 0 ? (
                  <div className="atlas-decomposition-empty">
                    <span>Known gap</span>
                    <p>No published connection in this stage.</p>
                  </div>
                ) : null}

                {stageRows.length > visibleRows.length ? (
                  <button
                    className="atlas-decomposition-more"
                    onClick={props.onOpenList}
                    type="button"
                  >
                    + {stageRows.length - visibleRows.length} more in List
                  </button>
                ) : null}
              </div>
              {index < definitions.length - 1 ? (
                <IconArrowRight
                  aria-hidden="true"
                  className="atlas-decomposition-arrow"
                  size={24}
                  stroke={1.8}
                />
              ) : null}
            </section>
          );
        })}
      </div>

      <aside aria-label="Selected path" className="atlas-selected-path">
        <div>
          <p className="eyebrow">Selected path</p>
          <h2>
            {selectedRow
              ? `${selectedRow.itemId} — ${selectedRow.title}`
              : `${centerLabel} implementation to review`}
          </h2>
          <p>
            {selectedRow?.edge.plain_language_rationale ||
              `Follow what ${centerLabel} requires, what supports it, and where the published path has gaps.`}
          </p>
        </div>
        <div className="atlas-selected-path-actions">
          <button
            className="primary"
            onClick={() =>
              props.onOpenRecord(selectedRow?.counterpart.id || props.center.id)
            }
            type="button"
          >
            <IconExternalLink aria-hidden="true" size={18} />
            Open selected record
          </button>
          <button
            className="secondary"
            onClick={() =>
              props.onOpenSources(selectedRow?.edge.source_refs?.[0]?.source_id)
            }
            type="button"
          >
            <IconFolderOpen aria-hidden="true" size={18} />
            View source evidence
          </button>
        </div>
      </aside>
    </section>
  );
}
