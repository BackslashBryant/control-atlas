import {
  IconArrowRight,
  IconBooks,
  IconRocket,
  IconSearch,
  IconTopologyStar3,
  IconUsersGroup,
} from "@tabler/icons-react";

import { HOME_CONTENT, HOME_DESTINATIONS } from "../../shared/home-content.mjs";
import { AppLink } from "../components/AppLink";
import { HOME_LIBRARY_DISCOVERY } from "../lib/homeTagConstellation";
import type { ViewState } from "../lib/viewState";

type HomePageProps = {
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenSearch: () => void;
};

const DESTINATION_ICONS = {
  "start-here": IconRocket,
  atlas: IconTopologyStar3,
  library: IconBooks,
  resources: IconUsersGroup,
} as const;

export function HomePage({ onNavigate, onOpenSearch }: HomePageProps) {
  return (
    <section
      aria-labelledby="home-title"
      className="home-entry"
      data-template="B"
      data-visual-identity="universal-front-door"
    >
      <div className="home-hero">
        <div className="home-hero-lead">
          <header className="home-entry-header">
            <h1 id="home-title">{HOME_CONTENT.headline}</h1>
            <p className="home-product-identity">{HOME_CONTENT.definition}</p>
          </header>

          <button
            aria-label="Search Control Atlas"
            className="home-search home-search-trigger"
            onClick={onOpenSearch}
            type="button"
          >
            <IconSearch aria-hidden="true" size={20} stroke={2} />
            <span>{HOME_CONTENT.searchPlaceholder}</span>
            <span className="home-search-trigger__action">Search</span>
          </button>

        </div>
      </div>

      <nav aria-label="Choose a Control Atlas destination" className="home-secondary-grid">
        {HOME_DESTINATIONS.map((destination) => {
          const Icon = DESTINATION_ICONS[destination.id as keyof typeof DESTINATION_ICONS];
          return (
            <AppLink
              className="home-secondary-action"
              key={destination.id}
              onNavigate={onNavigate}
              view={destination.view as ViewState["view"]}
            >
              <Icon aria-hidden="true" size={20} stroke={1.7} />
              <span>
                <strong>{destination.label}</strong>
                <small>{destination.description}</small>
              </span>
              <IconArrowRight aria-hidden="true" className="home-secondary-arrow" size={16} stroke={2} />
            </AppLink>
          );
        })}
      </nav>

      <nav aria-labelledby="home-library-heading" className="home-library-discovery">
        <div className="home-library-discovery__heading">
          <div>
            <p className="eyebrow">EXPLORE THE LIBRARY</p>
            <h2 id="home-library-heading">See what's inside Control Atlas.</h2>
          </div>
          <AppLink className="home-library-discovery__all" onNavigate={onNavigate} view="search">
            Browse all tags
            <IconArrowRight aria-hidden="true" size={16} stroke={2} />
          </AppLink>
        </div>
        <ul className="home-library-kpis">
          {HOME_LIBRARY_DISCOVERY.map((item) => (
            <li key={item.id}>
              <AppLink
                className="home-library-kpi"
                onNavigate={onNavigate}
                patch={item.patch}
                view="search"
              >
                <strong>{item.count.toLocaleString("en-US")}</strong>
                <span>
                  <b>{item.label}</b>
                  <small>{item.description}</small>
                </span>
                <IconArrowRight aria-hidden="true" size={16} stroke={2} />
              </AppLink>
            </li>
          ))}
        </ul>
      </nav>

    </section>
  );
}
