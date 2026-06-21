import * as Accordion from "@radix-ui/react-accordion";
import {
  IconArrowRight,
  IconSearch,
  IconSparkles,
} from "@tabler/icons-react";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import { ProvenanceTerm } from "../components/ProvenanceTerm";
import { searchGlossary } from "../lib/glossarySearch.mjs";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";

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

function SelectField(props: {
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
        <option value="">All</option>
        {props.options.map((option) => (
          <option key={`${props.label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ExplorePage(props: {
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
    onNavigate,
    onOpenNode,
    onOpenGlossary,
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

  const documents = useMemo(() => {
    return bundle.runtime.searchLibrary(state.query, filters);
  }, [
    bundle.runtime,
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
      <section className="panel search-panel">
        <PageHeader
          eyebrow="Explore"
          action={
            <button
              className="secondary"
              onClick={() => onNavigate("start-here")}
              type="button"
            >
              Start guided path
            </button>
          }
          summary="Search controls, baselines, CCIs, STIGs, terms, templates, playbooks, and sources. Open a record to see what it means and how it connects."
          title="Explore the control landscape"
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
            <span>Search by ID, title, or topic</span>
            <div className="search-input">
              <IconSearch aria-hidden="true" size={18} stroke={1.8} />
              <input
                id="search-query"
                onChange={(event) => setQueryDraft(event.target.value)}
                placeholder="AC-2, account management, FedRAMP High, CCI-000225"
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
                              {relationshipCount} connections
                            </Badge>
                          </div>
                          <p className="result-summary">
                            {document.plain_language_summary ||
                              node?.plain_language_summary ||
                              document.description}
                          </p>
                          <div className="result-support">
                            <span>
                              Source:{" "}
                              {source?.display_name ||
                                source?.name ||
                                "Source unavailable"}
                            </span>
                            {source?.provenance_class ? (
                              <ProvenanceTerm
                                kind="provenance"
                                value={source.provenance_class}
                              />
                            ) : (
                              <span>
                                No public source record is attached yet.
                              </span>
                            )}
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
                              Open record
                            </button>
                            {relationshipCount > 0 ? (
                              <button
                                className="secondary"
                                disabled={!graphReady}
                                onClick={() =>
                                  openAtlasMapForNode(onNavigate, document.id)
                                }
                                type="button"
                              >
                                Open in Atlas Map
                              </button>
                            ) : null}
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
                              Compare
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
        ) : hasQuery || hasFilters ? (
          <section className="empty-state">
            <IconSparkles aria-hidden="true" size={24} stroke={1.8} />
            <h2>No matching records found.</h2>
            <p>
              Try searching by control ID, topic, baseline, CCI, or source.
            </p>
            <div className="card-actions">
              <button
                className="secondary"
                onClick={() =>
                  onNavigate("search", {
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
                Clear search
              </button>
              <button
                className="secondary"
                onClick={() => onNavigate("atlas-map")}
                type="button"
              >
                Open Atlas Map
              </button>
              <button
                className="primary"
                onClick={() => onNavigate("start-here")}
                type="button"
              >
                Start guided path
              </button>
            </div>
          </section>
        ) : (
          <section className="empty-state subtle">
            <p className="muted">
              Try AC-2, FedRAMP High, CCI-000225, or account management.
            </p>
          </section>
        )}
      </section>
    </>
  );
}
