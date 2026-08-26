import {
  IconAlertTriangle,
  IconBook2,
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconFlag,
} from "@tabler/icons-react";
import { useMemo, useState, type ReactNode } from "react";

import "../../../styles/resources.css";
import { ResourceIdentityMark } from "../components/CommonsResourceCard";
import { AppLink } from "../components/AppLink";
import type { CommonsResource } from "../lib/commonsTypes";
import { resourceDateLabel } from "../lib/commonsPresentation.mjs";
import { serializeHashLocation } from "../lib/hashRoutes";
import { resourceAccessLabel, resourceFieldLabel, resourceTypeLabel } from "../lib/resourceBrands.mjs";

import { taxonomyTagsForResource, deriveTags } from "../../shared/record-taxonomy.mjs";
import { effectiveProfile } from "../../shared/entity-profiles.mjs";
import { AtlasTag } from "../components/AtlasTag";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import { normalizeViewState, type ViewState } from "../lib/viewState";

const ATLAS_TAG_DIMENSIONS = new Set(["organization", "framework", "program", "tool", "artifact", "topic"]);

type Props = {
  bundle: RuntimeBundle | null;
  viewState: Extract<ViewState, { view: "commons-detail" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
};

function EvidenceCopy({ section }: { section?: { status: string; text: string; sourceUrl: string } }) {
  if (!section || section.status !== "documented" || !section.text?.trim()) return null;
  return (
    <div className={`resource-evidence-copy resource-evidence-copy--${section.status}`}>
      <p>{section.text}</p>
      <p className="resource-detail-evidence"><a href={section.sourceUrl} rel="noopener noreferrer" target="_blank">Evidence <IconExternalLink aria-hidden="true" size={14} /></a></p>
    </div>
  );
}

function ResourceDate({ value, fallback }: { value?: string | null; fallback: string }) {
  const label = resourceDateLabel(value);
  return value && label ? <time dateTime={value}>{label}</time> : fallback;
}

export function CommonsDetailPage({ bundle, viewState, onNavigate }: Props) {
  const id = viewState.id;
  const [copied, setCopied] = useState(false);
  const dataset = bundle?.commonsDataset;
  const resource = useMemo(() => dataset?.resources.find((entry) => entry.id === id) as CommonsResource | undefined, [dataset, id]);

  if (!resource) {
    return <div className="resource-detail-page"><section className="empty-state"><IconAlertTriangle aria-hidden="true" size={36} /><h1>Resource not found</h1><p>This directory does not contain “{id}”.</p></section></div>;
  }

  const parent = resource.parentEcosystemId ? dataset?.resources.find((entry) => entry.id === resource.parentEcosystemId) : null;
  const children = dataset?.resources.filter((entry) => resource.childResourceIds?.includes(entry.id)) || [];
  const collections = dataset?.collections.filter((collection) => resource.featuredCollections?.includes(collection.id)) || [];
  const usefulFor = [...resource.lifecycleStages, ...(resource.technologyScopes || []), ...resource.audiences].filter(Boolean);
  const allTags = taxonomyTagsForResource(resource);
  const taxonomyTags = allTags.filter((t: { kind?: string }) => !ATLAS_TAG_DIMENSIONS.has(t.kind ?? ""));
  const atlasTagIds = [
    ...allTags.filter((t: { kind?: string }) => ATLAS_TAG_DIMENSIONS.has(t.kind ?? "")),
    ...deriveTags(allTags),
  ].reduce<string[]>((acc, t: { id: string }) => { if (!acc.includes(t.id)) acc.push(t.id); return acc; }, []);
  const warning = resource.resourceType === "community_forum"
    ? "Do not post CUI, credentials, system details, assessment evidence, or other non-public organizational information."
    : resource.warnings?.[0];
  const profileSections = new Set(effectiveProfile(resource.profileId)?.display_sections || []);
  const hasAudience = profileSections.has("who_for") && (resource.presentationProfile?.whoItIsFor?.status === "documented"
    || usefulFor.length > 0);
  const hasLimitations = profileSections.has("limitations") && resource.presentationProfile?.limitations?.status === "documented";
  const lifecycleStatus = resource.lifecycle?.status || "unknown";
  const documentedToolSections = resource.toolProfile
    ? ["installation", "usage", "inputs", "outputs", "formats", "integrations"].filter((field) => {
        const section = resource.toolProfile?.[field as keyof typeof resource.toolProfile];
        return section && typeof section === "object" && "status" in section && section.status === "documented";
      })
    : [];

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#${serializeHashLocation(normalizeViewState("commons-detail", { id }))}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="resource-detail-page">
      <div className="ca-content-container resource-detail-shell">
        <nav aria-label="Resource detail actions" className="resource-detail-nav">
          <div>
            <button onClick={copyLink} type="button">{copied ? <IconCheck aria-hidden="true" size={15} /> : <IconCopy aria-hidden="true" size={15} />}{copied ? "Link copied" : "Copy link"}</button>
            <a href="https://github.com/rambulls/control-atlas/issues/new?template=report-broken-link.yml" rel="noopener noreferrer" target="_blank"><IconFlag aria-hidden="true" size={15} />Report a problem</a>
          </div>
        </nav>

        <header className="resource-detail-hero">
          <ResourceIdentityMark resource={resource} />
          <div>
            <p className="eyebrow">Resource</p>
            {!["active", "unknown"].includes(lifecycleStatus) ? <span className="badge tone-warning">{resourceFieldLabel(lifecycleStatus)}</span> : null}
            <h1>{resource.name}</h1>
            <p className="resource-detail-owner">Publisher <strong>{resource.publisher}</strong></p>
            <p className="resource-detail-summary">{resource.cardPurpose || resource.summary}</p>
            <div className="resource-detail-actions">
              <a className="resource-primary-link" href={resource.canonicalUrl} rel="noopener noreferrer" target="_blank">Open resource <IconExternalLink aria-hidden="true" size={16} /></a>
              {resource.repositoryUrl ? <a href={resource.repositoryUrl} rel="noopener noreferrer" target="_blank">Source repository <IconExternalLink aria-hidden="true" size={15} /></a> : null}
            </div>
          </div>
        </header>

        {warning ? <aside className="resource-detail-warning"><IconAlertTriangle aria-hidden="true" size={20} /><p>{warning}</p></aside> : null}

        <div className="resource-detail-grid">
          <article className="resource-detail-main">
            <DetailSection id="what-it-is" title="What it is">
              {/* Show overview text when distinct from the hero summary; skip when
                  the hero already displayed the same summary (cardPurpose absent). */}
              {resource.overview?.text
                ? <p>{resource.overview.text}</p>
                : resource.cardPurpose
                  ? <p>{resource.summary}</p>
                  : null}
              <EvidenceCopy section={resource.presentationProfile?.whatItDoes} />
              {resource.overview?.sourceUrl ? <p className="resource-detail-evidence"><a href={resource.overview.sourceUrl} rel="noopener noreferrer" target="_blank">{resource.overview.sourceType === "repository_readme" ? "Repository README" : "Publisher source"} <IconExternalLink aria-hidden="true" size={14} /></a></p> : null}
            </DetailSection>
            {hasAudience ? <DetailSection id="who-it-is-for" title="Who it's for">
              <EvidenceCopy section={resource.presentationProfile?.whoItIsFor} />
              {usefulFor.length ? <div aria-label="Useful for" className="resource-detail-tags">{usefulFor.map((item) => <span key={item}>{resourceFieldLabel(item)}</span>)}</div> : null}
            </DetailSection> : null}
            <DetailSection id="access" title="How to use or access">
              <dl className="resource-detail-facts"><div><dt>Access</dt><dd>{resourceAccessLabel(resource)}</dd></div>{resource.costType ? <div><dt>Cost</dt><dd>{resourceFieldLabel(resource.costType)}</dd></div> : null}{resource.officialStatus ? <div><dt>Status</dt><dd>{resourceFieldLabel(resource.officialStatus)}</dd></div> : null}</dl>
              {resource.publicAccessNotes ? <p>{resource.publicAccessNotes}</p> : null}
              {resource.toolProfile && documentedToolSections.length ? (
                <div className="resource-tool-profile">
                  {resource.toolProfile.installation?.status === "documented" ? <section><h3>Install</h3><EvidenceCopy section={resource.toolProfile.installation} /></section> : null}
                  {resource.toolProfile.usage?.status === "documented" ? <section><h3>Use</h3><EvidenceCopy section={resource.toolProfile.usage} /></section> : null}
                  {resource.toolProfile.inputs?.status === "documented" || resource.toolProfile.outputs?.status === "documented" ? <section><h3>Inputs and outputs</h3><EvidenceCopy section={resource.toolProfile.inputs} /><EvidenceCopy section={resource.toolProfile.outputs} /></section> : null}
                  {resource.toolProfile.formats?.status === "documented" || resource.toolProfile.integrations?.status === "documented" ? <section><h3>Formats and integrations</h3><EvidenceCopy section={resource.toolProfile.formats} /><EvidenceCopy section={resource.toolProfile.integrations} /></section> : null}
                </div>
              ) : null}
              <ul className="resource-link-list"><li><a href={resource.canonicalUrl} rel="noopener noreferrer" target="_blank">Official resource <IconExternalLink aria-hidden="true" size={14} /></a></li>{resource.repositoryUrl ? <li><a href={resource.repositoryUrl} rel="noopener noreferrer" target="_blank">Source repository <IconExternalLink aria-hidden="true" size={14} /></a></li> : null}{resource.toolProfile?.release?.status === "published" && resource.toolProfile.release.url ? <li><a href={resource.toolProfile.release.url} rel="noopener noreferrer" target="_blank">Releases <IconExternalLink aria-hidden="true" size={14} /></a></li> : null}{resource.downloadLinks?.map((url) => <li key={url}><a href={url} rel="noopener noreferrer" target="_blank">Publisher download <IconExternalLink aria-hidden="true" size={14} /></a></li>)}{resource.alternateUrls?.map((url) => <li key={url}><a href={url} rel="noopener noreferrer" target="_blank">Alternate publisher link <IconExternalLink aria-hidden="true" size={14} /></a></li>)}</ul>
            </DetailSection>
            {resource.media?.status === "available" ? (
              <DetailSection id="screenshots" title="Screenshots">
                <div className="resource-detail-media">{resource.media.items.map((item) => <figure key={`${item.url}-${item.sha256}`}><img alt={item.alt} height={item.height} loading="lazy" src={item.url} width={item.width} /><figcaption>Publisher image. <a href={item.sourceUrl} rel="noopener noreferrer" target="_blank">View source</a></figcaption></figure>)}</div>
              </DetailSection>
            ) : null}
            {hasLimitations ? <DetailSection id="limitations" title="Limitations"><EvidenceCopy section={resource.presentationProfile?.limitations} /></DetailSection> : null}
            <DetailSection id="related-resources" title="Related resources">
              {parent ? <AppLink className="resource-context-link" onNavigate={onNavigate} patch={{ ...viewState, id: parent.id }} view="commons-detail"><span>Part of</span><strong>{parent.name}</strong></AppLink> : null}
              {children.map((child) => <AppLink className="resource-context-link" key={child.id} onNavigate={onNavigate} patch={{ ...viewState, id: child.id }} view="commons-detail"><span>Related service</span><strong>{child.name}</strong></AppLink>)}
              {collections.map((collection) => <AppLink className="resource-context-link" key={collection.id} onNavigate={onNavigate} patch={{ collection: collection.id, showAll: "true" }} view="commons"><span>Collection</span><strong>{collection.title}</strong></AppLink>)}
              <AppLink className="resource-library-search" onNavigate={onNavigate} patch={{ query: resource.frameworks[0] || resource.programs?.[0] || resource.shortName }} view="search"><IconBook2 aria-hidden="true" size={16} />Find related publications</AppLink>
            </DetailSection>
            {taxonomyTags.length ? (
              <DetailSection id="related-topics" title="Related topics">
                <div className="resource-detail-tags">
                  {taxonomyTags.map((tag) => (
                    <AppLink key={tag.id} onNavigate={onNavigate} patch={{ tags: [tag.id] }} view="search">{tag.label}</AppLink>
                  ))}
                </div>
              </DetailSection>
            ) : null}
          </article>

          <aside className="resource-detail-side">
            {atlasTagIds.length > 0 ? (
              <section className="related-in-atlas">
                <h2>Related in Control Atlas</h2>
                <div className="related-in-atlas__tags">
                  {atlasTagIds.map((tagId: string) => (
                    <AtlasTag key={tagId} onNavigate={onNavigate} showIdentity size="sm" tagId={tagId} />
                  ))}
                </div>
              </section>
            ) : null}
            <nav aria-label="On this page" className="resource-detail-toc">
              <strong>On this page</strong>
              <a href="#what-it-is">What it is</a>
              {hasAudience ? <a href="#who-it-is-for">Who it's for</a> : null}
              <a href="#access">How to use or access</a>
              {resource.media?.status === "available" ? <a href="#screenshots">Screenshots</a> : null}
              {hasLimitations ? <a href="#limitations">Limitations</a> : null}
              <a href="#related-resources">Related resources</a>
              {taxonomyTags.length ? <a href="#related-topics">Related topics</a> : null}
            </nav>
            <dl className="resource-detail-brief"><div><dt>Type</dt><dd>{resourceTypeLabel(resource.resourceType)}</dd></div>{resource.maintainer && resource.maintainer !== resource.publisher ? <div><dt>Maintained by</dt><dd>{resource.maintainer}</dd></div> : null}<div><dt>Why it is listed</dt><dd>{resource.whyIncluded}</dd></div></dl>
            <details className="resource-detail-maintenance">
              <summary>Source &amp; maintenance details</summary>
              <div>
                <dl className="resource-detail-facts stacked">{resource.currentVersion || resource.toolProfile?.release.status === "not_published" ? <div><dt>Release</dt><dd>{resource.currentVersion || "No published GitHub release"}</dd></div> : null}{resource.maintenanceStatus !== "unknown" ? <div><dt>Maintenance</dt><dd>{resourceFieldLabel(resource.maintenanceStatus)}</dd></div> : null}{resource.license ? <div><dt>License</dt><dd>{resource.license}</dd></div> : null}{resource.lastCommitAt ? <div><dt>Last repository activity</dt><dd><ResourceDate fallback="" value={resource.lastCommitAt} /></dd></div> : null}{resource.publisherUpdatedAt ? <div><dt>Publisher updated</dt><dd><ResourceDate fallback="" value={resource.publisherUpdatedAt} /></dd></div> : null}{resource.lastCheckedAt ? <div><dt>Last checked</dt><dd><ResourceDate fallback="" value={resource.lastCheckedAt} /></dd></div> : null}{resource.nextCheckAt ? <div><dt>Next review</dt><dd><ResourceDate fallback="" value={resource.nextCheckAt} /></dd></div> : null}{resource.verificationMethod ? <div><dt>Verification method</dt><dd>{resourceFieldLabel(resource.verificationMethod)}</dd></div> : null}{resource.repositoryEvidence ? <div><dt>Evidence commit</dt><dd><a href={resource.repositoryEvidence.commitUrl} rel="noopener noreferrer" target="_blank">{resource.repositoryEvidence.commitSha.slice(0, 7)} <IconExternalLink aria-hidden="true" size={13} /></a></dd></div> : null}</dl>
                {resource.compatibility?.status === "documented" ? <section><h3>Compatibility evidence</h3><div className="resource-detail-tags">{[...resource.compatibility.operatingSystems, ...resource.compatibility.environments].map((item) => <span key={item}>{item}</span>)}</div>{resource.compatibility.note ? <p>{resource.compatibility.note}</p> : null}<p className="resource-detail-evidence"><a href={resource.compatibility.sourceUrl} rel="noopener noreferrer" target="_blank">View evidence <IconExternalLink aria-hidden="true" size={14} /></a></p></section> : null}
                {taxonomyTags.length ? <section><h3>Topic basis</h3><p>Related topics are derived from reviewed technology scope and compatibility fields.</p></section> : null}
              </div>
            </details>
          </aside>
        </div>
      </div>
    </div>
  );
}

function DetailSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return <section className="resource-detail-section" id={id}><h2>{title}</h2>{children}</section>;
}
