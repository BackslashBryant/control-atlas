import { useEffect, useId, useMemo, useState } from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import { aggregateRelationshipRows } from "../../app/runtime.mjs";
import { SITE_COPY } from "../../shared/site-copy.mjs";
import { CompareResultsPanel } from "../components/CompareResultsPanel";
import { Button } from "../components/lsm";
import { parseCatalogItemIds } from "../lib/compareHelpers";
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

function SearchablePublicationField(props: {
  label: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  value: string;
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

  return (
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
        Search {props.options.length.toLocaleString()} publications with published crosswalks.
      </p>
    </Field>
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

export function ComparePage(props: {
  bundle: RuntimeBundle;
  state: CompareState;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNode: (nodeId: string) => void;
}) {
  const { bundle, state, onNavigate, onOpenNode } = props;
  const [relationshipPage, setRelationshipPage] = useState(1);
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

  const exportRows = (format: "csv" | "markdown" | "json") => {
    if (!relationshipRows) return;
    const content = bundle.runtime.exportRelationshipRows(
      aggregatedRelationshipRows.length
        ? aggregatedRelationshipRows
        : relationshipRows.rows,
      format,
    );
    const extension = format === "markdown" ? "md" : format;
    downloadTextFile(
      `control-atlas-compare.${extension}`,
      content,
      format === "json" ? "application/json" : "text/plain",
    );
  };

  return (
    <MissionPage
      className="compare-page flow-shell"
      data-visual-identity="staged-crosswalk-flow"
      id="compare-workspace"
      maxWidth="workspace"
    >
      <PageHeader
        eyebrow={`PUBLISHED CROSSWALKS / ${pairCount.toLocaleString()} COMPARABLE PAIRS`}
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
            <CompareResultsPanel
              currentPage={relationshipPage}
              mappingCount={relationshipRows?.rows.length || 0}
              mappingSourceOptions={mappingSourceOptions}
              onBack={() => patchCompare({ compareRun: "" })}
              onExport={exportRows}
              onMappingSourceChange={(mappingSource) =>
                patchCompare({ mappingSource })
              }
              onOpenNode={onOpenNode}
              onPageChange={setRelationshipPage}
              onRelationshipTypeChange={(relationshipType) =>
                patchCompare({ relationshipType })
              }
              pageCount={relationshipPageCount}
              pageSize={relationshipPageSize}
              relationshipType={state.relationshipType}
              relationshipTypeOptions={relationshipTypeOptions}
              rows={visibleAggregatedRows}
              selectedMappingSource={
                mappingResolution.status === "filtered"
                  ? state.mappingSource
                  : ""
              }
              sourceLabel={sourceLabel}
              targetLabel={targetLabel}
              totalSourceRows={aggregatedRelationshipRows.length}
            />
          ) : null}
        </section>

        <CompareScopeRail
          connectedCount={targetOptions.length}
          mappingCount={showResults ? relationshipRows?.rows.length || 0 : 0}
          mappingSourceCount={showResults ? mappingSourceOptions.length : 0}
          mode={mode}
          sourceLabel={sourceLabel}
          targetLabel={targetLabel}
        />
      </section>
    </MissionPage>
  );
}
