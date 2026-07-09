import * as Accordion from "@radix-ui/react-accordion";
import {
  IconArrowRight,
  IconBook2,
  IconClipboardList,
  IconCompass,
  IconExternalLink,
  IconFileDescription,
  IconGitCompare,
  IconInfoCircle,
  IconLink,
  IconMap,
  IconSearch,
  IconShieldCheck,
  IconSourceCode,
} from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import { patternsData } from "../../app/patterns-data.mjs";
import { groupRelationships } from "../../app/relationship-groups.mjs";
import {
  buildTemplateDocument,
  generateTemplate,
  templateFilename,
} from "../../app/template-engine.mjs";
import { PRODUCT_DISCLAIMER } from "../../shared/disclaimer.mjs";
import {
  ExpandableChipList,
  RelationshipGroupsSection,
} from "../components/ExpandableRelationshipGroup";
import { RelationshipExplorer } from "../components/RelationshipExplorer";
import { StickyDetailBar } from "../components/StickyDetailBar";
import { ProvenanceTerm } from "../components/ProvenanceTerm";
import { StartHereResult } from "../components/StartHereResult";
import {
  CatalogFilterBar,
  QuickIntentCard,
} from "../components/QuickIntentCard";
import {
  filterByCategoryAndQuery,
  groupItemsByCategory,
  PATTERN_CATEGORIES,
  RECOMMENDED_PATTERN_IDS,
  TEMPLATE_CATEGORIES,
} from "../lib/catalogGroups.mjs";
import {
  glossaryTermsForDocument,
  glossaryTermsForPattern,
  templatesForPatterns,
} from "../lib/glossarySearch.mjs";
import { buildStartHereRecommendations } from "../lib/startHereRecommendations.mjs";
import type {
  StartHereCompareLink,
  StartHereLibraryLink,
  StartHereRecommendations,
} from "../lib/startHereRecommendations.d.ts";
import { serializeHashUrl } from "../lib/hashRoutes";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";
import {
  Badge,
  DisclosurePanel,
  PageHeader,
  SelectField,
  SourceSummaryCard,
  SummaryCard,
  copyText,
  downloadBlobFile,
  downloadTextFile,
  formatConfidence,
  formatRelationshipLabel,
  openAtlasMapForNode,
  sourceUsageSummary,
  sourceWarnings,
  PATTERN_RENAMES,
} from "../lib/pagePrimitives";

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
  const [categoryFilter, setCategoryFilter] = useState("");
  const [queryFilter, setQueryFilter] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const [generationTone, setGenerationTone] = useState<"trust" | "warning">(
    "trust",
  );
  const templates = (bundle.templateRegistry.templates || []) as Array<{
    name: string;
    display_name: string;
    description: string;
    supported_formats: string[];
    office_formats?: string[];
    input_options: string[];
    source_refs?: string[];
    official_alternative?: { label: string; url: string };
  }>;
  const filteredTemplates = useMemo(
    () =>
      filterByCategoryAndQuery(
        templates,
        TEMPLATE_CATEGORIES,
        (template: any) => template.name,
        (template: any) =>
          `${template.display_name} ${template.description} ${template.name}`,
        { category: categoryFilter, query: queryFilter },
      ),
    [categoryFilter, queryFilter, templates],
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
    templates.find((template: any) => template.name === state.templateType) ||
    null;
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

  // "View related map" should land somewhere relevant to the template: a STIG
  // rule for STIG-scoped templates, otherwise the first control of the chosen
  // framework so the map opens on that framework's landscape rather than the
  // generic starter view.
  const relatedMapNode = useMemo(() => {
    if (!selectedTemplate) return "";
    if (inputOptions.includes("selected_stigs")) {
      const stig = datasetNodes
        .filter((node) => node.node_type === "stig_rule")
        .sort((a, b) =>
          String(a.metadata?.item_id || a.id).localeCompare(
            String(b.metadata?.item_id || b.id),
            undefined,
            { numeric: true },
          ),
        )[0];
      if (stig) return stig.id as string;
    }
    const controls = datasetNodes
      .filter(
        (node) =>
          node.node_type === "control" &&
          node.metadata?.catalog_id === activeFramework,
      )
      .sort((a, b) =>
        String(a.metadata?.item_id || a.id).localeCompare(
          String(b.metadata?.item_id || b.id),
          undefined,
          { numeric: true },
        ),
      );
    if (controls[0]) return controls[0].id as string;
    const baseline = datasetNodes.find(
      (node) =>
        node.node_type === "baseline" &&
        node.metadata?.catalog_id === activeFramework,
    );
    return (baseline?.id as string) || "";
  }, [selectedTemplate?.name, activeFramework, inputOptions, datasetNodes]);

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    generationRef.current?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
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
          ? state.baseline || ""
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
    <section className="panel">
      <PageHeader
        action={
          selectedTemplate ? (
            <button
              className="secondary"
              onClick={() => onNavigate("templates", { templateType: "" })}
              type="button"
            >
              Back to templates
            </button>
          ) : undefined
        }
        eyebrow="Templates"
        summary="Pick the artifact you need, see what it covers, then generate a blank starter you fill in yourself — nothing you type is uploaded or stored."
        title="What are you trying to create?"
      />

      {!selectedTemplate ? (
        <>
          <CatalogFilterBar
            category={categoryFilter}
            categoryOptions={[...Object.keys(TEMPLATE_CATEGORIES), "Other"]}
            countLabel={`${filteredTemplates.length} template${filteredTemplates.length === 1 ? "" : "s"} in ${groupedTemplates.size} categor${groupedTemplates.size === 1 ? "y" : "ies"}`}
            onCategoryChange={setCategoryFilter}
            onQueryChange={setQueryFilter}
            query={queryFilter}
            queryPlaceholder="Search templates by name or purpose"
          />

          {[...groupedTemplates.entries()].map(
            ([category, categoryTemplates]) => (
              <section className="catalog-group" key={category}>
                <h2 className="catalog-group-title">{category}</h2>
                <div className="intent-grid">
                  {categoryTemplates.map((template: any) => (
                    <QuickIntentCard
                      actionLabel="Select this template"
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
        </>
      ) : null}

      {selectedTemplate ? (
        <section className="stack" ref={generationRef}>
          <div className="section-header">
            <div>
              <p className="eyebrow">Selected template</p>
              <h2>{selectedTemplate.display_name}</h2>
            </div>
          </div>
          <SummaryCard title="What this template is for" tone="trust">
            <p>{selectedTemplate.description}</p>
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
                — opens directly in Excel or Word, no reformatting.
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
          {catalogSource || selectedTemplate.official_alternative ? (
            <SummaryCard title="Source data & official alternative">
              {catalogSource ? (
                <p>
                  Catalog data:{" "}
                  {catalogSource.display_name || catalogSource.name}
                  {catalogSource.version
                    ? ` (version ${catalogSource.version})`
                    : ""}
                  .
                </p>
              ) : null}
              {selectedTemplate.official_alternative ? (
                <p>
                  Prefer an authoritative form? Use the{" "}
                  <a
                    href={selectedTemplate.official_alternative.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {selectedTemplate.official_alternative.label}
                    <IconExternalLink
                      size={14}
                      stroke={1.8}
                      style={{ verticalAlign: "text-bottom", marginLeft: 4 }}
                    />
                  </a>
                  .
                </p>
              ) : null}
            </SummaryCard>
          ) : null}
          {generationStatus ? (
            <p
              className={`generation-status tone-${generationTone}`}
              role="status"
            >
              {generationStatus}
            </p>
          ) : null}
          <div className="notice" role="note">
            <p
              className="ca-text-subtle"
              style={{ fontSize: "var(--ca-text-xs)" }}
            >
              {PRODUCT_DISCLAIMER}
            </p>
          </div>
          <div className="card-actions">
            <button
              className="primary"
              disabled={generating}
              onClick={createTemplate}
              ref={generateButtonRef}
              type="button"
            >
              {generating
                ? "Generating…"
                : `Generate ${selectedTemplate.display_name}`}
            </button>
            <button
              className="secondary"
              onClick={() =>
                onNavigate(
                  "atlas-map",
                  relatedMapNode ? { node: relatedMapNode } : undefined,
                )
              }
              type="button"
            >
              View related map
            </button>
          </div>
          <Accordion.Root className="accordion-root" collapsible type="single">
            <DisclosurePanel title="More options" value="options">
              <div className="filter-grid">
                {inputOptions.includes("framework") ? (
                  <SelectField
                    hint="Which control catalog the template should reference."
                    label="Framework"
                    onChange={(value) =>
                      onNavigate("templates", {
                        ...state,
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
                    hint="Limit to a baseline (Low, Moderate, High) or leave as all controls."
                    label="Baseline"
                    onChange={(value) =>
                      onNavigate("templates", { ...state, baseline: value })
                    }
                    options={baselineOptions}
                    value={state.baseline || ""}
                  />
                ) : null}
                {inputOptions.includes("control_family") ? (
                  <SelectField
                    emptyLabel="All families"
                    hint="Limit to one control family (e.g. Access Control)."
                    label="Control family"
                    onChange={(value) =>
                      onNavigate("templates", {
                        ...state,
                        controlFamily: value,
                      })
                    }
                    options={familyOptions}
                    value={state.controlFamily || ""}
                  />
                ) : null}
                {inputOptions.includes("environment_archetype") ? (
                  <SelectField
                    hint="Where the system runs — cloud, on-premises, or hybrid."
                    label="Environment"
                    onChange={(value) =>
                      onNavigate("templates", { ...state, environment: value })
                    }
                    options={[
                      { value: "Generic", label: "Generic" },
                      { value: "Cloud SaaS", label: "Cloud SaaS" },
                      { value: "Platform service", label: "Platform service" },
                      { value: "Enclave", label: "Enclave" },
                      { value: "On-premises", label: "On-premises" },
                      { value: "Hybrid", label: "Hybrid" },
                      {
                        value: "Enterprise service",
                        label: "Enterprise service",
                      },
                    ]}
                    value={state.environment || "Generic"}
                  />
                ) : null}
                <SelectField
                  hint={
                    FORMAT_HELP[activeFormat] ||
                    "File type for the downloaded template."
                  }
                  label="Format"
                  onChange={(value) =>
                    onNavigate("templates", { ...state, format: value })
                  }
                  options={supportedFormats.map((format: string) => ({
                    value: format,
                    label: FORMAT_LABELS[format] || format,
                  }))}
                  value={activeFormat}
                />
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
    </section>
  );
}
