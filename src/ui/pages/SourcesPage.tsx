import { IconSearch } from "@tabler/icons-react";
import type { KeyboardEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import { SITE_COPY } from "../../shared/site-copy.mjs";
import { sourceLinkFor } from "../graph/sourceLinks";
import connectionInventoryArtifact from "../../../data/generated/connection-inventory.json";
import catalogBootstrapArtifact from "../../../data/generated/catalog-bootstrap.json";

const connectionInventory = connectionInventoryArtifact.connection_inventory;
const sourceCatalogs = catalogBootstrapArtifact.catalog_bootstrap.catalogs;
import { Button, Panel } from "../components/lsm";
import { AppLink } from "../components/AppLink";
import {
  PageHeader,
  SelectField,
  SourceSummaryCard,
  SummaryCard,
  WorkbenchControlSurface,
  copyText,
  sourceUsageSummary,
} from "../lib/pagePrimitives";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import {
  buildSourceLayers,
  sourceLayerEntityLabel,
  sourceLayerOptions,
  type SourceField,
  type SourceLayerId,
  type SourceRegisterRow,
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
    label: "Source material",
    description:
      "Files, feeds, and reference pages used to retrieve or verify publisher material.",
  },
  {
    id: "organization",
    label: "Control Atlas structure",
    description:
      "How Control Atlas connects authority branches and groups publications into areas.",
  },
];

const SOURCE_PAGE_SIZE = 25;

function SourceRegisterCell(props: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div className={`ca-source-cell ${props.className || ""}`.trim()} role="cell">
      <span className="ca-source-cell__label">{props.label}</span>
      <div className="ca-source-cell__value">{props.children}</div>
    </div>
  );
}

function SourceFieldValue<T>(props: {
  field: SourceField<T>;
  format?: (value: T) => ReactNode;
  missingLabel: string;
  notApplicableLabel: string;
}) {
  const { field } = props;
  if (field.value != null) {
    return (
      <span className={`ca-source-field ca-source-field--${field.state}`}>
        <span>{props.format ? props.format(field.value) : String(field.value)}</span>
        {field.state === "derived" ? (
          <small className="ca-source-field__basis">From parent publication</small>
        ) : null}
        <span className="visually-hidden">. {field.reason}</span>
      </span>
    );
  }
  const label =
    field.state === "not_applicable"
      ? props.notApplicableLabel
      : props.missingLabel;
  return (
    <span className={`ca-source-field ca-source-field--${field.state}`}>
      <span>{label}</span>
      <span className="visually-hidden">. {field.reason}</span>
    </span>
  );
}

function CopyStableSourceId(props: { id: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="ca-copy-wrap ca-source-id">
      <code>{props.id}</code>
      <button
        aria-label={`Copy source ID ${props.id}`}
        className={`ca-copy-btn ca-source-id__copy${copied ? " ca-copy-btn--copied" : ""}`}
        onClick={() => {
          void copyText(props.id).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
          });
        }}
        type="button"
      >
        {copied ? "Copied" : "Copy ID"}
      </button>
      <span aria-live="polite" className="visually-hidden">
        {copied ? `Source ID ${props.id} copied` : ""}
      </span>
    </span>
  );
}

export function SourcesPage(props: {
  bundle: RuntimeBundle;
  state: Extract<ViewState, { view: "sources" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  const { bundle, state, onNavigate } = props;
  const [queryDraft, setQueryDraft] = useState(state.query);
  const allSources = bundle.runtime.dataset.sources;
  const selectedSource = state.source
    ? bundle.runtime.getSource(state.source)
    : null;
  const registerFilters = {
    query: state.query,
    publisher: state.publisher,
    provenance: state.provenance,
    eligibility: state.eligibility,
    lifecycle: state.lifecycle,
    access: state.access,
  };
  const unfilteredLayers = useMemo(
    () => buildSourceLayers(allSources, sourceCatalogs),
    [allSources],
  );
  const layers = useMemo(
    () => buildSourceLayers(allSources, sourceCatalogs, registerFilters),
    [
      allSources,
      state.access,
      state.eligibility,
      state.lifecycle,
      state.publisher,
      state.provenance,
      state.query,
    ],
  );
  const activeLayer = state.layer as SourceLayerId;
  const activeRows = layers[activeLayer];
  const unfilteredActiveRows = unfilteredLayers[activeLayer];
  const options = useMemo(
    () => sourceLayerOptions(unfilteredActiveRows),
    [unfilteredActiveRows],
  );
  const publisherOptions = options.publishers.map((value) => ({ value, label: value }));
  const statusOptions = options.lifecycleStatuses
    .map((value) => ({ value, label: displayNameFor("lifecycle_status", value) }))
    .sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: "base" }));
  const [visibleLimit, setVisibleLimit] = useState(SOURCE_PAGE_SIZE);
  const firstNewRowRef = useRef<HTMLDivElement | null>(null);
  const visibleRows = activeRows.slice(0, visibleLimit);
  const entityLabel = sourceLayerEntityLabel(activeLayer, activeRows.length);
  const totalEntityLabel = sourceLayerEntityLabel(
    activeLayer,
    unfilteredActiveRows.length,
  );

  useEffect(() => setQueryDraft(state.query), [state.query]);
  useEffect(() => {
    const publisherIsUnavailable =
      Boolean(state.publisher) && !options.publishers.includes(state.publisher);
    const lifecycleIsUnavailable =
      Boolean(state.lifecycle) &&
      !options.lifecycleStatuses.includes(state.lifecycle);
    if (!publisherIsUnavailable && !lifecycleIsUnavailable) return;
    onNavigate("sources", {
      ...state,
      publisher: publisherIsUnavailable ? "" : state.publisher,
      lifecycle: lifecycleIsUnavailable ? "" : state.lifecycle,
    });
  }, [onNavigate, options, state]);
  useEffect(() => setVisibleLimit(SOURCE_PAGE_SIZE), [
    activeLayer,
    state.access,
    state.eligibility,
    state.lifecycle,
    state.publisher,
    state.provenance,
    state.query,
  ]);

  const selectLayer = (layer: SourceLayerId) => {
    const targetOptions = sourceLayerOptions(unfilteredLayers[layer]);
    onNavigate("sources", {
      ...state,
      layer,
      publisher: targetOptions.publishers.includes(state.publisher)
        ? state.publisher
        : "",
      lifecycle: targetOptions.lifecycleStatuses.includes(state.lifecycle)
        ? state.lifecycle
        : "",
      source: "",
    });
  };

  const moveLayerFocus = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    const lastIndex = SOURCE_LAYER_TABS.length - 1;
    const nextIndex =
      event.key === "ArrowRight"
        ? currentIndex === lastIndex ? 0 : currentIndex + 1
        : event.key === "ArrowLeft"
          ? currentIndex === 0 ? lastIndex : currentIndex - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? lastIndex
              : null;
    if (nextIndex == null) return;
    event.preventDefault();
    const nextLayer = SOURCE_LAYER_TABS[nextIndex].id;
    selectLayer(nextLayer);
    document.getElementById(`source-layer-tab-${nextLayer}`)?.focus();
  };

  if (selectedSource) {
    return (
      <Panel className="sources-page" data-visual-identity="provenance-ledger">
        <AppLink
          className="link-action"
          onNavigate={onNavigate}
          patch={{ ...state, source: "" }}
          view="sources"
        >
          ← Back to sources
        </AppLink>
        <PageHeader
          eyebrow="Source detail"
          primary
          summary="Details for this source."
          title={selectedSource.display_name || selectedSource.name}
        />
        <SourceSummaryCard source={selectedSource} />
        <SummaryCard title="How Control Atlas uses it">
          <p>{sourceUsageSummary(selectedSource)}.</p>
        </SummaryCard>
        <dl className="source-detail-grid">
          <div><dt>Publisher</dt><dd>{selectedSource.owner || "Not recorded"}</dd></div>
          <div><dt>Publisher version</dt><dd>{selectedSource.version || "Not recorded"}</dd></div>
          <div><dt>Retrieved</dt><dd>{selectedSource.retrieved_at || "Not recorded"}</dd></div>
          <div><dt>Last verified</dt><dd>{selectedSource.last_checked || "Not recorded"}</dd></div>
          <div><dt>Lifecycle</dt><dd>{displayNameFor("lifecycle_status", selectedSource.lifecycle_status)}</dd></div>
          {selectedSource.source_role && selectedSource.source_role !== "publication" ? (
            <div><dt>Update method</dt><dd>{selectedSource.retrieval_method ? displayNameFor("retrieval_method", selectedSource.retrieval_method) : "Not recorded"}</dd></div>
          ) : null}
          {typeof selectedSource.record_count === "number" ? (
            <div><dt>Records</dt><dd>{selectedSource.record_count.toLocaleString()}</dd></div>
          ) : null}
          {typeof selectedSource.relationship_count === "number" ? (
            <div><dt>Relationships</dt><dd>{selectedSource.relationship_count.toLocaleString()}</dd></div>
          ) : null}
          {selectedSource.catalog_browse_url || selectedSource.artifact_url ? (
            <div>
              <dt>Official publication</dt>
              <dd>
                <a href={selectedSource.catalog_browse_url || selectedSource.artifact_url} rel="noopener noreferrer" target="_blank">
                  {selectedSource.catalog_browse_url || selectedSource.artifact_url}
                </a>
              </dd>
            </div>
          ) : null}
          {selectedSource.artifact_url &&
          selectedSource.catalog_browse_url &&
          selectedSource.artifact_url !== selectedSource.catalog_browse_url ? (
            <div>
              <dt>Retrieved artifact</dt>
              <dd>
                <a href={selectedSource.artifact_url} rel="noopener noreferrer" target="_blank">
                  {selectedSource.artifact_url}
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
      </Panel>
    );
  }

  return (
    <Panel className="sources-page" data-visual-identity="provenance-ledger" overflow="visible">
      <PageHeader
        eyebrow="Sources"
        primary
        summary={SITE_COPY.routes.sources.purpose}
        title={SITE_COPY.routes.sources.title}
      />

      {/* Publication identity, mapping sources, retrieved source files, and
          Control Atlas's organizing structure remain separate views. */}
      <div aria-label="Source register layers" className="source-view-toggle" role="tablist">
        {SOURCE_LAYER_TABS.map((tab, index) => (
          <button
            aria-controls="source-register-results"
            aria-selected={activeLayer === tab.id}
            className={activeLayer === tab.id ? "active" : ""}
            id={`source-layer-tab-${tab.id}`}
            key={tab.id}
            onClick={() => selectLayer(tab.id)}
            onKeyDown={(event) => moveLayerFocus(event, index)}
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

      <WorkbenchControlSurface
        className="source-register-control-surface"
        label={`Find ${sourceLayerEntityLabel(activeLayer, 2)}`}
        targetId="source-register-results"
      >
        <div className="source-register-controls">
          <form
            className="field source-register-search"
            onSubmit={(event) => {
              event.preventDefault();
              const query = queryDraft.trim();
              if (query !== state.query) onNavigate("sources", { ...state, query });
            }}
            role="search"
          >
            <label htmlFor="source-search">
              <span>Search {sourceLayerEntityLabel(activeLayer, 2)}</span>
              <div className="search-input">
                <IconSearch aria-hidden="true" size={18} stroke={1.8} />
                <input
                  id="source-search"
                  onChange={(event) => setQueryDraft(event.target.value)}
                  placeholder="Name, publisher, ID, or catalog"
                  type="search"
                  value={queryDraft}
                />
              </div>
            </label>
            <Button type="submit" variant="secondary">Search</Button>
          </form>
          <div className="source-register-filters">
            {publisherOptions.length >= 2 ? (
              <SelectField
                emptyLabel="All publishers"
                label="Publisher"
                onChange={(publisher) => onNavigate("sources", { ...state, publisher })}
                options={publisherOptions}
                value={state.publisher}
              />
            ) : null}
            {statusOptions.length >= 2 ? (
              <SelectField
                emptyLabel="All statuses"
                label="Status"
                onChange={(lifecycle) => onNavigate("sources", { ...state, lifecycle })}
                options={statusOptions}
                value={state.lifecycle}
              />
            ) : null}
          </div>
          <p aria-live="polite" className="source-register-total">
            {activeRows.length} of {unfilteredActiveRows.length} {totalEntityLabel}
          </p>
        </div>
      </WorkbenchControlSurface>

      <div
        aria-labelledby={`source-layer-tab-${activeLayer}`}
        id="source-register-results"
        role="tabpanel"
      >
        <div className="source-results-orientation">
          <strong>{SOURCE_LAYER_TABS.find((tab) => tab.id === activeLayer)?.label}</strong>
          <span aria-live="polite">
            Showing {Math.min(visibleRows.length, activeRows.length)} of {activeRows.length} {entityLabel}
          </span>
        </div>
        {activeLayer === "organization" ? (
          <div data-control-results>
            {visibleRows.map((row) => (
              <SummaryCard key={row.id} title={row.displayTitle}>
                <p>
                  Control Atlas's organizing spine connects federal authority,
                  Cybersecurity, and its areas. See the Path rail on any record
                  for how Control Atlas structure and publisher hierarchy are
                  identified.
                </p>
                <p className="support-meta">Owner: {row.publisher.value || "Owner not recorded"}</p>
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
                  <span role="columnheader">Source material</span>
                  <span role="columnheader">Publisher</span>
                  <span role="columnheader">Format</span>
                  <span role="columnheader">Retrieved</span>
                  <span role="columnheader">Imported records</span>
                  <span role="columnheader">Status</span>
                </>
              ) : activeLayer === "connection" ? (
                <>
                  <span role="columnheader">Mapping source</span>
                  <span role="columnheader">Publisher</span>
                  <span role="columnheader">Imported records</span>
                  <span role="columnheader">Published links</span>
                  <span role="columnheader">Retrieved</span>
                  <span role="columnheader">Status</span>
                </>
              ) : (
                <>
                  <span role="columnheader">Publication</span>
                  <span role="columnheader">Publisher</span>
                  <span role="columnheader">Catalog coverage</span>
                  <span role="columnheader">Publisher version</span>
                  <span role="columnheader">Last verified</span>
                  <span role="columnheader">Status</span>
                </>
              )}
            </div>
            {visibleRows.map((row, index) => (
              <div
                className="source-register-row"
                key={row.id}
                ref={index === Math.max(0, visibleLimit - SOURCE_PAGE_SIZE) ? firstNewRowRef : undefined}
                role="row"
                tabIndex={-1}
              >
                {activeLayer === "ingestion" ? (
                  <>
                    <SourceRegisterCell className="ca-source-cell--identity" label="Source material">
                      <strong>
                        <AppLink onNavigate={onNavigate} patch={{ ...state, source: row.id }} view="sources">
                          {row.displayTitle}
                        </AppLink>
                      </strong>
                      <CopyStableSourceId id={row.id} />
                    </SourceRegisterCell>
                    <SourceRegisterCell label="Publisher">
                      <SourceFieldValue field={row.publisher} missingLabel="Publisher not recorded" notApplicableLabel="Not applicable" />
                    </SourceRegisterCell>
                    <SourceRegisterCell label="Format">
                      <SourceFieldValue field={row.format} format={(value) => displayNameFor("format", value)} missingLabel="Format not recorded" notApplicableLabel="Reference page" />
                    </SourceRegisterCell>
                    <SourceRegisterCell label="Retrieved">
                      <SourceFieldValue field={row.retrievedAt} missingLabel="Retrieval date not recorded" notApplicableLabel="Not applicable" />
                    </SourceRegisterCell>
                    <SourceRegisterCell label="Imported records">
                      <SourceFieldValue field={row.recordCount} format={(value) => value.toLocaleString()} missingLabel="Record count not recorded" notApplicableLabel="Not applicable" />
                    </SourceRegisterCell>
                    <SourceRegisterCell label="Status">
                      <SourceFieldValue field={row.lifecycle} format={(value) => displayNameFor("lifecycle_status", value)} missingLabel="Status not recorded" notApplicableLabel="Not applicable" />
                    </SourceRegisterCell>
                  </>
                ) : activeLayer === "connection" ? (
                  <>
                    <SourceRegisterCell className="ca-source-cell--identity" label="Mapping source">
                      <strong>
                        <AppLink onNavigate={onNavigate} patch={{ ...state, source: row.id }} view="sources">
                          {row.displayTitle}
                        </AppLink>
                      </strong>
                      <CopyStableSourceId id={row.id} />
                    </SourceRegisterCell>
                    <SourceRegisterCell label="Publisher">
                      <SourceFieldValue field={row.publisher} missingLabel="Publisher not recorded" notApplicableLabel="Not applicable" />
                    </SourceRegisterCell>
                    <SourceRegisterCell label="Imported records">
                      <SourceFieldValue field={row.recordCount} format={(value) => value.toLocaleString()} missingLabel="Record count not recorded" notApplicableLabel="Not applicable" />
                    </SourceRegisterCell>
                    <SourceRegisterCell label="Published links">
                      <SourceFieldValue field={row.relationshipCount} format={(value) => value.toLocaleString()} missingLabel="Link count not recorded" notApplicableLabel="Not applicable" />
                    </SourceRegisterCell>
                    <SourceRegisterCell label="Retrieved">
                      <SourceFieldValue field={row.retrievedAt} missingLabel="Retrieval date not recorded" notApplicableLabel="Not applicable" />
                    </SourceRegisterCell>
                    <SourceRegisterCell label="Status">
                      <SourceFieldValue field={row.lifecycle} format={(value) => displayNameFor("lifecycle_status", value)} missingLabel="Status not recorded" notApplicableLabel="Not applicable" />
                    </SourceRegisterCell>
                  </>
                ) : (
                  <>
                    <SourceRegisterCell className="ca-source-cell--identity" label="Publication">
                      <strong>
                        <AppLink onNavigate={onNavigate} patch={{ ...state, source: row.id }} view="sources">
                          {row.displayTitle}
                        </AppLink>
                      </strong>
                      <CopyStableSourceId id={row.id} />
                    </SourceRegisterCell>
                    <SourceRegisterCell label="Publisher">
                      <SourceFieldValue field={row.publisher} missingLabel="Publisher not recorded" notApplicableLabel="Not applicable" />
                    </SourceRegisterCell>
                    <SourceRegisterCell label="Catalog coverage">
                      <SourceFieldValue field={row.coverage} format={(value) => value.join(", ")} missingLabel="Coverage not recorded" notApplicableLabel="No catalog profile" />
                    </SourceRegisterCell>
                    <SourceRegisterCell label="Publisher version">
                      <SourceFieldValue field={row.version} missingLabel="Version not recorded" notApplicableLabel="Not applicable" />
                    </SourceRegisterCell>
                    <SourceRegisterCell label="Last verified">
                      <SourceFieldValue field={row.verifiedAt} missingLabel="Verification date not recorded" notApplicableLabel="Not applicable" />
                    </SourceRegisterCell>
                    <SourceRegisterCell label="Status">
                      <SourceFieldValue field={row.lifecycle} format={(value) => displayNameFor("lifecycle_status", value)} missingLabel="Status not recorded" notApplicableLabel="Not applicable" />
                    </SourceRegisterCell>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <section className="empty-state" data-control-results>
            <h2>No {sourceLayerEntityLabel(activeLayer, 2)} match these filters.</h2>
            <p>
              Clear the search, publisher, or status filters to return to the full {sourceLayerEntityLabel(activeLayer, 1)} register.
            </p>
            <Button
              onClick={() =>
                onNavigate("sources", {
                  layer: activeLayer,
                  query: "",
                  publisher: "",
                  provenance: "",
                  eligibility: "",
                  lifecycle: "",
                  access: "",
                })
              }
              type="button"
              variant="primary"
            >
              Clear {sourceLayerEntityLabel(activeLayer, 1)} filters
            </Button>
          </section>
        )}
        {activeRows.length > visibleRows.length ? (
          <div className="source-register-more">
            <Button
              onClick={() => {
                setVisibleLimit((current) => Math.min(current + SOURCE_PAGE_SIZE, activeRows.length));
                window.requestAnimationFrame(() => firstNewRowRef.current?.focus());
              }}
              type="button"
              variant="secondary"
            >
              Show {Math.min(SOURCE_PAGE_SIZE, activeRows.length - visibleRows.length)} more {entityLabel}
            </Button>
          </div>
        ) : null}
      </div>

      <p className="sources-resource-boundary">
        Looking for tools or training?{" "}
        <AppLink onNavigate={onNavigate} view="commons">
          Browse Resources
        </AppLink>
      </p>

      <section aria-labelledby="source-supporting-evidence" className="source-supporting-evidence">
        <h2 id="source-supporting-evidence">Supporting source evidence</h2>
        <details className="canonical-source-links" id="official-source-links">
          <summary>Official source links</summary>
          <div className="disclosure-content">
            <p>Direct links to selected primary publications.</p>
            <ul>
              {["fisma-44-usc-3551", "nist-sp-800-53-r5", "mitre-attack-enterprise", "mitre-d3fend"].map((sourceId) => {
                const link = sourceLinkFor(sourceId);
                return (
                  <li key={link.sourceId}>
                    <a href={link.canonicalUrl} rel="noopener noreferrer" target="_blank">
                      {link.displayName}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </details>
        <details className="connection-inventory" id="connection-inventory">
          <summary>Connection inventory</summary>
          <div className="disclosure-content">
            <p>What Control Atlas currently loads and connects. These are build counts, not completeness scores.</p>
            <p className="connection-inventory-summary">
              <strong>{connectionInventory.totalRecords.toLocaleString()}</strong> records across {connectionInventory.rows.length} practical categories with <strong>{connectionInventory.publishedLinks.toLocaleString()}</strong> published links.
            </p>
            <details className="connection-inventory-details">
              <summary>Per-category counts ({connectionInventory.rows.length})</summary>
              <ul className="connection-inventory-list">
                {connectionInventory.rows.map((category) => (
                  <li className="connection-inventory-row" key={category.id}>
                    <strong>{category.label}</strong>
                    <span>{category.totalRecords.toLocaleString()} records loaded</span>
                    <span>{category.connectedRecords.toLocaleString()} records connected</span>
                    <span>{category.publishedLinks.toLocaleString()} published links</span>
                    <span className="connection-inventory-related">Connects to: {category.relatedCategories.join(", ") || "none yet"}</span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </details>
      </section>
    </Panel>
  );
}
