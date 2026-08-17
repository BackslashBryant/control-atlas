import * as Accordion from "@radix-ui/react-accordion";
import {
  IconFilter,
} from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import { aggregateRelationshipRows } from "../../app/runtime.mjs";
import { SITE_COPY } from "../../shared/site-copy.mjs";
import { CompareResultsPanel } from "../components/CompareResultsPanel";
import { CatalogVersionChip } from "../components/CatalogVersionChip";
import {
  useCatalogCoverage,
} from "../components/CatalogCoverageNotice";
import {
  parseCatalogItemIds,
  ProvenanceBadge,
  SourceRefList,
} from "../lib/compareHelpers";
import { buildCrosswalkCompareGraph } from "../lib/buildCompareGraph";
import {
  activateCompareMode,
  compareConfigurationReady,
  compareModeForState,
  getCompareCurrentStep,
  getCompareSteps,
  COMPARE_MODES,
  nextMissingCompareInput,
  resolveMappingSource,
} from "../lib/compareModeState";
import {
  Field,
  PageHeader,
  SelectField,
  StepIndicator,
  WorkbenchControlSurface,
} from "../lib/pagePrimitives";
import {
  filterDependentOptions,
} from "../lib/stateContract";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { CompareCrosswalk, ViewState } from "../lib/viewState";
import { Button, Panel } from "../components/lsm";
import { AppLink } from "../components/AppLink";
import { TaxonomyTagLinks } from "../components/ContextualTaxonomyLinks";

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
  const fromTags = row.from_taxonomy_tags || [];
  const toTags = (row.targets ? row.targets.flatMap((t: any) => t.to_taxonomy_tags || []) : (row.to_taxonomy_tags || []));
  return [
    ...fromTags.map((tag: any) => tag.id || tag),
    ...toTags.map((tag: any) => tag.id || tag),
  ].filter(Boolean);
}

function formatMissingCompareInput(input: string): string {
  switch (input) {
    case "source":
      return "a primary publication";
    case "target":
      return "a target publication";
    case "items":
      return "a specific control or rule";
    default:
      return input || "required fields";
  }
}

function DisclosurePanel(props: {
  value: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Accordion.Item className="disclosure-item" value={props.value}>
      <Accordion.Header className="disclosure-header">
        <Accordion.Trigger className="disclosure-trigger">
          <span className="disclosure-chevron" aria-hidden="true">▾</span>
          <span>{props.title}</span>
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="disclosure-content">
        {props.children}
      </Accordion.Content>
    </Accordion.Item>
  );
}export function ComparePage(props: {
  bundle: RuntimeBundle;
  state: Extract<ViewState, { view: "matrix" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNode: (nodeId: string) => void;
}) {
  const { bundle, state, onNavigate, onOpenNode } = props;
  const [relationshipPage, setRelationshipPage] = useState(1);
  const compareResultsRef = useRef<HTMLElement | null>(null);

  const catalogs = bundle.runtime.getCatalogs();
  const catalogCoverageList = useCatalogCoverage(bundle);

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
    if (!catalogId) return null;
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

  const crosswalk: CompareCrosswalk =
    state.crosswalk === "relationships" || state.source || state.target || state.intent === "item-mapping" || state.intent === "frameworks"
      ? "relationships"
      : state.crosswalk || "intent";

  const currentMode = compareModeForState(state);
  const modeSteps = currentMode ? getCompareSteps(currentMode.id) : [];
  const currentStepNumber = currentMode ? getCompareCurrentStep(currentMode.id, state) : 1;

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

  const aggregatedRelationshipRows = useMemo(() => {
    if (!relationshipRows?.rows) return [];
    return aggregateRelationshipRows(relationshipRows.rows);
  }, [relationshipRows]);

  const hasComparisonScope = Boolean(
    (state.source && state.target) || state.items,
  );

  const relationshipPageSize = 25;
  const relationshipPageCount = Math.max(
    1,
    Math.ceil(aggregatedRelationshipRows.length / relationshipPageSize),
  );
  const visibleAggregatedRows = aggregatedRelationshipRows.slice(
    (relationshipPage - 1) * relationshipPageSize,
    relationshipPage * relationshipPageSize,
  );

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

  const compareView = state.compareView === "map" ? "map" : "list";

  const compareGraph = useMemo(
    () =>
      buildCrosswalkCompareGraph({
        crosswalk,
        relationshipRows,
        sourceCatalog: state.source,
        targetCatalog: state.target,
      }),
    [
      crosswalk,
      relationshipRows,
      state.source,
      state.target,
    ],
  );

  const comparisonCards: Array<{
    id: (typeof COMPARE_MODES)[number]["id"];
    title: string;
    body: string;
    badge?: string;
    crosswalk: CompareCrosswalk;
  }> = [
    {
      id: "frameworks",
      title: "Catalog to catalog",
      body: "See how two frameworks line up, based on published mappings.",
      badge: `${catalogsWithValidTarget.size} comparable frameworks`,
      crosswalk: "relationships",
    },
    {
      id: "item-mapping",
      title: "Find what maps to this item",
      body: "Trace a known control or rule identifier across connected frameworks.",
      badge: "Item identifier search",
      crosswalk: "relationships",
    },
  ];

  function exportRows(format: "csv" | "markdown" | "json") {
    if (crosswalk === "relationships" && relationshipRows) {
      const content = bundle.runtime.exportRelationshipRows(
        aggregatedRelationshipRows.length ? aggregatedRelationshipRows : relationshipRows.rows,
        format,
      );
      const extension = format === "markdown" ? "md" : format;
      downloadTextFile(
        `control-atlas-compare.${extension}`,
        content,
        format === "json" ? "application/json" : "text/plain",
      );
    }
  }

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
                {card.badge ? (
                  <span className="intent-card-action-hint">{card.badge}</span>
                ) : null}
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
                comparisonCards.find((card) => card.crosswalk === crosswalk)?.title ||
                "Catalog to catalog"}
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

      {crosswalk !== "intent" && modeSteps.length > 0 ? (
        <StepIndicator
          currentStep={currentStepNumber}
          steps={modeSteps.map((step) => ({
            id: step.id,
            label: step.label,
            description: step.description,
          }))}
        />
      ) : null}

      {crosswalk === "relationships" ? (
        <>
          <WorkbenchControlSurface
            className="compare-controls"
            label="Configure comparison"
            targetId="compare-workspace"
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
                  options={filterDependentOptions(connectedTargetOptions, (opt) => opt.value !== state.source)}
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
                Select {formatMissingCompareInput(missingCompareInput)} to view published mappings.
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

          {state.compareRun === "true" && aggregatedRelationshipRows.length ? (
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
                        {aggregatedRelationshipRows.length.toLocaleString()} source record
                        {aggregatedRelationshipRows.length === 1 ? "" : "s"} ({relationshipRows.rows.length.toLocaleString()} total connection
                        {relationshipRows.rows.length === 1 ? "" : "s"})
                      </span>
                    </h3>
                    <p aria-live="polite" className="field-hint compare-range">
                      Showing {(relationshipPage - 1) * relationshipPageSize + 1}
                      –{Math.min(relationshipPage * relationshipPageSize, aggregatedRelationshipRows.length)} of {aggregatedRelationshipRows.length.toLocaleString()} source records
                    </p>
                    <div className="compare-table-scroll">
                      <table
                        aria-label="Relationship mappings"
                        className="detail-table"
                      >
                        <thead>
                          <tr>
                            <th scope="col">From</th>
                            <th scope="col">Mapped target items</th>
                            <th scope="col">Connection types</th>
                            <th scope="col">Source basis</th>
                            <th scope="col">Evidence & Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleAggregatedRows.map((row: any) => {
                            const distinctTypes = [...new Set(row.targets.map((t: any) => t.relationship_type))];
                            const distinctProvenances = [...new Set(row.targets.map((t: any) => t.provenance_class))];
                            return (
                              <tr key={row.from_id || row.from_item_id}>
                                <td data-label="From">
                                  <strong>{row.from_item_id}</strong>
                                  <br />
                                  <span className="muted">{row.from_title}</span>
                                </td>
                                <td data-label="Mapped target items">
                                  <ul className="target-mapping-list">
                                    {row.targets.map((t: any) => (
                                      <li className="target-mapping-item" key={t.edge_id || `${row.from_id}-${t.to_id}`}>
                                        <div className="target-mapping-header">
                                          <strong>{t.to_item_id}</strong>
                                          <span className="target-mapping-chip">
                                            {displayNameFor("relationship_type", t.relationship_type)}
                                          </span>
                                        </div>
                                        <span className="target-item-title">{t.to_title}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </td>
                                <td data-label="Connection types">
                                  <div className="badge-row">
                                    {distinctTypes.map((type: any) => (
                                      <span className="badge" key={type}>
                                        {displayNameFor("relationship_type", type)}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td data-label="Source basis">
                                  <div className="badge-row">
                                    {distinctProvenances.map((prov: any) => (
                                      <ProvenanceBadge
                                        key={prov}
                                        provenanceClass={prov}
                                        publicationStatus="published"
                                      />
                                    ))}
                                  </div>
                                </td>
                                <td data-label="Evidence & Details">
                                  <details className="mapping-row-details">
                                    <summary>View evidence ({row.targets.length})</summary>
                                    <div className="stack">
                                      {row.targets.map((t: any, idx: number) => (
                                        <div className="target-evidence-block" key={t.edge_id || idx}>
                                          <p><strong>{t.to_item_id}</strong> ({displayNameFor("relationship_type", t.relationship_type)})</p>
                                          <dl>
                                            <div><dt>Trust level</dt><dd>{displayNameFor("confidence", t.confidence)}</dd></div>
                                            <div><dt>Official rationale</dt><dd>{t.rationale || "No public rationale recorded."}</dd></div>
                                            <div><dt>{t.navigation_note ? "Navigation note" : "Relationship explanation"}</dt><dd>{t.navigation_note || "No product-authored navigation note."}</dd></div>
                                            <div><dt>Source references</dt><dd><SourceRefList refs={t.source_refs} /></dd></div>
                                          </dl>
                                        </div>
                                      ))}
                                      {relationshipTagIds(row).length ? (
                                        <div>
                                          <dt>Governed record tags</dt>
                                          <dd>
                                            <TaxonomyTagLinks
                                              onNavigate={onNavigate}
                                              tagIds={relationshipTagIds(row)}
                                            />
                                          </dd>
                                        </div>
                                      ) : null}
                                    </div>
                                  </details>
                                </td>
                              </tr>
                            );
                          })}
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
                  ? "Pick Publication A and Publication B above to compare this item against, or try a different comparison type below."
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
    </Panel>
  );
}
