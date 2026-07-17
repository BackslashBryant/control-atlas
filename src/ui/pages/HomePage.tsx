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
          framework connections, and build blank working documents without a
          login or upload.
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
          <span className="landing-orb-caption">Click to start</span>
        </button>

        <button
          className="landing-orbit-btn landing-orbit-research"
          onClick={() => onNavigate("patterns")}
          type="button"
        >
          <strong>Research</strong>
          <span>Plain-English guides to how it all works</span>
        </button>

        <button
          className="landing-orbit-btn landing-orbit-build"
          onClick={() => onNavigate("templates")}
          type="button"
        >
          <strong>Build</strong>
          <span>Create starter documents in your browser</span>
        </button>

        <button
          className="landing-orbit-btn landing-orbit-navigate"
          onClick={() => onNavigate("atlas-map")}
          type="button"
        >
          <strong>Navigate</strong>
          <span>See how everything connects</span>
        </button>
      </div>
      <p className="visually-hidden" id="landing-orb-hint">
        Answer three questions and get the best place to start.
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
