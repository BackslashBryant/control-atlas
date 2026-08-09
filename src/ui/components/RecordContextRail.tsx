import {
  IconArrowRight,
  IconBook2,
  IconExternalLink,
  IconSparkles,
} from "@tabler/icons-react";
import { useMemo } from "react";

import type { CommonsResource } from "../lib/commonsTypes";
import {
  contextualResourceQuery,
  contextualSuggestionsForRecord,
} from "../lib/contextualMatching";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";
import { Badge, SummaryCard } from "../lib/pagePrimitives";

type PublishedBucket = {
  id: string;
  label: string;
  items: Array<{ id: string; label: string }>;
};

export function RecordContextRail(props: {
  bundle: RuntimeBundle;
  node: any;
  document: any;
  publishedBuckets: PublishedBucket[];
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNode: (nodeId: string) => void;
}) {
  const {
    bundle,
    node,
    document,
    publishedBuckets,
    onNavigate,
    onOpenNode,
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
      {publishedBuckets.length ? (
        <SummaryCard title="Published connections" tone="trust">
          <p className="record-context-owner">
            <Badge tone="success">Published fact</Badge>
            Only published graph relationships with citations appear here.
          </p>
          <div className="record-context-published">
            {publishedBuckets.map((bucket) => (
              <section key={bucket.id}>
                <h3>{bucket.label}</h3>
                <div className="record-context-link-list">
                  {bucket.items.slice(0, 4).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onOpenNode(item.id)}
                      type="button"
                    >
                      <span>{item.label}</span>
                      <IconArrowRight aria-hidden="true" size={14} />
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </SummaryCard>
      ) : null}

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
                <button
                  onClick={() =>
                    onNavigate(
                      suggestion.destination.view,
                      suggestion.destination.patch,
                    )
                  }
                  type="button"
                >
                  <strong>{suggestion.title}</strong>
                  <span>{suggestion.owner}</span>
                </button>
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
            <button
              className="record-suggestion-view-all"
              onClick={() =>
                onNavigate("commons", {
                  query: resourceQuery,
                  showAll: "true",
                })
              }
              type="button"
            >
              <IconBook2 aria-hidden="true" size={15} />
              View all matching resources
            </button>
          ) : null}
        </section>
      ))}
    </div>
  );
}
