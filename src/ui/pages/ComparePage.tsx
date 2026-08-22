import * as Accordion from "@radix-ui/react-accordion";
import { useEffect, useId, useMemo, useState } from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import { aggregateRelationshipRows } from "../../app/runtime.mjs";
import { SITE_COPY } from "../../shared/site-copy.mjs";
import { Button } from "../components/lsm";
import { RecordLink } from "../components/RecordLink";
import { parseCatalogItemIds, SourceRefList } from "../lib/compareHelpers";
import {
  buildCompareExportData,
  COMPARE_EXPORT_MIME_TYPES,
  compareExportToCsv,
  compareExportToXlsx,
  countCompareMappings,
  filterCompareRows,
} from "../lib/compareExport";
import {
  activateCompareMode,
  getCompareCurrentStep,
  getCompareSteps,
  resolveMappingSource,
  type CompareModeId,
} from "../lib/compareModeState";
import {
  Field,
  MissionPage,
  PageHeader,
  SelectField,
  StepIndicator,
} from "../lib/pagePrimitives";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";

type CompareState = Extract<ViewState, { view: "matrix" }>;
type SelectOption = { value: string; label: string };

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

function downloadBinaryFile(filename: string, content: Uint8Array, mimeType: string) {
  const bytes = content.buffer.slice(
    content.byteOffset,
    content.byteOffset + content.byteLength,
  ) as ArrayBuffer;
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Enough to show every connected publication without becoming a wall. */
const OPTION_LIST_LIMIT = 24;

function SearchablePublicationField(props: {
  label: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  value: string;
  /** Overrides the default count line so the page can relate its own totals. */
  hint?: string;
}) {
  const inputId = useId();
  const listId = `${inputId}-options`;
  const selectedLabel =
    props.options.find((option) => option.value === props.value)?.label || "";
  const [query, setQuery] = useState(selectedLabel);

  useEffect(() => {
    setQuery(selectedLabel);
  }, [selectedLabel]);

  const resolveValue = (candidate: string) =>
    props.options.find(
      (option) =>
        option.label.localeCompare(candidate, undefined, {
          sensitivity: "accent",
        }) === 0 || option.value === candidate,
    );

  const commit = (candidate: string) => {
    const match = resolveValue(candidate.trim());
    if (match && match.value !== props.value) props.onChange(match.value);
    return Boolean(match);
  };

  // While a choice is committed the query equals its label, so filtering on it
  // would collapse the list to the one already-chosen row.
  const needle = props.value && query === selectedLabel ? "" : query.trim().toLowerCase();
  const matches = needle
    ? props.options.filter((option) => option.label.toLowerCase().includes(needle))
    : props.options;
  const visibleOptions = matches.slice(0, OPTION_LIST_LIMIT);
  const hiddenCount = matches.length - visibleOptions.length;

  return (
    <>
    <Field label={props.label}>
      <input
        aria-autocomplete="list"
        autoComplete="off"
        id={inputId}
        list={listId}
        onBlur={() => {
          if (!query.trim()) {
            if (props.value) props.onChange("");
            return;
          }
          if (!commit(query)) setQuery(selectedLabel);
        }}
        onChange={(event) => {
          const nextQuery = event.target.value;
          setQuery(nextQuery);
          if (!nextQuery) {
            if (props.value) props.onChange("");
            return;
          }
          commit(nextQuery);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          if (commit(query)) event.preventDefault();
        }}
        placeholder={props.placeholder}
        type="search"
        value={query}
      />
      <datalist id={listId}>
        {props.options.map((option) => (
          <option key={option.value} value={option.label} />
        ))}
      </datalist>
      <p className="field-hint">
        {props.hint ||
          `Search ${props.options.length.toLocaleString()} publications with published crosswalks.`}
      </p>
    </Field>
      {/* A native datalist keeps every choice invisible until the user guesses
          a prefix. The first decision in the flow cannot be a guess, so the
          same options are also listed as real, clickable controls.
          These live outside <Field> on purpose: a <label> forwards any click
          inside it to its own control, which swallowed every option click. */}
      <ul className="compare-option-list">
        {visibleOptions.map((option) => (
          <li key={option.value}>
            <button
              aria-pressed={option.value === props.value}
              className="compare-option"
              onClick={() => props.onChange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          </li>
        ))}
        {hiddenCount > 0 ? (
          <li>
            <span className="compare-option-list__note">
              {hiddenCount.toLocaleString()} more match your search
            </span>
          </li>
        ) : null}
      </ul>
      {visibleOptions.length === 0 ? (
        <p className="compare-option-list__note" role="status">
          No publication matches “{query.trim()}”. Clear the box to see all
          {" "}
          {props.options.length.toLocaleString()}.
        </p>
      ) : null}
    </>
  );
}

function catalogName(catalogs: any[], catalogId: string) {
  return catalogs.find((catalog) => catalog.id === catalogId)?.name || catalogId;
}

function CompareScopeRail(props: {
  connectedCount: number;
  mappingCount: number;
  mappingSourceCount: number;
  mode: CompareModeId;
  sourceLabel: string;
  targetLabel: string;
}) {
  if (!props.sourceLabel) {
    return (
      <aside className="compare-flow-support panel surface-blueprint">
        <span className="label">CURRENT SCOPE</span>
        <h2>Nothing selected yet</h2>
        <p>Only publications with a published crosswalk are available here.</p>
      </aside>
    );
  }

  return (
    <aside className="compare-flow-support panel surface-blueprint">
      <span className="label">CURRENT SCOPE</span>
      <dl className="compare-scope-list">
        <div>
          <dt>Source</dt>
          <dd>{props.sourceLabel}</dd>
        </div>
        {props.mode === "frameworks" && !props.targetLabel ? (
          <div>
            <dt>Available crosswalks</dt>
            <dd>
              {props.connectedCount.toLocaleString()} connected publication
              {props.connectedCount === 1 ? "" : "s"}
            </dd>
          </div>
        ) : null}
        {props.targetLabel ? (
          <div>
            <dt>Target</dt>
            <dd>{props.targetLabel}</dd>
          </div>
        ) : null}
        {props.mappingCount > 0 ? (
          <div>
            <dt>Published mappings</dt>
            <dd>{props.mappingCount.toLocaleString()}</dd>
          </div>
        ) : null}
        {props.mappingSourceCount > 0 ? (
          <div>
            <dt>Crosswalk evidence</dt>
            <dd>
              {props.mappingSourceCount.toLocaleString()} published source
              {props.mappingSourceCount === 1 ? "" : "s"}
            </dd>
          </div>
        ) : null}
      </dl>
    </aside>
  );
}

// Evidence content can be large (many source refs per mapping). Defer mounting
// the inner DOM until the user opens the disclosure so the initial render of
// a full crosswalk stays bounded — the summary label is always present, only
// the body is lazy.
function LazyEvidenceDetails({ targets }: { targets: any[] }) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="mapping-row-details"
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary>
        Evidence for {targets.length.toLocaleString()} mapping
        {targets.length === 1 ? "" : "s"}
      </summary>
      {open ? (
        <div className="mapping-evidence-list">
          {targets.map((target: any) => (
            <section
              aria-label={`Evidence for ${target.to_item_id}`}
              key={`evidence-${target.edge_id || target.to_id}`}
            >
              <strong>{target.to_item_id}</strong>
              <SourceRefList refs={target.source_refs} />
            </section>
          ))}
        </div>
      ) : null}
    </details>
  );
}

const COMPARE_PAGE_SIZE = 200;

export function ComparePage(props: {
  bundle: RuntimeBundle;
  state: CompareState;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNode: (nodeId: string) => void;
}) {
  const { bundle, state, onNavigate, onOpenNode } = props;
  const [resultQuery, setResultQuery] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(COMPARE_PAGE_SIZE);
  const catalogs = bundle.runtime.getCatalogs();
  const mode: CompareModeId =
    state.intent === "item-mapping" ? "item-mapping" : "frameworks";

  const publishedPairEntries = useMemo(
    () =>
      Object.entries(bundle.mappingSources || {}).filter(
        ([key, sources]) => key.includes("|") && sources.length > 0,
      ),
    [bundle.mappingSources],
  );

  const pairCount = useMemo(
    () =>
      new Set(
        publishedPairEntries.map(([key]) => key.split("|").sort().join("|")),
      ).size,
    [publishedPairEntries],
  );

  const sourceCatalogOptions = useMemo(() => {
    const sourceIds = new Set(
      publishedPairEntries.map(([key]) => key.split("|")[0]).filter(Boolean),
    );
    return catalogs
      .filter((catalog: any) => sourceIds.has(catalog.id))
      .sort((left: any, right: any) => left.name.localeCompare(right.name))
      .map((catalog: any) => ({ value: catalog.id, label: catalog.name }));
  }, [catalogs, publishedPairEntries]);

  const frameworkTargetOptions = useMemo(() => {
    if (!state.source) return [];
    const targetIds = new Set(
      publishedPairEntries
        .filter(([key]) => key.split("|")[0] === state.source)
        .map(([key]) => key.split("|")[1])
        .filter(Boolean),
    );
    return catalogs
      .filter((catalog: any) => targetIds.has(catalog.id))
      .sort((left: any, right: any) => left.name.localeCompare(right.name))
      .map((catalog: any) => ({ value: catalog.id, label: catalog.name }));
  }, [catalogs, publishedPairEntries, state.source]);

  const relationshipNodeIds = useMemo(
    () => parseCatalogItemIds(state.items, state.source),
    [state.items, state.source],
  );

  const specificTargetOptions = useMemo(() => {
    if (!state.source || !state.items.trim()) return [];
    return frameworkTargetOptions.filter((option) =>
      bundle.runtime.buildRelationshipRows({
        include_candidates: false,
        node_ids: relationshipNodeIds,
        source_catalog: state.source,
        target_catalog: option.value,
      }).rows.length > 0,
    );
  }, [
    bundle.runtime,
    frameworkTargetOptions,
    relationshipNodeIds,
    state.items,
    state.source,
  ]);

  const targetOptions =
    mode === "item-mapping" ? specificTargetOptions : frameworkTargetOptions;

  const pairRelationshipRows = useMemo(() => {
    if (!state.source || !state.target) return null;
    return bundle.runtime.buildRelationshipRows({
      include_candidates: false,
      node_ids: mode === "item-mapping" ? relationshipNodeIds : [],
      source_catalog: state.source,
      target_catalog: state.target,
    });
  }, [
    bundle.runtime,
    mode,
    relationshipNodeIds,
    state.source,
    state.target,
  ]);

  const relationshipTypeOptions = useMemo(
    () =>
      [
        ...new Set<string>(
          (pairRelationshipRows?.rows || [])
            .map((row: any) => String(row.relationship_type || ""))
            .filter((value: string) => Boolean(value)),
        ),
      ]
        .sort()
        .map((value) => ({
          value,
          label: displayNameFor("relationship_type", value),
        })),
    [pairRelationshipRows],
  );

  const rawRelationshipRows = useMemo(() => {
    if (!pairRelationshipRows || !state.relationshipType) {
      return pairRelationshipRows;
    }
    return {
      ...pairRelationshipRows,
      rows: pairRelationshipRows.rows.filter(
        (row: any) => row.relationship_type === state.relationshipType,
      ),
    };
  }, [pairRelationshipRows, state.relationshipType]);

  const mappingSourceOptions = useMemo(() => {
    const sources = new Map<string, string>();
    for (const row of pairRelationshipRows?.rows || []) {
      for (const reference of row.source_refs || []) {
        const sourceId = reference.source_id || reference.sourceId;
        if (!sourceId) continue;
        const source = bundle.runtime.getSource(sourceId);
        sources.set(sourceId, source?.display_name || source?.name || sourceId);
      }
    }
    const runtimeOptions = [...sources.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((left, right) => left.label.localeCompare(right.label));
    if (runtimeOptions.length || !state.source || !state.target) {
      return runtimeOptions;
    }
    return [...(bundle.mappingSources?.[`${state.source}|${state.target}`] || [])]
      .map((option) => ({ value: option.value, label: option.label }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [
    bundle.mappingSources,
    bundle.runtime,
    pairRelationshipRows,
    state.source,
    state.target,
  ]);

  const mappingResolution = resolveMappingSource(
    mappingSourceOptions.map((option) => option.value),
    state.mappingSource,
  );
  const effectiveMappingSource =
    mappingResolution.status === "auto" ||
    mappingResolution.status === "filtered"
      ? mappingResolution.value
      : "";
  const relationshipRows = useMemo(() => {
    if (!rawRelationshipRows || !effectiveMappingSource) return rawRelationshipRows;
    return {
      ...rawRelationshipRows,
      rows: rawRelationshipRows.rows.filter((row: any) =>
        (row.source_refs || []).some(
          (reference: any) =>
            (reference.source_id || reference.sourceId) === effectiveMappingSource,
        ),
      ),
    };
  }, [effectiveMappingSource, rawRelationshipRows]);

  const aggregatedRelationshipRows = useMemo(
    () => aggregateRelationshipRows(relationshipRows?.rows || []),
    [relationshipRows],
  );
  const visibleAggregatedRows = useMemo(
    () => filterCompareRows(aggregatedRelationshipRows, resultQuery),
    [aggregatedRelationshipRows, resultQuery],
  );
  const filteredMappingCount = countCompareMappings(aggregatedRelationshipRows);
  const visibleMappingCount = countCompareMappings(visibleAggregatedRows);
  const pageRows = visibleAggregatedRows.slice(0, visibleLimit);
  const hasMoreRows = visibleAggregatedRows.length > visibleLimit;


  useEffect(() => {
    setResultQuery("");
    setVisibleLimit(COMPARE_PAGE_SIZE);
  }, [
    mode,
    state.items,
    state.mappingSource,
    state.relationshipType,
    state.source,
    state.target,
  ]);

  const sourceIsValid = sourceCatalogOptions.some(
    (option) => option.value === state.source,
  );
  const targetIsValid = targetOptions.some(
    (option) => option.value === state.target,
  );
  const itemIsReady = mode === "frameworks" || Boolean(state.items.trim());
  const comparisonReady =
    sourceIsValid &&
    targetIsValid &&
    itemIsReady &&
    mappingResolution.status !== "none" &&
    mappingResolution.status !== "invalid";
  const showResults = state.compareRun === "true" && comparisonReady;
  const currentStep = getCompareCurrentStep(mode, {
    ...state,
    compareRun: showResults ? "true" : "",
    intent: mode,
    source: sourceIsValid ? state.source : "",
    target: targetIsValid ? state.target : "",
  });
  const steps = getCompareSteps(mode);
  const sourceLabel = sourceIsValid
    ? catalogName(catalogs, state.source)
    : "";
  const targetLabel = targetIsValid
    ? catalogName(catalogs, state.target)
    : "";
  const sourceCatalog = catalogs.find((catalog: any) => catalog.id === state.source);
  const targetCatalog = catalogs.find((catalog: any) => catalog.id === state.target);

  const patchCompare = (patch: Partial<CompareState>) =>
    onNavigate("matrix", {
      crosswalk: "relationships",
      intent: mode,
      ...patch,
    });

  const changeMode = (nextMode: CompareModeId) => {
    if (nextMode === mode && state.intent === nextMode) return;
    onNavigate("matrix", activateCompareMode(nextMode));
  };

  const selectSource = (source: string) => {
    patchCompare({
      compareRun: "",
      items: "",
      mappingSource: "",
      relationshipType: "",
      source,
      target: "",
    });
  };

  const resetToSource = () => {
    patchCompare({
      compareRun: "",
      items: "",
      mappingSource: "",
      relationshipType: "",
      source: "",
      target: "",
    });
  };

  const exportRows = async (format: "csv" | "xlsx") => {
    if (!sourceCatalog || !targetCatalog || !visibleAggregatedRows.length) return;
    const exportData = buildCompareExportData({
      buildLabel:
        import.meta.env.VITE_CONTROL_ATLAS_RELEASE_DATE ||
        "local development build",
      generatedAt: new Date().toISOString(),
      resolveSource: (sourceId) => bundle.runtime.getSource(sourceId),
      rows: visibleAggregatedRows,
      sourceCatalog,
      targetCatalog,
    });
    if (format === "csv") {
      downloadTextFile(
        "control-atlas-crosswalk.csv",
        compareExportToCsv(exportData),
        COMPARE_EXPORT_MIME_TYPES.csv,
      );
      return;
    }
    downloadBinaryFile(
      "control-atlas-crosswalk.xlsx",
      await compareExportToXlsx(exportData),
      COMPARE_EXPORT_MIME_TYPES.xlsx,
    );
  };

  const singleMappingSource = mappingSourceOptions.length === 1
    ? mappingSourceOptions[0]
    : null;

  return (
    <MissionPage
      className="compare-page flow-shell"
      data-visual-identity="staged-crosswalk-flow"
      id="compare-workspace"
      maxWidth="workspace"
    >
      <PageHeader
        eyebrow={`PUBLISHED CROSSWALKS / ${sourceCatalogOptions.length.toLocaleString()} CONNECTED PUBLICATIONS`}
        primary
        summary={SITE_COPY.routes.compare.purpose}
        title={SITE_COPY.routes.compare.title}
      />

      <div aria-label="Comparison mode" className="compare-mode-tabs" role="tablist">
        {[
          { id: "frameworks" as const, label: "Frameworks" },
          { id: "item-mapping" as const, label: "Specific item" },
        ].map((entry) => (
          <button
            aria-selected={mode === entry.id}
            className="compare-mode-tab"
            key={entry.id}
            onClick={() => changeMode(entry.id)}
            role="tab"
            type="button"
          >
            {entry.label}
          </button>
        ))}
      </div>

      <StepIndicator currentStep={currentStep} steps={[...steps]} />

      <section className="compare-flow-grid">
        <section
          aria-labelledby="compare-active-step"
          className="compare-flow-task panel"
        >
          {!showResults && currentStep === 1 ? (
            <>
              <span className="label">
                01 / {mode === "item-mapping" ? "ITEM" : "SOURCE"}
              </span>
              <h2 id="compare-active-step">
                {mode === "item-mapping"
                  ? "Choose an item"
                  : "Choose a framework"}
              </h2>
              <div className="compare-step-fields">
                <SearchablePublicationField
                  label="Publication"
                  onChange={selectSource}
                  hint={`${sourceCatalogOptions.length.toLocaleString()} publications are connected by ${pairCount.toLocaleString()} published crosswalks.`}
                  options={sourceCatalogOptions}
                  placeholder="Search published frameworks"
                  value={sourceIsValid ? state.source : ""}
                />
                {mode === "item-mapping" ? (
                  <Field label="Control / requirement / rule">
                    <input
                      onChange={(event) =>
                        patchCompare({
                          compareRun: "",
                          items: event.target.value,
                          mappingSource: "",
                          target: "",
                        })
                      }
                      placeholder="For example, AC-2"
                      value={state.items}
                    />
                    <p className="field-hint">
                      Enter the exact publisher identifier.
                    </p>
                  </Field>
                ) : null}
              </div>
            </>
          ) : null}

          {!showResults && currentStep === 2 ? (
            <>
              <span className="label">02 / TARGET</span>
              <h2 id="compare-active-step">Choose a framework to compare with</h2>
              <p className="compare-preserved-context">
                <span>Source</span>
                <strong>{sourceLabel}</strong>
                {mode === "item-mapping" ? <code>{state.items}</code> : null}
              </p>
              <SelectField
                emptyLabel="Choose a connected publication"
                label="Target publication"
                onChange={(target) =>
                  patchCompare({
                    compareRun: "",
                    mappingSource: "",
                    relationshipType: "",
                    target,
                  })
                }
                options={targetOptions}
                value={targetIsValid ? state.target : ""}
              />
              {mode === "item-mapping" && !targetOptions.length ? (
                <p className="generation-status tone-warning" role="status">
                  No published item mapping is available for that identifier.
                </p>
              ) : null}
              <div className="actions compare-step-actions">
                <Button onClick={resetToSource} type="button" variant="secondary">
                  Change source
                </Button>
                <Button
                  disabled={!comparisonReady}
                  onClick={() => patchCompare({ compareRun: "true" })}
                  type="button"
                  variant="primary"
                >
                  Show published mappings
                </Button>
              </div>
            </>
          ) : null}

          {showResults ? (
            <section
              className="compare-results-panel"
              data-control-results
              data-continuous-results
              id="compare-results"
            >
              <header className="compare-results-head">
                <div>
                  <span className="label">03 / RESULTS</span>
                  <h2 id="compare-active-step">
                    {sourceLabel} <span aria-hidden="true">↔</span>{" "}
                    {targetLabel}
                  </h2>
                </div>
                <Button
                  onClick={() => patchCompare({ compareRun: "" })}
                  type="button"
                  variant="secondary"
                >
                  Change target
                </Button>
              </header>

              {singleMappingSource ? (
                <p className="compare-crosswalk-source">
                  <span>Crosswalk source</span>
                  <strong>{singleMappingSource.label}</strong>
                </p>
              ) : mappingSourceOptions.length > 1 ? (
                <div className="compare-crosswalk-filter">
                  <SelectField
                    emptyLabel="All published sources"
                    label="Crosswalk source"
                    onChange={(mappingSource) => patchCompare({ mappingSource })}
                    options={mappingSourceOptions}
                    value={
                      mappingResolution.status === "filtered"
                        ? state.mappingSource
                        : ""
                    }
                  />
                </div>
              ) : null}

              <div className="compare-refine-fields compare-results-toolbar">
                <Field label="Search results by ID or title">
                  <input
                    onChange={(event) => setResultQuery(event.target.value)}
                    placeholder="Search source or target IDs and titles"
                    type="search"
                    value={resultQuery}
                  />
                </Field>
                <div className="compare-export-actions">
                  <span className="field-label">Export crosswalk</span>
                  <div className="actions">
                    <Button
                      disabled={!visibleMappingCount}
                      onClick={() => exportRows("csv")}
                      type="button"
                      variant="secondary"
                    >
                      CSV
                    </Button>
                    <Button
                      disabled={!visibleMappingCount}
                      onClick={() => exportRows("xlsx")}
                      type="button"
                      variant="primary"
                    >
                      Excel workbook
                    </Button>
                  </div>
                  <small>Includes every row matching the current filters and search.</small>
                </div>
              </div>

              <p aria-live="polite" className="compare-mapping-total" role="status">
                {resultQuery.trim()
                  ? `${visibleMappingCount.toLocaleString()} of ${filteredMappingCount.toLocaleString()} published mappings match`
                  : `${visibleMappingCount.toLocaleString()} published mapping${visibleMappingCount === 1 ? "" : "s"} across ${visibleAggregatedRows.length.toLocaleString()} source record${visibleAggregatedRows.length === 1 ? "" : "s"}`}
              </p>

              {visibleAggregatedRows.length ? (
                <>
                  <div className="compare-table-scroll" data-continuous-scroll>
                    <table
                      aria-label="Published crosswalk mappings"
                      className="detail-table compare-results-table"
                    >
                      <thead>
                        <tr>
                          <th scope="col">From</th>
                          <th scope="col">Maps to</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageRows.map((row: any) => (
                          <tr key={row.from_id || row.from_item_id}>
                            <td data-label="From">
                              <RecordLink nodeId={row.from_id} onOpenNode={onOpenNode}>
                                <strong>{row.from_item_id}</strong>
                              </RecordLink>
                              <span className="compare-record-title">{row.from_title}</span>
                            </td>
                            <td data-label="Maps to">
                              <ul className="target-mapping-list">
                                {row.targets.map((target: any) => (
                                  <li
                                    className="target-mapping-item"
                                    key={target.edge_id || `${row.from_id}-${target.to_id}`}
                                  >
                                    <div>
                                      <RecordLink nodeId={target.to_id} onOpenNode={onOpenNode}>
                                        <strong>{target.to_item_id}</strong>
                                      </RecordLink>
                                      <span className="target-item-title">{target.to_title}</span>
                                    </div>
                                    {target.relationship_type && target.relationship_type !== "maps_to" ? (
                                      <span className="target-mapping-relationship">
                                        {displayNameFor("relationship_type", target.relationship_type)}
                                      </span>
                                    ) : null}
                                  </li>
                                ))}
                              </ul>
                              <LazyEvidenceDetails targets={row.targets} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {hasMoreRows ? (
                    <div className="compare-show-more">
                      <p className="compare-show-more-caption">
                        Showing {visibleLimit.toLocaleString()} of {visibleAggregatedRows.length.toLocaleString()} source records.
                        Use the export options above for the complete set.
                      </p>
                      <Button
                        onClick={() =>
                          setVisibleLimit((n) =>
                            Math.min(n + COMPARE_PAGE_SIZE, visibleAggregatedRows.length),
                          )
                        }
                        type="button"
                        variant="secondary"
                      >
                        Show {Math.min(COMPARE_PAGE_SIZE, visibleAggregatedRows.length - visibleLimit).toLocaleString()} more source records
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : (
                <section className="empty-state compare-results-empty">
                  <h3>
                    {resultQuery.trim()
                      ? "No published mappings match this search."
                      : "No published mappings match this results filter."}
                  </h3>
                  <p>
                    {resultQuery.trim()
                      ? "Search another identifier or title to return to the current published crosswalk."
                      : "Clear the connection filter to return to every published mapping."}
                  </p>
                  <Button
                    onClick={() =>
                      resultQuery.trim()
                        ? setResultQuery("")
                        : patchCompare({ relationshipType: "" })
                    }
                    type="button"
                    variant="secondary"
                  >
                    {resultQuery.trim() ? "Clear search" : "Clear connection filter"}
                  </Button>
                </section>
              )}

              <p className="compare-decision-boundary" role="note">
                A published crosswalk shows a cited relationship; it does not by itself establish equivalence or compliance.
              </p>

              <Accordion.Root className="accordion-root compare-refine" collapsible type="single">
                <Accordion.Item className="disclosure-item" value="refine-results">
                  <Accordion.Header className="disclosure-header">
                    <Accordion.Trigger className="disclosure-trigger">
                      <span aria-hidden="true" className="disclosure-chevron">▾</span>
                      <span>Refine results</span>
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="disclosure-content">
                    <SelectField
                      emptyLabel="All connection types"
                      label="Connection type"
                      onChange={(relationshipType) => patchCompare({ relationshipType })}
                      options={relationshipTypeOptions}
                      value={state.relationshipType}
                    />
                  </Accordion.Content>
                </Accordion.Item>
              </Accordion.Root>
            </section>
          ) : null}
        </section>

        <CompareScopeRail
          connectedCount={targetOptions.length}
          mappingCount={0}
          mappingSourceCount={0}
          mode={mode}
          sourceLabel={sourceLabel}
          targetLabel={targetLabel}
        />
      </section>
    </MissionPage>
  );
}
