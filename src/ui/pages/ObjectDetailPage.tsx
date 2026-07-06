import * as Accordion from "@radix-ui/react-accordion";
import {
  IconArrowRight,
  IconBook2,
  IconClipboardList,
  IconCompass,
  IconExternalLink,
  IconFileDescription,
  IconGitCompare,
  IconInfoCircle,
  IconLink,
  IconMap,
  IconSearch,
  IconShieldCheck,
  IconSourceCode,
} from "@tabler/icons-react";
import { Fragment, useMemo, useState, type ReactNode } from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import { patternsData } from "../../app/patterns-data.mjs";
import { groupRelationships } from "../../app/relationship-groups.mjs";
import { generateTemplate } from "../../app/template-engine.mjs";
import { PRODUCT_DISCLAIMER } from "../../shared/disclaimer.mjs";
import {
  ExpandableChipList,
  RelationshipGroupsSection,
} from "../components/ExpandableRelationshipGroup";
import { RelationshipExplorer, relationshipFiltersFromState, relationshipFiltersToPatch } from "../components/RelationshipExplorer";
import { StickyDetailBar } from "../components/StickyDetailBar";
import { ProvenanceTerm } from "../components/ProvenanceTerm";
import { GlossaryTermChip } from "../components/GlossaryTermChip";
import { StartHereResult } from "../components/StartHereResult";
import {
  CatalogFilterBar,
  QuickIntentCard,
} from "../components/QuickIntentCard";
import {
  filterByCategoryAndQuery,
  groupItemsByCategory,
  PATTERN_CATEGORIES,
  RECOMMENDED_PATTERN_IDS,
  TEMPLATE_CATEGORIES,
} from "../lib/catalogGroups.mjs";
import {
  glossaryTermsForDocument,
  glossaryTermsForPattern,
  templatesForPatterns,
} from "../lib/glossarySearch.mjs";
import { buildStartHereRecommendations } from "../lib/startHereRecommendations.mjs";
import type {
  StartHereCompareLink,
  StartHereLibraryLink,
  StartHereRecommendations,
} from "../lib/startHereRecommendations.d.ts";
import { serializeHashUrl } from "../lib/hashRoutes";
import { buildImpactBreakdown, recordDisplayTitle } from "../lib/recordTitle";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";
import {
  Badge,
  DisclosurePanel,
  PageHeader,
  SelectField,
  SourceSummaryCard,
  SummaryCard,
  copyText,
  downloadTextFile,
  formatConfidence,
  formatRelationshipLabel,
  openAtlasMapForNode,
  sourceTrustSummary,
  sourceUsageSummary,
  sourceWarnings,
  PATTERN_RENAMES,
} from "../lib/pagePrimitives";

const ODP_PATTERN = /\[(?:Assignment|Selection)[^\]]*\]/g;

/**
 * Split text on ODP bracket markers (e.g. "[Assignment: organization-defined
 * parameter]") and wrap each match in a muted-highlight span. Uses safe
 * React split-render — never dangerouslySetInnerHTML.
 */
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

function normalizeForCompare(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * A curated/derived plain-language summary is worth showing only when it
 * exists and is meaningfully different from the official description — not
 * merely a whitespace-normalized prefix of it (a sign the summary is just a
 * mechanically truncated copy of the description).
 */
function isMeaningfullyDifferentSummary(
  summary: string | undefined | null,
  description: string | undefined | null,
): summary is string {
  if (!summary) return false;
  const normalizedSummary = normalizeForCompare(summary);
  const normalizedDescription = normalizeForCompare(description || "");
  if (!normalizedSummary) return false;
  if (normalizedSummary === normalizedDescription) return false;
  if (normalizedDescription.startsWith(normalizedSummary)) return false;
  if (normalizedSummary.startsWith(normalizedDescription) && normalizedDescription) return false;
  return true;
}

export function ObjectDetailPage(props: {
  bundle: RuntimeBundle;
  state: Extract<ViewState, { view: "library-detail" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenGlossary: (termId?: string) => void;
  onOpenNode: (nodeId: string, from?: string) => void;
}) {
  const { bundle, state, onNavigate, onOpenGlossary, onOpenNode } = props;
  const node = bundle.runtime.getNode(state.node);
  const document = bundle.runtime.getLibraryDocument(state.node);
  const source = document
    ? bundle.runtime.getSource(document.source_id)
    : bundle.runtime.getSource(node?.source_id);
  const edges = node
    ? bundle.runtime.getEdgesForNode(node.id, {
        publication_status: "published",
      })
    : [];
  const grouped = node
    ? groupRelationships(edges, node.id, bundle.runtime)
    : [];
  const federalContext = node
    ? bundle.runtime.getFederalContext(node.id)
    : null;
  const advancedRelationships = edges.slice(0, 25);
  const impact = useMemo(
    () =>
      node
        ? buildImpactBreakdown(node.id, edges, (id) => bundle.runtime.getNode(id))
        : { total: 0, byType: [] },
    [bundle.runtime, edges, node],
  );

  const isWithdrawn = node?.lifecycle_status === "withdrawn";
  const supersededByIds: string[] = Array.isArray(node?.metadata?.superseded_by)
    ? node.metadata.superseded_by
    : [];
  const supersededByNodes = supersededByIds
    .map((id: string) => {
      const catalogId = node?.metadata?.catalog_id;
      const candidateNodeId = catalogId ? `${catalogId}:${id}` : id;
      return bundle.runtime.getNode(candidateNodeId) || bundle.runtime.getNode(id);
    })
    .filter(Boolean) as Array<{ id: string; metadata?: { item_id?: string } }>;

  const recordItemId: string = node?.metadata?.item_id || "";
  const isEnhancement = node?.node_type === "control_enhancement";
  const baseItemId = isEnhancement && recordItemId.includes(".")
    ? recordItemId.slice(0, recordItemId.lastIndexOf("."))
    : "";
  const baseControlNode = baseItemId && node?.metadata?.catalog_id
    ? bundle.runtime.getNode(`${node.metadata.catalog_id}:${baseItemId}`)
    : null;

  const rawSummary: string | undefined =
    node?.plain_language_summary || document?.plain_language_summary;
  const showSummary = isMeaningfullyDifferentSummary(
    rawSummary,
    document?.description,
  );
  const plainAction: string | undefined = node?.metadata?.plain_action;

  if (!node || !document) {
    return (
      <section className="notice">
        <h2>Item not found</h2>
        <p>This deep link does not match a current public library entry.</p>
        <button
          className="primary"
          onClick={() => onNavigate("search")}
          type="button"
        >
          Back to Explore
        </button>
      </section>
    );
  }

  const locationSummary = [
    ...new Set(
      [
        ...((federalContext?.baselineMembership || []).map(
          (entry: any) => entry.baselineNode?.metadata?.item_id,
        ) || []),
        ...((federalContext?.fedrampBaselineContext || []).map(
          (entry: any) => entry.baselineNode?.metadata?.item_id,
        ) || []),
      ].filter(Boolean),
    ),
  ];

  const relatedGlossaryTerms = glossaryTermsForDocument(document);

  return (
    <section className="detail-page">
      <StickyDetailBar
        enabled={Boolean(state.from)}
        itemLabel={document.item_id}
        onBack={() =>
          onNavigate("search", { query: state.from || document.item_id })
        }
        onCompare={() =>
          onNavigate("matrix", {
            workbench: "relationships",
            items: document.item_id,
          })
        }
        onOpenAtlasMap={() => openAtlasMapForNode(onNavigate, state.node)}
      />
      <div className="breadcrumbs">
        <button onClick={() => onNavigate("search")} type="button">
          Explore
        </button>
        <span>/</span>
        <span>{document.item_id}</span>
      </div>

      <PageHeader
        eyebrow={displayNameFor("object_type", document.object_type)}
        action={
          <div className="page-header-actions">
            <button
              className="secondary"
              onClick={() =>
                onNavigate("search", { query: state.from || document.item_id })
              }
              type="button"
            >
              Back to results
            </button>
            {edges.length ? (
              <button
                className="primary"
                onClick={() => openAtlasMapForNode(onNavigate, state.node)}
                type="button"
              >
                Open in Atlas Map
              </button>
            ) : null}
            <button
              className="secondary"
              onClick={() =>
                onNavigate("matrix", {
                  workbench: "relationships",
                  items: document.item_id,
                })
              }
              type="button"
            >
              Compare
            </button>
            <button
              className="secondary quiet"
              onClick={() => {
                void copyText(
                  `${window.location.origin}${window.location.pathname}${serializeHashUrl(state)}`,
                );
              }}
              type="button"
            >
              Copy link
            </button>
          </div>
        }
        title={recordDisplayTitle(node) || document.title}
      />

      {isEnhancement && baseControlNode ? (
        <p className="record-parent-link">
          <button
            className="link-action quiet"
            onClick={() => onOpenNode(baseControlNode.id, state.from || "search")}
            type="button"
          >
            Part of {baseItemId}
          </button>
        </p>
      ) : null}

      {isWithdrawn ? (
        <div className="badge-row record-lifecycle-badges">
          <Badge tone="warning">Withdrawn from SP 800-53 Rev. 5</Badge>
          {supersededByNodes.length ? (
            <span className="record-superseded-by">
              — superseded by{" "}
              {supersededByNodes.map((supersededNode, index) => (
                <Fragment key={supersededNode.id}>
                  {index > 0 ? ", " : ""}
                  <button
                    className="link-action quiet"
                    onClick={() =>
                      onOpenNode(supersededNode.id, state.from || "search")
                    }
                    type="button"
                  >
                    {supersededNode.metadata?.item_id || supersededNode.id}
                  </button>
                </Fragment>
              ))}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="detail-grid">
        <section className="stack">
          <SummaryCard title="What this is" tone="trust">
            {showSummary ? <p>{rawSummary}</p> : null}
            {plainAction ? (
              <p>
                <strong>What to do:</strong> {plainAction}
              </p>
            ) : null}
            {!showSummary && !plainAction ? (
              <p>{document.description}</p>
            ) : null}
          </SummaryCard>
          <SummaryCard title="Where it appears">
            <p>
              {locationSummary.length ? (
                <>
                  This item appears in{" "}
                  {locationSummary.map((label, index) => (
                    <Fragment key={label}>
                      {index > 0 ? ", " : ""}
                      {label === "LI-SAAS" ? (
                        <GlossaryTermChip termId="li-saas">{label}</GlossaryTermChip>
                      ) : (
                        label
                      )}
                    </Fragment>
                  ))}
                  .
                </>
              ) : node.node_type === "attack_technique" ||
                  node.node_type === "defend_countermeasure" ? (
                "This MITRE item connects through the public threat lens rather than a baseline membership list."
              ) : (
                "This item does not have a published baseline placement summary yet."
              )}
            </p>
          </SummaryCard>
          {node.node_type === "attack_technique" ? (
            <SummaryCard title="Threat context">
              <p>
                Domain:{" "}
                {node.metadata?.attack_domain === "ics"
                  ? "ICS ATT&CK"
                  : "Enterprise ATT&CK"}
              </p>
              {node.metadata?.tactics?.length ? (
                <p>Tactics: {node.metadata.tactics.join(", ")}</p>
              ) : null}
              {node.metadata?.platforms?.length ? (
                <p>Platforms: {node.metadata.platforms.join(", ")}</p>
              ) : null}
            </SummaryCard>
          ) : null}

          <section className="panel">
            <div className="section-header">
              <div>
                <h2>Connections</h2>
                <p>Grouped relationships for this record.</p>
                {edges.length ? (
                  <p className="support-meta">
                    {edges.length} connections across {grouped.length} group
                    {grouped.length === 1 ? "" : "s"}:{" "}
                    {grouped
                      .map(
                        (group) =>
                          `${group.items.length} ${group.label.toLowerCase()}`,
                      )
                      .join(", ")}
                    .
                  </p>
                ) : null}
              </div>
              <div className="section-header-actions">
                {edges.length ? (
                  <>
                    <button
                      className="primary"
                      onClick={() => openAtlasMapForNode(onNavigate, state.node)}
                      type="button"
                    >
                      Open in Atlas Map
                    </button>
                    <button
                      className="secondary"
                      onClick={() =>
                        onNavigate("library-detail", {
                          node: state.node,
                          from: state.from,
                          relationshipView: "list",
                        })
                      }
                      type="button"
                    >
                      View as list
                    </button>
                    <button
                      className="secondary"
                      onClick={() =>
                        onNavigate("matrix", {
                          workbench: "relationships",
                          items: document.item_id,
                        })
                      }
                      type="button"
                    >
                      Compare
                    </button>
                  </>
                ) : null}
                <Badge tone="info">{edges.length} connections</Badge>
              </div>
            </div>

            {state.relationshipView === "map" ||
            state.relationshipView === "list" ||
            state.relationshipView === "table" ? (
              <RelationshipExplorer
                centerItemId={document.item_id}
                centerNodeId={node.id}
                filters={relationshipFiltersFromState(state)}
                heading="Atlas Map"
                introCopy={`Connections around ${document.item_id}.`}
                onFilterChange={(patch) =>
                  onNavigate("library-detail", {
                    node: state.node,
                    from: state.from,
                    relationshipView: state.relationshipView || "map",
                    ...relationshipFiltersToPatch(patch),
                  })
                }
                onOpenNode={(nodeId) =>
                  onOpenNode(nodeId, state.from || "search")
                }
                onViewChange={(view) =>
                  onNavigate("library-detail", {
                    node: state.node,
                    from: state.from,
                    relationshipView: view,
                    relationshipType: state.relationshipType,
                    provenance: state.provenance,
                    confidence: state.confidence,
                    nodeType: state.nodeType,
                    includeCandidates: state.includeCandidates,
                    relationshipSearch: state.relationshipSearch,
                  })
                }
                relationshipView={
                  state.relationshipView === "map" ? "map" : "list"
                }
                runtime={bundle.runtime}
              />
            ) : null}

            <RelationshipGroupsSection
              formatRelationshipLabel={formatRelationshipLabel}
              groups={grouped}
              onOpenNode={(nodeId) => onOpenNode(nodeId, state.from || "search")}
              source={source}
              sourceTrustSummary={sourceTrustSummary}
            />
          </section>

          <SummaryCard title="Official text / source excerpt">
            <p>
              {document.description
                ? renderOdpText(document.description)
                : "No public description available."}
            </p>
            {source?.artifact_url ? (
              <p>
                <a
                  href={source.artifact_url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Open official source document
                </a>
              </p>
            ) : null}
          </SummaryCard>
        </section>

        <aside className="stack detail-sidebar">
          <SummaryCard title="One stone, how many birds?" tone="trust">
            {impact.total ? (
              <>
                <p>
                  Working on this touches{" "}
                  <strong>{impact.total} related item{impact.total === 1 ? "" : "s"}</strong>{" "}
                  across the frameworks you get assessed on:
                </p>
                <ul className="impact-breakdown">
                  {impact.byType.slice(0, 6).map((entry) => (
                    <li key={entry.nodeType}>
                      <strong>{entry.count}</strong> {entry.label}
                    </li>
                  ))}
                  {impact.byType.length > 6 ? (
                    <li>
                      …and{" "}
                      {impact.byType
                        .slice(6)
                        .reduce((sum, entry) => sum + entry.count, 0)}{" "}
                      more
                    </li>
                  ) : null}
                </ul>
              </>
            ) : (
              <p>No published connections yet.</p>
            )}
            {edges.length ? (
              <div className="card-actions">
                <button
                  className="primary"
                  onClick={() => openAtlasMapForNode(onNavigate, state.node)}
                  type="button"
                >
                  Open in Atlas Map
                </button>
                <button
                  className="secondary"
                  onClick={() =>
                    onNavigate("matrix", {
                      workbench: "relationships",
                      items: document.item_id,
                    })
                  }
                  type="button"
                >
                  Compare
                </button>
              </div>
            ) : null}
          </SummaryCard>
          <SummaryCard title="Source support" tone="trust">
            <p>{sourceTrustSummary(source)}</p>
            <p className="support-meta">
              Primary source:{" "}
              {source?.display_name || source?.name || "Unavailable"}
            </p>
            <div className="card-actions">
              <button
                className="secondary"
                onClick={() =>
                  onNavigate("sources", { source: source?.id || "" })
                }
                type="button"
              >
                View data sources
              </button>
            </div>
          </SummaryCard>

          <SummaryCard title="What to do next">
            <div className="stack compact">
              {edges.length ? (
                <button
                  className="link-action"
                  onClick={() => openAtlasMapForNode(onNavigate, state.node)}
                  type="button"
                >
                  <IconMap aria-hidden="true" size={16} stroke={1.8} />
                  <span>Open in Atlas Map</span>
                </button>
              ) : null}
              {node.node_type === "attack_technique" ? (
                <button
                  className="link-action"
                  onClick={() =>
                    onNavigate("matrix", {
                      workbench: "threat-chain",
                      chainCatalog: node.metadata?.catalog_id || "",
                      chainItem: node.id,
                    })
                  }
                  type="button"
                >
                  <IconGitCompare aria-hidden="true" size={16} stroke={1.8} />
                  <span>Trace this technique to D3FEND and NIST controls</span>
                </button>
              ) : null}
              <button
                className="link-action"
                onClick={() =>
                  onNavigate("matrix", {
                    workbench: "relationships",
                    items: document.item_id,
                  })
                }
                type="button"
              >
                <IconGitCompare aria-hidden="true" size={16} stroke={1.8} />
                <span>Compare this item against other public mappings</span>
              </button>
              <button
                className="link-action"
                onClick={() => onNavigate("templates")}
                type="button"
              >
                <IconClipboardList aria-hidden="true" size={16} stroke={1.8} />
                <span>Open starter template</span>
              </button>
            </div>
          </SummaryCard>

          {relatedGlossaryTerms.length ? (
            <SummaryCard title="Related terms">
              <p>
                Plain-language definitions for terms that often appear around
                this item.
              </p>
              <ExpandableChipList
                items={relatedGlossaryTerms}
                onSelect={(id) => onOpenGlossary(id)}
              />
            </SummaryCard>
          ) : null}

          <Accordion.Root className="accordion-root" collapsible type="single">
            <DisclosurePanel title="Advanced details" value="advanced">
              <div className="advanced-list">
                <div>
                  <span>Item type</span>
                  <strong>
                    {displayNameFor("object_type", document.object_type)}
                  </strong>
                </div>
                <div>
                  <span>Source location</span>
                  <strong>{source?.artifact_url || "Not recorded"}</strong>
                </div>
                <div>
                  <span>Node ID</span>
                  <strong>{node.id}</strong>
                </div>
              </div>
              <table className="detail-table">
                <thead>
                  <tr>
                    <th>Connected item</th>
                    <th>Connection</th>
                    <th>Source type</th>
                    <th>Trust level</th>
                  </tr>
                </thead>
                <tbody>
                  {advancedRelationships.map((edge: any) => {
                    const counterpartId =
                      edge.source_node_id === node.id
                        ? edge.target_node_id
                        : edge.source_node_id;
                    const counterpart = bundle.runtime.getNode(counterpartId);
                    return (
                      <tr key={edge.id}>
                        <td>
                          {counterpart?.metadata?.item_id || counterpartId}
                        </td>
                        <td>{formatRelationshipLabel(edge)}</td>
                        <td>
                          <ProvenanceTerm
                            kind="provenance"
                            value={edge.provenance_class}
                          />
                        </td>
                        <td>
                          <ProvenanceTerm kind="confidence" value={edge.confidence} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </DisclosurePanel>
          </Accordion.Root>
        </aside>
      </div>
    </section>
  );
}


