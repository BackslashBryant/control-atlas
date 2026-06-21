import * as Accordion from "@radix-ui/react-accordion";
import * as Dialog from "@radix-ui/react-dialog";
import {
  IconArrowRight,
  IconBook2,
  IconClipboardList,
  IconCompass,
  IconExternalLink,
  IconFileDescription,
  IconGitCompare,
  IconInfoCircle,
  IconLink,
  IconMap,
  IconSearch,
  IconShieldCheck,
  IconSourceCode,
  IconX,
} from "@tabler/icons-react";
import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CatalogFilterBar,
  QuickIntentCard,
} from "./components/QuickIntentCard";
import {
  ExpandableChipList,
  RelationshipGroupsSection,
} from "./components/ExpandableRelationshipGroup";
import {
  DataPendingNotice,
  LoadErrorPanel,
  LoadingStatusPanel,
  OfflineFallbackActions,
} from "./components/LoadStatusPanel";
import { DetailConnectionsSkeleton, LibrarySkeleton } from "./components/LibrarySkeleton";
import { StickyDetailBar } from "./components/StickyDetailBar";
import { ProvenanceTerm } from "./components/ProvenanceTerm";
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
  glossaryTermsForDocument,
  glossaryTermsForPattern,
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
import { AtlasMapPage } from "./pages/AtlasMapPage";
import { ComparePage } from "./pages/ComparePage";
import { ExplorePage } from "./pages/ExplorePage";
import { HomePage } from "./pages/HomePage";
import {
  activeNavForState,
  isStaticViewWithoutBundle,
  PRIMARY_NAV_ITEMS,
  requiresFullGraph,
} from "./lib/navigation";
import {
  normalizeViewState,
  parseViewState,
  serializeViewState,
  nodeIdFromItemId,
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

const PATTERN_RENAMES: Record<string, string> = {
  "csp-inheritance": "Using FedRAMP Inheritance",
  "shared-responsibility": "What Your Cloud Provider Owns vs What You Own",
  "reciprocity-basics": "Reusing Prior Authorization Work",
  "conmon-cadence": "Keeping Authorization Evidence Current",
  "boundary-patterns": "Defining the Right Authorization Boundary",
  "boe-reuse": "Packaging Evidence for Reuse",
};

function openAtlasMapForNode(
  navigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void,
  nodeId: string,
) {
  navigate("atlas-map", { node: nodeId });
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
    return "Official source.";
  }
  if (source.provenance_class?.includes("published")) {
    return "Source-backed.";
  }
  return "Source-backed.";
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
        <ProvenanceTerm
          kind="provenance"
          value={source.provenance_class || "federal_published"}
        />
      </p>
      <div className="source-summary-grid">
        <ProvenanceTerm kind="provenance" value={source.provenance_class || ""} />
        <ProvenanceTerm kind="trust" label={displayNameFor("lifecycle_status", source.lifecycle_status)} value={source.lifecycle_status} />
        <ProvenanceTerm kind="trust" label={displayNameFor("access_status", source.access_status)} value={source.access_status} />
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
          onClick={() => navigate("home")}
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
            const activeNav = activeNavForState(viewState);
            const active = activeNav === item.view;
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
              Search records and glossary
            </label>
            <div className="search-input">
              <IconSearch aria-hidden="true" size={18} stroke={1.8} />
              <input
                aria-describedby={bundle ? undefined : "header-search-hint"}
                aria-label="Search records and glossary"
                disabled={!bundle}
                id="header-search"
                onChange={(event) => setHeaderSearchDraft(event.target.value)}
                placeholder={
                  bundle?.graphReady
                    ? "Search records or glossary"
                    : "Search available — detail views load shortly"
                }
                type="search"
                value={headerSearchDraft}
              />
            </div>
            {!bundle ? (
              <p className="field-hint" id="header-search-hint">
                Record search opens once public data finishes loading.
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

  if (state.view === "home") {
    return <HomePage onNavigate={onNavigate} />;
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
          Back to Explore
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
        onCompare={() =>
          onNavigate("matrix", {
            workbench: "relationships",
            items: document.item_id,
          })
        }
        onOpenAtlasMap={() => openAtlasMapForNode(onNavigate, state.node)}
      />
      <div className="breadcrumbs">
        <button onClick={() => onNavigate("search")} type="button">
          Explore
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
            {edges.length ? (
              <button
                className="primary"
                onClick={() => openAtlasMapForNode(onNavigate, state.node)}
                type="button"
              >
                Open in Atlas Map
              </button>
            ) : null}
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
              Compare
            </button>
            <button
              className="secondary quiet"
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
                <h2>Connections</h2>
                <p>Grouped relationships for this record.</p>
                {edges.length ? (
                  <p className="support-meta">
                    {edges.length} connections across {grouped.length} group
                    {grouped.length === 1 ? "" : "s"}:{" "}
                    {grouped
                      .map(
                        (group) =>
                          `${group.items.length} ${group.label.toLowerCase()}`,
                      )
                      .join(", ")}
                    .
                  </p>
                ) : null}
              </div>
              <div className="section-header-actions">
                {edges.length ? (
                  <>
                    <button
                      className="primary"
                      onClick={() => openAtlasMapForNode(onNavigate, state.node)}
                      type="button"
                    >
                      Open in Atlas Map
                    </button>
                    <button
                      className="secondary"
                      onClick={() =>
                        onNavigate("library-detail", {
                          node: state.node,
                          from: state.from,
                          relationshipView: "list",
                        })
                      }
                      type="button"
                    >
                      View as list
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
                      Compare
                    </button>
                  </>
                ) : null}
                <Badge tone="info">{edges.length} connections</Badge>
              </div>
            </div>

            {state.relationshipView === "map" ||
            state.relationshipView === "list" ||
            state.relationshipView === "table" ? (
              <RelationshipExplorer
                centerItemId={document.item_id}
                centerNodeId={node.id}
                filters={relationshipFiltersFromState(state)}
                heading="Atlas Map"
                introCopy={`Connections around ${document.item_id}.`}
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
                  state.relationshipView === "map" ? "map" : "list"
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
          <SummaryCard title="Connections" tone="trust">
            <p>
              {edges.length
                ? `${edges.length} connections across ${grouped.length} group${grouped.length === 1 ? "" : "s"}.`
                : "No connections yet."}
            </p>
            {edges.length ? (
              <div className="card-actions">
                <button
                  className="primary"
                  onClick={() => openAtlasMapForNode(onNavigate, state.node)}
                  type="button"
                >
                  Open in Atlas Map
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
                  Compare
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
                  onClick={() => openAtlasMapForNode(onNavigate, state.node)}
                  type="button"
                >
                  <IconMap aria-hidden="true" size={16} stroke={1.8} />
                  <span>Open in Atlas Map</span>
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
                          <ProvenanceTerm
                            kind="provenance"
                            value={edge.provenance_class}
                          />
                        </td>
                        <td>
                          <ProvenanceTerm kind="confidence" value={edge.confidence} />
                        </td>
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
          <div className="card-actions">
            <button
              className="primary"
              onClick={() => onNavigate("atlas-map")}
              type="button"
            >
              View in Atlas Map
            </button>
          </div>
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
            <p>
              <ProvenanceTerm
                kind="provenance"
                value={selectedSource.provenance_class || "federal_published"}
              />
            </p>
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
            <button
              className="secondary"
              onClick={() => onNavigate("atlas-map")}
              type="button"
            >
              View related map
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
          eyebrow="Playbooks"
          summary="Use task-focused guidance to understand what to do, what to avoid, and which records or templates to open next."
          title="Compliance playbooks"
        />
        <CatalogFilterBar
          category={categoryFilter}
          categoryOptions={[...Object.keys(PATTERN_CATEGORIES), "Other"]}
          countLabel={`${filteredPatterns.length} playbook${filteredPatterns.length === 1 ? "" : "s"} in ${groupedPatterns.size} categor${groupedPatterns.size === 1 ? "y" : "ies"}`}
          onCategoryChange={setCategoryFilter}
          onQueryChange={setQueryFilter}
          query={queryFilter}
          queryPlaceholder="Search playbooks by outcome or topic"
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
        action={
          <button
            className="secondary"
            onClick={() => onNavigate("patterns", { pattern: "" })}
            type="button"
          >
            Back to playbooks
          </button>
        }
        eyebrow="Playbooks"
        summary="Use task-focused guidance to understand what to do, what to avoid, and which records or templates to open next."
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
              {selectedPattern.controls[0] ? (
                <button
                  className="primary"
                  onClick={() =>
                    onNavigate("atlas-map", {
                      node: selectedPattern.controls[0],
                    })
                  }
                  type="button"
                >
                  Open related map
                </button>
              ) : null}
              {selectedPattern.templates[0] ? (
                <button
                  className="secondary"
                  onClick={() =>
                    onNavigate("templates", {
                      templateType: selectedPattern.templates[0],
                    })
                  }
                  type="button"
                >
                  Open related templates
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
              Start guided path
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
              <h2>Explore</h2>
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
                    Open in Explore
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
              <h2>Playbooks</h2>
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
              <SummaryCard title="Explore">
                <p>
                  Search by control ID or topic. Open records to see
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
                  Open Explore
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
