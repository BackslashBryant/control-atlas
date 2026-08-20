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
import { HOME_TAG_GROUPS } from "../lib/homeTagConstellation";
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

      <nav aria-labelledby="home-tag-heading" className="home-tag-constellation">
        <div className="home-tag-constellation__heading">
          <div>
            <h2 id="home-tag-heading">Browse by tag</h2>
            <p>A small sample from the Library.</p>
          </div>
          <AppLink className="home-tag-constellation__all" onNavigate={onNavigate} view="search">
            See all tags
            <IconArrowRight aria-hidden="true" size={16} stroke={2} />
          </AppLink>
        </div>
        <div className="home-tag-galaxies">
          {HOME_TAG_GROUPS.map((group) => (
            <section aria-labelledby={`home-tag-group-${group.id}`} className="home-tag-galaxy" data-tag-dimension={group.id} key={group.id}>
              <h3 id={`home-tag-group-${group.id}`}>{group.label}</h3>
              <ul>
                {group.tags.map((tag) => (
                  <li key={tag.id}>
                    <AppLink
                      className="home-tag-link"
                      onNavigate={onNavigate}
                      patch={{ tags: [tag.id] }}
                      view="search"
                    >
                      <span className="home-tag-link__label">{tag.label}</span>
                    </AppLink>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </nav>

    </section>
  );
}
