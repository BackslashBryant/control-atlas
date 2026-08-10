import {
  lazy,
  startTransition,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
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
import { SiteFooter } from "./components/SiteFooter";
import { TopNav } from "./components/TopNav";
import { AppLink } from "./components/AppLink";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary";
import {
  OrbitalContextBar,
  orbitalRouteContext,
} from "./components/OrbitalContextBar";
import { userFacingLoadError } from "../app/display-names.mjs";
import type { RuntimeBundle } from "./lib/runtimeLoader";
import { HomePage } from "./pages/HomePage";
import {
  isStaticViewWithoutBundle,
  requiresFullGraph,
} from "./lib/navigationState";
import { normalizeViewState, type ViewState } from "./lib/viewState";
import { parseHashLocation, serializeHashLocation } from "./lib/hashRoutes";
import { canonicalizeHashLocation } from "./lib/routeIdentity";
import { recordDisplayTitle, routeDocumentTitle } from "./lib/recordTitle";
import {
  beginRouteTransition,
  completeRouteTransition,
  CLOSE_OVERLAYS_EVENT,
  notifyRouteCommitted,
  OPEN_SEARCH_OVERLAY_EVENT,
} from "../shared/navigation-events";
import {
  activeBrandAction,
  BRAND_SURFACE_VIEWS,
} from "../shared/brand-rotation";

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

const PROGRESSIVE_SHELL_SELECTORS = [
  "[data-skip-workspace]",
  "[data-static-header]",
  "[data-static-home]",
  "[data-static-route]",
  "[data-static-search]",
];

function releaseProgressiveShell(root: HTMLElement) {
  for (const selector of PROGRESSIVE_SHELL_SELECTORS) {
    root.querySelector(selector)?.remove();
  }
  root.dataset.progressiveShellReleased = "true";
  delete root.dataset.routeHydrated;
  delete root.dataset.staticRouteActive;
  delete root.dataset.staticRouteKind;
  delete root.dataset.staticRoutePersistent;
  delete root.dataset.staticSearchActive;
}

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
        window.history.pushState(
          { ...(window.history.state || {}), controlAtlasInternalNavigation: true },
          "",
          target,
        );
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
  // location effect, ahead of viewState's own commit. The runtime-load effect
  // below reads this ref instead of viewState so it always sees the most
  // recent navigation even if its own dependencies haven't re-run yet.
  const latestNavStateRef = useRef<ViewState>(viewState);
  const [bundle, setBundle] = useState<RuntimeBundle | null>(null);
  const [loadError, setLoadError] = useState<string>("");
  const [loadSlow, setLoadSlow] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [glossaryFocusTermId, setGlossaryFocusTermId] = useState("");
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [graphRequested, setGraphRequested] = useState(false);
  const [routeRecovery, setRouteRecovery] = useState("");
  const [chromeReady, setChromeReady] = useState(false);

  const closeOverlays = useCallback(() => {
    window.dispatchEvent(new Event(CLOSE_OVERLAYS_EVENT));
    setSearchOverlayOpen(false);
    setHelpOpen(false);
    setGlossaryFocusTermId("");
  }, []);

  const openSearchOverlay = useCallback(() => {
    window.dispatchEvent(new Event(CLOSE_OVERLAYS_EVENT));
    setHelpOpen(false);
    setGlossaryFocusTermId("");
    setSearchOverlayOpen(true);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setChromeReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useLayoutEffect(() => {
    const root = document.getElementById("root");
    if (!root) return;
    root.dataset.reactShellReady = chromeReady ? "true" : "false";
    root.dataset.reactActive = chromeReady ? "true" : "false";
    if (chromeReady) releaseProgressiveShell(root);
  }, [chromeReady, viewState.view]);

  useEffect(() => {
    const syncLocation = () => {
      closeOverlays();
      beginRouteTransition("Opening the selected workspace", window.location.hash);
      setLocation(readHashLocation());
    };
    window.addEventListener("hashchange", syncLocation);
    window.addEventListener("popstate", syncLocation);
    return () => {
      window.removeEventListener("hashchange", syncLocation);
      window.removeEventListener("popstate", syncLocation);
    };
  }, [closeOverlays]);

  function requestFullGraph() {
    setGraphRequested((current) => (current ? current : true));
  }

  const runtimeScopeKey =
    viewState.view === "library-detail"
      ? `${viewState.view}:${viewState.node}`
      : viewState.view === "atlas-map"
        ? `${viewState.view}:${viewState.atlasAxis || "landing"}:${viewState.atlasFramework || "none"}:${viewState.atlasBenchmark || "none"}`
      : viewState.view === "catalog-detail"
        ? `${viewState.view}:${viewState.catalog}`
        : viewState.view === "matrix"
          ? `${viewState.view}:${viewState.crosswalk}:${viewState.compareRun}`
        : viewState.view === "templates"
            ? `${viewState.view}:${viewState.buildSection}:${viewState.task}:${viewState.templateType}`
            : viewState.view;

  useEffect(() => {
    let cancelled = false;
    const loadController = new AbortController();
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
    }, 13000);

    import("./lib/runtimeLoader")
      .then(({ loadRuntimeDatasetStaged }) =>
        loadRuntimeDatasetStaged({
          state: runtimeState,
          graphRequested,
          searchOverlayOpen,
          signal: loadController.signal,
          onSearchReady: (result) => {
            if (!cancelled) {
              // A delivered stage proves the connection works: cancel the hard
              // load timers so slow full-graph fetches degrade to the partial
              // bundle instead of stamping an error over usable content.
              window.clearTimeout(slowTimer);
              window.clearTimeout(timeoutTimer);
              setLoadSlow(false);
              startTransition(() => {
                setBundle((current) => {
                  const next = runtimeState.view === "catalog-detail"
                    ? result
                    : current?.graphReady
                      ? current
                      : result;
                  return current?.atlasSpine && !next.atlasSpine
                    ? { ...next, atlasSpine: current.atlasSpine }
                    : next;
                });
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
                setBundle((current) =>
                  current?.atlasSpine && !result.atlasSpine
                    ? { ...result, atlasSpine: current.atlasSpine }
                    : result,
                );
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
      loadController.abort();
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
    void import("./lib/runtimeLoader").then(({ clearRuntimeArtifactCache }) => {
      clearRuntimeArtifactCache();
      setBundle(null);
      setLoadError("");
      setLoadSlow(false);
      setGraphRequested(false);
      setLoadAttempt((current) => current + 1);
    });
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
    // Route changes must commit immediately: wrapping this in startTransition
    // let a same-path, query-only navigation (e.g. switching Explore areas via
    // a direct hash edit, bookmark, or back/forward, not a click) get
    // superseded before it ever painted, leaving the previous area on screen
    // while the URL had already moved on.
    setViewState(parsed);
  }, [location.pathname, location.search, routerNavigate]);

  // Per-route document.title (CATL-61): honest browser-history/bookmark labels,
  // with record pages resolving to the official record name once the graph is
  // loaded.
  const routeEntityName = (() => {
    const node =
      (viewState.view === "library-detail" || viewState.view === "atlas-map") &&
      viewState.node && bundle
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
    if (
      (viewState.view === "library-detail" || viewState.view === "atlas-map") &&
      routeEntityName
    ) {
      const progressiveTitle = document.querySelector<HTMLElement>(
        "[data-static-route-title]",
      );
      if (progressiveTitle) progressiveTitle.textContent = routeEntityName;
    }
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
      // The header keycap advertises Ctrl+Alt+<word>; make it real. Matched
      // against the word currently displayed, so words that share a first
      // letter never collide. Checked before Ctrl+K so Ctrl+Alt+K is not
      // swallowed by the search overlay.
      if (event.altKey && (event.metaKey || event.ctrlKey)) {
        const action = activeBrandAction();
        if (event.key.toLowerCase() === action.word[0].toLowerCase()) {
          event.preventDefault();
          navigateRef.current(
            BRAND_SURFACE_VIEWS[action.surface] as ViewState["view"],
          );
          return;
        }
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearchOverlay();
      }
    };
    // The Home route boots without this component mounted at all (its
    // shortcuts are advertised on a static shell React hasn't rendered yet),
    // so main.tsx boots React on Ctrl+K and fires this once mounted instead.
    const onOpenSearchOverlay = () => openSearchOverlay();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_SEARCH_OVERLAY_EVENT, onOpenSearchOverlay);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_SEARCH_OVERLAY_EVENT, onOpenSearchOverlay);
    };
  }, [openSearchOverlay]);

  function navigate(
    nextView: ViewState["view"],
    patch: Partial<ViewState> = {},
    reset = false,
  ) {
    closeOverlays();
    const current = latestNavStateRef.current;
    const nextState = normalizeViewState(nextView, {
      ...(!reset && current.view === nextView
        ? (current as Record<string, unknown>)
        : {}),
      ...(patch as Record<string, unknown>),
    } as Partial<ViewState>);
    const nextLocation = serializeHashLocation(nextState);
    if (!beginRouteTransition("Opening the selected workspace", nextLocation)) return;
    latestNavStateRef.current = nextState;
    routerNavigate(nextLocation);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  // The global keydown listener is registered once with no deps; it reaches the
  // current navigate through this ref rather than re-subscribing every render.
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  function openNode(nodeId: string) {
    navigate("library-detail", { node: nodeId });
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
    window.dispatchEvent(new Event(CLOSE_OVERLAYS_EVENT));
    setSearchOverlayOpen(false);
    setGlossaryFocusTermId(termId);
    setHelpOpen(true);
  }

  const canRenderWithoutBundle = isStaticViewWithoutBundle(viewState.view);
  const hasRequiredRouteArtifacts =
    viewState.view !== "atlas-map" || Boolean(bundle?.atlasSpine);
  const readyState = loadError
    ? "error"
    : canRenderWithoutBundle && viewState.view !== "search"
      ? "true"
    : bundle?.routeReady && hasRequiredRouteArtifacts &&
        (!requiresFullGraph(viewState) || bundle.graphReady)
      ? "true"
      : bundle
        ? "partial"
        : "false";
  const showWorkspaceContent =
    (Boolean(bundle) && hasRequiredRouteArtifacts) ||
    canRenderWithoutBundle ||
    viewState.view === "search";
  const routeContext = orbitalRouteContext(viewState, routeEntityName);

  useEffect(() => {
    if (readyState === "false") return;
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(completeRouteTransition);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [readyState, viewState]);

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
      {chromeReady ? <TopNav
        onNavigate={navigate}
        onOpenSearch={openSearchOverlay}
        viewState={viewState}
      /> : null}
      {chromeReady ? <OrbitalContextBar entityName={routeEntityName} onNavigate={navigate} state={viewState} /> : null}

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
            <RouteErrorBoundary
              onNavigate={navigate}
              resetKey={`${runtimeScopeKey}:${loadAttempt}`}
            >
              <Suspense fallback={<LoadingStatusPanel slow={false} suspensePending />}>
                <AppContent
                  bundle={bundle}
                  loadError={loadError}
                  onNavigate={navigate}
                  onOpenGlossary={openGlossary}
                  onOpenNode={openNode}
                  onOpenNodeByItemId={openNodeByItemId}
                  onOpenSearch={openSearchOverlay}
                  onRequestFullGraph={requestFullGraph}
                  onRetryLoad={retryLoad}
                  state={viewState}
                />
              </Suspense>
            </RouteErrorBoundary>
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

      {chromeReady ? <SiteFooter onNavigate={navigate} /> : null}

      {searchOverlayOpen ? (
        <RouteErrorBoundary onNavigate={navigate} resetKey={`search:${runtimeScopeKey}:${loadAttempt}`}>
          <Suspense fallback={null}>
            <SearchOverlay
              bundle={bundle}
              onNavigate={navigate}
              onOpenChange={setSearchOverlayOpen}
              onOpenNode={openNode}
              open
            />
          </Suspense>
        </RouteErrorBoundary>
      ) : null}

      {helpOpen ? (
        <RouteErrorBoundary onNavigate={navigate} resetKey={`glossary:${runtimeScopeKey}:${loadAttempt}`}>
          <Suspense fallback={null}>
            <GlossaryDrawer
              bundle={bundle}
              focusTermId={glossaryFocusTermId}
              onNavigate={navigate}
              onOpenNode={openNode}
              open
              setOpen={(open) => {
                setHelpOpen(open);
                if (!open) {
                  setGlossaryFocusTermId("");
                }
              }}
            />
          </Suspense>
        </RouteErrorBoundary>
      ) : null}
    </>
  );
}

function AppContent(props: {
  bundle: RuntimeBundle | null;
  loadError: string;
  state: ViewState;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNode: (nodeId: string) => void;
  onOpenNodeByItemId: (itemId: string) => void;
  onOpenSearch: () => void;
  onRequestFullGraph: () => void;
  onOpenGlossary: (termId?: string) => void;
  onRetryLoad: () => void;
}) {
  const {
    bundle,
    loadError,
    state,
    onNavigate,
    onOpenNode,
    onOpenNodeByItemId,
    onOpenSearch,
    onRequestFullGraph,
    onOpenGlossary,
    onRetryLoad,
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
    return <HomePage onNavigate={onNavigate} onOpenSearch={onOpenSearch} />;
  }

  if (state.view === "not-found") {
    return (
      <section className="notice">
        <h1>Page not found</h1>
        <p>
          That page could not be found. The link may be incorrect, or the page
          may have moved.
        </p>
        <div className="card-actions">
          <AppLink onNavigate={onNavigate} variant="primary" view="home">
            Go to Home
          </AppLink>
          <details>
            <summary>Try another path</summary>
            <div className="card-actions disclosure-actions">
              <AppLink onNavigate={onNavigate} variant="secondary" view="start-here">Start here</AppLink>
              <AppLink onNavigate={onNavigate} variant="secondary" view="search">Search records</AppLink>
            </div>
          </details>
        </div>
      </section>
    );
  }

  if (state.view === "atlas-map") {
    if (!bundle) {
      return (
        <DataPendingNotice onRetry={onRetryLoad} title="Loading the Atlas" />
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
      return <DataPendingNotice onRetry={onRetryLoad} title="Loading the Library" />;
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
        state={state}
      />
    );
  }

  if (state.view === "start-here") {
    return (
      <StartHerePage bundle={bundle} onNavigate={onNavigate} state={state} />
    );
  }

  if (state.view === "about") {
    return <AboutPage />;
  }

  if (state.view === "retired") {
    if (!bundle) {
      return <DataPendingNotice onRetry={onRetryLoad} />;
    }
    return (
      <section className="notice">
        <h1>No public map entry for "{state.query}"</h1>
        <p>Try Search or Start to find the closest path.</p>
        <div className="card-actions">
          <AppLink onNavigate={onNavigate} patch={{ query: state.query }} variant="primary" view="search">
            Search records
          </AppLink>
          <AppLink onNavigate={onNavigate} variant="secondary" view="start-here">
            Start guided path
          </AppLink>
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
      onOpenNode={onOpenNode}
      onRequestFullGraph={onRequestFullGraph}
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
          "Loading the public mappings needed to compare frameworks, baselines, and threat paths.",
      };
    case "catalog-detail":
      return {
        title: "Loading the Library",
        description:
          "Loading the selected catalog, its public records, and source details.",
      };
    case "sources":
      return {
        title: "Loading Sources",
        description:
          "Loading publisher details, source status, and known coverage gaps.",
      };
    case "templates":
      return {
        title: "Loading document tasks",
        description:
          "Preparing starter documents and the official sources that support them.",
      };
    case "atlas-map":
      return {
        title: "Loading the Atlas",
        description:
          "Preparing the selected record and its published connections.",
      };
    default:
      return {
        title: "Loading connection data",
        description:
          "This page needs the public mapping data. Wait a moment or retry if loading failed.",
      };
  }
}
