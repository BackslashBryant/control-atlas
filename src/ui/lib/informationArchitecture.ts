export const LIBRARY_KINDS = Object.freeze([
  { id: "requirements", label: "Requirements", rawTypes: ["control", "control_enhancement", "requirement", "srg_requirement", "practice", "zt_activity", "zt_capability", "zt_tenet"] },
  { id: "technical-rules", label: "Technical rules", rawTypes: ["stig_rule", "benchmark"] },
  { id: "threats-defenses", label: "Threats & defenses", rawTypes: ["attack_technique", "tactic", "defend_countermeasure"] },
  { id: "baselines-profiles", label: "Baselines & profiles", rawTypes: ["baseline", "catalog", "impact_category", "zt_document", "zt_overlay_catalog", "zt_overlay_section", "zt_pillar"] },
  { id: "process-methods", label: "Process & methods", rawTypes: ["rmf_step", "assessment_procedure", "task", "program", "policy"] },
  { id: "tools-communities", label: "Tools & communities", rawTypes: ["resource", "portal", "community_forum", "tool", "template", "training"] },
] as const);

export type LibraryKindId = (typeof LIBRARY_KINDS)[number]["id"];

const KIND_BY_RAW_TYPE = new Map(
  LIBRARY_KINDS.flatMap((kind) => kind.rawTypes.map((rawType) => [rawType, kind.id] as const)),
);

export const USER_FILTER_EXCLUDED_TYPES = new Set([
  "category",
  "family",
  "function",
  "group",
  "limb",
  "trunk",
]);

export function libraryKindForRawType(rawType: string): LibraryKindId | "" {
  return KIND_BY_RAW_TYPE.get(rawType) || "";
}

export function rawTypesForKind(kindId: string): readonly string[] {
  return LIBRARY_KINDS.find((kind) => kind.id === kindId)?.rawTypes || [];
}

export function libraryKindLabel(kindId: string): string {
  return LIBRARY_KINDS.find((kind) => kind.id === kindId)?.label || "";
}
