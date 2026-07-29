import templateRegistry from "../../../data/template-registry.json";
import workflowRegistry from "../../../data/compliance-workflows.json";

const TEMPLATE_NAMES = new Set(
  templateRegistry.templates.map((template) => template.name),
);
const WORKFLOW_IDS = new Set(
  workflowRegistry.workflows.map((workflow) => workflow.workflow_id),
);
const FORMAT_BY_TEMPLATE = new Map(
  templateRegistry.templates.map((template) => [
    template.name,
    new Set(template.supported_formats),
  ]),
);
export const BUILD_SOURCE_CONTEXTS = Object.freeze([
  {
    id: "nist-800-53",
    baselineCatalogId: "nist-800-53b",
  },
  {
    id: "fedramp-rev5",
    baselineCatalogId: "fedramp-rev5",
  },
]);

export const BUILD_LANES = Object.freeze([
  {
    id: "tasks",
    label: "Tasks",
    description: "Start from a defined work activity and review its source-backed inputs.",
  },
  {
    id: "documents",
    label: "Starter documents",
    description: "Choose a starter file directly, then provide only its required inputs.",
  },
  {
    id: "resources",
    label: "Resources",
    description: "Find external tools, templates, datasets, training, and communities.",
  },
] as const);

const SOURCE_CONTEXT_IDS = new Set(
  BUILD_SOURCE_CONTEXTS.map((context) => context.id),
);

export function isKnownBuildTask(value: string): boolean {
  return WORKFLOW_IDS.has(value);
}

export function isKnownBuildDocument(value: string): boolean {
  return TEMPLATE_NAMES.has(value);
}

export function isValidBuildFormat(
  documentName: string,
  format: string,
): boolean {
  if (!format) return true;
  return FORMAT_BY_TEMPLATE.get(documentName)?.has(format) ?? false;
}

export function isValidBuildSourceContext(value: string): boolean {
  return !value || SOURCE_CONTEXT_IDS.has(value);
}

export function baselineCatalogForBuildContext(value: string): string {
  return (
    BUILD_SOURCE_CONTEXTS.find((context) => context.id === value)
      ?.baselineCatalogId || ""
  );
}
