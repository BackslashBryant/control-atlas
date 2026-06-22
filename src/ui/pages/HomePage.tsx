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
  heroWord: string;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
};

const HOME_CARDS = [
  {
    title: "Where do I begin?",
    body: "Answer three questions and get a plain-language starting point.",
    actionLabel: "Start",
    icon: IconCompass,
    view: "start-here" as const,
  },
  {
    title: "What does this control mean?",
    body: "Find a control, CCI, baseline, STIG, or term with plain-language context.",
    actionLabel: "Explore",
    icon: IconSearch,
    view: "search" as const,
  },
  {
    title: "How do these frameworks relate?",
    body: "Compare public mappings and see what overlaps or needs review.",
    actionLabel: "Compare",
    icon: IconGitCompare,
    view: "matrix" as const,
  },
  {
    title: "How does this process work?",
    body: "Use task-focused playbooks for common compliance problems.",
    actionLabel: "Playbooks",
    icon: IconBook2,
    view: "patterns" as const,
  },
  {
    title: "What do I need to produce?",
    body: "Generate blank RMF/ATO templates without uploading data.",
    actionLabel: "Templates",
    icon: IconFileDescription,
    view: "templates" as const,
  },
  {
    title: "Why trust this mapping?",
    body: "Review sources, versions, and provenance for every link.",
    actionLabel: "Sources",
    icon: IconSourceCode,
    view: "sources" as const,
  },
] as const;

export function HomePage(props: HomePageProps) {
  const { heroWord, onNavigate } = props;

  return (
    <>
      <section className="hero home-hero">
        <h1>Control Atlas</h1>
        <div
          aria-label="Ctrl Alt Comply"
          className="ca-hero-tagline hero-tagline"
        >
          <span className="ca-hero-prefix">Ctrl+Alt+</span>
          <span aria-hidden="true" className="ca-hero-word">
            {heroWord}
          </span>
        </div>
        <p className="ca-hero-sub">
          The public map for federal cyber compliance.
        </p>
        <p className="ca-hero-body">
          Explore public controls, baselines, STIGs, and compliance patterns —
          and generate blank RMF/ATO templates without uploading data or creating
          an account.
        </p>
        <div className="hero-actions">
          <button
            className="ca-btn ca-btn--primary primary"
            onClick={() => onNavigate("atlas-map")}
            type="button"
          >
            Atlas Map →
          </button>
          <button
            className="ca-btn ca-btn--ghost secondary"
            onClick={() => onNavigate("start-here")}
            type="button"
          >
            Start
          </button>
          <button
            className="ca-btn ca-btn--ghost secondary quiet"
            onClick={() => onNavigate("search")}
            type="button"
          >
            Explore
          </button>
        </div>
      </section>

      <section
        aria-label="Explore Control Atlas"
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
