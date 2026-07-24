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
import { Button, Panel } from "../components/lsm";


export function AboutPage(props: {
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  const { onNavigate } = props;

  return (
    <Panel>
      <PageHeader
        eyebrow="About & trust"
        summary="Federal cyber guidance is scattered across dozens of official sites. Control Atlas pulls the public pieces into one place, connects them, and explains them in plain English — without storing your data or making official decisions."
        title="What Control Atlas is — and is not"
      />

      <div className="flex flex-col gap-[24px]">
        <SummaryCard title="What this is" tone="trust">
          <p>
            Federal compliance rules live in many separate places — NIST
            publications, DISA STIGs, FedRAMP baselines, and more. Control
            Atlas gathers that public guidance, links related requirements,
            and puts it in plain language you can trace to the official source.
          </p>
          <p>
            Everything runs in your browser. There are no accounts, no file
            uploads, and no organizational data storage.
          </p>
        </SummaryCard>

        <SummaryCard title="What this is not">
          <ul className="list-disc pl-[24px] space-y-[8px]">
            <li>Not an official U.S. government system or endorsement.</li>
            <li>
              Not a GRC tool, evidence processor, compliance scorer, or
              authorization workflow.
            </li>
            <li>
              Does not determine compliance status or recommend authorization
              decisions.
            </li>
          </ul>
        </SummaryCard>

        <SummaryCard title="Disclaimer" tone="warning">
          <p>{PRODUCT_DISCLAIMER}</p>
        </SummaryCard>

        <section className="flex flex-col gap-[16px]">
          <div className="border-b border-[var(--ca-border)] pb-[12px]">
            <h2 className="font-display font-semibold text-[18px]">What to do next</h2>
            <p className="text-[var(--ca-text-muted)] text-[14px]">Verify source trust, then pick a starting path for your work.</p>
          </div>
          <div className="flex gap-[16px] items-center flex-wrap">
            <Button
              variant="primary"
              onClick={() => onNavigate("start-here")}
            >
              Find where to start
            </Button>
            <Button
              variant="secondary"
              onClick={() => onNavigate("sources")}
            >
              Review sources
            </Button>
            <details className="relative">
              <summary className="cursor-pointer text-[13px] text-[var(--ca-text-muted)] hover:text-[var(--ca-text)] font-medium">More options</summary>
              <div className="absolute top-[100%] left-0 mt-[8px] bg-[var(--ca-surface-raised)] border border-[var(--ca-border-strong)] rounded-[3px] p-[8px] shadow-lg z-10 min-w-[200px]">
                <Button variant="secondary" className="w-full text-left justify-start" onClick={() => onNavigate("templates")}>Create a starter document</Button>
              </div>
            </details>
          </div>
        </section>
      </div>
    </Panel>
  );
}
