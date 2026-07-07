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

type MenuPageProps = {
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
};

const MENU_CARDS = [
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

export function MenuPage(props: MenuPageProps) {
  const { onNavigate } = props;

  return (
    <section
      aria-label="What do you want to do?"
      className="intent-grid home-card-grid"
    >
      <QuickIntentCard
        actionLabel="Open map"
        body="See how controls, baselines, CCIs, STIGs, templates, sources, and playbooks connect."
        icon={<IconMap aria-hidden="true" size={20} stroke={1.8} />}
        onClick={() => onNavigate("atlas-map")}
        title="Atlas"
      />
      {MENU_CARDS.map((card) => {
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
  );
}
