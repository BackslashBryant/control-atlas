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
import { generateTemplate } from "../../app/template-engine.mjs";
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
};

const INPUT_LABELS: Record<string, string> = {
  framework: "Framework context",
  baseline: "Baseline selection",
  control_family: "Control family filter",
  selected_controls: "Specific controls",
  selected_stigs: "STIG references",
  environment_archetype: "Environment type",
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
  const templates = (bundle.templateRegistry.templates || []) as Array<{
    name: string;
    display_name: string;
    description: string;
    supported_formats: string[];
    input_options: string[];
    source_refs?: Array<Record<string, string>>;
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
  const supportedFormats = selectedTemplate?.supported_formats || ["markdown"];
  const activeFormat = supportedFormats.includes(state.format || "markdown")
    ? state.format || supportedFormats[0]
    : supportedFormats[0];

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

  function createTemplate() {
    if (!selectedTemplate || generating) {
      return;
    }
    setGenerating(true);
    setGenerationStatus("");
    try {
      const generated = generateTemplate(
        {
          templateType: selectedTemplate.name,
          framework: state.framework || "nist-800-53",
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
        },
        bundle.runtime.dataset,
      );

      if (generated.frameworkResolutionError) {
        setGenerationStatus(generated.frameworkResolutionError);
        return;
      }

      downloadTextFile(generated.filename, generated.content, generated.mimeType);
      setGenerationStatus(
        `Download started for ${generated.filename}. Check your downloads folder.`,
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section className="panel">
      <PageHeader
        eyebrow="Templates"
        summary="Choose the artifact you need first, review what it is for, then generate a blank reference starter without exposing extra options too early."
        title="What are you trying to create?"
      />

      <CatalogFilterBar
        category={categoryFilter}
        categoryOptions={[...Object.keys(TEMPLATE_CATEGORIES), "Other"]}
        countLabel={`${filteredTemplates.length} template${filteredTemplates.length === 1 ? "" : "s"} in ${groupedTemplates.size} categor${groupedTemplates.size === 1 ? "y" : "ies"}`}
        onCategoryChange={setCategoryFilter}
        onQueryChange={setQueryFilter}
        query={queryFilter}
        queryPlaceholder="Search templates by name or purpose"
      />

      {[...groupedTemplates.entries()].map(([category, categoryTemplates]) => (
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
                  })
                }
                title={template.display_name}
              />
            ))}
          </div>
        </section>
      ))}

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
              Download formats:{" "}
              {selectedTemplate.supported_formats
                .map((format: string) => FORMAT_LABELS[format] || format)
                .join(", ")}
              .
            </p>
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
          {generationStatus ? (
            <p className="generation-status" role="status">
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
              onClick={() => onNavigate("atlas-map")}
              type="button"
            >
              View related map
            </button>
          </div>
          <Accordion.Root
            className="accordion-root"
            collapsible
            type="single"
          >
            <DisclosurePanel title="More options" value="options">
              <div className="filter-grid">
                <SelectField
                  hint="Which control catalog the template should reference."
                  label="Framework"
                  onChange={(value) =>
                    onNavigate("templates", { ...state, framework: value })
                  }
                  options={catalogOptions}
                  value={state.framework || "nist-800-53"}
                />
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
                <SelectField
                  hint="File type for download: Markdown, CSV, or JSON."
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
            </DisclosurePanel>
          </Accordion.Root>
        </section>
      ) : null}
    </section>
  );
}
