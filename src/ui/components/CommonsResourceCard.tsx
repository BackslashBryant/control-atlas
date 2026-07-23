import React, { useState } from "react";
import {
  IconExternalLink,
  IconCopy,
  IconCheck,
  IconShieldCheck,
  IconCode,
  IconUsers,
  IconBuildingStore,
  IconArchive,
  IconSparkles,
  IconAlertTriangle,
  IconInfoCircle
} from "@tabler/icons-react";
import type { CommonsResource, CommonsResourceLane } from "../lib/commonsTypes";

type CommonsResourceCardProps = {
  resource: CommonsResource;
  onSelectDetail?: (id: string) => void;
  onNavigateSearch?: (query: string) => void;
};

export function CommonsResourceCard({
  resource,
  onSelectDetail,
  onNavigateSearch
}: CommonsResourceCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}#/commons-detail?id=${encodeURIComponent(resource.id)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const laneBadgeConfig: Record<
    CommonsResourceLane,
    { label: string; bg: string; text: string; icon: React.ComponentType<{ size?: number; className?: string }> }
  > = {
    official: { label: "Official", bg: "bg-blue-900/40 border-blue-500/40", text: "text-blue-300", icon: IconShieldCheck },
    open_source: { label: "Open Source", bg: "bg-emerald-900/40 border-emerald-500/40", text: "text-emerald-300", icon: IconCode },
    practitioner: { label: "Practitioner", bg: "bg-purple-900/40 border-purple-500/40", text: "text-purple-300", icon: IconUsers },
    commercial: { label: "Commercial", bg: "bg-amber-900/40 border-amber-500/40", text: "text-amber-300", icon: IconBuildingStore },
    legacy: { label: "Legacy Record", bg: "bg-zinc-800 border-zinc-600", text: "text-zinc-400", icon: IconArchive }
  };

  const lane = laneBadgeConfig[resource.resourceLane] || laneBadgeConfig.official;
  const LaneIcon = lane.icon;

  // Max 3 visible badges
  const badges: string[] = [lane.label];
  if (resource.openSource && resource.resourceLane !== "open_source") {
    badges.push("Open Source");
  }
  if (resource.editorialRecommendation) {
    badges.push("Recommended");
  }
  if (resource.accessType === "cac_or_piv") {
    badges.push("CAC/PIV Required");
  } else if (resource.accessType === "free_account") {
    badges.push("Free Account");
  } else if (resource.accessType === "customer_only") {
    badges.push("Customer Only");
  }

  const visibleBadges = badges.slice(0, 3);

  return (
    <article
      tabIndex={0}
      role="region"
      aria-label={`Resource: ${resource.name}`}
      className="group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg transition-all duration-200 hover:border-slate-700 hover:bg-slate-900 hover:shadow-cyan-950/20 focus:outline-none focus:ring-2 focus:ring-cyan-500"
    >
      <div>
        {/* Header badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${lane.bg} ${lane.text}`}
          >
            <LaneIcon size={14} />
            {lane.label}
          </span>

          {visibleBadges.slice(1).map((b, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-normal border border-slate-700 bg-slate-800/80 text-slate-300"
            >
              {b}
            </span>
          ))}

          {resource.maintenanceStatus === "archived" || resource.maintenanceStatus === "superseded" ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-950/50 border border-rose-800 text-rose-300">
              <IconAlertTriangle size={12} />
              {resource.maintenanceStatus}
            </span>
          ) : null}
        </div>

        {/* Resource Name */}
        <h3 className="text-lg font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors">
          {onSelectDetail ? (
            <button
              onClick={() => onSelectDetail(resource.id)}
              className="text-left hover:underline focus:outline-none focus:text-cyan-400"
            >
              {resource.name}
            </button>
          ) : (
            resource.name
          )}
        </h3>

        {/* Publisher info */}
        <p className="text-xs text-slate-400 mt-1 mb-3">
          <span className="font-medium text-slate-300">{resource.publisher}</span>
          {resource.maintainer ? ` · ${resource.maintainer}` : ""}
          {resource.currentVersion ? ` · ${resource.currentVersion}` : ""}
        </p>

        {/* Short purpose summary */}
        <p className="text-sm text-slate-300 leading-relaxed mb-4">
          {resource.summary}
        </p>

        {/* Why Included callout */}
        <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3 mb-4">
          <div className="flex items-start gap-2">
            <IconInfoCircle size={15} className="text-cyan-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 block mb-0.5">
                Why it is useful
              </span>
              <p className="text-xs text-slate-300 leading-normal">
                {resource.whyIncluded}
              </p>
            </div>
          </div>
        </div>

        {/* Tags preview */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {resource.frameworks.map((fw) => (
            <span
              key={fw}
              className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigateSearch) onNavigateSearch(fw);
              }}
            >
              {fw}
            </span>
          ))}
          {resource.artifactTypes.map((art) => (
            <span key={art} className="text-[11px] px-2 py-0.5 rounded bg-slate-800/60 text-slate-400">
              {art}
            </span>
          ))}
        </div>
      </div>

      {/* Card Actions */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-auto">
        <a
          href={resource.canonicalUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
        >
          <span>Open resource</span>
          <IconExternalLink size={14} />
        </a>

        <div className="flex items-center gap-2">
          {onSelectDetail ? (
            <button
              onClick={() => onSelectDetail(resource.id)}
              className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              Details
            </button>
          ) : null}

          <button
            onClick={handleCopyLink}
            title="Copy link to resource"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
            aria-label="Copy link"
          >
            {copied ? <IconCheck size={16} className="text-emerald-400" /> : <IconCopy size={16} />}
          </button>
        </div>
      </div>
    </article>
  );
}
