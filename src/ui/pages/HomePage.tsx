import { IconSearch } from "@tabler/icons-react";
import { useState } from "react";

import { BrandFlourish, BrandMark } from "../components/BrandLockup";
import type { ViewState } from "../lib/viewState";

type HomePageProps = {
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
};

export function HomePage(props: HomePageProps) {
  const { onNavigate } = props;
  const [searchDraft, setSearchDraft] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <section className="landing-hero">
      <div className="landing-brand">
        <div className="landing-brand-row">
          <BrandMark />
          <h1 className="landing-brand-name">Control Atlas</h1>
        </div>
        <BrandFlourish />
        <p className="landing-tagline">
          The public map for federal cyber compliance. Search controls, trace
          framework connections, create starter documents.
        </p>
      </div>

      <div
        className={`landing-search-container ${searchFocused ? "search-focused" : ""}`}
      >
        <form
          className="home-search"
          onSubmit={(event) => {
            event.preventDefault();
            const query = searchDraft.trim();
            if (!query) return;
            onNavigate("search", { query });
          }}
          role="search"
        >
          <IconSearch
            aria-hidden="true"
            className="home-search-icon"
            size={24}
            stroke={1.5}
          />
          <input
            aria-label="Search controls, baselines, CCIs, STIGs, and terms"
            onChange={(event) => setSearchDraft(event.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search anything — account management, AC-2, FedRAMP High…"
            type="search"
            value={searchDraft}
          />
          <button className="home-search-submit" type="submit">
            Search
          </button>
        </form>
      </div>

      <div className="landing-actions">
        <button
          className="primary landing-primary-action"
          onClick={() => onNavigate("start-here")}
          type="button"
        >
          Find where to start
        </button>
        <p>Answer three questions to get a recommended framework, document, and playbook.</p>
      </div>

      <details className="landing-more-paths">
        <summary>Other ways to use Control Atlas</summary>
        <div className="landing-path-grid">
          <button className="secondary" onClick={() => onNavigate("patterns")} type="button">
            Learn the basics
          </button>
          <button className="secondary" onClick={() => onNavigate("atlas-map")} type="button">
            Explore connections
          </button>
          <button className="secondary" onClick={() => onNavigate("templates")} type="button">
            Create a starter document
          </button>
        </div>
      </details>

      <div className="landing-trust-row">
        <p className="landing-trust-lead">
          New here? Read what this tool is and is not before you rely on a
          match.
        </p>
        <div className="landing-trust-links">
          <button
            className="landing-trust-link"
            onClick={() => onNavigate("about")}
            type="button"
          >
            About this tool
          </button>
          <button
            className="landing-trust-link"
            onClick={() => onNavigate("sources")}
            type="button"
          >
            Review sources
          </button>
        </div>
      </div>
    </section>
  );
}
