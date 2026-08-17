import * as Accordion from "@radix-ui/react-accordion";
import {
  IconArrowRight,
  IconFilter,
  IconGitCompare,
} from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import { SITE_COPY } from "../../shared/site-copy.mjs";
import { ExpandableControlList } from "../components/ExpandableRelationshipGroup";
import { CompareResultsPanel } from "../components/CompareResultsPanel";
import { CompareExportDisclosure } from "../components/LoadStatusPanel";
import { CatalogVersionChip } from "../components/CatalogVersionChip";
import {
  CatalogCoverageNotice,
  useCatalogCoverage,
} from "../components/CatalogCoverageNotice";
import {
  ChainRelationshipItem,
  parseCatalogItemIds,
  ProvenanceBadge,
  SourceRefList,
} from "../lib/compareHelpers";
import { buildCrosswalkCompareGraph } from "../lib/buildCompareGraph";
import {
  activateCompareMode,
  compareConfigurationReady,
  COMPARE_MODES,
  nextMissingCompareInput,
  resolveMappingSource,
} from "../lib/compareModeState";
import {
  Field,
  PageHeader,
  SelectField,
  SummaryCard,
  WorkbenchControlSurface,
} from "../lib/pagePrimitives";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { CompareCrosswalk, ViewState } from "../lib/viewState";
import { Button, Panel } from "../components/lsm";
import { AppLink } from "../components/AppLink";
import { RecordLink } from "../components/RecordLink";
import { ContextualTaxonomyLinks, TaxonomyTagLinks } from "../components/ContextualTaxonomyLinks";

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function relationshipTagIds(row: any) {
  return [
    ...(row.from_taxonomy_tags || []).map((tag: any) => tag.id),
    ...(row.to_taxonomy_tags || []).map((tag: any) => tag.id),
  ].filter(Boolean);
}


function DisclosurePanel(props: {
  value: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Accordion.Item className="accordion-item" value={props.value}>
      <Accordion.Header asChild>
        <h2>
        <Accordion.Trigger className="accordion-trigger">
          <span>{props.title}</span>
          <IconArrowRight size={18} stroke={1.8} />
        </Accordion.Trigger>
        </h2>
      </Accordion.Header>
      <Accordion.Content className="accordion-content">
        {props.children}
      </Accordion.Content>
    </Accordion.Item>
  );
}

function BaselineControlSection(props: {
  controls: Array<{
    control_node: any;
    source_refs?: Array<Record<string, string>>;
  }>;
  onOpenNode: (nodeId: string) => void;
  title: string;
}) {
  return (
    <SummaryCard title={props.title}>
      <p>
        {props.controls.length} control{props.controls.length === 1 ? "" : "s"}
      </p>
      <ExpandableControlList
        controls={props.controls}
        onOpenNode={props.onOpenNode}
        sourceRefList={(refs) => <SourceRefList refs={refs} />}
      />
    </SummaryCard>
  );
}

export function ComparePage(props: {
  bundle: RuntimeBundle;
  state: Extract<ViewState, { view: "matrix" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNode: (nodeId: string) => void;
}) {
  const { bundle, state, onNavigate, onOpenNode } = props;
  const compareResultsRef = useRef<HTMLElement | null>(null);
  const [relationshipPage, setRelationshipPage] = useState(1);
  const catalogs = bundle.runtime.getCatalogs();
  const catalogCoverageList = useCatalogCoverage(bundle);
  // Publication A must only offer publications that actually resolve to at
  // least one Publication B with at least one resolvable mapping source, or
  // the user picks one and dead-ends on "No published comparison is
  // available". Before the full graph loads, runtime.getConnectedCatalogs
  // reads live edges that are not resident yet, so it always returns [] in
  // that phase — fall back to the build-time capability index
  // (bundle.mappingSources, keyed "source|target") instead. Both this
  // fallback and the live runtime path resolve pairs from the identical
  // isComparisonCapableEdge predicate (src/shared/compare-capability.mjs),
  // so the option list cannot disagree across the loading transition.
  const catalogsWithValidTarget = useMemo(() => {
    if (bundle.graphReady) {
      return new Set(
        catalogs
          .filter((catalog: any) => bundle.runtime.getConnectedCatalogs(catalog.id).length > 0)
          .map((catalog: any) => catalog.id),
      );
    }
    const withTarget = new Set<string>();
    for (const key of Object.keys(bundle.mappingSources || {})) {
      const sources = bundle.mappingSources?.[key];
      if (!sources || !sources.length) continue;
      const [sourceCatalogId] = key.split("|");
      if (sourceCatalogId) withTarget.add(sourceCatalogId);
    }
    return withTarget;
  }, [bundle.runtime, bundle.mappingSources, bundle.graphReady, catalogs]);
  const sourceCatalogOptions = useMemo(
    () =>
      catalogs
        .filter((catalog: any) => catalogsWithValidTarget.has(catalog.id))
        .sort((left: any, right: any) => left.name.localeCompare(right.name))
        .map((catalog: any) => ({ value: catalog.id, label: catalog.name })),
    [catalogs, catalogsWithValidTarget],
  );
  // Same loading-phase split as sourceCatalogOptions above: getConnectedCatalogs
  // reads live edges that are empty until the full graph loads, so Publication
  // B must also fall back to the build-time bundle.mappingSources index or it
  // would falsely read as "no valid target" (and, via T3.8's stale-value
  // check below, falsely reject a deep-linked target that is actually valid)
  // for the entire time the graph is still loading.
  const connectedTargetOptions = useMemo(() => {
    if (bundle.graphReady) {
      return bundle.runtime.getConnectedCatalogs(state.source).map((catalog: any) => ({
        value: catalog.id,
        label: `${catalog.name} (${catalog.connection_count.toLocaleString()} published connection${catalog.connection_count === 1 ? "" : "s"})`,
      }));
    }
    if (!state.source) return [];
    const targetIds = new Set<string>();
    for (const key of Object.keys(bundle.mappingSources || {})) {
      const sources = bundle.mappingSources?.[key];
      if (!sources || !sources.length) continue;
      const [sourceCatalogId, targetCatalogId] = key.split("|");
      if (sourceCatalogId === state.source && targetCatalogId) {
        targetIds.add(targetCatalogId);
      }
    }
    return catalogs
      .filter((catalog: any) => targetIds.has(catalog.id))
      .sort((left: any, right: any) => left.name.localeCompare(right.name))
      .map((catalog: any) => ({ value: catalog.id, label: catalog.name }));
  }, [bundle.runtime, bundle.mappingSources, bundle.graphReady, catalogs, state.source]);

  const selectedCatalogVersion = useMemo(() => {
    const catalogId = state.source || state.target;
    if (!catalogId) {
      return null;
    }
    const catalog = catalogs.find((entry: any) => entry.id === catalogId);
    if (catalog?.source_version) {
      return catalog.source_version;
    }
    const sampleNode = bundle.runtime.getNodes({ catalog_id: catalogId })[0];
    const source = sampleNode
      ? bundle.runtime.getSource(sampleNode.source_id)
      : null;
    return source?.version || source?.source_version || null;
  }, [bundle.runtime, catalogs, state.source, state.target]);
  const crosswalk = state.crosswalk || "intent";
  const relationshipNodeIds = useMemo(
    () => parseCatalogItemIds(state.items, state.source),
    [state.items, state.source],
  );
  const relationshipRowsRaw =
    crosswalk === "relationships"
      ? bundle.runtime.buildRelationshipRows({
          source_catalog: state.source,
          target_catalog: state.target,
          relationship_type: state.relationshipType,
          provenance_class: state.provenance,
          confidence: state.confidence,
          include_candidates: state.includeCandidates === "true",
          node_ids: relationshipNodeIds,
        })
      : null;
  const mappingSourceOptions = useMemo(() => {
    if (!bundle.graphReady && state.source && state.target) {
      return (
        bundle.mappingSources?.[`${state.source}|${state.target}`] || []
      );
    }
    const sources = new Map<string, string>();
    for (const row of relationshipRowsRaw?.rows || []) {
      for (const reference of row.source_refs || []) {
        const sourceId = reference.source_id || reference.sourceId;
        if (!sourceId) continue;
        const source = bundle.runtime.getSource(sourceId);
        sources.set(
          sourceId,
          source?.display_name || source?.name || sourceId,
        );
      }
    }
    return [...sources.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [
    bundle.graphReady,
    bundle.mappingSources,
    bundle.runtime,
    relationshipRowsRaw,
    state.source,
    state.target,
  ]);
  const eligibleMappingSources = useMemo(
    () => mappingSourceOptions.map((option) => option.value),
    [mappingSourceOptions],
  );
  // T3.6/T3.7: a pair with exactly one mapping source is never a user
  // decision (auto-selected); a pair with several defaults to showing every
  // published mapping ("all") rather than forcing a choice before results
  // can render. Only an explicit user-chosen filter narrows the rows.
  const mappingResolution = useMemo(
    () => resolveMappingSource(eligibleMappingSources, state.mappingSource),
    [eligibleMappingSources, state.mappingSource],
  );
  const effectiveMappingSource =
    mappingResolution.status === "auto" || mappingResolution.status === "filtered"
      ? mappingResolution.value
      : "";
  const relationshipRows =
    relationshipRowsRaw && effectiveMappingSource
      ? {
          ...relationshipRowsRaw,
          rows: relationshipRowsRaw.rows.filter((row: any) =>
            (row.source_refs || []).some(
              (reference: any) =>
                (reference.source_id || reference.sourceId) ===
                effectiveMappingSource,
            ),
          ),
        }
      : relationshipRowsRaw;
  // A record-handoff link (e.g. "Compare this item against other public
  // mappings") sets `items` but no framework pair — the runtime already
  // returns cross-catalog rows for that case, so show results/empty-state
  // whenever there's *some* comparison scope, not only a chosen pair.
  const hasComparisonScope = Boolean(
    (state.source && state.target) || state.items,
  );
  const relationshipPageSize = 25;
  const relationshipPageCount = Math.max(
    1,
    Math.ceil((relationshipRows?.rows.length ?? 0) / relationshipPageSize),
  );
  const visibleRelationshipRows =
    relationshipRows?.rows.slice(
      (relationshipPage - 1) * relationshipPageSize,
      relationshipPage * relationshipPageSize,
    ) ?? [];

  useEffect(() => {
    setRelationshipPage(1);
  }, [
    state.source,
    state.target,
    state.items,
    state.relationshipType,
    state.provenance,
    state.confidence,
    state.includeCandidates,
    state.mappingSource,
  ]);
  // Distinguish "this framework pair has zero published edges at all" (a
  // real data gap — resetting filters won't help) from "your filters
  // narrowed a real pair down to zero" (recoverable). Checked with no
  // item/type/provenance/confidence filters, since pair-level support is
  // about the catalogs, not one item or one relationship type.
  const pairHasAnyPublishedMapping =
    !bundle.graphReady
      ? true
      :
    crosswalk === "relationships" && state.source && state.target
      ? bundle.runtime.buildRelationshipRows({
          source_catalog: state.source,
          target_catalog: state.target,
          include_candidates: true,
        }).rows.length > 0
      : true;
  const relationshipFilterOptions = useMemo(() => {
    if (!state.source || !state.target) {
      return {
        types: [] as string[],
        provenances: [] as string[],
        confidences: [] as string[],
      };
    }
    const optionRows = bundle.runtime.buildRelationshipRows({
      source_catalog: state.source,
      target_catalog: state.target,
      include_candidates: true,
      node_ids: relationshipNodeIds,
    }).rows;
    return {
      types: [
        ...new Set(
          optionRows.map((row: any) => row.relationship_type).filter(Boolean),
        ),
      ].sort() as string[],
      provenances: [
        ...new Set(
          optionRows.map((row: any) => row.provenance_class).filter(Boolean),
        ),
      ].sort() as string[],
      confidences: [
        ...new Set(
          optionRows.map((row: any) => row.confidence).filter(Boolean),
        ),
      ].sort() as string[],
    };
  }, [bundle, relationshipNodeIds, state.source, state.target]);
  const chainCatalogId =
    state.chainCatalog ||
    (crosswalk === "threat-chain" ? "mitre-attack" : "disa-stig");
  const chainCatalogNodes = useMemo(
    () =>
      crosswalk === "threat-chain"
        ? bundle.runtime
            .getNodes({ node_type: "attack_technique" })
            .filter(
              (node: any) =>
                !state.chainCatalog ||
                node.metadata?.catalog_id === state.chainCatalog,
            )
            .sort(
              (left: any, right: any) =>
                (left.metadata?.item_id || "").localeCompare(
                  right.metadata?.item_id || "",
                ) || left.id.localeCompare(right.id),
            )
        : bundle.runtime
            .getNodes({ catalog_id: chainCatalogId })
            .sort(
              (left: any, right: any) =>
                (left.metadata?.item_id || "").localeCompare(
                  right.metadata?.item_id || "",
                ) || left.id.localeCompare(right.id),
            ),
    [bundle, chainCatalogId, state.chainCatalog, crosswalk],
  );
  const chainBenchmarkOptions = useMemo(
    () =>
      [
        ...new Map(
          chainCatalogNodes.map((node: any) => {
            const value = node.metadata?.benchmark_id || node.source_id;
            const source = bundle.runtime.getSource(node.source_id);
            const label =
              node.metadata?.benchmark_title ||
              source?.display_name ||
              source?.name ||
              value;
            return [value, { value, label }];
          }),
        ).values(),
      ] as Array<{ value: string; label: string }>,
    [bundle, chainCatalogNodes],
  );
  const chainPayload =
    crosswalk === "stig-chain"
      ? bundle.runtime.buildStigChain({
          chain_catalog: chainCatalogId,
          chain_benchmark: state.chainBenchmark,
          chain_item: state.chainItem,
          include_candidates: state.includeCandidates === "true",
        })
      : null;
  const threatChainPayload =
    crosswalk === "threat-chain"
      ? bundle.runtime.buildThreatChain({
          chain_catalog: state.chainCatalog || "mitre-attack",
          chain_item: state.chainItem,
          include_candidates: state.includeCandidates === "true",
        })
      : null;
  const baselineOptions = bundle.runtime
    .getNodes({ node_type: "baseline" })
    .map((node: any) => ({
      value: node.id,
      label: `${node.metadata?.item_id || node.id} - ${node.metadata?.title || node.label}`,
    }));
  const baselineComparison =
    crosswalk === "baseline-compare" &&
    state.baselineA &&
    state.baselineB &&
    state.baselineA !== state.baselineB
      ? bundle.runtime.buildBaselineComparison({
          baseline_a: state.baselineA,
          baseline_b: state.baselineB,
        })
      : null;
  const selectedChain = chainPayload?.selected_chain;
  const selectedThreatChain = threatChainPayload?.selected_chain;
  const compareView = state.compareView === "map" ? "map" : "list";

  const compareGraph = useMemo(
    () =>
      buildCrosswalkCompareGraph({
        crosswalk,
        relationshipRows,
        sourceCatalog: state.source,
        targetCatalog: state.target,
        baselineComparison,
        chainPayload,
        threatChainPayload,
      }),
    [
      crosswalk,
      relationshipRows,
      state.source,
      state.target,
      baselineComparison,
      chainPayload,
      threatChainPayload,
    ],
  );

  const comparisonCards: Array<{
    id: (typeof COMPARE_MODES)[number]["id"];
    title: string;
    body: string;
    crosswalk: CompareCrosswalk;
  }> = [
    {
      id: "frameworks",
      title: "Catalog to catalog",
      body: "See how two frameworks line up, based on one published mapping you choose.",
      crosswalk: "relationships",
    },
    {
      id: "stig-chain",
      title: "STIG/SRG to controls",
      body: "Trace Security Technical Implementation Guide (STIG) and Security Requirements Guide (SRG) items through CCI links to related NIST controls.",
      crosswalk: "stig-chain",
    },
    {
      id: "threat-chain",
      title: "Threat to controls",
      body: "Trace an ATT&CK technique through D3FEND countermeasures to related NIST controls.",
      crosswalk: "threat-chain",
    },
    {
      id: "baseline-compare",
      title: "Baseline to baseline",
      body: "See what two public baselines share and what is only present in one of them.",
      crosswalk: "baseline-compare",
    },
    {
      id: "item-mapping",
      title: "Find what maps to this item",
      body: "Open the framework comparison view with one known item in mind instead of blank filters.",
      crosswalk: "relationships",
    },
  ];

  function exportRows(format: "csv" | "markdown" | "json") {
    if (crosswalk === "relationships" && relationshipRows) {
      const content = bundle.runtime.exportRelationshipRows(
        relationshipRows.rows,
        format,
      );
      const extension = format === "markdown" ? "md" : format;
      downloadTextFile(
        `control-atlas-compare.${extension}`,
        content,
        format === "json" ? "application/json" : "text/plain",
      );
    }
    if (crosswalk === "stig-chain" && chainPayload) {
      const content = bundle.runtime.exportStigChain(chainPayload, format);
      const extension = format === "markdown" ? "md" : format;
      downloadTextFile(
        `control-atlas-stig-chain.${extension}`,
        content,
        format === "json" ? "application/json" : "text/plain",
      );
    }
    if (crosswalk === "threat-chain" && threatChainPayload) {
      const content = bundle.runtime.exportThreatChain(
        threatChainPayload,
        format,
      );
      const extension = format === "markdown" ? "md" : format;
      downloadTextFile(
        `control-atlas-threat-chain.${extension}`,
        content,
        format === "json" ? "application/json" : "text/plain",
      );
    }
    if (crosswalk === "baseline-compare" && baselineComparison) {
      const content = bundle.runtime.exportBaselineComparison(
        baselineComparison,
        format,
      );
      const extension = format === "markdown" ? "md" : format;
      downloadTextFile(
        `control-atlas-baselines.${extension}`,
        content,
        format === "json" ? "application/json" : "text/plain",
      );
    }
  }

  // T3.8: a deep link can name a source/target catalog that no longer has a
  // valid completion (data changed, or the link is simply old). Rather than
  // trusting the raw URL value and letting the query silently return zero
  // rows, treat a value outside the currently valid option list as unset for
  // readiness purposes — the missing-input message then points the user
  // back at the live dropdown of valid choices instead of a dead form.
  const sourceIsCurrentlyValid =
    !state.source ||
    sourceCatalogOptions.some((option) => option.value === state.source);
  const targetIsCurrentlyValid =
    !state.target ||
    connectedTargetOptions.some((option) => option.value === state.target);
  const compareStateForReadiness = {
    ...state,
    source: sourceIsCurrentlyValid ? state.source : "",
    target: targetIsCurrentlyValid ? state.target : "",
  };
  const missingCompareInput = nextMissingCompareInput(
    compareStateForReadiness,
    eligibleMappingSources,
  );
  const compareReady = compareConfigurationReady(
    compareStateForReadiness,
    eligibleMappingSources,
  );

  return (
    <Panel data-control-results data-visual-identity="aligned-analysis-workbench" id="compare-workspace">
      <PageHeader
        primary
        summary={SITE_COPY.routes.compare.purpose}
        title={SITE_COPY.routes.compare.title}
      />
      {selectedCatalogVersion ? (
        <CatalogVersionChip label="Active" version={selectedCatalogVersion} />
      ) : null}

      {crosswalk === "intent" ? (
        <section aria-labelledby="compare-kind-heading" className="nexus-section">
          <h2 className="visually-hidden" id="compare-kind-heading">
            Comparison types
          </h2>
          <div className="compare-mode-tabs">
            {comparisonCards.map((card) => (
              <button
                className="intent-card intent-card-button"
                key={card.title}
                onClick={() =>
                  onNavigate("matrix", activateCompareMode(card.id))
                }
                type="button"
              >
                <span className="intent-card-title">{card.title}</span>
                <span className="intent-card-body">{card.body}</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <div className="compare-mode-header">
          <div>
            <p className="eyebrow">Comparison type</p>
            <h2>
              {comparisonCards.find((card) => card.id === state.intent)?.title ||
                comparisonCards.find((card) => card.crosswalk === crosswalk)?.title}
            </h2>
          </div>
          <Button
            variant="secondary"
            onClick={() =>
              onNavigate("matrix", {
                ...activateCompareMode("frameworks"),
                crosswalk: "intent",
                intent: "",
              })
            }
            type="button"
          >
            Change comparison
          </Button>
        </div>
      )}

      {crosswalk === "relationships" ? (
        <>
          <WorkbenchControlSurface
            className="compare-controls"
            label="Configure comparison"
            targetId="compare-results-panel"
          >
            <div className="compare-control-grid">
            <div className="field-row">
              <SelectField
                emptyLabel="Choose a primary publication"
                label={
                  state.intent === "item-mapping"
                    ? "Publication"
                    : "Publication A"
                }
                onChange={(source) =>
                  onNavigate("matrix", {
                    crosswalk,
                    source,
                    target: "",
                    items: "",
                    mappingSource: "",
                    compareRun: "",
                  })
                }
                options={sourceCatalogOptions}
                value={state.source}
              />
              {state.intent === "item-mapping" ? (
                <Field label="Specific control or rule">
                  <input
                    onChange={(event) =>
                      onNavigate("matrix", {
                        crosswalk,
                        items: event.target.value,
                        mappingSource: "",
                        compareRun: "",
                      })
                    }
                    placeholder="For example, AC-2"
                    value={state.items}
                  />
                  <p className="field-hint">
                    Enter the exact control or rule identifier to see its published mappings.
                  </p>
                </Field>
              ) : null}
              <SelectField
                disabled={!state.source}
                emptyLabel={
                  state.source
                    ? connectedTargetOptions.length
                      ? "Choose a target publication"
                      : "No published comparison is available"
                    : "Choose Publication A first"
                }
                hint={
                  state.source && !connectedTargetOptions.length
                    ? "No published mappings connect this publication to other frameworks."
                    : undefined
                }
                label="Publication B"
                onChange={(target) =>
                  onNavigate("matrix", {
                    crosswalk,
                    target,
                    mappingSource: "",
                    compareRun: "",
                  })
                }
                options={connectedTargetOptions}
                value={state.target}
              />
              {mappingResolution.status === "auto" ? (
                <Field label="Mapping publication">
                  <p className="field-value">
                    {mappingSourceOptions[0]?.label || mappingResolution.value}
                  </p>
                </Field>
              ) : (
                <SelectField
                  emptyLabel={
                    (state.intent === "item-mapping" && state.items) ||
                    (state.source && state.target)
                      ? mappingSourceOptions.length
                        ? "All published mappings"
                        : "Select the publication that records the mapping"
                      : "All published mappings"
                  }
                  hint="Optional. Leave blank to see every published mapping for this pair, or narrow to one cited source."
                  label="Mapping publication"
                  onChange={(mappingSource) =>
                    onNavigate("matrix", {
                      crosswalk,
                      mappingSource,
                      compareRun: "",
                    })
                  }
                  options={mappingSourceOptions}
                  value={state.mappingSource}
                />
              )}
            </div>
            </div>
            <p className="compare-boundary">
              Published mappings show cited relationships from official sources.
            </p>
            {compareReady ? (
              <Button
                onClick={() =>
                  onNavigate("matrix", { crosswalk, compareRun: "true" })
                }
                type="button"
                variant="primary"
              >
                Show mappings
              </Button>
            ) : (
              <p className="generation-status tone-warning" role="status">
                Select {missingCompareInput} to view published mappings.
              </p>
            )}
            {hasComparisonScope ? (
              <Accordion.Root
                className="accordion-root"
                collapsible
                type="single"
              >
                <DisclosurePanel title="Refine comparison" value="refine">
                  <div className="filter-grid">
                  {state.intent !== "item-mapping" ? (
                  <Field label="Specific control or rule (optional)">
                    <input
                      onChange={(event) =>
                        onNavigate("matrix", {
                          crosswalk,
                          items: event.target.value,
                        })
                      }
                      placeholder="For example, AC-2"
                      value={state.items}
                    />
                    <p className="field-hint">
                      Leave blank to compare every published mapping in this pair.
                    </p>
                  </Field>
                  ) : null}
                  <SelectField
                    emptyLabel="All connection types"
                    label="Connection type"
                    onChange={(value) =>
                      onNavigate("matrix", {
                        crosswalk,
                        relationshipType: value,
                      })
                    }
                    options={relationshipFilterOptions.types.map((value) => ({
                      value,
                      label: displayNameFor("relationship_type", value),
                    }))}
                    value={state.relationshipType}
                  />
                  <SelectField
                    emptyLabel="All source bases"
                    label="Source basis"
                    onChange={(value) =>
                      onNavigate("matrix", {
                        crosswalk,
                        provenance: value,
                      })
                    }
                    options={relationshipFilterOptions.provenances.map(
                      (value) => ({
                        value,
                        label: displayNameFor("provenance_class", value),
                      }),
                    )}
                    value={state.provenance}
                  />
                  <SelectField
                    emptyLabel="All trust levels"
                    label="Trust level"
                    onChange={(value) =>
                      onNavigate("matrix", {
                        crosswalk,
                        confidence: value,
                      })
                    }
                    options={relationshipFilterOptions.confidences.map(
                      (value) => ({
                        value,
                        label: displayNameFor("confidence", value),
                      }),
                    )}
                    value={state.confidence}
                  />
                  <Field label="Show inferred mappings">
                    <label className="checkbox-field">
                      <input
                        checked={state.includeCandidates === "true"}
                        onChange={(event) =>
                          onNavigate("matrix", {
                            crosswalk,
                            includeCandidates: event.target.checked
                              ? "true"
                              : "",
                          })
                        }
                        type="checkbox"
                      />
                      <span>Include candidate and inferred links</span>
                    </label>
                  </Field>
                  </div>
                  <p className="compare-legend">
                    Published mappings come from named sources. Candidate mappings
                    still need review.
                  </p>
                </DisclosurePanel>
              </Accordion.Root>
            ) : null}
          </WorkbenchControlSurface>
          {state.compareRun === "true" && relationshipRows?.rows?.length ? (
            <section
              className="compare-results"
              id="compare-results"
              ref={compareResultsRef}
            >
              <CompareResultsPanel
                bundle={bundle}
                compareView={compareView}
                graph={compareGraph}
                listContent={
                  <section className="stack compare-mappings">
                    <h3 className="compare-mappings-title">
                      Mapping details
                      <span className="compare-mappings-count">
                        {relationshipRows.rows.length.toLocaleString()} row
                        {relationshipRows.rows.length === 1 ? "" : "s"}
                      </span>
                    </h3>
                    <p aria-live="polite" className="field-hint compare-range">
                      Showing {(relationshipPage - 1) * relationshipPageSize + 1}
                      –{Math.min(relationshipPage * relationshipPageSize, relationshipRows.rows.length)} of {relationshipRows.rows.length.toLocaleString()}
                    </p>
                    <div className="compare-table-scroll">
                      <table
                        aria-label="Relationship mappings"
                        className="detail-table"
                      >
                        <thead>
                          <tr>
                            <th>From</th>
                            <th>To</th>
                            <th>Connection</th>
                            <th>Source basis</th>
                            <th>Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleRelationshipRows.map((row: any) => (
                            <tr key={row.edge_id}>
                              <td data-label="From">
                                <strong>{row.from_item_id}</strong>
                                <br />
                                <span className="muted">{row.from_title}</span>
                              </td>
                              <td data-label="To">
                                <strong>{row.to_item_id}</strong>
                                <br />
                                <span className="muted">{row.to_title}</span>
                              </td>
                              <td data-label="Connection">
                                {displayNameFor(
                                  "relationship_type",
                                  row.relationship_type,
                                )}
                              </td>
                              <td data-label="Source basis">
                                <ProvenanceBadge
                                  provenanceClass={row.provenance_class}
                                  publicationStatus={row.publication_status}
                                />
                              </td>
                              <td data-label="Details">
                                <details className="mapping-row-details">
                                  <summary>View evidence</summary>
                                  <dl>
                                    <div><dt>Trust level</dt><dd>{displayNameFor("confidence", row.confidence)}</dd></div>
                                    <div><dt>Official rationale</dt><dd>{row.rationale || "No public rationale recorded."}</dd></div>
                                    <div><dt>{row.navigation_note ? "Navigation note" : "Relationship explanation"}</dt><dd>{row.navigation_note || "No product-authored navigation note."}</dd></div>
                                    <div><dt>Source references</dt><dd><SourceRefList refs={row.source_refs} /></dd></div>
                                    {relationshipTagIds(row).length ? <div>
                                      <dt>Governed record tags</dt>
                                      <dd>
                                        <TaxonomyTagLinks
                                          onNavigate={onNavigate}
                                          tagIds={relationshipTagIds(row)}
                                        />
                                      </dd>
                                    </div> : null}
                                  </dl>
                                </details>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {relationshipPageCount > 1 ? (
                      <nav aria-label="Mapping result pages" className="pagination">
                        <Button variant="secondary" disabled={relationshipPage === 1} onClick={() => setRelationshipPage((page) => Math.max(1, page - 1))} type="button">Previous</Button>
                        <span>Page {relationshipPage} of {relationshipPageCount}</span>
                        <Button variant="secondary" disabled={relationshipPage === relationshipPageCount} onClick={() => setRelationshipPage((page) => Math.min(relationshipPageCount, page + 1))} type="button">Next</Button>
                      </nav>
                    ) : null}
                  </section>
                }
                matrixCrosswalk={crosswalk}
                onExport={exportRows}
                onNavigate={onNavigate}
                onOpenNode={onOpenNode}
              />
            </section>
          ) : state.compareRun === "true" && hasComparisonScope ? (
            <section className="empty-state">
              <IconFilter aria-hidden="true" size={24} stroke={1.8} />
              <h2>
                {!state.source || !state.target
                  ? `No published mapping found for ${state.items} yet.`
                  : pairHasAnyPublishedMapping
                    ? "No public connections found for this comparison."
                    : `No published mapping is available for ${catalogs.find((c: any) => c.id === state.source)?.name || state.source} ↔ ${catalogs.find((c: any) => c.id === state.target)?.name || state.target} yet.`}
              </h2>
              <p>
                {!state.source || !state.target
                  ? "Pick a Framework A and Framework B above to compare this item against, or try a different comparison type below."
                  : pairHasAnyPublishedMapping
                    ? "Try changing one catalog, removing filters, or searching for a specific control identifier."
                    : "This isn't a filter issue — the cited sources contain no official crosswalk between these two catalogs. Try a different framework pair."}
              </p>
              <div className="card-actions">
                {state.source && state.target && pairHasAnyPublishedMapping ? (
                  <Button
                    variant="primary"
                    onClick={() =>
                      onNavigate("matrix", {
                        crosswalk,
                        relationshipType: "",
                        provenance: "",
                        confidence: "",
                        includeCandidates: "",
                      })
                    }
                    type="button"
                  >
                    Reset filters
                  </Button>
                ) : null}
                <Button
                  variant={state.source && state.target && pairHasAnyPublishedMapping ? "secondary" : "primary"}
                  onClick={() =>
                    onNavigate("matrix", { crosswalk: "intent" })
                  }
                  type="button"
                >
                  Choose another comparison
                </Button>
                <details>
                  <summary>Check the data source</summary>
                  <AppLink className="disclosure-actions" onNavigate={onNavigate} variant="secondary" view="sources">Review sources</AppLink>
                </details>
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      {crosswalk === "stig-chain" ? (
        <>
          <WorkbenchControlSurface
            className="compare-control-surface"
            label="Choose STIG or SRG chain inputs"
            targetId="compare-workspace"
          >
            <div className="filter-grid">
            <SelectField
              label="Catalog"
              onChange={(value) =>
                onNavigate("matrix", {
                  crosswalk,
                  chainCatalog: value,
                  chainBenchmark: "",
                  chainItem: "",
                })
              }
              options={[
                { value: "disa-stig", label: "DISA STIG" },
                { value: "disa-srg", label: "DISA SRG" },
              ]}
              value={chainCatalogId}
            />
            <SelectField
              emptyLabel="All benchmarks"
              label="Benchmark scope"
              onChange={(value) =>
                onNavigate("matrix", {
                  crosswalk,
                  chainBenchmark: value,
                  chainItem: "",
                })
              }
              options={chainBenchmarkOptions}
              value={state.chainBenchmark}
            />
            <SelectField
              emptyLabel="All visible items"
              label="STIG or SRG item"
              onChange={(value) =>
                onNavigate("matrix", {
                  crosswalk,
                  chainItem: value,
                })
              }
              options={chainCatalogNodes
                .filter(
                  (node: any) =>
                    !state.chainBenchmark ||
                    node.metadata?.benchmark_id === state.chainBenchmark ||
                    node.source_id === state.chainBenchmark,
                )
                .map((node: any) => ({
                  value: node.id,
                  label: `${node.metadata?.item_id || node.id} - ${node.metadata?.title || node.label}`,
                }))}
              value={state.chainItem}
            />
            <Field label="Show inferred mappings">
              <label className="checkbox-field">
                <input
                  checked={state.includeCandidates === "true"}
                  onChange={(event) =>
                    onNavigate("matrix", {
                      crosswalk,
                      includeCandidates: event.target.checked ? "true" : "",
                    })
                  }
                  type="checkbox"
                />
                <span>Include candidate and inferred links</span>
              </label>
            </Field>
            </div>
            <p className="compare-legend">
              Published mappings come from named sources. Candidate mappings still
              need review. Pick a STIG rule, review its CCI (Control Correlation
              Identifier) connections, then open the related NIST control.
              {chainPayload?.rows?.length
                ? ` ${chainPayload.rows.length} STIG or SRG item${chainPayload.rows.length === 1 ? "" : "s"} visible in the current chain scope.`
                : ""}
            </p>
          </WorkbenchControlSurface>
          <ContextualTaxonomyLinks
            catalogIds={[chainCatalogId]}
            contextLabel="the current STIG or SRG comparison"
            onNavigate={onNavigate}
            runtime={bundle.runtime}
            subjectLabel="comparison"
          />
          {chainPayload?.rows?.length ? (
            <div className="stack">
              <CompareExportDisclosure
                disabled={!(chainPayload.rows.length || selectedChain)}
                onExport={exportRows}
              />
              <div className="compare-table-scroll">
                <table className="detail-table" aria-label="STIG chain summary">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Benchmark</th>
                      <th>CCIs</th>
                      <th>NIST controls</th>
                      <th>Unmapped CCIs</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chainPayload.rows.map((row: any) => (
                      <tr
                        className={
                          state.chainItem === row.node_id ||
                          state.chainItem === row.item_id
                            ? "active-row"
                            : ""
                        }
                        key={row.node_id}
                      >
                        <td data-label="Item">
                          <strong>{row.item_id}</strong>
                          <br />
                          <span className="muted">{row.title}</span>
                        </td>
                        <td data-label="Benchmark">{row.benchmark_title}</td>
                        <td data-label="CCIs">{row.cci_count}</td>
                        <td data-label="NIST controls">{row.nist_control_count}</td>
                        <td data-label="Unmapped CCIs">{row.unmapped_cci_count}</td>
                        <td data-label="Action">
                          <Button
                            variant="secondary"
                            onClick={() =>
                              onNavigate("matrix", {
                                crosswalk,
                                chainItem: row.node_id,
                              })
                            }
                            type="button"
                          >
                            View mapping trace
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {selectedChain ? (
                <CompareResultsPanel
                  bundle={bundle}
                  compareView={compareView}
                  graph={compareGraph}
                  listContent={
                    <section className="stack">
                      <PageHeader
                        eyebrow="Selected chain"
                        summary="Follow the public links from the DISA item through CCI to NIST controls."
                        title={`${selectedChain.source_node.metadata?.item_id || selectedChain.source_node.id} — ${selectedChain.source_node.metadata?.title || selectedChain.source_node.label}`}
                      />
                      <div className="chain-grid">
                        <SummaryCard title="CCI links">
                          <ul className="source-ref-list">
                            {selectedChain.cci_entries.length ? (
                              selectedChain.cci_entries.map((entry: any) => (
                                <ChainRelationshipItem
                                  key={entry.cciNode.id}
                                  node={entry.cciNode}
                                  onOpenNode={onOpenNode}
                                  relationshipEdge={entry.relationshipEdge}
                                  sourceRefs={entry.sourceRefs}
                                />
                              ))
                            ) : (
                              <li>No CCI links.</li>
                            )}
                          </ul>
                        </SummaryCard>
                        <SummaryCard title="NIST controls">
                          <ul className="source-ref-list">
                            {selectedChain.nist_entries.length ? (
                              selectedChain.nist_entries.map((entry: any) => (
                                <ChainRelationshipItem
                                  key={entry.nistNode.id}
                                  node={entry.nistNode}
                                  onOpenNode={onOpenNode}
                                  relationshipEdge={entry.relationshipEdge}
                                  sourceRefs={entry.sourceRefs}
                                />
                              ))
                            ) : (
                              <li>
                                No NIST controls reached from this visible
                                chain.
                              </li>
                            )}
                          </ul>
                        </SummaryCard>
                        <Accordion.Root
                          className="accordion-root"
                          collapsible
                          type="single"
                        >
                          <DisclosurePanel
                            title="Unmapped CCIs"
                            value="unmapped-ccis"
                          >
                            <ul className="source-ref-list">
                              {selectedChain.unmapped_cci_nodes.length ? (
                                selectedChain.unmapped_cci_nodes.map(
                                  (node: any) => (
                                    <li
                                      className="chain-link-item"
                                      key={node.id}
                                    >
                                      <RecordLink
                                        className="link-action"
                                        nodeId={node.id}
                                        onOpenNode={onOpenNode}
                                      >
                                        <strong>
                                          {node.metadata?.item_id || node.id}
                                        </strong>{" "}
                                        — {node.metadata?.title || node.label}
                                      </RecordLink>
                                    </li>
                                  ),
                                )
                              ) : (
                                <li>
                                  Every visible CCI has a visible NIST link.
                                </li>
                              )}
                            </ul>
                          </DisclosurePanel>
                        </Accordion.Root>
                      </div>
                    </section>
                  }
                  matrixCrosswalk={crosswalk}
                  onExport={exportRows}
                  onNavigate={onNavigate}
                  onOpenNode={onOpenNode}
                />
              ) : null}
            </div>
          ) : (
            <section className="empty-state">
              <h2>No public chain results yet</h2>
              <p>
                Try a different catalog or remove the item filter to widen the
                visible chain.
              </p>
            </section>
          )}
        </>
      ) : null}

      {crosswalk === "threat-chain" ? (
        <>
          <p className="notice-inline" role="note">
            ATT&CK ICS coverage is still partial in the public map. A missing
            ICS technique link is not proof that no control relationship exists.{" "}
            <AppLink
              className="text-link"
              onNavigate={onNavigate}
              view="sources"
            >
              Review sources
            </AppLink>
          </p>
          <WorkbenchControlSurface
            className="compare-control-surface"
            label="Choose threat-chain inputs"
            targetId="compare-workspace"
          >
            <div className="filter-grid">
            <SelectField
              emptyLabel="All ATT&CK domains"
              label="ATT&CK domain"
              onChange={(value) =>
                onNavigate("matrix", {
                  crosswalk,
                  chainCatalog: value,
                  chainItem: "",
                })
              }
              options={[
                { value: "mitre-attack", label: "Enterprise ATT&CK" },
                { value: "mitre-attack-ics", label: "ICS ATT&CK" },
              ]}
              value={state.chainCatalog}
            />
            <SelectField
              emptyLabel="All visible techniques"
              label="ATT&CK technique"
              onChange={(value) =>
                onNavigate("matrix", {
                  crosswalk,
                  chainItem: value,
                })
              }
              options={chainCatalogNodes.map((node: any) => ({
                value: node.id,
                label: `${node.metadata?.item_id || node.id} - ${node.metadata?.title || node.label}`,
              }))}
              value={state.chainItem}
            />
            <Field label="Show inferred mappings">
              <label className="checkbox-field">
                <input
                  checked={state.includeCandidates === "true"}
                  onChange={(event) =>
                    onNavigate("matrix", {
                      crosswalk,
                      includeCandidates: event.target.checked ? "true" : "",
                    })
                  }
                  type="checkbox"
                />
                <span>Include candidate and inferred links</span>
              </label>
            </Field>
            </div>
            <p className="compare-legend">
              Published mappings come from MITRE. Pick a technique, review
              D3FEND countermeasures, then open the related NIST controls.
              {threatChainPayload?.rows?.length
                ? ` ${threatChainPayload.rows.length} ATT&CK technique${threatChainPayload.rows.length === 1 ? "" : "s"} visible in the current threat chain scope.`
                : ""}
            </p>
          </WorkbenchControlSurface>
          {threatChainPayload?.rows?.length ? (
            <div className="stack">
              <CompareExportDisclosure
                disabled={
                  !(threatChainPayload.rows.length || selectedThreatChain)
                }
                onExport={exportRows}
              />
              {!selectedThreatChain ? (
                <div className="compare-table-scroll">
                  <table
                    className="detail-table"
                    aria-label="Threat chain summary"
                  >
                    <thead>
                      <tr>
                        <th>Technique</th>
                        <th>Domain</th>
                        <th>D3FEND countermeasures</th>
                        <th>NIST controls</th>
                        <th>Unmapped D3FEND</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {threatChainPayload.rows.map((row: any) => (
                        <tr
                          className={
                            state.chainItem === row.node_id ||
                            state.chainItem === row.item_id
                              ? "active-row"
                              : ""
                          }
                          key={row.node_id}
                        >
                          <td data-label="Technique">
                            <strong>{row.item_id}</strong>
                            <br />
                            <span className="muted">{row.title}</span>
                          </td>
                          <td data-label="Domain">{row.domain}</td>
                          <td data-label="D3FEND countermeasures">{row.d3fend_count}</td>
                          <td data-label="NIST controls">{row.nist_control_count}</td>
                          <td data-label="Unmapped D3FEND">{row.unmapped_d3fend_count}</td>
                          <td data-label="Action">
                            <Button
                              variant="secondary"
                              onClick={() =>
                                onNavigate("matrix", {
                                  crosswalk,
                                  chainItem: row.node_id,
                                })
                              }
                              type="button"
                            >
                              Trace this technique
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              {selectedThreatChain ? (
                <CompareResultsPanel
                  bundle={bundle}
                  compareView={compareView}
                  graph={compareGraph}
                  listContent={
                    <section className="stack">
                      <PageHeader
                        eyebrow="Selected threat chain"
                        summary="Follow the public links from the ATT&CK technique through D3FEND countermeasures to NIST controls."
                        title={`${selectedThreatChain.source_node.metadata?.item_id || selectedThreatChain.source_node.id} — ${selectedThreatChain.source_node.metadata?.title || selectedThreatChain.source_node.label}`}
                      />
                      <div className="chain-grid">
                        <SummaryCard title="D3FEND countermeasures">
                          <ul className="source-ref-list">
                            {selectedThreatChain.d3fend_entries.length ? (
                              selectedThreatChain.d3fend_entries.map(
                                (entry: any) => (
                                  <ChainRelationshipItem
                                    key={entry.d3fendNode.id}
                                    node={entry.d3fendNode}
                                    onOpenNode={onOpenNode}
                                    relationshipEdge={entry.relationshipEdge}
                                    sourceRefs={entry.sourceRefs}
                                  />
                                ),
                              )
                            ) : (
                              <li>
                                No D3FEND countermeasures linked to this
                                technique yet.
                              </li>
                            )}
                          </ul>
                        </SummaryCard>
                        <SummaryCard title="NIST controls">
                          <ul className="source-ref-list">
                            {selectedThreatChain.nist_entries.length ? (
                              selectedThreatChain.nist_entries.map(
                                (entry: any) => (
                                  <ChainRelationshipItem
                                    key={entry.nistNode.id}
                                    node={entry.nistNode}
                                    onOpenNode={onOpenNode}
                                    relationshipEdge={entry.relationshipEdge}
                                    sourceRefs={entry.sourceRefs}
                                  />
                                ),
                              )
                            ) : (
                              <li>
                                No NIST controls reached from the visible D3FEND
                                links.
                              </li>
                            )}
                          </ul>
                        </SummaryCard>
                        <Accordion.Root
                          className="accordion-root"
                          collapsible
                          type="single"
                        >
                          <DisclosurePanel
                            title="Unmapped D3FEND countermeasures"
                            value="unmapped-d3fend"
                          >
                            <ul className="source-ref-list">
                              {selectedThreatChain.unmapped_d3fend_nodes
                                .length ? (
                                selectedThreatChain.unmapped_d3fend_nodes.map(
                                  (node: any) => (
                                    <li
                                      className="chain-link-item"
                                      key={node.id}
                                    >
                                      <RecordLink
                                        className="link-action"
                                        nodeId={node.id}
                                        onOpenNode={onOpenNode}
                                      >
                                        <strong>
                                          {node.metadata?.item_id || node.id}
                                        </strong>{" "}
                                        — {node.metadata?.title || node.label}
                                      </RecordLink>
                                    </li>
                                  ),
                                )
                              ) : (
                                <li>
                                  Every visible D3FEND countermeasure has a
                                  visible NIST link.
                                </li>
                              )}
                            </ul>
                          </DisclosurePanel>
                        </Accordion.Root>
                      </div>
                    </section>
                  }
                  matrixCrosswalk={crosswalk}
                  onExport={exportRows}
                  onNavigate={onNavigate}
                  onOpenNode={onOpenNode}
                />
              ) : null}
            </div>
          ) : (
            <section className="empty-state">
              <h2>No public threat chain results yet</h2>
              <p>
                Try a different ATT&CK domain or remove the technique filter to
                widen the visible chain.
              </p>
            </section>
          )}
        </>
      ) : null}

      {crosswalk === "baseline-compare" ? (
        <>
          <WorkbenchControlSurface
            className="compare-control-surface"
            label="Choose published baselines to compare"
            targetId="compare-workspace"
          >
            <div className="filter-grid">
              <SelectField
                label="Baseline A"
                onChange={(value) =>
                  onNavigate("matrix", {
                    crosswalk,
                    baselineA: value,
                  })
                }
                options={baselineOptions}
                value={state.baselineA}
              />
              <SelectField
                label="Baseline B"
                onChange={(value) =>
                  onNavigate("matrix", {
                    crosswalk,
                    baselineB: value,
                  })
                }
                options={baselineOptions}
                value={state.baselineB}
              />
            </div>
          </WorkbenchControlSurface>
          {baselineComparison ? (
            <>
              {baselineComparison.baseline_a_source ? (
                <p className="baseline-source-summary">
                  Baseline A:{" "}
                  {baselineComparison.baseline_a?.metadata?.item_id ||
                    baselineComparison.baseline_a?.id}
                  {" — "}
                  {baselineComparison.baseline_a?.metadata?.title ||
                    baselineComparison.baseline_a?.label}
                  {" ("}
                  {baselineComparison.baseline_a_source.display_name ||
                    baselineComparison.baseline_a_source.name}
                  {baselineComparison.baseline_a_source.version
                    ? ` v${baselineComparison.baseline_a_source.version}`
                    : ""}
                  )
                </p>
              ) : null}
              {baselineComparison.baseline_b_source ? (
                <p className="baseline-source-summary">
                  Baseline B:{" "}
                  {baselineComparison.baseline_b?.metadata?.item_id ||
                    baselineComparison.baseline_b?.id}
                  {" — "}
                  {baselineComparison.baseline_b?.metadata?.title ||
                    baselineComparison.baseline_b?.label}
                  {" ("}
                  {baselineComparison.baseline_b_source.display_name ||
                    baselineComparison.baseline_b_source.name}
                  {baselineComparison.baseline_b_source.version
                    ? ` v${baselineComparison.baseline_b_source.version}`
                    : ""}
                  )
                </p>
              ) : null}
              <CompareResultsPanel
                bundle={bundle}
                compareView={compareView}
                graph={compareGraph}
                listContent={
                  <div className="chain-grid">
                    <BaselineControlSection
                      controls={baselineComparison.shared}
                      onOpenNode={onOpenNode}
                      title="Shared controls"
                    />
                    <BaselineControlSection
                      controls={baselineComparison.only_a}
                      onOpenNode={onOpenNode}
                      title="Only in A"
                    />
                    <BaselineControlSection
                      controls={baselineComparison.only_b}
                      onOpenNode={onOpenNode}
                      title="Only in B"
                    />
                  </div>
                }
                matrixCrosswalk={crosswalk}
                onExport={exportRows}
                onNavigate={onNavigate}
                onOpenNode={onOpenNode}
              />
            </>
          ) : (
            <section className="empty-state">
              <h2>Choose two distinct baselines</h2>
              <p>The summary appears once both baselines are selected.</p>
            </section>
          )}
        </>
      ) : null}
    </Panel>
  );
}
