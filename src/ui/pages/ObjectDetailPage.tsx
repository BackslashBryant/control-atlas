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
import { GlossaryTermChip } from "../components/GlossaryTermChip";
import { QuickIntentCard } from "../components/QuickIntentCard";
import { AppLink, shouldInterceptAppLink } from "../components/AppLink";
import {
  glossaryTermsForDocument,
} from "../lib/glossarySearch.mjs";
import { serializeHashUrl } from "../lib/hashRoutes";
import { recordDisplayTitle } from "../lib/recordTitle";
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

import { Button, ButtonLink, Panel } from "../components/lsm";

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
  const [openRelationshipGroupIds, setOpenRelationshipGroupIds] = useState<
    string[]
  >([]);
  useEffect(() => {
    setOpenRelationshipGroupIds(defaultOpenRelationshipGroups(connectionGroups));
  }, [relationshipGroupSignature]);
  const federalContext = node
    ? bundle.runtime.getFederalContext(node.id)
    : null;

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
        <AppLink onNavigate={onNavigate} variant="primary" view="search">
          Back to Explore
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
          Return to Search
        </AppLink>
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
            <AppLink
              onClick={(event) => {
                if (
                  !shouldInterceptAppLink(event) ||
                  !window.history.state?.controlAtlasInternalNavigation
                ) return;
                event.preventDefault();
                window.history.back();
              }}
              onNavigate={onNavigate}
              variant="secondary"
              view="search"
            >
              Back
            </AppLink>
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
            <AppLink onNavigate={onNavigate} patch={{ node: state.node }} variant="secondary" view="atlas-map">
              See this in the Atlas map
            </AppLink>
            {/* Secondary actions collapse into one affordance so the record
                opens with a single obvious next step rather than four peers. */}
            <details className="record-actions-menu">
              <summary>More actions</summary>
              <div className="record-actions-popover">
                <AppLink onNavigate={onNavigate} patch={{ crosswalk: "relationships", items: document.item_id, source: node.metadata?.catalog_id || "" }} variant="secondary" view="matrix">
                  Compare
                </AppLink>
                <AppLink onNavigate={onNavigate} patch={{ framework: document.catalog_id }} variant="secondary" view="templates">
                  Produce a document
                </AppLink>
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
              From: {provenanceBreakdown.importedFrom.join(", ")}
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
            <AppLink onNavigate={onNavigate} patch={{ source: source?.id || "" }} variant="secondary" view="sources">
              View data sources
            </AppLink>
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
          <AppLink
            className="link-action quiet"
            onNavigate={onNavigate}
            patch={{ node: baseControlNode.id }}
            view="library-detail"
          >
            Part of {baseItemId}
          </AppLink>
        </p>
      ) : null}

      {enhancementsGroup && enhancementsGroup.items.length ? (
        <div className="record-decomposition-block">
          <span className="record-decomposition-label">Decomposes into</span>
          <div className="badge-row">
            {enhancementsGroup.items.map((item: any) => (
              <AppLink
                className="badge-button"
                key={item.counterpart.id}
                onNavigate={onNavigate}
                patch={{ node: item.counterpart.id }}
                view="library-detail"
              >
                <Badge>
                  {item.counterpart.metadata?.item_id || item.counterpart.id}
                </Badge>
              </AppLink>
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
                  <AppLink
                    className="link-action quiet"
                    onNavigate={onNavigate}
                    patch={{ node: supersededNode.id }}
                    view="library-detail"
                  >
                    {supersededNode.metadata?.item_id || supersededNode.id}
                  </AppLink>
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

            {state.relationshipView === "map" ||
            state.relationshipView === "list" ||
            state.relationshipView === "table" ? null : (
              <RelationshipGroupsSection
                formatRelationshipLabel={formatRelationshipLabel}
                groups={connectionGroups}
                onOpenNode={(nodeId) => onOpenNode(nodeId)}
                onOpenGroupIdsChange={setOpenRelationshipGroupIds}
                openGroupIds={openRelationshipGroupIds}
              />
            )}
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
            </DisclosurePanel>
          </Accordion.Root>
        </aside>
      </div>
    </section>
  );
}
