import { useEffect, useState } from "react";
import { IconMenu2, IconSearch, IconX } from "@tabler/icons-react";

import { activeNavGroupForState, NAV_GROUPS } from "../lib/navigation";
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
  } = props;

  const activeGroup = activeNavGroupForState(viewState);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  const longestBrandWord = BRAND_WORDS.reduce(
    (longest, word) => (word.length > longest.length ? word : longest),
    "",
  );

  function navigateFromGroup(view: ViewState["view"], patch?: Partial<ViewState>) {
    setOpenGroup(null);
    onNavigate(view, patch);
  }

  function navigateFromMobileMenu(view: ViewState["view"], patch?: Partial<ViewState>) {
    setMobileMenuOpen(false);
    onNavigate(view, patch);
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
        <span className="brand-lockup">
          <span className="brand-kbd" aria-hidden="true">
            <span className="brand-key">Ctrl</span>
            <span className="brand-plus">+</span>
            <span className="brand-key">Alt</span>
            <span className="brand-plus">+</span>
            <span className="brand-key brand-key--active">
              <span aria-hidden="true" className="brand-key-sizer">
                {longestBrandWord}
              </span>
              <span className={`brand-key-word${fading ? " fading" : ""}`}>
                {rotatingWord}
              </span>
            </span>
          </span>
          <span className="brand-name">Control Atlas</span>
        </span>
      </button>
      <nav aria-label="Primary navigation" className="primary-nav">
        {NAV_GROUPS.map((group) => (
          <div className="nav-more" key={group.label}>
            <button
              aria-expanded={openGroup === group.label}
              aria-haspopup="menu"
              className={
                activeGroup === group.label ? "active nav-active" : ""
              }
              onClick={() =>
                setOpenGroup((current) =>
                  current === group.label ? null : group.label,
                )
              }
              type="button"
            >
              <span>{group.label}</span>
            </button>
            {openGroup === group.label ? (
              <div className="nav-more-menu" role="menu">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => navigateFromGroup(item.view, item.patch)}
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
          </div>
        ))}
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
        <div className="header-actions-text">
          <button
            className="secondary quiet"
            onClick={onOpenHelp}
            type="button"
          >
            Help
          </button>
        </div>
        <button
          aria-controls="mobile-nav-sheet"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          className="mobile-nav-toggle"
          onClick={() => setMobileMenuOpen((current) => !current)}
          type="button"
        >
          {mobileMenuOpen ? (
            <IconX aria-hidden="true" size={20} stroke={1.8} />
          ) : (
            <IconMenu2 aria-hidden="true" size={20} stroke={1.8} />
          )}
        </button>
      </div>
      {mobileMenuOpen ? (
        <div className="mobile-nav-sheet" id="mobile-nav-sheet">
          <nav aria-label="Primary navigation (mobile)" role="menu">
            {NAV_GROUPS.map((group) => (
              <div className="mobile-nav-sheet-group" key={group.label}>
                <span className="mobile-nav-sheet-group-label">
                  {group.label}
                </span>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() =>
                        navigateFromMobileMenu(item.view, item.patch)
                      }
                      role="menuitem"
                      type="button"
                    >
                      <Icon aria-hidden="true" size={18} stroke={1.8} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
          <div className="mobile-nav-sheet-actions">
            <button
              className="secondary quiet"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenHelp();
              }}
              type="button"
            >
              Help
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
