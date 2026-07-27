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

// W7.1 — derived from docs/tree-model.md #2 (canonical, owner-authored).
// This is the only surface where the tree vocabulary is named directly;
// it never becomes a navigation label (docs/tree-model.md #6).
const TREE_MODEL_LAYERS: Array<{ name: string; blurb: string }> = [
  {
    name: "Environment",
    blurb:
      "Your mission, systems, data, technology, and threats — the context Start Here asks about.",
  },
  {
    name: "Roots",
    blurb:
      "The laws, policies, and authoritative publications that make a requirement exist in the first place.",
  },
  {
    name: "Trunk",
    blurb:
      "The Risk Management Framework lifecycle that connects policy to day-to-day work.",
  },
  {
    name: "Major branches",
    blurb:
      "The frameworks and programs themselves — NIST 800-53, FedRAMP, CMMC, DISA — each a different kind of thing.",
  },
  {
    name: "Branches",
    blurb:
      "Each framework's own internal structure: functions, categories, domains, and control families.",
  },
  {
    name: "Twigs",
    blurb:
      "The atomic requirements — controls, enhancements, practices, and assessment objectives.",
  },
  {
    name: "Junctions",
    blurb:
      "CCIs and crosswalks that correlate one framework's requirement to another's — a bridge, not a parent.",
  },
  {
    name: "Leaves",
    blurb:
      "How a requirement actually gets implemented — SRGs, STIG rules, checks, and countermeasures.",
  },
  {
    name: "Fruit",
    blurb:
      "What assurance normally looks like — expected evidence types and validation questions, never your actual evidence.",
  },
  {
    name: "Acorns",
    blurb:
      "Reusable work — templates, implementation patterns, and inheritance worksheets that seed the next system.",
  },
];

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

        <SummaryCard title="Why this exists">
          <p>
            A lot of organizations and people wrote requirements down, and
            then made others accountable for following them. Federal
            cybersecurity looks incoherent, but it is not — it is layered.
            Nobody publishes the map of the layers. Every requirement you are
            held to traces back to somebody&apos;s authority, through
            somebody&apos;s risk process, into somebody&apos;s framework,
            down to somebody&apos;s technical check. That chain exists. It is
            just never shown.
          </p>
          <p>
            Control Atlas exists to show that chain. A gap in it is a defect
            we close, not a limitation we report and move past.
          </p>
        </SummaryCard>

        <SummaryCard title="How the model works">
          <p>
            The vocabulary below (Roots, Trunk, Twigs, and so on) is the one
            place on the site it appears by name — it never becomes a
            navigation label. It is a way to picture how everything
            connects, root to leaf.
          </p>
          <ol className="flex flex-col gap-[10px] mt-[8px] list-none pl-0">
            {TREE_MODEL_LAYERS.map((layer, index) => (
              <li
                className="flex gap-[12px] items-baseline border-l-2 border-[var(--ca-border)] pl-[12px]"
                key={layer.name}
              >
                <span className="font-mono text-[12px] text-[var(--ca-text-subtle)] w-[16px] shrink-0">
                  {index + 1}
                </span>
                <span>
                  <strong>{layer.name}</strong> — {layer.blurb}
                </span>
              </li>
            ))}
          </ol>
          <p className="text-[13px] text-[var(--ca-text-muted)] mt-[12px]">
            One primary tree for orientation, with overlays for threats,
            technology, evidence, and lifecycle — many-to-many relationships
            stay honest instead of being forced into one literal hierarchy.
          </p>
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
