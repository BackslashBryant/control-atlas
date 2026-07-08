import { IconSearch, IconBook, IconMap, IconLayoutList } from "@tabler/icons-react";
import { useState } from "react";

import { BrandMark } from "../components/BrandLockup";
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
        <BrandMark />
        <h1 className="landing-brand-name">Control Atlas</h1>
        <p className="landing-tagline">
          The public map for federal cyber compliance.
        </p>
      </div>

      <div className={`landing-search-container ${searchFocused ? "search-focused" : ""}`}>
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
          <IconSearch aria-hidden="true" className="home-search-icon" size={24} stroke={1.5} />
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

      <div className="landing-intents">
        <button aria-label="Research & Learn" className="landing-intent-card" onClick={() => onNavigate("start-here")} type="button">
          <div className="intent-icon-wrapper">
             <IconBook size={24} stroke={1.5} />
          </div>
          <div className="intent-content">
            <h3 aria-hidden="true">Research &middot; Learn</h3>
            <p aria-hidden="true">Understand controls, baselines, and get practical advice.</p>
          </div>
        </button>

        <button aria-label="Navigate Maps" className="landing-intent-card" onClick={() => onNavigate("atlas-map")} type="button">
          <div className="intent-icon-wrapper">
             <IconMap size={24} stroke={1.5} />
          </div>
          <div className="intent-content">
            <h3 aria-hidden="true">Navigate Maps</h3>
            <p aria-hidden="true">Explore connections across frameworks and STIGs.</p>
          </div>
        </button>

        <button aria-label="Build & Create" className="landing-intent-card" onClick={() => onNavigate("templates")} type="button">
          <div className="intent-icon-wrapper">
             <IconLayoutList size={24} stroke={1.5} />
          </div>
          <div className="intent-content">
            <h3 aria-hidden="true">Build &middot; Create</h3>
            <p aria-hidden="true">Generate templates and RMF packages instantly.</p>
          </div>
        </button>
      </div>
    </section>
  );
}
