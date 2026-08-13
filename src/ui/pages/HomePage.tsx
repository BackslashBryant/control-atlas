import {
  IconArrowRight,
  IconBooks,
  IconSearch,
  IconTopologyStar3,
  IconUsersGroup,
} from "@tabler/icons-react";
import type { CSSProperties } from "react";

import { HOME_CONTENT, HOME_DESTINATIONS } from "../../shared/home-content.mjs";
import { AppLink } from "../components/AppLink";
import { AREA_BROWSE_PRESENTATIONS, areaCssVariables } from "../lib/areaVisualLanguage";
import type { ViewState } from "../lib/viewState";

type HomeAreaStyle = CSSProperties & {
  "--area-scale": number;
  "--ca-area-color": string;
  "--ca-area-color-on-light": string;
  "--ca-area-color-on-dark": string;
};

type HomePageProps = {
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenSearch: () => void;
};

const DESTINATION_ICONS = {
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

      <nav aria-labelledby="home-area-heading" className="home-area-browse">
        <div className="home-area-browse__heading">
          <h2 id="home-area-heading">Browse by area</h2>
          <p>Size reflects record count.</p>
        </div>
        <ul className="home-ecosystem-areas" data-area-count-scale="logarithmic">
          {AREA_BROWSE_PRESENTATIONS.map((area) => (
            <li key={area.id}>
              <AppLink
                aria-label={`${area.label}, ${area.recordCount.toLocaleString()} records`}
                className="home-area-link"
                data-record-count={area.recordCount}
                onNavigate={onNavigate}
                patch={{ area: area.id }}
                style={{ ...areaCssVariables(area), "--area-scale": area.scale } as HomeAreaStyle}
                view="search"
              >
                <span className="home-area-link__label">{area.label}</span>
                <span aria-hidden="true" className="home-area-link__count">{area.recordCount.toLocaleString()}</span>
              </AppLink>
            </li>
          ))}
        </ul>
      </nav>

    </section>
  );
}
