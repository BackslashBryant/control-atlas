import * as Accordion from "@radix-ui/react-accordion";
import {
  IconArrowRight,
  IconFilter,
  IconGitCompare,
} from "@tabler/icons-react";
import { useMemo, useRef, useState, type ReactNode } from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import { ExpandableControlList } from "../components/ExpandableRelationshipGroup";
import { CompareResultsPanel } from "../components/CompareResultsPanel";
import { CompareExportDisclosure } from "../components/LoadStatusPanel";
import {
  CompareStepIndicator,
  QuickIntentCard,
} from "../components/QuickIntentCard";
import {
  ChainRelationshipItem,
  parseCatalogItemIds,
  ProvenanceBadge,
  SourceRefList,
} from "../lib/compareHelpers";
import { buildWorkbenchCompareGraph } from "../lib/buildCompareGraph";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { CompareWorkbench, ViewState } from "../lib/viewState";

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

function PageHeader(props: {
  eyebrow?: string;
  title: string;
  summary: string;
}) {
  return (
    <header className="page-header">
      {props.eyebrow ? <p className="eyebrow">{props.eyebrow}</p> : null}
      <div>
        <h1>{props.title}</h1>
        <p className="page-summary">{props.summary}</p>
      </div>
    </header>
  );
}

function SummaryCard(props: { title: string; children: ReactNode }) {
  return (
    <article className="summary-card">
      <span className="summary-card-title">{props.title}</span>
      <div>{props.children}</div>
    </article>
  );
}

function DisclosurePanel(props: {
  value: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Accordion.Item className="accordion-item" value={props.value}>
      <Accordion.Header>
        <Accordion.Trigger className="accordion-trigger">
          <span>{props.title}</span>
          <IconArrowRight size={18} stroke={1.8} />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="accordion-content">
        {props.children}
      </Accordion.Content>
    </Accordion.Item>
  );
}

function Field(props: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{props.label}</span>
      {props.children}
    </label>
  );
}

function SelectField(props: {
  emptyLabel?: string;
  hint?: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const fieldId = `field-${props.label.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`;

  return (
    <label className="field" htmlFor={fieldId}>
      <span>{props.label}</span>
      <select
        id={fieldId}
        onChange={(event) => props.onChange(event.target.value)}
        value={props.value}
      >
        <option value="">{props.emptyLabel || "All"}</option>
        {props.options.map((option) => (
          <option key={`${props.label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {props.hint ? <p className="field-hint">{props.hint}</p> : null}
    </label>
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
  onOpenNode: (nodeId: string, from?: string) => void;
}) {
  const { bundle, state, onNavigate, onOpenNode } = props;
  const compareResultsRef = useRef<HTMLElement | null>(null);
  const [showComparisonPicker, setShowComparisonPicker] = useState(false);
  const [detailedMappingsOpen, setDetailedMappingsOpen] = useState("");
  const catalogs = bundle.runtime.getCatalogs();
  const workbench = state.workbench || "intent";
  const relationshipNodeIds = useMemo(
    () => parseCatalogItemIds(state.items, state.source),
    [state.items, state.source],
  );
  const relationshipRows =
    workbench === "relationships"
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
    (workbench === "threat-chain" ? "mitre-attack" : "disa-stig");
  const chainCatalogNodes = useMemo(
    () =>
      workbench === "threat-chain"
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
    [bundle, chainCatalogId, state.chainCatalog, workbench],
  );
  const chainBenchmarkOptions = useMemo(
    () =>
      [
        ...new Map(
          chainCatalogNodes.map((node: any) => {
            const value = node.metadata?.benchmark_id || node.source_id;
            const label =
              node.metadata?.benchmark_title ||
              bundle.runtime.getSource(node.source_id)?.name ||
              value;
            return [value, { value, label }];
          }),
        ).values(),
      ] as Array<{ value: string; label: string }>,
    [bundle, chainCatalogNodes],
  );
  const chainPayload =
    workbench === "stig-chain"
      ? bundle.runtime.buildStigChain({
          chain_catalog: chainCatalogId,
          chain_benchmark: state.chainBenchmark,
          chain_item: state.chainItem,
          include_candidates: state.includeCandidates === "true",
        })
      : null;
  const threatChainPayload =
    workbench === "threat-chain"
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
    workbench === "baseline-compare" &&
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
      buildWorkbenchCompareGraph({
        workbench,
        relationshipRows,
        sourceCatalog: state.source,
        targetCatalog: state.target,
        baselineComparison,
        chainPayload,
        threatChainPayload,
      }),
    [
      workbench,
      relationshipRows,
      state.source,
      state.target,
      baselineComparison,
      chainPayload,
      threatChainPayload,
    ],
  );

  const comparisonCards: Array<{
    title: string;
    body: string;
    workbench: CompareWorkbench;
  }> = [
    {
      title: "Framework to framework",
      body: "Compare two public catalogs and start with a summary before drilling into detailed mappings.",
      workbench: "relationships",
    },
    {
      title: "STIG/SRG to controls",
      body: "Trace Security Technical Implementation Guide (STIG) and Security Requirements Guide (SRG) items through CCI links to related NIST controls.",
      workbench: "stig-chain",
    },
    {
      title: "Threat to controls",
      body: "Trace an ATT&CK technique through D3FEND countermeasures to related NIST controls.",
      workbench: "threat-chain",
    },
    {
      title: "Baseline to baseline",
      body: "See what two public baselines share and what is only present in one of them.",
      workbench: "baseline-compare",
    },
    {
      title: "Find what maps to this item",
      body: "Open the framework comparison view with one known item in mind instead of blank filters.",
      workbench: "relationships",
    },
  ];

  function exportRows(format: "csv" | "markdown" | "json") {
    if (workbench === "relationships" && relationshipRows) {
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
    if (workbench === "stig-chain" && chainPayload) {
      const content = bundle.runtime.exportStigChain(chainPayload, format);
      const extension = format === "markdown" ? "md" : format;
      downloadTextFile(
        `control-atlas-stig-chain.${extension}`,
        content,
        format === "json" ? "application/json" : "text/plain",
      );
    }
    if (workbench === "threat-chain" && threatChainPayload) {
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
    if (workbench === "baseline-compare" && baselineComparison) {
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

  const compareStep: 1 | 2 | 3 =
    workbench === "intent"
      ? 1
      : workbench === "relationships" && relationshipRows?.rows?.length
        ? 3
        : workbench === "baseline-compare" && baselineComparison
          ? 3
          : workbench === "stig-chain" && selectedChain
            ? 3
            : workbench === "threat-chain" && selectedThreatChain
              ? 3
              : 2;

  function scrollToCompareResults() {
    compareResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="panel">
      <PageHeader
        eyebrow="Compare"
        summary="Start with the comparison you need to make, then reveal only the inputs and raw details that help answer it."
        title="What do you want to compare?"
      />

      <CompareStepIndicator label="Compare progress" step={compareStep} />

      {workbench === "intent" ? (
        <div className="intent-grid">
          {comparisonCards.map((card) => (
            <QuickIntentCard
              actionLabel="Start this comparison"
              body={card.body}
              icon={<IconGitCompare size={20} stroke={1.8} />}
              key={card.title}
              onClick={() =>
                onNavigate("matrix", {
                  ...state,
                  workbench: card.workbench,
                  intent: card.title,
                })
              }
              title={card.title}
            />
          ))}
        </div>
      ) : (
        <>
          <div className="compare-workbench-header">
            <button
              className="link-action"
              onClick={() =>
                onNavigate("matrix", { ...state, workbench: "intent" })
              }
              type="button"
            >
              Change comparison type
            </button>
            {showComparisonPicker ? (
              <div className="workbench-toggle">
                {comparisonCards.map((card) => (
                  <button
                    className={card.workbench === workbench ? "active" : ""}
                    key={card.title}
                    onClick={() =>
                      onNavigate("matrix", {
                        ...state,
                        workbench: card.workbench,
                        intent: card.title,
                      })
                    }
                    type="button"
                  >
                    {card.title}
                  </button>
                ))}
              </div>
            ) : (
              <button
                className="secondary quiet"
                onClick={() => setShowComparisonPicker(true)}
                type="button"
              >
                Show all comparison types
              </button>
            )}
          </div>

          {workbench === "relationships" ? (
            <>
              <div className="filter-grid">
                <div className="field-stack">
                  <SelectField
                    hint="The first framework or catalog you want to compare from."
                    label="Framework A"
                    onChange={(value) =>
                      onNavigate("matrix", { ...state, workbench, source: value })
                    }
                    options={catalogs.map((catalog: any) => ({
                      value: catalog.id,
                      label: catalog.name,
                    }))}
                    value={state.source}
                  />
                </div>
                <div className="field-stack">
                  <SelectField
                    hint="The second framework or catalog you want to compare against."
                    label="Framework B"
                    onChange={(value) =>
                      onNavigate("matrix", { ...state, workbench, target: value })
                    }
                    options={catalogs.map((catalog: any) => ({
                      value: catalog.id,
                      label: catalog.name,
                    }))}
                    value={state.target}
                  />
                </div>
                <Field label="Specific item (optional)">
                  <input
                    onChange={(event) =>
                      onNavigate("matrix", {
                        ...state,
                        workbench,
                        items: event.target.value,
                      })
                    }
                    placeholder="Leave blank to compare all visible items"
                    value={state.items}
                  />
                  <p className="field-hint">
                    Optional. Narrow the comparison to one control or rule ID.
                  </p>
                </Field>
              </div>
              {state.source && state.target ? (
                <Accordion.Root
                  className="accordion-root"
                  collapsible
                  type="single"
                >
                  <DisclosurePanel title="Refine comparison" value="refine">
                    <div className="filter-grid">
                      <SelectField
                        emptyLabel="All connection types"
                        label="Connection type"
                        onChange={(value) =>
                          onNavigate("matrix", {
                            ...state,
                            workbench,
                            relationshipType: value,
                          })
                        }
                        options={relationshipFilterOptions.types.map(
                          (value) => ({
                            value,
                            label: displayNameFor("relationship_type", value),
                          }),
                        )}
                        value={state.relationshipType}
                      />
                      <SelectField
                        emptyLabel="All source bases"
                        label="Source basis"
                        onChange={(value) =>
                          onNavigate("matrix", {
                            ...state,
                            workbench,
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
                            ...state,
                            workbench,
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
                                ...state,
                                workbench,
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
                      Official link = published mapping. Inferred link =
                      candidate mapping that still needs review.
                    </p>
                  </DisclosurePanel>
                </Accordion.Root>
              ) : null}
              {state.source && state.target ? (
                <div className="card-actions">
                  <button
                    className="primary"
                    onClick={scrollToCompareResults}
                    type="button"
                  >
                    Review results
                  </button>
                </div>
              ) : null}
              {relationshipRows?.rows?.length ? (
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
                      <Accordion.Root
                        className="accordion-root"
                        collapsible
                        onValueChange={setDetailedMappingsOpen}
                        type="single"
                        value={detailedMappingsOpen}
                      >
                        <DisclosurePanel
                          title="Detailed mappings table"
                          value="rows"
                        >
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
                                <th>Trust level</th>
                                <th>Official rationale</th>
                                <th>Plain-language rationale</th>
                                <th>Source references</th>
                              </tr>
                            </thead>
                            <tbody>
                              {relationshipRows.rows.map((row: any) => (
                                <tr key={row.edge_id}>
                                  <td>
                                    <strong>{row.from_item_id}</strong>
                                    <br />
                                    <span className="muted">
                                      {row.from_title}
                                    </span>
                                  </td>
                                  <td>
                                    <strong>{row.to_item_id}</strong>
                                    <br />
                                    <span className="muted">{row.to_title}</span>
                                  </td>
                                  <td>
                                    {displayNameFor(
                                      "relationship_type",
                                      row.relationship_type,
                                    )}
                                  </td>
                                  <td>
                                    <ProvenanceBadge
                                      provenanceClass={row.provenance_class}
                                      publicationStatus={row.publication_status}
                                    />
                                  </td>
                                  <td>
                                    {displayNameFor(
                                      "confidence",
                                      row.confidence,
                                    )}
                                  </td>
                                  <td>
                                    {row.rationale ||
                                      "No public rationale recorded."}
                                  </td>
                                  <td>
                                    {row.plain_language_rationale ||
                                      "No plain-language rationale recorded."}
                                  </td>
                                  <td>
                                    <SourceRefList refs={row.source_refs} />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </DisclosurePanel>
                      </Accordion.Root>
                    }
                    matrixWorkbench={workbench}
                    onExport={exportRows}
                    onNavigate={onNavigate}
                    onOpenNode={onOpenNode}
                  />
                </section>
              ) : state.source && state.target ? (
                <section className="empty-state">
                  <IconFilter aria-hidden="true" size={24} stroke={1.8} />
                  <h2>No public connections found for this comparison.</h2>
                  <p>
                    Try changing one catalog, removing filters, or searching for
                    a specific control identifier.
                  </p>
                  <div className="card-actions">
                    <button
                      className="primary"
                      onClick={() =>
                        onNavigate("matrix", {
                          ...state,
                          workbench,
                          relationshipType: "",
                          provenance: "",
                          confidence: "",
                          includeCandidates: "",
                        })
                      }
                      type="button"
                    >
                      Reset filters
                    </button>
                    <button
                      className="secondary"
                      onClick={() => onNavigate("sources")}
                      type="button"
                    >
                      Review sources
                    </button>
                    <button
                      className="secondary"
                      onClick={() =>
                        onNavigate("matrix", { ...state, workbench: "intent" })
                      }
                      type="button"
                    >
                      Choose another comparison
                    </button>
                  </div>
                </section>
              ) : null}
            </>
          ) : null}

          {workbench === "stig-chain" ? (
            <>
              <div className="filter-grid">
                <SelectField
                  label="Catalog"
                  onChange={(value) =>
                    onNavigate("matrix", {
                      ...state,
                      workbench,
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
                      ...state,
                      workbench,
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
                      ...state,
                      workbench,
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
                          ...state,
                          workbench,
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
                Official link = published mapping. Inferred link = candidate
                mapping. Pick a STIG rule, review CCI connections, then open the
                related NIST control.
              </p>
              {chainPayload?.rows?.length ? (
                <div className="stack">
                  <SummaryCard title="What this is">
                    <p>
                      {chainPayload.rows.length} STIG or SRG items are visible
                      in the current chain scope.
                    </p>
                  </SummaryCard>
                  <CompareExportDisclosure
                    disabled={!(chainPayload.rows.length || selectedChain)}
                    onExport={exportRows}
                  />
                  <table
                    className="detail-table"
                    aria-label="STIG chain summary"
                  >
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
                          <td>
                            <strong>{row.item_id}</strong>
                            <br />
                            <span className="muted">{row.title}</span>
                          </td>
                          <td>{row.benchmark_title}</td>
                          <td>{row.cci_count}</td>
                          <td>{row.nist_control_count}</td>
                          <td>{row.unmapped_cci_count}</td>
                          <td>
                            <button
                              className="secondary"
                              onClick={() =>
                                onNavigate("matrix", {
                                  ...state,
                                  workbench,
                                  chainItem: row.node_id,
                                })
                              }
                              type="button"
                            >
                              View mapping trace
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                            <SummaryCard title="Unmapped CCIs">
                              <ul className="source-ref-list">
                                {selectedChain.unmapped_cci_nodes.length ? (
                                  selectedChain.unmapped_cci_nodes.map(
                                    (node: any) => (
                                      <li
                                        className="chain-link-item"
                                        key={node.id}
                                      >
                                        <button
                                          className="link-action"
                                          onClick={() => onOpenNode(node.id)}
                                          type="button"
                                        >
                                          <strong>
                                            {node.metadata?.item_id || node.id}
                                          </strong>{" "}
                                          — {node.metadata?.title || node.label}
                                        </button>
                                      </li>
                                    ),
                                  )
                                ) : (
                                  <li>
                                    Every visible CCI has a visible NIST link.
                                  </li>
                                )}
                              </ul>
                            </SummaryCard>
                          </div>
                        </section>
                      }
                      matrixWorkbench={workbench}
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
                    Try a different catalog or remove the item filter to widen
                    the visible chain.
                  </p>
                </section>
              )}
            </>
          ) : null}

          {workbench === "threat-chain" ? (
            <>
              <div className="filter-grid">
                <SelectField
                  emptyLabel="All ATT&CK domains"
                  label="ATT&CK domain"
                  onChange={(value) =>
                    onNavigate("matrix", {
                      ...state,
                      workbench,
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
                      ...state,
                      workbench,
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
                          ...state,
                          workbench,
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
                Official link = MITRE published mapping. Pick a technique, review
                D3FEND countermeasures, then open the related NIST controls.
              </p>
              {threatChainPayload?.rows?.length ? (
                <div className="stack">
                  <SummaryCard title="What this is">
                    <p>
                      {threatChainPayload.rows.length} ATT&CK techniques are
                      visible in the current threat chain scope.
                    </p>
                  </SummaryCard>
                  <CompareExportDisclosure
                    disabled={
                      !(
                        threatChainPayload.rows.length || selectedThreatChain
                      )
                    }
                    onExport={exportRows}
                  />
                  {!selectedThreatChain ? (
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
                          <td>
                            <strong>{row.item_id}</strong>
                            <br />
                            <span className="muted">{row.title}</span>
                          </td>
                          <td>{row.domain}</td>
                          <td>{row.d3fend_count}</td>
                          <td>{row.nist_control_count}</td>
                          <td>{row.unmapped_d3fend_count}</td>
                          <td>
                            <button
                              className="secondary"
                              onClick={() =>
                                onNavigate("matrix", {
                                  ...state,
                                  workbench,
                                  chainItem: row.node_id,
                                })
                              }
                              type="button"
                            >
                              Trace this technique
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                                    No NIST controls reached from the visible
                                    D3FEND links.
                                  </li>
                                )}
                              </ul>
                            </SummaryCard>
                            <SummaryCard title="Unmapped D3FEND countermeasures">
                              <ul className="source-ref-list">
                                {selectedThreatChain.unmapped_d3fend_nodes
                                  .length ? (
                                  selectedThreatChain.unmapped_d3fend_nodes.map(
                                    (node: any) => (
                                      <li
                                        className="chain-link-item"
                                        key={node.id}
                                      >
                                        <button
                                          className="link-action"
                                          onClick={() => onOpenNode(node.id)}
                                          type="button"
                                        >
                                          <strong>
                                            {node.metadata?.item_id || node.id}
                                          </strong>{" "}
                                          — {node.metadata?.title || node.label}
                                        </button>
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
                            </SummaryCard>
                          </div>
                        </section>
                      }
                      matrixWorkbench={workbench}
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
                    Try a different ATT&CK domain or remove the technique filter
                    to widen the visible chain.
                  </p>
                </section>
              )}
            </>
          ) : null}

          {workbench === "baseline-compare" ? (
            <>
              <div className="filter-grid">
                <SelectField
                  label="Baseline A"
                  onChange={(value) =>
                    onNavigate("matrix", {
                      ...state,
                      workbench,
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
                      ...state,
                      workbench,
                      baselineB: value,
                    })
                  }
                  options={baselineOptions}
                  value={state.baselineB}
                />
              </div>
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
                      {baselineComparison.baseline_a_source.name}
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
                      {baselineComparison.baseline_b_source.name}
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
                    matrixWorkbench={workbench}
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
        </>
      )}
    </section>
  );
}

