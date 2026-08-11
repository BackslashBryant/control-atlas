import { Fragment, useState, type ReactNode } from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import {
  missingRequiredRecordFields,
  recordPresentationProfile,
} from "../../shared/record-presentation.mjs";
import {
  buildSourceTextPresentation,
  isValidSourceTextPresentation,
} from "../../shared/source-text-presentation.mjs";
import authoritySpine from "../../../data/curated/authority-spine.json";
import { AcronymText } from "../components/AccessibleTerm";
import { AppLink } from "../components/AppLink";
import { CanonicalBreadcrumb } from "../components/CanonicalBreadcrumb";
import { Button, ButtonLink } from "../components/lsm";
import { BucketTag, LineTag } from "../components/TaxonomyTag";
import { catalogProfileFor } from "../lib/catalogProfiles";
import {
  buildAtlasTreeModel,
  extendDisplayedAuthorityTrace,
  type AtlasTraceHop,
} from "../lib/atlasTreeModel";
import { serializeHashUrl } from "../lib/hashRoutes";
import {
  Badge,
  copyText,
  formatRelationshipLabel,
} from "../lib/pagePrimitives";
import {
  buildRecordConnectionGroups,
  recordIdentityFor,
  humanReadableEvidenceLocator,
  officialRecordName,
  recordPublisherName,
} from "../lib/recordTitle";
import { recordTagsFor, tagProvenanceExplanation } from "../lib/recordTags";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import { normalizeViewState, type ViewState } from "../lib/viewState";

const ODP_PATTERN = /\[(?:Assignment|Selection)[^\]]*\]/g;

function renderOdpText(text: string): ReactNode {
  if (!text) return text;
  const parts = text.split(ODP_PATTERN);
  const matches = text.match(ODP_PATTERN) || [];
  if (matches.length === 0) return text;
  const nodes: ReactNode[] = [];
  parts.forEach((part, index) => {
    if (part) nodes.push(<Fragment key={`t-${index}`}>{part}</Fragment>);
    if (index < matches.length) {
      nodes.push(
        <span className="odp-param" key={`m-${index}`}>
          {matches[index]}
        </span>,
      );
    }
  });
  return nodes;
}

function CopyableCodeSnippet(props: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="source-code-snippet" data-source-code-snippet>
      <div className="source-code-snippet__header">
        <span>Command or configuration</span>
        <Button
          onClick={() => {
            void copyText(props.value).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            });
          }}
          type="button"
          variant="secondary"
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre><code>{props.value}</code></pre>
    </div>
  );
}

function SourceTextBlocks(props: { value: string; presentation?: any }) {
  const text = String(props.value || "");
  const resolvedPresentation = isValidSourceTextPresentation(text, props.presentation)
    ? props.presentation
    : buildSourceTextPresentation(text);
  return (
    <>
      {resolvedPresentation.blocks.map((block: any, index: number) => {
        if (block.kind === "code") {
          return <CopyableCodeSnippet key={`code-${block.start}-${index}`} value={text.slice(block.start, block.end)} />;
        }
        if (block.kind === "list") {
          const List = block.ordered ? "ol" : "ul";
          return <List className="source-procedure-list" key={`list-${index}`}>
            {block.items.map((item: any, itemIndex: number) => <li key={`${item.start}-${itemIndex}`}>{renderOdpText(text.slice(item.start, item.end))}</li>)}
          </List>;
        }
        return <p key={`paragraph-${block.start}-${index}`}>{renderOdpText(text.slice(block.start, block.end))}</p>;
      })}
    </>
  );
}

function SourceSectionContent(props: { kind: string; value: any; presentation?: any }) {
  if (props.kind === "list") {
    return <ul>{props.value.map((item: string) => <li key={item}>{renderOdpText(item)}</li>)}</ul>;
  }
  if (props.kind === "objectives") {
    return (
      <ul className="assessment-objectives">
        {props.value.map((objective: any, index: number) => (
          <li key={objective.id || objective.label || index}>
            {objective.label ? <strong>{objective.label}</strong> : null}{" "}
            {renderOdpText(objective.prose)}
          </li>
        ))}
      </ul>
    );
  }
  if (props.kind === "methods") {
    return (
      <ul className="assessment-methods">
        {props.value.map((method: any, index: number) => (
          <li key={method.id || method.method || index}>
            <strong>{method.method}</strong>
            {method.objects?.length ? `: ${method.objects.join("; ")}` : null}
          </li>
        ))}
      </ul>
    );
  }
  return <SourceTextBlocks value={String(props.value)} presentation={props.presentation} />;
}

export function ObjectDetailPage(props: {
  bundle: RuntimeBundle;
  state: Extract<ViewState, { view: "library-detail" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenGlossary: (termId?: string) => void;
  onOpenNode: (nodeId: string) => void;
}) {
  const { bundle, state, onNavigate } = props;
  const node = bundle.runtime.getNode(state.node);
  const document = bundle.runtime.getLibraryDocument(state.node);

  if (!node) {
    return (
      <section className="notice">
        <h1>Record not found</h1>
        <p>Try another identifier or keyword.</p>
        <AppLink onNavigate={onNavigate} variant="primary" view="search">
          Back to Library
        </AppLink>
      </section>
    );
  }

  if (!document) {
    return (
      <section className="notice">
        <h1>Record not found</h1>
        <p>Try another identifier or keyword.</p>
        <AppLink onNavigate={onNavigate} variant="primary" view="search">
          Back to Library
        </AppLink>
      </section>
    );
  }

  const source = bundle.runtime.getSource(document.source_id || node.source_id);
  const catalogs = bundle.catalogSummaries?.length
    ? bundle.catalogSummaries
    : bundle.runtime.getCatalogs();
  const catalog = catalogs.find((entry: any) => entry.id === document.catalog_id);
  const catalogName = catalog?.name || document.catalog_name || document.catalog_id;
  const catalogProfile = catalogProfileFor(document.catalog_id, catalogName);
  const area = catalogProfile.area;
  const family = document.control_family || node.metadata?.family || "";
  const itemId = node.metadata?.item_id || document.item_id || node.label || "";
  const publisherName = recordPublisherName(
    document.publisher_name,
    source?.owner,
    source?.publisher,
    catalog?.display_group,
  );
  const recordIdentity = recordIdentityFor({
    publisher: publisherName,
    catalogId: document.catalog_id,
    family,
    itemId,
    metadata: node.metadata,
  });
  const publishedName = officialRecordName(
    itemId,
    node.metadata?.title || document.title || "",
  );
  const kind = displayNameFor("object_type", document.object_type);
  const officialSourceUrl = source?.artifact_url || source?.catalog_browse_url || "";
  const edges = bundle.runtime.getEdgesForNode(node.id, {
    publication_status: "published",
  });
  const connectionGroups = buildRecordConnectionGroups(
    node.id,
    document.catalog_id,
    edges,
    bundle.runtime.getNode,
    (catalogId) =>
      catalogs.find((entry: any) => entry.id === catalogId)?.name || "",
  );
  const connectionCount = connectionGroups.reduce(
    (total, group) => total + group.items.length,
    0,
  );
  const displayPath = (node.display_path || []) as Array<{
    id: string;
    label: string;
    node_type: string;
    origin: "authority" | "organizing" | "structural";
  }>;
  const displayedTrace = bundle.atlasSpine
    ? extendDisplayedAuthorityTrace(
        buildAtlasTreeModel(bundle.atlasSpine, authoritySpine),
        [...displayPath, {
          id: node.id,
          label: recordIdentity,
          node_type: node.node_type || document.object_type,
          origin: "structural",
        }] as AtlasTraceHop[],
      )
    : [...displayPath, {
        id: node.id,
      label: recordIdentity,
        node_type: node.node_type || document.object_type,
        origin: "structural" as const,
      }];
  const authorityItems = displayedTrace.filter((entry) => entry.origin === "authority");
  const sourceMetadata = {
    ...node.metadata,
    description: document.description || node.metadata?.description || "",
  };
  const presentation = recordPresentationProfile(document.catalog_id, node.node_type || document.object_type);
  const missingSourceFields = missingRequiredRecordFields(presentation, sourceMetadata);
  const recordTags = recordTagsFor({
    area,
    category: family,
    kind,
    publication: catalogName,
    relatedCategories: node.metadata?.related_categories,
  });

  return (
    <section className="detail-page record-template" data-template="E">
      <CanonicalBreadcrumb bundle={bundle} nodeId={node.id} recordLabel={itemId} />

      <header
        className="record-title-block"
        data-route-primary-header="true"
        data-route-primary-copy="true"
      >
        <h1><AcronymText>{recordIdentity}</AcronymText></h1>
        {publishedName ? (
          <p className="record-official-name"><AcronymText>{publishedName}</AcronymText></p>
        ) : null}
        <div className="record-title-actions" data-route-primary-support="true">
          {officialSourceUrl ? (
            <ButtonLink
              href={officialSourceUrl}
              rel="noopener noreferrer"
              target="_blank"
              variant="primary"
            >
              View official source
            </ButtonLink>
          ) : null}
          <AppLink
            onNavigate={onNavigate}
            patch={{ node: node.id }}
            variant="secondary"
            view="atlas-map"
          >
            See connections
          </AppLink>
          <details className="record-actions-menu">
            <summary>More actions</summary>
            <div className="record-actions-popover">
              <AppLink
                onNavigate={onNavigate}
                patch={{ crosswalk: "relationships", items: document.item_id, source: document.catalog_id }}
                variant="secondary"
                view="matrix"
              >
                Compare frameworks
              </AppLink>
              <AppLink
                onNavigate={onNavigate}
                patch={{ framework: document.catalog_id }}
                variant="secondary"
                view="templates"
              >
                Choose a document
              </AppLink>
              <Button
                onClick={() => {
                  void copyText(
                    `${window.location.origin}${window.location.pathname}${serializeHashUrl(
                      normalizeViewState("library-detail", {
                        view: "library-detail",
                        node: document.id,
                      }),
                    )}`,
                  );
                }}
                type="button"
                variant="secondary"
              >
                Copy link
              </Button>
            </div>
          </details>
        </div>
      </header>

      <div className="record-template-grid">
        <article className="record-template-main">
          {missingSourceFields.length ? (
            <section className="notice" data-record-source-error role="alert">
              <h2>Record data unavailable</h2>
              <p>The published text for this record did not load.</p>
            </section>
          ) : (
            <div className="record-official-text" data-source-text="published">
              {presentation.sections.map((section) => {
                const value = sourceMetadata[section.field as keyof typeof sourceMetadata];
                if (Array.isArray(value) ? value.length === 0 : !String(value || "").trim()) return null;
                return (
                  <section data-source-field={section.field} key={section.field}>
                    <h2>{section.heading}</h2>
                    <SourceSectionContent
                      kind={section.kind}
                      value={value}
                      presentation={sourceMetadata.source_text_presentation?.[section.field]}
                    />
                  </section>
                );
              })}
            </div>
          )}

          {connectionGroups.length ? (
            <section className="record-connections" data-record-section="crosswalks">
              <div className="section-header">
                <div>
                  <h2>Crosswalks</h2>
                  <p>Formal links to records in other frameworks.</p>
                </div>
                <Badge tone="info">{connectionCount}</Badge>
              </div>
              <div className="record-connection-groups">
                {connectionGroups.map((group) => (
                  <section key={group.catalogId}>
                    <h3>{group.label}</h3>
                    <ul>
                      {group.items.map((item) => {
                        const sourceLabels = [...new Set(
                          item.sourceRefs
                            .map((reference) => {
                              const sourceRecord = reference.sourceId
                                ? bundle.runtime.getSource(reference.sourceId)
                                : null;
                              const sourceLabel = (
                                reference.sourceName ||
                                sourceRecord?.display_name ||
                                sourceRecord?.name ||
                                ""
                              );
                              const safeLocator = humanReadableEvidenceLocator(
                                reference.locator,
                              );
                              return [
                                sourceLabel,
                                reference.sourceVersion,
                                safeLocator,
                                reference.evidenceQuality,
                              ].filter(Boolean).join(" · ");
                            })
                            .filter(Boolean),
                        )];
                        return (
                        <li data-record-connection-id={item.edgeId} key={item.edgeId}>
                          <AppLink
                            onNavigate={onNavigate}
                            patch={{ node: item.nodeId }}
                            view="library-detail"
                          >
                            <strong>{item.itemId}</strong>
                            {item.title !== item.itemId ? ` — ${item.title}` : ""}
                          </AppLink>
                          <span className="relationship-meta">
                            {[
                              formatRelationshipLabel({ relationship_type: item.relationshipType }),
                              displayNameFor("provenance_class", item.provenanceClass),
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                          {sourceLabels.length ? (
                            <span className="relationship-citation">
                              {sourceLabels.join(" · ")}
                            </span>
                          ) : null}
                        </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            </section>
          ) : null}
        </article>

        <aside
          className="record-template-sidebar"
          data-displayed-trace={displayedTrace.map((entry) => entry.id).join(">")}
        >
          <section>
            <h2>About This Record</h2>
            <div className="record-classification-tags">
              {recordTags.map((tag) => tag.kind === "area" ? (
                <BucketTag
                  area={tag.label}
                  explanation={tagProvenanceExplanation(tag.provenance)}
                  key={tag.id}
                >
                  {tag.label}
                </BucketTag>
              ) : (
                <LineTag explanation={tagProvenanceExplanation(tag.provenance)} key={tag.id}>
                  <AcronymText>{tag.label}</AcronymText>
                </LineTag>
              ))}
            </div>
            <dl className="record-source-facts">
              <div>
                <dt>Publisher</dt>
                <dd>{publisherName || "Not recorded"}</dd>
              </div>
              <div>
                <dt>Publication</dt>
                <dd>{catalogName}</dd>
              </div>
              {source?.version ? (
                <div>
                  <dt>Version</dt>
                  <dd>{source.version}</dd>
                </div>
              ) : null}
              {node.metadata?.publication_date ? (
                <div>
                  <dt>Publication Date</dt>
                  <dd>{node.metadata.publication_date}</dd>
                </div>
              ) : null}
              {source?.last_checked || source?.retrieved_at ? (
                <div>
                  <dt>Last Checked</dt>
                  <dd>{source.last_checked || source.retrieved_at}</dd>
                </div>
              ) : null}
              {authorityItems.length ? (
                <div>
                  <dt>Authority</dt>
                  <dd>
                    <ul className="record-authority-list">
                      {authorityItems.map((authority) => <li key={authority.id}>{authority.label}</li>)}
                    </ul>
                  </dd>
                </div>
              ) : null}
            </dl>
            <AppLink
              onNavigate={onNavigate}
              patch={{ source: source?.id || "" }}
              view="sources"
            >
              View source details
            </AppLink>
          </section>
        </aside>
      </div>

    </section>
  );
}
