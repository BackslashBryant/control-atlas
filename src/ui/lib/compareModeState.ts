import type { CompareCrosswalk, ViewState } from "./viewState";

export type CompareModeId =
  | "frameworks"
  | "item-mapping"
  | "stig-chain"
  | "threat-chain"
  | "baseline-compare";

type CompareState = Extract<ViewState, { view: "matrix" }>;

export const COMPARE_MODES = Object.freeze([
  {
    id: "frameworks",
    label: "Catalog to catalog",
    crosswalk: "relationships",
    required: ["source", "target", "mappingSource"],
  },
  {
    id: "item-mapping",
    label: "Item mappings",
    crosswalk: "relationships",
    required: ["source", "items", "mappingSource"],
  },
  {
    id: "stig-chain",
    label: "STIG / SRG chain",
    crosswalk: "stig-chain",
    required: ["chainItem"],
  },
  {
    id: "threat-chain",
    label: "Threat chain",
    crosswalk: "threat-chain",
    required: ["chainItem"],
  },
  {
    id: "baseline-compare",
    label: "Baseline comparison",
    crosswalk: "baseline-compare",
    required: ["baselineA", "baselineB"],
  },
] as const);

export function compareModeForState(state: CompareState) {
  return (
    COMPARE_MODES.find((mode) => mode.id === state.intent) ||
    COMPARE_MODES.find((mode) => mode.crosswalk === state.crosswalk) ||
    null
  );
}

export function activateCompareMode(modeId: CompareModeId): Partial<CompareState> {
  const mode = COMPARE_MODES.find((entry) => entry.id === modeId);
  if (!mode) return { crosswalk: "intent", intent: "", compareRun: "" };
  return {
    crosswalk: mode.crosswalk as CompareCrosswalk,
    intent: mode.id,
    source: "",
    target: "",
    items: "",
    mappingSource: "",
    chainCatalog: "",
    chainBenchmark: "",
    chainItem: "",
    baselineA: "",
    baselineB: "",
    compareRun: "",
  };
}

export function nextMissingCompareInput(
  state: CompareState,
  eligibleMappingSources?: readonly string[],
): string {
  const mode = compareModeForState(state);
  if (!mode) return "comparison type";
  for (const field of mode.required) {
    if (!state[field]) return field;
  }
  if (
    (mode.required as readonly string[]).includes("mappingSource") &&
    eligibleMappingSources &&
    !eligibleMappingSources.includes(state.mappingSource)
  ) {
    return "a valid published mapping source";
  }
  if (
    mode.id === "baseline-compare" &&
    state.baselineA === state.baselineB
  ) {
    return "a different second baseline";
  }
  return "";
}

export function compareConfigurationReady(
  state: CompareState,
  eligibleMappingSources?: readonly string[],
): boolean {
  return nextMissingCompareInput(state, eligibleMappingSources) === "";
}
