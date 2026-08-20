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
import { taxonomyTagsForResource } from "../../shared/record-taxonomy.mjs";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import { normalizeViewState, type ViewState } from "../lib/viewState";

type Props = {
  bundle: RuntimeBundle | null;
  viewState: Extract<ViewState, { view: "commons-detail" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
};

function EvidenceCopy({ section }: { section?: { status: string; text: string; sourceUrl: string } }) {
  if (!section) return null;
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
  const taxonomyTags = taxonomyTagsForResource(resource);
  const warning = resource.resourceType === "community_forum"
    ? "Do not post CUI, credentials, system details, assessment evidence, or other non-public organizational information."
    : resource.warnings?.[0];

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
              <p>{resource.overview?.text || resource.summary}</p>
              <EvidenceCopy section={resource.presentationProfile?.whatItDoes} />
              {resource.overview?.sourceUrl ? <p className="resource-detail-evidence"><a href={resource.overview.sourceUrl} rel="noopener noreferrer" target="_blank">{resource.overview.sourceType === "repository_readme" ? "Repository README" : "Publisher source"} <IconExternalLink aria-hidden="true" size={14} /></a></p> : null}
            </DetailSection>
            <DetailSection id="who-it-is-for" title="Who it's for">
              <EvidenceCopy section={resource.presentationProfile?.whoItIsFor} />
              {usefulFor.length ? <div aria-label="Useful for" className="resource-detail-tags">{usefulFor.map((item) => <span key={item}>{resourceFieldLabel(item)}</span>)}</div> : null}
            </DetailSection>
            <DetailSection id="access" title="How to use or access">
              <dl className="resource-detail-facts"><div><dt>Access</dt><dd>{resourceAccessLabel(resource)}</dd></div><div><dt>Cost</dt><dd>{resourceFieldLabel(resource.costType)}</dd></div><div><dt>Status</dt><dd>{resourceFieldLabel(resource.officialStatus || resource.resourceLane)}</dd></div></dl>
              {resource.publicAccessNotes ? <p>{resource.publicAccessNotes}</p> : null}
              {resource.toolProfile ? (
                <div className="resource-tool-profile">
                  <section><h3>Install</h3><EvidenceCopy section={resource.toolProfile.installation} /></section>
                  <section><h3>Use</h3><EvidenceCopy section={resource.toolProfile.usage} /></section>
                  <section><h3>Inputs and outputs</h3><EvidenceCopy section={resource.toolProfile.inputs} /><EvidenceCopy section={resource.toolProfile.outputs} /></section>
                  <section><h3>Formats and integrations</h3><EvidenceCopy section={resource.toolProfile.formats} /><EvidenceCopy section={resource.toolProfile.integrations} /></section>
                </div>
              ) : null}
              <ul className="resource-link-list"><li><a href={resource.canonicalUrl} rel="noopener noreferrer" target="_blank">Official resource <IconExternalLink aria-hidden="true" size={14} /></a></li>{resource.repositoryUrl ? <li><a href={resource.repositoryUrl} rel="noopener noreferrer" target="_blank">Source repository <IconExternalLink aria-hidden="true" size={14} /></a></li> : null}{resource.toolProfile?.release?.url ? <li><a href={resource.toolProfile.release.url} rel="noopener noreferrer" target="_blank">Releases <IconExternalLink aria-hidden="true" size={14} /></a></li> : null}{resource.downloadLinks?.map((url) => <li key={url}><a href={url} rel="noopener noreferrer" target="_blank">Publisher download <IconExternalLink aria-hidden="true" size={14} /></a></li>)}{resource.alternateUrls?.map((url) => <li key={url}><a href={url} rel="noopener noreferrer" target="_blank">Alternate publisher link <IconExternalLink aria-hidden="true" size={14} /></a></li>)}</ul>
            </DetailSection>
            {resource.media?.status === "available" ? (
              <DetailSection id="screenshots" title="Screenshots">
                <div className="resource-detail-media">{resource.media.items.map((item) => <figure key={`${item.url}-${item.sha256}`}><img alt={item.alt} height={item.height} loading="lazy" src={item.url} width={item.width} /><figcaption>Publisher image. <a href={item.sourceUrl} rel="noopener noreferrer" target="_blank">View source</a></figcaption></figure>)}</div>
              </DetailSection>
            ) : null}
            <DetailSection id="limitations" title="Limitations"><EvidenceCopy section={resource.presentationProfile?.limitations} /></DetailSection>
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
            <nav aria-label="On this page" className="resource-detail-toc">
              <strong>On this page</strong>
              <a href="#what-it-is">What it is</a>
              <a href="#who-it-is-for">Who it's for</a>
              <a href="#access">How to use or access</a>
              {resource.media?.status === "available" ? <a href="#screenshots">Screenshots</a> : null}
              <a href="#limitations">Limitations</a>
              <a href="#related-resources">Related resources</a>
              {taxonomyTags.length ? <a href="#related-topics">Related topics</a> : null}
            </nav>
            <dl className="resource-detail-brief"><div><dt>Type</dt><dd>{resourceTypeLabel(resource.resourceType)}</dd></div>{resource.maintainer && resource.maintainer !== resource.publisher ? <div><dt>Maintained by</dt><dd>{resource.maintainer}</dd></div> : null}<div><dt>Why it is listed</dt><dd>{resource.whyIncluded}</dd></div></dl>
            <details className="resource-detail-maintenance">
              <summary>Source &amp; maintenance details</summary>
              <div>
                <dl className="resource-detail-facts stacked"><div><dt>Release</dt><dd>{resource.currentVersion || (resource.toolProfile?.release.status === "not_published" ? "No published GitHub release" : "Not documented")}</dd></div><div><dt>Maintenance</dt><dd>{resourceFieldLabel(resource.maintenanceStatus)}</dd></div><div><dt>License</dt><dd>{resource.license || "Not documented"}</dd></div><div><dt>Last repository activity</dt><dd><ResourceDate fallback="Not documented" value={resource.lastCommitAt} /></dd></div>{resource.publisherUpdatedAt ? <div><dt>Publisher updated</dt><dd><ResourceDate fallback="Not documented" value={resource.publisherUpdatedAt} /></dd></div> : null}<div><dt>Last checked</dt><dd><ResourceDate fallback="Not documented" value={resource.lastCheckedAt} /></dd></div><div><dt>Next review</dt><dd><ResourceDate fallback="Not scheduled" value={resource.nextCheckAt} /></dd></div><div><dt>Verification method</dt><dd>{resourceFieldLabel(resource.verificationMethod || "manual_review")}</dd></div>{resource.repositoryEvidence ? <div><dt>Evidence commit</dt><dd><a href={resource.repositoryEvidence.commitUrl} rel="noopener noreferrer" target="_blank">{resource.repositoryEvidence.commitSha.slice(0, 7)} <IconExternalLink aria-hidden="true" size={13} /></a></dd></div> : null}</dl>
                <section><h3>Compatibility evidence</h3>{resource.compatibility?.status === "documented" ? <div className="resource-detail-tags">{[...resource.compatibility.operatingSystems, ...resource.compatibility.environments].map((item) => <span key={item}>{item}</span>)}</div> : null}<p>{resource.compatibility?.note || "The publisher didn't state compatibility."}</p>{resource.compatibility?.sourceUrl ? <p className="resource-detail-evidence"><a href={resource.compatibility.sourceUrl} rel="noopener noreferrer" target="_blank">View evidence <IconExternalLink aria-hidden="true" size={14} /></a></p> : null}</section>
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
