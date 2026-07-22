import { useEffect, useRef, useState } from "react";
import { IconMenu2, IconSearch, IconX } from "@tabler/icons-react";

import { BrandFlourish, BrandMark } from "./BrandLockup";
import {
  activeNavForState,
  MOBILE_NAV_SECTIONS,
  PRIMARY_NAV_ITEMS,
} from "../lib/navigation";
import type { ViewState } from "../lib/viewState";
import type { RuntimeBundle } from "../lib/runtimeLoader";

type TopNavProps = {
  bundle: RuntimeBundle | null;
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
    viewState,
    headerSearchDraft,
    onHeaderSearchDraftChange,
    onNavigate,
    onOpenSearch,
    onOpenHelp,
  } = props;

  const activeView = activeNavForState(viewState);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const mobileMenuToggleRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  // Home keeps its distinctive orbit entrance. All interior pages use the
  // same direct, stable product navigation.
  const hideChrome = viewState.view === "home";

  useEffect(() => {
    const header = headerRef.current;
    const root = document.documentElement;
    if (!header) return;

    const publishHeaderHeight = () => {
      const height = hideChrome
        ? 0
        : Math.ceil(header.getBoundingClientRect().height);
      root.style.setProperty("--ca-header-height", `${height}px`);
    };

    publishHeaderHeight();
    const observer = new ResizeObserver(publishHeaderHeight);
    observer.observe(header);
    window.addEventListener("resize", publishHeaderHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", publishHeaderHeight);
    };
  }, [hideChrome]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const sheet = mobileMenuRef.current;
    const firstLink = sheet?.querySelector<HTMLButtonElement>("nav button");
    window.requestAnimationFrame(() => firstLink?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileMenuOpen(false);
        window.requestAnimationFrame(() => mobileMenuToggleRef.current?.focus());
        return;
      }
      if (event.key !== "Tab") return;

      const controls = [
        mobileMenuToggleRef.current,
        ...(sheet
          ? Array.from(
              sheet.querySelectorAll<HTMLElement>(
                'button:not([disabled]), a[href], input:not([disabled])',
              ),
            )
          : []),
      ].filter((control): control is HTMLElement => Boolean(control));
      if (controls.length === 0) return;

      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = priorOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileMenuOpen]);

  function navigate(
    view: ViewState["view"],
    patch?: Record<string, string>,
  ) {
    setMobileMenuOpen(false);
    onNavigate(view, patch as Partial<ViewState> | undefined);
  }

  return (
    <header
      aria-hidden={hideChrome || undefined}
      className="site-header"
      hidden={hideChrome}
      ref={headerRef}
    >
      <button
        aria-label="Control Atlas — home"
        className="brand"
        onClick={() => onNavigate("home")}
        type="button"
      >
        <BrandMark />
        <span className="brand-lockup">
          <span className="brand-name">Control Atlas</span>
          <BrandFlourish />
        </span>
      </button>

      <nav aria-label="Primary navigation" className="primary-nav">
        {PRIMARY_NAV_ITEMS.map((item) => (
          <button
            aria-current={activeView === item.view ? "page" : undefined}
            className={activeView === item.view ? "active nav-active" : ""}
            key={item.label}
            onClick={() => navigate(item.view, item.patch)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="header-actions">
        {bundle ? (
          <form
            className="header-search"
            onSubmit={(event) => {
              event.preventDefault();
              const query = headerSearchDraft.trim();
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
                placeholder="Search records"
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
            className="header-start-here"
            onClick={() => onNavigate("start-here")}
            type="button"
          >
            Start here
          </button>
          <button
            className="secondary quiet header-utility-sources"
            onClick={() => onNavigate("sources")}
            type="button"
          >
            Sources
          </button>
          <button className="secondary quiet" onClick={onOpenHelp} type="button">
            Help
          </button>
        </div>
        <button
          aria-controls="mobile-nav-sheet"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          className="mobile-nav-toggle"
          onClick={() => setMobileMenuOpen((current) => !current)}
          ref={mobileMenuToggleRef}
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
        <div
          aria-label="Site navigation"
          className="mobile-nav-sheet"
          id="mobile-nav-sheet"
          ref={mobileMenuRef}
          role="dialog"
        >
          <nav aria-label="Primary navigation (mobile)">
            {MOBILE_NAV_SECTIONS.map((section) => (
              <div className="mobile-nav-sheet-group" key={section.label}>
                <span className="mobile-nav-sheet-group-label">
                  {section.label}
                </span>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      aria-current={activeView === item.view ? "page" : undefined}
                      className={activeView === item.view ? "active" : ""}
                      key={item.label}
                      onClick={() => navigate(item.view, item.patch)}
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
