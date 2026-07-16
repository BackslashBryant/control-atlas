import type {
  RmfLifecycleStep,
  SourceHierarchyTier,
  SourceManifestRecord,
  SourceNoviceQuestion,
} from "./sourceManifest.ts";

export type SourceViewId = "novice" | "purpose" | "rmf";

export type SourceViewGroup = {
  id: string;
  label: string;
  description: string;
  graphRole: string;
};

export type SourceViewDefinition = {
  id: SourceViewId;
  label: string;
  summary: string;
  groups: SourceViewGroup[];
};

const PURPOSE_GROUPS: SourceViewGroup[] = [
  { id: "authority", label: "Rules", description: "Laws, regulations, and binding policy that explain why requirements apply.", graphRole: "authority" },
  { id: "governance-risk-framework", label: "Frameworks", description: "Risk and governance models that organize the work.", graphRole: "governance-framework" },
  { id: "control-catalog-requirement-set", label: "Controls", description: "Control catalogs and requirement sets that state what must be done.", graphRole: "control-catalog" },
  { id: "baseline-overlay-program-profile", label: "Baselines", description: "Selected requirement sets, overlays, and program profiles that narrow what applies.", graphRole: "baseline-overlay-profile" },
  { id: "implementation-configuration-standard", label: "Implementation", description: "Configuration standards and technical guidance for putting requirements into practice.", graphRole: "implementation-standard" },
  { id: "assessment-scoping-procedure", label: "Assessment", description: "Scoping guides, procedures, and artifacts used to test implementation.", graphRole: "assessment-scoping" },
  { id: "control-mapping-crosswalk", label: "Mappings", description: "Published crosswalks that connect equivalent or related requirements.", graphRole: "mapping-crosswalk" },
  { id: "threat-defensive-mapping", label: "Threat / Defense", description: "Threat behavior and defensive technique sources that add operational context.", graphRole: "threat-defense" },
  { id: "supporting-reference", label: "Supporting Sources", description: "Official references and tools that add context without defining the main hierarchy.", graphRole: "supporting-reference" },
];

const NOVICE_GROUPS: SourceViewGroup[] = [
  { id: "why-apply", label: "Why does this apply?", description: "Start with the rules and frameworks that create the obligation or risk context.", graphRole: "authority" },
  { id: "must-do", label: "What must I do?", description: "Open the controls and requirement sets that state the expected outcome.", graphRole: "control-catalog" },
  { id: "requirements-apply", label: "Which requirements apply?", description: "Use baselines, overlays, and program profiles to narrow the full catalog.", graphRole: "baseline-overlay-profile" },
  { id: "implement", label: "How do I implement it?", description: "Use configuration guidance plus threat and defense context to put requirements into practice.", graphRole: "implementation-standard" },
  { id: "test", label: "How do I test it?", description: "Use assessment and scoping procedures to check whether controls work as intended.", graphRole: "assessment-scoping" },
  { id: "map-elsewhere", label: "How does it map elsewhere?", description: "Use official mappings and crosswalks to trace the same work across frameworks.", graphRole: "mapping-crosswalk" },
];

const RMF_GROUPS: SourceViewGroup[] = [
  { id: "prepare", label: "Prepare", description: "Establish risk context, roles, priorities, and the sources that govern the work.", graphRole: "authority" },
  { id: "categorize", label: "Categorize", description: "Determine the system and information impact that drives later control selection.", graphRole: "governance-framework" },
  { id: "select", label: "Select", description: "Choose and tailor the controls and baselines needed to manage risk.", graphRole: "baseline-overlay-profile" },
  { id: "implement", label: "Implement", description: "Put selected controls in place and document how they work.", graphRole: "implementation-standard" },
  { id: "assess", label: "Assess", description: "Test whether controls are implemented correctly and operating as intended.", graphRole: "assessment-scoping" },
  { id: "authorize", label: "Authorize", description: "Assemble the traceable evidence needed for a risk-based authorization decision.", graphRole: "mapping-crosswalk" },
  { id: "monitor", label: "Monitor", description: "Track control performance and changing risk after authorization.", graphRole: "threat-defense" },
];

export const SOURCE_VIEW_DEFINITIONS: Record<SourceViewId, SourceViewDefinition> = {
  novice: {
    id: "novice",
    label: "Novice questions",
    summary: "Start with the question you are trying to answer. Each path opens the same trusted source model in a more useful order.",
    groups: NOVICE_GROUPS,
  },
  purpose: {
    id: "purpose",
    label: "Purpose",
    summary: "Browse the canonical hierarchy from rules and frameworks through controls, baselines, implementation, assessment, mappings, threat and defense, and supporting sources.",
    groups: PURPOSE_GROUPS,
  },
  rmf: {
    id: "rmf",
    label: "RMF lifecycle",
    summary: "Follow sources through the Risk Management Framework lifecycle from Prepare through Monitor.",
    groups: RMF_GROUPS,
  },
};

const DEFAULT_VIEW_MEMBERSHIPS: Record<
  SourceHierarchyTier,
  { noviceQuestions: SourceNoviceQuestion[]; rmfLifecycle: RmfLifecycleStep[] }
> = {
  authority: { noviceQuestions: ["why-apply"], rmfLifecycle: ["prepare", "categorize", "authorize"] },
  "governance-risk-framework": { noviceQuestions: ["why-apply"], rmfLifecycle: ["prepare", "categorize", "monitor"] },
  "control-catalog-requirement-set": { noviceQuestions: ["must-do"], rmfLifecycle: ["select", "implement"] },
  "baseline-overlay-program-profile": { noviceQuestions: ["requirements-apply"], rmfLifecycle: ["categorize", "select"] },
  "implementation-configuration-standard": { noviceQuestions: ["implement"], rmfLifecycle: ["implement", "monitor"] },
  "assessment-scoping-procedure": { noviceQuestions: ["test"], rmfLifecycle: ["assess", "authorize", "monitor"] },
  "control-mapping-crosswalk": { noviceQuestions: ["map-elsewhere"], rmfLifecycle: ["select", "assess", "authorize"] },
  "threat-defensive-mapping": { noviceQuestions: ["implement"], rmfLifecycle: ["prepare", "select", "monitor"] },
  "supporting-reference": { noviceQuestions: ["why-apply"], rmfLifecycle: ["prepare"] },
};

export function defaultSourceViewMemberships(
  purpose: SourceHierarchyTier,
): { noviceQuestions: SourceNoviceQuestion[]; rmfLifecycle: RmfLifecycleStep[] } {
  const defaults = DEFAULT_VIEW_MEMBERSHIPS[purpose];
  return {
    noviceQuestions: [...defaults.noviceQuestions],
    rmfLifecycle: [...defaults.rmfLifecycle],
  };
}

export function sourceViewGroupsFor(
  source: SourceManifestRecord,
  viewId: SourceViewId,
): string[] {
  if (viewId === "purpose") return [source.hierarchyTier];
  if (viewId === "rmf") return source.rmfLifecycle;
  return source.noviceQuestions;
}

export function normalizeSourceViewId(value?: string): SourceViewId {
  if (value === "purpose" || value === "rmf") return value;
  return "novice";
}

export function sourceViewGroup(
  viewId: SourceViewId,
  groupId: string,
): SourceViewGroup | undefined {
  return SOURCE_VIEW_DEFINITIONS[viewId].groups.find((group) => group.id === groupId);
}
