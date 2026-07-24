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
      return { libraryResults: [], commonsResults: [] };
    }
    const q = query.trim().toLowerCase();
    const libraryResults = bundle.runtime.searchLibrary(query.trim()).slice(0, 8);
    const commonsResults = (bundle.commonsSearchIndex?.documents || [])
      .filter(
        (doc) =>
          doc.name.toLowerCase().includes(q) ||
          doc.shortName.toLowerCase().includes(q) ||
          doc.summary.toLowerCase().includes(q) ||
          doc.searchableText.includes(q)
      )
      .slice(0, 4);

    return { libraryResults, commonsResults };
  }, [bundle, query]);

  function openResult(nodeId: string) {
    onOpenChange(false);
    onOpenNode(nodeId, "search");
  }

  function openCommonsResult(id: string) {
    onOpenChange(false);
    onNavigate("commons-detail", { id, from: "search" });
  }

  function openExplore() {
    onOpenChange(false);
    onNavigate("search", { query: query.trim() });
  }

  function openCommons() {
    onOpenChange(false);
    onNavigate("commons", { query: query.trim() });
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
                aria-label="Search records"
                autoFocus
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && query.trim()) {
                    openExplore();
                  }
                }}
                placeholder="Search controls, STIGs, tools, templates, or Commons..."
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
              Type to search records. Press Enter for templates, tools, and
              official resources in Commons and Explore.
            </p>
          ) : results.libraryResults.length === 0 && results.commonsResults.length === 0 ? (
            <p className="field-hint">No records match &quot;{query.trim()}&quot;.</p>
          ) : (
            <div className="search-overlay-results-container space-y-4">
              {results.commonsResults.length > 0 ? (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ca-primary)] mb-2 px-3">
                    Control Commons Resources ({results.commonsResults.length})
                  </div>
                  <ul className="search-overlay-results">
                    {results.commonsResults.map((doc) => (
                      <li key={doc.id}>
                        <button
                          className="search-overlay-result"
                          onClick={() => openCommonsResult(doc.id)}
                          type="button"
                        >
                          <span className="search-overlay-result-title flex items-center justify-between">
                            <span>{doc.name}</span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[color-mix(in_srgb,var(--ca-primary)_20%,transparent)] text-[var(--ca-primary)] border border-[color-mix(in_srgb,var(--ca-primary)_50%,transparent)]">
                              Commons · {doc.resourceLane}
                            </span>
                          </span>
                          <span className="search-overlay-result-meta">
                            <code>{doc.publisher}</code>
                            {" · "}
                            {doc.resourceType}
                          </span>
                          <span className="search-overlay-result-summary">
                            {doc.summary}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {results.libraryResults.length > 0 ? (
                <div>
                  {results.commonsResults.length > 0 ? (
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ca-text-muted)] mb-2 px-3">
                      Control Atlas Catalog Records
                    </div>
                  ) : null}
                  <ul className="search-overlay-results">
                    {results.libraryResults.map((document: any) => {
                      const missingSummary = !(
                        document.plain_language_summary || document.description
                      );
                      return (
                        <li key={document.id}>
                          <button
                            className="search-overlay-result"
                            onClick={() => openResult(document.id)}
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
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>
          )}

          {query.trim() ? (
            <div className="card-actions flex gap-2">
              <button className="secondary" onClick={openExplore} type="button">
                View all Explore records
              </button>
              <button className="secondary" onClick={openCommons} type="button">
                Search in Control Commons
              </button>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
