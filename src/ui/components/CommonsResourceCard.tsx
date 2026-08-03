import React, { useState } from "react";
import {
  IconExternalLink,
  IconCopy,
  IconCheck,
  IconAlertTriangle,
  IconBrandAws,
  IconBrandGithub,
  IconBrandReddit,
  IconBrandSlack,
  IconBrandWindows,
  IconWorld
} from "@tabler/icons-react";
import type { CommonsResource } from "../lib/commonsTypes";
import { hostIdentity } from "../lib/commonsPresentation.mjs";
import { serializeHashLocation } from "../lib/hashRoutes";
import { CommonsLaneBadge, commonsLaneLabel } from "./CommonsLaneBadge";
import { PRIMARY_BROWSE_CATEGORIES, primaryBrowseCategory } from "../lib/resourcesDirectory.mjs";

type CommonsResourceCardProps = {
  resource: CommonsResource;
  onSelectDetail?: (id: string) => void;
  onNavigateSearch?: (query: string) => void;
};

const BRAND_GLYPHS = {
  github: IconBrandGithub,
  reddit: IconBrandReddit,
  slack: IconBrandSlack,
  aws: IconBrandAws,
  microsoft: IconBrandWindows
} as const;

/**
 * Answers "where does this link actually go?" before the visitor reads a word of
 * copy — the thing a flat grid of 99 similar cards cannot say. Marks are bundled
 * inline SVG or a text monogram; nothing is fetched, because the site's CSP
 * blocks remote requests and it has to work offline.
 */
export function CommonsHostChip({ canonicalUrl }: { canonicalUrl: string }) {
  const identity = hostIdentity(canonicalUrl);
  if (!identity.host) return null;

  const BrandGlyph = BRAND_GLYPHS[identity.kind as keyof typeof BRAND_GLYPHS];

  return (
    <span className="commons-host" title={identity.host}>
      <span className="commons-host-mark" aria-hidden="true">
        {BrandGlyph ? (
          <BrandGlyph size={14} stroke={1.8} />
        ) : identity.kind === "monogram" ? (
          identity.label
        ) : (
          <IconWorld size={14} stroke={1.8} />
        )}
      </span>
      <span className="commons-host-name">{identity.host}</span>
    </span>
  );
}

export function CommonsResourceCard({
  resource,
  onSelectDetail,
  onNavigateSearch
}: CommonsResourceCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}#${serializeHashLocation({ view: "commons-detail", id: resource.id })}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Max 3 visible badges
  const badges: string[] = [commonsLaneLabel(resource.resourceLane)];
  if (resource.openSource && resource.resourceLane !== "open_source") {
    badges.push("Open Source");
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
    /* `commons-card` carries the Orbital instrument grammar (relay top-datum,
       grain, corner registration ticks) that styles/orbital.css already defines
       for the whole card family. The box utilities it replaces were Tailwind
       `!important` declarations that no stylesheet rule could override. */
    <article className="commons-card group relative flex flex-col justify-between p-5 transition-all duration-200 hover:bg-[var(--ca-surface-raised)]">
      <div>
        {/* Identity gets its own line, then classification. Sharing one row with
            the badges wrapped 17 of 99 cards onto a ragged second line, because a
            card can carry three badges plus the host. */}
        <div className="mb-2">
          <CommonsHostChip canonicalUrl={resource.canonicalUrl} />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <CommonsLaneBadge lane={resource.resourceLane} />
          <span className="commons-neutral-badge">
            {PRIMARY_BROWSE_CATEGORIES.find((category) => category.id === primaryBrowseCategory(resource))?.label}
          </span>

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

        {/* Why this is here. Deliberately not a bordered panel: a box inside
            every card made 99 cards read as one repeating shape, and shrank the
            sentence to 12px. Same content, one less frame. */}
        <div className="mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ca-primary)] block mb-0.5">
            Why Control Atlas lists this
          </span>
          <p className="text-sm text-[var(--ca-text-muted)] leading-relaxed">
            {resource.whyIncluded}
          </p>
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
          {/* Muted, not accented: `--ca-secondary` is an alias of `--ca-primary`
              (styles/tokens.css:47), so these chips used to paint the card's
              least important content in its loudest colour — four competing cyan
              elements per card, which is what made a grid of them read as one
              texture. The accent now belongs to the lane badge and the primary
              action only. */}
          {resource.artifactTypes.map((art) => (
            <span key={art} className="text-[11px] px-2 py-0.5 rounded bg-[color-mix(in_srgb,var(--ca-surface-raised)_60%,transparent)] text-[var(--ca-text-muted)]">
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
              className="px-3 py-1.5 rounded-sm border border-[var(--ca-border-strong)] bg-transparent hover:bg-[var(--ca-surface-raised)] text-[var(--ca-text)] text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ca-border-strong)]"
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
