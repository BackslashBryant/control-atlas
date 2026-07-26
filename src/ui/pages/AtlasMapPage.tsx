import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  IconExternalLink,
  IconFolderOpen,
  IconListDetails,
  IconMap,
  IconRoute,
  IconSearch,
} from "@tabler/icons-react";

import { displayNameFor } from "../../app/display-names.mjs";
import { AtlasConnectionMap } from "../components/AtlasConnectionMap";
import { AtlasDecompositionBoard } from "../components/AtlasDecompositionBoard";
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
  atlasFilterOptions,
  buildAtlasGroups,
  buildAtlasRows,
  type AtlasFilterState,
  type AtlasRelationshipRow,
} from "../lib/atlasModel";
import { scrollElementBelowHeader } from "../lib/pagePrimitives";
import {
  loadAtlasNeighborhood,
  type AtlasNeighborhoodRecord,
  type RuntimeBundle,
} from "../lib/runtimeLoader";
import { nodeIdFromItemId, type ViewState } from "../lib/viewState";

import { Button, Panel } from "../components/lsm";

type AtlasMapPageProps = {
  bundle: RuntimeBundle;
  state: Extract<ViewState, { view: "atlas-map" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNode: (nodeId: string, from?: string) => void;
};

type AtlasView = "path" | "map" | "list";

function atlasView(value: string, focused: boolean): AtlasView {
  // "purpose"/"rmf" are legacy view ids: both are the Path view under a
  // different lens, so they resolve to "path" and keep old links working.
  if (value === "purpose" || value === "rmf") {
    return "path";
  }
  // Map draws the connections OF a selected record, so with no record it can
  // only ever be a dead end. A bookmarked or shared `?relationshipView=map`
  // link with no record resolves to Path instead of stranding the visitor.
  // List is unaffected: it renders the source inventory, which does not
  // depend on a selected record.
  if (value === "map" && !focused) {
    return "path";
  }
  if (["path", "map", "list"].includes(value)) {
    return value as AtlasView;
  }
  return "path";
}

// The lens is an entry choice carried in the route, not a view toggle.
function atlasLens(state: { relationshipView?: string; sourceView?: string }) {
  return state.relationshipView === "rmf" || state.sourceView === "rmf-lifecycle"
    ? "rmf"
    : "purpose";
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
  const compact = useCompactAtlas();
  const nodeId = useMemo(
    () => requestedNodeId(bundle, state.node),
    [bundle, state.node],
  );
  const view = atlasView(state.relationshipView, Boolean(nodeId));
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
    <Panel className="atlas-workspace">
      <header className="atlas-workspace-header">
        <div>
          <h1>
            {record
              ? `${record.center_node.metadata?.item_id || record.center_node.id} — ${record.center_node.metadata?.title || record.center_node.label || "Selected record"}`
              : "Control Atlas"}
          </h1>
          {!record ? (
            <p className="page-summary">
              Start with a question or lifecycle step, then open a record to see its published connections.
            </p>
          ) : null}
        </div>
      </header>

      <form className="atlas-map-command" onSubmit={submitSearch}>
        <label className="visually-hidden" htmlFor="atlas-search">
          Search this Atlas
        </label>
        <div className="search-input">
          <IconSearch aria-hidden="true" size={20} stroke={1.8} />
          <input
            aria-label="Search Atlas"
            id="atlas-search"
            onChange={(event) => setMapSearchDraft(event.target.value)}
            placeholder="Search this Atlas"
            type="search"
            value={mapSearchDraft}
          />
        </div>
        <button className="visually-hidden" type="submit">Search</button>
      </form>

      {/* No view switcher before a record exists: Map and List are views OF a
          chosen record. Offering them with nothing selected produced a
          dead-end that told the user to go choose a record. With no subject,
          this route's only job is helping them pick one. */}

      <div className="atlas-view-panel" id="atlas-view-panel">
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
          bundle={bundle}
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
    </Panel>
  );
}

function FocusedAtlas(props: {
  bundle: RuntimeBundle;
  compact: boolean;
  record: AtlasNeighborhoodRecord;
  state: AtlasMapPageProps["state"];
  view: AtlasView;
  patchAtlas: (patch: Partial<AtlasMapPageProps["state"]>) => void;
  onNavigate: AtlasMapPageProps["onNavigate"];
  onOpenNode: AtlasMapPageProps["onOpenNode"];
}) {
  const { bundle, record, state, view, patchAtlas, compact, onNavigate, onOpenNode } = props;
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
  const [selectedRow, setSelectedRow] = useState<AtlasRelationshipRow | null>(null);
  const inspectorRef = useRef<HTMLElement | null>(null);
  const centerLabel = record.center_node.metadata?.item_id || record.center_node.id;
  const centerTitle =
    record.center_node.metadata?.title || record.center_node.label || centerLabel;
  const inspectedId = selectedRow?.counterpart.id || record.center_node.id;
  const inspectedNode = bundle.runtime.getNode(inspectedId);
  const inspectedDocument = bundle.runtime.getLibraryDocument(inspectedId);
  const inspectedItemId =
    inspectedDocument?.item_id ||
    inspectedNode?.metadata?.item_id ||
    selectedRow?.itemId ||
    centerLabel;
  const inspectedTitle =
    inspectedDocument?.title ||
    inspectedNode?.metadata?.title ||
    selectedRow?.title ||
    centerTitle;
  const showInspectedTitle =
    inspectedTitle.trim().toLocaleLowerCase() !==
    inspectedItemId.trim().toLocaleLowerCase();
  const inspectedSynopsis =
    (inspectedDocument?.catalog_id === "disa-cci"
      ? inspectedDocument?.description
      : inspectedNode?.plain_language_summary ||
        inspectedDocument?.plain_language_summary) ||
    inspectedDocument?.description ||
    inspectedNode?.metadata?.description ||
    "No public synopsis is available for this record.";
  const inspectedAction = inspectedNode?.metadata?.plain_action || "";
  const selectedSource = selectedRow?.edge.source_refs?.[0];
  const selectedGroup = selectedRow
    ? groups.find((group) =>
        group.items.some(
          (item) =>
            item.edge.id === selectedRow.edge.id &&
            item.counterpart.id === selectedRow.counterpart.id,
        ),
      )
    : null;

  useEffect(() => {
    if (!selectedRow) return;
    const frame = window.requestAnimationFrame(() => {
      if (inspectorRef.current) {
        scrollElementBelowHeader(inspectorRef.current, "auto");
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedRow]);

  function updateFilters(patch: Partial<AtlasFilterState>) {
    setSelectedRow(null);
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

  function openSources(sourceId?: string) {
    onNavigate("sources", sourceId ? { source: sourceId } : undefined);
  }

  const boardView = view === "path";

  return (
    <div className="atlas-focused-shell">
      <div className="atlas-focused-toolbar">
        <div aria-label="Atlas views" className="atlas-view-tabs" role="tablist">
          {/* Three views of ONE record. The lens (Purpose vs RMF) is chosen
              once on entry and shown as a breadcrumb inside Path — it is not
              a fourth peer tab, because representation and ordering are
              different questions and stacking them read as a settings panel. */}
          {([
            ["path", "Path", IconRoute],
            ["map", "Map", IconMap],
            ["list", "List", IconListDetails],
          ] as const).map(([viewId, label, ViewIcon]) => (
            <button
              aria-controls="atlas-focused-view"
              aria-selected={view === viewId}
              className={view === viewId ? "active" : ""}
              id={`atlas-focused-tab-${viewId}`}
              key={viewId}
              onClick={() => {
                setSelectedRow(null);
                patchAtlas({ relationshipView: viewId, relationshipGroup: "" });
              }}
              onKeyDown={handleTabKeyDown}
              role="tab"
              tabIndex={view === viewId ? 0 : -1}
              type="button"
            >
              <ViewIcon aria-hidden="true" size={17} />
              {label}
            </button>
          ))}
        </div>
        <AtlasFilterBar filters={filters} onChange={updateFilters} options={options} />
      </div>

      {rows.length === 0 ? (
        <div
          aria-labelledby={`atlas-focused-tab-${view}`}
          id="atlas-focused-view"
          role="tabpanel"
        >
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
            onIncludeCandidates={() =>
              updateFilters({ includeCandidates: true })
            }
            onOpenRecord={() => onOpenNode(record.center_node.id, "atlas-map")}
            onSearch={() => onNavigate("search", { query: centerLabel })}
            onSources={() => onNavigate("sources")}
          />
        </div>
      ) : (
        <div
          aria-labelledby={`atlas-focused-tab-${view}`}
          className={`atlas-focused-layout${boardView ? " atlas-focused-layout--board" : ""}`}
          id="atlas-focused-view"
          role="tabpanel"
        >
          <section
            aria-label="Focused Atlas record"
            className="atlas-focused-main"
          >
            {boardView ? (
              <AtlasDecompositionBoard
                center={record.center_node}
                groups={groups}
                lens={atlasLens(state)}
                onContinueFrom={(node) => {
                  setSelectedRow(null);
                  patchAtlas({
                    node,
                    atlasStage: "",
                    relationshipGroup: "",
                    relationshipView: "path",
                  });
                }}
                onOpenDetail={(node) => onOpenNode(node, "atlas-map")}
                onOpenList={() => patchAtlas({ relationshipView: "list" })}
                onOpenSources={openSources}
                onSelect={setSelectedRow}
                onStageChange={(atlasStage) => patchAtlas({ atlasStage })}
                selectedItemId={selectedRow?.counterpart.id || ""}
                stageId={state.atlasStage}
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
                onSelectItem={setSelectedRow}
                selectedItemId={selectedRow?.counterpart.id || ""}
              />
            ) : null}

            {view === "list" ? (
              <RelationshipGraphTable
                conciseTrust
                onOpenNode={(node) =>
                  setSelectedRow(
                    rows.find((row) => row.counterpart.id === node) || null,
                  )
                }
                rows={rows}
              />
            ) : null}
          </section>

          {!boardView ? (
            <aside
              aria-atomic="true"
              aria-label={selectedRow ? `${inspectedItemId} record brief` : "Current record overview"}
              aria-live="polite"
              className={`atlas-record-inspector header-offset-target${selectedRow ? " atlas-record-inspector--selected" : ""}`}
              ref={inspectorRef}
            >
              <div className="atlas-inspector-heading">
                <p className="eyebrow">
                  {selectedRow
                    ? displayNameFor(
                        "object_type",
                        inspectedDocument?.object_type || inspectedNode?.node_type,
                      )
                    : "Current record"}
                </p>
                <h2>{inspectedItemId}</h2>
                {showInspectedTitle ? <p>{inspectedTitle}</p> : null}
              </div>

              <section className="atlas-inspector-synopsis">
                <h3>{selectedRow ? "What this record says" : "About this record"}</h3>
                <p>{inspectedSynopsis}</p>
                {inspectedAction ? (
                  <p>
                    <strong>What to do:</strong> {inspectedAction}
                  </p>
                ) : null}
              </section>

              {selectedRow ? (
                <>
                  <section>
                    <h3>Why it appears here</h3>
                    <p>{selectedRow.edge.plain_language_rationale}</p>
                  </section>
                  <section className="atlas-inspector-source">
                    <h3>Source basis</h3>
                    <p>
                      {displayNameFor("relationship_type", selectedRow.edge.relationship_type)} in {selectedGroup?.label || "this connection group"}.
                    </p>
                    <p>
                      {selectedSource?.source_id
                        ? displayNameFor("source", selectedSource.source_id)
                        : displayNameFor("provenance_class", selectedRow.edge.provenance_class)}
                      {selectedSource?.locator ? `, ${selectedSource.locator}` : ""}
                    </p>
                  </section>
                </>
              ) : (
                <p className="atlas-inspector-count">
                  <strong>{rows.length}</strong> related items across <strong>{groups.length}</strong> groups. Select an item to read it here.
                </p>
              )}

              <div className="atlas-inspector-actions">
                {selectedRow ? (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setSelectedRow(null);
                      patchAtlas({
                        node: selectedRow.counterpart.id,
                        atlasStage: "",
                        relationshipGroup: "",
                        relationshipSearch: "",
                      });
                    }}
                    type="button"
                  >
                    <IconMap aria-hidden="true" size={18} />
                    Explore from this record
                  </Button>
                ) : null}
                <Button
                  variant="secondary"
                  onClick={() => onOpenNode(inspectedId, "atlas-map")}
                  type="button"
                >
                  <IconExternalLink aria-hidden="true" size={18} />
                  Open full record
                </Button>
                {selectedRow ? (
                  <Button
                    variant="secondary-quiet"
                    onClick={() => openSources(selectedSource?.source_id)}
                    type="button"
                  >
                    <IconFolderOpen aria-hidden="true" size={18} />
                    View source
                  </Button>
                ) : null}
              </div>
            </aside>
          ) : null}
        </div>
      )}
    </div>
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

      {/* No "Map is unavailable" branch here by design: atlasView() resolves
          `map` to `path` whenever no record is selected, so this component can
          never be asked to render a Map it has no data for. */}
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
          {/* Title is the click target — twenty cards each repeating a
              "View source details" button and an "Official source" link was
              forty identical labels on one screen. One quiet external link
              stays; boilerplate disposition text stays gone (only cautionary
              dispositions carry information worth a line). */}
          <h3>
            <button
              className="card-title-action"
              onClick={() => props.onOpen(source.sourceId)}
              type="button"
            >
              {source.displayName}
            </button>
          </h3>
          {source.plainSummary ? (
            <p>{source.plainSummary}</p>
          ) : source.disposition === "supporting-reference-only" ||
            source.disposition === "draft-gated" ||
            source.disposition === "registry-only" ? (
            <p>{source.defaultMapReason}</p>
          ) : null}
          {source.canonicalUrl !== "registry-local-only" ? (
            <a
              className="support-meta"
              href={source.canonicalUrl}
              rel="noreferrer"
              target="_blank"
            >
              Official source
            </a>
          ) : null}
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
          <Button variant="primary" onClick={props.onClear} type="button">Clear filters</Button>
        ) : null}
        {!props.includeCandidates && props.candidateCount > 0 ? (
          <Button variant="secondary" onClick={props.onIncludeCandidates} type="button">
            Show {props.candidateCount} candidate links
          </Button>
        ) : null}
        <Button variant="secondary" onClick={props.onOpenRecord} type="button">Open record</Button>
        <Button variant="secondary" onClick={props.onSearch} type="button">Search Atlas</Button>
        <Button variant="secondary" onClick={props.onSources} type="button">View sources</Button>
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
        <Button variant="primary" onClick={props.onSearch} type="button">Search records</Button>
        <Button variant="secondary" onClick={props.onSources} type="button">View sources</Button>
      </div>
    </section>
  );
}
