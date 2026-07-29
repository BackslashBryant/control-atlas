import { IconExternalLink, IconSearch } from "@tabler/icons-react";
import { useMemo } from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import { sourceSyncLabel } from "../../shared/source-freshness.mjs";
import { Button, ButtonLink, Panel } from "../components/lsm";
import {
  PageHeader,
  SelectField,
  SourceSummaryCard,
  SummaryCard,
  sourceUsageSummary,
} from "../lib/pagePrimitives";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import { buildSourceRegister } from "../lib/sourceRegister";
import type { ViewState } from "../lib/viewState";

export function SourcesPage(props: {
  bundle: RuntimeBundle;
  state: Extract<ViewState, { view: "sources" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  const { bundle, state, onNavigate } = props;
  const allSources = bundle.runtime.dataset.sources;
  const selectedSource = state.source
    ? bundle.runtime.getSource(state.source)
    : null;
  const rows = useMemo(
    () =>
      buildSourceRegister(allSources, {
        query: state.query,
        provenance: state.provenance,
        eligibility: state.eligibility,
        lifecycle: state.lifecycle,
        access: state.access,
      }),
    [
      allSources,
      state.access,
      state.eligibility,
      state.lifecycle,
      state.provenance,
      state.query,
    ],
  );
  const distinct = (key: string) =>
    [...new Set(allSources.map((source: any) => source[key]).filter(Boolean))] as string[];

  if (selectedSource) {
    return (
      <Panel className="sources-page">
        <button
          className="link-action"
          onClick={() => onNavigate("sources", { ...state, source: "" })}
          type="button"
        >
          ← Back to sources
        </button>
        <PageHeader
          eyebrow="Source detail"
          summary="How this source is identified, retrieved, covered, and checked for freshness in Control Atlas."
          title={selectedSource.display_name || selectedSource.name}
        />
        <SourceSummaryCard source={selectedSource} />
        <div className="card-actions">
          <ButtonLink
            href={selectedSource.artifact_url}
            rel="noopener noreferrer"
            target="_blank"
            variant="primary"
          >
            Open official source
            <IconExternalLink aria-hidden="true" size={16} />
          </ButtonLink>
        </div>
        <SummaryCard title="How Control Atlas uses it">
          <p>{sourceUsageSummary(selectedSource)}.</p>
        </SummaryCard>
        <dl className="source-detail-grid">
          <div><dt>Publisher</dt><dd>{selectedSource.owner || "Not recorded"}</dd></div>
          <div><dt>Version</dt><dd>{selectedSource.version || "Not recorded"}</dd></div>
          <div><dt>Current through</dt><dd>{selectedSource.last_checked || selectedSource.retrieved_at || "Not recorded"}</dd></div>
          <div><dt>Lifecycle</dt><dd>{displayNameFor("lifecycle_status", selectedSource.lifecycle_status)}</dd></div>
          <div><dt>Retrieval</dt><dd>{sourceSyncLabel(selectedSource.sync_model)}</dd></div>
          <div><dt>Parser</dt><dd>{selectedSource.metadata?.parser || "Not applicable or not recorded"}</dd></div>
        </dl>
      </Panel>
    );
  }

  return (
    <Panel className="sources-page">
      <PageHeader
        eyebrow="Sources"
        summary="See each publication’s publisher, coverage, version, status, and the date Control Atlas last checked it."
        title="Sources"
      />

      <p className="sources-resource-boundary">
        Tools, templates, datasets, training, and communities live in Build → Resources.{" "}
        <button onClick={() => onNavigate("commons")} type="button">
          Open Resources
        </button>
      </p>

      <section aria-label="Source register controls" className="source-register-controls">
        <label className="field source-register-search" htmlFor="source-search">
          <span>Search sources</span>
          <div className="search-input">
            <IconSearch aria-hidden="true" size={18} stroke={1.8} />
            <input
              id="source-search"
              onChange={(event) =>
                onNavigate("sources", { ...state, query: event.target.value })
              }
              placeholder="Publication, publisher, or catalog"
              type="search"
              value={state.query}
            />
          </div>
        </label>
        <div className="source-register-filters">
          <SelectField
            emptyLabel="All source types"
            label="Source type"
            onChange={(provenance) => onNavigate("sources", { ...state, provenance })}
            options={distinct("provenance_class").map((value) => ({
              value,
              label: displayNameFor("provenance_class", value),
            }))}
            value={state.provenance}
          />
          <SelectField
            emptyLabel="All statuses"
            label="Status"
            onChange={(lifecycle) => onNavigate("sources", { ...state, lifecycle })}
            options={distinct("lifecycle_status").map((value) => ({
              value,
              label: displayNameFor("lifecycle_status", value),
            }))}
            value={state.lifecycle}
          />
          <SelectField
            emptyLabel="All map states"
            label="Map inclusion"
            onChange={(eligibility) => onNavigate("sources", { ...state, eligibility })}
            options={distinct("eligibility_status").map((value) => ({
              value,
              label: displayNameFor("eligibility_status", value),
            }))}
            value={state.eligibility}
          />
          <SelectField
            emptyLabel="All access levels"
            label="Access"
            onChange={(access) => onNavigate("sources", { ...state, access })}
            options={distinct("access_status").map((value) => ({
              value,
              label: displayNameFor("access_status", value),
            }))}
            value={state.access}
          />
        </div>
        <p aria-live="polite" className="source-register-total">
          {rows.length} of {allSources.length} sources
        </p>
      </section>

      {rows.length ? (
        <div className="source-register" role="table" aria-label="Control Atlas source register">
          <div className="source-register-heading" role="row">
            <span role="columnheader">Source / publication</span>
            <span role="columnheader">Publisher</span>
            <span role="columnheader">Coverage</span>
            <span role="columnheader">Version / current through</span>
            <span role="columnheader">Status</span>
          </div>
          {rows.map((row) => (
            <div
              className="source-register-row"
              key={row.id}
              role="row"
            >
              <strong role="cell">
                <button
                  onClick={() => onNavigate("sources", { ...state, source: row.id })}
                  type="button"
                >
                  {row.publication}
                </button>
              </strong>
              <span role="cell">{row.publisher}</span>
              <span role="cell">{row.coverage}</span>
              <span role="cell">{row.version}<small>{row.currentThrough}</small></span>
              <span role="cell">{displayNameFor("lifecycle_status", row.status)}</span>
            </div>
          ))}
        </div>
      ) : (
        <section className="empty-state">
          <h2>No sources match these filters.</h2>
          <p>Clear the search or status filters to return to the full register.</p>
          <Button
            onClick={() =>
              onNavigate("sources", {
                query: "",
                provenance: "",
                eligibility: "",
                lifecycle: "",
                access: "",
              })
            }
            type="button"
            variant="primary"
          >
            Clear source filters
          </Button>
        </section>
      )}
    </Panel>
  );
}
