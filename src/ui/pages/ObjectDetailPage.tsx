import * as Accordion from "@radix-ui/react-accordion";
import { Fragment, type ReactNode } from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import { sourceCurrentAsOf } from "../../shared/source-freshness.mjs";
import authoritySpine from "../../../data/curated/authority-spine.json";
import { AppLink } from "../components/AppLink";
import { CanonicalBreadcrumb } from "../components/CanonicalBreadcrumb";
import { Button, ButtonLink } from "../components/lsm";
import { BucketTag, LineTag } from "../components/TaxonomyTag";
import { catalogMandateLabel } from "../lib/catalogMandate";
import { catalogProfileFor } from "../lib/catalogProfiles";
import {
  buildAtlasTreeModel,
  extendDisplayedAuthorityTrace,
  type AtlasTraceHop,
} from "../lib/atlasTreeModel";
import { serializeHashUrl } from "../lib/hashRoutes";
import {
  Badge,
  DisclosurePanel,
  copyText,
  formatRelationshipLabel,
  sourceTrustSummary,
} from "../lib/pagePrimitives";
import {
  buildRecordConnectionGroups,
  familyQualifiedRecordId,
  humanReadableEvidenceLocator,
  plainEnglishRecordName,
} from "../lib/recordTitle";
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

function AssessmentProcedure(props: { metadata: any }) {
  const objectives: any[] = props.metadata?.assessment_objectives || [];
  const methods: any[] = props.metadata?.assessment_method_details || [];
  if (!objectives.length && !methods.length) return null;
  return (
    <div className="record-guidance-detail">
      {objectives.length ? (
        <div className="assessment-objectives">
          <h3>Objectives</h3>
          <ul>
            {objectives.map((objective: any, index: number) => (
              <li key={objective.id || objective.label || index}>
                {objective.label ? <strong>{objective.label}</strong> : null}{" "}
                {renderOdpText(objective.prose)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {methods.length ? (
        <div className="assessment-methods">
          <h3>Methods and objects</h3>
          <ul>
            {methods.map((method: any, index: number) => (
              <li key={method.id || method.method || index}>
                <strong>{method.method}</strong>
                {method.objects?.length ? `: ${method.objects.join("; ")}` : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function needToDoCopy(nodeType: string) {
  if (nodeType === "assessment_procedure") {
    return "Use the published objectives and methods to assess the linked control.";
  }
  if (nodeType === "stig_rule" || nodeType === "srg_requirement") {
    return "Check the applicable system against this rule, apply the published fix when needed, and record the result.";
  }
  if (nodeType === "attack_technique" || nodeType === "defend_countermeasure") {
    return "";
  }
  if (
    [
      "control",
      "control_enhancement",
      "requirement",
      "program_requirement",
      "zt_activity",
      "zt_capability",
    ].includes(nodeType)
  ) {
    return "If this publication applies to the system, implement the publisher's requirement.";
  }
  return "";
}

export function ObjectDetailPage(props: {
  bundle: RuntimeBundle;
  state: Extract<ViewState, { view: "library-detail" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenGlossary: (termId?: string) => void;
  onOpenNode: (nodeId: string) => void;
}) {
  const { bundle, state, onNavigate, onOpenNode } = props;
  const node = bundle.runtime.getNode(state.node);
  const document = bundle.runtime.getLibraryDocument(state.node);

  if (!node) {
    return (
      <section className="notice">
        <h1>Item not found</h1>
        <p>This deep link does not match a current public library entry.</p>
        <AppLink onNavigate={onNavigate} variant="primary" view="search">
          Back to Library
        </AppLink>
      </section>
    );
  }

  if (!document) {
    return (
      <section className="notice">
        <h1>Record metadata unavailable</h1>
        <p>
          This graph record is not present in the current search catalog, so
          its identity cannot be shown reliably.
        </p>
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
  const displayId = familyQualifiedRecordId(itemId, family, document.catalog_id);
  const plainName = plainEnglishRecordName(
    itemId,
    node.metadata?.title || document.title || "",
    document.description || "",
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
          label: plainName || displayId,
          node_type: node.node_type || document.object_type,
          origin: "structural",
        }] as AtlasTraceHop[],
      )
    : [...displayPath, {
        id: node.id,
        label: plainName || displayId,
        node_type: node.node_type || document.object_type,
        origin: "structural" as const,
      }];
  const authorityItems = displayedTrace.filter((entry) => entry.origin === "authority");
  const whatToDo = needToDoCopy(node.node_type || document.object_type);
  const whatThisIs = family
    ? `This ${kind.toLocaleLowerCase()} is part of the ${family} family in ${catalogName}.`
    : `This ${kind.toLocaleLowerCase()} is published in ${catalogName}.`;
  const implementationExamples: string[] = node.metadata?.implementation_examples || [];

  return (
    <section className="detail-page record-template" data-template="E">
      <CanonicalBreadcrumb bundle={bundle} nodeId={node.id} recordLabel={displayId} />

      <header
        className="record-title-block"
        data-route-primary-header="true"
        data-route-primary-copy="true"
      >
        <div className="record-title-tags" aria-label="Record classification" role="group">
          <Badge>{kind}</Badge>
          {area ? <BucketTag area={area}>{area}</BucketTag> : null}
          <Badge>{catalogMandateLabel(catalog?.mandate)}</Badge>
        </div>
        <h1>{displayId}</h1>
        {plainName && plainName !== displayId ? (
          <p className="record-plain-name">{plainName}</p>
        ) : null}
        <p className="record-provenance-line">
          {[source?.owner || source?.publisher, catalogName, source ? sourceCurrentAsOf(source) : ""]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <div className="record-title-actions" data-route-primary-support="true">
          {officialSourceUrl ? (
            <ButtonLink
              href={officialSourceUrl}
              rel="noopener noreferrer"
              target="_blank"
              variant="primary"
            >
              Open official source
            </ButtonLink>
          ) : null}
          <details className="record-actions-menu">
            <summary>More actions</summary>
            <div className="record-actions-popover">
              <AppLink
                onNavigate={onNavigate}
                patch={{ crosswalk: "relationships", items: document.item_id, source: document.catalog_id }}
                variant="secondary"
                view="matrix"
              >
                Compare
              </AppLink>
              <AppLink
                onNavigate={onNavigate}
                patch={{ framework: document.catalog_id }}
                variant="secondary"
                view="templates"
              >
                Produce a document
              </AppLink>
              <AppLink
                onNavigate={onNavigate}
                patch={{ node: node.id }}
                variant="secondary"
                view="atlas-map"
              >
                See in Atlas
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
          <section className="record-guidance" data-editorial-boundary="explicit">
            <p className="record-guidance-boundary">Control Atlas guidance</p>
            <section>
              <h2>What this is</h2>
              <p>{whatThisIs}</p>
            </section>
            {whatToDo ? (
              <section>
                <h2>What you need to do</h2>
                <p>{whatToDo}</p>
              </section>
            ) : null}
            {node.metadata?.fix_text ||
            implementationExamples.length ||
            node.node_type === "assessment_procedure" ? (
              <section>
                <h2>How to satisfy it</h2>
                {node.metadata?.fix_text ? (
                  <p>{renderOdpText(node.metadata.fix_text)}</p>
                ) : implementationExamples.length ? (
                  <ul>
                    {implementationExamples.map((example) => (
                      <li key={example}>{renderOdpText(example)}</li>
                    ))}
                  </ul>
                ) : (
                  <AssessmentProcedure metadata={node.metadata} />
                )}
              </section>
            ) : whatToDo ? (
              <section>
                <h2>How to satisfy it</h2>
                <p>
                  Assign an implementation owner and keep evidence that shows
                  the published requirement is operating as intended.
                </p>
              </section>
            ) : null}
          </section>

          <Accordion.Root className="accordion-root" collapsible type="single">
            <DisclosurePanel title="Official source text" value="official-source-text">
              <p className="source-boundary-label">
                Publisher wording from {source?.display_name || source?.name || catalogName}
              </p>
              <p>
                {document.description
                  ? renderOdpText(document.description)
                  : "No narrative description was published for this record."}
              </p>
              {node.metadata?.discussion ? (
                <>
                  <h3>Publisher context</h3>
                  <p>{renderOdpText(node.metadata.discussion)}</p>
                </>
              ) : null}
              {node.metadata?.check_text ? (
                <>
                  <h3>Published check</h3>
                  <p>{renderOdpText(node.metadata.check_text)}</p>
                </>
              ) : null}
            </DisclosurePanel>
          </Accordion.Root>

          <section className="record-connections" data-record-section="connections">
            <div className="section-header">
              <div>
                <h2>Connections</h2>
                <p>Published links to records in other frameworks.</p>
              </div>
              {connectionCount ? <Badge tone="info">{connectionCount}</Badge> : null}
            </div>
            {connectionGroups.length ? (
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
            ) : (
              <p className="record-empty-state">No cross-framework mappings published yet.</p>
            )}
          </section>
        </article>

        <aside
          className="record-template-sidebar"
          data-displayed-trace={displayedTrace.map((entry) => entry.id).join(">")}
        >
          <section>
            <h2>Classified under</h2>
            <div className="record-classification-tags">
              {area ? <BucketTag area={area}>{area}</BucketTag> : null}
              {family ? <LineTag>{family}</LineTag> : null}
              <LineTag>{catalogName}</LineTag>
            </div>
          </section>
          <section>
            <h2>Comes from</h2>
            {authorityItems.length ? (
              <ul className="record-authority-list">
                {authorityItems.map((authority) => (
                  <li key={authority.id}>{authority.label}</li>
                ))}
              </ul>
            ) : catalog?.mandate_note ? (
              <p>{catalog.mandate_note}</p>
            ) : null}
          </section>
          <section>
            <h2>Source &amp; provenance</h2>
            <p>{sourceTrustSummary(source)}</p>
            <dl className="record-source-facts">
              <div>
                <dt>Published by</dt>
                <dd>{source?.owner || source?.publisher || "Unavailable"}</dd>
              </div>
              {source ? (
                <div>
                  <dt>Current as of</dt>
                  <dd>{source.last_checked || "Unavailable"}</dd>
                </div>
              ) : null}
            </dl>
            <AppLink
              onNavigate={onNavigate}
              patch={{ source: source?.id || "" }}
              view="sources"
            >
              View data sources
            </AppLink>
          </section>
        </aside>
      </div>

      <Accordion.Root className="accordion-root record-developer-details" collapsible type="single">
        <DisclosurePanel title="Developer details" value="developer-details">
          <dl className="advanced-list">
            <div>
              <dt>Node ID</dt>
              <dd>{node.id}</dd>
            </div>
            <div>
              <dt>Catalog ID</dt>
              <dd>{document.catalog_id}</dd>
            </div>
            <div>
              <dt>Source URL</dt>
              <dd>{officialSourceUrl || "Not recorded"}</dd>
            </div>
          </dl>
        </DisclosurePanel>
      </Accordion.Root>
    </section>
  );
}
