import {
  lazy,
  startTransition,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  DataPendingNotice,
  LoadErrorPanel,
  LoadingStatusPanel,
  OfflineFallbackActions,
} from "./components/LoadStatusPanel";
import {
  DetailConnectionsSkeleton,
  LibrarySkeleton,
} from "./components/LibrarySkeleton";
import { HomeFooter } from "./components/HomeFooter";
import { SiteFooter } from "./components/SiteFooter";
import { TopNav } from "./components/TopNav";
import type { HelpTab } from "./components/GlossaryDrawer";
import { Button } from "./components/lsm/Button";
import {
  OrbitalContextBar,
  orbitalRouteContext,
} from "./components/OrbitalContextBar";
import { userFacingLoadError } from "../app/display-names.mjs";
import type { RuntimeBundle } from "./lib/runtimeLoader";
import { HomePage } from "./pages/HomePage";
import {
  activeNavForState,
  isStaticViewWithoutBundle,
  requiresFullGraph,
} from "./lib/navigationState";
import { normalizeViewState, type ViewState } from "./lib/viewState";
import { parseHashLocation, serializeHashLocation } from "./lib/hashRoutes";
import { canonicalizeHashLocation } from "./lib/routeIdentity";
import { recordDisplayTitle, routeDocumentTitle } from "./lib/recordTitle";
import { notifyRouteCommitted } from "../shared/navigation-events";

const AboutPage = lazy(() =>
  import("./pages/AboutPage").then((module) => ({
    default: module.AboutPage,
  })),
);
const AtlasMapPage = lazy(() =>
  import("./pages/AtlasMapPage").then((module) => ({
    default: module.AtlasMapPage,
  })),
);
const ComparePage = lazy(() =>
  import("./pages/ComparePage").then((module) => ({
    default: module.ComparePage,
  })),
);
const CatalogDetailPage = lazy(() =>
  import("./pages/CatalogDetailPage").then((module) => ({
    default: module.CatalogDetailPage,
  })),
);
const ExplorePage = lazy(() =>
  import("./pages/ExplorePage").then((module) => ({
    default: module.ExplorePage,
  })),
);
const ObjectDetailPage = lazy(() =>
  import("./pages/ObjectDetailPage").then((module) => ({
    default: module.ObjectDetailPage,
  })),
);
const PlaybooksPage = lazy(() =>
  import("./pages/PlaybooksPage").then((module) => ({
    default: module.PlaybooksPage,
  })),
);
const SourcesPage = lazy(() =>
  import("./pages/SourcesPage").then((module) => ({
    default: module.SourcesPage,
  })),
);
const StartHerePage = lazy(() =>
  import("./pages/StartHerePage").then((module) => ({
    default: module.StartHerePage,
  })),
);
const TemplatesPage = lazy(() =>
  import("./pages/TemplatesPage").then((module) => ({
    default: module.TemplatesPage,
  })),
);
const CommonsPage = lazy(() =>
  import("./pages/CommonsPage").then((module) => ({
    default: module.CommonsPage,
  })),
);
const CommonsDetailPage = lazy(() =>
  import("./pages/CommonsDetailPage").then((module) => ({
    default: module.CommonsDetailPage,
  })),
);
const SearchOverlay = lazy(() =>
  import("./components/SearchOverlay").then((module) => ({
    default: module.SearchOverlay,
  })),
);
const GlossaryDrawer = lazy(() =>
  import("./components/GlossaryDrawer").then((module) => ({
    default: module.GlossaryDrawer,
  })),
);

// A replace redirect can remount the route shell. Keep its recovery notice
// through that one transition so discarded invalid link settings are visible.
let pendingRouteRecovery = "";

function readHashLocation() {
  const value = window.location.hash.replace(/^#/, "") || "/";
  const queryIndex = value.indexOf("?");
  return {
    pathname: queryIndex === -1 ? value : value.slice(0, queryIndex),
    search: queryIndex === -1 ? "" : value.slice(queryIndex),
  };
}

export function App() {
  const [location, setLocation] = useState(readHashLocation);
  const routerNavigate = useCallback(
    (to: string, options?: { replace?: boolean }) => {
      const hash = `#${to.startsWith("/") ? to : `/${to}`}`;
      const target = `${window.location.pathname}${window.location.search}${hash}`;
      if (options?.replace) {
        window.history.replaceState(null, "", target);
      } else {
        window.history.pushState(null, "", target);
      }
      notifyRouteCommitted();
      setLocation(readHashLocation());
    },
    [],
  );
  const [viewState, setViewState] = useState<ViewState>(() =>
    parseHashLocation(location.pathname, location.search),
  );
  // Latest URL-derived state, updated synchronously by navigate() and the
  // location effect. viewState itself commits inside startTransition, which
  // React may defer past a second rapid navigation; merging from this ref
  // keeps back-to-back navigations from dropping each other's patches.
  const latestNavStateRef = useRef<ViewState>(viewState);
  const [bundle, setBundle] = useState<RuntimeBundle | null>(null);
  const [loadError, setLoadError] = useState<string>("");
  const [loadSlow, setLoadSlow] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpTab, setHelpTab] = useState<HelpTab>("glossary");
  const [glossaryFocusTermId, setGlossaryFocusTermId] = useState("");
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [graphRequested, setGraphRequested] = useState(false);
  const [routeRecovery, setRouteRecovery] = useState("");

  useEffect(() => {
    const syncLocation = () => setLocation(readHashLocation());
    window.addEventListener("hashchange", syncLocation);
    window.addEventListener("popstate", syncLocation);
    return () => {
      window.removeEventListener("hashchange", syncLocation);
      window.removeEventListener("popstate", syncLocation);
    };
  }, []);

  function requestFullGraph() {
    setGraphRequested((current) => (current ? current : true));
  }

  const runtimeScopeKey =
    viewState.view === "library-detail"
      ? `${viewState.view}:${viewState.node}`
      : viewState.view === "atlas-map"
        ? `${viewState.view}:${viewState.atlasAxis || "landing"}`
      : viewState.view === "catalog-detail"
        ? `${viewState.view}:${viewState.catalog}`
        : viewState.view === "matrix"
          ? `${viewState.view}:${viewState.crosswalk}:${viewState.compareRun}`
        : viewState.view === "templates"
            ? `${viewState.view}:${viewState.buildSection}:${viewState.task}:${viewState.templateType}`
            : viewState.view;

  useEffect(() => {
    let cancelled = false;
    setLoadSlow(false);
    setLoadError("");
    const runtimeState = latestNavStateRef.current;

    const needsRuntime =
      runtimeState.view === "search" ||
      !isStaticViewWithoutBundle(runtimeState.view) ||
      searchOverlayOpen;
    if (!needsRuntime) {
      return () => {
        cancelled = true;
      };
    }
    const slowTimer = window.setTimeout(() => {
      if (!cancelled) {
        setLoadSlow(true);
      }
    }, 3000);

    const timeoutTimer = window.setTimeout(() => {
      if (!cancelled) {
        setLoadError(
          "Library data took too long to load. Check your connection and try again.",
        );
      }
    }, 10000);

    import("./lib/runtimeLoader")
      .then(({ loadRuntimeDatasetStaged }) =>
        loadRuntimeDatasetStaged({
          state: runtimeState,
          graphRequested,
          searchOverlayOpen,
          onSearchReady: (result) => {
            if (!cancelled) {
              // A delivered stage proves the connection works: cancel the hard
              // load timers so slow full-graph fetches degrade to the partial
              // bundle instead of stamping an error over usable content.
              window.clearTimeout(slowTimer);
              window.clearTimeout(timeoutTimer);
              setLoadSlow(false);
              startTransition(() => {
                setBundle((current) =>
                  runtimeState.view === "catalog-detail"
                    ? result
                    : current?.graphReady
                      ? current
                      : result,
                );
              });
              setLoadError("");
            }
          },
          onFullReady: (result) => {
            if (!cancelled) {
              window.clearTimeout(slowTimer);
              window.clearTimeout(timeoutTimer);
              setLoadSlow(false);
              startTransition(() => {
                setBundle(result);
              });
              setLoadError("");
            }
          },
          onError: (error) => {
            if (!cancelled) {
              setLoadError(
                userFacingLoadError(
                  error instanceof Error ? error : new Error(String(error)),
                ),
              );
            }
          },
        }),
      )
      .finally(() => {
        if (!cancelled) {
          window.clearTimeout(slowTimer);
          window.clearTimeout(timeoutTimer);
        }
      });

    return () => {
      cancelled = true;
      window.clearTimeout(slowTimer);
      window.clearTimeout(timeoutTimer);
    };
  }, [
    graphRequested,
    loadAttempt,
    runtimeScopeKey,
    searchOverlayOpen,
  ]);

  function retryLoad() {
    setBundle(null);
    setLoadError("");
    setLoadSlow(false);
    setGraphRequested(false);
    setLoadAttempt((current) => current + 1);
  }

  useEffect(() => {
    const canonical = canonicalizeHashLocation(`${location.pathname}${location.search}`);
    if (canonical.recoveryMessage) {
      pendingRouteRecovery = canonical.recoveryMessage;
    }
    if (canonical.requiresReplace) {
      routerNavigate(canonical.canonicalPath, { replace: true });
      return;
    }
    setRouteRecovery(pendingRouteRecovery);
    pendingRouteRecovery = "";
    const parsed = parseHashLocation(location.pathname, location.search);
    latestNavStateRef.current = parsed;
    startTransition(() => {
      setViewState(parsed);
    });
  }, [location.pathname, location.search, routerNavigate]);

  // Per-route document.title (CATL-61): honest browser-history/bookmark labels,
  // with record pages resolving to the official record name once the graph is
  // loaded.
  const routeEntityName = (() => {
    const node =
      viewState.view === "library-detail" &&
      viewState.node &&
      bundle
        ? bundle.runtime.getNode(viewState.node)
        : null;
    if (node) return recordDisplayTitle(node);
    if (viewState.view === "commons-detail") {
      return bundle?.commonsDataset?.resources.find((resource) => resource.id === viewState.id)?.name || "";
    }
    return "";
  })();

  useEffect(() => {
    const node =
      viewState.view === "library-detail" && viewState.node && bundle
        ? bundle.runtime.getNode(viewState.node)
        : null;
    document.title = routeDocumentTitle(viewState, node, routeEntityName);
  }, [viewState, bundle, routeEntityName]);

  useEffect(() => {
    if (viewState.view !== "search") return;
    const status = document.querySelector<HTMLElement>(
      "[data-static-search-status]",
    );
    if (!status) return;
    status.textContent = loadError
      ? "The published record index is unavailable. Use the retry control below."
      : bundle
        ? "Search is ready. Opening a record loads connection data when you need it."
        : "Loading the published record index…";
  }, [bundle, loadError, viewState.view]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOverlayOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function navigate(
    nextView: ViewState["view"],
    patch: Partial<ViewState> = {},
  ) {
    const nextState = normalizeViewState(nextView, {
      ...(latestNavStateRef.current as Record<string, unknown>),
      ...(patch as Record<string, unknown>),
    } as Partial<ViewState>);
    latestNavStateRef.current = nextState;
    routerNavigate(serializeHashLocation(nextState));
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function openNode(nodeId: string, from = activeNavForState(viewState)) {
    const currentState = latestNavStateRef.current;
    const returnTo =
      currentState.view === "library-detail"
        ? currentState.returnTo || "/catalog"
        : serializeHashLocation(currentState);
    navigate("library-detail", { node: nodeId, from, returnTo });
  }

  function openNodeByItemId(itemId: string) {
    if (!bundle) {
      navigate("search", { query: itemId });
      return;
    }
    const match =
      bundle.runtime
        .searchLibrary(itemId)
        .find((entry: any) => entry.item_id === itemId) ||
      bundle.runtime.searchLibrary(itemId)[0];
    if (match) {
      openNode(match.id);
    } else {
      navigate("retired", { query: itemId });
    }
  }

  function openGlossary(termId = "") {
    setGlossaryFocusTermId(termId);
    setHelpTab("glossary");
    setHelpOpen(true);
  }

  function openHelp() {
    setGlossaryFocusTermId("");
    setHelpTab("guide");
    setHelpOpen(true);
  }

  const canRenderWithoutBundle = isStaticViewWithoutBundle(viewState.view);
  const readyState = loadError
    ? "error"
    : canRenderWithoutBundle && viewState.view !== "search"
      ? "true"
    : bundle?.routeReady && (!requiresFullGraph(viewState) || bundle.graphReady)
      ? "true"
      : bundle
        ? "partial"
        : "false";
  const showWorkspaceContent =
    Boolean(bundle) || canRenderWithoutBundle || viewState.view === "search";
  const routeContext = orbitalRouteContext(viewState, routeEntityName);

  return (
    <>
      <a
        className="skip-link"
        href="#workspace"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("workspace")?.focus();
        }}
      >
        Skip to workspace
      </a>
      {viewState.view !== "home" ? (
        <TopNav
          onNavigate={navigate}
          onOpenHelp={() => openHelp()}
          onOpenSearch={() => setSearchOverlayOpen(true)}
          viewState={viewState}
        />
      ) : null}
      <OrbitalContextBar entityName={routeEntityName} onNavigate={navigate} state={viewState} />

      <main id="workspace" tabIndex={-1}>
        {routeRecovery ? (
          <p className="route-recovery" role="status">{routeRecovery}</p>
        ) : null}
        <section
          aria-busy={readyState === "false"}
          aria-live="polite"
          className="app-shell"
          data-app-ready={readyState}
          data-depth={routeContext.depth}
          data-has-subject={
            viewState.view === "atlas-map" && Boolean(viewState.node)
              ? "true"
              : "false"
          }
          data-mode={routeContext.mode}
          data-view={viewState.view}
          id="app"
        >
          {showWorkspaceContent ? (
            <Suspense fallback={<LoadingStatusPanel slow={false} />}>
              <AppContent
                bundle={bundle}
                loadError={loadError}
                onNavigate={navigate}
                onOpenGlossary={openGlossary}
                onOpenHelp={openHelp}
                onOpenNode={openNode}
                onOpenNodeByItemId={openNodeByItemId}
                onRequestFullGraph={requestFullGraph}
                onRetryLoad={retryLoad}
                setHelpOpen={setHelpOpen}
                state={viewState}
              />
            </Suspense>
          ) : loadError ? (
            <LoadErrorPanel message={loadError} onRetry={retryLoad}>
              <OfflineFallbackActions onNavigate={(view) => navigate(view)} />
            </LoadErrorPanel>
          ) : (
            <LoadingStatusPanel slow={loadSlow}>
              <OfflineFallbackActions onNavigate={(view) => navigate(view)} />
            </LoadingStatusPanel>
          )}
        </section>
      </main>

      {viewState.view === "home" ? (
        <HomeFooter />
      ) : (
        <SiteFooter onNavigate={navigate} />
      )}

      {searchOverlayOpen ? (
        <Suspense fallback={null}>
          <SearchOverlay
            bundle={bundle}
            onNavigate={navigate}
            onOpenChange={setSearchOverlayOpen}
            onOpenNode={openNode}
            open
          />
        </Suspense>
      ) : null}

      {helpOpen ? (
        <Suspense fallback={null}>
          <GlossaryDrawer
            bundle={bundle}
            focusTermId={glossaryFocusTermId}
            helpTab={helpTab}
            onNavigate={navigate}
            onOpenNode={openNode}
            onTabChange={setHelpTab}
            open
            setOpen={(open) => {
              setHelpOpen(open);
              if (!open) {
                setGlossaryFocusTermId("");
              }
            }}
          />
        </Suspense>
      ) : null}
    </>
  );
}

function AppContent(props: {
  bundle: RuntimeBundle | null;
  loadError: string;
  state: ViewState;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNode: (nodeId: string, from?: string) => void;
  onOpenNodeByItemId: (itemId: string) => void;
  onRequestFullGraph: () => void;
  onOpenGlossary: (termId?: string) => void;
  onOpenHelp: () => void;
  onRetryLoad: () => void;
  setHelpOpen: (open: boolean) => void;
}) {
  const {
    bundle,
    loadError,
    state,
    onNavigate,
    onOpenNode,
    onOpenNodeByItemId,
    onRequestFullGraph,
    onOpenGlossary,
    onOpenHelp,
    onRetryLoad,
    setHelpOpen,
  } = props;

  const graphReady = Boolean(bundle?.graphReady);
  const loadingCopy = routeLoadingCopy(state.view);

  if (!bundle && state.view === "search") {
    if (loadError) {
      return (
        <LoadErrorPanel message={loadError} onRetry={onRetryLoad}>
          <OfflineFallbackActions onNavigate={(view) => onNavigate(view)} />
        </LoadErrorPanel>
      );
    }
    return <LibrarySkeleton />;
  }

  if (!bundle && !isStaticViewWithoutBundle(state.view)) {
    return (
      <DataPendingNotice
        description={loadingCopy.description}
        onRetry={onRetryLoad}
        title={loadingCopy.title}
      />
    );
  }

  if (bundle && !graphReady && requiresFullGraph(state)) {
    if (loadError) {
      return (
        <LoadErrorPanel message={loadError} onRetry={onRetryLoad}>
          <OfflineFallbackActions onNavigate={(view) => onNavigate(view)} />
        </LoadErrorPanel>
      );
    }
    if (state.view === "library-detail") {
      return <DetailConnectionsSkeleton />;
    }
    return (
      <DataPendingNotice
        description={loadingCopy.description}
        onRetry={onRetryLoad}
        title={loadingCopy.title}
      />
    );
  }

  if (state.view === "home") {
    return <HomePage onNavigate={onNavigate} />;
  }

  if (state.view === "not-found") {
    return (
      <section className="notice">
        <h2>Page not found</h2>
        <p>
          We could not find that page. The link may be incorrect or the page may
          have moved.
        </p>
        <div className="card-actions">
          <Button
            variant="primary"
            onClick={() => onNavigate("home")}
            type="button"
          >
            Go to Home
          </Button>
          <details>
            <summary>Try another path</summary>
            <div className="card-actions disclosure-actions">
              <Button variant="secondary" onClick={() => onNavigate("start-here")} type="button">Start here</Button>
              <Button variant="secondary" onClick={() => onNavigate("search")} type="button">Search records</Button>
            </div>
          </details>
        </div>
      </section>
    );
  }

  if (state.view === "atlas-map") {
    if (!bundle) {
      return (
        <DataPendingNotice onRetry={onRetryLoad} title="Loading Explore" />
      );
    }
    return (
      <AtlasMapPage
        bundle={bundle}
        onNavigate={onNavigate}
        onOpenNode={onOpenNode}
        state={state}
      />
    );
  }

  if (state.view === "library-detail") {
    if (!bundle) {
      return <DataPendingNotice onRetry={onRetryLoad} />;
    }
    return (
      <ObjectDetailPage
        bundle={bundle}
        onNavigate={onNavigate}
        onOpenGlossary={onOpenGlossary}
        onOpenNode={onOpenNode}
        state={state}
      />
    );
  }

  if (state.view === "catalog-detail") {
    if (!bundle) {
      return <DataPendingNotice onRetry={onRetryLoad} title="Loading Catalog" />;
    }
    return (
      <CatalogDetailPage
        bundle={bundle}
        onNavigate={onNavigate}
        onOpenNode={onOpenNode}
        state={state}
      />
    );
  }

  if (state.view === "matrix") {
    if (!bundle) {
      return <DataPendingNotice onRetry={onRetryLoad} />;
    }
    return (
      <ComparePage
        bundle={bundle}
        onNavigate={onNavigate}
        onOpenNode={onOpenNode}
        state={state}
      />
    );
  }

  if (state.view === "sources") {
    if (!bundle) {
      return <DataPendingNotice onRetry={onRetryLoad} />;
    }
    return (
      <SourcesPage bundle={bundle} onNavigate={onNavigate} state={state} />
    );
  }

  if (state.view === "commons") {
    return (
      <CommonsPage bundle={bundle} onNavigate={onNavigate} viewState={state} />
    );
  }

  if (state.view === "commons-detail") {
    return (
      <CommonsDetailPage bundle={bundle} onNavigate={onNavigate} viewState={state} />
    );
  }

  if (state.view === "templates") {
    if (!bundle) {
      return <DataPendingNotice onRetry={onRetryLoad} />;
    }
    return (
      <TemplatesPage bundle={bundle} onNavigate={onNavigate} state={state} />
    );
  }

  if (state.view === "patterns") {
    return (
      <PlaybooksPage
        bundle={bundle}
        onNavigate={onNavigate}
        onOpenGlossary={onOpenGlossary}
        onOpenNodeByItemId={onOpenNodeByItemId}
        setHelpOpen={setHelpOpen}
        state={state}
      />
    );
  }

  if (state.view === "start-here") {
    return <StartHerePage onNavigate={onNavigate} state={state} />;
  }

  if (state.view === "about") {
    return <AboutPage onNavigate={onNavigate} />;
  }

  if (state.view === "retired") {
    if (!bundle) {
      return <DataPendingNotice onRetry={onRetryLoad} />;
    }
    return (
      <section className="notice">
        <h2>No public map entry for "{state.query}"</h2>
        <p>Try Search or Start to find the closest path.</p>
        <div className="card-actions">
          <Button
            variant="primary"
            onClick={() => onNavigate("search", { query: state.query })}
            type="button"
          >
            Search records
          </Button>
          <Button
            variant="secondary"
            onClick={() => onNavigate("start-here")}
            type="button"
          >
            Start guided path
          </Button>
        </div>
      </section>
    );
  }

  if (!bundle) {
    return <DataPendingNotice onRetry={onRetryLoad} />;
  }

  return (
    <ExplorePage
      bundle={bundle!}
      graphReady={graphReady}
      onNavigate={onNavigate}
      onOpenGlossary={onOpenGlossary}
      onOpenHelp={onOpenHelp}
      onOpenNode={onOpenNode}
      onRequestFullGraph={onRequestFullGraph}
      setHelpOpen={setHelpOpen}
      state={state}
    />
  );
}

function routeLoadingCopy(view: ViewState["view"]) {
  switch (view) {
    case "matrix":
      return {
        title: "Loading comparison data",
        description:
          "We are loading the public mappings needed to compare frameworks, baselines, and threat paths.",
      };
    case "catalog-detail":
      return {
        title: "Loading Catalog",
        description:
          "We are loading the selected catalog, its public records, and source details.",
      };
    case "sources":
      return {
        title: "Loading Sources",
        description:
          "We are loading publisher details, source status, and known coverage gaps.",
      };
    case "templates":
      return {
        title: "Loading document tasks",
        description:
          "We are preparing starter documents and the official sources that support them.",
      };
    case "atlas-map":
      return {
        title: "Loading Explore",
        description:
          "Explore is preparing the selected record and its real published connections.",
      };
    default:
      return {
        title: "Loading connection data",
        description:
          "This page needs the public mapping data. Wait a moment or retry if loading failed.",
      };
  }
}
