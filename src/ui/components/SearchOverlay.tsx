import * as Dialog from "@radix-ui/react-dialog";
import { IconSearch, IconX } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import { requestSearchResultsFocus } from "../../shared/navigation-events";
import {
  resourceAccessLabel,
  resourceTypeLabel,
} from "../lib/resourceBrands.mjs";
import { searchResourceDocuments } from "../lib/resourceSearch.mjs";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";
import { Button } from "./lsm/Button";

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
      return { libraryResults: [], resourceResults: [], communityResults: [] };
    }
    const libraryResults = bundle.runtime.searchLibrary(query.trim()).slice(0, 8);
    const commonsResults = searchResourceDocuments(
      bundle.commonsSearchIndex?.documents || [],
      query,
      8,
    ).map((entry) => entry.document);
    const resourceResults = commonsResults
      .filter((document) => document.resourceType !== "community_forum")
      .slice(0, 4);
    const communityResults = commonsResults
      .filter((document) => document.resourceType === "community_forum")
      .slice(0, 4);

    return { libraryResults, resourceResults, communityResults };
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
    requestSearchResultsFocus();
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
        <Dialog.Content aria-label="Search Control Atlas" className="search-overlay">
          <div className="search-overlay-header">
            <Dialog.Title className="visually-hidden">
              Search Control Atlas
            </Dialog.Title>
            <div className="search-input search-overlay-input">
              <IconSearch aria-hidden="true" size={18} stroke={1.8} />
              <input
                aria-label="Search Control Atlas"
                autoFocus
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && query.trim()) {
                    openExplore();
                  }
                }}
                placeholder="Search controls, STIGs, tools, templates, or resources..."
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
              Type to search records, templates, tools, and Resources. Press
              Enter for the full results page.
            </p>
          ) : results.libraryResults.length === 0 && results.resourceResults.length === 0 && results.communityResults.length === 0 ? (
            <p className="field-hint">
              No records or resources match &quot;{query.trim()}&quot;.
            </p>
          ) : (
            <div className="search-overlay-results-container space-y-4">
              {results.libraryResults.length > 0 ? (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ca-text-muted)] mb-2 px-3">
                    Published records ({results.libraryResults.length})
                  </div>
                  <ul className="search-overlay-results">
                    {results.libraryResults.map((document: any) => {
                      return (
                        <li key={document.id}>
                          <button
                            aria-label={document.title || document.item_id}
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
                              {document.description || "No narrative description was published for this record."}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              {results.resourceResults.length > 0 ? (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ca-primary)] mb-2 px-3">
                    Tools and resources ({results.resourceResults.length})
                  </div>
                  <ul className="search-overlay-results">
                    {results.resourceResults.map((doc) => (
                      <li key={doc.id}>
                        <button
                          aria-label={doc.name}
                          className="search-overlay-result"
                          onClick={() => openCommonsResult(doc.id)}
                          type="button"
                        >
                          <span className="search-overlay-result-title flex items-center justify-between">
                            <span>{doc.name}</span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[color-mix(in_srgb,var(--ca-primary)_20%,transparent)] text-[var(--ca-primary)] border border-[color-mix(in_srgb,var(--ca-primary)_50%,transparent)]">
                              {resourceTypeLabel(doc.resourceType)}
                            </span>
                          </span>
                          <span className="search-overlay-result-meta">
                            <code>{doc.publisher}</code>
                            {" · "}
                            {resourceAccessLabel(doc)}
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

              {results.communityResults.length > 0 ? (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ca-primary)] mb-2 px-3">
                    Communities ({results.communityResults.length})
                  </div>
                  <ul className="search-overlay-results">
                    {results.communityResults.map((doc) => (
                      <li key={doc.id}>
                        <button
                          aria-label={doc.name}
                          className="search-overlay-result"
                          onClick={() => openCommonsResult(doc.id)}
                          type="button"
                        >
                          <span className="search-overlay-result-title">
                            {doc.name}
                          </span>
                          <span className="search-overlay-result-meta">
                            <code>{doc.publisher}</code>
                            {" · "}
                            {resourceAccessLabel(doc)}
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
            </div>
          )}

          {query.trim() ? (
            <div className="card-actions flex gap-2">
              <Button variant="secondary" onClick={openExplore} type="button">
                View all search results
              </Button>
              <Button variant="secondary" onClick={openCommons} type="button">
                Search resources
              </Button>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
