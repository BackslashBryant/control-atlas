import {
  IconBinaryTree,
  IconBriefcase,
  IconClipboardList,
  IconCompass,
  IconFileSearch,
  IconRadar,
  IconSearch,
  IconShieldLock,
  IconTool,
} from "@tabler/icons-react";

import {
  GLOBAL_SEARCH_PLACEHOLDER,
  PRODUCT_HERO,
} from "../../shared/product-identity";
import { labelForGoal } from "../../app/start-here-guide.mjs";
import { HomeCapabilityPreviews } from "../components/HomeCapabilityPreviews";
import { AppLink } from "../components/AppLink";
import type { ViewState } from "../lib/viewState";

type HomePageProps = {
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenSearch: () => void;
};

// Work-first entrances. Each route carries useful state so a person lands in
// the relevant workflow without first learning Control Atlas's feature names.
const HOME_ENTRANCES = [
  {
    label: labelForGoal("understand"),
    description:
      "Start with controls and requirements, then keep the source attached.",
    icon: IconFileSearch,
    view: "start-here",
    patch: { goal: "understand" },
  },
  {
    label: labelForGoal("implement"),
    description:
      "Move from requirements into implementation work and technical checks.",
    icon: IconShieldLock,
    view: "start-here",
    patch: { goal: "implement" },
  },
  {
    label: labelForGoal("assess"),
    description:
      "Open the assessment path, published methods, and package work.",
    icon: IconBinaryTree,
    view: "start-here",
    patch: { goal: "assess" },
  },
  {
    label: labelForGoal("operate"),
    description:
      "Explore adversary techniques, defenses, monitoring, and operations.",
    icon: IconRadar,
    view: "start-here",
    patch: { goal: "operate" },
  },
  {
    label: labelForGoal("risk"),
    description:
      "Find requirements, CUI and CMMC material, SBOM resources, and assurance tools.",
    icon: IconBriefcase,
    view: "start-here",
    patch: { goal: "risk" },
  },
  {
    label: labelForGoal("document"),
    description: "Choose the work product first, then add source context.",
    icon: IconClipboardList,
    view: "start-here",
    patch: { goal: "document" },
  },
  {
    label: labelForGoal("tools"),
    description:
      "Search the practitioner ecosystem without mixing it into publisher hierarchy.",
    icon: IconTool,
    view: "start-here",
    patch: { goal: "tools" },
  },
] as const;

export function HomePage({ onNavigate, onOpenSearch }: HomePageProps) {
  return (
    <section
      aria-labelledby="home-title"
      className="home-entry"
      data-visual-identity="universal-front-door"
    >
      <div className="home-hero">
        <div className="home-hero-lead">
          <header className="home-entry-header">
            <h1 id="home-title">
              Find the source. See what connects. Keep the work moving.
            </h1>
            <p className="home-product-identity">
              Govern, secure, assess, operate, and defend systems from one
              public, source-traceable workbench.
            </p>
            <p className="home-brand-line">{PRODUCT_HERO}</p>
          </header>

          <button
            aria-label="Search Control Atlas"
            className="home-search home-search-trigger"
            onClick={onOpenSearch}
            type="button"
          >
            <IconSearch aria-hidden="true" size={20} stroke={2} />
            <span>{GLOBAL_SEARCH_PLACEHOLDER}</span>
            <span className="home-search-trigger__action">Search</span>
          </button>

          <div className="home-primary-actions">
            <AppLink
              className="home-start-here"
              onNavigate={onNavigate}
              variant="primary"
              view="start-here"
            >
              <IconCompass aria-hidden="true" size={20} stroke={1.8} />
              Start with your work
            </AppLink>
            <AppLink
              className="home-inline-link"
              onNavigate={onNavigate}
              view="search"
            >
              Browse official publications
            </AppLink>
          </div>
        </div>

      </div>

      <nav aria-label="Start from your work" className="home-secondary-grid">
        {HOME_ENTRANCES.map((entrance) => {
          const Icon = entrance.icon;
          return (
            <AppLink
              className="home-secondary-action"
              key={entrance.label}
              onNavigate={onNavigate}
              patch={entrance.patch}
              view={entrance.view}
            >
              <Icon aria-hidden="true" size={20} stroke={1.7} />
              <span>
                <strong>{entrance.label}</strong>
                <small>{entrance.description}</small>
              </span>
            </AppLink>
          );
        })}
      </nav>

      <HomeCapabilityPreviews onNavigate={onNavigate} />

      <aside className="home-trust-boundary">
        <p>
          Official public material stays primary and attributed. Control Atlas
          suggestions are labeled, kept separate from links found in published
          sources, and never decide applicability or compliance.
        </p>
      </aside>
    </section>
  );
}
