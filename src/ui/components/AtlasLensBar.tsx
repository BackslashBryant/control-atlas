import { type CSSProperties } from "react";
import { IconMap2 } from "@tabler/icons-react";

import { areaPresentationForCatalog } from "../lib/areaVisualLanguage";
import { ATLAS_LENS_ENTRIES, type AtlasLensEntry } from "../lib/atlasLensEntries";

type AtlasLensBarProps = {
  /** The publication currently in scope, if any. */
  activePublicationId: string;
  /** True once any scope is set, so the way back is offered. */
  scoped: boolean;
  onPick: (entry: AtlasLensEntry) => void;
  onWholeLandscape: () => void;
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
  const { activePublicationId, scoped, onPick, onWholeLandscape } = props;

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
                type="button"
              >
                <span aria-hidden="true" className="atlas-lens-bar__dot" />
                <span className="atlas-lens-bar__label">{entry.label}</span>
                <span className="atlas-lens-bar__blurb">{entry.blurb}</span>
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
      ) : null}
    </nav>
  );
}
