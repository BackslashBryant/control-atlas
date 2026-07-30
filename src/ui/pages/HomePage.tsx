import {
  IconBooks,
  IconExternalLink,
  IconMap2,
  IconSearch,
} from "@tabler/icons-react";
import { useState } from "react";

import {
  PRODUCT_DECISION_BOUNDARY,
  PRODUCT_DEFINITION,
} from "../../shared/product-identity";
import { BrandFlourish, BrandMark } from "../components/BrandLockup";
import { Button, Input } from "../components/lsm";
import type { ViewState } from "../lib/viewState";

type HomePageProps = {
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
};

const HOME_ENTRANCES = [
  {
    label: "Open the Atlas",
    description: "Trace published hierarchy and relationships.",
    icon: IconMap2,
    view: "atlas-map",
  },
  {
    label: "Browse Catalog",
    description: "Browse every published record in the catalog.",
    icon: IconBooks,
    view: "catalog-detail",
  },
  {
    label: "Find Tools & Resources",
    description: "Find external tools, templates, data, training, and communities.",
    icon: IconExternalLink,
    view: "commons",
  },
] as const;

export function HomePage({ onNavigate }: HomePageProps) {
  const [searchDraft, setSearchDraft] = useState("");

  return (
    <section className="home-entry" aria-labelledby="home-title">
      <header className="home-entry-header">
        <div className="home-entry-brand">
          <BrandMark />
          <h1 id="home-title">Control Atlas</h1>
        </div>
        <BrandFlourish />
        <p className="home-product-identity">{PRODUCT_DEFINITION}</p>
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
          placeholder="Search by identifier or topic"
          type="search"
          value={searchDraft}
        />
        <Button type="submit" variant="primary">
          Search
        </Button>
      </form>

      <nav aria-label="Other ways to begin" className="home-secondary-grid">
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
        <p>No account or uploads. {PRODUCT_DECISION_BOUNDARY}</p>
        <button onClick={() => onNavigate("start-here")} type="button">
          Browse publications
        </button>
      </aside>
    </section>
  );
}
