import {
  IconFlag,
  IconPlus,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";

import { CommonsResourceCard } from "../components/CommonsResourceCard";
import { Button } from "../components/lsm";
import type { CommonsResource } from "../lib/commonsTypes";
import {
  filterDirectoryResources,
  primaryBrowseCategoryCounts,
  searchDirectoryResources,
} from "../lib/resourcesDirectory.mjs";
import { WorkbenchControlSurface } from "../lib/pagePrimitives";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";

type CommonsState = Extract<ViewState, { view: "commons" }>;

export function CommonsPage(props: {
  bundle: RuntimeBundle | null;
  viewState: ViewState;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  const { bundle, viewState, onNavigate } = props;
  const state: CommonsState =
    viewState.view === "commons"
      ? viewState
      : {
          view: "commons",
          query: "",
          lane: "all",
          framework: "",
          lifecycle: "",
          audience: "",
          accessType: "",
          resourceType: "",
          category: "",
          showAll: "",
        };
  // The resource directory is a separate artifact from the record graph and is
  // fetched with a .catch(() => null) in runtimeLoader. When that fetch fails
  // the page used to report "No resources match these filters" — telling the
  // reader the directory is empty when it simply never arrived.
  const directoryAvailable = Boolean(bundle?.commonsDataset);
  const resources = (bundle?.commonsDataset?.resources || []) as CommonsResource[];
  const [filtersOpen, setFiltersOpen] = useState(false);
  // A full resource grid made a 17,000px page. Show a first screenful and
  // let the reader ask for the rest; the filters above are the intended way
  // to narrow, and the status line still reports the true total.
  const RESOURCE_PAGE_SIZE = 18;
  const [showAll, setShowAll] = useState(false);
  const update = (patch: Partial<CommonsState>) =>
    onNavigate("commons", { ...state, ...patch });

  const filtered = useMemo(() => {
    const eligible = filterDirectoryResources(
      resources,
      {
        category: state.category,
        lane: state.lane,
        framework: state.framework,
        lifecycle: state.lifecycle,
        audience: state.audience,
        resourceType: state.resourceType,
        accessType: state.accessType,
      },
    );
    return searchDirectoryResources(eligible, state.query);
  }, [resources, state]);

  const distinct = (values: string[]) =>
    [...new Set(values.filter(Boolean))].sort((left, right) =>
      left.localeCompare(right),
    );
  const lanes = distinct(resources.map((resource) => resource.resourceLane));
  const frameworks = distinct(resources.flatMap((resource) => resource.frameworks));
  const lifecycleStages = distinct(
    resources.flatMap((resource) => resource.lifecycleStages),
  );
  const audiences = distinct(resources.flatMap((resource) => resource.audiences));
  const accessTypes = distinct(resources.map((resource) => resource.accessType));
  const browseCategories = useMemo(
    () => primaryBrowseCategoryCounts(resources),
    [resources],
  );
  const activeFilterCount = [
    state.category,
    state.lane !== "all" ? state.lane : "",
    state.framework,
    state.lifecycle,
    state.audience,
    state.accessType,
    state.resourceType,
  ].filter(Boolean).length;

  const reset = () =>
    update({
      query: "",
      lane: "all",
      framework: "",
      lifecycle: "",
      audience: "",
      accessType: "",
      resourceType: "",
      category: "",
      showAll: "",
    });

  return (
    <main className="commons-page">
      <div className="ca-content-container resources-directory">
        <header className="resources-directory-header">
          <div>
            <p className="eyebrow">Resources</p>
            <h1>Resources</h1>
            <p>
              Search external tools, templates, datasets, training, and
              communities. Each result shows its owner, access, status, and
              limitations.
            </p>
          </div>
          <div className="resources-directory-actions">
            <a
              href="https://github.com/BackslashBryant/control-atlas/issues/new?template=submit-resource.yml"
              rel="noopener noreferrer"
              target="_blank"
            >
              <IconPlus aria-hidden="true" size={16} />
              Submit resource
            </a>
            <a
              href="https://github.com/BackslashBryant/control-atlas/issues/new?template=report-broken-link.yml"
              rel="noopener noreferrer"
              target="_blank"
            >
              <IconFlag aria-hidden="true" size={16} />
              Report a problem
            </a>
          </div>
        </header>

        <WorkbenchControlSurface
          className="resources-control-surface"
          label="Find resources"
          targetId="resources-results"
        >
          <label className="resources-search" htmlFor="resources-query">
            <IconSearch aria-hidden="true" size={20} />
            <input
              id="resources-query"
              onChange={(event) => update({ query: event.target.value })}
              placeholder="Search external resources"
              type="search"
              value={state.query}
            />
            {state.query ? (
              <button
                aria-label="Clear resource search"
                onClick={() => update({ query: "" })}
                type="button"
              >
                <IconX aria-hidden="true" size={18} />
              </button>
            ) : null}
          </label>

          <section aria-labelledby="resource-categories">
            <h2 className="visually-hidden" id="resource-categories">
              Browse by category
            </h2>
            <div className="resource-type-chips">
              {browseCategories.map((category) => (
                <button
                  aria-pressed={state.category === category.id}
                  key={category.id}
                  onClick={() =>
                    update({
                      category:
                        state.category === category.id ? "" : category.id,
                    })
                  }
                  title={category.blurb}
                  type="button"
                >
                  {category.label} <span>{category.count}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="resources-facets">
            <button
              aria-controls="resources-filter-panel"
              aria-expanded={filtersOpen}
              className="resources-filter-toggle"
              onClick={() => setFiltersOpen((open) => !open)}
              type="button"
            >
              Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
            </button>
            <div
              aria-label="Resource filters"
              className="resources-facet-grid"
              hidden={!filtersOpen}
              id="resources-filter-panel"
              role="region"
            >
              <ResourceSelect
                id="commons-lane-filter"
                label="Owner type"
                onChange={(lane) => update({ lane })}
                options={lanes}
                value={state.lane}
                emptyValue="all"
              />
              <ResourceSelect
                label="Catalog or program"
                onChange={(framework) => update({ framework })}
                options={frameworks}
                value={state.framework}
              />
              <ResourceSelect
                label="Lifecycle"
                onChange={(lifecycle) => update({ lifecycle })}
                options={lifecycleStages}
                value={state.lifecycle}
              />
              <ResourceSelect
                label="Audience"
                onChange={(audience) => update({ audience })}
                options={audiences}
                value={state.audience}
              />
              <ResourceSelect
                label="Access / cost"
                onChange={(accessType) => update({ accessType })}
                options={accessTypes}
                value={state.accessType}
              />
            </div>
          </div>

          <div className="resources-result-status">
            <p aria-live="polite" role="status">
              Showing {filtered.length} of {resources.length} resources
            </p>
            {(state.query || activeFilterCount) ? (
              <button onClick={reset} type="button">Clear all filters</button>
            ) : null}
          </div>
        </WorkbenchControlSurface>

        {!directoryAvailable ? (
          <section
            className="empty-state"
            data-control-results
            id="resources-results"
          >
            <h2>The resource directory did not load.</h2>
            <p>
              It is a separate data file from the published records, so the rest
              of Control Atlas still works. Reload to try again.
            </p>
            <Button
              onClick={() => window.location.reload()}
              type="button"
              variant="secondary"
            >
              Reload the directory
            </Button>
          </section>
        ) : filtered.length ? (
          <section
            aria-label="Resource results"
            className="resources-result-grid"
            data-control-results
            id="resources-results"
          >
            {(showAll ? filtered : filtered.slice(0, RESOURCE_PAGE_SIZE)).map((resource) => (
              <CommonsResourceCard
                key={resource.id}
                onNavigateSearch={(query) => update({ query })}
                onSelectDetail={(id) =>
                  onNavigate("commons-detail", { id, from: "commons" })
                }
                resource={resource}
              />
            ))}
            {!showAll && filtered.length > RESOURCE_PAGE_SIZE ? (
              <div className="resources-show-more">
                <Button
                  onClick={() => setShowAll(true)}
                  type="button"
                  variant="secondary"
                >
                  Show the remaining {filtered.length - RESOURCE_PAGE_SIZE}{" "}
                  resources
                </Button>
              </div>
            ) : null}
          </section>
        ) : (
          <section
            className="empty-state"
            data-control-results
            id="resources-results"
          >
            <h2>No resources match these filters.</h2>
            <p>Clear or change the search and filters to return to the directory.</p>
            <button onClick={reset} type="button">Clear all filters</button>
          </section>
        )}
      </div>
    </main>
  );
}

function ResourceSelect(props: {
  id?: string;
  label: string;
  value: string;
  options: string[];
  emptyValue?: string;
  onChange: (value: string) => void;
}) {
  const { id, label, value, options, emptyValue = "", onChange } = props;
  return (
    <label>
      <span>{label}</span>
      <select
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value={emptyValue}>All</option>
        {options
          .filter((option) => option !== emptyValue)
          .map((option) => (
            <option key={option} value={option}>
              {option.replaceAll("_", " ")}
            </option>
          ))}
      </select>
    </label>
  );
}
