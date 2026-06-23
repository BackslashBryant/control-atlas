import {
  lazy,
  startTransition,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  DataPendingNotice,
  LoadErrorPanel,
  LoadingStatusPanel,
  OfflineFallbackActions,
} from "./components/LoadStatusPanel";
import { DetailConnectionsSkeleton, LibrarySkeleton } from "./components/LibrarySkeleton";
import { SiteFooter } from "./components/SiteFooter";
import { TopNav } from "./components/TopNav";
import { SearchOverlay } from "./components/SearchOverlay";
import {
  BrandEntranceOverlay,
  shouldShowBrandEntrance,
} from "./components/BrandEntranceOverlay";
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
import {
  normalizeViewState,
  type ViewState,
} from "./lib/viewState";
import {
  parseHashLocation,
  serializeHashLocation,
} from "./lib/hashRoutes";

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

const HERO_WORDS = [
  "Comply",
  "Map",
  "Assess",
  "Crosswalk",
  "Navigate",
  "Inherit",
  "Audit",
  "Authorize",
];

export function App() {
  const location = useLocation();
  const routerNavigate = useNavigate();
  const [viewState, setViewState] = useState<ViewState>(() =>
    parseHashLocation(location.pathname, location.search),
  );
  const [bundle, setBundle] = useState<RuntimeBundle | null>(null);
  const [loadError, setLoadError] = useState<string>("");
  const [loadSlow, setLoadSlow] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [heroWordIndex, setHeroWordIndex] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpTab, setHelpTab] = useState<HelpTab>("glossary");
  const [glossaryFocusTermId, setGlossaryFocusTermId] = useState("");
  const [headerSearchDraft, setHeaderSearchDraft] = useState(() =>
    viewState.view === "search" ? viewState.query : "",
  );
  const [introVisible, setIntroVisible] = useState(shouldShowBrandEntrance);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);

  const heroWord = useMemo(() => {
    if (
      viewState.view === "home" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return "Comply";
    }
    return HERO_WORDS[heroWordIndex] ?? "Comply";
  }, [heroWordIndex, viewState.view]);

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
      includeFullGraph: requiresFullGraph(viewState.view),
      onSearchReady: (result) => {
        if (!cancelled) {
          setBundle((current) => (current?.graphReady ? current : result));
          setLoadError("");
        }
      },
      onFullReady: (result) => {
        if (!cancelled) {
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
  }, [loadAttempt, viewState.view]);

  function retryLoad() {
    setBundle(null);
    setLoadError("");
    setLoadSlow(false);
    setLoadAttempt((current) => current + 1);
  }

  useEffect(() => {
    startTransition(() => {
      setViewState(parseHashLocation(location.pathname, location.search));
    });
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (viewState.view !== "home") {
      return undefined;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setHeroWordIndex((current) => (current + 1) % HERO_WORDS.length);
    }, 2500);

    return () => window.clearInterval(interval);
  }, [viewState.view]);

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
      ...(viewState as Record<string, unknown>),
      ...(patch as Record<string, unknown>),
    } as Partial<ViewState>);
    routerNavigate(serializeHashLocation(nextState));
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function openNode(nodeId: string, from = activeNavForState(viewState)) {
    navigate("library-detail", { node: nodeId, from });
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
      <BrandEntranceOverlay
        onDismiss={() => setIntroVisible(false)}
        visible={introVisible}
      />
      <a className="skip-link" href="#workspace">
        Skip to workspace
      </a>
      <TopNav
        bundle={bundle}
        headerSearchDraft={headerSearchDraft}
        introVisible={introVisible}
        onHeaderSearchDraftChange={setHeaderSearchDraft}
        onNavigate={navigate}
        onOpenGlossary={() => openGlossary()}
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
                heroWord={heroWord}
                loadError={loadError}
                onNavigate={navigate}
                onOpenGlossary={openGlossary}
                onOpenHelp={openHelp}
                onOpenNode={openNode}
                onOpenNodeByItemId={openNodeByItemId}
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

      <SiteFooter onNavigate={navigate} />

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
  heroWord: string;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNode: (nodeId: string, from?: string) => void;
  onOpenNodeByItemId: (itemId: string) => void;
  onOpenGlossary: (termId?: string) => void;
  onOpenHelp: () => void;
  onRetryLoad: () => void;
  setHelpOpen: (open: boolean) => void;
}) {
  const {
    bundle,
    loadError,
    state,
    heroWord,
    onNavigate,
    onOpenNode,
    onOpenNodeByItemId,
    onOpenGlossary,
    onOpenHelp,
    onRetryLoad,
    setHelpOpen,
  } = props;

  const graphReady = Boolean(bundle?.graphReady);

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
    return <DataPendingNotice onRetry={onRetryLoad} />;
  }

  if (bundle && !graphReady && requiresFullGraph(state.view)) {
    if (state.view === "library-detail") {
      return <DetailConnectionsSkeleton />;
    }
    return (
      <DataPendingNotice
        onRetry={onRetryLoad}
        title="Loading connections and compare data"
      />
    );
  }

  if (state.view === "home") {
    return <HomePage heroWord={heroWord} onNavigate={onNavigate} />;
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
        <p>
          Try Explore search or Start to find the closest path.
        </p>
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
      heroWord={heroWord}
      onNavigate={onNavigate}
      onOpenGlossary={onOpenGlossary}
      onOpenHelp={onOpenHelp}
      onOpenNode={onOpenNode}
      setHelpOpen={setHelpOpen}
      state={
        state.view === "browse"
          ? {
              view: "search",
              query: "",
              filter: state.framework,
              objectType: "",
              sourceClass: "",
              controlFamily: "",
              severity: "",
            }
          : state
      }
    />
  );
}
