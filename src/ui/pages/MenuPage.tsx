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
    title: "Search",
    body: "Find a control, CCI, baseline, STIG, or term with plain-language context.",
    actionLabel: "Explore",
    icon: IconSearch,
    view: "search" as const,
  },
  {
    title: "Research · Learn",
    body: "Answer three questions and get a plain-language starting point. Browse playbooks and sources.",
    actionLabel: "Start",
    icon: IconCompass,
    view: "start-here" as const,
  },
  {
    title: "Navigate Maps",
    body: "See how controls, baselines, CCIs, STIGs, templates, and playbooks connect across frameworks.",
    actionLabel: "Atlas Map",
    icon: IconMap,
    view: "atlas-map" as const,
  },
  {
    title: "Build · Create",
    body: "Generate blank RMF/ATO templates without uploading data.",
    actionLabel: "Templates",
    icon: IconFileDescription,
    view: "templates" as const,
  },
] as const;

export function MenuPage(props: MenuPageProps) {
  const { onNavigate } = props;

  return (
    <section
      aria-label="What do you want to do?"
      className="intent-grid home-card-grid"
    >
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
