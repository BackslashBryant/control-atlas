import * as Accordion from "@radix-ui/react-accordion";
import {
  IconCompass,
  IconExternalLink,
  IconFileDescription,
  IconInfoCircle,
  IconShieldCheck,
} from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  buildTemplateDocument,
  generateTemplate,
  templateFilename,
} from "../../app/template-engine.mjs";
import {
  CatalogFilterBar,
  QuickIntentCard,
} from "../components/QuickIntentCard";
import {
  filterByCategoryAndQuery,
  groupItemsByCategory,
  TEMPLATE_CATEGORIES,
} from "../lib/catalogGroups.mjs";

import { ContextualCommonsModule } from "../components/ContextualCommonsModule";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";
import {
  Badge,
  DisclosurePanel,
  PageHeader,
  SelectField,
  SummaryCard,
  downloadBlobFile,
  downloadTextFile,
  scrollElementBelowHeader,
} from "../lib/pagePrimitives";
import { Panel, Button, ButtonLink } from "../components/lsm";

type TemplateRecord = {
  template_id?: string;
  name: string;
  display_name: string;
  description: string;
  artifact_type?: string;
  supported_formats: string[];
  office_formats?: string[];
  input_options: string[];
  source_refs?: string[];
  official_alternative?: { label: string; url: string };
  official_artifact_ids?: string[];
  official_resource_ids?: string[];
  workflow_ids?: string[];
  related_tool_ids?: string[];
  compatibility_level?: string;
  limitations?: string[];
  compatibility?: {
    classification?: string;
    claim?: string;
    limitations?: string;
  };
};

type OfficialArtifact = {
  artifact_id: string;
  title: string;
  artifact_family?: string;
  publisher?: string;
  classification?: string;
  status?: string;
  version?: string;
  retrieved_on?: string;
  landing_url?: string;
  download_url?: string;
  formats?: string[];
  summary?: string;
  provenance_note?: string;
  limitations?: string[];
};

type FedrampRule = {
  rule_id: string;
  process_name?: string;
  name?: string;
  force?: string;
  applicability?: string;
};

type FedrampTransitionMapping = {
  legacy_artifact_id: string;
  relationship: string;
  path_scope: string[];
  current_artifact_ids: string[];
  rule_ids: string[];
  summary: string;
  action: string;
};

type FedrampLegacyAsset = {
  title: string;
  format: string;
  url: string;
};

type FedrampTransitionIndex = {
  retrieved_on?: string;
  source?: {
    version?: string;
    last_updated?: string;
  };
  interpretation_notice?: string;
  official_links?: Record<string, string>;
  milestones?: Array<{ date: string; label: string; meaning: string }>;
  process_statuses?: Array<{
    process_id: string;
    name: string;
    status: string;
  }>;
  current_artifact_rules?: Record<string, string[]>;
  legacy_mappings?: FedrampTransitionMapping[];
  resolved_rules?: FedrampRule[];
  legacy_assets?: FedrampLegacyAsset[];
};

type WorkflowStep = {
  order: number;
  title: string;
  action: string;
  artifact_ids?: string[];
  tool_ids?: string[];
  completion_signal?: string;
};

type ComplianceWorkflow = {
  workflow_id: string;
  title: string;
  summary: string;
  audiences?: string[];
  outcomes?: string[];
  artifact_ids?: string[];
  tool_ids?: string[];
  steps?: WorkflowStep[];
  readiness_checks?: string[];
  boundary_note?: string;
  companion_template_ids?: string[];
};

type ComplianceTool = {
  tool_id: string;
  name: string;
  maintainer?: string;
  classification?: string;
  status?: string;
  version_or_release?: string;
  repository_url?: string;
  project_url?: string;
  license?: string;
  purpose?: string;
  supported_inputs?: string[];
  supported_outputs?: string[];
  artifact_families?: string[];
  access_requirements?: string[];
  limitations?: string[];
};

const COMPATIBILITY_LABELS: Record<string, string> = {
  official_current: "Official current",
  official_legacy: "Official legacy",
  official_guidance: "Official guidance",
  schema_aligned: "Schema-aligned",
  community_reference: "Community reference",
  unverified: "Unverified interoperability",
};

function compatibilityTone(value?: string) {
  const normalized = normalizedFamily(value);
  if (normalized === "official_current" || normalized === "officially_specified") {
    return "success" as const;
  }
  if (normalized === "official_legacy" || normalized.includes("unverified")) {
    return "warning" as const;
  }
  if (
    normalized === "official_guidance" ||
    normalized === "schema_aligned" ||
    normalized.includes("schema_aligned")
  ) {
    return "info" as const;
  }
  return "default" as const;
}

function compatibilityLabel(value?: string) {
  if (value?.toLowerCase() === "control atlas companion") {
    return "Starter document";
  }
  if (value && /[A-Z ]/.test(value)) return value;
  return value
    ? COMPATIBILITY_LABELS[value] || value.replaceAll("_", " ")
    : "Starter document";
}

function normalizedFamily(value?: string) {
  return (value || "").toLowerCase().replaceAll(/[^a-z0-9]+/g, "_");
}

function ruleLabel(rule: FedrampRule) {
  return `${rule.rule_id}${rule.name ? ` — ${rule.name}` : ""}`;
}

function OfficialArtifactCard(props: {
  artifact: OfficialArtifact;
  fedrampTransition?: FedrampTransitionIndex;
}) {
  const { artifact, fedrampTransition } = props;
  const primaryUrl = artifact.download_url || artifact.landing_url;
  const transition = fedrampTransition?.legacy_mappings?.find(
    (entry) => entry.legacy_artifact_id === artifact.artifact_id,
  );
  const currentRuleIds =
    fedrampTransition?.current_artifact_rules?.[artifact.artifact_id] || [];
  const applicableRuleIds = transition?.rule_ids || currentRuleIds;
  const resolvedRules = new Map(
    (fedrampTransition?.resolved_rules || []).map((rule) => [rule.rule_id, rule]),
  );
  const isLegacyArchive =
    artifact.artifact_id === "fedramp-legacy-assets-2026-transition";
  return (
    <article className="nexus-card">
      <div className="nexus-card-heading">
        <div>
          <p className="result-meta">{artifact.publisher || "Official source"}</p>
          <h3>{artifact.title}</h3>
        </div>
        <Badge tone={compatibilityTone(artifact.classification)}>
          {compatibilityLabel(artifact.classification)}
        </Badge>
      </div>
      {artifact.summary ? <p>{artifact.summary}</p> : null}
      <p className="support-meta">
        {[
          artifact.status,
          artifact.version,
          artifact.formats?.join(", "),
          artifact.retrieved_on
            ? `Checked ${artifact.retrieved_on}`
            : undefined,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {artifact.provenance_note ? (
        <details className="nexus-details">
          <summary>Source and use notes</summary>
          <p>{artifact.provenance_note}</p>
        </details>
      ) : null}
      {artifact.limitations?.length ? (
        <p className="nexus-limitation">
          <IconInfoCircle aria-hidden="true" size={16} stroke={1.8} />
          {artifact.limitations[0]}
        </p>
      ) : null}
      {transition ? (
        <div className="fedramp-transition-block">
          <p className="eyebrow">Legacy → current</p>
          <p>{transition.summary}</p>
          <dl className="nexus-facts">
            <div>
              <dt>Paths</dt>
              <dd>{transition.path_scope.join(" + ")}</dd>
            </div>
            <div>
              <dt>Next</dt>
              <dd>{transition.action}</dd>
            </div>
          </dl>
          {applicableRuleIds.length ? (
            <details className="nexus-details">
              <summary>{applicableRuleIds.length} governing rule{applicableRuleIds.length === 1 ? "" : "s"}</summary>
              <ul className="nexus-list compact-list">
                {applicableRuleIds.map((ruleId) => (
                  <li key={ruleId}>
                    {resolvedRules.has(ruleId)
                      ? ruleLabel(resolvedRules.get(ruleId) as FedrampRule)
                      : ruleId}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : currentRuleIds.length ? (
        <details className="nexus-details fedramp-rule-list">
          <summary>Governed by {currentRuleIds.length} current rule{currentRuleIds.length === 1 ? "" : "s"}</summary>
          <ul className="nexus-list compact-list">
            {currentRuleIds.map((ruleId) => (
              <li key={ruleId}>
                {resolvedRules.has(ruleId)
                  ? ruleLabel(resolvedRules.get(ruleId) as FedrampRule)
                  : ruleId}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {isLegacyArchive && fedrampTransition?.legacy_assets?.length ? (
        <details className="nexus-details fedramp-legacy-index">
          <summary>
            Browse all {fedrampTransition.legacy_assets.length} official legacy files
          </summary>
          <ul className="nexus-list compact-list">
            {fedrampTransition.legacy_assets.map((asset) => (
              <li key={asset.url}>
                <a href={asset.url} rel="noopener noreferrer" target="_blank">
                  {asset.title} ({asset.format.toUpperCase()})
                </a>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      <div className="card-actions">
        {primaryUrl ? (
          <ButtonLink
            variant="secondary"
            href={primaryUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            {artifact.download_url ? "Open official file" : "Open official source"}
            <IconExternalLink aria-hidden="true" size={15} stroke={1.8} />
          </ButtonLink>
        ) : null}
        {artifact.download_url && artifact.landing_url ? (
          <a
            className="text-link"
            href={artifact.landing_url}
            rel="noopener noreferrer"
            target="_blank"
          >
            Publisher page
          </a>
        ) : null}
      </div>
    </article>
  );
}

function FedrampCurrentTruthPanel(props: {
  transition?: FedrampTransitionIndex;
}) {
  const { transition } = props;
  if (!transition?.source) return null;
  const stableProcesses = (transition.process_statuses || []).filter(
    (process) => process.status === "stable",
  );
  const placeholders = (transition.process_statuses || []).filter(
    (process) => process.status === "placeholder",
  );
  const links = transition.official_links || {};
  const upcomingMilestones = (transition.milestones || []).filter(
    (milestone) => milestone.date >= "2026-07-16",
  );
  return (
    <aside aria-labelledby="fedramp-current-heading" className="fedramp-truth-panel">
      <div className="fedramp-truth-heading">
        <div>
          <p className="eyebrow">FedRAMP current rules</p>
          <h3 id="fedramp-current-heading">
            Consolidated Rules {transition.source.version}
          </h3>
          <p>
            Updated {transition.source.last_updated}. The machine-readable rules
            and schemas govern; legacy files remain available for migration and
            comparison.
          </p>
        </div>
        <Badge tone="success">Official current</Badge>
      </div>
      <div className="fedramp-truth-grid">
        <div>
          <strong>{stableProcesses.length} stable process documents</strong>
          <span>
            Only {placeholders.length || "no"} process is marked placeholder
            {placeholders.length
              ? `: ${placeholders.map((process) => `${process.process_id} — ${process.name}`).join(", ")}.`
              : "."}
          </span>
        </div>
        <div>
          <strong>20x and Rev5 are both mapped</strong>
          <span>
            Applicability and effective dates are rule-specific. Do not treat a
            legacy workbook as the current path for either profile.
          </span>
        </div>
      </div>
      {upcomingMilestones.length ? (
        <details className="nexus-details">
          <summary>Transition dates</summary>
          <ol className="fedramp-milestones">
            {upcomingMilestones.map((milestone) => (
              <li key={milestone.date}>
                <time dateTime={milestone.date}>{milestone.date}</time>
                <span>
                  <strong>{milestone.label}</strong> — {milestone.meaning}
                </span>
              </li>
            ))}
          </ol>
        </details>
      ) : null}
      <div className="card-actions fedramp-source-links">
        {[
          ["Current rules", links.current_rules],
          ["Machine-readable source", links.machine_readable_source],
          ["Schema index", links.schema_index],
          ["Changelog", links.changelog],
          ["Timeline", links.timeline],
          ["Legacy library", links.legacy_reference],
        ].map(([label, url]) =>
          url ? (
            <a className="text-link" href={url} key={label} rel="noopener noreferrer" target="_blank">
              {label}
              <IconExternalLink aria-hidden="true" size={14} stroke={1.8} />
            </a>
          ) : null,
        )}
      </div>
      {transition.interpretation_notice ? (
        <p className="support-meta">{transition.interpretation_notice}</p>
      ) : null}
    </aside>
  );
}

function ToolCard(props: { tool: ComplianceTool }) {
  const { tool } = props;
  const primaryUrl = tool.project_url || tool.repository_url;
  return (
    <article className="nexus-card">
      <div className="nexus-card-heading">
        <div>
          <p className="result-meta">{tool.maintainer || "Tool"}</p>
          <h3>{tool.name}</h3>
        </div>
        {tool.classification ? (
          <Badge tone={compatibilityTone(tool.classification)}>
            {compatibilityLabel(tool.classification)}
          </Badge>
        ) : null}
      </div>
      {tool.purpose ? <p>{tool.purpose}</p> : null}
      <p className="support-meta">
        {[tool.status, tool.version_or_release, tool.license]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {tool.supported_inputs?.length || tool.supported_outputs?.length ? (
        <dl className="nexus-facts">
          {tool.supported_inputs?.length ? (
            <div>
              <dt>Accepts</dt>
              <dd>{tool.supported_inputs.join(", ")}</dd>
            </div>
          ) : null}
          {tool.supported_outputs?.length ? (
            <div>
              <dt>Produces</dt>
              <dd>{tool.supported_outputs.join(", ")}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      {tool.access_requirements?.length ? (
        <p className="nexus-limitation">
          <IconInfoCircle aria-hidden="true" size={16} stroke={1.8} />
          {tool.access_requirements[0]}
        </p>
      ) : null}
      {tool.limitations?.length ? (
        <details className="nexus-details">
          <summary>Compatibility limits</summary>
          <ul className="nexus-list">
            {tool.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </details>
      ) : null}
      {primaryUrl ? (
        <div className="card-actions">
          <ButtonLink
            variant="secondary"
            href={primaryUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Open tool page
            <IconExternalLink aria-hidden="true" size={15} stroke={1.8} />
          </ButtonLink>
          {tool.project_url &&
          tool.repository_url &&
          tool.project_url !== tool.repository_url ? (
            <a
              className="text-link"
              href={tool.repository_url}
              rel="noopener noreferrer"
              target="_blank"
            >
              Source repository
            </a>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

const FORMAT_LABELS: Record<string, string> = {
  markdown: "Markdown",
  csv: "CSV",
  json: "JSON",
  yaml: "YAML",
  xlsx: "Excel (.xlsx)",
  docx: "Word (.docx)",
};

const INPUT_LABELS: Record<string, string> = {
  framework: "Framework context",
  baseline: "Baseline selection",
  control_family: "Control family filter",
  selected_controls: "Specific controls",
  selected_stigs: "STIG references",
  environment_archetype: "Environment type",
};

const FORMAT_HELP: Record<string, string> = {
  markdown: "Readable document — open in any editor or paste into a report.",
  csv: "Spreadsheet-ready data — import into Excel or Google Sheets, one row per control.",
  json: "Machine-readable data — for scripts, pipelines, or GRC tooling.",
  yaml: "Machine-readable and human-friendly data — structured, config-style.",
  xlsx: "Excel workbook — opens directly in Excel, one sheet per table.",
  docx: "Word document — opens directly in Word with headings and tables.",
};

const BASELINE_LABELS: Record<string, string> = {
  LOW: "Low",
  MODERATE: "Moderate",
  HIGH: "High",
  PRIVACY: "Privacy",
  "LI-SAAS": "LI-SaaS",
};

export function TemplatesPage(props: {
  bundle: RuntimeBundle;
  state: Extract<ViewState, { view: "templates" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  const { bundle, state, onNavigate } = props;
  const generationRef = useRef<HTMLElement | null>(null);
  const generateButtonRef = useRef<HTMLButtonElement | null>(null);
  const workflowDetailRef = useRef<HTMLElement | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [queryFilter, setQueryFilter] = useState("");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [showAllOfficialResources, setShowAllOfficialResources] =
    useState(false);
  const [showCompleteOfficialCatalog, setShowCompleteOfficialCatalog] =
    useState(false);
  const [showAllTools, setShowAllTools] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const [generationTone, setGenerationTone] = useState<"trust" | "warning">(
    "trust",
  );
  const templates = (bundle.templateRegistry.templates || []) as TemplateRecord[];
  const officialArtifacts = (bundle.officialArtifactRegistry?.artifacts ||
    []) as OfficialArtifact[];
  const workflows = (bundle.complianceWorkflowRegistry?.workflows ||
    []) as ComplianceWorkflow[];
  const complianceTools = (bundle.complianceToolRegistry?.tools ||
    []) as ComplianceTool[];
  const fedrampTransition =
    bundle.fedrampTransitionIndex as FedrampTransitionIndex | undefined;
  const selectedWorkflow =
    workflows.find(
      (workflow) => workflow.workflow_id === selectedWorkflowId,
    ) || null;
  const workflowArtifacts = selectedWorkflow
    ? officialArtifacts.filter((artifact) =>
        selectedWorkflow.artifact_ids?.includes(artifact.artifact_id),
      )
    : officialArtifacts;
  const workflowTools = selectedWorkflow
    ? complianceTools.filter((tool) =>
        selectedWorkflow.tool_ids?.includes(tool.tool_id),
      )
    : complianceTools;
  const officialArtifactPool = showCompleteOfficialCatalog
    ? officialArtifacts
    : workflowArtifacts;
  const visibleOfficialArtifacts = showAllOfficialResources
    ? officialArtifactPool
    : officialArtifactPool.slice(0, 8);
  const visibleTools = showAllTools ? workflowTools : workflowTools.slice(0, 8);
  const workflowReferenceIds = new Set([
    ...(selectedWorkflow?.artifact_ids || []),
    ...(selectedWorkflow?.tool_ids || []),
  ]);
  // A workflow names its own companions in `companion_template_ids`. Trust
  // that first: matching on shared official resources instead returned nine
  // loosely-related documents for "Create or update a POA&M" — none of them
  // the POA&M — which is how a stated intent turned into a search problem.
  const declaredCompanions = selectedWorkflow
    ? templates.filter((template) =>
        (selectedWorkflow.companion_template_ids || []).includes(
          template.template_id,
        ),
      )
    : [];
  const relatedByResource = selectedWorkflow
    ? templates.filter((template) =>
        template.official_resource_ids?.some((id) =>
          workflowReferenceIds.has(id),
        ),
      )
    : templates;
  const companionPool = !selectedWorkflow
    ? templates
    : declaredCompanions.length > 0
      ? declaredCompanions
      : relatedByResource.length > 0
        ? relatedByResource
        : templates;
  // Searching and filtering a set you can already see is busywork.
  const showCompanionFilters = companionPool.length > 4;
  // Anything the task does not declare stays reachable behind one disclosure.
  // Two templates (Hardware/Software Baseline) are declared by no workflow at
  // all, so without this they would be unreachable whenever a task is picked.
  const otherTemplates = selectedWorkflow
    ? templates.filter(
        (template) =>
          !companionPool.some((inPool) => inPool.name === template.name),
      )
    : [];
  const filteredTemplates = useMemo(
    () =>
      filterByCategoryAndQuery(
        companionPool,
        TEMPLATE_CATEGORIES,
        (template: any) => template.name,
        (template: any) =>
          `${template.display_name} ${template.description} ${template.name}`,
        { category: categoryFilter, query: queryFilter },
      ),
    [categoryFilter, queryFilter, companionPool],
  );
  const groupedTemplates = useMemo(
    () =>
      groupItemsByCategory(
        filteredTemplates,
        TEMPLATE_CATEGORIES,
        (template: any) => template.name,
      ),
    [filteredTemplates],
  );
  const selectedTemplate =
    templates.find((template) => template.name === state.templateType) || null;
  const selectedTemplateArtifactIds = selectedTemplate
    ? [
        ...(selectedTemplate.official_artifact_ids || []),
        ...(selectedTemplate.official_resource_ids || []),
      ]
    : [];
  const selectedTemplateArtifacts = selectedTemplate
    ? officialArtifacts.filter((artifact) => {
        if (selectedTemplateArtifactIds.includes(artifact.artifact_id)) {
          return true;
        }
        return (
          selectedTemplateArtifactIds.length === 0 &&
          normalizedFamily(artifact.artifact_family) ===
            normalizedFamily(selectedTemplate.artifact_type)
        );
      })
    : [];
  const selectedTemplateTools = selectedTemplate
    ? complianceTools.filter((tool) => {
        if (
          selectedTemplate.related_tool_ids?.includes(tool.tool_id) ||
          selectedTemplateArtifactIds.includes(tool.tool_id)
        ) {
          return true;
        }
        const family = normalizedFamily(selectedTemplate.artifact_type);
        return Boolean(
          family &&
            tool.artifact_families?.some(
              (toolFamily) => normalizedFamily(toolFamily) === family,
            ),
        );
      })
    : [];
  const catalogOptions = bundle.runtime
    .getCatalogs()
    .map((catalog: any) => ({ value: catalog.id, label: catalog.name }));
  const dataFormats = selectedTemplate?.supported_formats || ["markdown"];
  const officeFormats = selectedTemplate?.office_formats || [];
  // Data formats (string) + office formats (binary xlsx/docx) share one picker.
  const supportedFormats = [...dataFormats, ...officeFormats];
  const activeFormat = supportedFormats.includes(state.format || "")
    ? state.format || dataFormats[0]
    : dataFormats[0];

  const inputOptions = selectedTemplate?.input_options || [];
  const datasetNodes = (bundle.runtime.dataset?.nodes || []) as any[];
  const datasetSources = (bundle.runtime.dataset?.sources || []) as any[];
  const activeFramework = state.framework || "nist-800-53";

  // Baseline membership lives in a companion catalog (NIST 800-53B for the
  // 800-53 framework; FedRAMP carries its own baselines), so scope the options
  // there rather than to the framework catalog itself.
  const baselineCatalog =
    activeFramework === "fedramp-rev5" ? "fedramp-rev5" : "nist-800-53b";
  const baselineOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const node of datasetNodes) {
      if (node.node_type !== "baseline") continue;
      if (node.metadata?.catalog_id !== baselineCatalog) continue;
      const id = String(node.metadata?.item_id || "").toUpperCase();
      if (id && !seen.has(id)) {
        seen.set(id, BASELINE_LABELS[id] || node.metadata?.title || id);
      }
    }
    return [...seen.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([value, label]) => ({ value, label }));
  }, [datasetNodes, baselineCatalog]);

  // Default to the Moderate baseline when the framework offers one — the full
  // catalog is rarely what someone starting a plan wants. An empty
  // state.baseline means "not chosen yet"; the explicit all-controls choice is
  // stored as the "ALL" sentinel so it survives the default.
  const defaultBaseline = baselineOptions.some(
    (option) => option.value === "MODERATE",
  )
    ? "MODERATE"
    : "";
  const activeBaseline =
    state.baseline === "ALL" ? "" : state.baseline || defaultBaseline;

  const familyOptions = useMemo(() => {
    const families = new Set<string>();
    for (const node of datasetNodes) {
      if (node.node_type !== "control") continue;
      if (node.metadata?.catalog_id !== activeFramework) continue;
      const family = node.metadata?.family || node.metadata?.control_family;
      if (family) families.add(family);
    }
    return [...families]
      .sort((a, b) => a.localeCompare(b))
      .map((family) => ({ value: family, label: family }));
  }, [datasetNodes, activeFramework]);

  const primarySourceRef = selectedTemplate?.source_refs?.[0];
  const catalogSource = primarySourceRef
    ? datasetSources.find((source) => source.id === primarySourceRef)
    : null;

  // Static structure preview: call the real engine with no framework selected
  // (it falls back to a single placeholder control row) so the column layout
  // is authoritative without requiring the user to generate anything.
  const structurePreview = useMemo(() => {
    if (!selectedTemplate) return null;
    try {
      const { doc } = buildTemplateDocument(
        { templateType: selectedTemplate.name },
        bundle.runtime.dataset,
      );
      return doc.sections.filter(
        (section: any) => section.type === "table",
      ) as Array<{ heading: string; headers: string[] }>;
    } catch {
      return null;
    }
  }, [selectedTemplate?.name, bundle.runtime.dataset]);

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (generationRef.current) {
      scrollElementBelowHeader(
        generationRef.current,
        reducedMotion ? "auto" : "smooth",
      );
    }
    generateButtonRef.current?.focus();
  }, [selectedTemplate?.name]);

  async function createTemplate() {
    if (!selectedTemplate || generating) {
      return;
    }
    setGenerating(true);
    setGenerationStatus("");
    let downloadDispatched = false;
    const confirmDownload = (filename: string) => {
      downloadDispatched = true;
      setGenerationTone("trust");
      setGenerationStatus(
        `Download started for ${filename}. Check your downloads folder.`,
      );
    };
    try {
      const options = {
        templateType: selectedTemplate.name,
        framework: selectedTemplate.input_options.includes("framework")
          ? state.framework || "nist-800-53"
          : "",
        baseline: selectedTemplate.input_options.includes("baseline")
          ? activeBaseline
          : "",
        controlFamily: selectedTemplate.input_options.includes("control_family")
          ? state.controlFamily || ""
          : "",
        format: activeFormat,
        environment: state.environment || "Generic",
        includePlaceholders: true,
        includeImplementationPrompts: true,
        includeEvidenceExpectations: true,
        includeInheritancePrompts: true,
        includeReciprocityPrompts: true,
        includeSourceFootnotes: true,
        includeStigReferences: true,
        sourceRefs: selectedTemplate.source_refs || [],
        sources: bundle.runtime.dataset?.sources || [],
      };

      const isOfficeFormat = officeFormats.includes(activeFormat);
      if (isOfficeFormat) {
        // Office formats produce binary payloads (OOXML zips), so they render
        // client-side from the structured document. fflate + the serializers
        // are lazily imported so their weight only loads when an office format
        // is actually chosen (no-upload posture preserved).
        const { renderOfficeDocument } =
          await import("../../app/office-export.mjs");
        const { doc, frameworkResolutionError } = buildTemplateDocument(
          options,
          bundle.runtime.dataset,
        );
        if (frameworkResolutionError) {
          setGenerationTone("warning");
          setGenerationStatus(frameworkResolutionError);
          return;
        }
        const { bytes, mimeType, extension } = renderOfficeDocument(
          doc,
          activeFormat as "xlsx" | "docx",
        );
        const filename = templateFilename(selectedTemplate.name, extension);
        downloadBlobFile(
          filename,
          // Copy into a fresh ArrayBuffer-backed view so the bytes satisfy the
          // Blob part type across lib.dom versions.
          new Blob([new Uint8Array(bytes)], { type: mimeType }),
          () => confirmDownload(filename),
        );
        return;
      }

      const generated = generateTemplate(options, bundle.runtime.dataset);

      if (generated.frameworkResolutionError) {
        setGenerationTone("warning");
        setGenerationStatus(generated.frameworkResolutionError);
        return;
      }

      downloadTextFile(
        generated.filename,
        generated.content,
        generated.mimeType,
        () => confirmDownload(generated.filename),
      );
    } finally {
      if (downloadDispatched) {
        // Keep the button briefly disabled after a real download so a rapid
        // double-click can't fire a second identical generate (CATL-67).
        window.setTimeout(() => setGenerating(false), 1200);
      } else {
        setGenerating(false);
      }
    }
  }

  return (
    <Panel>
      <PageHeader
        action={
          selectedTemplate ? (
            <Button
              variant="secondary"
              onClick={() => onNavigate("templates", { templateType: "" })}
            >
              Back to document tasks
            </Button>
          ) : undefined
        }
        eyebrow="Create a compliance document"
        summary="Pick the job in front of you. We will show the official materials, practical tools, and starter documents that fit it."
        title="What do you need to get done?"
      />

      {!selectedTemplate ? (
        <>
        <div>
        <div className="stack">
          <ContextualCommonsModule
            bundle={bundle}
            contextType="template"
            onNavigate={onNavigate}
          />
          {!selectedWorkflow ? (
          <section aria-labelledby="workflow-heading" className="nexus-section">
            <div className="section-header nexus-section-header">
              <div>
                <p className="eyebrow">Choose the work</p>
                <h2 id="workflow-heading">Start with a compliance task</h2>
                <p className="page-summary">
                  Pick the outcome you are working toward — you do not need to
                  know the document name.
                </p>
              </div>
            </div>
            <div className="intent-grid template-featured-tasks">
              {workflows.slice(0, 4).map((workflow) => (
                <QuickIntentCard
                  key={workflow.workflow_id}
                  title={workflow.title}
                  body={workflow.summary}
                  icon={<IconCompass aria-hidden="true" size={20} stroke={1.8} />}
                  actionLabel="Choose this task"
                  selected={selectedWorkflowId === workflow.workflow_id}
                  onClick={() => {
                    setSelectedWorkflowId(workflow.workflow_id);
                    setShowAllOfficialResources(false);
                    setShowCompleteOfficialCatalog(false);
                    setShowAllTools(false);
                    window.setTimeout(
                      () => workflowDetailRef.current?.focus(),
                      0,
                    );
                  }}
                />
              ))}
            </div>
            {workflows.length > 4 ? (
              <details className="other-templates template-more-tasks">
                <summary>More document tasks ({workflows.length - 4})</summary>
            <div className="intent-grid">
                  {workflows.slice(4).map((workflow) => (
                    <QuickIntentCard
                      key={workflow.workflow_id}
                      title={workflow.title}
                      body={workflow.summary}
                      icon={<IconCompass aria-hidden="true" size={20} stroke={1.8} />}
                      actionLabel="Choose this task"
                      selected={selectedWorkflowId === workflow.workflow_id}
                      onClick={() => {
                        setSelectedWorkflowId(workflow.workflow_id);
                        setShowAllOfficialResources(false);
                        setShowCompleteOfficialCatalog(false);
                        setShowAllTools(false);
                        window.setTimeout(
                          () => workflowDetailRef.current?.focus(),
                          0,
                        );
                      }}
                    />
                  ))}
                </div>
              </details>
            ) : null}
            {workflows.length === 0 ? (
              <div className="notice" role="status">
                <p>
                  Workflow guidance is temporarily unavailable. Official
                  resources and starter documents remain available below.
                </p>
              </div>
            ) : null}
          </section>
          ) : null}

          {selectedWorkflow ? (
            <section
              aria-labelledby="selected-workflow-heading"
              className="nexus-section workflow-detail"
              ref={workflowDetailRef}
              tabIndex={-1}
            >
              <div className="section-header nexus-section-header">
                <div>
                  <p className="eyebrow">Your path</p>
                  <h2 id="selected-workflow-heading">
                    {selectedWorkflow.title}
                  </h2>
                  <p className="page-summary">{selectedWorkflow.summary}</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setSelectedWorkflowId("")}
                >
                  Choose a different task
                </Button>
              </div>
              {/* The method — outcomes, steps, readiness — is reference, not a
                  gate. It used to sit between the user's stated intent and the
                  artifact they asked for, so choosing "Create a POA&M" meant
                  reading an essay before reaching anything buildable. */}
              <details className="workflow-method">
                <summary>How this work is done — steps and what good looks like</summary>
              {selectedWorkflow.outcomes?.length ? (
                <SummaryCard title="What you will have">
                  <ul className="nexus-list">
                    {selectedWorkflow.outcomes.map((outcome) => (
                      <li key={outcome}>{outcome}</li>
                    ))}
                  </ul>
                </SummaryCard>
              ) : null}
              {selectedWorkflow.steps?.length ? (
                <ol className="workflow-steps">
                  {[...selectedWorkflow.steps]
                    .sort((a, b) => a.order - b.order)
                    .map((step) => (
                      <li key={`${step.order}-${step.title}`}>
                        <span
                          aria-hidden="true"
                          className="workflow-step-number"
                        >
                          {step.order}
                        </span>
                        <div>
                          <h3>{step.title}</h3>
                          <p>{step.action}</p>
                          {step.completion_signal ? (
                            <p className="support-meta">
                              Ready when: {step.completion_signal}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                </ol>
              ) : null}
              {selectedWorkflow.readiness_checks?.length ? (
                <SummaryCard title="Before you hand it off" tone="trust">
                  <ul className="nexus-list">
                    {selectedWorkflow.readiness_checks.map((check) => (
                      <li key={check}>{check}</li>
                    ))}
                  </ul>
                </SummaryCard>
              ) : null}
              </details>
              {selectedWorkflow.boundary_note ? (
                <p className="nexus-limitation">
                  <IconShieldCheck
                    aria-hidden="true"
                    size={17}
                    stroke={1.8}
                  />
                  {selectedWorkflow.boundary_note}
                </p>
              ) : null}
            </section>
          ) : null}

          {selectedWorkflow ? (
            <>
          <section
            aria-labelledby="companion-heading"
            className="nexus-section"
            id="companion-templates"
          >
            <div className="section-header nexus-section-header">
              <div>
                <p className="eyebrow">
                  {selectedWorkflow ? "Build it" : "Starter documents"}
                </p>
                <h2 id="companion-heading">
                  {selectedWorkflow && declaredCompanions.length === 1
                    ? `Build your ${declaredCompanions[0].display_name}`
                    : "Starter documents"}
                </h2>
                <p className="page-summary">
                  Create a starter file in your browser — sections, prompts, and
                  structure already laid out, ready to fill in.
                </p>
              </div>
            </div>
            {showCompanionFilters ? (
              <CatalogFilterBar
                category={categoryFilter}
                categoryOptions={[...Object.keys(TEMPLATE_CATEGORIES), "Other"]}
                countLabel={`${filteredTemplates.length} starter document${filteredTemplates.length === 1 ? "" : "s"}${selectedWorkflow ? " connected to this task" : ""} in ${groupedTemplates.size} categor${groupedTemplates.size === 1 ? "y" : "ies"}`}
                onCategoryChange={setCategoryFilter}
                onQueryChange={setQueryFilter}
                query={queryFilter}
                queryPlaceholder="Search starter documents by name or purpose"
              />
            ) : null}

            {[...groupedTemplates.entries()].map(
              ([category, categoryTemplates]) => (
                <section className="catalog-group" key={category}>
                  <h3 className="catalog-group-title">{category}</h3>
                  <div className="intent-grid">
                    {categoryTemplates.map((template: TemplateRecord) => (
                      <QuickIntentCard
                        actionLabel="Review and generate"
                        body={template.description}
                        icon={<IconFileDescription size={20} stroke={1.8} />}
                        key={template.name}
                        onClick={() =>
                          onNavigate("templates", {
                            templateType: template.name,
                            framework: state.framework || "nist-800-53",
                            format: template.supported_formats?.[0] || "markdown",
                            environment: state.environment || "Generic",
                            baseline: "",
                            controlFamily: "",
                          })
                        }
                        title={template.display_name}
                      />
                    ))}
                  </div>
                </section>
              ),
            )}

            {otherTemplates.length ? (
              <details className="other-templates">
                <summary>
                  Other starter documents ({otherTemplates.length})
                </summary>
                <div className="intent-grid">
                  {otherTemplates.map((template: TemplateRecord) => (
                    <QuickIntentCard
                      actionLabel="Review and generate"
                      body={template.description}
                      icon={<IconFileDescription size={20} stroke={1.8} />}
                      key={template.name}
                      onClick={() =>
                        onNavigate("templates", {
                          templateType: template.name,
                          framework: state.framework || "nist-800-53",
                          format: template.supported_formats?.[0] || "markdown",
                          environment: state.environment || "Generic",
                          baseline: "",
                          controlFamily: "",
                        })
                      }
                      title={template.display_name}
                    />
                  ))}
                </div>
              </details>
            ) : null}
          </section>
          <details className="workflow-reference">
            <summary>Official sources and tools for this task</summary>
            <div className="stack disclosure-content">
          <section aria-labelledby="official-heading" className="nexus-section">
            <div className="section-header nexus-section-header">
              <div>
                <p className="eyebrow">Verify the rule</p>
                <h2 id="official-heading">
                  {selectedWorkflow
                    ? `Official resources for ${selectedWorkflow.title}`
                    : "Official federal resources"}
                </h2>
                <p className="page-summary">
                  Use the publisher's material first. Current, legacy, and
                  guidance-only resources are labeled separately so useful does
                  not get confused with current.
                </p>
              </div>
            </div>
            <FedrampCurrentTruthPanel transition={fedrampTransition} />
            <Button
              variant="secondary"
              className="nexus-show-more"
              onClick={() => {
                setShowCompleteOfficialCatalog((value) => !value);
                setShowAllOfficialResources(false);
              }}
            >
              {showCompleteOfficialCatalog
                ? "Show resources for this task"
                : "Browse complete official catalog"}
            </Button>
            <div className="nexus-grid">
              {visibleOfficialArtifacts.map((artifact) => (
                <OfficialArtifactCard
                  artifact={artifact}
                  fedrampTransition={fedrampTransition}
                  key={artifact.artifact_id}
                />
              ))}
            </div>
            {workflowArtifacts.length === 0 ? (
              <div className="notice" role="status">
                <p>
                  No official resource is joined to this workflow yet. Use the
                  complete catalog or a starter document below, and verify against
                  your authorizing organization's direction.
                </p>
              </div>
            ) : null}
            {officialArtifactPool.length > 8 ? (
              <Button
                variant="secondary"
                className="nexus-show-more"
                onClick={() => setShowAllOfficialResources((value) => !value)}
              >
                {showAllOfficialResources
                  ? "Show fewer official resources"
                  : `Show all ${officialArtifactPool.length} official resources`}
              </Button>
            ) : null}
          </section>

          <section aria-labelledby="tools-heading" className="nexus-section">
            <div className="section-header nexus-section-header">
              <div>
                <p className="eyebrow">Use proven tooling</p>
                <h2 id="tools-heading">
                  {selectedWorkflow
                    ? "Tools for this workflow"
                    : "Federal and open-source tools"}
                </h2>
                <p className="page-summary">
                  See what each tool accepts, produces, and requires before you
                  build another converter or tracker.
                </p>
              </div>
            </div>
            <div className="nexus-grid">
              {visibleTools.map((tool) => (
                <ToolCard key={tool.tool_id} tool={tool} />
              ))}
            </div>
            {workflowTools.length === 0 ? (
              <div className="notice" role="status">
                <p>
                  No tool is joined to this workflow yet. The official resources
                  and starter documents remain usable without one.
                </p>
              </div>
            ) : null}
            {workflowTools.length > 8 ? (
              <Button
                variant="secondary"
                className="nexus-show-more"
                onClick={() => setShowAllTools((value) => !value)}
              >
                {showAllTools
                  ? "Show fewer tools"
                  : `Show all ${workflowTools.length} tools`}
              </Button>
            ) : null}
          </section>
            </div>
          </details>

            </>
          ) : null}
        </div>
        </div>
        </>
      ) : null}

      {selectedTemplate ? (
        <section className="stack header-offset-target" ref={generationRef}>
          <div className="section-header">
            <div>
              <p className="eyebrow">Starter document</p>
              <h2>{selectedTemplate.display_name}</h2>
            </div>
            <Badge
              tone={compatibilityTone(
                selectedTemplate.compatibility?.classification ||
                  selectedTemplate.compatibility_level,
              )}
            >
              {compatibilityLabel(
                selectedTemplate.compatibility?.classification ||
                  selectedTemplate.compatibility_level,
              )}
            </Badge>
          </div>
          <SummaryCard title="Download this starter document" tone="trust">
            <p>{selectedTemplate.description}</p>
            <div className="filter-grid template-essential-options">
              {inputOptions.includes("environment_archetype") ? (
                <SelectField
                  hint="Where the system runs — cloud, on-premises, or hybrid."
                  label="Environment"
                  onChange={(value) => onNavigate("templates", { environment: value })}
                  options={[
                    { value: "Generic", label: "Generic" },
                    { value: "Cloud SaaS", label: "Cloud SaaS" },
                    { value: "Platform service", label: "Platform service" },
                    { value: "Enclave", label: "Enclave" },
                    { value: "On-premises", label: "On-premises" },
                    { value: "Hybrid", label: "Hybrid" },
                    { value: "Enterprise service", label: "Enterprise service" },
                  ]}
                  value={state.environment || "Generic"}
                />
              ) : null}
              <SelectField
                hint={FORMAT_HELP[activeFormat] || "File type for the downloaded template."}
                label="Format"
                onChange={(value) => onNavigate("templates", { format: value })}
                options={supportedFormats.map((format: string) => ({ value: format, label: FORMAT_LABELS[format] || format }))}
                value={activeFormat}
              />
            </div>
            <div className="card-actions">
              <Button variant="primary" disabled={generating} onClick={createTemplate}>
                {generating ? "Preparing download…" : `Download ${selectedTemplate.display_name} (${FORMAT_LABELS[activeFormat] || activeFormat})`}
              </Button>
            </div>
            {generationStatus ? <p className={`generation-status tone-${generationTone}`} role="status">{generationStatus}</p> : null}
          </SummaryCard>
          {selectedTemplateArtifacts.length > 0 ? (
            <details className="template-supporting-details">
            <summary>Verify against official sources</summary>
            <section aria-labelledby="template-official-heading" className="stack disclosure-content">
              <div>
                <p className="eyebrow">Check the source first</p>
                <h3 id="template-official-heading">Official resources</h3>
              </div>
              <div className="nexus-grid">
                {selectedTemplateArtifacts.map((artifact) => (
                  <OfficialArtifactCard
                    artifact={artifact}
                    fedrampTransition={fedrampTransition}
                    key={artifact.artifact_id}
                  />
                ))}
              </div>
            </section>
            </details>
          ) : selectedTemplate.official_alternative ? (
            <SummaryCard title="Official resource">
              <p>
                Review the publisher's material before using this starter document: {" "}
                <a
                  href={selectedTemplate.official_alternative.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {selectedTemplate.official_alternative.label}
                  <IconExternalLink
                    aria-hidden="true"
                    size={14}
                    stroke={1.8}
                    style={{ verticalAlign: "text-bottom", marginLeft: 4 }}
                  />
                </a>
                .
              </p>
            </SummaryCard>
          ) : null}
          <SummaryCard title="What this template is for" tone="trust">
            <p>{selectedTemplate.description}</p>
            {selectedTemplate.compatibility?.claim ? (
              <p>{selectedTemplate.compatibility.claim}</p>
            ) : null}
            {selectedTemplate.limitations?.length ? (
              <ul className="nexus-list">
                {selectedTemplate.limitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            ) : selectedTemplate.compatibility?.limitations ? (
              <p className="nexus-limitation">
                <IconInfoCircle aria-hidden="true" size={16} stroke={1.8} />
                {selectedTemplate.compatibility.limitations}
              </p>
            ) : null}
          </SummaryCard>
          <SummaryCard title="What it includes">
            <p>
              Data formats:{" "}
              {dataFormats
                .map((format: string) => FORMAT_LABELS[format] || format)
                .join(", ")}
              .
            </p>
            {officeFormats.length > 0 ? (
              <p>
                Office formats:{" "}
                {officeFormats
                  .map((format: string) => FORMAT_LABELS[format] || format)
                  .join(", ")}{" "}
                — opens directly in Excel or Word for review and completion.
              </p>
            ) : null}
            {selectedTemplate.input_options.length > 0 ? (
              <p>
                Optional inputs:{" "}
                {selectedTemplate.input_options
                  .map((input: string) => INPUT_LABELS[input] || input)
                  .join(", ")}
                .
              </p>
            ) : null}
          </SummaryCard>
          {structurePreview && structurePreview.length > 0 ? (
            <SummaryCard title="Structure preview">
              <p className="field-hint">
                Columns this template will include, before you fill in any data.
              </p>
              <div className="stack compact">
                {structurePreview.map((section) => (
                  <div key={section.heading}>
                    <strong>{section.heading}</strong>
                    <p>{section.headers.join(" · ")}</p>
                  </div>
                ))}
              </div>
            </SummaryCard>
          ) : null}
          {catalogSource ? (
            <SummaryCard title="Catalog data used">
              <p>
                {catalogSource.display_name || catalogSource.name}
                {catalogSource.version
                  ? ` (version ${catalogSource.version})`
                  : ""}
                . Source references stay attached to the generated artifact for
                review.
              </p>
            </SummaryCard>
          ) : null}
          {selectedTemplateTools.length > 0 ? (
            <section aria-labelledby="template-tools-heading" className="stack">
              <div>
                <p className="eyebrow">Related tooling</p>
                <h3 id="template-tools-heading">Tools that use this artifact family</h3>
              </div>
              <div className="nexus-grid">
                {selectedTemplateTools.map((tool) => (
                  <ToolCard key={tool.tool_id} tool={tool} />
                ))}
              </div>
            </section>
          ) : null}
          <Accordion.Root className="accordion-root" collapsible type="single">
            <DisclosurePanel title="More options" value="options">
              <div className="filter-grid">
                {inputOptions.includes("framework") ? (
                  <SelectField
                    hint="Which control catalog the template should reference."
                    label="Framework"
                    onChange={(value) =>
                      onNavigate("templates", {
                        framework: value,
                        baseline: "",
                        controlFamily: "",
                      })
                    }
                    options={catalogOptions}
                    value={state.framework || "nist-800-53"}
                  />
                ) : null}
                {inputOptions.includes("baseline") ? (
                  <SelectField
                    emptyLabel="All controls"
                    hint="Defaults to the Moderate baseline when available; pick All controls for the full catalog."
                    label="Baseline"
                    onChange={(value) =>
                      onNavigate("templates", {
                        baseline: value === "" ? "ALL" : value,
                      })
                    }
                    options={baselineOptions}
                    value={activeBaseline}
                  />
                ) : null}
                {inputOptions.includes("control_family") ? (
                  <SelectField
                    emptyLabel="All families"
                    hint="Limit to one control family (e.g. Access Control)."
                    label="Control family"
                    onChange={(value) =>
                      onNavigate("templates", {
                        controlFamily: value,
                      })
                    }
                    options={familyOptions}
                    value={state.controlFamily || ""}
                  />
                ) : null}
              </div>
              {supportedFormats.length > 1 ? (
                <ul className="format-help-list">
                  {supportedFormats.map((format: string) => (
                    <li key={format}>
                      <strong>{FORMAT_LABELS[format] || format}:</strong>{" "}
                      {FORMAT_HELP[format] || "Downloadable file format."}
                    </li>
                  ))}
                </ul>
              ) : null}
            </DisclosurePanel>
          </Accordion.Root>
        </section>
      ) : null}
    </Panel>
  );
}
