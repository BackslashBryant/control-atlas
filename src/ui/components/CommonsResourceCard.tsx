import {
  IconBook2,
  IconBrandGithub,
  IconBrandReddit,
  IconBrandSlack,
  IconBrandWindows,
  IconBuildingStore,
  IconCode,
  IconDatabase,
  IconExternalLink,
  IconFileText,
  IconLock,
  IconSchool,
  IconShieldCheck,
  IconTool,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react";

import type { CommonsResource } from "../lib/commonsTypes";
import {
  resourceAccessLabel,
  resourceBrandIdentity,
  resourceTypeLabel,
} from "../lib/resourceBrands.mjs";

type CommonsResourceCardProps = {
  resource: CommonsResource;
  onSelectDetail?: (id: string) => void;
  onNavigateSearch?: (query: string) => void;
};

const BRAND_GLYPHS = {
  github: IconBrandGithub,
  reddit: IconBrandReddit,
  slack: IconBrandSlack,
  microsoft: IconBrandWindows,
  government: IconShieldCheck,
  tool: IconTool,
  template: IconFileText,
  dataset: IconDatabase,
  documentation: IconBook2,
  training: IconSchool,
  marketplace: IconBuildingStore,
  community: IconUsers,
  repository: IconCode,
  restricted: IconLock,
  resource: IconWorld,
} as const;

export function ResourceIdentityMark({ resource }: { resource: CommonsResource }) {
  const identity = resourceBrandIdentity(resource);
  const BrandGlyph =
    BRAND_GLYPHS[identity.iconKey as keyof typeof BRAND_GLYPHS];

  return (
    <span
      aria-label={identity.accessibleName}
      className="resource-brand-mark"
      role="img"
      title={identity.ownerLabel}
    >
      {BrandGlyph ? (
        <BrandGlyph aria-hidden="true" stroke={1.8} />
      ) : (
        <span aria-hidden="true" className="resource-brand-initials">
          {identity.initials || identity.ownerLabel.slice(0, 3).toUpperCase()}
        </span>
      )}
    </span>
  );
}

export function CommonsResourceCard({
  resource,
  onSelectDetail,
}: CommonsResourceCardProps) {
  const identity = resourceBrandIdentity(resource);
  const cardPurpose =
    (resource as CommonsResource & { cardPurpose?: string }).cardPurpose?.trim() ||
    resource.summary;

  return (
    <article
      className={`commons-card resource-card resource-brand-accent--${identity.accent} group relative flex flex-col justify-between p-5 transition-all duration-200 hover:bg-[var(--ca-surface-raised)]`}
    >
      <div>
        <div className="resource-card-header">
          <ResourceIdentityMark resource={resource} />
          <div className="resource-card-heading">
            <h3 className="text-lg font-semibold text-[var(--ca-text)] group-hover:text-[var(--ca-primary)] transition-colors">
              {onSelectDetail ? (
                <button
                  className="text-left hover:underline focus:outline-none focus:text-[var(--ca-primary)]"
                  onClick={() => onSelectDetail(resource.id)}
                >
                  {resource.name}
                </button>
              ) : (
                resource.name
              )}
            </h3>
            <p className="resource-card-owner">{resource.publisher}</p>
          </div>
        </div>

        <div className="resource-card-metadata">
          <span className="resource-card-type">
            {resourceTypeLabel(resource.resourceType)}
          </span>
          <span className="resource-card-access">
            {resourceAccessLabel(resource)}
          </span>
        </div>

        <p className="resource-card-purpose">{cardPurpose}</p>
      </div>

      <div className="pt-3 border-t border-[color-mix(in_srgb,var(--ca-border)_80%,transparent)] flex items-center justify-between gap-2 mt-auto">
        <a
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-[var(--ca-primary)] text-[var(--ca-bg)] hover:brightness-110 font-medium text-xs shadow transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ca-primary)]"
          href={resource.canonicalUrl}
          onClick={(event) => event.stopPropagation()}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span>Open resource</span>
          <IconExternalLink aria-hidden="true" size={14} />
        </a>

        {onSelectDetail ? (
          <button
            className="px-3 py-1.5 rounded-sm border border-[var(--ca-border-strong)] bg-transparent hover:bg-[var(--ca-surface-raised)] text-[var(--ca-text)] text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ca-border-strong)]"
            onClick={() => onSelectDetail(resource.id)}
          >
            Details
          </button>
        ) : null}
      </div>
    </article>
  );
}
