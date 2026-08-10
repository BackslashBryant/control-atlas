import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  IconBinaryTree,
  IconChevronRight,
  IconFolderOpen,
  IconListDetails,
  IconMap,
  IconRoute,
  IconSearch,
} from "@tabler/icons-react";

import { displayNameFor } from "../../app/display-names.mjs";
import {
  AtlasTree,
  benchmarkChildrenFromNeighborhood,
} from "../components/AtlasTree";
import { CanonicalBreadcrumb } from "../components/CanonicalBreadcrumb";
import { RelationshipGraphTable } from "../components/RelationshipGraphTable";
import { WhereThisSitsRail } from "../components/WhereThisSitsRail";
import {
  ATLAS_RELATIONSHIP_LENSES,
  atlasFilterOptions,
  buildAtlasGroups,
  buildAtlasRows,
  buildStructuralChildren,
  type AtlasFilterState,
  type AtlasRelationshipRow,
} from "../lib/atlasModel";
import {
  buildAtlasBootstrapModel,
  buildAtlasDrilldownModel,
  hydrateAtlasFrameworkRecords,
  type AtlasDrilldownModel,
  NIST_FRAMEWORK_ID,
} from "../lib/atlasDrilldown";
import { catalogProfileFor } from "../lib/catalogProfiles";
import { resolveAtlasSearchTransition } from "../lib/atlasSearch";
import { PageHeader, scrollElementBelowHeader } from "../lib/pagePrimitives";
import { relationshipExplanation } from "../lib/relationshipProvenance";
import {
  loadAtlasNeighborhood,
  type AtlasNeighborhoodRecord,
  type RuntimeBundle,
} from "../lib/runtimeLoader";
import { nodeIdFromItemId, type ViewState } from "../lib/viewState";
import { officialTextPreview } from "../lib/officialText";
import { recordDisplayTitle } from "../lib/recordTitle";

import { Button, Panel } from "../components/lsm";
import { AppLink, shouldInterceptAppLink } from "../components/AppLink";
import { RecordLink } from "../components/RecordLink";

type AtlasMapPageProps = {
  bundle: RuntimeBundle;
  state: Extract<ViewState, { view: "atlas-map" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNode: (nodeId: string) => void;
};

type AtlasView = "path" | "map" | "list";

function atlasView(value: string, focused: boolean): AtlasView {
  // "purpose"/"rmf" are legacy view ids: both opened the hierarchy under a
  // different lens, so they resolve to "path" and keep old links working.
  if (value === "purpose" || value === "rmf") {
    return "path";
  }
  // Map draws the connections OF a selected record, so with no record it can
  // only ever be a dead end. A bookmarked or shared `?relationshipView=map`
  // link with no record resolves to the board instead of stranding the
  // visitor. List is unaffected: it renders the source inventory, which does
  // not depend on a selected record.
  if (value === "map" && !focused) {
    return "path";
  }
  if (["path", "map", "list"].includes(value)) {
    return value as AtlasView;
  }
  // A focused record opens on Connections with both panels closed — that is
  // the workspace. Only an explicit ?relationshipView=path|list opens one.
  return focused ? "map" : "path";
}

function requestedNodeId(bundle: RuntimeBundle, rawNode: string) {
  const node = rawNode.trim();
  if (!node || node === "foundation" || node === "landscape") return "";
  if (node.startsWith("hierarchy:")) return "";
  const resolved = nodeIdFromItemId(bundle.runtime, node);
  if (resolved) return resolved;
  return node.includes(":") ? node : "";
}

function focusedAtlasTitle(record: AtlasNeighborhoodRecord) {
  return recordDisplayTitle(record.center_node) || "Selected record";
}

export function AtlasMapPage(props: AtlasMapPageProps) {
  const {
    bundle,
    state,
    onNavigate,
    onOpenNode,
  } = props;
  const nodeId = useMemo(
    () => requestedNodeId(bundle, state.node),
    [bundle, state.node],
  );
  const view = atlasView(state.relationshipView, Boolean(nodeId));
  const [record, setRecord] = useState<AtlasNeighborhoodRecord | null>(null);
  const [recordStatus, setRecordStatus] = useState<
    "idle" | "loading" | "ready" | "missing" | "error"
  >(nodeId ? "loading" : "idle");
  const [benchmarkRecord, setBenchmarkRecord] =
    useState<AtlasNeighborhoodRecord | null>(null);
  const [benchmarkStatus, setBenchmarkStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >(state.atlasBenchmark ? "loading" : "idle");
  const [mapSearchDraft, setMapSearchDraft] = useState(
    state.relationshipSearch || "",
  );
  const [searchAnnouncement, setSearchAnnouncement] = useState("");
  const [noMatchQuery, setNoMatchQuery] = useState("");

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
        startTransition(() => {
          setRecord(nextRecord);
          setRecordStatus(nextRecord ? "ready" : "missing");
        });
      })
      .catch(() => {
        if (!cancelled) setRecordStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [nodeId]);

  useEffect(() => {
    let cancelled = false;
    setBenchmarkRecord(null);
    if (!state.atlasBenchmark) {
      setBenchmarkStatus("idle");
      return () => {
        cancelled = true;
      };
    }
    setBenchmarkStatus("loading");
    loadAtlasNeighborhood(state.atlasBenchmark)
      .then((nextRecord) => {
        if (cancelled) return;
        startTransition(() => {
          setBenchmarkRecord(nextRecord);
          setBenchmarkStatus(nextRecord ? "ready" : "error");
        });
      })
      .catch(() => {
        if (!cancelled) setBenchmarkStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [state.atlasBenchmark]);

  useEffect(() => {
    if (!record) return;
    const progressiveTitle = document.querySelector<HTMLElement>(
      "[data-static-route-title]",
    );
    if (progressiveTitle) {
      progressiveTitle.textContent = focusedAtlasTitle(record);
    }
  }, [record]);

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
    <Panel
      className="atlas-workspace"
      data-visual-identity="technical-cartography"
      data-route-content-ready={
        recordStatus === "loading" ? "false" : "true"
      }
    >
      <PageHeader
        eyebrow={record ? (
          bundle.runtime
            .getCatalogs()
            .find(
              (catalog: any) =>
                catalog.id === record.center_node.metadata?.catalog_id,
            )?.name ||
          bundle.runtime.getSource(record.center_node.source_id)?.display_name ||
          record.center_node.metadata?.catalog_id ||
          ""
        ) : undefined}
        primary
        summary={record ? officialTextPreview(
          bundle.runtime.getLibraryDocument(record.center_node.id)?.description ||
            "No narrative description was published for this record.",
          160,
        ).preview : "See the full cyber landscape, then zoom into an area, publication, or record."}
        title={record ? (
          <RecordLink
            className="atlas-record-title-link"
            nodeId={record.center_node.id}
            onOpenNode={onOpenNode}
          >
            {focusedAtlasTitle(record)}
          </RecordLink>
        ) : "Atlas map"}
      />

      <form className="atlas-map-command" onSubmit={submitSearch}>
        <label className="visually-hidden" htmlFor="atlas-search">
          Jump to another record
        </label>
        <div className="search-input">
          <IconSearch aria-hidden="true" size={20} stroke={1.8} />
          <input
            aria-label="Jump to another record"
            id="atlas-search"
            name="query"
            onChange={(event) => setMapSearchDraft(event.target.value)}
            placeholder="Jump to another record"
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
            <AppLink onNavigate={onNavigate} patch={{ query: noMatchQuery }} variant="secondary" view="search">
              Search all records
            </AppLink>
            <AppLink onNavigate={onNavigate} variant="secondary" view="search">
              Browse the Catalog
            </AppLink>
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
          onNavigate={onNavigate}
          query={state.node}
        />
      ) : null}

      {record ? (
        <FocusedAtlas
          bundle={bundle}
          benchmarkRecord={benchmarkRecord}
          onNavigate={onNavigate}
          onOpenNode={onOpenNode}
          patchAtlas={patchAtlas}
          record={record}
          state={state}
          view={view}
        />
      ) : recordStatus === "idle" && bundle.routeReady ? (
        <AtlasGuidedPath
          bundle={bundle}
          benchmarkRecord={benchmarkRecord}
          onNavigate={onNavigate}
          onOpenNode={onOpenNode}
          patchAtlas={patchAtlas}
          state={state}
        />
      ) : recordStatus === "idle" ? (
        <div className="atlas-loading" role="status">
          <div aria-hidden="true" className="atlas-loading-block" />
          Preparing the Atlas map…
        </div>
      ) : null}
      {benchmarkStatus === "error" ? (
        <p className="atlas-load-inline-error" role="alert">
          This benchmark branch could not be loaded. Choose another technology or return to the Atlas map overview.
        </p>
      ) : null}
      </div>
    </Panel>
  );
}

function FocusedAtlas(props: {
  bundle: RuntimeBundle;
  benchmarkRecord: AtlasNeighborhoodRecord | null;
  record: AtlasNeighborhoodRecord;
  state: AtlasMapPageProps["state"];
  view: AtlasView;
  patchAtlas: (patch: Partial<AtlasMapPageProps["state"]>) => void;
  onNavigate: AtlasMapPageProps["onNavigate"];
  onOpenNode: AtlasMapPageProps["onOpenNode"];
}) {
  const { bundle, benchmarkRecord, record, state, view, patchAtlas, onNavigate, onOpenNode } = props;
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
  // List must never disagree with Map about what class a record belongs to
  // (a CCI reads "Correlation" in both, never "Implementation" in one and
  // "Correlation" in the other) — derive the label from the same groups.
  const lensLabelByEdgeId = useMemo(() => {
    const labelByLens = new Map(
      ATLAS_RELATIONSHIP_LENSES.map((lens) => [lens.id, lens.label] as const),
    );
    const map = new Map<string, string>();
    for (const group of groups) {
      const label = labelByLens.get(group.lens);
      if (!label) continue;
      for (const item of group.items) map.set(item.edge.id, label);
    }
    return map;
  }, [groups]);
  const listRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        lensLabel: lensLabelByEdgeId.get(row.edge.id),
      })),
    [rows, lensLabelByEdgeId],
  );
  const options = useMemo(() => atlasFilterOptions(record), [record]);
  const structuralChildren = useMemo(
    () => buildStructuralChildren(record),
    [record],
  );
  const [selectedRow, setSelectedRow] = useState<AtlasRelationshipRow | null>(null);
  const inspectorRef = useRef<HTMLElement | null>(null);
  const centerLabel = record.center_node.metadata?.item_id || record.center_node.id;
  // Publication name, never the raw catalog id: `NIST-800-53` is a slug, and
  // the eyebrow printed it verbatim until the catalog lookup was added.
  const centerCatalogId = record.center_node.metadata?.catalog_id || "";
  const centerPublication =
    bundle.runtime
      .getCatalogs()
      .find((catalog: any) => catalog.id === centerCatalogId)?.name ||
    bundle.runtime.getSource(record.center_node.source_id)?.display_name ||
    bundle.runtime.getSource(record.center_node.source_id)?.name ||
    centerCatalogId;
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
  const inspectedSynopsisPreview = officialTextPreview(inspectedSynopsis);
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

  const boardView = false;
  // The record workspace always shows Connections. relationshipView now
  // selects which supporting panel is open, so old deep links still resolve.
  const hierarchyOpen = view === "path";
  const listOpen = view === "list";

  // One definition, rendered in exactly one place: it is the Path view's own
  // content, and on Map and List it sits in the header so the record's
  // position never leaves the screen. Rendering both duplicated the landmark.
  const structuralPosition = (
    <section className="atlas-structural-position">
      {/* Not "Control Atlas structure" — WhereThisSitsRail badges only the
          organizing hops it actually derived; the rest of this path
          (catalog family onward) is the publisher's own declared hierarchy,
          and a blanket eyebrow claiming the whole path is Control Atlas's
          own would contradict that per-crumb distinction. */}
      <h2 className="atlas-path-heading">Where this sits</h2>
      <WhereThisSitsRail
        bundle={bundle}
        links={
          record.structural_path.length > 1 ||
          record.center_node.node_type === "catalog"
            ? record.structural_path
            : undefined
        }
        nodeId={record.center_node.id}
        onOpenNode={(node) =>
          patchAtlas({ node, atlasStage: "", relationshipGroup: "" })
        }
      />
      {choiceLabels.length ? (
        <nav aria-label="Your choices" className="atlas-choice-trail">
          <strong>Your choices</strong>
          <span>{choiceLabels.join(" > ")}</span>
        </nav>
      ) : null}
    </section>
  );

  return (
    <div className="atlas-focused-shell">
      <CanonicalBreadcrumb bundle={bundle} nodeId={record.center_node.id} />
      {/* One record workspace, not three competing modes. Connections is the
          product; Hierarchy and the complete list are supporting panels.
          relationshipView still round-trips through the URL so every existing
          ?relationshipView=path|list deep link keeps working — it now decides
          which panel opens, not which product you get. */}
      <div className="atlas-focused-toolbar">
        <h2 className="atlas-workspace-heading">Connections</h2>
        <div className="atlas-workspace-controls">
          <button
            aria-controls="atlas-hierarchy-panel"
            aria-expanded={hierarchyOpen}
            className={hierarchyOpen ? "atlas-panel-toggle active" : "atlas-panel-toggle"}
            onClick={() =>
              patchAtlas({ relationshipView: hierarchyOpen ? "map" : "path" })
            }
            type="button"
          >
            <IconRoute aria-hidden="true" size={17} />
            Hierarchy
          </button>
          <button
            aria-controls="atlas-all-connections"
            aria-expanded={listOpen}
            className={listOpen ? "atlas-panel-toggle active" : "atlas-panel-toggle"}
            onClick={() =>
              patchAtlas({ relationshipView: listOpen ? "map" : "list" })
            }
            type="button"
          >
            <IconListDetails aria-hidden="true" size={17} />
            View all
          </button>
          <AtlasFilterBar filters={filters} onChange={updateFilters} options={options} />
        </div>
      </div>

      {bundle.atlasSpine ? (
        <AtlasTree
          areaId={state.atlasLimb}
          benchmarkChildren={benchmarkChildrenFromNeighborhood(benchmarkRecord)}
          benchmarkId={state.atlasBenchmark}
          catalogSummaries={bundle.catalogSummaries || []}
          focusedRecord={record}
          focusPath={record.structural_path}
          onOpenArea={(atlasLimb) =>
            patchAtlas({
              atlasAxis: "landscape",
              atlasLimb,
              atlasFramework: "",
              atlasFamily: "",
              atlasBenchmark: "",
              node: "",
            })
          }
          onOpenCompare={() => onNavigate("matrix", { source: centerCatalogId })}
          onOpenPublication={(atlasLimb, atlasFramework) =>
            patchAtlas({
              atlasAxis: "framework",
              atlasLimb,
              atlasFramework,
              atlasFamily: "",
              atlasBenchmark: "",
              node: "",
            })
          }
          onOpenSummary={(atlasFamily) =>
            patchAtlas({ atlasFamily, atlasBenchmark: "", node: "" })
          }
          onReset={() =>
            patchAtlas({
              atlasAxis: "",
              atlasLimb: "",
              atlasFramework: "",
              atlasFamily: "",
              atlasBenchmark: "",
              node: "",
            })
          }
          onSelectBenchmark={(atlasBenchmark) =>
            patchAtlas({ atlasBenchmark, atlasFamily: "", node: "" })
          }
          publicationId={state.atlasFramework}
          spine={bundle.atlasSpine}
          summaryId={state.atlasFamily}
        />
      ) : (
        <p role="alert">The Atlas map structure is unavailable. Reload the page to try again.</p>
      )}

      {rows.length === 0 ? (
        <div id="atlas-focused-view">
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
            onNavigate={onNavigate}
            query={centerLabel}
          />
        </div>
      ) : (
        <div className="atlas-focused-layout" id="atlas-focused-view">
          <section
            aria-label="Focused Atlas record"
            className="atlas-focused-main"
          >
            {hierarchyOpen ? (
              <section className="atlas-path-summary" id="atlas-hierarchy-panel">
                {/* No single eyebrow here: the chain below mixes Control
                    Atlas structure and publisher-declared hierarchy, and a
                    blanket "publisher-declared" claim over the whole thing
                    would be false. WhereThisSitsRail renders each as its own
                    labeled rail instead.
                    centerLabel was here too: the record's name is already the
                    page H1 and the last crumb of the chain below. */}
                {structuralPosition}

                <dl className="atlas-path-facts">
                  <div>
                    <dt>Record type</dt>
                    <dd>
                      {displayNameFor(
                        "object_type",
                        record.center_node.node_type,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Publication</dt>
                    <dd>{centerPublication}</dd>
                  </div>
                  <div>
                    <dt>Identifier</dt>
                    <dd>{centerLabel}</dd>
                  </div>
                </dl>

                <section
                  aria-labelledby="atlas-path-children"
                  className="atlas-path-children"
                >
                  <h3 id="atlas-path-children">Decomposes into</h3>
                  {structuralChildren.length ? (
                    <>
                      <ul className="atlas-path-child-list">
                        {structuralChildren.map((child) => (
                          <li key={child.id}>
                            <AppLink
                              onNavigate={onNavigate}
                              patch={{ ...state, node: child.id, atlasStage: "", relationshipGroup: "" }}
                              title={child.title}
                              view="atlas-map"
                            >
                              {child.itemId}
                            </AppLink>
                          </li>
                        ))}
                      </ul>
                      <p className="muted">
                        {structuralChildren.length} published child record
                        {structuralChildren.length === 1 ? "" : "s"}.
                      </p>
                    </>
                  ) : (
                    <p className="muted">
                      The publisher does not break this record into smaller
                      parts.
                    </p>
                  )}
                </section>

                <div className="card-actions atlas-path-actions">
                  <Button
                    onClick={() => patchAtlas({ relationshipView: "map" })}
                    type="button"
                    variant="primary"
                  >
                    See connections
                  </Button>
                  <AppLink onNavigate={onNavigate} patch={{ source: record.center_node.source_id }} variant="secondary" view="sources">
                    Review official source
                  </AppLink>
                </div>
              </section>
            ) : null}

            {/* The complete relationship set. It supports the map instead of
                competing with it, and stays the accessible DOM equivalent:
                same rows, same class labels, same counts, same filters. */}
            <section
              className="atlas-all-connections"
              id="atlas-all-connections"
            >
              {listOpen ? (
                <RelationshipGraphTable
                  centerNodeId={record.center_node.id}
                  conciseTrust
                  onOpenNode={(node) =>
                    setSelectedRow(
                      rows.find((row) => row.counterpart.id === node) || null,
                    )
                  }
                  rows={listRows}
                />
              ) : (
                <button
                  className="atlas-all-connections-toggle"
                  onClick={() => patchAtlas({ relationshipView: "list" })}
                  type="button"
                >
                  View all {rows.length} connections
                </button>
              )}
            </section>

            {/* Published children stay on the workspace: they are the record's
                own decomposition, not a connection. */}
            {structuralChildren.length ? (
              <section className="atlas-workspace-children">
                <h3>Published children</h3>
                <ul className="atlas-path-child-list">
                  {structuralChildren.slice(0, 12).map((child) => (
                    <li key={child.id}>
                      <button
                        onClick={() =>
                          patchAtlas({
                            node: child.id,
                            atlasStage: "",
                            relationshipGroup: "",
                          })
                        }
                        title={child.title}
                        type="button"
                      >
                        {child.itemId}
                      </button>
                    </li>
                  ))}
                </ul>
                {structuralChildren.length > 12 ? (
                  <p className="muted">
                    Showing 12 of {structuralChildren.length}. Open Hierarchy
                    for the full list.
                  </p>
                ) : null}
              </section>
            ) : null}
          </section>

          <aside
              aria-atomic="true"
              aria-label={selectedRow ? `${inspectedItemId} record brief` : "Selected item"}
              aria-live="polite"
              className={`atlas-record-inspector header-offset-target${selectedRow ? " atlas-record-inspector--selected" : ""}`}
              ref={inspectorRef}
            >
              {/* When nothing is selected this must not restate AC-2 a third
                  time (page title, map center, here too) — it prompts toward
                  the map instead. */}
              {selectedRow ? (
                <>
                  <div className="atlas-inspector-heading">
                    <p className="eyebrow">
                      {displayNameFor(
                        "object_type",
                        inspectedDocument?.object_type || inspectedNode?.node_type,
                      )}
                    </p>
                    <h2>
                      <RecordLink
                        className="atlas-record-title-link"
                        nodeId={inspectedId}
                        onOpenNode={onOpenNode}
                      >
                        {inspectedItemId}
                      </RecordLink>
                    </h2>
                    {showInspectedTitle ? <p>{inspectedTitle}</p> : null}
                  </div>

                  <section className="atlas-inspector-synopsis">
                    <h3>Official description</h3>
                    <p>{inspectedSynopsisPreview.preview}</p>
                    {inspectedSynopsisPreview.truncated ? (
                      <details className="official-description-disclosure">
                        <summary>Read full official description</summary>
                        <p>{inspectedSynopsis}</p>
                      </details>
                    ) : null}
                  </section>

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
                <>
                  <div className="atlas-inspector-heading">
                    <p className="eyebrow">Selected item</p>
                  </div>
                  <p className="atlas-inspector-count">
                    <strong>{rows.length}</strong> related items across <strong>{groups.length}</strong> groups. Select one to read it here.
                  </p>
                </>
              )}

              <div className="atlas-inspector-actions">
                {selectedRow ? (
                  <AppLink
                    onNavigate={onNavigate}
                    onClick={(event) => {
                      if (shouldInterceptAppLink(event)) setSelectedRow(null);
                    }}
                    patch={{ ...state, node: selectedRow.counterpart.id, atlasStage: "", relationshipGroup: "", relationshipSearch: "" }}
                    variant="primary"
                    view="atlas-map"
                  >
                    <IconMap aria-hidden="true" size={18} />
                    Explore from this record
                  </AppLink>
                ) : null}
                {selectedRow ? (
                  <AppLink
                    onNavigate={onNavigate}
                    patch={selectedSource?.source_id ? { source: selectedSource.source_id } : undefined}
                    variant="secondary-quiet"
                    view="sources"
                  >
                    <IconFolderOpen aria-hidden="true" size={18} />
                    View source
                  </AppLink>
                ) : null}
              </div>
            </aside>
        </div>
      )}
    </div>
  );
}

export function atlasDrilldownModel(
  bundle: Pick<RuntimeBundle, "atlasSpine" | "runtime">,
): AtlasDrilldownModel {
  if (!bundle.atlasSpine) {
    throw new Error("Atlas spine artifact is required for the Atlas hierarchy.");
  }
  const spineModel = buildAtlasBootstrapModel(bundle.atlasSpine);
  const fullModel = buildAtlasDrilldownModel(bundle.runtime.dataset);
  const hydratedSpineModel = hydrateAtlasFrameworkRecords(
    spineModel,
    bundle.runtime.dataset.nodes,
  );
  return {
    frameworkGroups: hydratedSpineModel.frameworkGroups,
    baselines: fullModel.baselines,
    rmfSteps: fullModel.rmfSteps,
  };
}

function AtlasGuidedPath(props: {
  bundle: RuntimeBundle;
  benchmarkRecord: AtlasNeighborhoodRecord | null;
  state: AtlasMapPageProps["state"];
  patchAtlas: (patch: Partial<AtlasMapPageProps["state"]>) => void;
  onNavigate: AtlasMapPageProps["onNavigate"];
  onOpenNode: AtlasMapPageProps["onOpenNode"];
}) {
  const { bundle, benchmarkRecord, state, patchAtlas, onNavigate, onOpenNode } = props;
  const [recordFilter, setRecordFilter] = useState("");
  const axis =
    state.atlasAxis ||
    (state.sourceView === "rmf" ||
    state.sourceView === "rmf-lifecycle" ||
    state.relationshipView === "rmf"
      ? "process"
      : "");
  // Built always (not axis-gated) so the landing can render the trunk + limbs.
  const model = useMemo(
    () => atlasDrilldownModel(bundle),
    [bundle],
  );
  // Seeded from the URL so Start Here (and any shared link) can open straight
  // into one limb; further limb choices stay local to this page.
  const [openLimbId, setOpenLimbId] = useState(state.atlasLimb || "");
  // Re-sync when the URL's limb changes without this component unmounting —
  // back/forward and opening a different area's shared link while Explore is
  // already open both change state.atlasLimb without a remount, and openLimbId
  // must follow or the screen keeps showing the previous area.
  useEffect(() => {
    setOpenLimbId(state.atlasLimb || "");
  }, [state.atlasLimb]);
  const frameworks = model.frameworkGroups.flatMap((group) => group.frameworks);
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
      { id: "atlas:root", label: "Atlas map" },
    ];
    if (axis === "framework") {
      if (framework) {
        links.push({
          id: `framework:${framework.id}`,
          label: framework.label,
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
  }, [axis, family, framework, rmfStep]);

  function resetDrill(patch: Partial<AtlasMapPageProps["state"]>) {
    patchAtlas({
      atlasAxis: "",
      atlasFramework: "",
      atlasBaseline: "",
      atlasFamily: "",
      atlasBenchmark: "",
      atlasRmfStep: "",
      node: "",
      ...patch,
    });
  }

  function openAncestor(id: string) {
    if (id === "atlas:root") {
      setOpenLimbId("");
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

      {bundle.atlasSpine ? (
        <AtlasTree
          areaId={state.atlasLimb}
          benchmarkChildren={benchmarkChildrenFromNeighborhood(benchmarkRecord)}
          benchmarkId={state.atlasBenchmark}
          catalogSummaries={bundle.catalogSummaries || []}
          onOpenArea={(atlasLimb) => {
            setOpenLimbId(atlasLimb);
            resetDrill({ atlasAxis: "landscape", atlasLimb });
          }}
          onOpenCompare={() => onNavigate("matrix")}
          onOpenPublication={(atlasLimb, atlasFramework) => {
            setOpenLimbId(atlasLimb);
            resetDrill({ atlasAxis: "framework", atlasLimb, atlasFramework });
          }}
          onOpenSummary={(atlasFamily) =>
            patchAtlas({ atlasFamily, atlasBenchmark: "", node: "" })
          }
          onReset={() => {
            setOpenLimbId("");
            resetDrill({});
          }}
          onSelectBenchmark={(atlasBenchmark) =>
            patchAtlas({ atlasBenchmark, atlasFamily: "", node: "" })
          }
          publicationId={state.atlasFramework}
          spine={bundle.atlasSpine}
          summaryId={state.atlasFamily}
        />
      ) : (
        <p role="alert">The Atlas map structure is unavailable. Reload the page to try again.</p>
      )}

      {axis === "framework" && !framework ? (
        <>
          <p className="atlas-path-prompt">
            {openLimbId
              ? `${
                  model.frameworkGroups.find((group) => group.id === openLimbId)
                    ?.label ?? "This area"
                }: which catalog do you want to open?`
              : "Which published structure do you want to trace?"}
          </p>
          <ul className="atlas-path-stage-list">
            {(openLimbId
              ? model.frameworkGroups.filter((group) => group.id === openLimbId)
              : model.frameworkGroups
            ).flatMap((group) =>
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
                      {/* Was the limb's blurb, which repeated verbatim under
                          every catalog in the limb. Each catalog states what it
                          actually covers (src/ui/lib/catalogProfiles.ts); the
                          limb name is already in the prompt above. */}
                      <small>{catalogProfileFor(choice.id, choice.label).synopsis}</small>
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
            Optional display filter: which published baseline selection should narrow the records?
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
            Which publisher group do you want to open?
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
                  ? " shown by this optional baseline filter."
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
              Published sources link these records to this step. A program may
              require additional work products.
            </p>
          </header>
          {rmfStep.results.length ? (
            <ul className="atlas-path-record-list">
              {rmfStep.results.map((result) => (
                <li key={`${result.id}:${result.relationshipType}`}>
                  <RecordLink
                    className="atlas-path-record"
                    nodeId={result.id}
                    onOpenNode={onOpenNode}
                  >
                    <span className="atlas-path-record-text">
                      <strong>{result.itemId}</strong>
                      <small>{result.label}</small>
                    </span>
                    <span className="badge tone-applicability">
                      {displayNameFor("relationship_type", result.relationshipType)}
                    </span>
                    <IconChevronRight aria-hidden="true" size={20} />
                  </RecordLink>
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
            <AppLink onNavigate={onNavigate} variant="secondary" view="templates">
              Browse templates
            </AppLink>
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
  onNavigate: AtlasMapPageProps["onNavigate"];
  query: string;
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
        <AppLink onNavigate={props.onNavigate} patch={{ query: props.query }} variant="secondary" view="search">Search Atlas</AppLink>
        <AppLink onNavigate={props.onNavigate} variant="secondary" view="sources">View sources</AppLink>
      </div>
    </section>
  );
}

function AtlasLoadFailure(props: {
  error: boolean;
  onNavigate: AtlasMapPageProps["onNavigate"];
  query: string;
}) {
  return (
    <section className="atlas-no-connections" role="alert">
      <h2>{props.error ? "Connections could not be loaded." : "This record is not in the Atlas."}</h2>
      <p>{props.error ? "The connection list did not load. Try again or continue through Search." : "The link may be stale or the record may not have a cited Atlas connection."}</p>
      <div className="card-actions">
        <AppLink onNavigate={props.onNavigate} patch={{ query: props.query }} variant="primary" view="search">Search records</AppLink>
        <AppLink onNavigate={props.onNavigate} variant="secondary" view="sources">View sources</AppLink>
      </div>
    </section>
  );
}
