import React, { useState } from "react";
import {
  IconExternalLink,
  IconCopy,
  IconCheck,
  IconAlertTriangle,
  IconInfoCircle
} from "@tabler/icons-react";
import type { CommonsResource } from "../lib/commonsTypes";
import { CommonsLaneBadge, commonsLaneLabel } from "./CommonsLaneBadge";

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

  // Max 3 visible badges
  const badges: string[] = [commonsLaneLabel(resource.resourceLane)];
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
    <article className="group relative flex flex-col justify-between rounded-md border border-[var(--ca-border)] bg-[color-mix(in_srgb,var(--ca-surface)_80%,transparent)] p-5 shadow-sm transition-all duration-200 hover:border-[var(--ca-border-strong)] hover:bg-[var(--ca-surface)] hover:shadow-[0_4px_12px_color-mix(in_srgb,var(--ca-primary)_20%,transparent)]">
      <div>
        {/* Header badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <CommonsLaneBadge lane={resource.resourceLane} />

          {visibleBadges.slice(1).map((b, idx) => (
            <span
              key={idx}
              className="commons-neutral-badge"
            >
              {b}
            </span>
          ))}

          {resource.maintenanceStatus === "archived" || resource.maintenanceStatus === "superseded" ? (
            <span className="commons-warning-badge">
              <IconAlertTriangle size={12} />
              {resource.maintenanceStatus}
            </span>
          ) : null}
        </div>

        {/* Resource Name */}
        <h3 className="text-lg font-semibold text-[var(--ca-text)] group-hover:text-[var(--ca-primary)] transition-colors">
          {onSelectDetail ? (
            <button
              onClick={() => onSelectDetail(resource.id)}
              className="text-left hover:underline focus:outline-none focus:text-[var(--ca-primary)]"
            >
              {resource.name}
            </button>
          ) : (
            resource.name
          )}
        </h3>

        {/* Publisher info */}
        <p className="text-xs text-[var(--ca-secondary)] mt-1 mb-3">
          <span className="font-medium text-[var(--ca-text)]">{resource.publisher}</span>
          {resource.maintainer ? ` · ${resource.maintainer}` : ""}
          {resource.currentVersion ? ` · ${resource.currentVersion}` : ""}
        </p>

        {/* Short purpose summary */}
        <p className="text-sm text-[var(--ca-text)] leading-relaxed mb-4">
          {resource.summary}
        </p>

        {/* Why Included callout */}
        <div className="rounded-sm bg-[var(--ca-surface)] border border-[color-mix(in_srgb,var(--ca-border)_80%,transparent)] p-3 mb-4">
          <div className="flex items-start gap-2">
            <IconInfoCircle size={15} className="text-[var(--ca-primary)] mt-0.5 shrink-0" />
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ca-primary)] block mb-0.5">
                Why it is useful
              </span>
              <p className="text-xs text-[var(--ca-text)] leading-normal">
                {resource.whyIncluded}
              </p>
            </div>
          </div>
        </div>

        {/* Tags preview */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {resource.frameworks.map((fw) => (
            <button
              type="button"
              key={fw}
              className="commons-tag-button"
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigateSearch) onNavigateSearch(fw);
              }}
            >
              {fw}
            </button>
          ))}
          {resource.artifactTypes.map((art) => (
            <span key={art} className="text-[11px] px-2 py-0.5 rounded bg-[color-mix(in_srgb,var(--ca-surface-raised)_60%,transparent)] text-[var(--ca-secondary)]">
              {art}
            </span>
          ))}
        </div>
      </div>

      {/* Card Actions */}
      <div className="pt-3 border-t border-[color-mix(in_srgb,var(--ca-border)_80%,transparent)] flex items-center justify-between gap-2 mt-auto">
        <a
          href={resource.canonicalUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-[var(--ca-primary)] text-[var(--ca-bg)] hover:brightness-110 font-medium text-xs shadow transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ca-primary)]"
        >
          <span>Open resource</span>
          <IconExternalLink size={14} />
        </a>

        <div className="flex items-center gap-2">
          {onSelectDetail ? (
            <button
              onClick={() => onSelectDetail(resource.id)}
              className="px-3 py-1.5 rounded-sm border border-[var(--ca-border-strong)] hover:bg-[var(--ca-surface-raised)] text-[var(--ca-text)] text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ca-border-strong)]"
            >
              Details
            </button>
          ) : null}

          <button
            onClick={handleCopyLink}
            title="Copy link to resource"
            className="p-1.5 rounded-sm text-[var(--ca-secondary)] hover:text-[var(--ca-text)] hover:bg-[var(--ca-surface-raised)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ca-border-strong)]"
            aria-label="Copy link"
          >
            {copied ? <IconCheck size={16} className="text-[var(--ca-success)]" /> : <IconCopy size={16} />}
          </button>
        </div>
      </div>
    </article>
  );
}
