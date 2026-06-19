import * as Accordion from '@radix-ui/react-accordion';
import * as Dialog from '@radix-ui/react-dialog';
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
} from '@tabler/icons-react';
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { glossaryData } from '../app/glossary-data.mjs';
import { patternsData } from '../app/patterns-data.mjs';
import { displayNameFor, userFacingLoadError } from '../app/display-names.mjs';
import { groupRelationships } from '../app/relationship-groups.mjs';
import { generateTemplate } from '../app/template-engine.mjs';
import {
  ChainRelationshipItem,
  parseCatalogItemIds,
  ProvenanceBadge,
  SourceRefList,
} from './lib/compareHelpers';
import {
  glossaryTermsForDocument,
  glossaryTermsForPattern,
  searchGlossary,
  templatesForPatterns,
} from './lib/glossarySearch.mjs';
import { loadRuntimeDataset } from './lib/runtimeLoader';
import { buildStartHereRecommendations } from './lib/startHereRecommendations.mjs';
import type { StartHereCompareLink, StartHereLibraryLink, StartHereRecommendations } from './lib/startHereRecommendations.d.ts';
import {
  normalizeViewState,
  parseViewState,
  serializeViewState,
  type CompareWorkbench,
  type ViewState,
} from './lib/viewState';

type RuntimeBundle = Awaited<ReturnType<typeof loadRuntimeDataset>>;

const HERO_WORDS = ['Comply', 'Translate', 'Compare', 'Trace', 'Review', 'Assess', 'Plan', 'Connect'];

const NAV_ITEMS = [
  { label: 'Start Here', view: 'start-here', icon: IconCompass },
  { label: 'Library', view: 'search', icon: IconLibrary },
  { label: 'Compare', view: 'matrix', icon: IconGitCompare },
  { label: 'Patterns', view: 'patterns', icon: IconBook2 },
  { label: 'Templates', view: 'templates', icon: IconClipboardList },
  { label: 'Sources', view: 'sources', icon: IconSourceCode },
] as const;

const PATTERN_RENAMES: Record<string, string> = {
  'csp-inheritance': 'Using FedRAMP Inheritance',
  'shared-responsibility': 'What Your Cloud Provider Owns vs What You Own',
  'reciprocity-basics': 'Reusing Prior Authorization Work',
  'conmon-cadence': 'Keeping Authorization Evidence Current',
  'boundary-patterns': 'Defining the Right Authorization Boundary',
  'boe-reuse': 'Packaging Evidence for Reuse',
};

function activeNavForState(state: ViewState) {
  if (state.view === 'library-detail' || state.view === 'browse' || state.view === 'retired') {
    return 'search';
  }
  return state.view;
}

function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(value);
  }
  const area = document.createElement('textarea');
  area.value = value;
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  area.remove();
  return Promise.resolve();
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function sourceTrustSummary(source: any) {
  if (!source) {
    return 'No public source record is attached yet.';
  }
  if (source.provenance_class === 'inferred') {
    return 'Needs review before relying on it.';
  }
  if (source.provenance_class === 'federal_published' || source.provenance_class === 'official') {
    return 'Direct from official source.';
  }
  if (source.provenance_class?.includes('published')) {
    return 'Derived from a published public source.';
  }
  return 'Suggested by public data.';
}

function sourceUsageSummary(source: any) {
  return source?.graph_eligible && source?.eligibility_status === 'eligible' ? 'Used in map: Yes' : 'Used in map: No';
}

function sourceWarnings(source: any) {
  const warnings: string[] = [];
  if (!source) {
    return warnings;
  }
  if (!source.graph_eligible || source.eligibility_status === 'excluded') {
    warnings.push('This source is not used in the public map by default.');
  }
  if (source.lifecycle_status === 'deprecated' || source.lifecycle_status === 'draft') {
    warnings.push('This source is old or draft content. Review it carefully before reusing it.');
  }
  if (source.access_status !== 'public') {
    warnings.push('Access restrictions may limit what can be verified from this source.');
  }
  return warnings;
}

function formatRelationshipLabel(edge: any) {
  return displayNameFor('relationship_type', edge.relationship_type);
}

function formatConfidence(value: string) {
  return displayNameFor('confidence', value);
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
        {props.action ? <div className="page-header-action">{props.action}</div> : null}
      </div>
    </header>
  );
}

function SummaryCard(props: { title: string; children: ReactNode; tone?: 'default' | 'trust' | 'warning' }) {
  return (
    <article className={`summary-card tone-${props.tone || 'default'}`}>
      <span className="summary-card-title">{props.title}</span>
      <div>{props.children}</div>
    </article>
  );
}

function Badge(props: { children: ReactNode; tone?: 'default' | 'info' | 'warning' | 'success' }) {
  return <span className={`badge tone-${props.tone || 'default'}`}>{props.children}</span>;
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
        <Badge tone={source.graph_eligible ? 'success' : 'warning'}>{sourceUsageSummary(source)}</Badge>
      </div>
      <p className="result-summary">
        {source.name} is maintained by {source.owner}. {sourceTrustSummary(source)}
      </p>
      <div className="source-summary-grid">
        <span>{displayNameFor('provenance_class', source.provenance_class)}</span>
        <span>{displayNameFor('lifecycle_status', source.lifecycle_status)}</span>
        <span>{displayNameFor('access_status', source.access_status)}</span>
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
        <a className="secondary" href={source.artifact_url} rel="noreferrer" target="_blank">
          Open official source
        </a>
      </div>
    </article>
  );
}

function DisclosurePanel(props: { value: string; title: string; children: ReactNode }) {
  return (
    <Accordion.Item className="accordion-item" value={props.value}>
      <Accordion.Header>
        <Accordion.Trigger className="accordion-trigger">
          <span>{props.title}</span>
          <IconArrowRight size={18} stroke={1.8} />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="accordion-content">{props.children}</Accordion.Content>
    </Accordion.Item>
  );
}

export function App() {
  const [viewState, setViewState] = useState<ViewState>(() => parseViewState(window.location.search));
  const [bundle, setBundle] = useState<RuntimeBundle | null>(null);
  const [loadError, setLoadError] = useState<string>('');
  const [heroWordIndex, setHeroWordIndex] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [glossaryFocusTermId, setGlossaryFocusTermId] = useState('');
  const [headerSearchDraft, setHeaderSearchDraft] = useState(() =>
    viewState.view === 'search' ? viewState.query : '',
  );

  useEffect(() => {
    let cancelled = false;

    loadRuntimeDataset()
      .then((result) => {
        if (!cancelled) {
          setBundle(result);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(userFacingLoadError(error));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onPopState = () => {
      startTransition(() => {
        setViewState(parseViewState(window.location.search));
      });
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setHeroWordIndex((current) => (current + 1) % HERO_WORDS.length);
    }, 2200);

    return () => window.clearInterval(interval);
  }, []);

  function navigate(nextView: ViewState['view'], patch: Partial<ViewState> = {}) {
    const nextState = normalizeViewState(nextView, {
      ...(viewState as Record<string, unknown>),
      ...(patch as Record<string, unknown>),
    } as Partial<ViewState>);

    const nextUrl = `${window.location.pathname}${serializeViewState(nextState)}`;
    window.history.pushState(null, '', nextUrl);
    startTransition(() => {
      setViewState(nextState);
    });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function openNode(nodeId: string, from = activeNavForState(viewState)) {
    navigate('library-detail', { node: nodeId, from });
  }

  function openNodeByItemId(itemId: string) {
    if (!bundle) {
      return;
    }
    const match = bundle.runtime.searchLibrary(itemId).find((entry: any) => entry.item_id === itemId) || bundle.runtime.searchLibrary(itemId)[0];
    if (match) {
      openNode(match.id);
    }
  }

  function openGlossary(termId = '') {
    setGlossaryFocusTermId(termId);
    setHelpOpen(true);
  }

  useEffect(() => {
    if (viewState.view === 'search') {
      setHeaderSearchDraft(viewState.query);
    }
  }, [viewState]);

  const readyState = loadError ? 'error' : bundle ? 'true' : 'false';

  return (
    <>
      <a className="skip-link" href="#workspace">
        Skip to workspace
      </a>
      <header className="site-header">
        <button
          className="brand"
          onClick={() =>
            navigate('search', {
              query: '',
              filter: '',
              objectType: '',
              sourceClass: '',
              controlFamily: '',
              severity: '',
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
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeNavForState(viewState) === item.view;
            return (
              <button
                aria-current={active ? 'page' : undefined}
                className={active ? 'active' : ''}
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
              navigate('search', {
                query: headerSearchDraft.trim(),
                filter: '',
                objectType: '',
                sourceClass: '',
                controlFamily: '',
                severity: '',
              });
            }}
          >
            <label className="visually-hidden" htmlFor="header-search">
              Search library and glossary
            </label>
            <div className="search-input">
              <IconSearch aria-hidden="true" size={18} stroke={1.8} />
              <input
                aria-label="Search library and glossary"
                id="header-search"
                onChange={(event) => setHeaderSearchDraft(event.target.value)}
                placeholder="Search library or glossary"
                type="search"
                value={headerSearchDraft}
              />
            </div>
          </form>
          <button className="secondary quiet" onClick={() => openGlossary()} type="button">
            Help &amp; Glossary
          </button>
        </div>
      </header>

      <main id="workspace">
        <section aria-busy={readyState === 'false'} aria-live="polite" className="app-shell" data-app-ready={readyState} id="app">
          {loadError ? (
            <section className="notice">
              <h2>Library data unavailable</h2>
              <p>{loadError}</p>
            </section>
          ) : bundle ? (
            <AppContent
              bundle={bundle}
              heroWord={HERO_WORDS[heroWordIndex]}
              onNavigate={navigate}
              onOpenGlossary={openGlossary}
              onOpenNode={openNode}
              onOpenNodeByItemId={openNodeByItemId}
              setHelpOpen={setHelpOpen}
              state={viewState}
            />
          ) : (
            <section className="loading-card">
              <p className="eyebrow">Loading</p>
              <h2>Loading public mappings</h2>
              <p>Control Atlas is preparing the public library, source records, and comparison views.</p>
            </section>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <p>
          Control Atlas is an open-source reference tool. It does not make compliance or authorization decisions.
          Official decisions remain with your Authorizing Official.
        </p>
        <p>Static, public, and browser-only. No accounts, tracking, backend, or user-data storage.</p>
      </footer>

      <GlossaryDrawer
        bundle={bundle}
        focusTermId={glossaryFocusTermId}
        onNavigate={navigate}
        onOpenNode={openNode}
        open={helpOpen}
        setOpen={(open) => {
          setHelpOpen(open);
          if (!open) {
            setGlossaryFocusTermId('');
          }
        }}
      />
    </>
  );
}

function AppContent(props: {
  bundle: RuntimeBundle;
  state: ViewState;
  heroWord: string;
  onNavigate: (view: ViewState['view'], patch?: Partial<ViewState>) => void;
  onOpenNode: (nodeId: string, from?: string) => void;
  onOpenNodeByItemId: (itemId: string) => void;
  onOpenGlossary: (termId?: string) => void;
  setHelpOpen: (open: boolean) => void;
}) {
  const { bundle, state, heroWord, onNavigate, onOpenNode, onOpenNodeByItemId, onOpenGlossary, setHelpOpen } = props;

  if (state.view === 'library-detail') {
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

  if (state.view === 'matrix') {
    return <ComparePage bundle={bundle} onNavigate={onNavigate} onOpenNode={onOpenNode} state={state} />;
  }

  if (state.view === 'sources') {
    return <SourcesPage bundle={bundle} onNavigate={onNavigate} state={state} />;
  }

  if (state.view === 'templates') {
    return <TemplatesPage bundle={bundle} onNavigate={onNavigate} state={state} />;
  }

  if (state.view === 'patterns') {
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

  if (state.view === 'start-here') {
    return <StartHerePage onNavigate={onNavigate} state={state} />;
  }

  if (state.view === 'retired') {
    return (
      <section className="notice">
        <h2>We do not have a public map entry for "{state.query}"</h2>
        <p>Try the Library search or Start Here to find the closest public reference path.</p>
        <div className="card-actions">
          <button className="primary" onClick={() => onNavigate('search', { query: state.query })} type="button">
            Search the library
          </button>
          <button className="secondary" onClick={() => onNavigate('start-here')} type="button">
            Start Here
          </button>
        </div>
      </section>
    );
  }

  return (
    <LibraryPage
      bundle={bundle}
      heroWord={heroWord}
      onNavigate={onNavigate}
      onOpenGlossary={onOpenGlossary}
      onOpenNode={onOpenNode}
      setHelpOpen={setHelpOpen}
      state={state.view === 'browse' ? { view: 'search', query: '', filter: state.framework, objectType: '', sourceClass: '', controlFamily: '', severity: '' } : state}
    />
  );
}

function LibraryPage(props: {
  bundle: RuntimeBundle;
  state: Extract<ViewState, { view: 'search' }>;
  heroWord: string;
  onNavigate: (view: ViewState['view'], patch?: Partial<ViewState>) => void;
  onOpenNode: (nodeId: string, from?: string) => void;
  onOpenGlossary: (termId?: string) => void;
  setHelpOpen: (open: boolean) => void;
}) {
  const { bundle, state, heroWord, onNavigate, onOpenNode, onOpenGlossary, setHelpOpen } = props;
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

  const hasFilters = Boolean(state.filter || state.objectType || state.sourceClass || state.controlFamily || state.severity);
  const landing = !state.query && !hasFilters;

  const documents = useMemo(() => {
    if (landing) {
      return [];
    }
    return bundle.runtime.searchLibrary(state.query, filters);
  }, [bundle.runtime, landing, state.query, state.filter, state.objectType, state.sourceClass, state.controlFamily, state.severity]);

  const glossaryMatches = useMemo(() => searchGlossary(state.query), [state.query]);
  const hasQuery = Boolean(state.query.trim());
  const hasResults = documents.length > 0 || glossaryMatches.length > 0;

  const groupedDocuments = useMemo<Record<string, any[]>>(() => {
    return /** @type {any[]} */ (documents).reduce((groups: Record<string, any[]>, document: any) => {
      const key = displayNameFor('object_type', document.object_type);
      groups[key] ||= [];
      groups[key].push(document);
      return groups;
    }, {});
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
            A public cyber compliance reference workspace that turns complex guidance into clear, traceable action.
          </p>
          <div className="hero-actions">
            <button className="primary" onClick={() => onNavigate('start-here')} type="button">
              Start Here
            </button>
            <button className="secondary" onClick={() => setHelpOpen(true)} type="button">
              Open glossary support
            </button>
          </div>
          <section className="intent-grid">
            <QuickIntentCard
              actionLabel="Search AC-2"
              body="Find a control, CCI, STIG, baseline, or topic and see what it connects to."
              icon={<IconSearch size={20} stroke={1.8} />}
              onClick={() => onNavigate('search', { query: 'AC-2' })}
              title="Library"
            />
            <QuickIntentCard
              actionLabel="Compare frameworks"
              body="Start with an intent, then review source-backed mappings without filter clutter."
              icon={<IconGitCompare size={20} stroke={1.8} />}
              onClick={() => onNavigate('matrix')}
              title="Compare"
            />
            <QuickIntentCard
              actionLabel="Pick a starter"
              body="Choose the artifact you need first, then reveal extra options only if they help."
              icon={<IconFileDescription size={20} stroke={1.8} />}
              onClick={() => onNavigate('templates')}
              title="Templates"
            />
          </section>
        </section>
      ) : null}

      <section className="panel search-panel">
        <PageHeader
          eyebrow="Library"
          action={
            <button className="secondary" onClick={() => onNavigate('start-here')} type="button">
              Guided path
            </button>
          }
          summary="Search by ID or topic, review what the item means, see where it connects, and open the next best reference."
          title="Search the public reference library"
        />

        <form
          className="search-form"
          onSubmit={(event) => {
            event.preventDefault();
            onNavigate('search', { ...state, query: deferredQuery.trim() });
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
                onChange={(value) => onNavigate('search', { ...state, filter: value })}
                options={bundle.runtime.getCatalogs().map((catalog: any) => ({ value: catalog.id, label: catalog.name }))}
                value={state.filter}
              />
              <SelectField
                label="Item type"
                onChange={(value) => onNavigate('search', { ...state, objectType: value })}
                options={facets.objectTypes.map((value: string) => ({ value, label: displayNameFor('object_type', value) }))}
                value={state.objectType}
              />
              <SelectField
                label="Source type"
                onChange={(value) => onNavigate('search', { ...state, sourceClass: value })}
                options={facets.sourceClasses.map((value: string) => ({ value, label: displayNameFor('provenance_class', value) }))}
                value={state.sourceClass}
              />
              <SelectField
                label="Control family"
                onChange={(value) => onNavigate('search', { ...state, controlFamily: value })}
                options={facets.controlFamilies.map((value: string) => ({ value, label: value }))}
                value={state.controlFamily}
              />
              <SelectField
                label="Severity"
                onChange={(value) => onNavigate('search', { ...state, severity: value })}
                options={facets.severities.map((value: string) => ({ value, label: value }))}
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
                            {entry.expansion ? ` · ${entry.expansion}` : ''}
                          </h3>
                        </div>
                        <Badge tone={entry.consensus ? 'warning' : 'success'}>
                          {entry.consensus ? 'Practitioner consensus' : 'Official source'}
                        </Badge>
                      </div>
                      <p className="result-summary">{entry.definition}</p>
                      <div className="chip-row">
                        {entry.related_patterns.map((patternId) => (
                          <button
                            className="chip"
                            key={patternId}
                            onClick={() => onNavigate('patterns', { pattern: patternId })}
                            type="button"
                          >
                            {PATTERN_RENAMES[patternId] || patternId}
                          </button>
                        ))}
                        {entry.relatedTemplateIds.map((templateId) => (
                          <button
                            className="chip"
                            key={templateId}
                            onClick={() => onNavigate('templates', { templateType: templateId })}
                            type="button"
                          >
                            {templateId.replaceAll('_', ' ')}
                          </button>
                        ))}
                      </div>
                      <div className="card-actions">
                        <button className="primary" onClick={() => onOpenGlossary(entry.id)} type="button">
                          Open term details
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
            {Object.entries(groupedDocuments as Record<string, any[]>).map(([group, entries]) => (
              <section className="result-group" key={group}>
                <div className="result-group-header">
                  <h2>{group}</h2>
                  <Badge>{entries.length} results</Badge>
                </div>
                <div className="stack">
                  {entries.map((document) => {
                    const source = bundle.runtime.getSource(document.source_id);
                    const node = bundle.runtime.getNode(document.id);
                    const relationshipCount = node
                      ? bundle.runtime.getEdgesForNode(node.id, { publication_status: 'published' }).length
                      : 0;
                    return (
                      <article className="result-card" key={document.id}>
                        <div className="result-card-header">
                          <div>
                            <p className="result-meta">{displayNameFor('object_type', document.object_type)}</p>
                            <h3>
                              {document.item_id} - {document.title}
                            </h3>
                          </div>
                          <Badge tone="info">{relationshipCount} public connections</Badge>
                        </div>
                        <p className="result-summary">
                          {document.plain_language_summary || node?.plain_language_summary || document.description}
                        </p>
                        <div className="result-support">
                          <span>Primary source: {source?.display_name || source?.name || 'Source unavailable'}</span>
                          <span>{sourceTrustSummary(source)}</span>
                        </div>
                        <div className="card-actions">
                          <button className="primary" onClick={() => onOpenNode(document.id, 'search')} type="button">
                            Open detail
                          </button>
                          <button className="secondary" onClick={() => onNavigate('matrix', { workbench: 'relationships', items: document.item_id })} type="button">
                            Compare connections
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : !landing && hasQuery ? (
          <section className="empty-state">
            <IconSparkles aria-hidden="true" size={24} stroke={1.8} />
            <h2>No public matches found</h2>
            <p>Try a known identifier, a shorter phrase, or Start Here if you need help finding the right artifact first.</p>
            <div className="card-actions">
              <button className="secondary" onClick={() => onNavigate('search', { query: 'AC-2', filter: '', objectType: '', sourceClass: '', controlFamily: '', severity: '' })} type="button">
                Try AC-2
              </button>
              <button className="secondary" onClick={() => onNavigate('search', { query: 'account management', filter: '', objectType: '', sourceClass: '', controlFamily: '', severity: '' })} type="button">
                Try account management
              </button>
              <button className="primary" onClick={() => onNavigate('start-here')} type="button">
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
  state: Extract<ViewState, { view: 'library-detail' }>;
  onNavigate: (view: ViewState['view'], patch?: Partial<ViewState>) => void;
  onOpenGlossary: (termId?: string) => void;
  onOpenNode: (nodeId: string, from?: string) => void;
}) {
  const { bundle, state, onNavigate, onOpenGlossary, onOpenNode } = props;
  const node = bundle.runtime.getNode(state.node);
  const document = bundle.runtime.getLibraryDocument(state.node);
  const source = document ? bundle.runtime.getSource(document.source_id) : bundle.runtime.getSource(node?.source_id);
  const edges = node ? bundle.runtime.getEdgesForNode(node.id, { publication_status: 'published' }) : [];
  const grouped = node ? groupRelationships(edges, node.id, bundle.runtime) : [];
  const federalContext = node ? bundle.runtime.getFederalContext(node.id) : null;
  const advancedRelationships = edges.slice(0, 25);

  if (!node || !document) {
    return (
      <section className="notice">
        <h2>Item not found</h2>
        <p>This deep link does not match a current public library entry.</p>
        <button className="primary" onClick={() => onNavigate('search')} type="button">
          Back to Library
        </button>
      </section>
    );
  }

  const locationSummary = [
    ...((federalContext?.baselineMembership || []).map((entry: any) => entry.baselineNode?.metadata?.item_id) || []),
    ...((federalContext?.fedrampBaselineContext || []).map((entry: any) => entry.baselineNode?.metadata?.item_id) || []),
  ].filter(Boolean);

  const relatedGlossaryTerms = glossaryTermsForDocument(document);

  return (
    <section className="detail-page">
      <div className="breadcrumbs">
        <button onClick={() => onNavigate('search')} type="button">
          Library
        </button>
        <span>/</span>
        <span>{document.item_id}</span>
      </div>

      <PageHeader
        eyebrow={displayNameFor('object_type', document.object_type)}
        action={
          <div className="page-header-actions">
            <button className="secondary" onClick={() => onNavigate('search', { query: state.from || document.item_id })} type="button">
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
                void copyText(`${window.location.origin}${window.location.pathname}${serializeViewState(state)}`);
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
            <p>{node.plain_language_summary || document.plain_language_summary || document.description}</p>
          </SummaryCard>
          <SummaryCard title="Why it matters">
            <p>
              {document.item_id} is part of the public compliance library. Use it to understand the requirement, see the
              public connections around it, and decide which comparison or planning artifact to open next.
            </p>
          </SummaryCard>
          <SummaryCard title="Where it appears">
            <p>
              {locationSummary.length
                ? `This item appears in ${locationSummary.join(', ')}.`
                : 'This item does not have a published baseline placement summary yet.'}
            </p>
          </SummaryCard>

          <section className="panel">
            <div className="section-header">
              <div>
                <h2>What it connects to</h2>
                <p>Related items are grouped by how a practitioner is likely to use them.</p>
              </div>
              <Badge tone="info">{edges.length} published links</Badge>
            </div>
            <div className="stack">
              {grouped.map((group: any) => (
                <section className="relationship-group" key={group.id}>
                  <div className="section-header">
                    <div>
                      <h3>{group.label}</h3>
                      <p>{group.description}</p>
                    </div>
                    <Badge>{group.items.length}</Badge>
                  </div>
                  <div className="stack compact">
                    {group.items.map((item: any) => (
                      <button className="relationship-card" key={`${group.id}-${item.counterpart.id}`} onClick={() => onOpenNode(item.counterpart.id, 'search')} type="button">
                        <div>
                          <strong>{item.counterpart.metadata?.item_id || item.counterpart.id}</strong>
                          <p>{item.counterpart.metadata?.title || item.counterpart.label}</p>
                        </div>
                        <div className="relationship-meta">
                          <span>{formatRelationshipLabel(item.edge)}</span>
                          <span>{sourceTrustSummary(source)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>

          <SummaryCard title="Official text / source excerpt">
            <p>{document.description || 'No public description available.'}</p>
            {source?.artifact_url ? (
              <p>
                <a href={source.artifact_url} rel="noopener noreferrer" target="_blank">
                  Open official source document
                </a>
              </p>
            ) : null}
          </SummaryCard>
        </section>

        <aside className="stack">
          <SummaryCard title="Source support" tone="trust">
            <p>{sourceTrustSummary(source)}</p>
            <p className="support-meta">Primary source: {source?.display_name || source?.name || 'Unavailable'}</p>
            <div className="card-actions">
              <button className="secondary" onClick={() => onNavigate('sources', { source: source?.id || '' })} type="button">
                Open source details
              </button>
            </div>
          </SummaryCard>

          <SummaryCard title="What to do next">
            <div className="stack compact">
              <button className="link-action" onClick={() => onNavigate('matrix', { workbench: 'relationships', items: document.item_id })} type="button">
                <IconGitCompare aria-hidden="true" size={16} stroke={1.8} />
                <span>Compare this item against other public mappings</span>
              </button>
              <button className="link-action" onClick={() => onNavigate('templates')} type="button">
                <IconClipboardList aria-hidden="true" size={16} stroke={1.8} />
                <span>Open starter templates for planning or assessment</span>
              </button>
            </div>
          </SummaryCard>

          {relatedGlossaryTerms.length ? (
            <SummaryCard title="Related terms">
              <p>Plain-language definitions for terms that often appear around this item.</p>
              <div className="chip-row">
                {relatedGlossaryTerms.map((entry) => (
                  <button className="chip" key={entry.id} onClick={() => onOpenGlossary(entry.id)} type="button">
                    {entry.term}
                  </button>
                ))}
              </div>
            </SummaryCard>
          ) : null}

          <Accordion.Root className="accordion-root" collapsible type="single">
            <DisclosurePanel title="Advanced details" value="advanced">
              <div className="advanced-list">
                <div>
                  <span>Item type</span>
                  <strong>{displayNameFor('object_type', document.object_type)}</strong>
                </div>
                <div>
                  <span>Source location</span>
                  <strong>{source?.artifact_url || 'Not recorded'}</strong>
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
                    const counterpartId = edge.source_node_id === node.id ? edge.target_node_id : edge.source_node_id;
                    const counterpart = bundle.runtime.getNode(counterpartId);
                    return (
                      <tr key={edge.id}>
                        <td>{counterpart?.metadata?.item_id || counterpartId}</td>
                        <td>{formatRelationshipLabel(edge)}</td>
                        <td>{displayNameFor('provenance_class', edge.provenance_class)}</td>
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

function CompareExportButtons(props: {
  disabled?: boolean;
  onExport: (format: 'csv' | 'markdown' | 'json') => void;
}) {
  return (
    <div className="card-actions">
      <button className="secondary" disabled={props.disabled} onClick={() => props.onExport('csv')} type="button">
        Export CSV
      </button>
      <button className="secondary" disabled={props.disabled} onClick={() => props.onExport('markdown')} type="button">
        Export Markdown
      </button>
      <button className="secondary" disabled={props.disabled} onClick={() => props.onExport('json')} type="button">
        Export JSON
      </button>
    </div>
  );
}

function BaselineControlSection(props: {
  controls: Array<{ control_node: any; source_refs?: Array<Record<string, string>> }>;
  onOpenNode: (nodeId: string) => void;
  title: string;
}) {
  return (
    <SummaryCard title={props.title}>
      <p>{props.controls.length} control{props.controls.length === 1 ? '' : 's'}</p>
      {props.controls.length ? (
        <ul className="source-ref-list">
          {props.controls.map((entry) => {
            const control = entry.control_node;
            const itemId = control.metadata?.item_id || control.id;
            const title = control.metadata?.title || control.label || itemId;
            return (
              <li key={control.id}>
                <button className="link-action" onClick={() => props.onOpenNode(control.id)} type="button">
                  <strong>{itemId}</strong> — {title}
                </button>
                <SourceRefList refs={entry.source_refs} />
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="muted">No controls in this section.</p>
      )}
    </SummaryCard>
  );
}

function ComparePage(props: {
  bundle: RuntimeBundle;
  state: Extract<ViewState, { view: 'matrix' }>;
  onNavigate: (view: ViewState['view'], patch?: Partial<ViewState>) => void;
  onOpenNode: (nodeId: string, from?: string) => void;
}) {
  const { bundle, state, onNavigate, onOpenNode } = props;
  const catalogs = bundle.runtime.getCatalogs();
  const workbench = state.workbench || 'intent';
  const relationshipNodeIds = useMemo(
    () => parseCatalogItemIds(state.items, state.source),
    [state.items, state.source],
  );
  const relationshipRows =
    workbench === 'relationships'
      ? bundle.runtime.buildRelationshipRows({
          source_catalog: state.source,
          target_catalog: state.target,
          relationship_type: state.relationshipType,
          provenance_class: state.provenance,
          confidence: state.confidence,
          include_candidates: state.includeCandidates === 'true',
          node_ids: relationshipNodeIds,
        })
      : null;
  const relationshipFilterOptions = useMemo(() => {
    if (!state.source || !state.target) {
      return { types: [] as string[], provenances: [] as string[], confidences: [] as string[] };
    }
    const optionRows = bundle.runtime.buildRelationshipRows({
      source_catalog: state.source,
      target_catalog: state.target,
      include_candidates: true,
      node_ids: relationshipNodeIds,
    }).rows;
    return {
      types: [...new Set(optionRows.map((row: any) => row.relationship_type).filter(Boolean))].sort() as string[],
      provenances: [...new Set(optionRows.map((row: any) => row.provenance_class).filter(Boolean))].sort() as string[],
      confidences: [...new Set(optionRows.map((row: any) => row.confidence).filter(Boolean))].sort() as string[],
    };
  }, [bundle, relationshipNodeIds, state.source, state.target]);
  const chainCatalogId = state.chainCatalog || 'disa-stig';
  const chainCatalogNodes = useMemo(
    () => bundle.runtime
      .getNodes({ catalog_id: chainCatalogId })
      .sort((left: any, right: any) =>
        (left.metadata?.item_id || '').localeCompare(right.metadata?.item_id || '') || left.id.localeCompare(right.id)),
    [bundle, chainCatalogId],
  );
  const chainBenchmarkOptions = useMemo(
    () => [...new Map(chainCatalogNodes.map((node: any) => {
      const value = node.metadata?.benchmark_id || node.source_id;
      const label = node.metadata?.benchmark_title || bundle.runtime.getSource(node.source_id)?.name || value;
      return [value, { value, label }];
    })).values()] as Array<{ value: string; label: string }>,
    [bundle, chainCatalogNodes],
  );
  const chainPayload =
    workbench === 'stig-chain'
      ? bundle.runtime.buildStigChain({
          chain_catalog: chainCatalogId,
          chain_benchmark: state.chainBenchmark,
          chain_item: state.chainItem,
          include_candidates: state.includeCandidates === 'true',
        })
      : null;
  const baselineOptions = bundle.runtime.getNodes({ node_type: 'baseline' }).map((node: any) => ({
    value: node.id,
    label: `${node.metadata?.item_id || node.id} - ${node.metadata?.title || node.label}`,
  }));
  const baselineComparison =
    workbench === 'baseline-compare' && state.baselineA && state.baselineB && state.baselineA !== state.baselineB
      ? bundle.runtime.buildBaselineComparison({ baseline_a: state.baselineA, baseline_b: state.baselineB })
      : null;
  const selectedChain = chainPayload?.selected_chain;

  const comparisonCards: Array<{ title: string; body: string; workbench: CompareWorkbench }> = [
    {
      title: 'Framework to framework',
      body: 'Compare two public catalogs and start with a summary before drilling into detailed mappings.',
      workbench: 'relationships',
    },
    {
      title: 'STIG/SRG to controls',
      body: 'Trace DISA items through CCI links to the related controls and see where the chain stops.',
      workbench: 'stig-chain',
    },
    {
      title: 'Baseline to baseline',
      body: 'See what two public baselines share and what is only present in one of them.',
      workbench: 'baseline-compare',
    },
    {
      title: 'Find what maps to this item',
      body: 'Open the framework comparison view with one known item in mind instead of blank filters.',
      workbench: 'relationships',
    },
  ];

  function exportRows(format: 'csv' | 'markdown' | 'json') {
    if (workbench === 'relationships' && relationshipRows) {
      const content = bundle.runtime.exportRelationshipRows(relationshipRows.rows, format);
      const extension = format === 'markdown' ? 'md' : format;
      downloadTextFile(`control-atlas-compare.${extension}`, content, format === 'json' ? 'application/json' : 'text/plain');
    }
    if (workbench === 'stig-chain' && chainPayload) {
      const content = bundle.runtime.exportStigChain(chainPayload, format);
      const extension = format === 'markdown' ? 'md' : format;
      downloadTextFile(`control-atlas-stig-chain.${extension}`, content, format === 'json' ? 'application/json' : 'text/plain');
    }
    if (workbench === 'baseline-compare' && baselineComparison) {
      const content = bundle.runtime.exportBaselineComparison(baselineComparison, format);
      const extension = format === 'markdown' ? 'md' : format;
      downloadTextFile(`control-atlas-baselines.${extension}`, content, format === 'json' ? 'application/json' : 'text/plain');
    }
  }

  return (
    <section className="panel">
      <PageHeader
        eyebrow="Compare"
        summary="Start with the comparison you need to make, then reveal only the inputs and raw details that help answer it."
        title="What do you want to compare?"
      />

      {workbench === 'intent' ? (
        <div className="intent-grid">
          {comparisonCards.map((card) => (
            <QuickIntentCard
              actionLabel="Use this path"
              body={card.body}
              icon={<IconGitCompare size={20} stroke={1.8} />}
              key={card.title}
              onClick={() => onNavigate('matrix', { ...state, workbench: card.workbench, intent: card.title })}
              title={card.title}
            />
          ))}
        </div>
      ) : (
        <>
          <div className="workbench-toggle">
            {comparisonCards.map((card) => (
              <button
                className={card.workbench === workbench ? 'active' : ''}
                key={card.title}
                onClick={() => onNavigate('matrix', { ...state, workbench: card.workbench, intent: card.title })}
                type="button"
              >
                {card.title}
              </button>
            ))}
          </div>

          {workbench === 'relationships' ? (
            <>
              <div className="filter-grid">
                <SelectField
                  label="Framework A"
                  onChange={(value) => onNavigate('matrix', { ...state, workbench, source: value })}
                  options={catalogs.map((catalog: any) => ({ value: catalog.id, label: catalog.name }))}
                  value={state.source}
                />
                <SelectField
                  label="Framework B"
                  onChange={(value) => onNavigate('matrix', { ...state, workbench, target: value })}
                  options={catalogs.map((catalog: any) => ({ value: catalog.id, label: catalog.name }))}
                  value={state.target}
                />
                <Field label="Specific item (optional)">
                  <input
                    onChange={(event) => onNavigate('matrix', { ...state, workbench, items: event.target.value })}
                    placeholder="AC-2"
                    value={state.items}
                  />
                </Field>
              </div>
              {state.source && state.target ? (
                <Accordion.Root className="accordion-root" collapsible type="single">
                  <DisclosurePanel title="Refine comparison" value="refine">
                    <div className="filter-grid">
                      <SelectField
                        emptyLabel="All connection types"
                        label="Connection type"
                        onChange={(value) => onNavigate('matrix', { ...state, workbench, relationshipType: value })}
                        options={relationshipFilterOptions.types.map((value) => ({
                          value,
                          label: displayNameFor('relationship_type', value),
                        }))}
                        value={state.relationshipType}
                      />
                      <SelectField
                        emptyLabel="All source bases"
                        label="Source basis"
                        onChange={(value) => onNavigate('matrix', { ...state, workbench, provenance: value })}
                        options={relationshipFilterOptions.provenances.map((value) => ({
                          value,
                          label: displayNameFor('provenance_class', value),
                        }))}
                        value={state.provenance}
                      />
                      <SelectField
                        emptyLabel="All trust levels"
                        label="Trust level"
                        onChange={(value) => onNavigate('matrix', { ...state, workbench, confidence: value })}
                        options={relationshipFilterOptions.confidences.map((value) => ({
                          value,
                          label: displayNameFor('confidence', value),
                        }))}
                        value={state.confidence}
                      />
                      <Field label="Show inferred mappings">
                        <label className="checkbox-field">
                          <input
                            checked={state.includeCandidates === 'true'}
                            onChange={(event) => onNavigate('matrix', {
                              ...state,
                              workbench,
                              includeCandidates: event.target.checked ? 'true' : '',
                            })}
                            type="checkbox"
                          />
                          <span>Include candidate and inferred links</span>
                        </label>
                      </Field>
                    </div>
                    <p className="compare-legend">
                      Official link = published mapping. Inferred link = candidate mapping that still needs review.
                    </p>
                  </DisclosurePanel>
                </Accordion.Root>
              ) : null}
              {relationshipRows?.rows?.length ? (
                <>
                  <div className="summary-grid">
                    <SummaryCard title="What this is">
                      <p>{relationshipRows.rows.length} visible public connections match the current comparison.</p>
                    </SummaryCard>
                    <SummaryCard title="Why it matters">
                      <p>Official and inferred relationships stay separate so you can judge trust before acting on the mapping.</p>
                    </SummaryCard>
                    <SummaryCard title="What to do next">
                      <p>Review the summary first, then open detailed mappings only if you need the exact row-level trace.</p>
                    </SummaryCard>
                  </div>
                  <CompareExportButtons onExport={exportRows} />
                  <Accordion.Root className="accordion-root" collapsible type="single">
                    <DisclosurePanel title="Detailed mappings" value="rows">
                      <table className="detail-table">
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
                              <td>{displayNameFor('relationship_type', row.relationship_type)}</td>
                              <td>
                                <ProvenanceBadge
                                  provenanceClass={row.provenance_class}
                                  publicationStatus={row.publication_status}
                                />
                              </td>
                              <td>{displayNameFor('confidence', row.confidence)}</td>
                              <td>{row.rationale || 'No public rationale recorded.'}</td>
                              <td>{row.plain_language_rationale || 'No plain-language rationale recorded.'}</td>
                              <td>
                                <SourceRefList refs={row.source_refs} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </DisclosurePanel>
                  </Accordion.Root>
                </>
              ) : (
                <section className="empty-state">
                  <IconFilter aria-hidden="true" size={24} stroke={1.8} />
                  <h2>No public connections found for this comparison.</h2>
                  <p>Try changing one catalog, removing filters, or searching for a specific control identifier.</p>
                </section>
              )}
            </>
          ) : null}

          {workbench === 'stig-chain' ? (
            <>
              <div className="filter-grid">
                <SelectField
                  label="Catalog"
                  onChange={(value) => onNavigate('matrix', {
                    ...state,
                    workbench,
                    chainCatalog: value,
                    chainBenchmark: '',
                    chainItem: '',
                  })}
                  options={[
                    { value: 'disa-stig', label: 'DISA STIG' },
                    { value: 'disa-srg', label: 'DISA SRG' },
                  ]}
                  value={chainCatalogId}
                />
                <SelectField
                  emptyLabel="All benchmarks"
                  label="Benchmark scope"
                  onChange={(value) => onNavigate('matrix', { ...state, workbench, chainBenchmark: value, chainItem: '' })}
                  options={chainBenchmarkOptions}
                  value={state.chainBenchmark}
                />
                <SelectField
                  emptyLabel="All visible items"
                  label="STIG or SRG item"
                  onChange={(value) => onNavigate('matrix', { ...state, workbench, chainItem: value })}
                  options={chainCatalogNodes
                    .filter((node: any) => !state.chainBenchmark
                      || node.metadata?.benchmark_id === state.chainBenchmark
                      || node.source_id === state.chainBenchmark)
                    .map((node: any) => ({
                      value: node.id,
                      label: `${node.metadata?.item_id || node.id} - ${node.metadata?.title || node.label}`,
                    }))}
                  value={state.chainItem}
                />
                <Field label="Show inferred mappings">
                  <label className="checkbox-field">
                    <input
                      checked={state.includeCandidates === 'true'}
                      onChange={(event) => onNavigate('matrix', {
                        ...state,
                        workbench,
                        includeCandidates: event.target.checked ? 'true' : '',
                      })}
                      type="checkbox"
                    />
                    <span>Include candidate and inferred links</span>
                  </label>
                </Field>
              </div>
              <p className="compare-legend">
                Official link = published mapping. Inferred link = candidate mapping. Pick a STIG rule, review CCI connections, then open the related NIST control.
              </p>
              {chainPayload?.rows?.length ? (
                <div className="stack">
                  <SummaryCard title="What this is">
                    <p>{chainPayload.rows.length} STIG or SRG items are visible in the current chain scope.</p>
                  </SummaryCard>
                  <CompareExportButtons
                    disabled={!(chainPayload.rows.length || selectedChain)}
                    onExport={exportRows}
                  />
                  <table className="detail-table" aria-label="STIG chain summary">
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
                        <tr className={state.chainItem === row.node_id || state.chainItem === row.item_id ? 'active-row' : ''} key={row.node_id}>
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
                              onClick={() => onNavigate('matrix', { ...state, workbench, chainItem: row.node_id })}
                              type="button"
                            >
                              Trace this item
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
                            {selectedChain.cci_entries.length ? selectedChain.cci_entries.map((entry: any) => (
                              <ChainRelationshipItem
                                key={entry.cciNode.id}
                                node={entry.cciNode}
                                onOpenNode={onOpenNode}
                                relationshipEdge={entry.relationshipEdge}
                                sourceRefs={entry.sourceRefs}
                              />
                            )) : <li>No CCI links.</li>}
                          </ul>
                        </SummaryCard>
                        <SummaryCard title="NIST controls">
                          <ul className="source-ref-list">
                            {selectedChain.nist_entries.length ? selectedChain.nist_entries.map((entry: any) => (
                              <ChainRelationshipItem
                                key={entry.nistNode.id}
                                node={entry.nistNode}
                                onOpenNode={onOpenNode}
                                relationshipEdge={entry.relationshipEdge}
                                sourceRefs={entry.sourceRefs}
                              />
                            )) : <li>No NIST controls reached from this visible chain.</li>}
                          </ul>
                        </SummaryCard>
                        <SummaryCard title="Unmapped CCIs">
                          <ul className="source-ref-list">
                            {selectedChain.unmapped_cci_nodes.length ? selectedChain.unmapped_cci_nodes.map((node: any) => (
                              <li className="chain-link-item" key={node.id}>
                                <button className="link-action" onClick={() => onOpenNode(node.id)} type="button">
                                  <strong>{node.metadata?.item_id || node.id}</strong> — {node.metadata?.title || node.label}
                                </button>
                              </li>
                            )) : <li>Every visible CCI has a visible NIST link.</li>}
                          </ul>
                        </SummaryCard>
                      </div>
                    </section>
                  ) : null}
                </div>
              ) : (
                <section className="empty-state">
                  <h2>No public chain results yet</h2>
                  <p>Try a different catalog or remove the item filter to widen the visible chain.</p>
                </section>
              )}
            </>
          ) : null}

          {workbench === 'baseline-compare' ? (
            <>
              <div className="filter-grid">
                <SelectField
                  label="Baseline A"
                  onChange={(value) => onNavigate('matrix', { ...state, workbench, baselineA: value })}
                  options={baselineOptions}
                  value={state.baselineA}
                />
                <SelectField
                  label="Baseline B"
                  onChange={(value) => onNavigate('matrix', { ...state, workbench, baselineB: value })}
                  options={baselineOptions}
                  value={state.baselineB}
                />
              </div>
              {baselineComparison ? (
                <>
                  {baselineComparison.baseline_a_source ? (
                    <p className="baseline-source-summary">
                      Baseline A: {baselineComparison.baseline_a?.metadata?.item_id || baselineComparison.baseline_a?.id}
                      {' — '}
                      {baselineComparison.baseline_a?.metadata?.title || baselineComparison.baseline_a?.label}
                      {' ('}
                      {baselineComparison.baseline_a_source.name}
                      {baselineComparison.baseline_a_source.version ? ` v${baselineComparison.baseline_a_source.version}` : ''}
                      )
                    </p>
                  ) : null}
                  {baselineComparison.baseline_b_source ? (
                    <p className="baseline-source-summary">
                      Baseline B: {baselineComparison.baseline_b?.metadata?.item_id || baselineComparison.baseline_b?.id}
                      {' — '}
                      {baselineComparison.baseline_b?.metadata?.title || baselineComparison.baseline_b?.label}
                      {' ('}
                      {baselineComparison.baseline_b_source.name}
                      {baselineComparison.baseline_b_source.version ? ` v${baselineComparison.baseline_b_source.version}` : ''}
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
                  <CompareExportButtons onExport={exportRows} />
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
  state: Extract<ViewState, { view: 'sources' }>;
  onNavigate: (view: ViewState['view'], patch?: Partial<ViewState>) => void;
}) {
  const { bundle, state, onNavigate } = props;
  const sources = bundle.runtime.getSources({
    provenance_class: state.provenance || undefined,
    eligibility_status: state.eligibility || undefined,
    lifecycle_status: state.lifecycle || undefined,
    access_status: state.access || undefined,
  });
  const selectedSource = state.source ? bundle.runtime.getSource(state.source) : null;

  const distinct = (key: string) =>
    [...new Set(bundle.runtime.dataset.sources.map((source: any) => source[key]).filter(Boolean))] as string[];

  return (
    <section className="panel">
      <PageHeader
        eyebrow="Sources"
        summary="Review what a source is, how Control Atlas uses it, and how much trust to place in the resulting public mapping."
        title="Review sources before you rely on a match"
      />

      <div className="filter-grid">
        <SelectField
          label="Source type"
          onChange={(value) => onNavigate('sources', { ...state, provenance: value })}
          options={distinct('provenance_class').map((value) => ({ value, label: displayNameFor('provenance_class', value) }))}
          value={state.provenance}
        />
        <SelectField
          label="Included in map"
          onChange={(value) => onNavigate('sources', { ...state, eligibility: value })}
          options={distinct('eligibility_status').map((value) => ({ value, label: displayNameFor('eligibility_status', value) }))}
          value={state.eligibility}
        />
        <SelectField
          label="Status"
          onChange={(value) => onNavigate('sources', { ...state, lifecycle: value })}
          options={distinct('lifecycle_status').map((value) => ({ value, label: displayNameFor('lifecycle_status', value) }))}
          value={state.lifecycle}
        />
        <SelectField
          label="Access"
          onChange={(value) => onNavigate('sources', { ...state, access: value })}
          options={distinct('access_status').map((value) => ({ value, label: displayNameFor('access_status', value) }))}
          value={state.access}
        />
      </div>

      {selectedSource ? (
        <section className="stack">
          <SourceSummaryCard source={selectedSource} />
          <SummaryCard title="What this source is" tone="trust">
            <p>{selectedSource.name}</p>
          </SummaryCard>
          <SummaryCard title="How Control Atlas uses it">
            <p>{sourceUsageSummary(selectedSource)}. Parser: {selectedSource.metadata?.parser || 'Not recorded'}.</p>
          </SummaryCard>
          <SummaryCard title="Trust and status">
            <p>{sourceTrustSummary(selectedSource)}</p>
            <p>
              {displayNameFor('lifecycle_status', selectedSource.lifecycle_status)} ·{' '}
              {displayNameFor('access_status', selectedSource.access_status)}
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
        <div className="stack">
          {sources.map((source: any) => (
            <SourceSummaryCard key={source.id} onOpen={() => onNavigate('sources', { ...state, source: source.id })} source={source} />
          ))}
        </div>
      )}
    </section>
  );
}

function TemplatesPage(props: {
  bundle: RuntimeBundle;
  state: Extract<ViewState, { view: 'templates' }>;
  onNavigate: (view: ViewState['view'], patch?: Partial<ViewState>) => void;
}) {
  const { bundle, state, onNavigate } = props;
  const templates = bundle.templateRegistry.templates || [];
  const selectedTemplate = templates.find((template: any) => template.name === state.templateType) || null;
  const catalogOptions = bundle.runtime.getCatalogs().map((catalog: any) => ({ value: catalog.id, label: catalog.name }));
  const formatLabels: Record<string, string> = {
    markdown: 'Markdown',
    csv: 'CSV',
    json: 'JSON',
    yaml: 'YAML',
  };
  const supportedFormats = selectedTemplate?.supported_formats || ['markdown'];
  const activeFormat = supportedFormats.includes(state.format || 'markdown')
    ? state.format || supportedFormats[0]
    : supportedFormats[0];

  function createTemplate() {
    if (!selectedTemplate) {
      return;
    }
    const generated = generateTemplate(
      {
        templateType: selectedTemplate.name,
        framework: state.framework || 'nist-800-53',
        format: activeFormat,
        environment: state.environment || 'Generic',
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
  }

  return (
    <section className="panel">
      <PageHeader
        eyebrow="Templates"
        summary="Choose the artifact you need first, review what it is for, then generate a blank reference starter without exposing extra options too early."
        title="What are you trying to create?"
      />

      <div className="intent-grid">
        {templates.map((template: any) => (
          <QuickIntentCard
            actionLabel="Choose artifact"
            body={template.description}
            icon={<IconFileDescription size={20} stroke={1.8} />}
            key={template.name}
            onClick={() =>
              onNavigate('templates', {
                templateType: template.name,
                framework: state.framework || '',
                format: template.supported_formats?.[0] || 'markdown',
                environment: state.environment || 'Generic',
              })
            }
            title={template.display_name}
          />
        ))}
      </div>

      {selectedTemplate ? (
        <section className="stack">
          <SummaryCard title="What this template is for" tone="trust">
            <p>{selectedTemplate.description}</p>
          </SummaryCard>
          <SummaryCard title="What it includes">
            <p>
              Supported formats: {selectedTemplate.supported_formats.join(', ')}. Inputs: {selectedTemplate.input_options.join(', ')}.
            </p>
          </SummaryCard>
          <div className="card-actions">
            <button className="primary" onClick={createTemplate} type="button">
              Generate template
            </button>
          </div>
          <Accordion.Root className="accordion-root" collapsible type="single">
            <DisclosurePanel title="More options" value="options">
              <div className="filter-grid">
                <SelectField
                  label="Framework"
                  onChange={(value) => onNavigate('templates', { ...state, framework: value })}
                  options={catalogOptions}
                  value={state.framework}
                />
                <SelectField
                  label="Environment"
                  onChange={(value) => onNavigate('templates', { ...state, environment: value })}
                  options={[
                    { value: 'Generic', label: 'Generic' },
                    { value: 'Cloud SaaS', label: 'Cloud SaaS' },
                    { value: 'Platform service', label: 'Platform service' },
                    { value: 'Enclave', label: 'Enclave' },
                    { value: 'On-premises', label: 'On-premises' },
                    { value: 'Hybrid', label: 'Hybrid' },
                    { value: 'Enterprise service', label: 'Enterprise service' },
                  ]}
                  value={state.environment || 'Generic'}
                />
                <SelectField
                  label="Format"
                  onChange={(value) => onNavigate('templates', { ...state, format: value })}
                  options={supportedFormats.map((format: string) => ({
                    value: format,
                    label: formatLabels[format] || format,
                  }))}
                  value={activeFormat}
                />
              </div>
            </DisclosurePanel>
          </Accordion.Root>
        </section>
      ) : null}
    </section>
  );
}

function PatternsPage(props: {
  state: Extract<ViewState, { view: 'patterns' }>;
  onNavigate: (view: ViewState['view'], patch?: Partial<ViewState>) => void;
  onOpenNodeByItemId: (itemId: string) => void;
  onOpenGlossary: (termId?: string) => void;
  setHelpOpen: (open: boolean) => void;
}) {
  const { state, onNavigate, onOpenNodeByItemId, onOpenGlossary, setHelpOpen } = props;
  const selectedPattern = patternsData.find((pattern) => pattern.id === state.pattern) || null;
  const patternGlossaryTerms = selectedPattern ? glossaryTermsForPattern(selectedPattern.id) : [];

  if (!selectedPattern) {
    return (
      <section className="panel">
        <PageHeader
          eyebrow="Patterns"
          summary="Open the outcome you are trying to solve, then review when it helps, how it works, common mistakes, and the related controls or templates."
          title="Patterns organized around user outcomes"
        />
        <div className="intent-grid">
          {patternsData.map((pattern) => (
            <QuickIntentCard
              actionLabel="Open pattern"
              body={pattern.summary}
              icon={<IconBook2 size={20} stroke={1.8} />}
              key={pattern.id}
              onClick={() => onNavigate('patterns', { pattern: pattern.id })}
              title={PATTERN_RENAMES[pattern.id] || pattern.title}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <PageHeader
        eyebrow="Pattern"
        action={
          <button className="secondary" onClick={() => onNavigate('patterns', { pattern: '' })} type="button">
            Back to patterns
          </button>
        }
        summary="Pattern pages lead with the problem they solve, when to use them, how they work, common mistakes, and the next action to take."
        title={PATTERN_RENAMES[selectedPattern.id] || selectedPattern.title}
      />
      <div className="detail-grid">
        <section className="stack">
          <SummaryCard title="What this helps with" tone="trust">
            <p>{selectedPattern.summary}</p>
          </SummaryCard>
          {patternGlossaryTerms.length ? (
            <SummaryCard title="Related glossary terms">
              <div className="chip-row">
                {patternGlossaryTerms.map((entry) => (
                  <button className="chip" key={entry.id} onClick={() => onOpenGlossary(entry.id)} type="button">
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
                <button className="chip" key={controlId} onClick={() => onOpenNodeByItemId(controlId)} type="button">
                  {controlId}
                </button>
              ))}
            </div>
          </SummaryCard>
          <SummaryCard title="Related templates">
            <div className="stack compact">
              {selectedPattern.templates.map((templateId) => (
                <button className="link-action" key={templateId} onClick={() => onNavigate('templates', { templateType: templateId })} type="button">
                  <IconFileDescription aria-hidden="true" size={16} stroke={1.8} />
                  <span>{templateId.replaceAll('_', ' ')}</span>
                </button>
              ))}
            </div>
          </SummaryCard>
          <SummaryCard title="Source support">
            <p>{selectedPattern.sources.join(', ')}</p>
          </SummaryCard>
          <SummaryCard title="Next action">
            <div className="stack compact">
              <button className="link-action" onClick={() => onNavigate('templates')} type="button">
                <IconClipboardList aria-hidden="true" size={16} stroke={1.8} />
                <span>Open a related template starter</span>
              </button>
              <button className="link-action" onClick={() => setHelpOpen(true)} type="button">
                <IconInfoCircle aria-hidden="true" size={16} stroke={1.8} />
                <span>Open glossary support</span>
              </button>
            </div>
          </SummaryCard>
        </aside>
      </div>
    </section>
  );
}

function StartHerePage(props: {
  state: Extract<ViewState, { view: 'start-here' }>;
  onNavigate: (view: ViewState['view'], patch?: Partial<ViewState>) => void;
}) {
  const { state, onNavigate } = props;
  const ready = Boolean(state.systemType && state.dataSensitivity && state.environment);

  const recommendations = useMemo(
    () => buildStartHereRecommendations({
      systemType: state.systemType,
      dataSensitivity: state.dataSensitivity,
      environment: state.environment,
    }) as StartHereRecommendations | null,
    [state.dataSensitivity, state.environment, state.systemType],
  );

  function followLibraryLink(link: StartHereLibraryLink) {
    if (link.kind === 'library-catalog') {
      onNavigate('browse', { framework: link.catalogId });
      return;
    }
    onNavigate('library-detail', { node: link.nodeId, from: 'start-here' });
  }

  function followCompareLink(link: StartHereCompareLink) {
    onNavigate('matrix', {
      workbench: link.workbench,
      ...link.patch,
    });
  }

  function restartQuestionnaire() {
    onNavigate('start-here', {
      step: '',
      systemType: '',
      dataSensitivity: '',
      environment: '',
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
          label="System type"
          onChange={(value) => onNavigate('start-here', { ...state, systemType: value })}
          options={[
            { value: 'Cloud SaaS', label: 'Cloud SaaS' },
            { value: 'Platform service', label: 'Platform service' },
            { value: 'On-premises', label: 'On-premises' },
            { value: 'Hybrid', label: 'Hybrid' },
            { value: 'Enterprise service', label: 'Enterprise service' },
          ]}
          value={state.systemType}
        />
        <SelectField
          label="Data sensitivity"
          onChange={(value) => onNavigate('start-here', { ...state, dataSensitivity: value })}
          options={[
            { value: 'Low', label: 'Low' },
            { value: 'Moderate', label: 'Moderate' },
            { value: 'High', label: 'High' },
            { value: 'CUI', label: 'CUI' },
          ]}
          value={state.dataSensitivity}
        />
        <SelectField
          label="Operational environment"
          onChange={(value) => onNavigate('start-here', { ...state, environment: value })}
          options={[
            { value: 'Federal civilian', label: 'Federal civilian' },
            { value: 'DoD', label: 'DoD' },
            { value: 'Contractor', label: 'Contractor' },
            { value: 'CSP', label: 'CSP' },
          ]}
          value={state.environment}
        />
      </div>

      {recommendations ? (
        <div className="stack">
          <div className="card-actions">
            <button className="secondary" onClick={restartQuestionnaire} type="button">
              Restart questionnaire
            </button>
          </div>

          <div className="summary-grid">
            <SummaryCard title="What this is" tone="trust">
              <p>This is a reference recommendation. It is not a compliance determination.</p>
            </SummaryCard>
          </div>

          <section className="stack">
            <div className="section-header">
              <h2>Library</h2>
              <p>Framework catalogs and baselines to open first.</p>
            </div>
            <div className="stack compact">
              {recommendations.library.map((link) => (
                <article className="relationship-card" key={`${link.kind}-${link.kind === 'library-catalog' ? link.catalogId : link.nodeId}`}>
                  <div>
                    <strong>{link.label}</strong>
                    <p>{link.rationale}</p>
                  </div>
                  <button className="secondary" onClick={() => followLibraryLink(link)} type="button">
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
                <article className="relationship-card" key={`compare-${link.workbench}-${link.label}`}>
                  <div>
                    <strong>{link.label}</strong>
                    <p>{link.rationale}</p>
                  </div>
                  <button className="secondary" onClick={() => followCompareLink(link)} type="button">
                    Open Compare
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="stack">
            <div className="section-header">
              <h2>Patterns</h2>
              <p>Plain-language guides for concepts that often block progress.</p>
            </div>
            <div className="stack compact">
              {recommendations.patterns.map((link) => (
                <article className="relationship-card" key={link.patternId}>
                  <div>
                    <strong>{link.label}</strong>
                    <p>{link.rationale}</p>
                  </div>
                  <button className="secondary" onClick={() => onNavigate('patterns', { pattern: link.patternId })} type="button">
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
                  <button className="primary" onClick={() => onNavigate('templates', { templateType: link.templateType })} type="button">
                    Generate {link.label}
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <section className="empty-state">
          <h2>Answer the three questions above</h2>
          <p>Control Atlas will suggest the first framework, template, and pattern pages to open next.</p>
        </section>
      )}
    </section>
  );
}

function GlossaryDrawer(props: {
  open: boolean;
  setOpen: (open: boolean) => void;
  focusTermId?: string;
  bundle: RuntimeBundle | null;
  onNavigate: (view: ViewState['view'], patch?: Partial<ViewState>) => void;
  onOpenNode: (nodeId: string, from?: string) => void;
}) {
  const { open, setOpen, focusTermId = '', bundle, onNavigate, onOpenNode } = props;
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return glossaryData.filter((entry) => {
      if (!needle) {
        return true;
      }
      return [entry.term, entry.expansion, entry.definition, entry.source].join(' ').toLowerCase().includes(needle);
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
      setQuery('');
    }
  }, [focusTermId, open]);

  useEffect(() => {
    if (!open || !focusTermId) {
      return;
    }
    const target = document.getElementById(`glossary-term-${focusTermId}`);
    target?.scrollIntoView({ block: 'nearest' });
  }, [filtered, focusTermId, open]);

  function openFirstControl(controlId: string) {
    if (!bundle) {
      return;
    }
    const match = bundle.runtime.searchLibrary(controlId).find((item: any) => item.item_id === controlId) || bundle.runtime.searchLibrary(controlId)[0];
    if (match) {
      setOpen(false);
      onOpenNode(match.id, 'search');
    }
  }

  return (
    <Dialog.Root onOpenChange={setOpen} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay" />
        <Dialog.Content className="drawer-content">
          <div className="drawer-header">
            <div>
              <Dialog.Title>Help &amp; Glossary</Dialog.Title>
              <Dialog.Description>
                Short definitions, why they matter, and quick links back into the library or pattern pages.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="icon-button" type="button">
                <IconX aria-hidden="true" size={18} stroke={1.8} />
              </button>
            </Dialog.Close>
          </div>

          <label className="field" htmlFor="glossary-search">
            <span>Search glossary</span>
            <div className="search-input">
              <IconSearch aria-hidden="true" size={18} stroke={1.8} />
              <input id="glossary-search" onChange={(event) => setQuery(event.target.value)} type="search" value={query} />
            </div>
          </label>

          <div className="drawer-list">
            {filtered.map((entry) => {
              const relatedTemplateIds = templatesForPatterns(entry.related_patterns);
              return (
              <article
                className={focusTermId === entry.id ? 'drawer-item drawer-item-focused' : 'drawer-item'}
                id={`glossary-term-${entry.id}`}
                key={entry.id}
              >
                <div className="result-card-header">
                  <h3>
                    {entry.term}
                    {entry.expansion ? <span className="drawer-expansion"> · {entry.expansion}</span> : null}
                  </h3>
                  <Badge tone={entry.consensus ? 'warning' : 'success'}>
                    {entry.consensus ? 'Practitioner consensus' : 'Official source'}
                  </Badge>
                </div>
                <p>{entry.definition}</p>
                <p className="drawer-support">
                  Why it matters: use this term to understand the surrounding control, pattern, or template before you act on it.
                </p>
                <div className="chip-row">
                  {entry.related_patterns.map((patternId) => (
                    <button
                      className="chip"
                      key={patternId}
                      onClick={() => {
                        setOpen(false);
                        onNavigate('patterns', { pattern: patternId });
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
                        onNavigate('templates', { templateType: templateId });
                      }}
                      type="button"
                    >
                      {templateId.replaceAll('_', ' ')}
                    </button>
                  ))}
                  {entry.related_controls.map((controlId) => (
                    <button className="chip" key={controlId} onClick={() => openFirstControl(controlId)} type="button">
                      {controlId}
                    </button>
                  ))}
                </div>
                <p className="drawer-link">Official source: {entry.source}</p>
              </article>
            );
            })}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function QuickIntentCard(props: { title: string; body: string; icon: ReactNode; actionLabel: string; onClick: () => void }) {
  return (
    <article className="intent-card">
      <div className="intent-icon">{props.icon}</div>
      <h2>{props.title}</h2>
      <p>{props.body}</p>
      <button className="secondary" onClick={props.onClick} type="button">
        {props.actionLabel}
      </button>
    </article>
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
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <select onChange={(event) => props.onChange(event.target.value)} value={props.value}>
        <option value="">{props.emptyLabel || 'All'}</option>
        {props.options.map((option) => (
          <option key={`${props.label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
