import {
  IconBook2,
  IconCompass,
  IconFileDescription,
  IconGitCompare,
  IconMap,
  IconSearch,
  IconSourceCode,
} from "@tabler/icons-react";

import { QuickIntentCard } from "../components/QuickIntentCard";
import type { ViewState } from "../lib/viewState";

type HomePageProps = {
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
};

const HERO_WORDS = [
  "Comply",
  "Map",
  "Assess",
  "Crosswalk",
  "Navigate",
  "Inherit",
  "Audit",
  "Authorize",
];

const HOME_CARDS = [
  {
    title: "Start here",
    body: "Answer three questions and get a plain-language starting point for your situation.",
    actionLabel: "Start",
    icon: IconCompass,
    view: "start-here" as const,
  },
  {
    title: "Explore controls",
    body: "Look up a control, CCI, baseline, STIG, or term and see what it means and how it connects.",
    actionLabel: "Explore",
    icon: IconSearch,
    view: "search" as const,
  },
  {
    title: "Compare frameworks",
    body: "Map two public catalogs side-by-side and see what overlaps, diverges, or needs review.",
    actionLabel: "Compare",
    icon: IconGitCompare,
    view: "matrix" as const,
  },
  {
    title: "Playbooks",
    body: "Task-focused guidance for common compliance problems — RMF, inheritance, POA&M, and more.",
    actionLabel: "Playbooks",
    icon: IconBook2,
    view: "patterns" as const,
  },
  {
    title: "Templates",
    body: "Generate blank RMF and ATO artifacts without uploading data or creating an account.",
    actionLabel: "Templates",
    icon: IconFileDescription,
    view: "templates" as const,
  },
  {
    title: "Sources",
    body: "Review what source is behind every mapping and how much weight to give it.",
    actionLabel: "Sources",
    icon: IconSourceCode,
    view: "sources" as const,
  },
] as const;

export function HomePage(props: HomePageProps) {
  const { onNavigate } = props;

  return (
    <>
      <section className="hero home-hero">
        <p className="eyebrow">Control Atlas</p>
        <h1>The public map for federal cyber compliance.</h1>
        <div aria-label="Ctrl Alt Comply" className="ca-hero-tagline">
          <span className="ca-hero-prefix">Ctrl+Alt+</span>
          <span className="ca-hero-word-wrap" aria-hidden="true">
            <span className="ca-hero-word-track">
              {HERO_WORDS.map((word) => (
                <span className="ca-hero-word-item" key={word}>{word}</span>
              ))}
            </span>
          </span>
        </div>
        <p className="ca-hero-body">
          Explore public controls, baselines, STIGs, and compliance patterns —
          and generate blank RMF/ATO templates without uploading data or creating
          an account.
        </p>
        <div className="hero-actions">
          <button
            className="primary"
            onClick={() => onNavigate("start-here")}
            type="button"
          >
            Start here
          </button>
          <button
            className="secondary"
            onClick={() => onNavigate("atlas-map")}
            type="button"
          >
            Atlas Map →
          </button>
        </div>
      </section>

      <section
        aria-label="What do you want to do?"
        className="intent-grid home-card-grid"
      >
        <QuickIntentCard
          actionLabel="Open map"
          body="See how controls, baselines, CCIs, STIGs, templates, sources, and playbooks connect."
          icon={<IconMap aria-hidden="true" size={20} stroke={1.8} />}
          onClick={() => onNavigate("atlas-map")}
          title="Atlas Map"
        />
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
