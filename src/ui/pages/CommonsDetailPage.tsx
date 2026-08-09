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
            <DetailSection title="What this is"><p>{resource.summary}</p></DetailSection>
            <DetailSection title="Useful for"><div className="resource-detail-tags">{usefulFor.map((item) => <span key={item}>{display(item)}</span>)}</div></DetailSection>
            <DetailSection title="Access">
              <dl className="resource-detail-facts"><div><dt>Access</dt><dd>{resourceAccessLabel(resource)}</dd></div><div><dt>Cost</dt><dd>{display(resource.costType)}</dd></div><div><dt>Status</dt><dd>{display(resource.officialStatus || resource.resourceLane)}</dd></div></dl>
              <p>{resource.publicAccessNotes}</p>
            </DetailSection>
            <DetailSection title="Official links">
              <ul className="resource-link-list"><li><a href={resource.canonicalUrl} rel="noopener noreferrer" target="_blank">Canonical resource <IconExternalLink aria-hidden="true" size={14} /></a></li>{resource.alternateUrls?.map((url) => <li key={url}><a href={url} rel="noopener noreferrer" target="_blank">Publisher alternate <IconExternalLink aria-hidden="true" size={14} /></a></li>)}</ul>
            </DetailSection>
            <DetailSection title="Why it is listed"><p>{resource.whyIncluded}</p></DetailSection>
          </div>

          <aside className="resource-detail-side">
            <DetailSection title="Ecosystem context">
              {parent ? <AppLink className="resource-context-link" onNavigate={onNavigate} patch={{ id: parent.id }} view="commons-detail"><span>Parent</span><strong>{parent.name}</strong></AppLink> : <p>This is a top-level resource.</p>}
              {children.map((child) => <AppLink className="resource-context-link" key={child.id} onNavigate={onNavigate} patch={{ id: child.id }} view="commons-detail"><span>Related service</span><strong>{child.name}</strong></AppLink>)}
              {collections.map((collection) => <AppLink className="resource-context-link" key={collection.id} onNavigate={onNavigate} patch={{ collection: collection.id, showAll: "true" }} view="commons"><span>Collection</span><strong>{collection.title}</strong></AppLink>)}
            </DetailSection>
            <DetailSection title="Related publications">
              <p>Search Library for governing publications and source records related to this resource.</p>
              <AppLink className="resource-library-search" onNavigate={onNavigate} patch={{ query: resource.frameworks[0] || resource.programs?.[0] || resource.shortName }} view="search"><IconBook2 aria-hidden="true" size={16} />Search related publications</AppLink>
            </DetailSection>
            <DetailSection title="Maintenance">
              <dl className="resource-detail-facts stacked"><div><dt>Last checked</dt><dd>{resource.lastCheckedAt}</dd></div><div><dt>Next review</dt><dd>{resource.nextCheckAt || "Not scheduled"}</dd></div><div><dt>Method</dt><dd>{display(resource.verificationMethod || "manual review")}</dd></div></dl>
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
