import {
  lazy,
  startTransition,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import { SearchOverlay } from "./components/SearchOverlay";
import { GlossaryDrawer, type HelpTab } from "./components/GlossaryDrawer";
import { userFacingLoadError } from "../app/display-names.mjs";
import {
  loadRuntimeDatasetStaged,
  type RuntimeBundle,
} from "./lib/runtimeLoader";
import { HomePage } from "./pages/HomePage";
import {
  activeNavForState,
  isStaticViewWithoutBundle,
  requiresFullGraph,
} from "./lib/navigation";
import { normalizeViewState, type ViewState } from "./lib/viewState";
import { parseHashLocation, serializeHashLocation } from "./lib/hashRoutes";
import { routeDocumentTitle } from "./lib/recordTitle";

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
const MenuPage = lazy(() =>
  import("./pages/MenuPage").then((module) => ({
    default: module.MenuPage,
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

export function App() {
  const location = useLocation();
  const routerNavigate = useNavigate();
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
  const [headerSearchDraft, setHeaderSearchDraft] = useState(() =>
    viewState.view === "search" ? viewState.query : "",
  );
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [graphRequested, setGraphRequested] = useState(false);

  function requestFullGraph() {
    setGraphRequested((current) => (current ? current : true));
  }

  useEffect(() => {
    let cancelled = false;
    setLoadSlow(false);
    setLoadError("");

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

    loadRuntimeDatasetStaged({
      includeFullGraph: requiresFullGraph(viewState.view) || graphRequested,
      onSearchReady: (result) => {
        if (!cancelled) {
          // A delivered stage proves the connection works: cancel the hard
          // load timers so slow full-graph fetches degrade to the partial
          // bundle instead of stamping an error over usable content.
          window.clearTimeout(slowTimer);
          window.clearTimeout(timeoutTimer);
          setLoadSlow(false);
          setBundle((current) => (current?.graphReady ? current : result));
          setLoadError("");
        }
      },
      onFullReady: (result) => {
        if (!cancelled) {
          window.clearTimeout(slowTimer);
          window.clearTimeout(timeoutTimer);
          setLoadSlow(false);
          setBundle(result);
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
      onShardLoaded: () => {
        if (!cancelled) {
          setBundle((current) =>
            current
              ? {
                  ...current,
                  librarySearchRevision:
                    (current.librarySearchRevision ?? 0) + 1,
                }
              : current,
          );
        }
      },
    }).finally(() => {
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
  }, [graphRequested, loadAttempt, viewState.view]);

  function retryLoad() {
    setBundle(null);
    setLoadError("");
    setLoadSlow(false);
    setGraphRequested(false);
    setLoadAttempt((current) => current + 1);
  }

  useEffect(() => {
    const parsed = parseHashLocation(location.pathname, location.search);
    latestNavStateRef.current = parsed;
    startTransition(() => {
      setViewState(parsed);
    });
  }, [location.pathname, location.search]);

  // Per-route document.title (CATL-61): honest browser-history/bookmark labels,
  // with record pages resolving to the official record name once the graph is
  // loaded.
  useEffect(() => {
    const node =
      viewState.view === "library-detail" &&
      viewState.node &&
      bundle?.graphReady
        ? bundle.runtime.getNode(viewState.node)
        : null;
    document.title = routeDocumentTitle(viewState, node);
  }, [viewState, bundle]);

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
        ? currentState.returnTo || "/library"
        : serializeHashLocation(currentState);
    navigate("library-detail", { node: nodeId, from, returnTo });
  }

  function openNodeByItemId(itemId: string) {
    if (!bundle) {
      return;
    }
    const match =
      bundle.runtime
        .searchLibrary(itemId)
        .find((entry: any) => entry.item_id === itemId) ||
      bundle.runtime.searchLibrary(itemId)[0];
    if (match) {
      openNode(match.id);
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

  useEffect(() => {
    if (viewState.view === "search") {
      setHeaderSearchDraft(viewState.query);
    } else {
      setHeaderSearchDraft("");
    }
  }, [viewState]);

  const readyState = loadError
    ? "error"
    : bundle?.graphReady || (bundle && !requiresFullGraph(viewState.view))
      ? "true"
      : bundle
        ? "partial"
        : "false";
  const canRenderWithoutBundle = isStaticViewWithoutBundle(viewState.view);
  const showWorkspaceContent =
    Boolean(bundle) || canRenderWithoutBundle || viewState.view === "search";

  return (
    <>
      <a className="skip-link" href="#workspace">
        Skip to workspace
      </a>
      <TopNav
        bundle={bundle}
        headerSearchDraft={headerSearchDraft}
        onHeaderSearchDraftChange={setHeaderSearchDraft}
        onNavigate={navigate}
        onOpenHelp={() => openHelp()}
        onOpenSearch={() => setSearchOverlayOpen(true)}
        viewState={viewState}
      />

      <main id="workspace">
        <section
          aria-busy={readyState === "false"}
          aria-live="polite"
          className="app-shell"
          data-app-ready={readyState}
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

      <SiteFooter minimal={viewState.view === "home"} onNavigate={navigate} />

      <SearchOverlay
        bundle={bundle}
        onNavigate={navigate}
        onOpenChange={setSearchOverlayOpen}
        onOpenNode={openNode}
        open={searchOverlayOpen}
      />

      <GlossaryDrawer
        bundle={bundle}
        focusTermId={glossaryFocusTermId}
        helpTab={helpTab}
        onNavigate={navigate}
        onOpenNode={openNode}
        onTabChange={setHelpTab}
        open={helpOpen}
        setOpen={(open) => {
          setHelpOpen(open);
          if (!open) {
            setGlossaryFocusTermId("");
          }
        }}
      />
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

  if (bundle && !graphReady && requiresFullGraph(state.view)) {
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

  if (state.view === "menu") {
    return <MenuPage onNavigate={onNavigate} />;
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
          <button
            className="primary"
            onClick={() => onNavigate("home")}
            type="button"
          >
            Go to Home
          </button>
          <details>
            <summary>Try another path</summary>
            <div className="card-actions disclosure-actions">
              <button className="secondary" onClick={() => onNavigate("start-here")} type="button">Start here</button>
              <button className="secondary" onClick={() => onNavigate("search")} type="button">Search records</button>
            </div>
          </details>
        </div>
      </section>
    );
  }

  if (state.view === "atlas-map") {
    if (!bundle) {
      return (
        <DataPendingNotice onRetry={onRetryLoad} title="Loading Atlas Map" />
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
      return <DataPendingNotice onRetry={onRetryLoad} title="Loading Library" />;
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

  if (state.view === "browse") {
    if (!bundle) {
      return <DataPendingNotice onRetry={onRetryLoad} title="Loading Library" />;
    }
    return (
      <CatalogDetailPage
        bundle={bundle}
        onNavigate={onNavigate}
        onOpenNode={onOpenNode}
        state={{ view: "catalog-detail", catalog: state.framework }}
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
        <h2>We do not have a public map entry for "{state.query}"</h2>
        <p>Try Explore search or Start to find the closest path.</p>
        <div className="card-actions">
          <button
            className="primary"
            onClick={() => onNavigate("search", { query: state.query })}
            type="button"
          >
            Search records
          </button>
          <button
            className="secondary"
            onClick={() => onNavigate("start-here")}
            type="button"
          >
            Start guided path
          </button>
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
        title: "Loading Library",
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
        title: "Loading Atlas",
        description:
          "Atlas is preparing the selected record and its real published connections.",
      };
    default:
      return {
        title: "Loading connection data",
        description:
          "This page needs the public mapping data. Wait a moment or retry if loading failed.",
      };
  }
}
