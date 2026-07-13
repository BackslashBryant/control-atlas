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


export function PlaybooksPage(props: {
  state: Extract<ViewState, { view: "patterns" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNodeByItemId: (itemId: string) => void;
  onOpenGlossary: (termId?: string) => void;
  setHelpOpen: (open: boolean) => void;
}) {
  const { state, onNavigate, onOpenNodeByItemId, onOpenGlossary, setHelpOpen } =
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
      <section className="panel">
        <PageHeader
          eyebrow="Playbooks"
          summary="Use task-focused guidance to understand what to do, what to avoid, and which records or templates to open next."
          title="Compliance playbooks"
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
        {!categoryFilter && !queryFilter ? (
          <section className="catalog-group recommended-patterns">
            <h2 className="catalog-group-title">Recommended for new users</h2>
            <p className="field-hint">
              Start with these three if you are new to federal compliance mapping.
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
        {[...groupedPatterns.entries()].map(([category, categoryPatterns]) => (
          <section className="catalog-group" key={category}>
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
        ))}
      </section>
    );
  }

  return (
    <section className="panel">
      <PageHeader
        action={
          <button
            className="secondary"
            onClick={() => onNavigate("patterns", { pattern: "" })}
            type="button"
          >
            Back to playbooks
          </button>
        }
        eyebrow="Playbooks"
        summary="Use task-focused guidance to understand what to do, what to avoid, and which records or templates to open next."
        title={PATTERN_RENAMES[selectedPattern.id] || selectedPattern.title}
      />
      <div className="detail-grid">
        <section className="stack">
          <SummaryCard title="Purpose" tone="trust">
            <p>{selectedPattern.summary}</p>
          </SummaryCard>
          {patternGlossaryTerms.length ? (
            <SummaryCard title="Related glossary terms">
              <div className="chip-row">
                {patternGlossaryTerms.map((entry) => (
                  <button
                    className="chip"
                    key={entry.id}
                    onClick={() => onOpenGlossary(entry.id)}
                    type="button"
                  >
                    {entry.term}
                  </button>
                ))}
              </div>
            </SummaryCard>
          ) : null}
          <SummaryCard title="When to use it">
            <p>{selectedPattern.friction}</p>
          </SummaryCard>
          <SummaryCard title="How it works">
            <p>{selectedPattern.explanation}</p>
          </SummaryCard>
          <SummaryCard title="Common mistakes">
            <ul className="list">
              {selectedPattern.donts.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          </SummaryCard>
        </section>
        <aside className="stack">
          <SummaryCard title="Related controls">
            <div className="chip-row">
              {selectedPattern.controls.map((controlId) => (
                <button
                  className="chip"
                  key={controlId}
                  onClick={() => onOpenNodeByItemId(controlId)}
                  type="button"
                >
                  {controlId}
                </button>
              ))}
            </div>
          </SummaryCard>
          <SummaryCard title="Related templates">
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
                  <span>{templateId.replaceAll("_", " ")}</span>
                </button>
              ))}
            </div>
          </SummaryCard>
          <SummaryCard title="Source support">
            <p>{selectedPattern.sources.join(", ")}</p>
          </SummaryCard>
          <SummaryCard title="Next action">
            <div className="stack compact">
              {selectedPattern.controls[0] ? (
                <button
                  className="primary"
                  onClick={() =>
                    onNavigate("atlas-map", {
                      node: selectedPattern.controls[0],
                    })
                  }
                  type="button"
                >
                  Open related map
                </button>
              ) : null}
              {selectedPattern.templates[0] ? (
                <button
                  className="secondary"
                  onClick={() =>
                    onNavigate("templates", {
                      templateType: selectedPattern.templates[0],
                    })
                  }
                  type="button"
                >
                  Open related templates
                </button>
              ) : null}
              <button
                className="secondary"
                onClick={() => onNavigate("templates")}
                type="button"
              >
                Browse all templates
              </button>
              <button
                className="secondary quiet"
                onClick={() => setHelpOpen(true)}
                type="button"
              >
                Open the glossary
              </button>
            </div>
          </SummaryCard>
        </aside>
      </div>
    </section>
  );
}

