import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { IconMap, IconSearch } from "@tabler/icons-react";

import { displayNameFor } from "../../app/display-names.mjs";
import { AtlasConnectionMap } from "../components/AtlasConnectionMap";
import { RelationshipGraphTable } from "../components/RelationshipGraphTable";
import {
  DEFAULT_MAP_WARNINGS,
  isVisibleWithOptionalFilters,
} from "../graph/defaultMapFilter";
import { SOURCE_RUNTIME_ANCHORS } from "../graph/sourceRuntimeAnchors";
import { SOURCE_SEED_MANIFEST } from "../graph/sourceSeedManifest";
import {
  SOURCE_VIEW_DEFINITIONS,
  normalizeSourceViewId,
  sourceViewGroupsFor,
  type SourceViewId,
} from "../graph/sourceViews";
import {
  ATLAS_PATH_STAGES,
  atlasFilterOptions,
  buildAtlasGroups,
  buildAtlasRows,
  resolveAtlasPathStage,
  type AtlasConnectionGroup,
  type AtlasFilterState,
  type AtlasPathStageId,
} from "../lib/atlasModel";
import {
  loadAtlasNeighborhood,
  type AtlasNeighborhoodRecord,
  type RuntimeBundle,
} from "../lib/runtimeLoader";
import { nodeIdFromItemId, type ViewState } from "../lib/viewState";

type AtlasMapPageProps = {
  bundle: RuntimeBundle;
  state: Extract<ViewState, { view: "atlas-map" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNode: (nodeId: string, from?: string) => void;
};

type AtlasView = "path" | "map" | "list";

function atlasView(value: string): AtlasView {
  if (value === "map" || value === "list") return value;
  return "path";
}

function handleTabKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
  if (
    ![
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ].includes(event.key)
  ) {
    return;
  }
  const tabs = Array.from(
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
      ':scope > [role="tab"]',
    ) || [],
  );
  if (!tabs.length) return;
  event.preventDefault();
  const currentIndex = tabs.indexOf(event.currentTarget);
  const nextIndex =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? tabs.length - 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? (currentIndex - 1 + tabs.length) % tabs.length
          : (currentIndex + 1) % tabs.length;
  tabs[nextIndex]?.focus();
  tabs[nextIndex]?.click();
}

function useCompactAtlas() {
  const [compact, setCompact] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const onChange = (event: MediaQueryListEvent) => setCompact(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return compact;
}

function requestedNodeId(bundle: RuntimeBundle, rawNode: string) {
  const node = rawNode.trim();
  if (!node || node === "foundation" || node === "landscape") return "";
  if (node.startsWith("hierarchy:")) return "";
  const resolved = nodeIdFromItemId(bundle.runtime, node);
  if (resolved) return resolved;
  return node.includes(":") ? node : "";
}

export function AtlasMapPage(props: AtlasMapPageProps) {
  const { bundle, state, onNavigate, onOpenNode } = props;
  const view = atlasView(state.relationshipView);
  const compact = useCompactAtlas();
  const nodeId = useMemo(
    () => requestedNodeId(bundle, state.node),
    [bundle, state.node],
  );
  const [record, setRecord] = useState<AtlasNeighborhoodRecord | null>(null);
  const [recordStatus, setRecordStatus] = useState<
    "idle" | "loading" | "ready" | "missing" | "error"
  >(nodeId ? "loading" : "idle");
  const [mapSearchDraft, setMapSearchDraft] = useState(
    state.relationshipSearch || "",
  );

  useEffect(() => {
    setMapSearchDraft(state.relationshipSearch || "");
  }, [state.relationshipSearch]);

  useEffect(() => {
    let cancelled = false;
    setRecord(null);
    if (!nodeId) {
      setRecordStatus("idle");
      return () => {
        cancelled = true;
      };
    }
    setRecordStatus("loading");
    loadAtlasNeighborhood(nodeId)
      .then((nextRecord) => {
        if (cancelled) return;
        setRecord(nextRecord);
        setRecordStatus(nextRecord ? "ready" : "missing");
      })
      .catch(() => {
        if (!cancelled) setRecordStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [nodeId]);

  function patchAtlas(patch: Partial<typeof state>) {
    onNavigate("atlas-map", patch);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = mapSearchDraft.trim();
    if (!query) return;
    const resolved = nodeIdFromItemId(bundle.runtime, query);
    if (!resolved) {
      onNavigate("search", { query });
      return;
    }
    patchAtlas({
      node: resolved,
      relationshipSearch: "",
      relationshipGroup: "",
      atlasStage: "",
    });
  }

  return (
    <section className="panel atlas-workspace">
      <header className="atlas-workspace-header">
        <div>
          <p className="eyebrow">Atlas</p>
          <h1>
            {record
              ? record.center_node.metadata?.item_id || record.center_node.id
              : "Control Atlas"}
          </h1>
          <p className="page-summary">
            {record
              ? "Follow the published connections around this record. Path explains the work; Map shows the network; List preserves every result."
              : "Start with a question or lifecycle step, then open a record to see only the connections that are actually published."}
          </p>
        </div>
        {record ? (
          <div className="atlas-connection-count" aria-live="polite">
            <strong>{record.published_connection_count}</strong>
            <span>published connections</span>
          </div>
        ) : null}
      </header>

      <form className="atlas-map-command" onSubmit={submitSearch}>
        <label className="field grow" htmlFor="atlas-search">
          <span>Find a control, CCI, baseline, STIG, or source</span>
          <input
            aria-label="Search Atlas"
            id="atlas-search"
            onChange={(event) => setMapSearchDraft(event.target.value)}
            placeholder="account management, AC-2, CCI-000225"
            type="search"
            value={mapSearchDraft}
          />
        </label>
        <button className="primary" type="submit">
          <IconSearch aria-hidden="true" size={18} /> Search
        </button>
      </form>

      <div
        aria-label="Atlas views"
        className="atlas-view-tabs"
        role="tablist"
      >
        {([
          ["path", "Path"],
          ["map", "Map"],
          ["list", "List"],
        ] as Array<[AtlasView, string]>).map(([viewId, label]) => (
          <button
            aria-controls="atlas-view-panel"
            aria-selected={view === viewId}
            className={view === viewId ? "active" : ""}
            id={`atlas-view-tab-${viewId}`}
            key={viewId}
            onClick={() =>
              patchAtlas({ relationshipView: viewId, relationshipGroup: "" })
            }
            onKeyDown={handleTabKeyDown}
            role="tab"
            tabIndex={view === viewId ? 0 : -1}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div
        aria-labelledby={`atlas-view-tab-${view}`}
        className="atlas-view-panel"
        id="atlas-view-panel"
        role="tabpanel"
      >
      {recordStatus === "loading" ? (
        <div className="atlas-loading" role="status">
          <div aria-hidden="true" className="atlas-loading-block" />
          Loading this record's connections…
        </div>
      ) : null}

      {recordStatus === "missing" || recordStatus === "error" ? (
        <AtlasLoadFailure
          error={recordStatus === "error"}
          onSearch={() => onNavigate("search", { query: state.node })}
          onSources={() => onNavigate("sources")}
        />
      ) : null}

      {record ? (
        <FocusedAtlas
          compact={compact}
          onNavigate={onNavigate}
          onOpenNode={onOpenNode}
          patchAtlas={patchAtlas}
          record={record}
          state={state}
          view={view}
        />
      ) : recordStatus === "idle" ? (
        <SourceAtlas
          onNavigate={onNavigate}
          patchAtlas={patchAtlas}
          state={state}
          view={view}
        />
      ) : null}
      </div>
    </section>
  );
}

function FocusedAtlas(props: {
  compact: boolean;
  record: AtlasNeighborhoodRecord;
  state: AtlasMapPageProps["state"];
  view: AtlasView;
  patchAtlas: (patch: Partial<AtlasMapPageProps["state"]>) => void;
  onNavigate: AtlasMapPageProps["onNavigate"];
  onOpenNode: AtlasMapPageProps["onOpenNode"];
}) {
  const { record, state, view, patchAtlas, compact, onNavigate, onOpenNode } = props;
  const filters: AtlasFilterState = {
    relationshipType: state.relationshipType,
    provenance: state.provenance,
    confidence: state.confidence,
    nodeType: state.nodeType,
    includeCandidates: state.includeCandidates === "true",
    search: state.relationshipSearch,
  };
  const groups = useMemo(() => buildAtlasGroups(record, filters), [record, state]);
  const rows = useMemo(() => buildAtlasRows(record, filters), [record, state]);
  const options = useMemo(() => atlasFilterOptions(record), [record]);
  const stage = resolveAtlasPathStage(groups, state.atlasStage);
  const centerLabel = record.center_node.metadata?.item_id || record.center_node.id;
  const centerTitle =
    record.center_node.metadata?.title || record.center_node.label || centerLabel;

  function updateFilters(patch: Partial<AtlasFilterState>) {
    patchAtlas({
      relationshipType:
        patch.relationshipType === undefined
          ? state.relationshipType
          : patch.relationshipType,
      provenance:
        patch.provenance === undefined ? state.provenance : patch.provenance,
      confidence:
        patch.confidence === undefined ? state.confidence : patch.confidence,
      nodeType: patch.nodeType === undefined ? state.nodeType : patch.nodeType,
      includeCandidates:
        patch.includeCandidates === undefined
          ? state.includeCandidates
          : patch.includeCandidates
            ? "true"
            : "",
      relationshipSearch:
        patch.search === undefined ? state.relationshipSearch : patch.search,
      relationshipGroup: "",
    });
  }

  return (
    <div className="atlas-focused-shell">
      <AtlasFilterBar
        filters={filters}
        onChange={updateFilters}
        options={options}
      />

      {rows.length === 0 ? (
        <AtlasNoConnections
          candidateCount={record.candidate_connection_count}
          filtersActive={Boolean(
            filters.relationshipType ||
              filters.provenance ||
              filters.confidence ||
              filters.nodeType ||
              filters.search,
          )}
          includeCandidates={filters.includeCandidates}
          onClear={() =>
            updateFilters({
              relationshipType: "",
              provenance: "",
              confidence: "",
              nodeType: "",
              search: "",
            })
          }
          onIncludeCandidates={() => updateFilters({ includeCandidates: true })}
          onOpenRecord={() => onOpenNode(record.center_node.id, "atlas-map")}
          onSearch={() => onNavigate("search", { query: centerLabel })}
          onSources={() => onNavigate("sources")}
        />
      ) : (
        <div className="atlas-focused-layout">
          <main className="atlas-focused-main">
            {view === "path" ? (
              <AtlasPath
                groups={groups}
                onOpenList={() => patchAtlas({ relationshipView: "list" })}
                onRecenter={(node) =>
                  patchAtlas({ node, relationshipGroup: "", atlasStage: "" })
                }
                onStageChange={(nextStage) =>
                  patchAtlas({ atlasStage: nextStage, relationshipGroup: "" })
                }
                stage={stage}
              />
            ) : null}

            {view === "map" ? (
              <AtlasConnectionMap
                center={record.center_node}
                compact={compact}
                expandedGroupId={state.relationshipGroup}
                groups={groups}
                onExpandedGroupChange={(relationshipGroup) =>
                  patchAtlas({ relationshipGroup })
                }
                onOpenList={() => patchAtlas({ relationshipView: "list" })}
                onRecenter={(node) =>
                  patchAtlas({ node, relationshipGroup: "", atlasStage: "" })
                }
              />
            ) : null}

            {view === "list" ? (
              <RelationshipGraphTable
                conciseTrust
                onOpenNode={(node) =>
                  patchAtlas({ node, relationshipGroup: "", atlasStage: "" })
                }
                rows={rows}
              />
            ) : null}
          </main>

          <aside aria-label="Selected record" className="atlas-record-inspector">
            <p className="eyebrow">Selected record</p>
            <h2>{centerLabel}</h2>
            <p>{centerTitle}</p>
            <dl>
              <div>
                <dt>Visible now</dt>
                <dd>{rows.length}</dd>
              </div>
              <div>
                <dt>Published total</dt>
                <dd>{record.published_connection_count}</dd>
              </div>
              {record.candidate_connection_count > 0 ? (
                <div>
                  <dt>Candidate links</dt>
                  <dd>{record.candidate_connection_count}</dd>
                </div>
              ) : null}
            </dl>
            <button
              className="secondary"
              onClick={() => onOpenNode(record.center_node.id, "atlas-map")}
              type="button"
            >
              Open full record
            </button>
            <p className="muted atlas-record-inspector-note">
              Path may show an empty workflow stage when the absence matters.
              Map never invents a connection.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}

function AtlasPath(props: {
  groups: AtlasConnectionGroup[];
  stage: AtlasPathStageId;
  onStageChange: (stage: AtlasPathStageId) => void;
  onRecenter: (nodeId: string) => void;
  onOpenList: () => void;
}) {
  const stageDefinition = ATLAS_PATH_STAGES.find((entry) => entry.id === props.stage)!;
  const stageGroups = props.groups.filter((group) => group.stage === props.stage);
  return (
    <section aria-labelledby="atlas-path-heading" className="atlas-path-view">
      <header>
        <p className="eyebrow">Guided decomposition</p>
        <h2 id="atlas-path-heading">From meaning to action</h2>
        <p>Move through the work in order. Every card below comes from a published connection.</p>
      </header>
      <div aria-label="Compliance path" className="atlas-path-stage-nav" role="tablist">
        {ATLAS_PATH_STAGES.map((entry, index) => {
          const count = props.groups
            .filter((group) => group.stage === entry.id)
            .reduce((total, group) => total + group.items.length, 0);
          return (
            <button
              aria-controls="atlas-path-stage-panel"
              aria-selected={props.stage === entry.id}
              className={props.stage === entry.id ? "active" : ""}
              id={`atlas-stage-tab-${entry.id}`}
              key={entry.id}
              onClick={() => props.onStageChange(entry.id)}
              onKeyDown={handleTabKeyDown}
              role="tab"
              tabIndex={props.stage === entry.id ? 0 : -1}
              type="button"
            >
              <span>{index + 1}</span>
              <strong>{entry.label}</strong>
              <small>{count} connections</small>
            </button>
          );
        })}
      </div>
      <div
        aria-labelledby={`atlas-stage-tab-${props.stage}`}
        className="atlas-path-stage-panel"
        id="atlas-path-stage-panel"
        role="tabpanel"
      >
        <header>
          <div>
            <p className="eyebrow">Current stage</p>
            <h3>{stageDefinition.label}</h3>
          </div>
          <p>{stageDefinition.description}</p>
        </header>
        {stageGroups.length === 0 ? (
          <div className="atlas-stage-empty">
            <strong>No published connections in this stage.</strong>
            <p>This is a known gap, not a completed step.</p>
          </div>
        ) : (
          <div className="atlas-path-groups">
            {stageGroups.map((group) => (
              <article className="atlas-path-group" key={group.id}>
                <header>
                  <div>
                    <h4>{group.label}</h4>
                    <p>{group.description}</p>
                  </div>
                  <strong>{group.items.length}</strong>
                </header>
                <div className="atlas-path-items">
                  {group.items.slice(0, 4).map((item) => (
                    <button
                      key={`${item.edge.id}:${item.counterpart.id}`}
                      onClick={() => props.onRecenter(item.counterpart.id)}
                      type="button"
                    >
                      <strong>{item.itemId}</strong>
                      <span>{item.title}</span>
                    </button>
                  ))}
                </div>
                {group.items.length > 4 ? (
                  <button className="link-action" onClick={props.onOpenList} type="button">
                    + {group.items.length - 4} more in List
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SourceAtlas(props: {
  state: AtlasMapPageProps["state"];
  view: AtlasView;
  patchAtlas: (patch: Partial<AtlasMapPageProps["state"]>) => void;
  onNavigate: AtlasMapPageProps["onNavigate"];
}) {
  const { state, view, patchAtlas, onNavigate } = props;
  const oldDrill = state.node.startsWith("hierarchy:")
    ? state.node.slice("hierarchy:".length)
    : "";
  const requestedSourceView = normalizeSourceViewId(state.sourceView);
  const sourceView =
    oldDrill &&
    !SOURCE_VIEW_DEFINITIONS[requestedSourceView].groups.some(
      (group) => group.id === oldDrill,
    ) &&
    SOURCE_VIEW_DEFINITIONS.purpose.groups.some(
      (group) => group.id === oldDrill,
    )
      ? "purpose"
      : requestedSourceView;
  const definition = SOURCE_VIEW_DEFINITIONS[sourceView];
  const initialGroup = definition.groups.some((group) => group.id === oldDrill)
    ? oldDrill
    : definition.groups[0]?.id || "";
  const [activeGroup, setActiveGroup] = useState(initialGroup);
  const visibility = {
    showSupportingReferences: state.showSupportingReferences === "true",
    showDraftOrLegacy: state.showDraftOrLegacy === "true",
    showRegistryOnly: state.showRegistryOnly === "true",
  };

  useEffect(() => {
    setActiveGroup(initialGroup);
  }, [initialGroup]);

  const sourcesByGroup = useMemo(
    () =>
      new Map(
        definition.groups.map((group) => [
          group.id,
          SOURCE_SEED_MANIFEST.filter(
            (source) =>
              sourceViewGroupsFor(source, sourceView).includes(group.id) &&
              isVisibleWithOptionalFilters(source, visibility),
          ),
        ]),
      ),
    [definition.groups, sourceView, state.showDraftOrLegacy, state.showRegistryOnly, state.showSupportingReferences],
  );
  const activeDefinition =
    definition.groups.find((group) => group.id === activeGroup) || definition.groups[0];
  const activeSources = sourcesByGroup.get(activeDefinition?.id || "") || [];

  function openSource(sourceId: string) {
    const anchor = SOURCE_RUNTIME_ANCHORS[sourceId];
    if (anchor) {
      patchAtlas({
        node: anchor,
        relationshipView: "path",
        relationshipGroup: "",
        atlasStage: "",
      });
      return;
    }
    onNavigate("sources", { source: sourceId });
  }

  return (
    <section className="atlas-source-path">
      <div aria-label="Browse sources by" className="source-view-toggle" role="group">
        {(["novice", "purpose", "rmf"] as SourceViewId[]).map((viewId) => (
          <button
            aria-pressed={sourceView === viewId}
            className={sourceView === viewId ? "active" : ""}
            key={viewId}
            onClick={() => patchAtlas({ sourceView: viewId, node: "" })}
            type="button"
          >
            {SOURCE_VIEW_DEFINITIONS[viewId].label}
          </button>
        ))}
      </div>
      <p className="atlas-source-summary">{definition.summary}</p>

      <details className="atlas-display-options">
        <summary>Source options</summary>
        <div aria-label="Source visibility filters" className="atlas-source-filters" role="group">
          <SourceFilter
            checked={visibility.showSupportingReferences}
            label="Show supporting references"
            onChange={(checked) =>
              patchAtlas({ showSupportingReferences: checked ? "true" : "" })
            }
          />
          <SourceFilter
            checked={visibility.showDraftOrLegacy}
            label="Show draft / legacy sources"
            onChange={(checked) =>
              patchAtlas({ showDraftOrLegacy: checked ? "true" : "" })
            }
          />
          <SourceFilter
            checked={visibility.showRegistryOnly}
            label="Show registry-only entries"
            onChange={(checked) =>
              patchAtlas({ showRegistryOnly: checked ? "true" : "" })
            }
          />
        </div>
        <div aria-live="polite" className="atlas-source-warnings">
          {visibility.showSupportingReferences ? <p>{DEFAULT_MAP_WARNINGS.supportingReferences}</p> : null}
          {visibility.showDraftOrLegacy ? <p>{DEFAULT_MAP_WARNINGS.draftOrLegacy}</p> : null}
          {visibility.showRegistryOnly ? <p>{DEFAULT_MAP_WARNINGS.registryOnly}</p> : null}
        </div>
      </details>

      {view === "map" ? (
        <div className="atlas-no-connections">
          <IconMap aria-hidden="true" size={28} />
          <h2>Choose a record before opening Map.</h2>
          <p>Map only appears when a selected record has published connections. The guided source path is navigation, not relationship evidence.</p>
          <button className="primary" onClick={() => onNavigate("search")} type="button">
            Search for a record
          </button>
        </div>
      ) : null}

      {view === "path" ? (
        <>
          <div aria-label={`${definition.label} path`} className="atlas-path-stage-nav atlas-source-stage-nav" role="tablist">
            {definition.groups.map((group, index) => (
              <button
                aria-controls="atlas-source-stage-panel"
                aria-selected={activeDefinition?.id === group.id}
                className={activeDefinition?.id === group.id ? "active" : ""}
                id={`atlas-source-tab-${sourceView}-${group.id}`}
                key={group.id}
                onClick={() => setActiveGroup(group.id)}
                onKeyDown={handleTabKeyDown}
                role="tab"
                tabIndex={activeDefinition?.id === group.id ? 0 : -1}
                type="button"
              >
                <span>{index + 1}</span>
                <strong>{group.label}</strong>
                <small>{sourcesByGroup.get(group.id)?.length || 0} sources</small>
              </button>
            ))}
          </div>
          <div
            aria-labelledby={`atlas-source-tab-${sourceView}-${activeDefinition?.id}`}
            className="atlas-source-stage-panel"
            id="atlas-source-stage-panel"
            role="tabpanel"
          >
            <header>
              <div>
                <p className="eyebrow">Selected path</p>
                <h2>{activeDefinition?.label}</h2>
              </div>
              <p>{activeDefinition?.description}</p>
            </header>
            <SourceCards onOpen={openSource} sources={activeSources} />
          </div>
        </>
      ) : null}

      {view === "list" ? (
        <div className="atlas-source-list">
          {definition.groups.map((group) => {
            const sources = sourcesByGroup.get(group.id) || [];
            if (!sources.length) return null;
            return (
              <section key={group.id}>
                <header>
                  <h2>{group.label}</h2>
                  <p>{group.description}</p>
                </header>
                <SourceCards onOpen={openSource} sources={sources} />
              </section>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function SourceCards(props: {
  sources: typeof SOURCE_SEED_MANIFEST;
  onOpen: (sourceId: string) => void;
}) {
  if (!props.sources.length) {
    return <p className="muted">No sources are visible in this step with the current options.</p>;
  }
  return (
    <div className="atlas-source-cards">
      {props.sources.map((source) => (
        <article key={source.sourceId}>
          <p className="eyebrow">{source.publisher}</p>
          <h3>{source.displayName}</h3>
          <p>{source.defaultMapReason}</p>
          <div className="card-actions">
            <button className="secondary" onClick={() => props.onOpen(source.sourceId)} type="button">
              {SOURCE_RUNTIME_ANCHORS[source.sourceId] ? "View connected records" : "View source details"}
            </button>
            {source.canonicalUrl !== "registry-local-only" ? (
              <a href={source.canonicalUrl} rel="noreferrer" target="_blank">
                Official source
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function AtlasFilterBar(props: {
  filters: AtlasFilterState;
  options: ReturnType<typeof atlasFilterOptions>;
  onChange: (patch: Partial<AtlasFilterState>) => void;
}) {
  return (
    <details className="atlas-connection-filters">
      <summary>Filter connections</summary>
      <div aria-label="Connection filters" className="atlas-filter-grid" role="group">
        <AtlasSelect
          label="Connection type"
          onChange={(relationshipType) => props.onChange({ relationshipType })}
          options={props.options.relationshipTypes}
          value={props.filters.relationshipType}
          vocabulary="relationship_type"
        />
        <AtlasSelect
          label="Source basis"
          onChange={(provenance) => props.onChange({ provenance })}
          options={props.options.provenanceClasses}
          value={props.filters.provenance}
          vocabulary="provenance_class"
        />
        <AtlasSelect
          label="Trust level"
          onChange={(confidence) => props.onChange({ confidence })}
          options={props.options.confidenceLevels}
          value={props.filters.confidence}
          vocabulary="confidence"
        />
        <AtlasSelect
          label="Item type"
          onChange={(nodeType) => props.onChange({ nodeType })}
          options={props.options.nodeTypes}
          value={props.filters.nodeType}
          vocabulary="object_type"
        />
        <label>
          Filter this record's connections
          <input
            onChange={(event) => props.onChange({ search: event.target.value })}
            placeholder="ID, title, or rationale"
            type="search"
            value={props.filters.search}
          />
        </label>
        <label className="atlas-candidate-toggle">
          <input
            checked={props.filters.includeCandidates}
            onChange={(event) =>
              props.onChange({ includeCandidates: event.target.checked })
            }
            type="checkbox"
          />
          Include candidate links
        </label>
      </div>
    </details>
  );
}

function AtlasSelect(props: {
  label: string;
  value: string;
  options: string[];
  vocabulary: string;
  onChange: (value: string) => void;
}) {
  const id = `atlas-filter-${props.label.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <label htmlFor={id}>
      {props.label}
      <select id={id} onChange={(event) => props.onChange(event.target.value)} value={props.value}>
        <option value="">All</option>
        {props.options.map((option) => (
          <option key={option} value={option}>
            {displayNameFor(props.vocabulary, option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function SourceFilter(props: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label>
      <input
        checked={props.checked}
        onChange={(event) => props.onChange(event.target.checked)}
        type="checkbox"
      />
      {props.label}
    </label>
  );
}

function AtlasNoConnections(props: {
  candidateCount: number;
  filtersActive: boolean;
  includeCandidates: boolean;
  onClear: () => void;
  onIncludeCandidates: () => void;
  onOpenRecord: () => void;
  onSearch: () => void;
  onSources: () => void;
}) {
  return (
    <section className="atlas-no-connections" role="status">
      <IconMap aria-hidden="true" size={28} />
      <h2>No published connections to show.</h2>
      <p>
        {props.filtersActive
          ? "The current filters remove every published connection."
          : "Control Atlas does not currently have a published relationship for this item."}
      </p>
      <div className="card-actions">
        {props.filtersActive ? (
          <button className="primary" onClick={props.onClear} type="button">Clear filters</button>
        ) : null}
        {!props.includeCandidates && props.candidateCount > 0 ? (
          <button className="secondary" onClick={props.onIncludeCandidates} type="button">
            Show {props.candidateCount} candidate links
          </button>
        ) : null}
        <button className="secondary" onClick={props.onOpenRecord} type="button">Open record</button>
        <button className="secondary" onClick={props.onSearch} type="button">Search Atlas</button>
        <button className="secondary" onClick={props.onSources} type="button">View sources</button>
      </div>
    </section>
  );
}

function AtlasLoadFailure(props: {
  error: boolean;
  onSearch: () => void;
  onSources: () => void;
}) {
  return (
    <section className="atlas-no-connections" role="alert">
      <h2>{props.error ? "Connections could not be loaded." : "This record is not in the Atlas."}</h2>
      <p>{props.error ? "The small connection file did not load. Try again or continue through Search." : "The link may be stale or the record may not be part of the current public graph."}</p>
      <div className="card-actions">
        <button className="primary" onClick={props.onSearch} type="button">Search records</button>
        <button className="secondary" onClick={props.onSources} type="button">View sources</button>
      </div>
    </section>
  );
}
