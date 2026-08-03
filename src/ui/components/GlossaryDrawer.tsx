import * as Dialog from "@radix-ui/react-dialog";
import { IconSearch, IconX } from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { glossaryData } from "../../app/glossary-data.mjs";
import { helpShortcuts, helpSurfaces } from "../../app/help-data.mjs";
import { learnArticles } from "../../app/learn-content.mjs";
import { templatesForPatterns } from "../lib/glossarySearch.mjs";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";
import {
  Badge,
  PATTERN_RENAMES,
  SummaryCard,
} from "../lib/pagePrimitives";
import { Button } from "./lsm/Button";

export type HelpTab = "guide" | "glossary";

export function GlossaryDrawer(props: {
  open: boolean;
  setOpen: (open: boolean) => void;
  focusTermId?: string;
  helpTab: HelpTab;
  onTabChange: (tab: HelpTab) => void;
  bundle: RuntimeBundle | null;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNode: (nodeId: string, from?: string) => void;
}) {
  const {
    open,
    setOpen,
    focusTermId = "",
    helpTab,
    onTabChange,
    bundle,
    onNavigate,
    onOpenNode,
  } = props;
  const [query, setQuery] = useState("");
  const helpTabRef = useRef<HTMLButtonElement>(null);
  const glossaryTabRef = useRef<HTMLButtonElement>(null);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return glossaryData.filter((entry) => {
      if (!needle) {
        return true;
      }
      return [entry.term, entry.expansion, entry.definition, entry.source]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [query]);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (focusTermId) {
      const entry = glossaryData.find((item) => item.id === focusTermId);
      if (entry) {
        setQuery(entry.term);
      }
    } else {
      setQuery("");
    }
  }, [focusTermId, open]);

  useEffect(() => {
    if (!open || !focusTermId) {
      return;
    }
    const target = document.getElementById(`glossary-term-${focusTermId}`);
    target?.scrollIntoView({ block: "nearest" });
  }, [filtered, focusTermId, open]);

  function openFirstControl(controlId: string) {
    if (!bundle) {
      return;
    }
    const match =
      bundle.runtime
        .searchLibrary(controlId)
        .find((item: any) => item.item_id === controlId) ||
      bundle.runtime.searchLibrary(controlId)[0];
    if (match) {
      setOpen(false);
      onOpenNode(match.id, "search");
    }
  }

  return (
    <Dialog.Root onOpenChange={setOpen} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay" />
        <Dialog.Content className="drawer-content">
          <div className="drawer-header">
            <div>
              <Dialog.Title>
                {helpTab === "guide" ? "Help" : "Glossary"}
              </Dialog.Title>
              <Dialog.Description>
                {helpTab === "guide"
                  ? "How to use Control Atlas."
                  : "Short definitions with links back into the Library and Guides."}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                aria-label="Close help and glossary"
                className="icon-button"
                type="button"
              >
                <IconX aria-hidden="true" size={18} stroke={1.8} />
              </button>
            </Dialog.Close>
          </div>

          <div className="drawer-tabs" role="tablist">
            <button
              aria-controls="help-drawer-panel"
              aria-selected={helpTab === "guide"}
              className={helpTab === "guide" ? "drawer-tab active" : "drawer-tab"}
              id="help-drawer-tab"
              onClick={() => onTabChange("guide")}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                  event.preventDefault();
                  onTabChange("glossary");
                  window.requestAnimationFrame(() =>
                    glossaryTabRef.current?.focus(),
                  );
                }
              }}
              ref={helpTabRef}
              role="tab"
              tabIndex={helpTab === "guide" ? 0 : -1}
              type="button"
            >
              Help
            </button>
            <button
              aria-controls="glossary-drawer-panel"
              aria-selected={helpTab === "glossary"}
              className={
                helpTab === "glossary" ? "drawer-tab active" : "drawer-tab"
              }
              id="glossary-drawer-tab"
              onClick={() => onTabChange("glossary")}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                  event.preventDefault();
                  onTabChange("guide");
                  window.requestAnimationFrame(() =>
                    helpTabRef.current?.focus(),
                  );
                }
              }}
              ref={glossaryTabRef}
              role="tab"
              tabIndex={helpTab === "glossary" ? 0 : -1}
              type="button"
            >
              Glossary
            </button>
          </div>

          {helpTab === "guide" ? (
            <div
              aria-labelledby="help-drawer-tab"
              className="drawer-guide stack"
              id="help-drawer-panel"
              role="tabpanel"
            >
              <div className="card-actions">
                <Button variant="primary" onClick={() => { setOpen(false); onNavigate("start-here"); }} type="button">Start here</Button>
                <Button variant="secondary" onClick={() => { setOpen(false); onNavigate("catalog-detail", { catalog: "" }); }} type="button">Open Library</Button>
              </div>
              <SummaryCard title="Keyboard shortcuts">
                <dl className="help-shortcut-list">
                  {helpShortcuts.map((shortcut) => (
                    <div key={shortcut.keys}>
                      <dt>{shortcut.keys}</dt>
                      <dd>{shortcut.action}</dd>
                    </div>
                  ))}
                </dl>
              </SummaryCard>
              <details className="drawer-all-help">
                <summary>All help topics ({helpSurfaces.length})</summary>
                <div className="stack disclosure-content">
                  {helpSurfaces.map((surface) => (
                    <SummaryCard key={surface.view} title={surface.title}>
                      <p>{surface.body}</p>
                      <Button variant="secondary" onClick={() => { setOpen(false); onNavigate(surface.view as ViewState["view"]); }} type="button">
                        {surface.actionLabel}
                      </Button>
                    </SummaryCard>
                  ))}
                </div>
              </details>
              {/* Product-operation articles moved off Guides (which is now
                  practitioner-only) and live here instead. */}
              <details className="drawer-all-help">
                <summary>How Control Atlas works ({learnArticles.length})</summary>
                <div className="stack disclosure-content">
                  {learnArticles.map((article: any) => (
                    <SummaryCard key={article.id} title={article.title}>
                      <p>{article.summary}</p>
                      <Button variant="secondary" onClick={() => { setOpen(false); onNavigate("patterns", { pattern: article.id }); }} type="button">
                        Read it
                      </Button>
                    </SummaryCard>
                  ))}
                </div>
              </details>
            </div>
          ) : (
            <div
              aria-labelledby="glossary-drawer-tab"
              className="drawer-glossary"
              id="glossary-drawer-panel"
              role="tabpanel"
            >
          <label className="field" htmlFor="glossary-search">
            <span>Search glossary</span>
            <div className="search-input">
              <IconSearch aria-hidden="true" size={18} stroke={1.8} />
              <input
                id="glossary-search"
                onChange={(event) => setQuery(event.target.value)}
                type="search"
                value={query}
              />
            </div>
          </label>

          <div className="drawer-list">
            {filtered.map((entry) => {
              const relatedTemplateIds = templatesForPatterns(
                entry.related_patterns,
              );
              return (
                <article
                  className={
                    focusTermId === entry.id
                      ? "drawer-item drawer-item-focused"
                      : "drawer-item"
                  }
                  id={`glossary-term-${entry.id}`}
                  key={entry.id}
                >
                  <div className="result-card-header">
                    <h3>
                      {entry.term}
                      {entry.expansion ? (
                        <span className="drawer-expansion">
                          {" "}
                          · {entry.expansion}
                        </span>
                      ) : null}
                    </h3>
                    <Badge tone="info">Control Atlas explanation</Badge>
                  </div>
                  <p>{entry.definition}</p>
                  <p className="drawer-support">
                    Why it matters: {entry.why_it_matters}
                  </p>
                  <div className="chip-row">
                    {entry.related_patterns.map((patternId) => (
                      <button
                        className="chip"
                        key={patternId}
                        onClick={() => {
                          setOpen(false);
                          onNavigate("patterns", { pattern: patternId });
                        }}
                        type="button"
                      >
                        {PATTERN_RENAMES[patternId] || patternId}
                      </button>
                    ))}
                    {relatedTemplateIds.map((templateId) => (
                      <button
                        className="chip"
                        key={templateId}
                        onClick={() => {
                          setOpen(false);
                          onNavigate("templates", { templateType: templateId });
                        }}
                        type="button"
                      >
                        {templateId.replaceAll("_", " ")}
                      </button>
                    ))}
                    {entry.related_controls.map((controlId) => (
                      <button
                        className="chip"
                        key={controlId}
                        onClick={() => openFirstControl(controlId)}
                        type="button"
                      >
                        {controlId}
                      </button>
                    ))}
                  </div>
                  <p className="drawer-link">Reference: {entry.source}</p>
                </article>
              );
            })}
          </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
