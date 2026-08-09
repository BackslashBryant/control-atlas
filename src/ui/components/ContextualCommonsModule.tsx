import React, { useMemo } from "react";
import { IconBook2, IconExternalLink, IconChevronRight } from "@tabler/icons-react";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";
import { contextualResourceRecommendations } from "../lib/contextualResourceRecommendations.mjs";

type ContextualCommonsModuleProps = {
  bundle: RuntimeBundle | null;
  contextType: "control" | "catalog" | "stig" | "template" | "compare" | "guide" | "workforce";
  contextId?: string;
  query?: string;
  framework?: string;
  onNavigate?: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  title?: string;
  maxItems?: number;
};

export function ContextualCommonsModule({
  bundle,
  contextType,
  contextId = "",
  query = "",
  framework = "",
  onNavigate,
  title,
  maxItems = 3
}: ContextualCommonsModuleProps) {
  const dataset = bundle?.commonsDataset;

  const recommendations = useMemo(() => {
    if (!dataset?.resources) return [];
    return contextualResourceRecommendations({ resources: dataset.resources, contextType, contextId, query, framework, maxItems });
  }, [dataset, contextType, contextId, query, framework, maxItems]);

  if (recommendations.length === 0) return null;

  const defaultContextLabels: Record<typeof contextType, string> = {
    // Never "implementation guidance" — these are search-relevance matches
    // (see contextualResourceRecommendations' "relation" field below), not a
    // verified graph edge. Calling a keyword match implementation guidance
    // is exactly the false claim this label exists to avoid.
    control: "Related by search relevance, not a verified implementation link",
    catalog: "Official and practitioner material for this framework",
    stig: "Supporting material for this STIG",
    template: "Templates and OSCAL models that may help",
    compare: "Crosswalks and reference datasets for this comparison",
    guide: "Practitioner guides and community channels",
    workforce: "Workforce qualification and skilling material"
  };

  const contextLabel = title || defaultContextLabels[contextType];

  return (
    <aside aria-label={`Related resources: ${contextLabel}`} className="contextual-resources rounded-md border border-[color-mix(in_srgb,var(--ca-primary)_20%,transparent)] bg-[var(--ca-surface-deep)] p-4 shadow-md">
      <div className="flex items-center justify-between mb-3 border-b border-[var(--ca-border)] pb-2">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-[color-mix(in_srgb,var(--ca-primary)_20%,transparent)] text-[var(--ca-primary)]">
            <IconBook2 size={16} />
          </span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ca-text)]">
            Related resources
          </h3>
        </div>

        {onNavigate ? (
          <button
            onClick={() => onNavigate("commons", { query: query || contextId || framework })}
            className="text-[11px] font-semibold bg-transparent text-[var(--ca-text)] hover:underline inline-flex items-center gap-1"
          >
            <span>See all resources ({dataset?.resources.length})</span>
            <IconChevronRight size={12} />
          </button>
        ) : null}
      </div>
      <p className="contextual-resources-label">{contextLabel}</p>

      <div className="space-y-2.5">
        {recommendations.map(({ resource: res, target, relation, reason, provenance, reviewDate }) => (
          <div
            key={res.id}
            className="p-2.5 rounded-sm border border-[var(--ca-border)] bg-[var(--ca-surface)] hover:bg-[var(--ca-surface-raised)] transition-colors flex items-start justify-between gap-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate?.("commons-detail", { id: res.id })}
                  className="text-xs font-semibold bg-transparent text-[var(--ca-text)] hover:text-[var(--ca-primary)] text-left"
                >
                  {res.name}
                </button>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--ca-surface-raised)] text-[var(--ca-text)] capitalize">
                  {res.resourceLane.replace("_", " ")}
                </span>
              </div>
              <p className="text-[11px] text-[var(--ca-secondary)] mt-0.5">
                {reason}
              </p>
              <dl className="mt-2 grid gap-1 text-[10px] text-[var(--ca-text-muted)]">
                <div><dt className="inline font-semibold">Target: </dt><dd className="inline">{target}</dd></div>
                <div><dt className="inline font-semibold">Relation: </dt><dd className="inline">{relation}</dd></div>
                <div><dt className="inline font-semibold">Provenance: </dt><dd className="inline">{provenance}</dd></div>
                <div><dt className="inline font-semibold">Reviewed: </dt><dd className="inline">{reviewDate}</dd></div>
              </dl>
            </div>

            <a
              href={res.canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--ca-secondary)] hover:text-[var(--ca-primary)] p-1 shrink-0"
              title="Open canonical source link"
            >
              <IconExternalLink size={14} />
            </a>
          </div>
        ))}
      </div>
    </aside>
  );
}
