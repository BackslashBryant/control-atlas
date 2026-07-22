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

      <div className="landing-launch">
        <button
          aria-describedby="landing-orb-hint"
          className="landing-orb"
          onClick={() => onNavigate("start-here")}
          type="button"
        >
          <span aria-hidden="true" className="landing-orb-circle">
            <BrandMark />
          </span>
          <span className="landing-orb-caption">Start here</span>
        </button>

        <button
          className="landing-orbit-btn landing-orbit-research"
          onClick={() => onNavigate("patterns")}
          type="button"
        >
          <strong>Plan the work</strong>
          <span>Choose a common compliance job and see what to do</span>
        </button>

        <button
          className="landing-orbit-btn landing-orbit-build"
          onClick={() => onNavigate("templates")}
          type="button"
        >
          <strong>Create a document</strong>
          <span>Open a starter file for the work in front of you</span>
        </button>

        <button
          className="landing-orbit-btn landing-orbit-navigate"
          onClick={() => onNavigate("atlas-map")}
          type="button"
        >
          <strong>Trace connections</strong>
          <span>See how controls, requirements, and evidence relate</span>
        </button>
      </div>
      <p className="visually-hidden" id="landing-orb-hint">
        Answer three questions to get a recommended framework, document, and guide.
      </p>

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
