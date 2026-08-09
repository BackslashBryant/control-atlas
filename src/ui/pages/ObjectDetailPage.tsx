import * as Accordion from "@radix-ui/react-accordion";
import {
  IconArrowRight,
  IconBook2,
  IconCompass,
  IconExternalLink,
  IconFileDescription,
  IconInfoCircle,
  IconLink,
  IconSearch,
  IconShieldCheck,
  IconSourceCode,
} from "@tabler/icons-react";
import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import { groupRelationships } from "../../app/relationship-groups.mjs";
import { generateTemplate } from "../../app/template-engine.mjs";
import {
  sourceCurrentAsOf,
  sourceFreshness,
} from "../../shared/source-freshness.mjs";
import {
  ExpandableChipList,
  RelationshipGroupsSection,
  defaultOpenRelationshipGroups,
} from "../components/ExpandableRelationshipGroup";
import {
  RelationshipExplorer,
  relationshipFiltersFromState,
  relationshipFiltersToPatch,
} from "../components/RelationshipExplorer";
import { RecordContextRail } from "../components/RecordContextRail";
import { CanonicalBreadcrumb } from "../components/CanonicalBreadcrumb";
import { ProvenanceTerm } from "../components/ProvenanceTerm";
import { GlossaryTermChip } from "../components/GlossaryTermChip";
import { QuickIntentCard } from "../components/QuickIntentCard";
import {
  glossaryTermsForDocument,
} from "../lib/glossarySearch.mjs";
import { serializeHashUrl } from "../lib/hashRoutes";
import { buildImpactBreakdown, recordDisplayTitle } from "../lib/recordTitle";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import { normalizeViewState, type ViewState } from "../lib/viewState";
import { officialTextPreview } from "../lib/officialText";
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
  nodeProvenanceBreakdown,
  openAtlasMapForNode,
  sourceTrustSummary,
  sourceUsageSummary,
  sourceWarnings,
  PATTERN_RENAMES,
} from "../lib/pagePrimitives";

const ODP_PATTERN = /\[(?:Assignment|Selection)[^\]]*\]/g;

/**
 * W7.2 — the compact relationship-class overview rendered beneath the
 * "Where this sits" rail. Groups from `groupRelationships` are Class-3
 * correlation except nistBaseline/fedrampBaseline, which are Class-2
 * applicability (a baseline selects from a catalog, it does not own the
 * control — docs/tree-model.md #3) and get the distinct tone-applicability
 * badge so the two classes never look alike.
 */
const RELATIONSHIP_CLASS_BUCKETS: Array<{
  id: string;
  label: string;
  tone: "applicability" | "default";
  groupIds: string[];
}> = [
  {
    id: "selected-by",
    label: "Selected by",
    tone: "applicability",
    groupIds: ["nistBaseline", "fedrampBaseline"],
  },
  {
    id: "correlated-through",
    label: "Correlated through",
    tone: "default",
    groupIds: ["disa", "mitre", "csf", "sp171", "other"],
  },
  {
    id: "implemented-by",
    label: "Implemented by",
    tone: "default",
    groupIds: ["stig"],
  },
  {
    id: "assessed-through",
    label: "Assessed through",
    tone: "default",
    groupIds: ["assessment"],
  },
];

/**
 * Split text on ODP bracket markers (e.g. "[Assignment: organization-defined
 * parameter]") and wrap each match in a muted-highlight span. Uses safe
 * React split-render — never dangerouslySetInnerHTML.
 */
/**
 * Renders a control's SP 800-53A assessment objectives and methods, sourced
 * from the already-ingested assessment_procedure node metadata (see
 * buildAssessmentNode in scripts/build-framework-data.mjs). Shared between a
 * control's own page (via its linked assessment_procedure counterpart) and
 * the assessment_procedure's own record page.
 */
function renderAssessmentProcedure(metadata: any): ReactNode {
  const objectives: any[] = metadata?.assessment_objectives || [];
  const methods: any[] = metadata?.assessment_method_details || [];
  if (!objectives.length && !methods.length) return null;
  return (
    <>
      {objectives.length ? (
        <div className="assessment-objectives">
          <p className="support-meta">Assessment objectives</p>
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
          <p className="support-meta">Assessment methods and objects</p>
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
    </>
  );
}

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

import { Button, Panel } from "../components/lsm";

export function ObjectDetailPage(props: {
  bundle: RuntimeBundle;
  state: Extract<ViewState, { view: "library-detail" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenGlossary: (termId?: string) => void;
  onOpenNode: (nodeId: string) => void;
}) {
  const { bundle, state, onNavigate, onOpenGlossary, onOpenNode } = props;
  const node = bundle.runtime.getNode(state.node);
  const document = bundle.runtime.getLibraryDocument(state.node);
  const source = document
    ? bundle.runtime.getSource(document.source_id)
    : bundle.runtime.getSource(node?.source_id);
  const descriptionPreview = document?.description
    ? officialTextPreview(document.description)
    : null;
  const edges = node
    ? bundle.runtime.getEdgesForNode(node.id, {
        publication_status: "published",
      })
    : [];
  const grouped = node
    ? groupRelationships(edges, node.id, bundle.runtime)
    : [];
  // tree-model.md #7 item 6: enhancements/base-control are Class-1 structural
  // decomposition, not Class-3 correlation, so they render as their own
  // "Decomposes into" block near "Part of X" (below) instead of alongside the
  // CCI/MITRE/STIG correlation groups in the generic Connections accordion.
  // baseControl is additionally redundant there — the record's base control is
  // already the "Part of X" link, sourced independently from `baseControlNode`.
  const provenanceBreakdown = useMemo(
    () => nodeProvenanceBreakdown(node, edges, bundle.runtime.getSource),
    [node, edges, bundle.runtime],
  );
  const enhancementsGroup = grouped.find((group) => group.id === "enhancements");
  const connectionGroups = grouped.filter(
    (group) => group.id !== "enhancements" && group.id !== "baseControl",
  );
  const relationshipGroupSignature = connectionGroups
    .map((group) => `${group.id}:${group.items.length}`)
    .join("|");
  const classBuckets = useMemo(
    () =>
      RELATIONSHIP_CLASS_BUCKETS.map((bucket) => ({
        id: bucket.id,
        label: bucket.label,
        tone: bucket.tone,
        items: grouped
          .filter((group) => bucket.groupIds.includes(group.id))
          .flatMap((group) =>
            group.items.map((item: any) => {
              const itemId =
                item.counterpart.metadata?.item_id || item.counterpart.id;
              return {
                id: item.counterpart.id,
                // "Assessed through AC-2" reads as a self-reference — the
                // assessment procedure needs its source and object type, not
                // just the shared item ID.
                label:
                  bucket.id === "assessed-through"
                    ? `SP 800-53A — ${itemId} assessment procedure`
                    : itemId,
              };
            }),
          ),
      })).filter((bucket) => bucket.items.length > 0),
    [relationshipGroupSignature],
  );
  const [openRelationshipGroupIds, setOpenRelationshipGroupIds] = useState<
    string[]
  >([]);
  useEffect(() => {
    setOpenRelationshipGroupIds(defaultOpenRelationshipGroups(connectionGroups));
  }, [relationshipGroupSignature]);
  const federalContext = node
    ? bundle.runtime.getFederalContext(node.id)
    : null;
  const advancedRelationships = edges.slice(0, 25);
  const impact = useMemo(
    () =>
      node
        ? buildImpactBreakdown(node.id, edges, (id) =>
            bundle.runtime.getNode(id),
          )
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
      return (
        bundle.runtime.getNode(candidateNodeId) || bundle.runtime.getNode(id)
      );
    })
    .filter(Boolean) as Array<{ id: string; metadata?: { item_id?: string } }>;

  const recordItemId: string = node?.metadata?.item_id || "";
  const isEnhancement = node?.node_type === "control_enhancement";
  const baseItemId =
    isEnhancement && recordItemId.includes(".")
      ? recordItemId.slice(0, recordItemId.lastIndexOf("."))
      : "";
  const baseControlNode =
    baseItemId && node?.metadata?.catalog_id
      ? bundle.runtime.getNode(`${node.metadata.catalog_id}:${baseItemId}`)
      : null;

  if (!node) {
    return (
      <section className="notice">
        <h1>Item not found</h1>
        <p>This deep link does not match a current public library entry.</p>
        <Button
          variant="primary"
          onClick={() => onNavigate("search")}
          type="button"
        >
          Back to Explore
        </Button>
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
        <Button
          variant="primary"
          onClick={() => onNavigate("search")}
          type="button"
        >
          Return to Search
        </Button>
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
  const officialSourceUrl = source?.artifact_url || source?.catalog_browse_url || "";

  function goBack() {
    if (window.history.state?.controlAtlasInternalNavigation) {
      window.history.back();
      return;
    }
    onNavigate("search");
  }

  return (
    <section
      className="detail-page"
      data-visual-identity={
        node.node_type === "attack_technique"
          ? "threat-research-record"
          : node.node_type === "defend_countermeasure"
            ? "defense-research-record"
            : "publisher-research-record"
      }
    >
      <PageHeader
        primary
        eyebrow={displayNameFor("object_type", document.object_type)}
        action={
          <div className="page-header-actions">
            <Button
              variant="secondary"
              onClick={goBack}
              type="button"
            >
              Back
            </Button>
            {officialSourceUrl ? (
              <Button
                variant="primary"
                onClick={() => window.open(officialSourceUrl, "_blank", "noopener,noreferrer")}
                type="button"
              >
                Open official source
              </Button>
            ) : null}
            <Button
              variant="secondary"
              onClick={() => openAtlasMapForNode(onNavigate, state.node)}
              type="button"
            >
              See this in the Atlas map
            </Button>
            {/* Secondary actions collapse into one affordance so the record
                opens with a single obvious next step rather than four peers. */}
            <details className="record-actions-menu">
              <summary>More actions</summary>
              <div className="record-actions-popover">
                <Button
                  variant="secondary"
                  onClick={() =>
                    onNavigate("matrix", {
                      crosswalk: "relationships",
                      items: document.item_id,
                      source: node.metadata?.catalog_id || "",
                    })
                  }
                  type="button"
                >
                  Compare
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => onNavigate("templates", { framework: document.catalog_id })}
                  type="button"
                >
                  Produce a document
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    void copyText(
                      `${window.location.origin}${window.location.pathname}${serializeHashUrl(normalizeViewState("library-detail", { view: "library-detail", node: document.id }))}`,
                    );
                  }}
                  type="button"
                >
                  Copy link
                </Button>
              </div>
            </details>
          </div>
        }
        title={recordDisplayTitle(node) || document.title}
      />

      {/* Payoff before orientation: official text and source condition answer
          the user's question before hierarchy, relationships, and advanced
          implementation detail. */}
      <section data-record-section="official-text">
        <SummaryCard
          title={source ? "Official description" : "Source identity unavailable"}
          tone="trust"
        >
          {source ? (
            <>
              <p className="support-meta">
                Source excerpt from {source.display_name || source.name}
              </p>
              <p>
                {descriptionPreview
                  ? renderOdpText(descriptionPreview.preview)
                  : "No narrative description was published for this record."}
              </p>
              {descriptionPreview?.truncated ? (
                <details className="official-description-disclosure">
                  <summary>Read full official description</summary>
                  <p>{renderOdpText(document.description)}</p>
                </details>
              ) : null}
            </>
          ) : (
            <p>
              Official source identity unavailable. This record is not shown
              as official content until its publication identity can be
              verified.
            </p>
          )}
          {source && (source.artifact_url || source.catalog_browse_url) ? (
            <p>
              <a
                href={source.artifact_url || source.catalog_browse_url}
                rel="noopener noreferrer"
                target="_blank"
              >
                Open official source
              </a>
            </p>
          ) : null}
        </SummaryCard>
      </section>

      <section data-record-section="source-freshness">
        <SummaryCard
          title="Source support"
          tone={sourceFreshness(source).is_stale ? "warning" : "trust"}
        >
          <p>{sourceTrustSummary(source)}</p>
          <p className="support-meta">
            Published by: {source?.owner || source?.publisher || "Unavailable"}
          </p>
          {provenanceBreakdown.importedFrom.length ? (
            <p className="support-meta">
              Imported from: {provenanceBreakdown.importedFrom.join(", ")}
            </p>
          ) : null}
          {provenanceBreakdown.enrichedBy.length ? (
            <p className="support-meta">
              Enriched by: {provenanceBreakdown.enrichedBy.join(", ")}
            </p>
          ) : null}
          {provenanceBreakdown.connectionsSuppliedBy.length ? (
            <p className="support-meta">
              Connections supplied by:{" "}
              {provenanceBreakdown.connectionsSuppliedBy.join(", ")}
            </p>
          ) : null}
          {source ? (
            <p className="support-meta">{sourceCurrentAsOf(source)}</p>
          ) : null}
          <div className="card-actions">
            <Button
              variant="secondary"
              onClick={() => onNavigate("sources", { source: source?.id || "" })}
              type="button"
            >
              View data sources
            </Button>
          </div>
        </SummaryCard>
      </section>

      <section className="atlas-structural-position" data-record-section="hierarchy">
        <p className="eyebrow">Hierarchy</p>
        <h2>Where this sits</h2>
        <CanonicalBreadcrumb bundle={bundle} nodeId={node.id} />
      </section>

      {isEnhancement && baseControlNode ? (
        <p className="record-parent-link">
          <button
            className="link-action quiet"
            onClick={() =>
              onOpenNode(baseControlNode.id)
            }
            type="button"
          >
            Part of {baseItemId}
          </button>
        </p>
      ) : null}

      {enhancementsGroup && enhancementsGroup.items.length ? (
        <div className="record-decomposition-block">
          <span className="record-decomposition-label">Decomposes into</span>
          <div className="badge-row">
            {enhancementsGroup.items.map((item: any) => (
              <button
                className="badge-button"
                key={item.counterpart.id}
                onClick={() =>
                  onOpenNode(item.counterpart.id)
                }
                type="button"
              >
                <Badge>
                  {item.counterpart.metadata?.item_id || item.counterpart.id}
                </Badge>
              </button>
            ))}
          </div>
        </div>
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
                      onOpenNode(supersededNode.id)
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
          <Panel data-record-section="connections">
            <div className="section-header">
              <div>
                <h2>Connections</h2>
                <p>How this record connects to other frameworks and sources, grouped by type.</p>
                {/* The per-group counts were spelled out here, again in the
                    group list below, again in the sidebar jump nav, and again
                    in an impact card — four times in one screenful, with two
                    of them disagreeing. The group list and sidebar carry the
                    counts; this header just states the total. */}
                {edges.length > 20 ? (
                  <p className="notice-inline" role="note">
                    This record has many cited connections. Use the relationship
                    and source filters to narrow the visible set without changing
                    the underlying record.
                  </p>
                ) : null}
              </div>
              <div className="section-header-actions">
                {edges.length &&
                !["map", "list", "table"].includes(
                  state.relationshipView || "",
                ) ? (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      onNavigate("library-detail", {
                        node: state.node,
                        relationshipView: "list",
                      })
                    }
                    type="button"
                  >
                    View as list
                  </Button>
                ) : null}
                <span data-published-connection-count={edges.length}>
                  <Badge tone="info">{edges.length} connections</Badge>
                </span>
              </div>
            </div>

            {/* One canonical relationship summary, not two competing
                systems: the class breakdown (Selected by / Correlated
                through / Implemented by / Assessed through) introduces the
                same groups the accordion below lists in full, instead of
                repeating them in a separate section. */}
            {classBuckets.length ? (
              <div className="tree-relationship-classes" aria-label="Relationship classes">
                {classBuckets.map((bucket) => (
                  <div className="tree-relationship-class-row" key={bucket.id}>
                    <span className="tree-relationship-class-label">{bucket.label}</span>
                    <div className="badge-row">
                      {bucket.items.slice(0, 6).map((item) => (
                        <button
                          className="badge-button"
                          key={item.id}
                          onClick={() => onOpenNode(item.id)}
                          type="button"
                        >
                          <Badge tone={bucket.tone === "applicability" ? "applicability" : undefined}>
                            {item.label}
                          </Badge>
                        </button>
                      ))}
                      {bucket.items.length > 6 ? (
                        <span className="tree-relationship-class-more">
                          +{bucket.items.length - 6} more below
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {state.relationshipView === "map" ||
            state.relationshipView === "list" ||
            state.relationshipView === "table" ? (
              <RelationshipExplorer
                centerItemId={document.item_id}
                centerNodeId={node.id}
                filters={relationshipFiltersFromState(state)}
                heading="Explore"
                introCopy={`Connections around ${document.item_id}.`}
                mapControls
                onFilterChange={(patch) =>
                  onNavigate("library-detail", {
                    node: state.node,
                    relationshipView: state.relationshipView || "map",
                    ...relationshipFiltersToPatch(patch),
                  })
                }
                onOpenNode={(nodeId) => onOpenNode(nodeId)}
                onViewChange={(view) =>
                  onNavigate("library-detail", {
                    node: state.node,
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
              groups={connectionGroups}
              onOpenNode={(nodeId) => onOpenNode(nodeId)}
              onOpenGroupIdsChange={setOpenRelationshipGroupIds}
              openGroupIds={openRelationshipGroupIds}
              source={source}
              sourceTrustSummary={sourceTrustSummary}
            />
          </Panel>

          <section className="stack" data-record-section="advanced">
            {node.metadata?.discussion ? (
              <SummaryCard title="Discussion" tone="trust">
                <p className="support-meta">
                  {source?.display_name || source?.name || "The publisher"}'s
                  own explanation of why this exists.
                </p>
                <p>{renderOdpText(node.metadata.discussion)}</p>
              </SummaryCard>
            ) : null}
            {node.node_type === "assessment_procedure" ? (
              <SummaryCard title="Assessment objectives and methods" tone="trust">
                <p className="support-meta">Source: NIST SP 800-53A.</p>
                {renderAssessmentProcedure(node.metadata) || (
                  <p>No assessment content was published for this procedure.</p>
                )}
              </SummaryCard>
            ) : null}
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

            {/* One grouped disclosure below the payoff, not two lone accordions
                on either side of it. "Where it appears" is a single line of
                placement detail — it sat above Connections, putting a click
                before the reason the page exists. */}
            <Accordion.Root className="accordion-root" collapsible type="single">
            <DisclosurePanel title="Where it appears" value="where-it-appears">
              <p>
                {locationSummary.length ? (
                  <>
                    This item appears in{" "}
                    {locationSummary.map((label, index) => (
                      <Fragment key={label}>
                        {index > 0 ? ", " : ""}
                        {label === "LI-SAAS" ? (
                          <GlossaryTermChip termId="li-saas">
                            {label}
                          </GlossaryTermChip>
                        ) : (
                          label
                        )}
                      </Fragment>
                    ))}
                    .
                  </>
                ) : node.node_type === "attack_technique" ||
                  node.node_type === "defend_countermeasure" ? (
                  "This MITRE item connects through attack and defense mappings rather than a baseline membership list."
                ) : (
                  "This item does not have a published baseline placement summary yet."
                )}
              </p>
            </DisclosurePanel>
            {node.metadata?.assessment_objectives?.length ||
            node.metadata?.assessment_method_details?.length ? (
              <DisclosurePanel
                title="What evidence normally supports it"
                value="assessment-evidence"
              >
                <p className="support-meta">
                  Assessment objectives and methods from NIST SP 800-53A.
                </p>
                {renderAssessmentProcedure(node.metadata)}
              </DisclosurePanel>
            ) : null}
            <DisclosurePanel
              title="Official text / source excerpt"
              value="official-text"
            >
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
              {source?.catalog_browse_url ? (
                <p>
                  <a
                    href={source.catalog_browse_url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Browse the official catalog (search for {document.item_id})
                  </a>
                </p>
              ) : null}
            </DisclosurePanel>
            {node.metadata?.check_text ? (
              <DisclosurePanel title="Check text" value="check-text">
                <p>{renderOdpText(node.metadata.check_text)}</p>
              </DisclosurePanel>
            ) : null}
            {node.metadata?.fix_text ? (
              <DisclosurePanel title="Fix text" value="fix-text">
                <p>{renderOdpText(node.metadata.fix_text)}</p>
              </DisclosurePanel>
            ) : null}
            </Accordion.Root>
          </section>
        </section>

        <aside className="stack detail-sidebar">
          <RecordContextRail
            bundle={bundle}
            document={document}
            node={node}
            onNavigate={onNavigate}
            onOpenNode={onOpenNode}
            publishedBuckets={classBuckets}
          />

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
                          <ProvenanceTerm
                            kind="confidence"
                            value={edge.confidence}
                          />
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
