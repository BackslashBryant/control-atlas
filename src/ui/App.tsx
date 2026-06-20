import * as Accordion from "@radix-ui/react-accordion";
import * as Dialog from "@radix-ui/react-dialog";
import {
  IconArrowRight,
  IconBook2,
  IconClipboardList,
  IconCompass,
  IconExternalLink,
  IconFilter,
  IconFileDescription,
  IconGitCompare,
  IconInfoCircle,
  IconLibrary,
  IconLink,
  IconSearch,
  IconShieldCheck,
  IconSourceCode,
  IconSparkles,
  IconX,
} from "@tabler/icons-react";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CatalogFilterBar,
  CompareStepIndicator,
  QuickIntentCard,
} from "./components/QuickIntentCard";
import {
  ExpandableChipList,
  ExpandableControlList,
  RelationshipGroupsSection,
} from "./components/ExpandableRelationshipGroup";
import {
  CompareExportDisclosure,
  DataPendingNotice,
  LoadErrorPanel,
  LoadingStatusPanel,
  OfflineFallbackActions,
} from "./components/LoadStatusPanel";
import { DetailConnectionsSkeleton, LibrarySkeleton } from "./components/LibrarySkeleton";
import { StickyDetailBar } from "./components/StickyDetailBar";
import {
  filterByCategoryAndQuery,
  groupItemsByCategory,
  PATTERN_CATEGORIES,
  RECOMMENDED_PATTERN_IDS,
  TEMPLATE_CATEGORIES,
} from "./lib/catalogGroups.mjs";
import { glossaryData } from "../app/glossary-data.mjs";
import { patternsData } from "../app/patterns-data.mjs";
import {
  RelationshipExplorer,
  relationshipFiltersFromState,
  relationshipFiltersToPatch,
} from "./components/RelationshipExplorer";
import { displayNameFor, userFacingLoadError } from "../app/display-names.mjs";
import { groupRelationships } from "../app/relationship-groups.mjs";
import { generateTemplate } from "../app/template-engine.mjs";
import { PRODUCT_DISCLAIMER } from "../shared/disclaimer.mjs";
import {
  ChainRelationshipItem,
  parseCatalogItemIds,
  ProvenanceBadge,
  SourceRefList,
} from "./lib/compareHelpers";
import {
  glossaryTermsForDocument,
  glossaryTermsForPattern,
  searchGlossary,
  templatesForPatterns,
} from "./lib/glossarySearch.mjs";
import {
  loadRuntimeDatasetStaged,
  type RuntimeBundle,
} from "./lib/runtimeLoader";
import { buildStartHereRecommendations } from "./lib/startHereRecommendations.mjs";
import type {
  StartHereCompareLink,
  StartHereLibraryLink,
  StartHereRecommendations,
} from "./lib/startHereRecommendations.d.ts";
import {
  normalizeViewState,
  parseViewState,
  serializeViewState,
  type CompareWorkbench,
  type ViewState,
} from "./lib/viewState";


const HERO_WORDS = [
  "Comply",
  "Translate",
  "Compare",
  "Trace",
  "Review",
  "Assess",
  "Plan",
  "Connect",
];

type HelpTab = "guide" | "glossary";

const PRIMARY_NAV_ITEMS = [
  { label: "Start Here", view: "start-here", icon: IconCompass },
  { label: "Library", view: "search", icon: IconLibrary },
  { label: "Compare", view: "matrix", icon: IconGitCompare },
  { label: "Patterns", view: "patterns", icon: IconBook2 },
  { label: "Templates", view: "templates", icon: IconClipboardList },
  { label: "Sources", view: "sources", icon: IconSourceCode },
] as const;

const PATTERN_RENAMES: Record<string, string> = {
  "csp-inheritance": "Using FedRAMP Inheritance",
  "shared-responsibility": "What Your Cloud Provider Owns vs What You Own",
  "reciprocity-basics": "Reusing Prior Authorization Work",
  "conmon-cadence": "Keeping Authorization Evidence Current",
  "boundary-patterns": "Defining the Right Authorization Boundary",
  "boe-reuse": "Packaging Evidence for Reuse",
};

function activeNavForState(state: ViewState) {
  if (
    state.view === "library-detail" ||
    state.view === "browse" ||
    state.view === "retired"
  ) {
    return "search";
  }
  return state.view;
}

function isStaticViewWithoutBundle(view: ViewState["view"]) {
  return (
    view === "about" ||
    view === "patterns" ||
    view === "start-here" ||
    view === "search"
  );
}

function requiresFullGraph(view: ViewState["view"]) {
  return (
    view === "library-detail" ||
    view === "matrix" ||
    view === "sources" ||
    view === "templates" ||
    view === "browse" ||
    view === "retired"
  );
}

function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(value);
  }
  const area = document.createElement("textarea");
  area.value = value;
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  area.remove();
  return Promise.resolve();
}

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

function sourceTrustSummary(source: any) {
  if (!source) {
    return "No public source record is attached yet.";
  }
  if (source.provenance_class === "inferred") {
    return "Needs review before relying on it.";
  }
  if (
    source.provenance_class === "federal_published" ||
    source.provenance_class === "official"
  ) {
    return "Direct from official source.";
  }
  if (source.provenance_class?.includes("published")) {
    return "Derived from a published public source.";
  }
  return "Suggested by public data.";
}

function sourceUsageSummary(source: any) {
  return source?.graph_eligible && source?.eligibility_status === "eligible"
    ? "Used in map: Yes"
    : "Used in map: No";
}

function sourceWarnings(source: any) {
  const warnings: string[] = [];
  if (!source) {
    return warnings;
  }
  if (!source.graph_eligible || source.eligibility_status === "excluded") {
    warnings.push("This source is not used in the public map by default.");
  }
  if (
    source.lifecycle_status === "deprecated" ||
    source.lifecycle_status === "draft"
  ) {
    warnings.push(
      "This source is old or draft content. Review it carefully before reusing it.",
    );
  }
  if (source.access_status !== "public") {
    warnings.push(
      "Access restrictions may limit what can be verified from this source.",
    );
  }
  return warnings;
}

function formatRelationshipLabel(edge: any) {
  return displayNameFor("relationship_type", edge.relationship_type);
}

function formatConfidence(value: string) {
  return displayNameFor("confidence", value);
}

function PageHeader(props: {
  eyebrow?: string;
  title: string;
  summary: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header">
      {props.eyebrow ? <p className="eyebrow">{props.eyebrow}</p> : null}
      <div className="page-header-row">
        <div>
          <h1>{props.title}</h1>
          <p className="page-summary">{props.summary}</p>
        </div>
        {props.action ? (
          <div className="page-header-action">{props.action}</div>
        ) : null}
      </div>
    </header>
  );
}

function SummaryCard(props: {
  title: string;
  children: ReactNode;
  tone?: "default" | "trust" | "warning";
}) {
  return (
    <article className={`summary-card tone-${props.tone || "default"}`}>
      <span className="summary-card-title">{props.title}</span>
      <div>{props.children}</div>
    </article>
  );
}

function Badge(props: {
  children: ReactNode;
  tone?: "default" | "info" | "warning" | "success";
}) {
  return (
    <span className={`badge tone-${props.tone || "default"}`}>
      {props.children}
    </span>
  );
}

function SourceSummaryCard(props: { source: any; onOpen?: () => void }) {
  const { source, onOpen } = props;
  return (
    <article className="result-card source-card">
      <div className="result-card-header">
        <div>
          <p className="result-meta">Source</p>
          <h3>{source.display_name || source.name}</h3>
        </div>
        <Badge tone={source.graph_eligible ? "success" : "warning"}>
          {sourceUsageSummary(source)}
        </Badge>
      </div>
      <p className="result-summary">
        {source.name} is maintained by {source.owner}.{" "}
        {sourceTrustSummary(source)}
      </p>
      <div className="source-summary-grid">
        <span>
          {displayNameFor("provenance_class", source.provenance_class)}
        </span>
        <span>
          {displayNameFor("lifecycle_status", source.lifecycle_status)}
        </span>
        <span>{displayNameFor("access_status", source.access_status)}</span>
      </div>
      {sourceWarnings(source).length ? (
        <div className="warning-list">
          {sourceWarnings(source).map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}
      <div className="card-actions">
        {onOpen ? (
          <button className="primary" onClick={onOpen} type="button">
            View source details
          </button>
        ) : null}
        <a
          className="secondary"
          href={source.artifact_url}
          rel="noreferrer"
          target="_blank"
        >
          Open official source
        </a>
      </div>
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

export function App() {
  const [viewState, setViewState] = useState<ViewState>(() =>
    parseViewState(window.location.search),
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
      onSearchReady: (result) => {
        if (!cancelled) {
          setBundle(result);
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
  }, [loadAttempt]);

  function retryLoad() {
    setBundle(null);
    setLoadError("");
    setLoadSlow(false);
    setLoadAttempt((current) => current + 1);
  }

  useEffect(() => {
    const onPopState = () => {
      startTransition(() => {
        setViewState(parseViewState(window.location.search));
      });
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setHeroWordIndex((current) => (current + 1) % HERO_WORDS.length);
    }, 2200);

    return () => window.clearInterval(interval);
  }, []);

  function navigate(
    nextView: ViewState["view"],
    patch: Partial<ViewState> = {},
  ) {
    const nextState = normalizeViewState(nextView, {
      ...(viewState as Record<string, unknown>),
      ...(patch as Record<string, unknown>),
    } as Partial<ViewState>);

    const nextUrl = `${window.location.pathname}${serializeViewState(nextState)}`;
    window.history.pushState(null, "", nextUrl);
    startTransition(() => {
      setViewState(nextState);
    });
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

  const readyState = loadError ? "error" : bundle?.graphReady ? "true" : bundle ? "partial" : "false";
  const canRenderWithoutBundle = isStaticViewWithoutBundle(viewState.view);
  const showWorkspaceContent =
    Boolean(bundle) || canRenderWithoutBundle || viewState.view === "search";

  return (
    <>
      <a className="skip-link" href="#workspace">
        Skip to workspace
      </a>
      <header className="site-header">
        <button
          className="brand"
          onClick={() =>
            navigate("search", {
              query: "",
              filter: "",
              objectType: "",
              sourceClass: "",
              controlFamily: "",
              severity: "",
            })
          }
          type="button"
        >
          <span className="brand-mark" aria-hidden="true">
            CA
          </span>
          <span>
            <strong>Control Atlas</strong>
            <small>Ctrl+Alt+Comply</small>
          </span>
        </button>
        <nav aria-label="Primary navigation" className="primary-nav">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeNavForState(viewState) === item.view;
            return (
              <button
                aria-current={active ? "page" : undefined}
                className={active ? "active nav-active" : ""}
                key={item.label}
                onClick={() => navigate(item.view)}
                type="button"
              >
                <Icon aria-hidden="true" size={16} stroke={1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="header-actions">
          <form
            className="header-search"
            onSubmit={(event) => {
              event.preventDefault();
              if (!bundle) {
                return;
              }
              navigate("search", {
                query: headerSearchDraft.trim(),
                filter: "",
                objectType: "",
                sourceClass: "",
                controlFamily: "",
                severity: "",
              });
            }}
          >
            <label className="visually-hidden" htmlFor="header-search">
              Search library and glossary
            </label>
            <div className="search-input">
              <IconSearch aria-hidden="true" size={18} stroke={1.8} />
              <input
                aria-describedby={bundle ? undefined : "header-search-hint"}
                aria-label="Search library and glossary"
                disabled={!bundle}
                id="header-search"
                onChange={(event) => setHeaderSearchDraft(event.target.value)}
                placeholder={
                  bundle?.graphReady
                    ? "Search library or glossary"
                    : "Search available — detail views load shortly"
                }
                type="search"
                value={headerSearchDraft}
              />
            </div>
            {!bundle ? (
              <p className="field-hint" id="header-search-hint">
                Library search opens once public records finish loading.
              </p>
            ) : !bundle.graphReady ? (
              <p className="field-hint" id="header-search-hint">
                Search works now. Detail pages unlock when connections finish
                loading.
              </p>
            ) : null}
          </form>
          <button
            className="secondary quiet"
            onClick={() => openHelp()}
            type="button"
          >
            Help
          </button>
          <button
            className="secondary quiet"
            onClick={() => openGlossary()}
            type="button"
          >
            Glossary
          </button>
        </div>
      </header>

      <main id="workspace">
        <section
          aria-busy={readyState === "false"}
          aria-live="polite"
          className="app-shell"
          data-app-ready={readyState}
          id="app"
        >
          {showWorkspaceContent ? (
            <AppContent
              bundle={bundle}
              heroWord={HERO_WORDS[heroWordIndex]}
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

      <footer className="site-footer">
        <p>
          Control Atlas is an open-source reference tool. It does not make compliance or authorization decisions. Official decisions remain with
          your Authorizing Official.{" "}
          <button
            className="link-action"
            onClick={() => navigate("about")}
            type="button"
          >
            About &amp; trust
          </button>
        </p>
        <p>
          Static, public, and browser-only. No accounts, tracking, backend, or
          user-data storage.
        </p>
      </footer>

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

  if (state.view === "library-detail") {
    if (!bundle) {
      return <DataPendingNotice onRetry={onRetryLoad} />;
    }
    return (
      <DetailPage
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
      <PatternsPage
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
          Try the Library search or Start Here to find the closest public
          reference path.
        </p>
        <div className="card-actions">
          <button
            className="primary"
            onClick={() => onNavigate("search", { query: state.query })}
            type="button"
          >
            Search the library
          </button>
          <button
            className="secondary"
            onClick={() => onNavigate("start-here")}
            type="button"
          >
            Start Here
          </button>
        </div>
      </section>
    );
  }

  if (!bundle) {
    return <DataPendingNotice onRetry={onRetryLoad} />;
  }

  return (
    <LibraryPage
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

function LibraryPage(props: {
  bundle: RuntimeBundle;
  graphReady: boolean;
  state: Extract<ViewState, { view: "search" }>;
  heroWord: string;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNode: (nodeId: string, from?: string) => void;
  onOpenGlossary: (termId?: string) => void;
  onOpenHelp: () => void;
  setHelpOpen: (open: boolean) => void;
}) {
  const {
    bundle,
    graphReady,
    state,
    heroWord,
    onNavigate,
    onOpenNode,
    onOpenGlossary,
    onOpenHelp,
    setHelpOpen,
  } = props;
  const [queryDraft, setQueryDraft] = useState(state.query);
  const deferredQuery = useDeferredValue(queryDraft);

  useEffect(() => {
    setQueryDraft(state.query);
  }, [state.query]);

  const filters = {
    catalog_id: state.filter || undefined,
    object_type: state.objectType || undefined,
    source_class: state.sourceClass || undefined,
    control_family: state.controlFamily || undefined,
    severity: state.severity || undefined,
  };

  const hasFilters = Boolean(
    state.filter ||
    state.objectType ||
    state.sourceClass ||
    state.controlFamily ||
    state.severity,
  );
  const landing = !state.query && !hasFilters;

  const documents = useMemo(() => {
    if (landing) {
      return [];
    }
    return bundle.runtime.searchLibrary(state.query, filters);
  }, [
    bundle.runtime,
    landing,
    state.query,
    state.filter,
    state.objectType,
    state.sourceClass,
    state.controlFamily,
    state.severity,
  ]);

  const glossaryMatches = useMemo(
    () => searchGlossary(state.query),
    [state.query],
  );
  const hasQuery = Boolean(state.query.trim());
  const hasResults = documents.length > 0 || glossaryMatches.length > 0;

  const groupedDocuments = useMemo<Record<string, any[]>>(() => {
    return /** @type {any[]} */ documents.reduce(
      (groups: Record<string, any[]>, document: any) => {
        const key = displayNameFor("object_type", document.object_type);
        groups[key] ||= [];
        groups[key].push(document);
        return groups;
      },
      {},
    );
  }, [documents]);

  const facets = bundle.runtime.getLibraryFacets();

  return (
    <>
      {landing ? (
        <section className="hero">
          <p className="eyebrow">Start with meaning</p>
          <h1>Control Atlas</h1>
          <p className="hero-rotating-line" aria-hidden="true">
            Ctrl+Alt+<span className="hero-rotating-word">{heroWord}</span>
          </p>
          <p className="hero-tagline">
            A public cyber compliance reference workspace that turns complex
            guidance into clear, traceable action.
          </p>
          <div className="hero-actions">
            <button
              className="primary"
              onClick={() => onNavigate("start-here")}
              type="button"
            >
              Start Here
            </button>
            <button
              className="secondary"
              onClick={() => onOpenGlossary()}
              type="button"
            >
              Open glossary
            </button>
          </div>
          <section className="intent-grid">
            <QuickIntentCard
              actionLabel="Search AC-2"
              body="Find a control, CCI, STIG, baseline, or topic and see what it connects to."
              icon={<IconSearch size={20} stroke={1.8} />}
              onClick={() => onNavigate("search", { query: "AC-2" })}
              title="Library"
            />
            <QuickIntentCard
              actionLabel="Compare frameworks"
              body="Start with an intent, then review source-backed mappings without filter clutter."
              icon={<IconGitCompare size={20} stroke={1.8} />}
              onClick={() => onNavigate("matrix")}
              title="Compare"
            />
            <QuickIntentCard
              actionLabel="Pick a starter"
              body="Choose the artifact you need first, then reveal extra options only if they help."
              icon={<IconFileDescription size={20} stroke={1.8} />}
              onClick={() => onNavigate("templates")}
              title="Templates"
            />
          </section>
        </section>
      ) : null}

      <section className="panel search-panel">
        <PageHeader
          eyebrow="Library"
          action={
            <button
              className="secondary"
              onClick={() => onNavigate("start-here")}
              type="button"
            >
              Guided path
            </button>
          }
          summary="Search by ID or topic, review what the item means, see where it connects, and open the next best reference."
          title="Search the public reference library"
        />

        {!graphReady ? (
          <p className="notice-inline" role="status">
            Search is ready. Detail pages and comparisons unlock when
            connection data finishes loading.
          </p>
        ) : null}

        <form
          className="search-form"
          onSubmit={(event) => {
            event.preventDefault();
            onNavigate("search", { ...state, query: deferredQuery.trim() });
          }}
        >
          <label className="field grow" htmlFor="search-query">
            <span>ID, title, or topic</span>
            <div className="search-input">
              <IconSearch aria-hidden="true" size={18} stroke={1.8} />
              <input
                id="search-query"
                onChange={(event) => setQueryDraft(event.target.value)}
                placeholder="AC-2, account management, CCI-000225"
                type="search"
                value={queryDraft}
              />
            </div>
          </label>
          <button className="primary" type="submit">
            Search
          </button>
        </form>

        <Accordion.Root className="accordion-root" collapsible type="single">
          <DisclosurePanel title="Refine results" value="filters">
            <div className="filter-grid">
              <SelectField
                label="Catalog"
                onChange={(value) =>
                  onNavigate("search", { ...state, filter: value })
                }
                options={bundle.runtime
                  .getCatalogs()
                  .map((catalog: any) => ({
                    value: catalog.id,
                    label: catalog.name,
                  }))}
                value={state.filter}
              />
              <SelectField
                label="Item type"
                onChange={(value) =>
                  onNavigate("search", { ...state, objectType: value })
                }
                options={facets.objectTypes.map((value: string) => ({
                  value,
                  label: displayNameFor("object_type", value),
                }))}
                value={state.objectType}
              />
              <SelectField
                label="Source type"
                onChange={(value) =>
                  onNavigate("search", { ...state, sourceClass: value })
                }
                options={facets.sourceClasses.map((value: string) => ({
                  value,
                  label: displayNameFor("provenance_class", value),
                }))}
                value={state.sourceClass}
              />
              <SelectField
                label="Control family"
                onChange={(value) =>
                  onNavigate("search", { ...state, controlFamily: value })
                }
                options={facets.controlFamilies.map((value: string) => ({
                  value,
                  label: value,
                }))}
                value={state.controlFamily}
              />
              <SelectField
                label="Severity"
                onChange={(value) =>
                  onNavigate("search", { ...state, severity: value })
                }
                options={facets.severities.map((value: string) => ({
                  value,
                  label: value,
                }))}
                value={state.severity}
              />
            </div>
          </DisclosurePanel>
        </Accordion.Root>

        {hasResults ? (
          <div className="stack" id="library-results">
            {glossaryMatches.length ? (
              <section className="result-group">
                <div className="result-group-header">
                  <h2>Glossary</h2>
                  <Badge>{glossaryMatches.length} results</Badge>
                </div>
                <div className="stack">
                  {glossaryMatches.map((entry) => (
                    <article className="result-card" key={entry.id}>
                      <div className="result-card-header">
                        <div>
                          <p className="result-meta">Glossary term</p>
                          <h3>
                            {entry.term}
                            {entry.expansion ? ` · ${entry.expansion}` : ""}
                          </h3>
                        </div>
                        <Badge tone={entry.consensus ? "warning" : "success"}>
                          {entry.consensus
                            ? "Practitioner consensus"
                            : "Official source"}
                        </Badge>
                      </div>
                      <p className="result-summary">{entry.definition}</p>
                      <div className="chip-row">
                        {entry.related_patterns.map((patternId) => (
                          <button
                            className="chip"
                            key={patternId}
                            onClick={() =>
                              onNavigate("patterns", { pattern: patternId })
                            }
                            type="button"
                          >
                            {PATTERN_RENAMES[patternId] || patternId}
                          </button>
                        ))}
                        {entry.relatedTemplateIds.map((templateId) => (
                          <button
                            className="chip"
                            key={templateId}
                            onClick={() =>
                              onNavigate("templates", {
                                templateType: templateId,
                              })
                            }
                            type="button"
                          >
                            {templateId.replaceAll("_", " ")}
                          </button>
                        ))}
                      </div>
                      <div className="card-actions">
                        <button
                          className="primary"
                          onClick={() => onOpenGlossary(entry.id)}
                          type="button"
                        >
                          Open term details
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
            {Object.entries(groupedDocuments as Record<string, any[]>).map(
              ([group, entries]) => (
                <section className="result-group" key={group}>
                  <div className="result-group-header">
                    <h2>{group}</h2>
                    <Badge>{entries.length} results</Badge>
                  </div>
                  <div className="stack">
                    {entries.map((document) => {
                      const source = bundle.runtime.getSource(
                        document.source_id,
                      );
                      const node = bundle.runtime.getNode(document.id);
                      const relationshipCount = node
                        ? bundle.runtime.getEdgesForNode(node.id, {
                            publication_status: "published",
                          }).length
                        : 0;
                      return (
                        <article className="result-card" key={document.id}>
                          <div className="result-card-header">
                            <div>
                              <p className="result-meta">
                                {displayNameFor(
                                  "object_type",
                                  document.object_type,
                                )}
                              </p>
                              <h3>
                                {document.item_id} - {document.title}
                              </h3>
                            </div>
                            <Badge tone="info">
                              {relationshipCount} public connections
                            </Badge>
                          </div>
                          <p className="result-summary">
                            {document.plain_language_summary ||
                              node?.plain_language_summary ||
                              document.description}
                          </p>
                          <div className="result-support">
                            <span>
                              Primary source:{" "}
                              {source?.display_name ||
                                source?.name ||
                                "Source unavailable"}
                            </span>
                            <span>{sourceTrustSummary(source)}</span>
                          </div>
                          <div className="card-actions">
                            <button
                              className="primary"
                              disabled={!graphReady}
                              onClick={() => onOpenNode(document.id, "search")}
                              title={
                                graphReady
                                  ? undefined
                                  : "Detail views unlock when connections finish loading"
                              }
                              type="button"
                            >
                              Open detail
                            </button>
                            <button
                              className="secondary"
                              disabled={!graphReady}
                              onClick={() =>
                                onNavigate("matrix", {
                                  workbench: "relationships",
                                  items: document.item_id,
                                })
                              }
                              type="button"
                            >
                              Compare connections
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ),
            )}
          </div>
        ) : !landing && hasQuery ? (
          <section className="empty-state">
            <IconSparkles aria-hidden="true" size={24} stroke={1.8} />
            <h2>No public matches found</h2>
            <p>
              Try a known identifier, a shorter phrase, or Start Here if you
              need help finding the right artifact first.
            </p>
            <div className="card-actions">
              <button
                className="secondary"
                onClick={() =>
                  onNavigate("search", {
                    query: "AC-2",
                    filter: "",
                    objectType: "",
                    sourceClass: "",
                    controlFamily: "",
                    severity: "",
                  })
                }
                type="button"
              >
                Try AC-2
              </button>
              <button
                className="secondary"
                onClick={() =>
                  onNavigate("search", {
                    query: "account management",
                    filter: "",
                    objectType: "",
                    sourceClass: "",
                    controlFamily: "",
                    severity: "",
                  })
                }
                type="button"
              >
                Try account management
              </button>
              <button
                className="primary"
                onClick={() => onNavigate("start-here")}
                type="button"
              >
                Start Here
              </button>
            </div>
          </section>
        ) : null}
      </section>
    </>
  );
}

function DetailPage(props: {
  bundle: RuntimeBundle;
  state: Extract<ViewState, { view: "library-detail" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenGlossary: (termId?: string) => void;
  onOpenNode: (nodeId: string, from?: string) => void;
}) {
  const { bundle, state, onNavigate, onOpenGlossary, onOpenNode } = props;
  const node = bundle.runtime.getNode(state.node);
  const document = bundle.runtime.getLibraryDocument(state.node);
  const source = document
    ? bundle.runtime.getSource(document.source_id)
    : bundle.runtime.getSource(node?.source_id);
  const edges = node
    ? bundle.runtime.getEdgesForNode(node.id, {
        publication_status: "published",
      })
    : [];
  const grouped = node
    ? groupRelationships(edges, node.id, bundle.runtime)
    : [];
  const federalContext = node
    ? bundle.runtime.getFederalContext(node.id)
    : null;
  const advancedRelationships = edges.slice(0, 25);

  if (!node || !document) {
    return (
      <section className="notice">
        <h2>Item not found</h2>
        <p>This deep link does not match a current public library entry.</p>
        <button
          className="primary"
          onClick={() => onNavigate("search")}
          type="button"
        >
          Back to Library
        </button>
      </section>
    );
  }

  const locationSummary = [
    ...((federalContext?.baselineMembership || []).map(
      (entry: any) => entry.baselineNode?.metadata?.item_id,
    ) || []),
    ...((federalContext?.fedrampBaselineContext || []).map(
      (entry: any) => entry.baselineNode?.metadata?.item_id,
    ) || []),
  ].filter(Boolean);

  const relatedGlossaryTerms = glossaryTermsForDocument(document);

  return (
    <section className="detail-page">
      <StickyDetailBar
        enabled={Boolean(state.from)}
        itemLabel={document.item_id}
        onBack={() =>
          onNavigate("search", { query: state.from || document.item_id })
        }
      />
      <div className="breadcrumbs">
        <button onClick={() => onNavigate("search")} type="button">
          Library
        </button>
        <span>/</span>
        <span>{document.item_id}</span>
      </div>

      <PageHeader
        eyebrow={displayNameFor("object_type", document.object_type)}
        action={
          <div className="page-header-actions">
            <button
              className="secondary"
              onClick={() =>
                onNavigate("search", { query: state.from || document.item_id })
              }
              type="button"
            >
              Back to results
            </button>
            <button
              className="secondary"
              onClick={() => {
                void copyText(document.item_id);
              }}
              type="button"
            >
              Copy ID
            </button>
            <button
              className="secondary"
              onClick={() => {
                void copyText(
                  `${window.location.origin}${window.location.pathname}${serializeViewState(state)}`,
                );
              }}
              type="button"
            >
              Copy link
            </button>
          </div>
        }
        summary="Open with meaning first, review where this item appears, then use the grouped relationships and source support to decide what to do next."
        title={document.title}
      />

      <div className="detail-grid">
        <section className="stack">
          <SummaryCard title="What this is" tone="trust">
            <p>
              {node.plain_language_summary ||
                document.plain_language_summary ||
                document.description}
            </p>
          </SummaryCard>
          <SummaryCard title="Why it matters">
            <p>
              {document.item_id} is part of the public compliance library. Use
              it to understand the requirement, see the public connections
              around it, and decide which comparison or planning artifact to
              open next.
            </p>
          </SummaryCard>
          <SummaryCard title="Where it appears">
            <p>
              {locationSummary.length
                ? `This item appears in ${locationSummary.join(", ")}.`
                : node.node_type === "attack_technique" ||
                    node.node_type === "defend_countermeasure"
                  ? "This MITRE item connects through the public threat lens rather than a baseline membership list."
                  : "This item does not have a published baseline placement summary yet."}
            </p>
          </SummaryCard>
          {node.node_type === "attack_technique" ? (
            <SummaryCard title="Threat context">
              <p>
                Domain:{" "}
                {node.metadata?.attack_domain === "ics"
                  ? "ICS ATT&CK"
                  : "Enterprise ATT&CK"}
              </p>
              {node.metadata?.tactics?.length ? (
                <p>Tactics: {node.metadata.tactics.join(", ")}</p>
              ) : null}
              {node.metadata?.platforms?.length ? (
                <p>Platforms: {node.metadata.platforms.join(", ")}</p>
              ) : null}
            </SummaryCard>
          ) : null}

          <section className="panel">
            <div className="section-header">
              <div>
                <h2>What it connects to</h2>
                <p>
                  Related items are grouped by how a practitioner is likely to
                  use them.
                </p>
              </div>
              <div className="section-header-actions">
                {edges.length ? (
                  <button
                    className="primary"
                    onClick={() =>
                      onNavigate("library-detail", {
                        node: state.node,
                        from: state.from,
                        relationshipView:
                          state.relationshipView === "map" ||
                          state.relationshipView === "table"
                            ? ""
                            : "map",
                      })
                    }
                    type="button"
                  >
                    {state.relationshipView === "map" ||
                    state.relationshipView === "table"
                      ? "Hide map"
                      : "View connections as a visual map"}
                  </button>
                ) : null}
                <Badge tone="info">{edges.length} published links</Badge>
              </div>
            </div>

            {state.relationshipView === "map" ||
            state.relationshipView === "table" ? (
              <RelationshipExplorer
                centerItemId={document.item_id}
                centerNodeId={node.id}
                filters={relationshipFiltersFromState(state)}
                onFilterChange={(patch) =>
                  onNavigate("library-detail", {
                    node: state.node,
                    from: state.from,
                    relationshipView: state.relationshipView || "map",
                    ...relationshipFiltersToPatch(patch),
                  })
                }
                onOpenNode={(nodeId) =>
                  onOpenNode(nodeId, state.from || "search")
                }
                onViewChange={(view) =>
                  onNavigate("library-detail", {
                    node: state.node,
                    from: state.from,
                    relationshipView: view,
                    relationshipType: state.relationshipType,
                    provenance: state.provenance,
                    confidence: state.confidence,
                    nodeType: state.nodeType,
                    includeCandidates: state.includeCandidates,
                    relationshipSearch: state.relationshipSearch,
                  })
                }
                relationshipView={
                  state.relationshipView === "table" ? "table" : "map"
                }
                runtime={bundle.runtime}
              />
            ) : null}

            <RelationshipGroupsSection
              formatRelationshipLabel={formatRelationshipLabel}
              groups={grouped}
              onOpenNode={(nodeId) => onOpenNode(nodeId, state.from || "search")}
              source={source}
              sourceTrustSummary={sourceTrustSummary}
            />
          </section>

          <SummaryCard title="Official text / source excerpt">
            <p>{document.description || "No public description available."}</p>
            {source?.artifact_url ? (
              <p>
                <a
                  href={source.artifact_url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Open official source document
                </a>
              </p>
            ) : null}
          </SummaryCard>
        </section>

        <aside className="stack detail-sidebar">
          <SummaryCard title="Connection summary" tone="trust">
            <p>
              {edges.length
                ? `${edges.length} published links across ${grouped.length} group${grouped.length === 1 ? "" : "s"}.`
                : "No published connections yet."}
            </p>
            {edges.length ? (
              <div className="card-actions">
                <button
                  className="primary"
                  onClick={() =>
                    onNavigate("library-detail", {
                      node: state.node,
                      from: state.from,
                      relationshipView: "map",
                    })
                  }
                  type="button"
                >
                  View connections as a visual map
                </button>
                <button
                  className="secondary"
                  onClick={() =>
                    onNavigate("matrix", {
                      workbench: "relationships",
                      items: document.item_id,
                    })
                  }
                  type="button"
                >
                  Compare this item
                </button>
              </div>
            ) : null}
          </SummaryCard>
          <SummaryCard title="Source support" tone="trust">
            <p>{sourceTrustSummary(source)}</p>
            <p className="support-meta">
              Primary source:{" "}
              {source?.display_name || source?.name || "Unavailable"}
            </p>
            <div className="card-actions">
              <button
                className="secondary"
                onClick={() =>
                  onNavigate("sources", { source: source?.id || "" })
                }
                type="button"
              >
                View data sources
              </button>
            </div>
          </SummaryCard>

          <SummaryCard title="What to do next">
            <div className="stack compact">
              {edges.length ? (
                <button
                  className="link-action"
                  onClick={() =>
                    onNavigate("library-detail", {
                      node: state.node,
                      from: state.from,
                      relationshipView: "map",
                    })
                  }
                  type="button"
                >
                  <IconLink aria-hidden="true" size={16} stroke={1.8} />
                  <span>View connections as a visual map</span>
                </button>
              ) : null}
              {node.node_type === "attack_technique" ? (
                <button
                  className="link-action"
                  onClick={() =>
                    onNavigate("matrix", {
                      workbench: "threat-chain",
                      chainCatalog: node.metadata?.catalog_id || "",
                      chainItem: node.id,
                    })
                  }
                  type="button"
                >
                  <IconGitCompare aria-hidden="true" size={16} stroke={1.8} />
                  <span>Trace this technique to D3FEND and NIST controls</span>
                </button>
              ) : null}
              <button
                className="link-action"
                onClick={() =>
                  onNavigate("matrix", {
                    workbench: "relationships",
                    items: document.item_id,
                  })
                }
                type="button"
              >
                <IconGitCompare aria-hidden="true" size={16} stroke={1.8} />
                <span>Compare this item against other public mappings</span>
              </button>
              <button
                className="link-action"
                onClick={() => onNavigate("templates")}
                type="button"
              >
                <IconClipboardList aria-hidden="true" size={16} stroke={1.8} />
                <span>Open starter template</span>
              </button>
            </div>
          </SummaryCard>

          {relatedGlossaryTerms.length ? (
            <SummaryCard title="Related terms">
              <p>
                Plain-language definitions for terms that often appear around
                this item.
              </p>
              <ExpandableChipList
                items={relatedGlossaryTerms}
                onSelect={(id) => onOpenGlossary(id)}
              />
            </SummaryCard>
          ) : null}

          <Accordion.Root className="accordion-root" collapsible type="single">
            <DisclosurePanel title="Advanced details" value="advanced">
              <div className="advanced-list">
                <div>
                  <span>Item type</span>
                  <strong>
                    {displayNameFor("object_type", document.object_type)}
                  </strong>
                </div>
                <div>
                  <span>Source location</span>
                  <strong>{source?.artifact_url || "Not recorded"}</strong>
                </div>
                <div>
                  <span>Node ID</span>
                  <strong>{node.id}</strong>
                </div>
              </div>
              <table className="detail-table">
                <thead>
                  <tr>
                    <th>Connected item</th>
                    <th>Connection</th>
                    <th>Source type</th>
                    <th>Trust level</th>
                  </tr>
                </thead>
                <tbody>
                  {advancedRelationships.map((edge: any) => {
                    const counterpartId =
                      edge.source_node_id === node.id
                        ? edge.target_node_id
                        : edge.source_node_id;
                    const counterpart = bundle.runtime.getNode(counterpartId);
                    return (
                      <tr key={edge.id}>
                        <td>
                          {counterpart?.metadata?.item_id || counterpartId}
                        </td>
                        <td>{formatRelationshipLabel(edge)}</td>
                        <td>
                          {displayNameFor(
                            "provenance_class",
                            edge.provenance_class,
                          )}
                        </td>
                        <td>{formatConfidence(edge.confidence)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </DisclosurePanel>
          </Accordion.Root>
        </aside>
      </div>
    </section>
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

function ComparePage(props: {
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
                <>
                  <section className="compare-results" id="compare-results" ref={compareResultsRef}>
                  <div className="summary-grid">
                    <SummaryCard title="What this is">
                      <p>
                        {relationshipRows.rows.length} visible public
                        connections match the current comparison.
                      </p>
                    </SummaryCard>
                    <SummaryCard title="Why it matters">
                      <p>
                        Official and inferred relationships stay separate so you
                        can judge trust before acting on the mapping.
                      </p>
                    </SummaryCard>
                    <SummaryCard title="What to do next">
                      <p>
                        Review the summary first, then open detailed mappings
                        only if you need the exact row-level trace.
                      </p>
                    </SummaryCard>
                  </div>
                  <CompareExportDisclosure onExport={exportRows} />
                  <div className="card-actions">
                    <button
                      className="primary"
                      onClick={() => setDetailedMappingsOpen("rows")}
                      type="button"
                    >
                      View detailed mappings
                    </button>
                  </div>
                  <Accordion.Root
                    className="accordion-root"
                    collapsible
                    onValueChange={setDetailedMappingsOpen}
                    type="single"
                    value={detailedMappingsOpen}
                  >
                    <DisclosurePanel title="Detailed mappings table" value="rows">
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
                                <span className="muted">{row.from_title}</span>
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
                                {displayNameFor("confidence", row.confidence)}
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
                  </section>
                </>
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
                                  <li className="chain-link-item" key={node.id}>
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
                                No NIST controls reached from the visible D3FEND
                                links.
                              </li>
                            )}
                          </ul>
                        </SummaryCard>
                        <SummaryCard title="Unmapped D3FEND countermeasures">
                          <ul className="source-ref-list">
                            {selectedThreatChain.unmapped_d3fend_nodes.length ? (
                              selectedThreatChain.unmapped_d3fend_nodes.map(
                                (node: any) => (
                                  <li className="chain-link-item" key={node.id}>
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
                  <div className="summary-grid">
                    <SummaryCard title="Shared controls">
                      <p>{baselineComparison.shared.length}</p>
                    </SummaryCard>
                    <SummaryCard title="Only in A">
                      <p>{baselineComparison.only_a.length}</p>
                    </SummaryCard>
                    <SummaryCard title="Only in B">
                      <p>{baselineComparison.only_b.length}</p>
                    </SummaryCard>
                  </div>
                  <CompareExportDisclosure onExport={exportRows} />
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

function SourcesPage(props: {
  bundle: RuntimeBundle;
  state: Extract<ViewState, { view: "sources" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  const { bundle, state, onNavigate } = props;
  const sources = bundle.runtime.getSources({
    provenance_class: state.provenance || undefined,
    eligibility_status: state.eligibility || undefined,
    lifecycle_status: state.lifecycle || undefined,
    access_status: state.access || undefined,
  });
  const selectedSource = state.source
    ? bundle.runtime.getSource(state.source)
    : null;

  const distinct = (key: string) =>
    [
      ...new Set(
        bundle.runtime.dataset.sources
          .map((source: any) => source[key])
          .filter(Boolean),
      ),
    ] as string[];

  const groupedSources = useMemo(() => {
    const groups = new Map<string, any[]>();
    for (const source of sources) {
      const key = displayNameFor("provenance_class", source.provenance_class);
      const bucket = groups.get(key) || [];
      bucket.push(source);
      groups.set(key, bucket);
    }
    return [...groups.entries()].sort(([left], [right]) =>
      left.localeCompare(right),
    );
  }, [sources]);

  return (
    <section className="panel">
      <PageHeader
        eyebrow="Sources"
        summary="Review what a source is, how Control Atlas uses it, and how much trust to place in the resulting public mapping."
        title="Review sources before you rely on a match"
      />

      <SummaryCard title="How to read this page" tone="trust">
        <p>
          <strong>Included in map</strong> shows whether Control Atlas uses this
          source in public relationship views. <strong>Status</strong> reflects
          whether the source is current or deprecated. <strong>Access</strong>{" "}
          notes whether the artifact is publicly reachable.{" "}
          <strong>Source type</strong> describes where the data came from.
        </p>
      </SummaryCard>

      <Accordion.Root className="accordion-root" collapsible type="single">
        <DisclosurePanel title="Refine sources" value="filters">
          <div className="filter-grid">
            <SelectField
              emptyLabel="All source types"
              label="Source type"
              onChange={(value) =>
                onNavigate("sources", { ...state, provenance: value })
              }
              options={distinct("provenance_class").map((value) => ({
                value,
                label: displayNameFor("provenance_class", value),
              }))}
              value={state.provenance}
            />
            <SelectField
              emptyLabel="All map inclusion states"
              label="Included in map"
              onChange={(value) =>
                onNavigate("sources", { ...state, eligibility: value })
              }
              options={distinct("eligibility_status").map((value) => ({
                value,
                label: displayNameFor("eligibility_status", value),
              }))}
              value={state.eligibility}
            />
            <SelectField
              emptyLabel="All statuses"
              label="Status"
              onChange={(value) =>
                onNavigate("sources", { ...state, lifecycle: value })
              }
              options={distinct("lifecycle_status").map((value) => ({
                value,
                label: displayNameFor("lifecycle_status", value),
              }))}
              value={state.lifecycle}
            />
            <SelectField
              emptyLabel="All access levels"
              label="Access"
              onChange={(value) =>
                onNavigate("sources", { ...state, access: value })
              }
              options={distinct("access_status").map((value) => ({
                value,
                label: displayNameFor("access_status", value),
              }))}
              value={state.access}
            />
          </div>
        </DisclosurePanel>
      </Accordion.Root>

      {selectedSource ? (
        <section className="stack">
          <SourceSummaryCard source={selectedSource} />
          <SummaryCard title="What this source is" tone="trust">
            <p>{selectedSource.name}</p>
          </SummaryCard>
          <SummaryCard title="How Control Atlas uses it">
            <p>
              {sourceUsageSummary(selectedSource)}. Parser:{" "}
              {selectedSource.metadata?.parser || "Not recorded"}.
            </p>
          </SummaryCard>
          <SummaryCard title="Trust and status">
            <p>{sourceTrustSummary(selectedSource)}</p>
            <p>
              {displayNameFor(
                "lifecycle_status",
                selectedSource.lifecycle_status,
              )}{" "}
              · {displayNameFor("access_status", selectedSource.access_status)}
            </p>
          </SummaryCard>
          <Accordion.Root className="accordion-root" collapsible type="single">
            <DisclosurePanel title="Advanced metadata" value="metadata">
              <div className="advanced-list">
                <div>
                  <span>Owner</span>
                  <strong>{selectedSource.owner}</strong>
                </div>
                <div>
                  <span>Version</span>
                  <strong>{selectedSource.version}</strong>
                </div>
                <div>
                  <span>Retrieved</span>
                  <strong>{selectedSource.retrieved_at}</strong>
                </div>
              </div>
            </DisclosurePanel>
          </Accordion.Root>
        </section>
      ) : (
        <Accordion.Root
          className="accordion-root source-groups"
          collapsible
          defaultValue={groupedSources[0]?.[0] || ""}
          type="single"
        >
          {groupedSources.map(([groupLabel, groupSources]) => (
            <DisclosurePanel
              key={groupLabel}
              title={`${groupLabel} (${groupSources.length})`}
              value={groupLabel}
            >
              <div className="stack">
                {groupSources.map((source: any) => (
                  <SourceSummaryCard
                    key={source.id}
                    onOpen={() =>
                      onNavigate("sources", { ...state, source: source.id })
                    }
                    source={source}
                  />
                ))}
              </div>
            </DisclosurePanel>
          ))}
        </Accordion.Root>
      )}
    </section>
  );
}

function TemplatesPage(props: {
  bundle: RuntimeBundle;
  state: Extract<ViewState, { view: "templates" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  const { bundle, state, onNavigate } = props;
  const generationRef = useRef<HTMLElement | null>(null);
  const generateButtonRef = useRef<HTMLButtonElement | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [queryFilter, setQueryFilter] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const templates = (bundle.templateRegistry.templates || []) as Array<{
    name: string;
    display_name: string;
    description: string;
    supported_formats: string[];
    input_options: string[];
    source_refs?: Array<Record<string, string>>;
  }>;
  const filteredTemplates = useMemo(
    () =>
      filterByCategoryAndQuery(
        templates,
        TEMPLATE_CATEGORIES,
        (template: any) => template.name,
        (template: any) =>
          `${template.display_name} ${template.description} ${template.name}`,
        { category: categoryFilter, query: queryFilter },
      ),
    [categoryFilter, queryFilter, templates],
  );
  const groupedTemplates = useMemo(
    () =>
      groupItemsByCategory(
        filteredTemplates,
        TEMPLATE_CATEGORIES,
        (template: any) => template.name,
      ),
    [filteredTemplates],
  );
  const selectedTemplate =
    templates.find((template: any) => template.name === state.templateType) ||
    null;
  const catalogOptions = bundle.runtime
    .getCatalogs()
    .map((catalog: any) => ({ value: catalog.id, label: catalog.name }));
  const formatLabels: Record<string, string> = {
    markdown: "Markdown",
    csv: "CSV",
    json: "JSON",
    yaml: "YAML",
  };
  const supportedFormats = selectedTemplate?.supported_formats || ["markdown"];
  const activeFormat = supportedFormats.includes(state.format || "markdown")
    ? state.format || supportedFormats[0]
    : supportedFormats[0];

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }
    generationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    generateButtonRef.current?.focus();
  }, [selectedTemplate?.name]);

  function createTemplate() {
    if (!selectedTemplate || generating) {
      return;
    }
    setGenerating(true);
    setGenerationStatus("");
    try {
      const generated = generateTemplate(
        {
          templateType: selectedTemplate.name,
          framework: state.framework || "nist-800-53",
          format: activeFormat,
          environment: state.environment || "Generic",
          includePlaceholders: true,
          includeImplementationPrompts: true,
          includeEvidenceExpectations: true,
          includeInheritancePrompts: true,
          includeReciprocityPrompts: true,
          includeSourceFootnotes: true,
          includeStigReferences: true,
          sourceRefs: selectedTemplate.source_refs || [],
          sources: bundle.runtime.dataset?.sources || [],
        },
        bundle.runtime.dataset,
      );

      downloadTextFile(generated.filename, generated.content, generated.mimeType);
      setGenerationStatus(
        `Download started for ${generated.filename}. Check your downloads folder.`,
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section className="panel">
      <PageHeader
        eyebrow="Templates"
        summary="Choose the artifact you need first, review what it is for, then generate a blank reference starter without exposing extra options too early."
        title="What are you trying to create?"
      />

      <CatalogFilterBar
        category={categoryFilter}
        categoryOptions={[...Object.keys(TEMPLATE_CATEGORIES), "Other"]}
        countLabel={`${filteredTemplates.length} template${filteredTemplates.length === 1 ? "" : "s"} in ${groupedTemplates.size} categor${groupedTemplates.size === 1 ? "y" : "ies"}`}
        onCategoryChange={setCategoryFilter}
        onQueryChange={setQueryFilter}
        query={queryFilter}
        queryPlaceholder="Search templates by name or purpose"
      />

      {[...groupedTemplates.entries()].map(([category, categoryTemplates]) => (
        <section className="catalog-group" key={category}>
          <h2 className="catalog-group-title">{category}</h2>
          <div className="intent-grid">
            {categoryTemplates.map((template: any) => (
              <QuickIntentCard
                actionLabel="Select this template"
                body={template.description}
                icon={<IconFileDescription size={20} stroke={1.8} />}
                key={template.name}
                onClick={() =>
                  onNavigate("templates", {
                    templateType: template.name,
                    framework: state.framework || "nist-800-53",
                    format: template.supported_formats?.[0] || "markdown",
                    environment: state.environment || "Generic",
                  })
                }
                title={template.display_name}
              />
            ))}
          </div>
        </section>
      ))}

      {selectedTemplate ? (
        <section className="stack" ref={generationRef}>
          <SummaryCard title="What this template is for" tone="trust">
            <p>{selectedTemplate.description}</p>
          </SummaryCard>
          <SummaryCard title="What it includes">
            <p>
              Supported formats: {selectedTemplate.supported_formats.join(", ")}
              . Inputs: {selectedTemplate.input_options.join(", ")}.
            </p>
          </SummaryCard>
          {generationStatus ? (
            <p className="generation-status" role="status">
              {generationStatus}
            </p>
          ) : null}
          <div className="card-actions">
            <button
              className="primary"
              disabled={generating}
              onClick={createTemplate}
              ref={generateButtonRef}
              type="button"
            >
              {generating
                ? "Generating…"
                : `Generate ${selectedTemplate.display_name}`}
            </button>
          </div>
          <Accordion.Root
            className="accordion-root"
            collapsible
            defaultValue="options"
            type="single"
          >
            <DisclosurePanel title="More options" value="options">
              <div className="filter-grid">
                <SelectField
                  label="Framework"
                  onChange={(value) =>
                    onNavigate("templates", { ...state, framework: value })
                  }
                  options={catalogOptions}
                  value={state.framework || "nist-800-53"}
                />
                <p className="field-hint" id="template-framework-hint">
                  Which control catalog the template should reference.
                </p>
                <SelectField
                  label="Environment"
                  onChange={(value) =>
                    onNavigate("templates", { ...state, environment: value })
                  }
                  options={[
                    { value: "Generic", label: "Generic" },
                    { value: "Cloud SaaS", label: "Cloud SaaS" },
                    { value: "Platform service", label: "Platform service" },
                    { value: "Enclave", label: "Enclave" },
                    { value: "On-premises", label: "On-premises" },
                    { value: "Hybrid", label: "Hybrid" },
                    {
                      value: "Enterprise service",
                      label: "Enterprise service",
                    },
                  ]}
                  value={state.environment || "Generic"}
                />
                <p className="field-hint">
                  Where the system runs — cloud, on-premises, or hybrid.
                </p>
                <SelectField
                  label="Format"
                  onChange={(value) =>
                    onNavigate("templates", { ...state, format: value })
                  }
                  options={supportedFormats.map((format: string) => ({
                    value: format,
                    label: formatLabels[format] || format,
                  }))}
                  value={activeFormat}
                />
                <p className="field-hint">
                  File type for download: Markdown, CSV, or JSON.
                </p>
              </div>
            </DisclosurePanel>
          </Accordion.Root>
        </section>
      ) : null}
    </section>
  );
}

function PatternsPage(props: {
  state: Extract<ViewState, { view: "patterns" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNodeByItemId: (itemId: string) => void;
  onOpenGlossary: (termId?: string) => void;
  setHelpOpen: (open: boolean) => void;
}) {
  const { state, onNavigate, onOpenNodeByItemId, onOpenGlossary, setHelpOpen } =
    props;
  const [categoryFilter, setCategoryFilter] = useState("");
  const [queryFilter, setQueryFilter] = useState("");
  const selectedPattern =
    patternsData.find((pattern) => pattern.id === state.pattern) || null;
  const patternGlossaryTerms = selectedPattern
    ? glossaryTermsForPattern(selectedPattern.id)
    : [];
  const filteredPatterns = useMemo(
    () =>
      filterByCategoryAndQuery(
        patternsData,
        PATTERN_CATEGORIES,
        (pattern) => pattern.id,
        (pattern) =>
          `${PATTERN_RENAMES[pattern.id] || pattern.title} ${pattern.summary}`,
        { category: categoryFilter, query: queryFilter },
      ),
    [categoryFilter, queryFilter],
  );
  const groupedPatterns = useMemo(
    () =>
      groupItemsByCategory(
        filteredPatterns,
        PATTERN_CATEGORIES,
        (pattern) => pattern.id,
      ),
    [filteredPatterns],
  );

  if (!selectedPattern) {
    const recommendedPatterns = patternsData.filter((pattern) =>
      RECOMMENDED_PATTERN_IDS.includes(pattern.id),
    );

    return (
      <section className="panel">
        <PageHeader
          eyebrow="Patterns"
          summary="Open the outcome you are trying to solve, then review when it helps, how it works, common mistakes, and the related controls or templates."
          title="Patterns organized around user outcomes"
        />
        <CatalogFilterBar
          category={categoryFilter}
          categoryOptions={[...Object.keys(PATTERN_CATEGORIES), "Other"]}
          countLabel={`${filteredPatterns.length} pattern${filteredPatterns.length === 1 ? "" : "s"} in ${groupedPatterns.size} categor${groupedPatterns.size === 1 ? "y" : "ies"}`}
          onCategoryChange={setCategoryFilter}
          onQueryChange={setQueryFilter}
          query={queryFilter}
          queryPlaceholder="Search patterns by outcome or topic"
        />
        <section className="catalog-group recommended-patterns">
          <h2 className="catalog-group-title">Recommended for new users</h2>
          <p className="field-hint">
            Start with these three if you are new to federal compliance mapping.
          </p>
          <div className="intent-grid">
            {recommendedPatterns.map((pattern) => (
              <QuickIntentCard
                actionLabel="Open this pattern"
                body={pattern.summary}
                icon={<IconBook2 size={20} stroke={1.8} />}
                key={pattern.id}
                onClick={() => onNavigate("patterns", { pattern: pattern.id })}
                title={PATTERN_RENAMES[pattern.id] || pattern.title}
              />
            ))}
          </div>
        </section>
        {[...groupedPatterns.entries()].map(([category, categoryPatterns]) => (
          <section className="catalog-group" key={category}>
            <h2 className="catalog-group-title">{category}</h2>
            <div className="intent-grid">
              {categoryPatterns.map((pattern) => (
                <QuickIntentCard
                  actionLabel="Open this pattern"
                  body={pattern.summary}
                  icon={<IconBook2 size={20} stroke={1.8} />}
                  key={pattern.id}
                  onClick={() => onNavigate("patterns", { pattern: pattern.id })}
                  title={PATTERN_RENAMES[pattern.id] || pattern.title}
                />
              ))}
            </div>
          </section>
        ))}
      </section>
    );
  }

  return (
    <section className="panel">
      <PageHeader
        eyebrow="Pattern"
        action={
          <button
            className="secondary"
            onClick={() => onNavigate("patterns", { pattern: "" })}
            type="button"
          >
            Back to patterns
          </button>
        }
        summary="Pattern pages lead with the problem they solve, when to use them, how they work, common mistakes, and the next action to take."
        title={PATTERN_RENAMES[selectedPattern.id] || selectedPattern.title}
      />
      <div className="detail-grid">
        <section className="stack">
          <SummaryCard title="Purpose" tone="trust">
            <p>{selectedPattern.summary}</p>
          </SummaryCard>
          {patternGlossaryTerms.length ? (
            <SummaryCard title="Related glossary terms">
              <div className="chip-row">
                {patternGlossaryTerms.map((entry) => (
                  <button
                    className="chip"
                    key={entry.id}
                    onClick={() => onOpenGlossary(entry.id)}
                    type="button"
                  >
                    {entry.term}
                  </button>
                ))}
              </div>
            </SummaryCard>
          ) : null}
          <SummaryCard title="When to use it">
            <p>{selectedPattern.friction}</p>
          </SummaryCard>
          <SummaryCard title="How it works">
            <p>{selectedPattern.explanation}</p>
          </SummaryCard>
          <SummaryCard title="Common mistakes">
            <ul className="list">
              {selectedPattern.donts.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          </SummaryCard>
        </section>
        <aside className="stack">
          <SummaryCard title="Related controls">
            <div className="chip-row">
              {selectedPattern.controls.map((controlId) => (
                <button
                  className="chip"
                  key={controlId}
                  onClick={() => onOpenNodeByItemId(controlId)}
                  type="button"
                >
                  {controlId}
                </button>
              ))}
            </div>
          </SummaryCard>
          <SummaryCard title="Related templates">
            <div className="stack compact">
              {selectedPattern.templates.map((templateId) => (
                <button
                  className="link-action"
                  key={templateId}
                  onClick={() =>
                    onNavigate("templates", { templateType: templateId })
                  }
                  type="button"
                >
                  <IconFileDescription
                    aria-hidden="true"
                    size={16}
                    stroke={1.8}
                  />
                  <span>{templateId.replaceAll("_", " ")}</span>
                </button>
              ))}
            </div>
          </SummaryCard>
          <SummaryCard title="Source support">
            <p>{selectedPattern.sources.join(", ")}</p>
          </SummaryCard>
          <SummaryCard title="Next action">
            <div className="stack compact">
              {selectedPattern.templates[0] ? (
                <button
                  className="primary"
                  onClick={() =>
                    onNavigate("templates", {
                      templateType: selectedPattern.templates[0],
                    })
                  }
                  type="button"
                >
                  Open starter template
                </button>
              ) : null}
              <button
                className="secondary"
                onClick={() => onNavigate("templates")}
                type="button"
              >
                Browse all templates
              </button>
              <button
                className="secondary quiet"
                onClick={() => setHelpOpen(true)}
                type="button"
              >
                Open glossary support
              </button>
            </div>
          </SummaryCard>
        </aside>
      </div>
    </section>
  );
}

function AboutPage(props: {
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  const { onNavigate } = props;

  return (
    <section className="panel">
      <PageHeader
        eyebrow="About & trust"
        summary="Control Atlas is a public reference workbench. It helps you map federal cyber guidance and generate blank planning templates — without storing your data or making official decisions."
        title="What Control Atlas is — and is not"
      />

      <div className="stack">
        <SummaryCard title="What this is" tone="trust">
          <p>
            An open-source reference workbench that maps public federal cyber
            guidance — controls, frameworks, STIGs, and patterns — into plain
            language you can trace back to sources.
          </p>
          <p>
            Everything runs in your browser. There are no accounts, no file
            uploads, and no organizational data storage.
          </p>
        </SummaryCard>

        <SummaryCard title="What this is not">
          <ul className="list">
            <li>Not an official U.S. government system or endorsement.</li>
            <li>
              Not a GRC tool, evidence processor, compliance scorer, or
              authorization workflow.
            </li>
            <li>
              Does not determine compliance status or recommend authorization
              decisions.
            </li>
          </ul>
        </SummaryCard>

        <SummaryCard title="Disclaimer" tone="warning">
          <p>{PRODUCT_DISCLAIMER}</p>
        </SummaryCard>

        <section className="stack">
          <div className="section-header">
            <h2>What to do next</h2>
            <p>Verify source trust, then pick a starting path for your work.</p>
          </div>
          <div className="card-actions">
            <button
              className="primary"
              onClick={() => onNavigate("sources")}
              type="button"
            >
              Review the Sources registry
            </button>
            <button
              className="secondary"
              onClick={() => onNavigate("start-here")}
              type="button"
            >
              Start Here
            </button>
            <button
              className="secondary"
              onClick={() => onNavigate("templates")}
              type="button"
            >
              Browse templates
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}

function StartHerePage(props: {
  state: Extract<ViewState, { view: "start-here" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  const { state, onNavigate } = props;
  const showResults = state.step === "results";

  const recommendations = useMemo(
    () =>
      showResults
        ? (buildStartHereRecommendations({
            systemType: state.systemType,
            dataSensitivity: state.dataSensitivity,
            environment: state.environment,
          }) as StartHereRecommendations | null)
        : null,
    [
      showResults,
      state.dataSensitivity,
      state.environment,
      state.systemType,
    ],
  );

  function followLibraryLink(link: StartHereLibraryLink) {
    if (link.kind === "library-catalog") {
      onNavigate("browse", { framework: link.catalogId });
      return;
    }
    onNavigate("library-detail", { node: link.nodeId, from: "start-here" });
  }

  function followCompareLink(link: StartHereCompareLink) {
    onNavigate("matrix", {
      workbench: link.workbench,
      ...link.patch,
    });
  }

  function restartQuestionnaire() {
    onNavigate("start-here", {
      step: "",
      systemType: "",
      dataSensitivity: "",
      environment: "",
    });
  }

  return (
    <section className="panel">
      <PageHeader
        eyebrow="Start Here"
        summary="Answer three short questions, then get a plain-language starting path with the framework, template, and pattern links most likely to help first."
        title="Find the best place to start"
      />

      <div className="filter-grid">
        <SelectField
          emptyLabel="Any system type"
          hint="What kind of system you are authorizing or assessing."
          label="System type"
          onChange={(value) =>
            onNavigate("start-here", { ...state, systemType: value, step: "" })
          }
          options={[
            { value: "Cloud SaaS", label: "Cloud SaaS" },
            { value: "Platform service", label: "Platform service" },
            { value: "On-premises", label: "On-premises" },
            { value: "Hybrid", label: "Hybrid" },
            { value: "Enterprise service", label: "Enterprise service" },
          ]}
          value={state.systemType}
        />
        <SelectField
          emptyLabel="Any sensitivity level"
          hint="How sensitive the data handled by the system is."
          label="Data sensitivity"
          onChange={(value) =>
            onNavigate("start-here", {
              ...state,
              dataSensitivity: value,
              step: "",
            })
          }
          options={[
            { value: "Low", label: "Low" },
            { value: "Moderate", label: "Moderate" },
            { value: "High", label: "High" },
            { value: "CUI", label: "CUI" },
          ]}
          value={state.dataSensitivity}
        />
        <SelectField
          emptyLabel="Any environment"
          hint="Who operates the system and under which federal context."
          label="Operational environment"
          onChange={(value) =>
            onNavigate("start-here", { ...state, environment: value, step: "" })
          }
          options={[
            { value: "Federal civilian", label: "Federal civilian" },
            { value: "DoD", label: "DoD" },
            { value: "Contractor", label: "Contractor" },
            { value: "CSP", label: "CSP" },
          ]}
          value={state.environment}
        />
      </div>

      {!showResults ? (
        <div className="card-actions">
          <button
            className="primary"
            onClick={() =>
              onNavigate("start-here", { ...state, step: "results" })
            }
            type="button"
          >
            Show recommendation
          </button>
        </div>
      ) : null}

      {recommendations ? (
        <div className="stack">
          <div className="card-actions">
            <button
              className="secondary"
              onClick={restartQuestionnaire}
              type="button"
            >
              Restart questionnaire
            </button>
          </div>

          <div className="summary-grid">
            <SummaryCard title="What this is" tone="trust">
              <p>
                This is a reference recommendation. It is not a compliance
                determination.
              </p>
            </SummaryCard>
          </div>

          <section className="stack">
            <div className="section-header">
              <h2>Library</h2>
              <p>Framework catalogs and baselines to open first.</p>
            </div>
            <div className="stack compact">
              {recommendations.library.map((link) => (
                <article
                  className="relationship-card"
                  key={`${link.kind}-${link.kind === "library-catalog" ? link.catalogId : link.nodeId}`}
                >
                  <div>
                    <strong>{link.label}</strong>
                    <p>{link.rationale}</p>
                  </div>
                  <button
                    className="secondary"
                    onClick={() => followLibraryLink(link)}
                    type="button"
                  >
                    Open in Library
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="stack">
            <div className="section-header">
              <h2>Compare</h2>
              <p>Pre-filled comparison paths based on your answers.</p>
            </div>
            <div className="stack compact">
              {recommendations.compare.map((link) => (
                <article
                  className="relationship-card"
                  key={`compare-${link.workbench}-${link.label}`}
                >
                  <div>
                    <strong>{link.label}</strong>
                    <p>{link.rationale}</p>
                  </div>
                  <button
                    className="secondary"
                    onClick={() => followCompareLink(link)}
                    type="button"
                  >
                    Open Compare
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="stack">
            <div className="section-header">
              <h2>Patterns</h2>
              <p>
                Plain-language guides for concepts that often block progress.
              </p>
            </div>
            <div className="stack compact">
              {recommendations.patterns.map((link) => (
                <article className="relationship-card" key={link.patternId}>
                  <div>
                    <strong>{link.label}</strong>
                    <p>{link.rationale}</p>
                  </div>
                  <button
                    className="secondary"
                    onClick={() =>
                      onNavigate("patterns", { pattern: link.patternId })
                    }
                    type="button"
                  >
                    Read pattern
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="stack">
            <div className="section-header">
              <h2>Templates</h2>
              <p>Blank artifacts you can generate locally in your browser.</p>
            </div>
            <div className="stack compact">
              {recommendations.templates.map((link) => (
                <article className="relationship-card" key={link.templateType}>
                  <div>
                    <strong>{link.label}</strong>
                    <p>{link.rationale}</p>
                  </div>
                  <button
                    className="primary"
                    onClick={() =>
                      onNavigate("templates", {
                        templateType: link.templateType,
                      })
                    }
                    type="button"
                  >
                    Generate {link.label}
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : !showResults ? (
        <section className="empty-state">
          <h2>Choose your context, then show a recommendation</h2>
          <p>
            Pick the options that best match your system. Use &quot;Any&quot;
            when you are not sure yet. Click Show recommendation when you are
            ready for the next step.
          </p>
        </section>
      ) : null}
    </section>
  );
}

function GlossaryDrawer(props: {
  open: boolean;
  setOpen: (open: boolean) => void;
  focusTermId?: string;
  helpTab: HelpTab;
  onTabChange: (tab: HelpTab) => void;
  bundle: RuntimeBundle | null;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNode: (nodeId: string, from?: string) => void;
}) {
  const {
    open,
    setOpen,
    focusTermId = "",
    helpTab,
    onTabChange,
    bundle,
    onNavigate,
    onOpenNode,
  } = props;
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return glossaryData.filter((entry) => {
      if (!needle) {
        return true;
      }
      return [entry.term, entry.expansion, entry.definition, entry.source]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [query]);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (focusTermId) {
      const entry = glossaryData.find((item) => item.id === focusTermId);
      if (entry) {
        setQuery(entry.term);
      }
    } else {
      setQuery("");
    }
  }, [focusTermId, open]);

  useEffect(() => {
    if (!open || !focusTermId) {
      return;
    }
    const target = document.getElementById(`glossary-term-${focusTermId}`);
    target?.scrollIntoView({ block: "nearest" });
  }, [filtered, focusTermId, open]);

  function openFirstControl(controlId: string) {
    if (!bundle) {
      return;
    }
    const match =
      bundle.runtime
        .searchLibrary(controlId)
        .find((item: any) => item.item_id === controlId) ||
      bundle.runtime.searchLibrary(controlId)[0];
    if (match) {
      setOpen(false);
      onOpenNode(match.id, "search");
    }
  }

  return (
    <Dialog.Root onOpenChange={setOpen} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay" />
        <Dialog.Content className="drawer-content">
          <div className="drawer-header">
            <div>
              <Dialog.Title>
                {helpTab === "guide" ? "Help" : "Glossary"}
              </Dialog.Title>
              <Dialog.Description>
                {helpTab === "guide"
                  ? "How to use Control Atlas: start with intent, search the library, then compare or generate artifacts."
                  : "Short definitions, why they matter, and quick links back into the library or pattern pages."}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="icon-button" type="button">
                <IconX aria-hidden="true" size={18} stroke={1.8} />
              </button>
            </Dialog.Close>
          </div>

          <div className="drawer-tabs" role="tablist">
            <button
              aria-selected={helpTab === "guide"}
              className={helpTab === "guide" ? "drawer-tab active" : "drawer-tab"}
              onClick={() => onTabChange("guide")}
              role="tab"
              type="button"
            >
              Help
            </button>
            <button
              aria-selected={helpTab === "glossary"}
              className={
                helpTab === "glossary" ? "drawer-tab active" : "drawer-tab"
              }
              onClick={() => onTabChange("glossary")}
              role="tab"
              type="button"
            >
              Glossary
            </button>
          </div>

          {helpTab === "guide" ? (
            <div className="drawer-guide stack">
              <SummaryCard title="Start Here">
                <p>
                  Answer three short questions, then open the recommended
                  library, compare, pattern, and template links.
                </p>
                <button
                  className="secondary"
                  onClick={() => {
                    setOpen(false);
                    onNavigate("start-here");
                  }}
                  type="button"
                >
                  Open Start Here
                </button>
              </SummaryCard>
              <SummaryCard title="Library">
                <p>
                  Search by control ID or topic. Open detail pages to see
                  grouped connections and source support.
                </p>
                <button
                  className="secondary"
                  onClick={() => {
                    setOpen(false);
                    onNavigate("search");
                  }}
                  type="button"
                >
                  Open Library
                </button>
              </SummaryCard>
              <SummaryCard title="Compare">
                <p>
                  Pick a comparison intent first, set frameworks, then review
                  results before exporting or opening detailed mappings.
                </p>
                <button
                  className="secondary"
                  onClick={() => {
                    setOpen(false);
                    onNavigate("matrix");
                  }}
                  type="button"
                >
                  Open Compare
                </button>
              </SummaryCard>
            </div>
          ) : (
            <>
          <label className="field" htmlFor="glossary-search">
            <span>Search glossary</span>
            <div className="search-input">
              <IconSearch aria-hidden="true" size={18} stroke={1.8} />
              <input
                id="glossary-search"
                onChange={(event) => setQuery(event.target.value)}
                type="search"
                value={query}
              />
            </div>
          </label>

          <div className="drawer-list">
            {filtered.map((entry) => {
              const relatedTemplateIds = templatesForPatterns(
                entry.related_patterns,
              );
              return (
                <article
                  className={
                    focusTermId === entry.id
                      ? "drawer-item drawer-item-focused"
                      : "drawer-item"
                  }
                  id={`glossary-term-${entry.id}`}
                  key={entry.id}
                >
                  <div className="result-card-header">
                    <h3>
                      {entry.term}
                      {entry.expansion ? (
                        <span className="drawer-expansion">
                          {" "}
                          · {entry.expansion}
                        </span>
                      ) : null}
                    </h3>
                    <Badge tone={entry.consensus ? "warning" : "success"}>
                      {entry.consensus
                        ? "Practitioner consensus"
                        : "Official source"}
                    </Badge>
                  </div>
                  <p>{entry.definition}</p>
                  <p className="drawer-support">
                    Why it matters: use this term to understand the surrounding
                    control, pattern, or template before you act on it.
                  </p>
                  <div className="chip-row">
                    {entry.related_patterns.map((patternId) => (
                      <button
                        className="chip"
                        key={patternId}
                        onClick={() => {
                          setOpen(false);
                          onNavigate("patterns", { pattern: patternId });
                        }}
                        type="button"
                      >
                        {PATTERN_RENAMES[patternId] || patternId}
                      </button>
                    ))}
                    {relatedTemplateIds.map((templateId) => (
                      <button
                        className="chip"
                        key={templateId}
                        onClick={() => {
                          setOpen(false);
                          onNavigate("templates", { templateType: templateId });
                        }}
                        type="button"
                      >
                        {templateId.replaceAll("_", " ")}
                      </button>
                    ))}
                    {entry.related_controls.map((controlId) => (
                      <button
                        className="chip"
                        key={controlId}
                        onClick={() => openFirstControl(controlId)}
                        type="button"
                      >
                        {controlId}
                      </button>
                    ))}
                  </div>
                  <p className="drawer-link">Official source: {entry.source}</p>
                </article>
              );
            })}
          </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
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
