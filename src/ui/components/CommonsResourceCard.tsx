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
import type { ViewState } from "../lib/viewState";
import { AppLink } from "./AppLink";
import { AtlasTag } from "./AtlasTag";
import {
  resourceAccessLabel,
  resourceBrandIdentity,
  resourceTypeLabel,
} from "../lib/resourceBrands.mjs";
import { taxonomyTagsForResource } from "../../shared/record-taxonomy.mjs";

const TAG_PRIORITY = ["tool", "framework", "program", "organization"];
const MAX_CARD_TAGS = 2;

type CommonsResourceCardProps = {
  resource: CommonsResource;
  onNavigate?: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
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
  onNavigate,
}: CommonsResourceCardProps) {
  const identity = resourceBrandIdentity(resource);
  const cardPurpose =
    (resource as CommonsResource & { cardPurpose?: string }).cardPurpose?.trim() ||
    resource.summary;

  const cardTagIds = (() => {
    if (!onNavigate) return [];
    const tags = taxonomyTagsForResource(resource);
    const sorted = TAG_PRIORITY.flatMap((dim) =>
      tags.filter((t: { kind?: string }) => t.kind === dim).map((t: { id: string }) => t.id),
    );
    return sorted.slice(0, MAX_CARD_TAGS);
  })();

  return (
    <article
      className={`commons-card resource-card resource-brand-accent--${identity.accent} group relative flex flex-col justify-between p-5 transition-colors duration-[120ms] hover:bg-[var(--ca-surface-raised)]`}
    >
      <div>
        <div className="resource-card-header">
          <ResourceIdentityMark resource={resource} />
          <div className="resource-card-heading">
            <h3 className="text-lg font-semibold text-[var(--ca-text)] group-hover:text-[var(--ca-primary)] transition-colors">
              {onNavigate ? (
                <AppLink
                  className="text-left hover:underline focus:outline-none focus:text-[var(--ca-primary)]"
                  onNavigate={onNavigate}
                  patch={{ id: resource.id }}
                  view="commons-detail"
                >
                  {resource.name}
                </AppLink>
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

        {cardTagIds.length > 0 ? (
          <div className="related-in-atlas__tags" style={{ marginBlockStart: "var(--ca-space-xs)" }}>
            {cardTagIds.map((tagId) => (
              <AtlasTag key={tagId} onNavigate={onNavigate!} showIdentity size="sm" tagId={tagId} />
            ))}
          </div>
        ) : null}

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

        {onNavigate ? (
          <AppLink
            className="px-3 py-1.5 rounded-sm border border-[var(--ca-border-strong)] bg-transparent hover:bg-[var(--ca-surface-raised)] text-[var(--ca-text)] text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ca-border-strong)]"
            onNavigate={onNavigate}
            patch={{ id: resource.id }}
            view="commons-detail"
          >
            Details
          </AppLink>
        ) : null}
      </div>
    </article>
  );
}
