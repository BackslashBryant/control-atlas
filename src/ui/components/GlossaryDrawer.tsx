import * as Dialog from "@radix-ui/react-dialog";
import { IconSearch, IconX } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

import { glossaryData } from "../../app/glossary-data.mjs";
import { templatesForPatterns } from "../lib/glossarySearch.mjs";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";
import {
  Badge,
  PATTERN_RENAMES,
  SummaryCard,
} from "../lib/pagePrimitives";

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
                  ? "How to use Control Atlas: start with intent, search the library, then compare or generate artifacts."
                  : "Short definitions, why they matter, and quick links back into the library or pattern pages."}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="icon-button" type="button">
                <IconX aria-hidden="true" size={18} stroke={1.8} />
              </button>
            </Dialog.Close>
          </div>

          <div className="drawer-tabs" role="tablist">
            <button
              aria-selected={helpTab === "guide"}
              className={helpTab === "guide" ? "drawer-tab active" : "drawer-tab"}
              onClick={() => onTabChange("guide")}
              role="tab"
              type="button"
            >
              Help
            </button>
            <button
              aria-selected={helpTab === "glossary"}
              className={
                helpTab === "glossary" ? "drawer-tab active" : "drawer-tab"
              }
              onClick={() => onTabChange("glossary")}
              role="tab"
              type="button"
            >
              Glossary
            </button>
          </div>

          {helpTab === "guide" ? (
            <div className="drawer-guide stack">
              <SummaryCard title="Start Here">
                <p>
                  Answer three short questions, then open the recommended
                  library, compare, pattern, and template links.
                </p>
                <button
                  className="secondary"
                  onClick={() => {
                    setOpen(false);
                    onNavigate("start-here");
                  }}
                  type="button"
                >
                  Open Start Here
                </button>
              </SummaryCard>
              <SummaryCard title="Explore">
                <p>
                  Search by control ID or topic. Open records to see
                  grouped connections and source support.
                </p>
                <button
                  className="secondary"
                  onClick={() => {
                    setOpen(false);
                    onNavigate("search");
                  }}
                  type="button"
                >
                  Open Explore
                </button>
              </SummaryCard>
              <SummaryCard title="Compare">
                <p>
                  Pick a comparison intent first, set frameworks, then review
                  results before exporting or opening detailed mappings.
                </p>
                <button
                  className="secondary"
                  onClick={() => {
                    setOpen(false);
                    onNavigate("matrix");
                  }}
                  type="button"
                >
                  Open Compare
                </button>
              </SummaryCard>
            </div>
          ) : (
            <>
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
                    <Badge tone={entry.consensus ? "warning" : "success"}>
                      {entry.consensus
                        ? "Practitioner consensus"
                        : "Official source"}
                    </Badge>
                  </div>
                  <p>{entry.definition}</p>
                  <p className="drawer-support">
                    Why it matters: use this term to understand the surrounding
                    control, pattern, or template before you act on it.
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
                  <p className="drawer-link">Official source: {entry.source}</p>
                </article>
              );
            })}
          </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
