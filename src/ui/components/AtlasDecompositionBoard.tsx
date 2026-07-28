import {
  IconArrowRight,
  IconChecklist,
  IconChevronRight,
  IconExternalLink,
  IconFileDescription,
  IconFolderOpen,
  IconGavel,
  IconSearch,
  IconSettings,
  IconShield,
} from "@tabler/icons-react";

import {
  ATLAS_RELATIONSHIP_LENSES,
  type AtlasConnectionGroup,
  type AtlasRelationshipRow,
} from "../lib/atlasModel";
import type { AtlasNeighborhoodNode } from "../lib/runtimeLoader";
import { relationshipExplanation } from "../lib/relationshipProvenance";
import { Button } from "./lsm/Button";

type AtlasDecompositionBoardProps = {
  center: AtlasNeighborhoodNode;
  groups: AtlasConnectionGroup[];
  stageId: string;
  selectedItemId: string;
  onOpenList: () => void;
  onContinueFrom: (nodeId: string) => void;
  onOpenDetail: (nodeId: string) => void;
  onOpenSources: (sourceId?: string) => void;
  onSelect: (row: AtlasRelationshipRow | null) => void;
  onStageChange: (stageId: string) => void;
};

const LENS_ICONS = [
  IconFileDescription,
  IconShield,
  IconSettings,
  IconFolderOpen,
  IconSearch,
  IconGavel,
  IconChecklist,
];

const STAGE_PREVIEW_LIMIT = 12;

/**
 * The Path is a walk, not a board. Previously every lens rendered at once
 * with three items each, so it read as a dump of everything rather than a
 * route through anything. Now it asks one question at a time:
 *
 *   1. which relationship lens do you want?   (shallow — lenses + counts)
 *   2. which record in that lens?              (wading  — that lens only)
 *   3. either continue the path from it or open its full record
 */
export function AtlasDecompositionBoard(props: AtlasDecompositionBoardProps) {
  const centerLabel = props.center.metadata?.item_id || props.center.id;
  const centerTitle =
    props.center.metadata?.title || props.center.label || centerLabel;
  const definitions = ATLAS_RELATIONSHIP_LENSES;
  const icons = LENS_ICONS;
  const lensLabel = "Relationship lenses";

  const stagesWithRows = definitions.map((stage, index) => ({
    stage,
    index,
    Icon: icons[index] || IconFileDescription,
    rows: props.groups
      .filter((group) => group.lens === stage.id)
      .flatMap((group) => group.items),
  }));

  const activeStage =
    stagesWithRows.find((entry) => entry.stage.id === props.stageId) || null;
  const selectedRow = activeStage?.rows.find(
    (row) => row.counterpart.id === props.selectedItemId,
  );

  return (
    <section
      aria-label={`${lensLabel} path from ${centerLabel}`}
      className="atlas-decomposition"
    >
      <nav aria-label="Path position" className="atlas-path-breadcrumb">
        <span className="atlas-path-crumb-subject">{centerLabel}</span>
        <IconChevronRight aria-hidden="true" size={15} />
        {activeStage ? (
          <>
            <button
              className="atlas-path-crumb-link"
              onClick={() => {
                props.onSelect(null);
                props.onStageChange("");
              }}
              type="button"
            >
              {lensLabel}
            </button>
            <IconChevronRight aria-hidden="true" size={15} />
            <span aria-current="step">{activeStage.stage.label}</span>
          </>
        ) : (
          <span aria-current="step">{lensLabel}</span>
        )}
      </nav>

      {!activeStage ? (
        <>
          <p className="atlas-path-prompt">
            Where do you want to go from <strong>{centerLabel}</strong>?
          </p>
          <ul className="atlas-path-stage-list">
            {stagesWithRows.map(({ stage, index, Icon, rows }) => (
              <li key={stage.id}>
                <button
                  className="atlas-path-stage-option"
                  disabled={rows.length === 0}
                  onClick={() => {
                    props.onSelect(null);
                    props.onStageChange(stage.id);
                  }}
                  type="button"
                >
                  <Icon aria-hidden="true" size={26} stroke={1.6} />
                  <span className="atlas-path-stage-option-text">
                    <strong>
                      {index + 1}. {stage.label}
                    </strong>
                    <small>
                      {rows.length === 0
                        ? "No published connection yet"
                        : `${rows.length} record${rows.length === 1 ? "" : "s"}`}
                    </small>
                  </span>
                  {rows.length > 0 ? (
                    <IconChevronRight aria-hidden="true" size={18} />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="atlas-path-prompt">
            {activeStage.rows.length} record
            {activeStage.rows.length === 1 ? "" : "s"} connect{" "}
            <strong>{centerLabel}</strong> to {activeStage.stage.label}. Open
            one to continue the path from it.
          </p>
          <ul className="atlas-path-record-list">
            {activeStage.rows.slice(0, STAGE_PREVIEW_LIMIT).map((row) => (
              <li key={`${row.edge.id}:${row.counterpart.id}`}>
                <button
                  className={`atlas-path-record${selectedRow?.counterpart.id === row.counterpart.id ? " active" : ""}`}
                  onClick={() => props.onSelect(row)}
                  type="button"
                >
                  <span className="atlas-path-record-text">
                    <strong>{row.itemId}</strong>
                    <small>{row.title}</small>
                  </span>
                  <IconChevronRight aria-hidden="true" size={18} />
                </button>
              </li>
            ))}
          </ul>
          {activeStage.rows.length > STAGE_PREVIEW_LIMIT ? (
            <button
              className="atlas-decomposition-more"
              onClick={props.onOpenList}
              type="button"
            >
              + {activeStage.rows.length - STAGE_PREVIEW_LIMIT} more in List
            </button>
          ) : null}
        </>
      )}

      <aside aria-label="Selected path" className="atlas-selected-path">
        <div>
          <p className="eyebrow">
            {selectedRow ? "Selected record" : "Current subject"}
          </p>
          <h2>
            {selectedRow
              ? `${selectedRow.itemId} — ${selectedRow.title}`
              : `${centerLabel} — ${centerTitle}`}
          </h2>
          <p>
            {selectedRow ? relationshipExplanation(selectedRow.edge).text :
              (activeStage
                ? `Choose a record above to continue the path from it.`
                : `Pick a stage to see what ${centerLabel} connects to.`)}
          </p>
        </div>
        <div className="atlas-selected-path-actions">
          {selectedRow ? (
            <Button
              variant="primary"
              onClick={() => props.onContinueFrom(selectedRow.counterpart.id)}
              type="button"
            >
              <IconArrowRight aria-hidden="true" size={18} />
              Continue from {selectedRow.itemId}
            </Button>
          ) : null}
          <Button
            variant={selectedRow ? "secondary" : "primary"}
            onClick={() =>
              props.onOpenDetail(selectedRow?.counterpart.id || props.center.id)
            }
            type="button"
          >
            <IconExternalLink aria-hidden="true" size={18} />
            Open full record
          </Button>
          {selectedRow?.edge.source_refs?.[0]?.source_id ? (
            <Button
              variant="secondary"
              onClick={() =>
                props.onOpenSources(selectedRow.edge.source_refs[0].source_id)
              }
              type="button"
            >
              <IconFolderOpen aria-hidden="true" size={18} />
              View source evidence
            </Button>
          ) : null}
        </div>
      </aside>
    </section>
  );
}
