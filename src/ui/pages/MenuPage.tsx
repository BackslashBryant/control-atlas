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
import { PageHeader } from "../lib/pagePrimitives";
import type { ViewState } from "../lib/viewState";

type MenuPageProps = {
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
};

const MENU_CARDS = [
  {
    title: "Search",
    body: "Find a control, CCI, baseline, STIG, or term with plain-language context.",
    actionLabel: "Search results",
    icon: IconSearch,
    view: "search" as const,
  },
  {
    // Retitled from "Learn" (was already the card that opens Start here) to
    // avoid colliding with the Guides->Learn nav rename.
    title: "Start here",
    body: "Answer three questions and get a plain-language starting point. Browse guides and sources.",
    actionLabel: "Start",
    icon: IconCompass,
    view: "start-here" as const,
  },
  {
    title: "Navigate",
    body: "See how controls, baselines, CCIs, STIGs, templates, and guides connect across frameworks.",
    actionLabel: "Explore",
    icon: IconMap,
    view: "atlas-map" as const,
  },
  {
    title: "Build",
    body: "Create starter compliance documents — nothing you type ever leaves your browser.",
    actionLabel: "Templates",
    icon: IconFileDescription,
    view: "templates" as const,
  },
] as const;

export function MenuPage(props: MenuPageProps) {
  const { onNavigate } = props;

  return (
    <>
      <PageHeader
        eyebrow="Menu"
        summary="Pick a workspace to start from. Each one focuses on a different part of federal compliance."
        title="What do you want to do?"
      />
      <section
        aria-label="Workspaces"
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
    </>
  );
}
