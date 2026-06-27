import { IconSearch } from "@tabler/icons-react";

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

  return (
    <header
      aria-hidden={introVisible || undefined}
      className="site-header"
      hidden={introVisible}
    >
      <button
        className="brand"
        onClick={() => onNavigate("home")}
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
      <nav aria-label="Primary navigation" className="primary-nav">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeNav === item.view;
          return (
            <button
              aria-current={active ? "page" : undefined}
              className={active ? "active nav-active" : ""}
              key={item.label}
              onClick={() => onNavigate(item.view)}
              type="button"
            >
              <Icon aria-hidden="true" size={16} stroke={1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}
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
