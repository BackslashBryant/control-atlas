import { TAXONOMY_TAG_BY_ID } from "../../shared/taxonomy-contract.mjs";
import { AppLink } from "./AppLink";
import { DimensionGlyph } from "./DimensionGlyph";

import type { ViewState } from "../lib/viewState";

type Navigate = (view: ViewState["view"], patch?: Partial<ViewState>) => void;

export function AtlasTag(props: {
  tagId: string;
  onNavigate: Navigate;
  size?: "sm" | "md";
  showIdentity?: boolean;
  showType?: boolean;
  removable?: boolean;
  selected?: boolean;
  onRemove?: () => void;
}) {
  const tag = TAXONOMY_TAG_BY_ID.get(props.tagId);
  if (!tag) return null;

  const size = props.size ?? "md";
  // The glyph names the kind of thing, which the label never can. It is not a
  // publisher mark: showIdentity keeps its name for callers, but a tag now
  // carries type, not identity.
  const showGlyph = props.showIdentity !== false;
  const typeLabel = tag.dimension.replace(/_/g, " ");

  return (
    <span
      className={`atlas-tag atlas-tag--${size}${props.selected ? " atlas-tag--selected" : ""}`}
      data-dimension={tag.dimension}
    >
      {showGlyph ? (
        <DimensionGlyph decorative dimension={tag.dimension} size={size === "sm" ? 14 : 16} />
      ) : null}
      <AppLink
        className="atlas-tag__label"
        onNavigate={props.onNavigate}
        patch={{ tags: [tag.id] }}
        view="search"
      >
        {tag.label}
      </AppLink>
      {props.showType ? (
        <span className="atlas-tag__type">{typeLabel}</span>
      ) : null}
      {props.removable && props.onRemove ? (
        <button
          aria-label={`Remove ${tag.label}`}
          className="atlas-tag__dismiss"
          onClick={props.onRemove}
          type="button"
        >
          &times;
        </button>
      ) : null}
    </span>
  );
}
