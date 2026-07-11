import { useState } from "react";
import { IconMenu2, IconSearch, IconX } from "@tabler/icons-react";

import { BrandFlourish, BrandMark } from "./BrandLockup";
import { activeNavGroupForState, NAV_GROUPS } from "../lib/navigation";
import type { ViewState } from "../lib/viewState";
import type { RuntimeBundle } from "../lib/runtimeLoader";

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

  // The home view is a self-contained calm entrance (its own wordmark,
  // flourish, search, and nav-equivalent buttons) — the persistent site
  // chrome would duplicate all of that, so it stays hidden until the user
  // has navigated somewhere else.
  const hideChrome = introVisible || viewState.view === "home";

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
      aria-hidden={hideChrome || undefined}
      className="site-header"
      hidden={hideChrome}
    >
      <button
        aria-label="Control Atlas — home"
        className="brand"
        onClick={() => onNavigate("home")}
        type="button"
      >
        <BrandMark />
        <span className="brand-lockup">
          <BrandFlourish />
          <span className="brand-name">Control Atlas</span>
        </span>
      </button>
      <nav aria-label="Primary navigation" className="primary-nav">
        {NAV_GROUPS.map((group) => (
          <div
            className="nav-more"
            key={group.label}
            onKeyDown={(event) => {
              // Disclosure pattern: Escape closes the open group and returns
              // focus to its toggle button (the div's first button child).
              if (event.key !== "Escape" || openGroup !== group.label) {
                return;
              }
              event.stopPropagation();
              setOpenGroup(null);
              event.currentTarget
                .querySelector<HTMLButtonElement>(":scope > button")
                ?.focus();
            }}
          >
            <button
              aria-expanded={openGroup === group.label}
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
              <div className="nav-more-menu">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => navigateFromGroup(item.view, item.patch)}
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
          <nav aria-label="Primary navigation (mobile)">
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
