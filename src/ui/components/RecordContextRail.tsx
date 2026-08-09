import { IconBook2, IconExternalLink, IconSparkles } from "@tabler/icons-react";
import { useMemo } from "react";

import type { CommonsResource } from "../lib/commonsTypes";
import {
  contextualResourceQuery,
  contextualSuggestionsForRecord,
} from "../lib/contextualMatching";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";
import { AppLink } from "./AppLink";

export function RecordContextRail(props: {
  bundle: RuntimeBundle;
  node: any;
  document: any;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  const {
    bundle,
    node,
    document,
    onNavigate,
  } = props;
  const resources = (bundle.commonsDataset?.resources || []) as CommonsResource[];
  const suggestions = useMemo(
    () =>
      contextualSuggestionsForRecord({
        node,
        document,
        resources,
        maxPerGroup: 3,
      }),
    [document, node, resources],
  );
  const suggestionGroups = Object.entries(
    suggestions.reduce<Record<string, typeof suggestions>>((groups, suggestion) => {
      groups[suggestion.group] ||= [];
      groups[suggestion.group].push(suggestion);
      return groups;
    }, {}),
  );
  const resourceQuery = contextualResourceQuery(node, document);

  return (
    <div className="record-context-rail" data-editorial-boundary="explicit">
      {suggestionGroups.map(([group, entries]) => (
        <section
          aria-labelledby={`suggestion-${group.replace(/\W+/g, "-").toLowerCase()}`}
          className="record-suggestion-group"
          key={group}
        >
          <header>
            <div>
              <p className="record-suggestion-label">
                <IconSparkles aria-hidden="true" size={14} />
                Control Atlas suggestions
              </p>
              <h2 id={`suggestion-${group.replace(/\W+/g, "-").toLowerCase()}`}>
                {group}
              </h2>
            </div>
          </header>
          <div className="record-suggestion-list">
            {entries.map((suggestion) => (
              <article key={suggestion.id}>
                <AppLink
                  onNavigate={onNavigate}
                  patch={suggestion.destination.patch}
                  view={suggestion.destination.view}
                >
                  <strong>{suggestion.title}</strong>
                  <span>{suggestion.owner}</span>
                </AppLink>
                <p>{suggestion.summary}</p>
                <p className="record-suggestion-reason">
                  <strong>Why shown:</strong> {suggestion.reason.label}
                </p>
                {suggestion.resource?.canonicalUrl ? (
                  <a
                    href={suggestion.resource.canonicalUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Publisher or project site
                    <IconExternalLink aria-hidden="true" size={13} />
                  </a>
                ) : null}
              </article>
            ))}
          </div>
          {entries.some((entry) => entry.resource) ? (
            <AppLink
              className="record-suggestion-view-all"
              onNavigate={onNavigate}
              patch={{ query: resourceQuery, showAll: "true" }}
              view="commons"
            >
              <IconBook2 aria-hidden="true" size={15} />
              View all matching resources
            </AppLink>
          ) : null}
        </section>
      ))}
    </div>
  );
}
