import {
  IconArrowRight,
  IconFlag,
  IconFolders,
  IconPlus,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";

import "../../../styles/resources.css";
import { CommonsResourceCard } from "../components/CommonsResourceCard";
import { Button } from "../components/lsm";
import type { CommonsCollection, CommonsResource } from "../lib/commonsTypes";
import { resourceAccessLabel, resourceTypeLabel } from "../lib/resourceBrands.mjs";
import {
  filterDirectoryResources,
  searchDirectoryResources,
  sortDirectoryResources,
} from "../lib/resourcesDirectory.mjs";
import { WorkbenchControlSurface } from "../lib/pagePrimitives";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";

type CommonsState = Extract<ViewState, { view: "commons" }>;

const EMPTY_STATE: CommonsState = {
  view: "commons",
  query: "",
  lane: "all",
  framework: "",
  lifecycle: "",
  audience: "",
  accessType: "",
  resourceType: "",
  category: "",
  collection: "",
  owner: "",
  costType: "",
  sort: "relevance",
  showAll: "",
};

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function workStageLabel(value: string): string {
  return value
    ? `${value.slice(0, 1).toUpperCase()}${value.slice(1).toLowerCase()}`
    : value;
}

export function CommonsPage(props: {
  bundle: RuntimeBundle | null;
  viewState: ViewState;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  const { bundle, viewState, onNavigate } = props;
  const state = viewState.view === "commons" ? viewState : EMPTY_STATE;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const directoryAvailable = Boolean(bundle?.commonsDataset);
  const resources = (bundle?.commonsDataset?.resources || []) as CommonsResource[];
  const collections = (bundle?.commonsDataset?.collections || []) as CommonsCollection[];
  const update = (patch: Partial<CommonsState>) => onNavigate("commons", { ...state, ...patch });

  const filtered = useMemo(() => {
    const eligible = filterDirectoryResources(resources, {
      collection: state.collection,
      lane: state.lane,
      owner: state.owner,
      framework: state.framework,
      lifecycle: state.lifecycle,
      audience: state.audience,
      resourceType: state.resourceType,
      accessType: state.accessType,
      costType: state.costType,
    });
    return sortDirectoryResources(searchDirectoryResources(eligible, state.query), state.sort);
  }, [resources, state]);

  const resourceTypes = unique(resources.map((resource) => resource.resourceType));
  const owners = unique(resources.map((resource) => resource.publisher));
  const lifecycleStages = unique(
    resources.flatMap((resource) => resource.lifecycleStages).map(workStageLabel),
  );
  const audiences = unique(resources.flatMap((resource) => resource.audiences));
  const accessTypes = unique(resources.map((resource) => resource.accessType));
  const costTypes = unique(resources.map((resource) => resource.costType));
  const activeFilterCount = [
    state.collection,
    state.resourceType,
    state.owner,
    state.lifecycle,
    state.audience,
    state.accessType,
    state.costType,
  ].filter(Boolean).length;
  const resultsVisible = Boolean(state.showAll || state.query || activeFilterCount);
  const selectedCollection = collections.find((collection) => collection.id === state.collection);

  const reset = () => update({ ...EMPTY_STATE });

  return (
    <main className="commons-page resources-ecosystem-page">
      <div className="ca-content-container resources-directory">
        <header className="resources-directory-header">
          <div>
            <p className="eyebrow">Resources</p>
            <h1>Find the ecosystem around the work</h1>
            <p>
              Search official portals, tools, services, training, product directories, and practitioner communities. Publications stay in Library.
            </p>
          </div>
          <div className="resources-directory-actions">
            <a href="https://github.com/BackslashBryant/control-atlas/issues/new?template=submit-resource.yml" rel="noopener noreferrer" target="_blank"><IconPlus aria-hidden="true" size={16} />Submit resource</a>
            <a href="https://github.com/BackslashBryant/control-atlas/issues/new?template=report-broken-link.yml" rel="noopener noreferrer" target="_blank"><IconFlag aria-hidden="true" size={16} />Report a problem</a>
          </div>
        </header>

        <WorkbenchControlSurface className="resources-control-surface" label="Find resources" targetId="resources-results">
          <label className="resources-search" htmlFor="resources-query">
            <IconSearch aria-hidden="true" size={22} />
            <input aria-label="Find resources" id="resources-query" onChange={(event) => update({ query: event.target.value })} placeholder="Try OSCAL, 8140, ATO reuse, Iron Bank, CMMC, or STIG scanner" type="search" value={state.query} />
            {state.query ? <button aria-label="Clear resource search" onClick={() => update({ query: "" })} type="button"><IconX aria-hidden="true" size={18} /></button> : null}
          </label>
          <div className="resources-facets">
            <button aria-controls="resources-filter-panel" aria-expanded={filtersOpen} className="resources-filter-toggle" onClick={() => setFiltersOpen((open) => !open)} type="button">
              Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
            </button>
            <div aria-label="Resource filters" className="resources-facet-grid" hidden={!filtersOpen} id="resources-filter-panel" role="region">
              <ResourceSelect label="Collection" onChange={(collection) => update({ collection, showAll: collection ? "true" : state.showAll })} options={collections.map((collection) => ({ value: collection.id, label: collection.title }))} value={state.collection} />
              <ResourceSelect label="Type" onChange={(resourceType) => update({ resourceType })} options={resourceTypes.map((value) => ({ value, label: resourceTypeLabel(value) }))} value={state.resourceType} />
              <ResourceSelect label="Owner" onChange={(owner) => update({ owner })} options={owners.map((value) => ({ value, label: value }))} value={state.owner} />
              <ResourceSelect label="Access" onChange={(accessType) => update({ accessType })} options={accessTypes.map((value) => ({ value, label: resourceAccessLabel({ accessType: value } as CommonsResource) }))} value={state.accessType} />
              <ResourceSelect label="Cost" onChange={(costType) => update({ costType })} options={costTypes.map((value) => ({ value, label: value.replaceAll("_", " ") }))} value={state.costType} />
              <ResourceSelect label="Audience" onChange={(audience) => update({ audience })} options={audiences.map((value) => ({ value, label: value }))} value={state.audience} />
              <ResourceSelect label="Work stage" onChange={(lifecycle) => update({ lifecycle })} options={lifecycleStages.map((value) => ({ value, label: value }))} value={state.lifecycle} />
              <ResourceSelect label="Sort" onChange={(sort) => update({ sort })} options={[{ value: "relevance", label: "Relevance" }, { value: "name", label: "Name" }, { value: "checked", label: "Recently checked" }]} value={state.sort} emptyLabel={null} />
            </div>
          </div>
        </WorkbenchControlSurface>

        {!directoryAvailable ? (
          <section className="empty-state" data-control-results id="resources-results">
            <h2>The resource directory did not load.</h2>
            <p>The rest of Control Atlas still works. Reload to try this separate public dataset again.</p>
            <Button onClick={() => window.location.reload()} type="button" variant="secondary">Reload the directory</Button>
          </section>
        ) : !resultsVisible ? (
          <section aria-labelledby="resource-collections-heading" className="resource-collections" id="resources-results">
            <div className="resource-section-heading">
              <div><p className="eyebrow">Curated starting points</p><h2 id="resource-collections-heading">Browse eight practical collections</h2></div>
              <button onClick={() => update({ showAll: "true" })} type="button">Browse all {resources.length} resources <IconArrowRight aria-hidden="true" size={16} /></button>
            </div>
            <div className="resource-collection-grid">
              {collections.map((collection) => (
                <button className="resource-collection-card" key={collection.id} onClick={() => update({ collection: collection.id, showAll: "true" })} type="button">
                  <span className="resource-collection-icon"><IconFolders aria-hidden="true" size={22} /></span>
                  <span className="resource-collection-copy"><strong>{collection.title}</strong><span>{collection.summary}</span><small>{collection.resourceIds.length} resources</small></span>
                  <IconArrowRight aria-hidden="true" className="resource-collection-arrow" size={18} />
                </button>
              ))}
            </div>
          </section>
        ) : filtered.length ? (
          <section aria-label="Resource results" data-control-results id="resources-results">
            <div className="resource-section-heading resources-result-heading">
              <div><p className="eyebrow">{selectedCollection ? "Collection" : "Directory"}</p><h2>{selectedCollection?.title || "All matching resources"}</h2>{selectedCollection ? <p>{selectedCollection.whyCurated}</p> : null}</div>
              <div className="resources-result-status"><p aria-live="polite" role="status">Showing {filtered.length} of {resources.length}</p><button onClick={reset} type="button">Back to collections</button></div>
            </div>
            <div className="resources-result-grid">
              {filtered.map((resource) => <CommonsResourceCard key={resource.id} onSelectDetail={(id) => onNavigate("commons-detail", { id, from: "commons" })} resource={resource} />)}
            </div>
          </section>
        ) : (
          <section className="empty-state" data-control-results id="resources-results">
            <h2>No resources match that combination.</h2>
            <p>Clear the filters or search for an owner, acronym, tool, or job.</p>
            <button onClick={reset} type="button">Back to collections</button>
          </section>
        )}
      </div>
    </main>
  );
}

function ResourceSelect(props: { label: string; value: string; options: Array<{ value: string; label: string }>; emptyLabel?: string | null; onChange: (value: string) => void }) {
  const { label, value, options, emptyLabel = "All", onChange } = props;
  return <label><span>{label}</span><select aria-label={label} onChange={(event) => onChange(event.target.value)} value={value}>{emptyLabel === null ? null : <option value="">{emptyLabel}</option>}{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
