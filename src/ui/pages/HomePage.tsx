import {
  IconBook2,
  IconClipboardList,
  IconCompass,
  IconFileDescription,
  IconGitCompare,
  IconMap,
  IconSearch,
} from "@tabler/icons-react";

import { QuickIntentCard } from "../components/QuickIntentCard";
import type { ViewState } from "../lib/viewState";

type HomePageProps = {
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
};

const HOME_CARDS = [
  {
    title: "Atlas Map",
    body: "See how controls, baselines, CCIs, STIGs, templates, sources, and playbooks connect.",
    actionLabel: "Open map",
    icon: IconMap,
    view: "atlas-map" as const,
  },
  {
    title: "Start Guided Path",
    body: "Answer a few questions and get the best starting point for your context.",
    actionLabel: "Start here",
    icon: IconCompass,
    view: "start-here" as const,
  },
  {
    title: "Explore Records",
    body: "Find a control, CCI, baseline, STIG, term, template, source, or playbook.",
    actionLabel: "Search records",
    icon: IconSearch,
    view: "search" as const,
  },
  {
    title: "Compare Frameworks",
    body: "Compare public mappings and see what overlaps, differs, or needs review.",
    actionLabel: "Compare",
    icon: IconGitCompare,
    view: "matrix" as const,
  },
  {
    title: "Playbooks",
    body: "Use task-focused guidance for common compliance problems.",
    actionLabel: "View playbooks",
    icon: IconBook2,
    view: "patterns" as const,
  },
  {
    title: "Templates",
    body: "Start an artifact with the right context already attached.",
    actionLabel: "Open templates",
    icon: IconFileDescription,
    view: "templates" as const,
  },
] as const;

export function HomePage(props: HomePageProps) {
  const { onNavigate } = props;

  return (
    <>
      <section className="hero home-hero">
        <p className="eyebrow">CONTROL ATLAS</p>
        <h1>Navigate federal cyber compliance.</h1>
        <p className="hero-tagline">
          Find a requirement, see how it connects, and open the next step with
          source-backed context.
        </p>
        <div className="hero-actions">
          <button
            className="primary"
            onClick={() => onNavigate("atlas-map")}
            type="button"
          >
            Open Atlas Map
          </button>
          <button
            className="secondary"
            onClick={() => onNavigate("start-here")}
            type="button"
          >
            Start guided path
          </button>
          <button
            className="secondary quiet"
            onClick={() => onNavigate("search")}
            type="button"
          >
            Search records
          </button>
        </div>
      </section>

      <section aria-label="Explore Control Atlas" className="intent-grid home-card-grid">
        {HOME_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <QuickIntentCard
              actionLabel={card.actionLabel}
              body={card.body}
              icon={<Icon aria-hidden="true" size={20} stroke={1.8} />}
              key={card.title}
              onClick={() => onNavigate(card.view)}
              title={card.title}
            />
          );
        })}
      </section>
    </>
  );
}
