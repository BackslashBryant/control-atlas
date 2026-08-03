import { IconSearch } from "@tabler/icons-react";
import { useMemo, useState } from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import { sourceLinkFor } from "../graph/sourceLinks";
import connectionInventoryArtifact from "../../../data/generated/connection-inventory.json";
import catalogBootstrapArtifact from "../../../data/generated/catalog-bootstrap.json";

const connectionInventory = connectionInventoryArtifact.connection_inventory;
const sourceCatalogs = catalogBootstrapArtifact.catalog_bootstrap.catalogs;
import { sourceSyncLabel } from "../../shared/source-freshness.mjs";
import { Button, Panel } from "../components/lsm";
import {
  PageHeader,
  SelectField,
  SourceSummaryCard,
  SummaryCard,
  WorkbenchControlSurface,
  sourceUsageSummary,
} from "../lib/pagePrimitives";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import {
  buildSourceLayers,
  buildSourceRegister,
  type SourceLayerId,
} from "../lib/sourceRegister";
import type { ViewState } from "../lib/viewState";

const SOURCE_LAYER_TABS: Array<{
  id: SourceLayerId;
  label: string;
  description: string;
}> = [
  {
    id: "publication",
    label: "Publication register",
    description:
      "One row per publication, with the publisher it traces back to.",
  },
  {
    id: "connection",
    label: "Connection sources",
    description:
      "Published crosswalks, mappings, and cross-references between publications.",
  },
  {
    id: "ingestion",
    label: "Ingestion provenance",
    description:
      "Retrieval detail: mirrors, download endpoints, and viewer feeds.",
  },
  {
    id: "organization",
    label: "Control Atlas structure",
    description:
      "How Control Atlas groups publications into areas. Not a publisher source.",
  },
];

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
  const registerFilters = {
    query: state.query,
    provenance: state.provenance,
    eligibility: state.eligibility,
    lifecycle: state.lifecycle,
    access: state.access,
  };
  const rows = useMemo(
    () => buildSourceRegister(allSources, registerFilters),
    [
      allSources,
      state.access,
      state.eligibility,
      state.lifecycle,
      state.provenance,
      state.query,
    ],
  );
  const layers = useMemo(
    () => buildSourceLayers(allSources, sourceCatalogs, registerFilters),
    [
      allSources,
      state.access,
      state.eligibility,
      state.lifecycle,
      state.provenance,
      state.query,
    ],
  );
  const [activeLayer, setActiveLayer] = useState<SourceLayerId>("publication");
  const activeRows = layers[activeLayer];
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
          summary="Identity, coverage, and freshness for this source."
          title={selectedSource.display_name || selectedSource.name}
        />
        <SourceSummaryCard source={selectedSource} />
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
        summary="Publisher, coverage, version, and last-checked date for every publication."
        title="Sources"
      />

      <p className="sources-resource-boundary">
        Tools, templates, datasets, training, and communities are in Resources.{" "}
        <button onClick={() => onNavigate("commons")} type="button">
          Open Resources
        </button>
      </p>

      {/* Restored 2026-08-01. This disclosure was dropped from the page while
          tests/e2e/atlas-map-links.spec.mjs still required it; the statutory
          and standards links behind the whole corpus are the one thing a
          reader cannot reconstruct from the table below. */}
      <details className="canonical-source-links" id="official-source-links">
        <summary>Official source links</summary>
        <div className="disclosure-content">
          <p>
            Direct links to the primary publications behind the controls,
            mappings, and threat and defensive references in Control Atlas.
          </p>
          <ul>
            {[
              "fisma-44-usc-3551",
              "nist-sp-800-53-r5",
              "mitre-attack-enterprise",
              "mitre-d3fend",
            ].map((sourceId) => {
              const link = sourceLinkFor(sourceId);
              return (
                <li key={link.sourceId}>
                  <a
                    href={link.canonicalUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {link.displayName}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </details>

      {/* Restored 2026-08-01 from data/generated/connection-inventory.json.
          These are build counts, not completeness scores, and they are
          precomputed so this route never pulls the monolithic graph. */}
      <details className="connection-inventory" id="connection-inventory">
        <summary>Connection inventory</summary>
        <div className="disclosure-content">
          <p>
            What Control Atlas currently loads and connects. These are build
            counts, not completeness scores.
          </p>
          <p className="connection-inventory-summary">
            <strong>{connectionInventory.totalRecords.toLocaleString()}</strong>{" "}
            records across {connectionInventory.rows.length} practical
            categories with{" "}
            <strong>
              {connectionInventory.publishedLinks.toLocaleString()}
            </strong>{" "}
            published links.
          </p>
          <details className="connection-inventory-details">
            <summary>
              Per-category counts ({connectionInventory.rows.length})
            </summary>
            <ul className="connection-inventory-list">
              {connectionInventory.rows.map((category) => (
                <li className="connection-inventory-row" key={category.id}>
                  <strong>{category.label}</strong>
                  <span>
                    {category.totalRecords.toLocaleString()} records loaded
                  </span>
                  <span>
                    {category.connectedRecords.toLocaleString()} records
                    connected
                  </span>
                  <span>
                    {category.publishedLinks.toLocaleString()} published links
                  </span>
                  <span className="connection-inventory-related">
                    Connects to:{" "}
                    {category.relatedCategories.join(", ") || "none yet"}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </details>

      <WorkbenchControlSurface
        className="source-register-control-surface"
        label="Find a source"
        targetId="source-register-results"
      >
        <div className="source-register-controls">
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
        </div>
      </WorkbenchControlSurface>

      {/* W5: three layers, not one mixed table — publication identity,
          connection/mapping sources, and ingestion artifacts each get their
          own tab instead of one register that conflates all three (plus
          Control Atlas's own organizing source, kept out of the publisher
          list entirely). */}
      <div aria-label="Source register layers" className="source-view-toggle" role="tablist">
        {SOURCE_LAYER_TABS.map((tab) => (
          <button
            aria-controls="source-register-results"
            aria-selected={activeLayer === tab.id}
            className={activeLayer === tab.id ? "active" : ""}
            id={`source-layer-tab-${tab.id}`}
            key={tab.id}
            onClick={() => setActiveLayer(tab.id)}
            role="tab"
            tabIndex={activeLayer === tab.id ? 0 : -1}
            type="button"
          >
            {tab.label} <strong>{layers[tab.id].length}</strong>
          </button>
        ))}
      </div>
      <p className="support-meta" id="source-layer-description">
        {SOURCE_LAYER_TABS.find((tab) => tab.id === activeLayer)?.description}
      </p>

      <div
        aria-labelledby={`source-layer-tab-${activeLayer}`}
        id="source-register-results"
        role="tabpanel"
      >
        {activeLayer === "organization" ? (
          <div data-control-results>
            {activeRows.map((row) => (
              <SummaryCard key={row.id} title={row.publication}>
                <p>
                  Control Atlas's own organizing spine, across Cybersecurity
                  and its areas, never a publisher's declared structure. See
                  the Path rail
                  on any record for how organizing hops are badged
                  separately from the publisher's own hierarchy.
                </p>
                <p className="support-meta">Owner: {row.publisher}</p>
              </SummaryCard>
            ))}
          </div>
        ) : activeRows.length ? (
          <div
            aria-label="Control Atlas source register"
            className="source-register"
            data-control-results
            role="table"
          >
            <div className="source-register-heading" role="row">
              {activeLayer === "ingestion" ? (
                <>
                  <span role="columnheader">Feed / artifact</span>
                  <span role="columnheader">Publisher</span>
                  <span role="columnheader">Format</span>
                  <span role="columnheader">Retrieved</span>
                  <span role="columnheader">Status</span>
                </>
              ) : activeLayer === "connection" ? (
                <>
                  <span role="columnheader">Mapping source</span>
                  <span role="columnheader">Publisher</span>
                  <span role="columnheader">Relationship classes supplied</span>
                  <span role="columnheader">Version / current through</span>
                  <span role="columnheader">Status</span>
                </>
              ) : (
                <>
                  <span role="columnheader">Source / publication</span>
                  <span role="columnheader">Publisher</span>
                  <span role="columnheader">Coverage</span>
                  <span role="columnheader">Version / current through</span>
                  <span role="columnheader">Status</span>
                </>
              )}
            </div>
            {activeRows.map((row) => (
              <div className="source-register-row" key={row.id} role="row">
                {activeLayer === "ingestion" ? (
                  <>
                    <strong role="cell">
                      <button
                        onClick={() => onNavigate("sources", { ...state, source: row.id })}
                        type="button"
                      >
                        {row.id}
                      </button>
                      <small>{row.publication}</small>
                    </strong>
                    <span role="cell">{row.publisher}</span>
                    <span role="cell">{row.artifactType}</span>
                    <span role="cell">
                      {row.currentThrough}
                      <small>{row.rawCoverageKeys}</small>
                    </span>
                    <span role="cell">{displayNameFor("lifecycle_status", row.status)}</span>
                  </>
                ) : (
                  <>
                    <strong role="cell">
                      <button
                        onClick={() => onNavigate("sources", { ...state, source: row.id })}
                        type="button"
                      >
                        {row.publication}
                      </button>
                    </strong>
                    <span role="cell">{row.publisher}</span>
                    <span role="cell">
                      {row.coverage}
                      {activeLayer === "publication" && row.recordsRepresented != null ? (
                        <small>{row.recordsRepresented.toLocaleString()} records represented</small>
                      ) : null}
                    </span>
                    <span role="cell">{row.version}<small>{row.currentThrough}</small></span>
                    <span role="cell">{displayNameFor("lifecycle_status", row.status)}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <section className="empty-state" data-control-results>
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
      </div>
    </Panel>
  );
}
