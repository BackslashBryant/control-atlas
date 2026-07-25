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
import { useMemo, useState, type ReactNode } from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import { patternsData } from "../../app/patterns-data.mjs";
import { groupRelationships } from "../../app/relationship-groups.mjs";
import { generateTemplate } from "../../app/template-engine.mjs";
import {
  ExpandableChipList,
  RelationshipGroupsSection,
} from "../components/ExpandableRelationshipGroup";
import { RelationshipExplorer } from "../components/RelationshipExplorer";
import { ContextualCommonsModule } from "../components/ContextualCommonsModule";
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
import { Panel, Button, StatusChip } from "../components/lsm";


export function PlaybooksPage(props: {
  bundle: RuntimeBundle | null;
  state: Extract<ViewState, { view: "patterns" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNodeByItemId: (itemId: string) => void;
  onOpenGlossary: (termId?: string) => void;
  setHelpOpen: (open: boolean) => void;
}) {
  const { bundle, state, onNavigate, onOpenNodeByItemId, onOpenGlossary, setHelpOpen } =
    props;
  const [categoryFilter, setCategoryFilter] = useState("");
  const [queryFilter, setQueryFilter] = useState("");
  const selectedPattern =
    patternsData.find((pattern) => pattern.id === state.pattern) || null;
  const patternGlossaryTerms = selectedPattern
    ? glossaryTermsForPattern(selectedPattern.id)
    : [];
  const filteredPatterns = useMemo(
    () =>
      filterByCategoryAndQuery(
        patternsData,
        PATTERN_CATEGORIES,
        (pattern) => pattern.id,
        (pattern) =>
          `${PATTERN_RENAMES[pattern.id] || pattern.title} ${pattern.summary}`,
        { category: categoryFilter, query: queryFilter },
      ),
    [categoryFilter, queryFilter],
  );
  const groupedPatterns = useMemo(
    () =>
      groupItemsByCategory(
        filteredPatterns,
        PATTERN_CATEGORIES,
        (pattern) => pattern.id,
      ),
    [filteredPatterns],
  );

  if (!selectedPattern) {
    const recommendedPatterns = patternsData.filter((pattern) =>
      RECOMMENDED_PATTERN_IDS.includes(pattern.id),
    );

    return (
      <Panel>
        <PageHeader
          eyebrow="Playbooks"
          summary="Choose the job in front of you. Each guide shows the decision to make, common mistakes, and the records or starter documents to open next."
          title="Guides for common compliance jobs"
        />
        <CatalogFilterBar
          category={categoryFilter}
          categoryOptions={[...Object.keys(PATTERN_CATEGORIES), "Other"]}
          countLabel={`${filteredPatterns.length} playbook${filteredPatterns.length === 1 ? "" : "s"} in ${groupedPatterns.size} categor${groupedPatterns.size === 1 ? "y" : "ies"}`}
          onCategoryChange={setCategoryFilter}
          onQueryChange={setQueryFilter}
          query={queryFilter}
          queryPlaceholder="Search playbooks by outcome or topic"
        />
        <div className="stack">
        {!categoryFilter && !queryFilter ? (
          <section className="catalog-group recommended-patterns" id="playbooks-recommended">
            <h2 className="catalog-group-title">Recommended for new users</h2>
            <p className="field-hint">
              Start with the work most teams face first: plan the RMF, divide
              provider responsibilities, or reuse an earlier assessment.
            </p>
            <div className="intent-grid">
              {recommendedPatterns.map((pattern) => (
                <QuickIntentCard
                  actionLabel="Open playbook"
                  body={pattern.summary}
                  icon={<IconBook2 size={20} stroke={1.8} />}
                  key={pattern.id}
                  onClick={() => onNavigate("patterns", { pattern: pattern.id })}
                  title={PATTERN_RENAMES[pattern.id] || pattern.title}
                />
              ))}
            </div>
          </section>
        ) : null}
        <ContextualCommonsModule
          bundle={bundle}
          contextType="guide"
          onNavigate={onNavigate}
        />
        {!categoryFilter && !queryFilter ? (
          <p className="field-hint" id="playbooks-browse-hint">
            Pick a category above or search by outcome to see the rest of the{" "}
            {filteredPatterns.length} guides.
          </p>
        ) : null}
        {categoryFilter || queryFilter
          ? [...groupedPatterns.entries()].map(([category, categoryPatterns]) => {
              return categoryPatterns.length ? (
                <section
                  className="catalog-group"
                  id={`playbooks-${category.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`}
                  key={category}
                >
                  <h2 className="catalog-group-title">{category}</h2>
                  <div className="intent-grid">
                    {categoryPatterns.map((pattern) => (
                      <QuickIntentCard
                        actionLabel="Open playbook"
                        body={pattern.summary}
                        icon={<IconBook2 size={20} stroke={1.8} />}
                        key={pattern.id}
                        onClick={() => onNavigate("patterns", { pattern: pattern.id })}
                        title={PATTERN_RENAMES[pattern.id] || pattern.title}
                      />
                    ))}
                  </div>
                </section>
              ) : null;
            })
          : null}
        {filteredPatterns.length === 0 ? (
          <div className="p-[24px] bg-[color-mix(in_srgb,var(--ca-surface-raised),white_5%)] border border-[var(--ca-border-strong)] rounded-[3px] text-center" role="status">
            <p className="mb-[16px] text-[var(--ca-text)] font-medium">No playbooks match this search and category.</p>
            <Button
              variant="primary"
              onClick={() => {
                setCategoryFilter("");
                setQueryFilter("");
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : null}
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <PageHeader
        action={
          <Button
            variant="secondary"
            onClick={() => onNavigate("patterns", { pattern: "" })}
          >
            Back to playbooks
          </Button>
        }
        eyebrow="Playbooks"
        summary={selectedPattern.summary}
        title={PATTERN_RENAMES[selectedPattern.id] || selectedPattern.title}
      />
      <div className="detail-grid">
        <section className="stack">
          {patternGlossaryTerms.length ? (
            <details>
              <summary>Related glossary terms ({patternGlossaryTerms.length})</summary>
              <div className="flex gap-[8px] flex-wrap mt-[12px]">
                {patternGlossaryTerms.map((entry) => (
                  <button
                    key={entry.id}
                    className="inline-flex items-center min-h-[26px] px-[12px] py-[4px] border rounded-full font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer border-[var(--ca-border-strong)] text-[var(--ca-text)] bg-[var(--ca-surface)] hover:bg-[var(--ca-surface-raised)]"
                    onClick={() => onOpenGlossary(entry.id)}
                  >
                    {entry.term}
                  </button>
                ))}
              </div>
            </details>
          ) : null}
          <SummaryCard title="Use this when" tone="trust">
            <p>{selectedPattern.friction}</p>
          </SummaryCard>
          <SummaryCard title="What to do">
            <ul className="list">
              {selectedPattern.dos.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          </SummaryCard>
          <SummaryCard title="How it works">
            <p>{selectedPattern.explanation}</p>
          </SummaryCard>
          <SummaryCard title="What to avoid">
            <ul className="list">
              {selectedPattern.donts.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          </SummaryCard>
        </section>
        <aside className="stack">
          <SummaryCard title="Controls to review">
            <div className="flex gap-[8px] flex-wrap">
              {selectedPattern.controls.map((controlId) => (
                <button
                  key={controlId}
                  className="inline-flex items-center min-h-[26px] px-[12px] py-[4px] border rounded-full font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer border-[var(--ca-info)] text-[var(--ca-text)] bg-[color-mix(in_srgb,var(--ca-info)_20%,transparent)] hover:bg-[color-mix(in_srgb,var(--ca-info)_30%,transparent)]"
                  onClick={() => onOpenNodeByItemId(controlId)}
                >
                  {controlId}
                </button>
              ))}
            </div>
          </SummaryCard>
          <SummaryCard title="Starter documents to open">
            <div className="stack compact">
              {selectedPattern.templates.map((templateId) => (
                <button
                  className="link-action"
                  key={templateId}
                  onClick={() =>
                    onNavigate("templates", { templateType: templateId })
                  }
                  type="button"
                >
                  <IconFileDescription
                    aria-hidden="true"
                    size={16}
                    stroke={1.8}
                  />
                  <span>{displayNameFor("template_type", templateId)}</span>
                </button>
              ))}
            </div>
          </SummaryCard>
          <SummaryCard title="Basis for this guide">
            <p>{selectedPattern.sources.join(", ")}</p>
          </SummaryCard>
          <SummaryCard title="Limits of this guide">
            <p>{selectedPattern.limitations}</p>
          </SummaryCard>
          <SummaryCard title="Next action">
            <div className="grid gap-[12px]">
              {selectedPattern.controls[0] ? (
                <Button
                  variant="primary"
                  onClick={() =>
                    onNavigate("atlas-map", {
                      node: selectedPattern.controls[0],
                    })
                  }
                >
                  Open {selectedPattern.controls[0]} in Atlas
                </Button>
              ) : null}
              {selectedPattern.templates[0] ? (
                <Button
                  variant="secondary"
                  onClick={() =>
                    onNavigate("templates", {
                      templateType: selectedPattern.templates[0],
                    })
                  }
                >
                  Open {displayNameFor("template_type", selectedPattern.templates[0])}
                </Button>
              ) : null}
              <details className="mt-[12px]">
                <summary>More options</summary>
                <div className="grid gap-[8px] mt-[12px]">
                  <Button
                    variant="secondary"
                    onClick={() => onNavigate("templates")}
                  >
                    Browse all starter documents
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setHelpOpen(true)}
                  >
                    Open the glossary
                  </Button>
                </div>
              </details>
            </div>
          </SummaryCard>
        </aside>
      </div>
    </Panel>
  );
}
