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
import { useMemo, useState, type ReactNode } from "react";

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
    ...((federalContext?.baselineMembership || []).map(
      (entry: any) => entry.baselineNode?.metadata?.item_id,
    ) || []),
    ...((federalContext?.fedrampBaselineContext || []).map(
      (entry: any) => entry.baselineNode?.metadata?.item_id,
    ) || []),
  ].filter(Boolean);

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
        summary="Open with meaning first, review where this item appears, then use the grouped relationships and source support to decide what to do next."
        title={document.title}
      />

      <div className="detail-grid">
        <section className="stack">
          <SummaryCard title="What this is" tone="trust">
            <p>
              {node.plain_language_summary ||
                document.plain_language_summary ||
                document.description}
            </p>
          </SummaryCard>
          <SummaryCard title="Why it matters">
            <p>
              {document.item_id} is part of the public compliance library. Use
              it to understand the requirement, see the public connections
              around it, and decide which comparison or planning artifact to
              open next.
            </p>
          </SummaryCard>
          <SummaryCard title="Where it appears">
            <p>
              {locationSummary.length
                ? `This item appears in ${locationSummary.join(", ")}.`
                : node.node_type === "attack_technique" ||
                    node.node_type === "defend_countermeasure"
                  ? "This MITRE item connects through the public threat lens rather than a baseline membership list."
                  : "This item does not have a published baseline placement summary yet."}
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
            <p>{document.description || "No public description available."}</p>
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
          <SummaryCard title="Connections" tone="trust">
            <p>
              {edges.length
                ? `${edges.length} connections across ${grouped.length} group${grouped.length === 1 ? "" : "s"}.`
                : "No connections yet."}
            </p>
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


