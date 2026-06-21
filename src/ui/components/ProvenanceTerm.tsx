import { useId } from "react";

import {
  confidenceDescriptionMap,
  evidenceDescriptionMap,
  provenanceDescriptionMap,
  publicationDescriptionMap,
  trustDescriptionMap,
} from "../../content/copy.mjs";
import { displayNameFor } from "../../app/display-names.mjs";

type ProvenanceTermKind =
  | "provenance"
  | "confidence"
  | "publication"
  | "trust"
  | "evidence";

function descriptionFor(kind: ProvenanceTermKind, value: string): string {
  if (!value) return "No additional trust detail recorded.";
  switch (kind) {
    case "provenance":
      return (
        provenanceDescriptionMap[
          value as keyof typeof provenanceDescriptionMap
        ] || displayNameFor("provenance_class", value)
      );
    case "confidence":
      return (
        confidenceDescriptionMap[value as keyof typeof confidenceDescriptionMap] ||
        displayNameFor("confidence", value)
      );
    case "publication":
      return (
        publicationDescriptionMap[
          value as keyof typeof publicationDescriptionMap
        ] || value
      );
    case "trust":
      return (
        trustDescriptionMap[value as keyof typeof trustDescriptionMap] || value
      );
    case "evidence":
      return (
        evidenceDescriptionMap[value as keyof typeof evidenceDescriptionMap] ||
        value
      );
    default:
      return value;
  }
}

export function ProvenanceTerm(props: {
  kind: ProvenanceTermKind;
  value?: string;
  label?: string;
  className?: string;
}) {
  const { kind, value = "", label, className = "" } = props;
  const descriptionId = useId();
  const visibleLabel =
    label ||
    (kind === "provenance"
      ? displayNameFor("provenance_class", value)
      : kind === "confidence"
        ? displayNameFor("confidence", value)
        : value);
  const description = descriptionFor(kind, value);

  return (
    <span className={`provenance-term ${className}`.trim()}>
      <span
        aria-describedby={descriptionId}
        className="provenance-term-label"
        tabIndex={0}
        title={description}
      >
        {visibleLabel}
      </span>
      <span className="visually-hidden" id={descriptionId}>
        {description}
      </span>
    </span>
  );
}
