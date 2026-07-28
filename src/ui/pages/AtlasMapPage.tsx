import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  IconBinaryTree,
  IconChevronRight,
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
import { WhereThisSitsRail } from "../components/WhereThisSitsRail";
import {
  atlasFilterOptions,
  buildAtlasGroups,
  buildAtlasRows,
  type AtlasFilterState,
  type AtlasRelationshipRow,
} from "../lib/atlasModel";
import {
  buildAtlasDrilldownModel,
  NIST_FRAMEWORK_ID,
} from "../lib/atlasDrilldown";
import { resolveAtlasSearchTransition } from "../lib/atlasSearch";
import { scrollElementBelowHeader } from "../lib/pagePrimitives";
import { relationshipExplanation } from "../lib/relationshipProvenance";
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
  onRequestFullGraph: () => void;
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
  const {
    bundle,
    state,
    onNavigate,
    onOpenNode,
    onRequestFullGraph,
  } = props;
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
  const [searchAnnouncement, setSearchAnnouncement] = useState("");
  const [noMatchQuery, setNoMatchQuery] = useState("");

  useEffect(() => {
    setMapSearchDraft(state.relationshipSearch || "");
  }, [state.relationshipSearch]);

  useEffect(() => {
    if (!nodeId && !bundle.graphReady) {
      onRequestFullGraph();
    }
  }, [bundle.graphReady, nodeId, onRequestFullGraph]);

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
    const transition = resolveAtlasSearchTransition(bundle.runtime, query);
    setSearchAnnouncement(transition.announcement);
    if (transition.kind === "search") {
      onNavigate("search", { query: transition.query });
      return;
    }
    if (transition.kind === "no-match") {
      setNoMatchQuery(transition.query);
      return;
    }
    setNoMatchQuery("");
    patchAtlas({
      node: transition.nodeId,
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
              Choose a framework or process, then open published records and
              relationships as your question becomes more specific.
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
      <span
        aria-atomic="true"
        className="visually-hidden"
        role="status"
      >
        {searchAnnouncement}
      </span>
      {noMatchQuery ? (
        <div className="atlas-search-recovery">
          <p>
            No Atlas record matches <strong>{noMatchQuery}</strong>.
          </p>
          <div className="card-actions">
            <Button
              variant="secondary"
              onClick={() => onNavigate("search", { query: noMatchQuery })}
              type="button"
            >
              Search all records
            </Button>
            <Button
              variant="secondary"
              onClick={() => onNavigate("browse")}
              type="button"
            >
              Browse the Catalog
            </Button>
          </div>
        </div>
      ) : null}

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
      ) : recordStatus === "idle" && bundle.graphReady ? (
        <AtlasGuidedPath
          bundle={bundle}
          onNavigate={onNavigate}
          onOpenNode={onOpenNode}
          patchAtlas={patchAtlas}
          state={state}
        />
      ) : recordStatus === "idle" ? (
        <div className="atlas-loading" role="status">
          <div aria-hidden="true" className="atlas-loading-block" />
          Preparing the Atlas relationship map…
        </div>
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
    inspectedDocument?.description ||
    inspectedNode?.metadata?.description ||
    "No narrative description was published for this record.";
  const selectedSource = selectedRow?.edge.source_refs?.[0];
  const choiceLabels = [
    state.atlasFramework
      ? bundle.runtime.getNode(`${state.atlasFramework}:CATALOG`)?.metadata
          ?.title ||
        bundle.runtime.getNode(`${state.atlasFramework}:CATALOG`)?.label ||
        state.atlasFramework
      : "",
    state.atlasBaseline
      ? state.atlasBaseline === "all"
        ? "All records"
        : bundle.runtime.getNode(state.atlasBaseline)?.metadata?.title ||
          bundle.runtime.getNode(state.atlasBaseline)?.label ||
          state.atlasBaseline
      : "",
    state.atlasFamily
      ? bundle.runtime.getNode(state.atlasFamily)?.metadata?.title ||
        bundle.runtime.getNode(state.atlasFamily)?.label ||
        state.atlasFamily
      : "",
  ].filter(Boolean);
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
      <section className="atlas-structural-position">
        <p className="eyebrow">Structural position</p>
        <h2>Where this sits</h2>
        <WhereThisSitsRail
          bundle={bundle}
          links={
            record.structural_path.length > 1 ||
            record.center_node.node_type === "catalog"
              ? record.structural_path
              : undefined
          }
          nodeId={record.center_node.id}
          onOpenNode={(node) => patchAtlas({ node, atlasStage: "" })}
        />
        {choiceLabels.length ? (
          <nav aria-label="Your choices" className="atlas-choice-trail">
            <strong>Your choices</strong>
            <span>{choiceLabels.join(" > ")}</span>
          </nav>
        ) : null}
      </section>
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
                centerNodeId={record.center_node.id}
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
                <h3>Official description</h3>
                <p>{inspectedSynopsis}</p>
              </section>

              {selectedRow ? (
                <>
                  <section>
                    <h3>{relationshipExplanation(selectedRow.edge).label}</h3>
                    <p>{relationshipExplanation(selectedRow.edge).text}</p>
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

function AtlasGuidedPath(props: {
  bundle: RuntimeBundle;
  state: AtlasMapPageProps["state"];
  patchAtlas: (patch: Partial<AtlasMapPageProps["state"]>) => void;
  onNavigate: AtlasMapPageProps["onNavigate"];
  onOpenNode: AtlasMapPageProps["onOpenNode"];
}) {
  const { bundle, state, patchAtlas, onNavigate, onOpenNode } = props;
  const [recordFilter, setRecordFilter] = useState("");
  const model = useMemo(
    () => buildAtlasDrilldownModel(bundle.runtime.dataset),
    [bundle.runtime.dataset],
  );
  const frameworks = model.frameworkGroups.flatMap((group) => group.frameworks);
  const axis =
    state.atlasAxis ||
    (state.sourceView === "rmf" ||
    state.sourceView === "rmf-lifecycle" ||
    state.relationshipView === "rmf"
      ? "process"
      : "");
  const framework = frameworks.find(
    (choice) => choice.id === state.atlasFramework,
  );
  const baseline = model.baselines.find(
    (choice) => choice.id === state.atlasBaseline,
  );
  const frameworkUnits = useMemo(() => {
    if (!framework) return [];
    if (framework.id !== NIST_FRAMEWORK_ID || state.atlasBaseline === "all") {
      return framework.units;
    }
    if (!baseline) return framework.units;
    const selectedByUnit = new Map(
      baseline.families.map((unit) => [unit.id, unit.records]),
    );
    return framework.units
      .map((unit) => ({
        ...unit,
        records: selectedByUnit.get(unit.id) || [],
      }))
      .filter((unit) => unit.records.length > 0);
  }, [baseline, framework, state.atlasBaseline]);
  const family = frameworkUnits.find(
    (choice) => choice.id === state.atlasFamily,
  );
  const rmfStep = model.rmfSteps.find(
    (choice) => choice.id === state.atlasRmfStep,
  );

  const choiceLinks = useMemo(() => {
    const links = [
      { id: "atlas:root", label: "Explore" },
    ];
    if (axis === "framework") {
      if (framework) {
        links.push({
          id: `framework:${framework.id}`,
          label: framework.label,
        });
      }
      if (state.atlasBaseline) {
        links.push({
          id: `baseline:${state.atlasBaseline}`,
          label:
            state.atlasBaseline === "all"
              ? "All records"
              : baseline?.label || state.atlasBaseline,
        });
      }
      if (family) {
        links.push({
          id: `family:${family.id}`,
          label: family.label,
        });
      }
    }
    if (axis === "process") {
      links.push({
        id: "process:rmf",
        label: "Risk Management Framework",
      });
      if (rmfStep) {
        links.push({
          id: `rmf-step:${rmfStep.id}`,
          label: rmfStep.itemId.replace("RMF-", ""),
        });
      }
    }
    return links;
  }, [axis, baseline, family, framework, rmfStep, state.atlasBaseline]);

  function resetDrill(patch: Partial<AtlasMapPageProps["state"]>) {
    patchAtlas({
      atlasAxis: "",
      atlasFramework: "",
      atlasBaseline: "",
      atlasFamily: "",
      atlasRmfStep: "",
      node: "",
      ...patch,
    });
  }

  function openAncestor(id: string) {
    if (id === "atlas:root") {
      resetDrill({});
      return;
    }
    if (id.startsWith("framework:")) {
      resetDrill({
        atlasAxis: "framework",
        atlasFramework: id.slice("framework:".length),
      });
      return;
    }
    if (id.startsWith("baseline:")) {
      patchAtlas({
        atlasBaseline: id.slice("baseline:".length),
        atlasFamily: "",
      });
      return;
    }
    if (id.startsWith("family:")) {
      patchAtlas({ atlasFamily: id.slice("family:".length) });
      return;
    }
    if (id === "process:rmf") {
      resetDrill({ atlasAxis: "process" });
    }
  }

  const filteredRecords = family
    ? family.records.filter((record) => {
        const query = recordFilter.trim().toLowerCase();
        return (
          !query ||
          record.itemId.toLowerCase().includes(query) ||
          record.label.toLowerCase().includes(query)
        );
      })
    : [];

  return (
    <section className="atlas-ancestry">
      <ChoiceTrail links={choiceLinks} onOpen={openAncestor} />

      {!axis ? (
        <>
          <p className="atlas-path-prompt">What do you want to trace?</p>
          <div className="atlas-ancestry-choice-grid">
            <button
              className="atlas-ancestry-choice"
              onClick={() =>
                resetDrill({
                  atlasAxis: "framework",
                })
              }
              type="button"
            >
              <IconBinaryTree aria-hidden="true" size={24} />
              <span>
                <strong>A framework path</strong>
                <small>Framework → native groups → records</small>
              </span>
              <IconChevronRight aria-hidden="true" size={20} />
            </button>
            <button
              className="atlas-ancestry-choice"
              onClick={() => resetDrill({ atlasAxis: "process" })}
              type="button"
            >
              <IconRoute aria-hidden="true" size={24} />
              <span>
                <strong>The RMF process</strong>
                <small>Lifecycle step → published results</small>
              </span>
              <IconChevronRight aria-hidden="true" size={20} />
            </button>
            <button
              className="atlas-ancestry-choice"
              onClick={() => onNavigate("start-here")}
              type="button"
            >
              <IconSearch aria-hidden="true" size={24} />
              <span>
                <strong>My situation</strong>
                <small>Answer three questions for a starting point</small>
              </span>
              <IconChevronRight aria-hidden="true" size={20} />
            </button>
          </div>
        </>
      ) : null}

      {axis === "framework" && !framework ? (
        <>
          <p className="atlas-path-prompt">
            Which supported framework do you want to trace?
          </p>
          <ul className="atlas-path-stage-list">
            {model.frameworkGroups.flatMap((group) =>
              group.frameworks.map((choice) => (
                <li key={choice.id}>
                  <button
                    className="atlas-path-stage-option"
                    onClick={() =>
                      patchAtlas({
                        atlasFramework: choice.id,
                        atlasBaseline: "",
                        atlasFamily: "",
                      })
                    }
                    type="button"
                  >
                    <IconBinaryTree aria-hidden="true" size={20} />
                    <span className="atlas-path-stage-option-text">
                      <strong>{choice.label}</strong>
                      <small>
                        {group.label}: {group.description}
                      </small>
                    </span>
                    <IconChevronRight aria-hidden="true" size={20} />
                  </button>
                </li>
              )),
            )}
          </ul>
        </>
      ) : null}

      {axis === "framework" &&
      framework?.id === NIST_FRAMEWORK_ID &&
      !state.atlasBaseline ? (
        <>
          <p className="atlas-path-prompt">
            Which applicability scope do you want to use?
          </p>
          <ul className="atlas-path-stage-list">
            <li>
              <button
                className="atlas-path-stage-option"
                onClick={() =>
                  patchAtlas({ atlasBaseline: "all", atlasFamily: "" })
                }
                type="button"
              >
                <IconBinaryTree aria-hidden="true" size={20} />
                <span className="atlas-path-stage-option-text">
                  <strong>All SP 800-53 records</strong>
                  <small>No baseline filter</small>
                </span>
                <IconChevronRight aria-hidden="true" size={20} />
              </button>
            </li>
            {model.baselines.map((choice) => (
              <li key={choice.id}>
                <button
                  className="atlas-path-stage-option"
                  onClick={() =>
                    patchAtlas({
                      atlasBaseline: choice.id,
                      atlasFamily: "",
                    })
                  }
                  type="button"
                >
                  <IconBinaryTree aria-hidden="true" size={20} />
                  <span className="atlas-path-stage-option-text">
                    <strong>{choice.itemId} impact</strong>
                    <small>
                      {choice.recordCount} controls across {choice.families.length} families
                    </small>
                  </span>
                  <IconChevronRight aria-hidden="true" size={20} />
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {axis === "framework" &&
      framework &&
      (framework.id !== NIST_FRAMEWORK_ID || state.atlasBaseline) &&
      !family ? (
        <>
          <p className="atlas-path-prompt">
            Which part of this framework do you want to open?
          </p>
          <div className="atlas-ancestry-family-grid">
            {frameworkUnits.map((choice) => (
              <button
                className="atlas-ancestry-family"
                key={choice.id}
                onClick={() =>
                  choice.records.length
                    ? patchAtlas({ atlasFamily: choice.id })
                    : patchAtlas({
                        node: choice.id,
                        relationshipGroup: "",
                        relationshipView: "path",
                      })
                }
                type="button"
              >
                <span>
                  <strong>{choice.itemId}</strong>
                  <small>{choice.label}</small>
                </span>
                <span>{choice.records.length}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}

      {axis === "framework" && family ? (
        <>
          <div className="atlas-ancestry-record-header">
            <div>
              <p className="eyebrow">{family.itemId} family</p>
              <h2>{family.label}</h2>
              <p>
                {family.records.length} structural child
                {family.records.length === 1 ? "" : "ren"}
                {state.atlasBaseline && state.atlasBaseline !== "all"
                  ? " selected by this applicability scope."
                  : "."}
              </p>
            </div>
            <label>
              Filter this family
              <input
                onChange={(event) => setRecordFilter(event.target.value)}
                placeholder="ID or title"
                type="search"
                value={recordFilter}
              />
            </label>
          </div>
          <ul className="atlas-path-record-list">
            {filteredRecords.map((record) => (
              <li key={record.id}>
                <button
                  className="atlas-path-record"
                  onClick={() =>
                    patchAtlas({
                      node: record.id,
                      relationshipGroup: "",
                      relationshipView: "path",
                    })
                  }
                  type="button"
                >
                  <span className="atlas-path-record-text">
                    <strong>{record.itemId}</strong>
                    <small>{record.label}</small>
                  </span>
                  <IconChevronRight aria-hidden="true" size={20} />
                </button>
              </li>
            ))}
          </ul>
          {!filteredRecords.length ? (
            <p className="muted">No structural children match that filter.</p>
          ) : null}
        </>
      ) : null}

      {axis === "process" && !rmfStep ? (
        <>
          <p className="atlas-path-prompt">
            Which Risk Management Framework step are you working in?
          </p>
          <ol className="atlas-rmf-step-list">
            {model.rmfSteps.map((step, index) => (
              <li key={step.id}>
                <button
                  className="atlas-ancestry-choice"
                  onClick={() => patchAtlas({ atlasRmfStep: step.id })}
                  type="button"
                >
                  <span className="atlas-rmf-step-number">{index + 1}</span>
                  <span>
                    <strong>{step.itemId.replace("RMF-", "")}</strong>
                    <small>{step.label}</small>
                  </span>
                  <IconChevronRight aria-hidden="true" size={20} />
                </button>
              </li>
            ))}
          </ol>
        </>
      ) : null}

      {axis === "process" && rmfStep ? (
        <div className="atlas-rmf-results">
          <header>
            <p className="eyebrow">Published relationships</p>
            <h2>{rmfStep.label}</h2>
            <p>
              These are the records the public graph directly connects to this
              step. A program may require additional work products.
            </p>
          </header>
          {rmfStep.results.length ? (
            <ul className="atlas-path-record-list">
              {rmfStep.results.map((result) => (
                <li key={`${result.id}:${result.relationshipType}`}>
                  <button
                    className="atlas-path-record"
                    onClick={() => onOpenNode(result.id, "atlas-map")}
                    type="button"
                  >
                    <span className="atlas-path-record-text">
                      <strong>{result.itemId}</strong>
                      <small>{result.label}</small>
                    </span>
                    <span className="badge tone-applicability">
                      {displayNameFor("relationship_type", result.relationshipType)}
                    </span>
                    <IconChevronRight aria-hidden="true" size={20} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">
              No direct published result is mapped to this step yet.
            </p>
          )}
          <aside className="atlas-rmf-template-note">
            <div>
              <strong>Need a document or work product?</strong>
              <p>
                Choose from the Word and Excel templates based on your program,
                not an invented one-template-per-step rule.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => onNavigate("templates")}
              type="button"
            >
              Browse templates
            </Button>
          </aside>
        </div>
      ) : null}
    </section>
  );
}

function ChoiceTrail(props: {
  links: Array<{ id: string; label: string }>;
  onOpen: (id: string) => void;
}) {
  return (
    <nav aria-label="Your choices" className="atlas-choice-trail">
      <strong>Your choices</strong>
      {props.links.map((link, index) => (
        <span key={link.id}>
          {index > 0 ? (
            <IconChevronRight aria-hidden="true" size={15} />
          ) : null}
          {index === props.links.length - 1 ? (
            <span>{link.label}</span>
          ) : (
            <button onClick={() => props.onOpen(link.id)} type="button">
              {link.label}
            </button>
          )}
        </span>
      ))}
    </nav>
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
