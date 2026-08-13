import {
  IconAlertTriangle,
  IconArrowLeft,
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
import { serializeHashLocation } from "../lib/hashRoutes";
import { resourceAccessLabel, resourceTypeLabel } from "../lib/resourceBrands.mjs";
import { taxonomyTagsForResource } from "../../shared/record-taxonomy.mjs";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";

type Props = {
  bundle: RuntimeBundle | null;
  viewState: ViewState;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
};

function display(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function EvidenceCopy({ section }: { section?: { status: string; text: string; sourceUrl: string } }) {
  if (!section) return null;
  return (
    <div className={`resource-evidence-copy resource-evidence-copy--${section.status}`}>
      <p>{section.text}</p>
      <p className="resource-detail-evidence"><a href={section.sourceUrl} rel="noopener noreferrer" target="_blank">Evidence <IconExternalLink aria-hidden="true" size={14} /></a></p>
    </div>
  );
}

export function CommonsDetailPage({ bundle, viewState, onNavigate }: Props) {
  const id = viewState.view === "commons-detail" ? viewState.id : "";
  const [copied, setCopied] = useState(false);
  const dataset = bundle?.commonsDataset;
  const resource = useMemo(() => dataset?.resources.find((entry) => entry.id === id) as CommonsResource | undefined, [dataset, id]);

  if (!resource) {
    return <div className="resource-detail-page"><section className="empty-state"><IconAlertTriangle aria-hidden="true" size={36} /><h1>Resource not found</h1><p>This directory does not contain “{id}”.</p><AppLink onNavigate={onNavigate} view="commons">Return to Resources</AppLink></section></div>;
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
    await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#${serializeHashLocation({ view: "commons-detail", id })}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="resource-detail-page">
      <div className="ca-content-container resource-detail-shell">
        <nav aria-label="Resource detail actions" className="resource-detail-nav">
          <AppLink onNavigate={onNavigate} view="commons"><IconArrowLeft aria-hidden="true" size={16} />Back</AppLink>
          <div>
            <button onClick={copyLink} type="button">{copied ? <IconCheck aria-hidden="true" size={15} /> : <IconCopy aria-hidden="true" size={15} />}{copied ? "Link copied" : "Copy link"}</button>
            <a href="https://github.com/BackslashBryant/control-atlas/issues/new?template=report-broken-link.yml" rel="noopener noreferrer" target="_blank"><IconFlag aria-hidden="true" size={15} />Report a problem</a>
          </div>
        </nav>

        <header className="resource-detail-hero">
          <ResourceIdentityMark resource={resource} />
          <div>
            <p className="eyebrow">{resourceTypeLabel(resource.resourceType)}</p>
            <h1>{resource.name}</h1>
            <p className="resource-detail-owner">Published by <strong>{resource.publisher}</strong>{resource.maintainer && resource.maintainer !== resource.publisher ? ` · Maintained by ${resource.maintainer}` : ""}</p>
            <p className="resource-detail-summary">{resource.cardPurpose || resource.summary}</p>
            <div className="resource-detail-actions">
              <a className="resource-primary-link" href={resource.canonicalUrl} rel="noopener noreferrer" target="_blank">Open resource <IconExternalLink aria-hidden="true" size={16} /></a>
              {resource.repositoryUrl ? <a href={resource.repositoryUrl} rel="noopener noreferrer" target="_blank">Source repository <IconExternalLink aria-hidden="true" size={15} /></a> : null}
            </div>
          </div>
        </header>

        {warning ? <aside className="resource-detail-warning"><IconAlertTriangle aria-hidden="true" size={20} /><p>{warning}</p></aside> : null}

        <div className="resource-detail-grid">
          <div className="resource-detail-main">
            <DetailSection title="What This Is">
              <p>{resource.overview?.text || resource.summary}</p>
              {resource.overview?.sourceUrl ? <p className="resource-detail-evidence"><a href={resource.overview.sourceUrl} rel="noopener noreferrer" target="_blank">{resource.overview.sourceType === "repository_readme" ? "Repository README" : "Publisher source"} <IconExternalLink aria-hidden="true" size={14} /></a></p> : null}
            </DetailSection>
            <DetailSection title="What It Does"><EvidenceCopy section={resource.presentationProfile?.whatItDoes} /></DetailSection>
            <DetailSection title="Who It Is For"><EvidenceCopy section={resource.presentationProfile?.whoItIsFor} /></DetailSection>
            {resource.media?.status === "available" ? (
              <DetailSection title="Screenshots">
                <div className="resource-detail-media">{resource.media.items.map((item) => <figure key={`${item.url}-${item.sha256}`}><img alt={item.alt} height={item.height} loading="lazy" src={item.url} width={item.width} /><figcaption>Publisher image from commit {item.commitSha.slice(0, 7)} / {item.width}x{item.height} / {item.license}. <a href={item.sourceUrl} rel="noopener noreferrer" target="_blank">Source</a></figcaption></figure>)}</div>
              </DetailSection>
            ) : resource.resourceType === "tool" ? <DetailSection title="Screenshots"><p>{resource.media?.reason || "No attributable publisher screenshot was available."}</p></DetailSection> : null}
            <DetailSection title="Useful For"><div className="resource-detail-tags">{usefulFor.map((item) => <span key={item}>{display(item)}</span>)}</div></DetailSection>
            {taxonomyTags.length ? (
              <DetailSection title="Governed discovery tags">
                <p>These tags come only from reviewed structured resource fields. They open the matching Library context; they do not claim that a framework applies to this resource.</p>
                <div className="resource-detail-tags">
                  {taxonomyTags.map((tag) => (
                    <AppLink key={tag.id} onNavigate={onNavigate} patch={{ tags: [tag.id] }} view="search">{tag.label}</AppLink>
                  ))}
                </div>
              </DetailSection>
            ) : null}
            <DetailSection title="Compatibility">
              {resource.compatibility?.status === "documented" ? <div className="resource-detail-tags">{[...resource.compatibility.operatingSystems, ...resource.compatibility.environments].map((item) => <span key={item}>{item}</span>)}</div> : null}
              <p>{resource.compatibility?.note || "Compatibility was not stated in the reviewed publisher source."}</p>
              {resource.compatibility?.sourceUrl ? <p className="resource-detail-evidence"><a href={resource.compatibility.sourceUrl} rel="noopener noreferrer" target="_blank">Compatibility evidence <IconExternalLink aria-hidden="true" size={14} /></a></p> : null}
            </DetailSection>
            {resource.toolProfile ? (
              <>
                <DetailSection title="Inputs, Outputs, and Integrations">
                  <div className="resource-tool-profile-grid">
                    <section><h3>Inputs</h3><EvidenceCopy section={resource.toolProfile.inputs} /></section>
                    <section><h3>Outputs</h3><EvidenceCopy section={resource.toolProfile.outputs} /></section>
                    <section><h3>Formats</h3><EvidenceCopy section={resource.toolProfile.formats} /></section>
                    <section><h3>Integrations</h3><EvidenceCopy section={resource.toolProfile.integrations} /></section>
                  </div>
                </DetailSection>
                <DetailSection title="Install and Run">
                  <div className="resource-tool-profile-grid">
                    <section><h3>Installation</h3><EvidenceCopy section={resource.toolProfile.installation} /></section>
                    <section><h3>Usage</h3><EvidenceCopy section={resource.toolProfile.usage} /></section>
                  </div>
                </DetailSection>
              </>
            ) : null}
            <DetailSection title="Access">
              <dl className="resource-detail-facts"><div><dt>Access</dt><dd>{resourceAccessLabel(resource)}</dd></div><div><dt>Cost</dt><dd>{display(resource.costType)}</dd></div><div><dt>Status</dt><dd>{display(resource.officialStatus || resource.resourceLane)}</dd></div></dl>
              <p>{resource.publicAccessNotes}</p>
            </DetailSection>
            <DetailSection title="Links">
              <ul className="resource-link-list"><li><a href={resource.canonicalUrl} rel="noopener noreferrer" target="_blank">Canonical resource <IconExternalLink aria-hidden="true" size={14} /></a></li>{resource.repositoryEvidence?.readmeUrl ? <li><a href={resource.repositoryEvidence.readmeUrl} rel="noopener noreferrer" target="_blank">Inspected README <IconExternalLink aria-hidden="true" size={14} /></a></li> : null}{resource.toolProfile?.release?.url ? <li><a href={resource.toolProfile.release.url} rel="noopener noreferrer" target="_blank">Releases <IconExternalLink aria-hidden="true" size={14} /></a></li> : null}{resource.downloadLinks?.map((url) => <li key={url}><a href={url} rel="noopener noreferrer" target="_blank">Publisher download <IconExternalLink aria-hidden="true" size={14} /></a></li>)}{resource.alternateUrls?.map((url) => <li key={url}><a href={url} rel="noopener noreferrer" target="_blank">Publisher alternate <IconExternalLink aria-hidden="true" size={14} /></a></li>)}</ul>
            </DetailSection>
            <DetailSection title="Why It Is Listed"><p>{resource.whyIncluded}</p></DetailSection>
            <DetailSection title="Limitations"><EvidenceCopy section={resource.presentationProfile?.limitations} /></DetailSection>
          </div>

          <aside className="resource-detail-side">
            {parent || children.length > 0 || collections.length > 0 ? (
              <DetailSection title="Related Resources">
                {parent ? <AppLink className="resource-context-link" onNavigate={onNavigate} patch={{ id: parent.id }} view="commons-detail"><span>Part of</span><strong>{parent.name}</strong></AppLink> : null}
                {children.map((child) => <AppLink className="resource-context-link" key={child.id} onNavigate={onNavigate} patch={{ id: child.id }} view="commons-detail"><span>Related service</span><strong>{child.name}</strong></AppLink>)}
                {collections.map((collection) => <AppLink className="resource-context-link" key={collection.id} onNavigate={onNavigate} patch={{ collection: collection.id, showAll: "true" }} view="commons"><span>Collection</span><strong>{collection.title}</strong></AppLink>)}
              </DetailSection>
            ) : null}
            <DetailSection title="Related Publications">
              <p>Search the Library for publications related to this resource.</p>
              <AppLink className="resource-library-search" onNavigate={onNavigate} patch={{ query: resource.frameworks[0] || resource.programs?.[0] || resource.shortName }} view="search"><IconBook2 aria-hidden="true" size={16} />Search the Library</AppLink>
            </DetailSection>
            <DetailSection title="Maintenance">
              <dl className="resource-detail-facts stacked"><div><dt>Release</dt><dd>{resource.currentVersion || (resource.toolProfile?.release.status === "not_published" ? "No published GitHub release" : "Not documented")}</dd></div><div><dt>Maintenance</dt><dd>{display(resource.maintenanceStatus)}</dd></div><div><dt>License</dt><dd>{resource.license || "Not documented"}</dd></div><div><dt>Last repository activity</dt><dd>{resource.lastCommitAt || resource.publisherUpdatedAt || "Not documented"}</dd></div><div><dt>Last checked</dt><dd>{resource.lastCheckedAt}</dd></div><div><dt>Next review</dt><dd>{resource.nextCheckAt || "Not scheduled"}</dd></div><div><dt>Method</dt><dd>{display(resource.verificationMethod || "manual review")}</dd></div></dl>
              {resource.repositoryEvidence ? <p className="resource-detail-evidence"><a href={resource.repositoryEvidence.commitUrl} rel="noopener noreferrer" target="_blank">Evidence commit {resource.repositoryEvidence.commitSha.slice(0, 7)} <IconExternalLink aria-hidden="true" size={14} /></a></p> : null}
            </DetailSection>
          </aside>
        </div>
      </div>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="resource-detail-section"><h2>{title}</h2>{children}</section>;
}
