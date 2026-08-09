import { useEffect, useRef, useState } from "react";
import { IconMenu2, IconSearch, IconX } from "@tabler/icons-react";
import { Button } from "./lsm";
import { AppLink } from "./AppLink";

import { BrandFlourish, BrandMark } from "./BrandLockup";
import {
  activeNavForState,
  MOBILE_NAV_SECTIONS,
  PRIMARY_NAV_ITEMS,
  UTILITY_NAV_ITEMS,
} from "../lib/navigation";

import type { ViewState } from "../lib/viewState";
import { CLOSE_OVERLAYS_EVENT } from "../../shared/navigation-events";

type TopNavProps = {
  viewState: ViewState;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>, reset?: boolean) => void;
  onOpenSearch: () => void;
};

function useMediaMatch(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  );
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

export function TopNav(props: TopNavProps) {
  const {
    viewState,
    onNavigate,
    onOpenSearch,
  } = props;

  const activeView = activeNavForState(viewState);
  // Kept in sync with styles/orbital.css's desktop/mobile contract. Primary
  // product navigation remains visible at ordinary desktop widths.
  // see that rule's comment for the width budget this threshold is based on.
  const compactHeader = useMediaMatch("(max-width: 1023px)");
  const compactNavigation = compactHeader;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const mobileMenuToggleRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  // One persistent header on every route, Home included: global navigation is
  // never hidden.
  useEffect(() => {
    const header = headerRef.current;
    const root = document.documentElement;
    if (!header) return;

    const publishHeaderHeight = () => {
      root.style.setProperty(
        "--ca-header-height",
        `${Math.ceil(header.getBoundingClientRect().height)}px`,
      );
    };

    publishHeaderHeight();
    const observer = new ResizeObserver(publishHeaderHeight);
    observer.observe(header);
    window.addEventListener("resize", publishHeaderHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", publishHeaderHeight);
    };
  }, []);

  useEffect(() => {
    const closeMenu = () => setMobileMenuOpen(false);
    window.addEventListener(CLOSE_OVERLAYS_EVENT, closeMenu);
    return () => window.removeEventListener(CLOSE_OVERLAYS_EVENT, closeMenu);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const sheet = mobileMenuRef.current;
    const firstLink = sheet?.querySelector<HTMLAnchorElement>("nav a[href]");
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

  return (
    <header className="site-header" ref={headerRef}>
      <AppLink
        aria-label="Control Atlas — home"
        className="brand"
        onNavigate={onNavigate}
        view="home"
      >
        <BrandMark />
        <span className="brand-lockup">
          <span className="brand-name">Control Atlas</span>
          <BrandFlourish />
        </span>
      </AppLink>

      {!compactNavigation ? (
        <nav aria-label="Primary navigation" className="primary-nav ml-[16px] self-end mb-[-1px]">
          <div className="border-b-0 h-full gap-[2px]">
            {PRIMARY_NAV_ITEMS.map((item) => (
              <AppLink
                aria-current={activeView === item.view ? "page" : undefined}
                className={activeView === item.view ? "nav-active" : undefined}
                key={item.view}
                onNavigate={onNavigate}
                patch={item.patch}
                view={item.view}
              >
                {item.label}
              </AppLink>
            ))}
          </div>
        </nav>
      ) : null}

      <div className="header-actions">
        <div className="header-search-trigger-wrap">
          <Button
            aria-label="Open search"
            variant="secondary"
            className="!min-h-[36px] !border-transparent hover:!border-[var(--ca-border-strong)] header-search-trigger"
            onClick={onOpenSearch}
          >
            <IconSearch aria-hidden="true" size={16} stroke={2} />
            <span>Search</span>
          </Button>
        </div>
        {!compactHeader ? <nav aria-label="Utility navigation" className="header-actions-text">
          {UTILITY_NAV_ITEMS.map((item) => (
            <AppLink
              aria-current={activeView === item.view ? "page" : undefined}
              key={item.view}
              className="header-utility-link"
              onNavigate={onNavigate}
              patch={item.patch}
              variant="secondary"
              view={item.view}
            >
              {item.label}
            </AppLink>
          ))}
        </nav> : null}
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
                    <AppLink
                      aria-current={activeView === item.view ? "page" : undefined}
                      className={activeView === item.view ? "active" : ""}
                      key={item.label}
                      onClick={() => setMobileMenuOpen(false)}
                      onNavigate={onNavigate}
                      patch={item.patch}
                      view={item.view}
                    >
                      <Icon aria-hidden="true" size={18} stroke={1.8} />
                      <span>{item.label}</span>
                    </AppLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
