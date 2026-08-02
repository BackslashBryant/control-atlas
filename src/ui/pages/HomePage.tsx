import {
  IconBooks,
  IconExternalLink,
  IconMap2,
  IconSearch,
} from "@tabler/icons-react";
import { useState } from "react";

import treeSpine from "../../../data/curated/tree-spine.json";
import {
  PRODUCT_DECISION_BOUNDARY,
  PRODUCT_HERO,
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
    description:
      "For when you do not know which publication covers your question. Start from the nine areas and narrow down.",
    icon: IconMap2,
    view: "atlas-map",
  },
  {
    label: "Browse Catalog",
    description:
      "For when you already know the publication or the control ID and want to go straight to it.",
    icon: IconBooks,
    view: "catalog-detail",
  },
  {
    label: "Find Tools & Resources",
    description:
      "For when the official text is not the thing you need — templates, tooling, training, communities.",
    icon: IconExternalLink,
    view: "commons",
  },
] as const;

const AREA_LABELS = treeSpine.limbs.map((area) => area.label);

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

      {/* The trunk/limb spine shipped in Part A (data/curated/tree-spine.json).
          Home shows it so the shape of the whole corpus is visible before the
          visitor commits to a click. */}
      <section aria-labelledby="home-spine-title" className="home-spine">
        <h2 id="home-spine-title">Everything here, in nine areas</h2>
        <p>
          Every publication, setting and procedure belongs to one of them.
        </p>
        <ul className="home-spine-limbs">
          {AREA_LABELS.map((label) => (
            <li key={label}>
              <button onClick={() => onNavigate("atlas-map")} type="button">
                {label}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <aside className="home-trust-boundary">
        <p>No account or uploads. {PRODUCT_DECISION_BOUNDARY}</p>
        <button onClick={() => onNavigate("start-here")} type="button">
          Browse publications
        </button>
      </aside>
    </section>
  );
}
