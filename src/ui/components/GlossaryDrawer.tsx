import * as Dialog from "@radix-ui/react-dialog";
import { IconSearch, IconX } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

import { glossaryData } from "../../app/glossary-data.mjs";
import { templatesForPatterns } from "../lib/glossarySearch.mjs";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";
import { Badge, PATTERN_RENAMES } from "../lib/pagePrimitives";

export function GlossaryDrawer(props: {
  open: boolean;
  setOpen: (open: boolean) => void;
  focusTermId?: string;
  bundle: RuntimeBundle | null;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNode: (nodeId: string) => void;
}) {
  const { open, setOpen, focusTermId = "", bundle, onNavigate, onOpenNode } = props;
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return glossaryData.filter((entry) =>
      !needle || [entry.term, entry.expansion, entry.definition, entry.source]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const entry = focusTermId
      ? glossaryData.find((item) => item.id === focusTermId)
      : null;
    setQuery(entry?.term || "");
  }, [focusTermId, open]);

  useEffect(() => {
    if (!open || !focusTermId) return;
    document.getElementById(`glossary-term-${focusTermId}`)?.scrollIntoView({ block: "nearest" });
  }, [filtered, focusTermId, open]);

  function openFirstControl(controlId: string) {
    if (!bundle) return;
    const matches = bundle.runtime.searchLibrary(controlId);
    const match = matches.find((item: any) => item.item_id === controlId) || matches[0];
    if (match) {
      setOpen(false);
      onOpenNode(match.id);
    }
  }

  return (
    <Dialog.Root onOpenChange={setOpen} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay" />
        <Dialog.Content className="drawer-content">
          <div className="drawer-header">
            <div>
              <Dialog.Title>Glossary</Dialog.Title>
              <Dialog.Description>Short definitions with links back into the Library and Guides.</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button aria-label="Close glossary" className="icon-button" type="button">
                <IconX aria-hidden="true" size={18} stroke={1.8} />
              </button>
            </Dialog.Close>
          </div>

          <div className="drawer-glossary" id="glossary-drawer-panel">
            <label className="field" htmlFor="glossary-search">
              <span>Search glossary</span>
              <div className="search-input">
                <IconSearch aria-hidden="true" size={18} stroke={1.8} />
                <input id="glossary-search" onChange={(event) => setQuery(event.target.value)} type="search" value={query} />
              </div>
            </label>

            <div className="drawer-list">
              {filtered.map((entry) => {
                const relatedTemplateIds = templatesForPatterns(entry.related_patterns);
                return (
                  <article className={focusTermId === entry.id ? "drawer-item drawer-item-focused" : "drawer-item"} id={`glossary-term-${entry.id}`} key={entry.id}>
                    <div className="result-card-header">
                      <h3>{entry.term}{entry.expansion ? <span className="drawer-expansion"> · {entry.expansion}</span> : null}</h3>
                      <Badge tone="info">Control Atlas explanation</Badge>
                    </div>
                    <p>{entry.definition}</p>
                    <p className="drawer-support">Why it matters: {entry.why_it_matters}</p>
                    <div className="chip-row">
                      {entry.related_patterns.map((patternId) => <button className="chip" key={patternId} onClick={() => { setOpen(false); onNavigate("patterns", { pattern: patternId }); }} type="button">{PATTERN_RENAMES[patternId] || patternId}</button>)}
                      {relatedTemplateIds.map((templateId) => <button className="chip" key={templateId} onClick={() => { setOpen(false); onNavigate("templates", { templateType: templateId }); }} type="button">{templateId.replaceAll("_", " ")}</button>)}
                      {entry.related_controls.map((controlId) => <button className="chip" key={controlId} onClick={() => openFirstControl(controlId)} type="button">{controlId}</button>)}
                    </div>
                    <p className="drawer-link">Reference: {entry.source}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
