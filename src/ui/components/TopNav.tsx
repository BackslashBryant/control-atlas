import { useEffect, useRef, useState } from "react";
import { IconMenu2, IconSearch, IconX } from "@tabler/icons-react";
import { Button, Input, Tabs } from "./lsm";

import { BrandFlourish, BrandMark } from "./BrandLockup";
import {
  activeNavForState,
  MOBILE_NAV_SECTIONS,
  PRIMARY_NAV_ITEMS,
} from "../lib/navigation";

const FRAMEWORK_NAV_ITEMS = PRIMARY_NAV_ITEMS.filter((item) => item.section === "framework");
const TOOLKIT_NAV_ITEMS = PRIMARY_NAV_ITEMS.filter((item) => item.section === "toolkit");
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

      <nav aria-label="Primary navigation" className="primary-nav ml-[32px] self-end mb-[-1px]">
        <Tabs
          tabs={FRAMEWORK_NAV_ITEMS.map(item => ({ id: item.view, label: item.label }))}
          activeId={activeView as string}
          onChange={(id) => {
            const item = PRIMARY_NAV_ITEMS.find(i => i.view === id);
            if (item) navigate(item.view, item.patch);
          }}
          className="border-b-0 h-full gap-[8px]"
        />
        <span aria-hidden="true" className="primary-nav-divider" />
        <Tabs
          tabs={TOOLKIT_NAV_ITEMS.map(item => ({ id: item.view, label: item.label }))}
          activeId={activeView as string}
          onChange={(id) => {
            const item = PRIMARY_NAV_ITEMS.find(i => i.view === id);
            if (item) navigate(item.view, item.patch);
          }}
          className="border-b-0 h-full gap-[8px]"
        />
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
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-[12px] flex items-center pointer-events-none text-[var(--ca-text-muted)]">
                <IconSearch aria-hidden="true" size={16} stroke={2} />
              </div>
              <Input
                aria-label="Search records and glossary"
                id="header-search"
                onChange={(event) => onHeaderSearchDraftChange(event.target.value)}
                placeholder="Search records"
                type="search"
                value={headerSearchDraft}
                className="pl-[36px] rounded-full min-h-[36px] !bg-[color-mix(in_srgb,var(--ca-surface-raised)_40%,transparent)] focus-visible:!bg-[var(--ca-surface-raised)]"
              />
            </div>
          </form>
        ) : null}
        {/* Plain wrapper div carries the responsive show/hide. The Button
            component's base class includes Tailwind's `inline-flex`, and this
            project imports Tailwind utilities with the `important` flag
            (styles/tailwind.css), so a display rule on the button itself can
            never win. Mirrors the `.header-actions-text` wrapper below. */}
        <div
          className={`header-search-trigger-wrap${!bundle ? " header-search-trigger-wrap--no-bundle" : ""}`}
        >
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
        <div className="header-actions-text">
          <Button
            variant="primary"
            className="!min-h-[36px]"
            onClick={() => onNavigate("start-here")}
          >
            Start here
          </Button>
          <Button
            variant="secondary"
            className="!min-h-[36px] !border-transparent hover:!border-[var(--ca-border-strong)]"
            onClick={() => onNavigate("sources")}
          >
            Sources
          </Button>
          <Button 
            variant="secondary"
            className="!min-h-[36px] !border-transparent hover:!border-[var(--ca-border-strong)]"
            onClick={onOpenHelp}
          >
            Help
          </Button>
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
          <div className="mobile-nav-sheet-actions p-[16px]">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenHelp();
              }}
            >
              Help
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
