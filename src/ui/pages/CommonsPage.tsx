import {
  IconFlag,
  IconPlus,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { useMemo } from "react";

import { BuildLocalNav } from "../components/BuildLocalNav";
import { CommonsResourceCard } from "../components/CommonsResourceCard";
import type { CommonsResource } from "../lib/commonsTypes";
import {
  filterDirectoryResources,
  searchDirectoryResources,
} from "../lib/resourcesDirectory.mjs";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";

type CommonsState = Extract<ViewState, { view: "commons" }>;

const PRIMARY_TYPES = [
  { value: "tool", label: "Tools" },
  { value: "template", label: "Templates" },
  { value: "dataset", label: "Datasets" },
  { value: "training", label: "Training" },
  { value: "community_forum", label: "Communities" },
] as const;

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
  const resources = (bundle?.commonsDataset?.resources || []) as CommonsResource[];
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
  const activeFilterCount = [
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
        <BuildLocalNav active="resources" onNavigate={onNavigate} />
        <header className="resources-directory-header">
          <div>
            <p className="eyebrow">Build → Resources</p>
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

        <div aria-label="Primary resource types" className="resource-type-chips">
          {PRIMARY_TYPES.map((type) => {
            const count = resources.filter(
              (resource) => resource.resourceType === type.value,
            ).length;
            return (
              <button
                aria-pressed={state.resourceType === type.value}
                key={type.value}
                onClick={() =>
                  update({
                    resourceType:
                      state.resourceType === type.value ? "" : type.value,
                  })
                }
                type="button"
              >
                {type.label} <span>{count}</span>
              </button>
            );
          })}
        </div>

        <details className="resources-facets">
          <summary>
            More filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
          </summary>
          <div className="resources-facet-grid">
            <ResourceSelect
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
        </details>

        <div className="resources-result-status">
          <p aria-live="polite">
            {filtered.length} of {resources.length} resources
          </p>
          {(state.query || activeFilterCount) ? (
            <button onClick={reset} type="button">Clear all filters</button>
          ) : null}
        </div>

        {filtered.length ? (
          <section aria-label="Resource results" className="resources-result-grid">
            {filtered.map((resource) => (
              <CommonsResourceCard
                key={resource.id}
                onNavigateSearch={(query) => update({ query })}
                onSelectDetail={(id) =>
                  onNavigate("commons-detail", { id, from: "commons" })
                }
                resource={resource}
              />
            ))}
          </section>
        ) : (
          <section className="empty-state">
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
  label: string;
  value: string;
  options: string[];
  emptyValue?: string;
  onChange: (value: string) => void;
}) {
  const { label, value, options, emptyValue = "", onChange } = props;
  return (
    <label>
      <span>{label}</span>
      <select onChange={(event) => onChange(event.target.value)} value={value}>
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
