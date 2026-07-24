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
      <div
        aria-hidden="true"
        className="landing-registration-mark landing-registration-mark--north"
      >
        CATL / PUBLIC REFERENCE / 01
      </div>

      <div className="landing-signal-grid">
        <div className="landing-brand">
          <p className="eyebrow">Depth 0 · Signal</p>
          <div className="landing-brand-row">
            <BrandMark />
            <h1 className="landing-brand-name">Control Atlas</h1>
          </div>
          <BrandFlourish />
          <p className="landing-tagline">
            The public map for federal cyber compliance. Search controls, trace
            framework connections, and create starter documents.
          </p>
        </div>

        <aside
          aria-label="Current product state"
          className="landing-signal-panel"
        >
          <span className="landing-signal-status">
            <span aria-hidden="true" />
            Public reference workspace
          </span>
          <dl>
            <div>
              <dt>Access</dt>
              <dd>No login or uploads</dd>
            </div>
            <div>
              <dt>Sources</dt>
              <dd>Traceable to publishers</dd>
            </div>
            <div>
              <dt>Output</dt>
              <dd>Created in your browser</dd>
            </div>
          </dl>
          <button
            aria-describedby="landing-primary-hint"
            className="primary landing-primary-action"
            onClick={() => onNavigate("start-here")}
            type="button"
          >
            Start guided setup
          </button>
          <p id="landing-primary-hint">
            Answer three questions to find a practical starting path.
          </p>
        </aside>
      </div>

      <div className="landing-workbench">
        <div className="landing-search-copy">
          <p className="eyebrow">Already know what you need?</p>
          <h2>Find a control, topic, or identifier.</h2>
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
              onBlur={() => setSearchFocused(false)}
              onChange={(event) => setSearchDraft(event.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Try AC-2, encryption, passwords…"
              type="search"
              value={searchDraft}
            />
            <button className="home-search-submit" type="submit">
              Search
            </button>
          </form>
        </div>
      </div>

      <details className="landing-more-paths">
        <summary>Open another workspace</summary>
        <div className="landing-path-grid">
          <button
            className="landing-orbit-btn"
            onClick={() => onNavigate("patterns")}
            type="button"
          >
            <strong>Plan the work</strong>
            <span>Choose a common compliance job and see what to do.</span>
          </button>
          <button
            className="landing-orbit-btn"
            onClick={() => onNavigate("templates")}
            type="button"
          >
            <strong>Create a document</strong>
            <span>Open a starter file for the work in front of you.</span>
          </button>
          <button
            className="landing-orbit-btn"
            onClick={() => onNavigate("atlas-map")}
            type="button"
          >
            <strong>Trace connections</strong>
            <span>See how controls, requirements, and evidence relate.</span>
          </button>
        </div>
      </details>

      <div className="landing-trust-row">
        <p className="landing-trust-lead">
          Review the product boundary and source record before relying on a
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

      <div
        aria-hidden="true"
        className="landing-registration-mark landing-registration-mark--south"
      >
        ORIENT / WORK / VERIFY
      </div>
    </section>
  );
}
