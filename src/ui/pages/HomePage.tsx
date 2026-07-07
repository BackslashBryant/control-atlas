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
    <section className="landing-hero dot-grid">
      {/* Radial glow backdrop */}
      <div aria-hidden="true" className="landing-glow-backdrop" />

      <div className="landing-brand">
        <div className="landing-wordmark">
          <BrandMark />
          <h1 className="landing-brand-name">Control Atlas</h1>
        </div>
        <BrandFlourish />
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
          <IconSearch aria-hidden="true" className="home-search-icon" size={20} stroke={1.8} />
          <input
            aria-label="Search controls, baselines, CCIs, STIGs, and terms"
            onChange={(event) => setSearchDraft(event.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search anything — account management, AC-2, FedRAMP High…"
            type="search"
            value={searchDraft}
          />
          <button type="submit">
            Search
          </button>
        </form>
        {/* Accent line under search on focus */}
        <div aria-hidden="true" className="search-accent-line" />
      </div>

      <div className="landing-cta-row">
        <button
          className="landing-pill"
          onClick={() => onNavigate("search", {})}
          type="button"
        >
          Research
        </button>

        <button
          aria-label="Start — see where to begin"
          className="landing-launch"
          onClick={() => onNavigate("menu")}
          type="button"
        >
          <span aria-hidden="true" className="landing-launch-ring">
            <BrandMark />
          </span>
          <span className="landing-launch-caption">click to start</span>
        </button>

        <button
          className="landing-pill"
          onClick={() => onNavigate("templates")}
          type="button"
        >
          Build
        </button>
      </div>

      <div className="landing-navigate-row">
        <button
          className="landing-pill sm"
          onClick={() => onNavigate("atlas-map")}
          type="button"
        >
          Navigate
        </button>
      </div>
    </section>
  );
}
