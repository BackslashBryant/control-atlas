import React, { useMemo } from "react";
import { IconBook2, IconExternalLink, IconSparkles, IconChevronRight, IconShieldCheck, IconCode, IconUsers } from "@tabler/icons-react";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";
import type { CommonsResource } from "../lib/commonsTypes";

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
  const index = bundle?.commonsSearchIndex;
  const dataset = bundle?.commonsDataset;

  const matchingResources = useMemo(() => {
    if (!dataset?.resources) return [];

    let results = [...dataset.resources];
    const q = (query || contextId || framework).toLowerCase().trim();

    if (contextType === "stig") {
      results = results.filter((r) =>
        r.id.includes("stig") ||
        r.frameworks.some((f) => f.toLowerCase().includes("stig")) ||
        r.searchKeywords.some((k) => k.toLowerCase().includes("stig"))
      );
    } else if (contextType === "template") {
      results = results.filter((r) =>
        r.resourceType === "template" ||
        r.artifactTypes.includes("template") ||
        r.id.includes("template") ||
        r.id.includes("ssp") ||
        r.id.includes("poam")
      );
    } else if (contextType === "workforce") {
      results = results.filter((r) =>
        r.id.includes("8140") ||
        r.id.includes("nice") ||
        r.id.includes("dcwf") ||
        r.frameworks.some((f) => f.toLowerCase().includes("8140"))
      );
    } else if (q) {
      results = results.filter((r) =>
        r.name.toLowerCase().includes(q) ||
        r.shortName.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.frameworks.some((f) => f.toLowerCase().includes(q)) ||
        (r.searchKeywords && r.searchKeywords.some((k) => k.toLowerCase().includes(q)))
      );
    }

    // Sort: Editorial recommendations first, then official, then open source
    return results
      .sort((a, b) => {
        if (a.editorialRecommendation && !b.editorialRecommendation) return -1;
        if (!a.editorialRecommendation && b.editorialRecommendation) return 1;
        if (a.resourceLane === "official" && b.resourceLane !== "official") return -1;
        if (a.resourceLane !== "official" && b.resourceLane === "official") return 1;
        return 0;
      })
      .slice(0, maxItems);
  }, [dataset, contextType, contextId, query, framework, maxItems]);

  if (matchingResources.length === 0) return null;

  const defaultTitles: Record<typeof contextType, string> = {
    control: "Working Tools & Implementation Guidance",
    catalog: "Framework Tools & Official Resources",
    stig: "STIG Viewers, Automated Scripts & Checklist Tools",
    template: "Related Compliance Templates & OSCAL Models",
    compare: "Crosswalk Tools & Reference Datasets",
    guide: "Practitioner Guides & Community Channels",
    workforce: "Workforce Qualification & Skilling Resources"
  };

  const moduleTitle = title || defaultTitles[contextType];

  return (
    <aside aria-label={moduleTitle} className="rounded-xl border border-cyan-900/50 bg-slate-900/90 p-4 shadow-md my-4">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-cyan-950 text-cyan-400">
            <IconBook2 size={16} />
          </span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Control Commons · {moduleTitle}
          </h3>
        </div>

        {onNavigate ? (
          <button
            onClick={() => onNavigate("commons", { query: query || contextId || framework })}
            className="text-[11px] font-semibold text-cyan-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Explore all Commons ({dataset?.resources.length})</span>
            <IconChevronRight size={12} />
          </button>
        ) : null}
      </div>

      <div className="space-y-2.5">
        {matchingResources.map((res) => (
          <div
            key={res.id}
            className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/70 hover:bg-slate-950 transition-colors flex items-start justify-between gap-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate?.("commons-detail", { id: res.id, from: contextType })}
                  className="text-xs font-semibold text-slate-100 hover:text-cyan-400 text-left"
                >
                  {res.name}
                </button>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 capitalize">
                  {res.resourceLane.replace("_", " ")}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                {res.whyIncluded}
              </p>
            </div>

            <a
              href={res.canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-cyan-300 p-1 shrink-0"
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
