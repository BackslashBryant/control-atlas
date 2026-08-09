import * as Dialog from "@radix-ui/react-dialog";
import { IconSearch, IconX } from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import { practitionerGuides } from "../../app/learn-content.mjs";
import { requestSearchResultsFocus } from "../../shared/navigation-events";
import { GLOBAL_SEARCH_PLACEHOLDER } from "../../shared/product-identity";
import { recordDisplayTitle } from "../lib/recordTitle";
import {
  MarkedSearchText,
  publisherPublicationLabel,
  searchPreviewText,
} from "../lib/searchPresentation";
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
  onOpenNode: (nodeId: string) => void;
};

export function SearchOverlay(props: SearchOverlayProps) {
  const { bundle, open, onOpenChange, onNavigate, onOpenNode } = props;
  const [query, setQuery] = useState("");
  const [submitStatus, setSubmitStatus] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const composingRef = useRef(false);
  const focusSearchResultsOnCloseRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSubmitStatus("");
      setHighlightedIndex(-1);
    }
  }, [open]);

  const results = useMemo(() => {
    if (!bundle || !query.trim()) {
      return {
        libraryResults: [],
        resourceResults: [],
        communityResults: [],
        guideResults: [],
        sourceResults: [],
      };
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
    const needle = query.trim().toLowerCase();
    const guideResults = practitionerGuides
      .filter((guide) =>
        [guide.title, guide.summary, guide.whereItSits]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
      .slice(0, 3);
    const sourceResults = (bundle.runtime.dataset.sources || [])
      .filter((source: any) =>
        [source.id, source.display_name, source.name, source.publisher]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
      .slice(0, 3);

    return {
      libraryResults,
      resourceResults,
      communityResults,
      guideResults,
      sourceResults,
    };
  }, [bundle, query]);

  const suggestions = useMemo(() => [
    ...results.libraryResults.map((document: any) => ({ id: document.id, kind: "library" })),
    ...results.guideResults.map((guide) => ({ id: guide.id, kind: "guide" })),
    ...results.sourceResults.map((source: any) => ({ id: source.id, kind: "source" })),
    ...results.resourceResults.map((document) => ({ id: document.id, kind: "resource" })),
    ...results.communityResults.map((document) => ({ id: document.id, kind: "community" })),
  ], [results]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [query]);

  function openResult(nodeId: string) {
    onOpenChange(false);
    onOpenNode(nodeId);
  }

  function openCommonsResult(id: string) {
    onOpenChange(false);
    onNavigate("commons-detail", { id });
  }

  function openExplore() {
    focusSearchResultsOnCloseRef.current = true;
    onOpenChange(false);
    onNavigate("search", { query: query.trim() });
  }

  function activateSuggestion(suggestion: { id: string; kind: string }) {
    if (suggestion.kind === "library") {
      openResult(suggestion.id);
      return;
    }
    if (suggestion.kind === "guide") {
      onOpenChange(false);
      onNavigate("patterns", { pattern: suggestion.id });
      return;
    }
    if (suggestion.kind === "source") {
      onOpenChange(false);
      onNavigate("sources", { source: suggestion.id });
      return;
    }
    openCommonsResult(suggestion.id);
  }

  function suggestionIndex(kind: string, id: string) {
    return suggestions.findIndex(
      (suggestion) => suggestion.kind === kind && suggestion.id === id,
    );
  }

  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay search-overlay-backdrop" />
        <Dialog.Content
          aria-label="Search Control Atlas"
          className="search-overlay"
          onCloseAutoFocus={(event) => {
            if (!focusSearchResultsOnCloseRef.current) return;
            focusSearchResultsOnCloseRef.current = false;
            event.preventDefault();
            requestSearchResultsFocus();
          }}
        >
          <form
            className="search-overlay-header"
            onSubmit={(event) => {
              event.preventDefault();
              if (composingRef.current) return;
              if (!query.trim()) {
                setSubmitStatus("Enter an identifier, title, or topic to search.");
                return;
              }
              const highlightedSuggestion = suggestions[highlightedIndex];
              if (highlightedSuggestion) {
                activateSuggestion(highlightedSuggestion);
                return;
              }
              openExplore();
            }}
            role="search"
          >
            <Dialog.Title className="visually-hidden">
              Search Control Atlas
            </Dialog.Title>
            <div className="search-input search-overlay-input">
              <IconSearch aria-hidden="true" size={18} stroke={1.8} />
              <input
                aria-activedescendant={highlightedIndex >= 0 ? `search-suggestion-${highlightedIndex}` : undefined}
                aria-label="Search Control Atlas"
                autoFocus
                id="global-search-query"
                name="query"
                onChange={(event) => { setQuery(event.target.value); setSubmitStatus(""); }}
                onCompositionEnd={() => { composingRef.current = false; }}
                onCompositionStart={() => { composingRef.current = true; }}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
                  event.preventDefault();
                  if (suggestions.length === 0) return;
                  setHighlightedIndex((current) => {
                    if (event.key === "ArrowDown") return (current + 1) % suggestions.length;
                    return current <= 0 ? suggestions.length - 1 : current - 1;
                  });
                }}
                placeholder={GLOBAL_SEARCH_PLACEHOLDER}
                type="search"
                value={query}
              />
              {query ? (
                <button aria-label="Clear search" className="search-overlay-clear" onClick={() => { setQuery(""); setSubmitStatus(""); }} type="button">
                  Clear
                </button>
              ) : null}
            </div>
            <Dialog.Close asChild>
              <button aria-label="Close search" className="icon-button" type="button">
                <IconX aria-hidden="true" size={18} stroke={1.8} />
              </button>
            </Dialog.Close>
            <button className="visually-hidden" type="submit">Search</button>
          </form>
          <span aria-live="polite" className="visually-hidden" role="status">{submitStatus}</span>

          {!bundle ? (
            <p className="field-hint">Loading public data…</p>
          ) : !query.trim() ? (
            <p className="field-hint">
              Type to search records, templates, tools, and Resources. Press
              Enter for the full results page.
            </p>
          ) : results.libraryResults.length === 0 && results.resourceResults.length === 0 && results.communityResults.length === 0 && results.guideResults.length === 0 && results.sourceResults.length === 0 ? (
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
                      const index = suggestionIndex("library", document.id);
                      const title = `${publisherPublicationLabel(document)} · ${recordDisplayTitle({
                        id: document.id,
                        node_type: document.object_type,
                        metadata: { item_id: document.item_id, title: document.title },
                      })}`;
                      return (
                        <li key={document.id}>
                          <button
                            aria-label={document.title || document.item_id}
                            className={`search-overlay-result${highlightedIndex === index ? " is-highlighted" : ""}`}
                            id={`search-suggestion-${index}`}
                            onClick={() => openResult(document.id)}
                            onFocus={() => setHighlightedIndex(index)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            type="button"
                          >
                            <span className="search-overlay-result-title">
                              <MarkedSearchText query={query} text={title} />
                            </span>
                            <span className="search-overlay-result-meta">
                              <code>{document.item_id}</code>
                              {" · "}
                              {displayNameFor("object_type", document.object_type)}
                            </span>
                            <span className="search-overlay-result-summary">
                              <MarkedSearchText query={query} text={searchPreviewText(document)} />
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              {results.guideResults.length > 0 ? (
                <div data-result-class="practitioner-guide">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ca-text-muted)] mb-2 px-3">
                    Guides ({results.guideResults.length})
                  </div>
                  <ul className="search-overlay-results">
                    {results.guideResults.map((guide) => {
                      const index = suggestionIndex("guide", guide.id);
                      return <li key={guide.id}>
                        <button
                          aria-label={guide.title}
                          className={`search-overlay-result${highlightedIndex === index ? " is-highlighted" : ""}`}
                          id={`search-suggestion-${index}`}
                          onClick={() => {
                            onOpenChange(false);
                            onNavigate("patterns", { pattern: guide.id });
                          }}
                          onFocus={() => setHighlightedIndex(index)}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          type="button"
                        >
                          <span className="search-overlay-result-title"><MarkedSearchText query={query} text={`Control Atlas · ${guide.title}`} /></span>
                          <span className="search-overlay-result-meta">Control Atlas guide · topic match</span>
                          <span className="search-overlay-result-summary"><MarkedSearchText query={query} text={guide.summary} /></span>
                        </button>
                      </li>;
                    })}
                  </ul>
                </div>
              ) : null}

              {results.sourceResults.length > 0 ? (
                <div data-result-class="provenance-source">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ca-text-muted)] mb-2 px-3">
                    Sources ({results.sourceResults.length})
                  </div>
                  <ul className="search-overlay-results">
                    {results.sourceResults.map((source: any) => {
                      const index = suggestionIndex("source", source.id);
                      const publisher = source.publisher || source.agency || source.display_group || source.owner || "Source owner";
                      return <li key={source.id}>
                        <button
                          aria-label={source.display_name || source.name || source.id}
                          className={`search-overlay-result${highlightedIndex === index ? " is-highlighted" : ""}`}
                          id={`search-suggestion-${index}`}
                          onClick={() => {
                            onOpenChange(false);
                            onNavigate("sources", { source: source.id });
                          }}
                          onFocus={() => setHighlightedIndex(index)}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          type="button"
                        >
                          <span className="search-overlay-result-title">
                            <MarkedSearchText query={query} text={`${publisher} · ${source.display_name || source.name || source.id}`} />
                          </span>
                          <span className="search-overlay-result-meta">
                            {publisher} · identity match
                          </span>
                        </button>
                      </li>;
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
                    {results.resourceResults.map((doc) => {
                      const index = suggestionIndex("resource", doc.id);
                      return <li key={doc.id}>
                        <button
                          aria-label={doc.name}
                          className={`search-overlay-result${highlightedIndex === index ? " is-highlighted" : ""}`}
                          id={`search-suggestion-${index}`}
                          onClick={() => openCommonsResult(doc.id)}
                          onFocus={() => setHighlightedIndex(index)}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          type="button"
                        >
                          <span className="search-overlay-result-title flex items-center justify-between">
                            <span><MarkedSearchText query={query} text={`${doc.publisher} · ${doc.name}`} /></span>
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
                            <MarkedSearchText query={query} text={doc.summary} />
                          </span>
                        </button>
                      </li>;
                    })}
                  </ul>
                </div>
              ) : null}

              {results.communityResults.length > 0 ? (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ca-primary)] mb-2 px-3">
                    Communities ({results.communityResults.length})
                  </div>
                  <ul className="search-overlay-results">
                    {results.communityResults.map((doc) => {
                      const index = suggestionIndex("community", doc.id);
                      return <li key={doc.id}>
                        <button
                          aria-label={doc.name}
                          className={`search-overlay-result${highlightedIndex === index ? " is-highlighted" : ""}`}
                          id={`search-suggestion-${index}`}
                          onClick={() => openCommonsResult(doc.id)}
                          onFocus={() => setHighlightedIndex(index)}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          type="button"
                        >
                          <span className="search-overlay-result-title">
                            <MarkedSearchText query={query} text={`${doc.publisher} · ${doc.name}`} />
                          </span>
                          <span className="search-overlay-result-meta">
                            <code>{doc.publisher}</code>
                            {" · "}
                            {resourceAccessLabel(doc)}
                          </span>
                          <span className="search-overlay-result-summary">
                            <MarkedSearchText query={query} text={doc.summary} />
                          </span>
                        </button>
                      </li>;
                    })}
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
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
