import { useEffect, useState } from "react";
import { IconSearch } from "@tabler/icons-react";

import {
  activeNavForState,
  MORE_NAV_ITEM,
  PRIMARY_NAV_ITEMS,
  SECONDARY_NAV_ITEMS,
} from "../lib/navigation";
import type { ViewState } from "../lib/viewState";
import type { RuntimeBundle } from "../lib/runtimeLoader";

const BRAND_WORDS = ["Comply", "Map", "Navigate", "Audit"];

type TopNavProps = {
  bundle: RuntimeBundle | null;
  introVisible: boolean;
  viewState: ViewState;
  headerSearchDraft: string;
  onHeaderSearchDraftChange: (value: string) => void;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenSearch: () => void;
  onOpenHelp: () => void;
  onOpenGlossary: () => void;
};

export function TopNav(props: TopNavProps) {
  const {
    bundle,
    introVisible,
    viewState,
    headerSearchDraft,
    onHeaderSearchDraftChange,
    onNavigate,
    onOpenSearch,
    onOpenHelp,
    onOpenGlossary,
  } = props;

  const activeNav = activeNavForState(viewState);
  const [moreOpen, setMoreOpen] = useState(false);
  const MoreIcon = MORE_NAV_ITEM.icon;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [wordIdx, setWordIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) return;
    let swapTimer: number | undefined;
    const interval = window.setInterval(() => {
      setFading(true);
      swapTimer = window.setTimeout(() => {
        setWordIdx((i) => (i + 1) % BRAND_WORDS.length);
        setFading(false);
      }, 200);
    }, 2500);
    return () => {
      window.clearInterval(interval);
      if (swapTimer !== undefined) window.clearTimeout(swapTimer);
    };
  }, [prefersReducedMotion]);
  const rotatingWord = BRAND_WORDS[wordIdx];

  function navigateFromMenu(view: ViewState["view"]) {
    setMoreOpen(false);
    onNavigate(view);
  }

  return (
    <header
      aria-hidden={introVisible || undefined}
      className="site-header"
      hidden={introVisible}
    >
      <button
        aria-label="Control Atlas — home"
        className="brand"
        onClick={() => onNavigate("home")}
        type="button"
      >
        <span className="brand-kbd" aria-hidden="true">
          <span className="brand-key">Ctrl</span>
          <span className="brand-plus">+</span>
          <span className="brand-key">Alt</span>
          <span className="brand-plus">+</span>
          <span className="brand-key brand-key--active">
            <span className={`brand-key-word${fading ? " fading" : ""}`}>
              {rotatingWord}
            </span>
          </span>
        </span>
        <span className="brand-sub">Control Atlas</span>
      </button>
      <nav aria-label="Primary navigation" className="primary-nav">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeNav === item.view;
          return (
            <button
              aria-current={active ? "page" : undefined}
              className={active ? "active nav-active" : ""}
              data-atlas={item.view === "atlas-map" ? "" : undefined}
              key={item.label}
              onClick={() => onNavigate(item.view)}
              type="button"
            >
              <Icon aria-hidden="true" size={16} stroke={1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          aria-expanded={moreOpen}
          aria-haspopup="menu"
          className={SECONDARY_NAV_ITEMS.some((item) => item.view === activeNav) ? "active nav-active" : ""}
          onClick={() => setMoreOpen((current) => !current)}
          type="button"
        >
          <MoreIcon aria-hidden="true" size={16} stroke={1.8} />
          <span>{MORE_NAV_ITEM.label}</span>
        </button>
        {moreOpen ? (
          <div className="nav-more-menu" role="menu">
            {SECONDARY_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeNav === item.view;
              return (
                <button
                  aria-current={active ? "page" : undefined}
                  className={active ? "active nav-active" : ""}
                  key={item.label}
                  onClick={() => navigateFromMenu(item.view)}
                  role="menuitem"
                  type="button"
                >
                  <Icon aria-hidden="true" size={16} stroke={1.8} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </nav>
      <div className="header-actions">
        {bundle ? (
          <form
            className="header-search"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const input = form.querySelector<HTMLInputElement>("#header-search");
              const query = input?.value.trim() ?? headerSearchDraft.trim();
              onHeaderSearchDraftChange(query);
              onNavigate("search", {
                query,
                filter: "",
                objectType: "",
                sourceClass: "",
                controlFamily: "",
                severity: "",
              });
            }}
          >
            <label className="visually-hidden" htmlFor="header-search">
              Search records and glossary
            </label>
            <div className="search-input">
              <IconSearch aria-hidden="true" size={18} stroke={1.8} />
              <input
                aria-label="Search records and glossary"
                id="header-search"
                onChange={(event) => onHeaderSearchDraftChange(event.target.value)}
                placeholder="Search records or glossary"
                type="search"
                value={headerSearchDraft}
              />
            </div>
          </form>
        ) : null}
        <button
          aria-label="Open search"
          className={`secondary quiet header-search-trigger${!bundle ? " header-search-trigger--no-bundle" : ""}`}
          onClick={onOpenSearch}
          type="button"
        >
          <IconSearch aria-hidden="true" size={18} stroke={1.8} />
          <span>Search</span>
        </button>
        <button
          className="secondary quiet"
          onClick={onOpenHelp}
          type="button"
        >
          Help
        </button>
        <button
          className="secondary quiet"
          onClick={onOpenGlossary}
          type="button"
        >
          Glossary
        </button>
      </div>
    </header>
  );
}
