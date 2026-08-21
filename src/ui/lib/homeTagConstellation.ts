import librarySearchArtifact from "../../../data/generated/library-search.json";

import { rawTypesForKind } from "./informationArchitecture";

export type HomeLibraryDiscovery = {
  count: number;
  /** The practitioner question this collection answers. */
  question: string;
  description: string;
  id: string;
  label: string;
  patch: { kind?: string; tags?: string[] };
};

const objectTypeCounts = librarySearchArtifact.library_search.browse_counts
  .object_types as Record<string, number>;

function countKind(kind: string) {
  return rawTypesForKind(kind).reduce(
    (total, rawType) => total + Number(objectTypeCounts[rawType] || 0),
    0,
  );
}

/**
 * Ordered by the way a practitioner actually works — what applies, what it
 * requires, how it is checked, how it is built, what it defends against — not
 * by how many records each one happens to hold. The count is supporting
 * metadata on the card, never its headline: this is a place to find the thing
 * you came for, not a report on how much data the site contains.
 *
 * Every entry filters the Library by one published record kind. Mixing record
 * kinds with technology tags in one row put two unrelated taxonomies side by
 * side and made the group impossible to reason about.
 */
const DISCOVERY_CANDIDATES: readonly Omit<HomeLibraryDiscovery, "count">[] = [
  {
    description: "Controls, enhancements, and the requirements that cite them.",
    id: "requirements",
    label: "Controls & requirements",
    patch: { kind: "requirements" },
    question: "What you have to do",
  },
  {
    description: "Baselines and profiles that set the starting control set.",
    id: "baselines-profiles",
    label: "Baselines & profiles",
    patch: { kind: "baselines-profiles" },
    question: "What applies to your system",
  },
  {
    description: "Assessment procedures, RMF steps, and program policy.",
    id: "process-methods",
    label: "Assessment & process",
    patch: { kind: "process-methods" },
    question: "How it gets checked",
  },
  {
    description: "STIG rules and benchmark checks for real configurations.",
    id: "technical-rules",
    label: "Configuration rules",
    patch: { kind: "technical-rules" },
    question: "How systems get hardened",
  },
  {
    description: "ATT&CK techniques and the D3FEND countermeasures that answer them.",
    id: "threats-defenses",
    label: "Threats & defenses",
    patch: { kind: "threats-defenses" },
    question: "What it defends against",
  },
];

export const HOME_LIBRARY_DISCOVERY = Object.freeze(
  DISCOVERY_CANDIDATES.map((candidate) =>
    Object.freeze({
      ...candidate,
      count: candidate.patch.kind
        ? countKind(candidate.patch.kind)
        : 0,
    }),
  ).filter((candidate) => candidate.count > 0),
) as readonly HomeLibraryDiscovery[];
