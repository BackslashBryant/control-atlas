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
const FRAMEWORK_IDS = new Set(["nist-800-53", "fedramp-rev5"]);

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

export function isValidBuildFramework(value: string): boolean {
  return !value || FRAMEWORK_IDS.has(value);
}
