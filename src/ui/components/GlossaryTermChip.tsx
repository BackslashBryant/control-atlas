import type { ReactNode } from "react";
import { useId } from "react";

import { getGlossaryEntry } from "../lib/glossarySearch.mjs";

export function GlossaryTermChip(props: { termId: string; children: ReactNode }) {
  const entry = getGlossaryEntry(props.termId);
  const descriptionId = useId();

  if (!entry) {
    return <>{props.children}</>;
  }

  return (
    <span className="provenance-term glossary-term-chip">
      <span
        aria-describedby={descriptionId}
        className="provenance-term-label"
        tabIndex={0}
        title={entry.definition}
      >
        {props.children}
      </span>
      <span className="visually-hidden" id={descriptionId}>
        {entry.definition}
      </span>
    </span>
  );
}
