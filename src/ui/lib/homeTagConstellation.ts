import librarySearchArtifact from "../../../data/generated/library-search.json";

import { rawTypesForKind } from "./informationArchitecture";

export type HomeLibraryDiscovery = {
  count: number;
  description: string;
  id: string;
  label: string;
  patch: { kind?: string; tags?: string[] };
};

const tagCounts = librarySearchArtifact.library_search.browse_counts.tags as Record<string, number>;
const objectTypeCounts = librarySearchArtifact.library_search.browse_counts.object_types as Record<string, number>;

function countKind(kind: string) {
  return rawTypesForKind(kind).reduce((total, rawType) => total + Number(objectTypeCounts[rawType] || 0), 0);
}

const DISCOVERY_CANDIDATES: readonly Omit<HomeLibraryDiscovery, "count">[] = [
  {
    description: "STIG rules and benchmark checks.",
    id: "technical-rules",
    label: "Technical rules",
    patch: { kind: "technical-rules" },
  },
  {
    description: "Controls, enhancements, and published requirements.",
    id: "requirements",
    label: "Requirements",
    patch: { kind: "requirements" },
  },
  {
    description: "Assessment procedures, RMF steps, programs, and policy.",
    id: "process-methods",
    label: "Process & methods",
    patch: { kind: "process-methods" },
  },
  {
    description: "ATT&CK techniques and D3FEND countermeasures.",
    id: "threats-defenses",
    label: "Threats & defenses",
    patch: { kind: "threats-defenses" },
  },
  {
    description: "Records tagged for mobile systems and threats.",
    id: "asset.mobile",
    label: "Mobile",
    patch: { tags: ["asset.mobile"] },
  },
  {
    description: "Records tagged for operating-system technology.",
    id: "technology.operating-system",
    label: "Operating system",
    patch: { tags: ["technology.operating-system"] },
  },
];

export const HOME_LIBRARY_DISCOVERY = Object.freeze(
  DISCOVERY_CANDIDATES.map((candidate) => Object.freeze({
    ...candidate,
    count: candidate.patch.kind
      ? countKind(candidate.patch.kind)
      : Number(tagCounts[candidate.patch.tags?.[0] || ""] || 0),
  })).filter((candidate) => candidate.count > 0),
) as readonly HomeLibraryDiscovery[];
