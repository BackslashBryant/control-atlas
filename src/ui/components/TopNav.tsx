import { IconSearch, IconMenu2, IconX, IconChevronDown } from "@tabler/icons-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState } from "react";

import {
  activeNavForState,
  PRIMARY_NAV_ITEMS,
} from "../lib/navigation";
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
  onOpenGlossary: () => void;
};

const PRIMARY_ITEMS = PRIMARY_NAV_ITEMS.slice(0, 4);
const MORE_ITEMS = PRIMARY_NAV_ITEMS.slice(4);

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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moreOpen]);

  const handleNavigate = (view: ViewState["view"], patch?: Partial<ViewState>) => {
    setMobileMenuOpen(false);
    setMoreOpen(false);
    onNavigate(view, patch);
  };

  const activeNav = activeNavForState(viewState);
  const moreActive = MORE_ITEMS.some((item) => activeNav === item.view);

  return (
    <header
      aria-hidden={introVisible || undefined}
      className="site-header"
      hidden={introVisible}
    >
      <div className="nav-brand">
        <button
          className="brand"
          onClick={() => handleNavigate("home")}
          type="button"
        >
          <span className="brand-mark" aria-hidden="true">
            CA
          </span>
          <span>
            <strong>Control Atlas</strong>
            <small>Ctrl+Alt+Comply</small>
          </span>
        </button>
      </div>

      <nav aria-label="Primary navigation" className="primary-nav desktop-only">
        {PRIMARY_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeNav === item.view;
          return (
            <button
              aria-current={active ? "page" : undefined}
              className={`nav-link ${active ? "active nav-active" : ""}`}
              key={item.label}
              onClick={() => handleNavigate(item.view)}
              type="button"
            >
              <Icon aria-hidden="true" size={15} stroke={1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className={`nav-more ${moreOpen ? "open" : ""}`} ref={moreRef}>
          <button
            aria-expanded={moreOpen}
            aria-haspopup="true"
            className={`nav-link nav-more-trigger ${moreActive ? "active nav-active" : ""}`}
            onClick={() => setMoreOpen((v) => !v)}
            type="button"
          >
            <span>More</span>
            <IconChevronDown
              aria-hidden="true"
              size={13}
              stroke={2}
              style={{
                transform: moreOpen ? "rotate(180deg)" : undefined,
                transition: "transform 150ms ease",
              }}
            />
          </button>
          {moreOpen && (
            <div className="nav-more-menu" role="menu">
              {MORE_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeNav === item.view;
                return (
                  <button
                    aria-current={active ? "page" : undefined}
                    className={active ? "active" : undefined}
                    key={item.label}
                    onClick={() => handleNavigate(item.view)}
                    role="menuitem"
                    type="button"
                  >
                    <Icon aria-hidden="true" size={15} stroke={1.8} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="nav-utility header-actions">
        {bundle ? (
          <form
            className="header-search desktop-only"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const input = form.querySelector<HTMLInputElement>("#header-search");
              const query = input?.value.trim() ?? headerSearchDraft.trim();
              onHeaderSearchDraftChange(query);
              handleNavigate("search", {
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
              <IconSearch aria-hidden="true" size={16} stroke={1.8} />
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
          <span className="visually-hidden">Search</span>
        </button>

        <div className="desktop-only action-group">
          <button className="secondary quiet" onClick={onOpenHelp} type="button">
            Help
          </button>
          <button className="secondary quiet" onClick={onOpenGlossary} type="button">
            Glossary
          </button>
        </div>

        <Dialog.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <Dialog.Trigger asChild>
            <button className="mobile-menu-trigger secondary quiet" aria-label="Open menu">
              <IconMenu2 size={22} />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="dialog-overlay" />
            <Dialog.Content className="dialog-content mobile-menu-drawer">
              <div className="mobile-menu-header">
                <span className="brand-mark" aria-hidden="true">CA</span>
                <Dialog.Close asChild>
                  <button className="icon-button secondary quiet" aria-label="Close menu">
                    <IconX size={22} />
                  </button>
                </Dialog.Close>
              </div>
              <nav aria-label="Mobile navigation" className="mobile-nav">
                {PRIMARY_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = activeNav === item.view;
                  return (
                    <button
                      aria-current={active ? "page" : undefined}
                      className={`nav-link ${active ? "active nav-active" : ""}`}
                      key={item.label}
                      onClick={() => handleNavigate(item.view)}
                      type="button"
                    >
                      <Icon aria-hidden="true" size={16} stroke={1.8} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
              <div className="mobile-menu-footer">
                <button className="secondary" onClick={() => { setMobileMenuOpen(false); onOpenHelp(); }}>Help</button>
                <button className="secondary" onClick={() => { setMobileMenuOpen(false); onOpenGlossary(); }}>Glossary</button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
  );
}
