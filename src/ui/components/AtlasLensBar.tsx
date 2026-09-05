import { type CSSProperties } from "react";
import { IconBuildingBank, IconMap2, IconTopologyStar3 } from "@tabler/icons-react";

import { areaPresentationForCatalog } from "../lib/areaVisualLanguage";
import { ATLAS_LENS_ENTRIES, type AtlasLensEntry } from "../lib/atlasLensEntries";

type AtlasLensBarProps = {
  /** The publication currently in scope, if any. */
  activePublicationId: string;
  /** True once any scope is set, so the way back is offered. */
  scoped: boolean;
  /** Which survey the unscoped Atlas is showing: "" or "publishers". */
  landing: string;
  onPick: (entry: AtlasLensEntry) => void;
  onWholeLandscape: () => void;
  onLandingChange: (landing: string) => void;
};

/**
 * The doors into the landscape, named the way practitioners name them.
 *
 * These sit above the map rather than inside it because they are useful in
 * both states: on the landing they are a shortcut past the survey for someone
 * who already knows what they came for, and once the reader is deep inside a
 * framework they are the way across to another one without going home first.
 * "Whole landscape" appears only when there is something to come back from.
 */
export function AtlasLensBar(props: AtlasLensBarProps) {
  const {
    activePublicationId,
    scoped,
    landing,
    onPick,
    onWholeLandscape,
    onLandingChange,
  } = props;

  return (
    <nav aria-label="Ways into the Atlas" className="atlas-lens-bar">
      <p className="atlas-lens-bar__lede">Start from</p>
      <ul>
        {ATLAS_LENS_ENTRIES.map((entry) => {
          const area = areaPresentationForCatalog(entry.publicationId);
          const active = entry.publicationId === activePublicationId;
          return (
            <li key={entry.id}>
              <button
                aria-current={active ? "true" : undefined}
                className="atlas-lens-bar__entry"
                onClick={() => onPick(entry)}
                style={
                  {
                    "--ca-area-color": `var(${area?.token || "--ca-area-operations"})`,
                  } as CSSProperties
                }
                title={`${entry.label} — ${entry.blurb}`}
                type="button"
              >
                <span aria-hidden="true" className="atlas-lens-bar__dot" />
                <span className="atlas-lens-bar__label">{entry.label}</span>
                {/* The blurb is what turns "RMF" into a door on the way in.
                    Once the reader is inside a framework these are the way
                    across to another one, not a menu to be read — and spelling
                    them all out wrapped the bar onto a second row, putting
                    more chrome between the click and what it opened. */}
                {scoped ? null : (
                  <span className="atlas-lens-bar__blurb">{entry.blurb}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {scoped ? (
        <button
          className="atlas-lens-bar__reset"
          onClick={onWholeLandscape}
          type="button"
        >
          <IconMap2 aria-hidden="true" size={15} stroke={1.9} />
          Whole landscape
        </button>
      ) : (
        // Two questions about the same corpus: how these frameworks relate,
        // and who issues them. The publisher list is also where the statutes
        // and directives live — authority carries no crosswalks, so it cannot
        // appear on a map drawn from them.
        <div aria-label="Survey the Atlas by" className="atlas-lens-bar__survey" role="group">
          <button
            aria-pressed={landing !== "publishers"}
            onClick={() => onLandingChange("")}
            type="button"
          >
            <IconTopologyStar3 aria-hidden="true" size={15} stroke={1.8} />
            Landscape
          </button>
          <button
            aria-pressed={landing === "publishers"}
            onClick={() => onLandingChange("publishers")}
            type="button"
          >
            <IconBuildingBank aria-hidden="true" size={15} stroke={1.8} />
            By publisher
          </button>
        </div>
      )}
    </nav>
  );
}
