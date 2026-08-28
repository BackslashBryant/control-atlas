import { identityMarkAddsSignal } from "../../shared/identity-registry.mjs";
import { TAXONOMY_TAG_BY_ID } from "../../shared/taxonomy-contract.mjs";
import { AppLink } from "./AppLink";
import { IdentityMark } from "./IdentityMark";

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
  // A monogram that repeats the label reads as "NIST NIST"; suppress it until
  // an approved official mark exists for the term.
  const showIdentity =
    props.showIdentity !== false &&
    Boolean(tag.identity_key) &&
    identityMarkAddsSignal(tag.id, tag.label);
  const dimensionLabel = tag.dimension.replace(/_/g, " ");

  return (
    <span
      className={`atlas-tag atlas-tag--${size}${props.selected ? " atlas-tag--selected" : ""}`}
      data-dimension={tag.dimension}
    >
      {showIdentity ? (
        <IdentityMark decorative termId={tag.id} size={size === "sm" ? 14 : 18} />
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
        <span className="atlas-tag__type">{dimensionLabel}</span>
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
