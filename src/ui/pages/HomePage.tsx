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
import { useState } from "react";

import { PRODUCT_HERO } from "../../shared/product-identity";
import { HomeCapabilityPreviews } from "../components/HomeCapabilityPreviews";
import { Button, Input } from "../components/lsm";
import type { ViewState } from "../lib/viewState";

type HomePageProps = {
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
};

// Work-first entrances. Each route carries useful state so a person lands in
// the relevant workflow without first learning Control Atlas's feature names.
const HOME_ENTRANCES = [
  {
    label: "Understand a requirement",
    description:
      "Start with controls and requirements, then keep the source attached.",
    icon: IconFileSearch,
    view: "start-here",
    patch: { goal: "understand" },
  },
  {
    label: "Secure or build a system",
    description:
      "Move from requirements into implementation work and technical checks.",
    icon: IconShieldLock,
    view: "start-here",
    patch: { goal: "implement" },
  },
  {
    label: "Assess or authorize",
    description:
      "Open the assessment path, published methods, and package work.",
    icon: IconBinaryTree,
    view: "start-here",
    patch: { goal: "assess" },
  },
  {
    label: "Operate or defend",
    description:
      "Explore adversary techniques, defenses, monitoring, and operations.",
    icon: IconRadar,
    view: "atlas-map",
    patch: { atlasLimb: "atlas:LIMB-THREAT" },
  },
  {
    label: "Manage risk or supply chain",
    description:
      "Find requirements, CUI and CMMC material, SBOM resources, and assurance tools.",
    icon: IconBriefcase,
    view: "search",
    patch: { query: "supply chain" },
  },
  {
    label: "Produce a document",
    description: "Choose the work product first, then add source context.",
    icon: IconClipboardList,
    view: "templates",
    patch: { buildSection: "documents" },
  },
  {
    label: "Find a tool, template, portal, training source, or community",
    description:
      "Search the practitioner ecosystem without mixing it into publisher hierarchy.",
    icon: IconTool,
    view: "commons",
    patch: { showAll: "true" },
  },
] as const;

export function HomePage({ onNavigate }: HomePageProps) {
  const [searchDraft, setSearchDraft] = useState("");

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

          <form
            className="home-search"
            onSubmit={(event) => {
              event.preventDefault();
              const query = searchDraft.trim();
              if (query) onNavigate("search", { query });
            }}
            role="search"
          >
            <IconSearch aria-hidden="true" size={20} stroke={2} />
            <Input
              aria-label="Search Control Atlas"
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search controls, clauses, STIGs, ATT&CK, guides, tools, or communities…"
              type="search"
              value={searchDraft}
            />
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>

          <div className="home-primary-actions">
            <Button
              className="home-start-here"
              onClick={() => onNavigate("start-here")}
              type="button"
              variant="primary"
            >
              <IconCompass aria-hidden="true" size={20} stroke={1.8} />
              Start with your work
            </Button>
            <button
              className="home-inline-link"
              onClick={() => onNavigate("catalog-detail", { catalog: "" })}
              type="button"
            >
              Browse official publications
            </button>
          </div>
        </div>

        <div className="home-work-map" aria-label="The work Control Atlas covers">
          <span>Govern</span>
          <span>Build</span>
          <span>Assess</span>
          <span>Operate</span>
          <span>Defend</span>
        </div>
      </div>

      <nav aria-label="Start from your work" className="home-secondary-grid">
        {HOME_ENTRANCES.map((entrance) => {
          const Icon = entrance.icon;
          return (
            <button
              className="home-secondary-action"
              key={entrance.label}
              onClick={() => onNavigate(entrance.view, entrance.patch)}
              type="button"
            >
              <Icon aria-hidden="true" size={20} stroke={1.7} />
              <span>
                <strong>{entrance.label}</strong>
                <small>{entrance.description}</small>
              </span>
            </button>
          );
        })}
      </nav>

      <HomeCapabilityPreviews onNavigate={onNavigate} />

      <aside className="home-trust-boundary">
        <p>
          Official public material stays primary and attributed. Control Atlas
          suggestions are labeled, never added to the published graph, and
          never decide applicability or compliance.
        </p>
      </aside>
    </section>
  );
}
