import {
  IconArrowRight,
  IconBooks,
  IconCompass,
  IconRoute,
  IconSearch,
  IconTopologyStar3,
  IconUsersGroup,
} from "@tabler/icons-react";

import {
  HOME_ATLAS_AREAS,
  HOME_AUTHORITY_GROUPS,
  HOME_CONTENT,
  HOME_DESTINATIONS,
} from "../../shared/home-content.mjs";
import { AppLink } from "../components/AppLink";
import type { ViewState } from "../lib/viewState";

type HomePageProps = {
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenSearch: () => void;
};

const DESTINATION_ICONS = {
  atlas: IconTopologyStar3,
  library: IconBooks,
  resources: IconUsersGroup,
  start: IconRoute,
} as const;

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
            <p className="eyebrow">{HOME_CONTENT.eyebrow}</p>
            <h1 id="home-title">{HOME_CONTENT.headline}</h1>
            <p className="home-product-identity">{HOME_CONTENT.definition}</p>
            <p className="home-brand-line">{HOME_CONTENT.support}</p>
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

          <div className="home-primary-actions">
            <AppLink
              className="home-start-here"
              onNavigate={onNavigate}
              variant="primary"
              view="atlas-map"
            >
              <IconTopologyStar3 aria-hidden="true" size={20} stroke={1.8} />
              Explore the Atlas
            </AppLink>
            <AppLink
              className="home-inline-link"
              onNavigate={onNavigate}
              view="search"
            >
              Search the Library
            </AppLink>
          </div>
        </div>

        <aside aria-label="Federal cybersecurity ecosystem preview" className="home-ecosystem">
          <header>
            <p className="eyebrow">The ecosystem at a glance</p>
            <h2>From authority to action</h2>
          </header>
          <div className="home-ecosystem-authorities" aria-label="Authority groups">
            {HOME_AUTHORITY_GROUPS.map((group) => <span key={group}>{group}</span>)}
          </div>
          <div className="home-ecosystem-trunk">
            <IconCompass aria-hidden="true" size={19} stroke={1.8} />
            <strong>Control Atlas</strong>
            <small>connected reference system</small>
          </div>
          <div className="home-ecosystem-areas" aria-label="Cybersecurity areas">
            {HOME_ATLAS_AREAS.map((area) => <span key={area}>{area}</span>)}
          </div>
          <p>Zoom from the whole landscape to the source, relationship, or record you need.</p>
        </aside>
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

      <aside className="home-trust-boundary">
        <p>{HOME_CONTENT.trust}</p>
      </aside>
    </section>
  );
}
