import {
  IconClipboardList,
  IconCompass,
  IconGitCompare,
  IconMap2,
  IconSearch,
} from "@tabler/icons-react";
import { useState } from "react";

import { PRODUCT_HERO } from "../../shared/product-identity";
import { Button, Input } from "../components/lsm";
import { HomeChainPreview } from "../components/HomeChainPreview";
import type { ViewState } from "../lib/viewState";

type HomePageProps = {
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
};

// Three distinct jobs. Searching is the field above, so no card repeats it.
const HOME_ENTRANCES = [
  {
    label: "Follow implementation",
    description:
      "See how a requirement connects to CCIs, SRGs, STIGs, and technical checks.",
    icon: IconMap2,
    view: "atlas-map",
  },
  {
    label: "Compare guidance",
    description:
      "See where two publications align and where no published mapping exists.",
    icon: IconGitCompare,
    view: "matrix",
  },
  {
    label: "Start a document",
    description: "Build a clean draft from the sources and inputs you select.",
    icon: IconClipboardList,
    view: "templates",
  },
] as const;

export function HomePage({ onNavigate }: HomePageProps) {
  const [searchDraft, setSearchDraft] = useState("");

  return (
    <section className="home-entry" aria-labelledby="home-title">
      <div className="home-hero">
      <div className="home-hero-lead">
      <header className="home-entry-header">
        <h1 id="home-title">
          Federal cyber guidance is scattered. The work still has to get done.
        </h1>
        <p className="home-product-identity">{PRODUCT_HERO}</p>
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
          aria-label="Search published records"
          onChange={(event) => setSearchDraft(event.target.value)}
          placeholder="Search AC-2, FedRAMP, CCIs, STIGs, reciprocity…"
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
          Start here
        </Button>
        <button
          className="home-inline-link"
          onClick={() => onNavigate("catalog-detail", { catalog: "" })}
          type="button"
        >
          Browse the Library
        </button>
        <p className="home-start-here-hint">
          Not sure where to begin? Start with the work in front of you.
        </p>
      </div>
      </div>

      <HomeChainPreview onNavigate={onNavigate} />
      </div>

      <nav aria-label="Ways to begin" className="home-secondary-grid">
        {HOME_ENTRANCES.map((entrance) => {
          const Icon = entrance.icon;
          return (
            <button
              className="home-secondary-action"
              key={entrance.label}
              onClick={() => onNavigate(entrance.view)}
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

      <aside className="home-trust-boundary">
        <p>
          Public sources only. No account, no uploads, and no organizational
          data.
        </p>
      </aside>
    </section>
  );
}
