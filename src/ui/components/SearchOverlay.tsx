import * as Dialog from "@radix-ui/react-dialog";
import { IconSearch, IconX } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";

type SearchOverlayProps = {
  bundle: RuntimeBundle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNode: (nodeId: string, from?: string) => void;
};

export function SearchOverlay(props: SearchOverlayProps) {
  const { bundle, open, onOpenChange, onNavigate, onOpenNode } = props;
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const results = useMemo(() => {
    if (!bundle || !query.trim()) {
      return [];
    }
    return bundle.runtime.searchLibrary(query.trim()).slice(0, 12);
  }, [bundle, query]);

  function openResult(nodeId: string, itemId: string) {
    onOpenChange(false);
    onOpenNode(nodeId, itemId);
  }

  function openExplore() {
    onOpenChange(false);
    onNavigate("search", { query: query.trim() });
  }

  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay search-overlay-backdrop" />
        <Dialog.Content aria-label="Search records" className="search-overlay">
          <div className="search-overlay-header">
            <Dialog.Title className="visually-hidden">
              Search records
            </Dialog.Title>
            <div className="search-input search-overlay-input">
              <IconSearch aria-hidden="true" size={18} stroke={1.8} />
              <input
                autoFocus
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && query.trim()) {
                    openExplore();
                  }
                }}
                placeholder="Search by control ID, STIG item, or topic"
                type="search"
                value={query}
              />
            </div>
            <Dialog.Close asChild>
              <button aria-label="Close search" className="icon-button" type="button">
                <IconX aria-hidden="true" size={18} stroke={1.8} />
              </button>
            </Dialog.Close>
          </div>

          {!bundle ? (
            <p className="field-hint">Loading public data…</p>
          ) : !query.trim() ? (
            <p className="field-hint">
              Type to search records. Press Enter to open full Explore results.
            </p>
          ) : results.length === 0 ? (
            <p className="field-hint">No records match &quot;{query.trim()}&quot;.</p>
          ) : (
            <ul className="search-overlay-results">
              {results.map((document: any) => {
                const missingSummary = !(
                  document.plain_language_summary || document.description
                );
                return (
                  <li key={document.id}>
                    <button
                      className="search-overlay-result"
                      onClick={() => openResult(document.id, document.item_id)}
                      type="button"
                    >
                      <span className="search-overlay-result-title">
                        {document.title || document.item_id}
                      </span>
                      <span className="search-overlay-result-meta">
                        <code>{document.item_id}</code>
                        {" · "}
                        {displayNameFor("object_type", document.object_type)}
                      </span>
                      <span className="search-overlay-result-summary">
                        {document.plain_language_summary ||
                          document.description ||
                          (missingSummary
                            ? "Plain-language summary missing for this record."
                            : "")}
                      </span>
                      {missingSummary ? (
                        <span className="warning-inline">
                          Plain-language summary missing — review source text on
                          the record page.
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {query.trim() ? (
            <div className="card-actions">
              <button className="secondary" onClick={openExplore} type="button">
                View all Explore results
              </button>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
