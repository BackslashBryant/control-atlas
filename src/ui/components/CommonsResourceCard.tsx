import {
  IconBook2,
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
import { IdentityMark } from "./IdentityMark";
import {
  resourceAccessLabel,
  resourceTypeLabel,
} from "../lib/resourceBrands.mjs";
import { resolveIdentity } from "../../shared/identity-registry.mjs";
import { taxonomyTagsForResource } from "../../shared/record-taxonomy.mjs";

const TAG_PRIORITY = ["tool", "framework", "program", "organization"];
const MAX_CARD_TAGS = 2;

type CommonsResourceCardProps = {
  resource: CommonsResource;
  onNavigate?: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onNavigateSearch?: (query: string) => void;
};

const TYPE_GLYPHS = {
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

const IDENTITY_ACCENT: Record<string, string> = {
  "organization.disa": "defense",
  "organization.dod": "defense",
  "organization.dcsa": "defense",
  "organization.nsa": "defense",
  "organization.nist": "federal",
  "organization.cisa": "federal",
  "organization.fedramp": "federal",
  "organization.mitre": "research",
};

function typeGlyphKey(resource: CommonsResource) {
  const type = (resource.resourceType || "").toLowerCase();
  if (type === "community_forum" || type === "community") return "community";
  if (type === "tool") return "tool";
  if (type === "template") return "template";
  if (type === "dataset") return "dataset";
  if (["documentation", "instruction", "policy", "specification", "historical_reference"].includes(type)) return "documentation";
  if (type === "training") return "training";
  if (type === "marketplace") return "marketplace";
  if (type === "restricted_service") return "restricted";
  if (type === "repository") return "repository";
  if (type === "portal" || (resource as CommonsResource & { resourceLane?: string }).resourceLane === "official") return "government";
  return "resource";
}

function resolveResourceMark(resource: CommonsResource) {
  const tags = taxonomyTagsForResource(resource);
  const orgTag = tags.find((t: { kind?: string }) => t.kind === "organization");
  if (orgTag) {
    const identity = resolveIdentity(orgTag.id);
    if (identity) {
      return { termId: orgTag.id, accent: IDENTITY_ACCENT[orgTag.id] || "federal" };
    }
  }
  return null;
}

export function ResourceIdentityMark({ resource }: { resource: CommonsResource }) {
  const mark = resolveResourceMark(resource);

  if (mark) {
    const identity = resolveIdentity(mark.termId)!;
    return (
      <span aria-label={identity.accessible_name} className="resource-brand-mark" role="img" title={identity.label}>
        <IdentityMark size={22} termId={mark.termId} />
      </span>
    );
  }

  const glyphKey = typeGlyphKey(resource);
  const TypeGlyph = TYPE_GLYPHS[glyphKey as keyof typeof TYPE_GLYPHS];
  const typeLabel = resourceTypeLabel(resource.resourceType);

  return (
    <span aria-label={`${typeLabel} identity`} className="resource-brand-mark" role="img" title={typeLabel}>
      {TypeGlyph ? <TypeGlyph aria-hidden="true" stroke={1.8} /> : null}
    </span>
  );
}

export function CommonsResourceCard({
  resource,
  onNavigate,
}: CommonsResourceCardProps) {
  const mark = resolveResourceMark(resource);
  const accent = mark?.accent || "neutral";
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
      className={`commons-card resource-card resource-brand-accent--${accent} group relative flex flex-col justify-between p-5 transition-colors duration-[120ms] hover:bg-[var(--ca-surface-raised)]`}
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
