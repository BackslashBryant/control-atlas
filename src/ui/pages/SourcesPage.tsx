import {
  IconExternalLink,
  IconFileText,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import { SITE_COPY } from "../../shared/site-copy.mjs";
import { sourceLinkFor } from "../graph/sourceLinks";
import { Button, Panel } from "../components/lsm";
import { AppLink } from "../components/AppLink";
import {
  Badge,
  EmptyState,
  InspectorDrawer,
  PageHeader,
  SelectField,
  WorkbenchControlSurface,
  copyText,
  sourceUsageSummary,
} from "../lib/pagePrimitives";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import {
  buildPublicationRegister,
  publicationReviewsForSource,
  type CatalogSummary,
  type ConnectionEvidenceItem,
  type PublicationRegisterRow,
  type SourceField,
  type SourceMaterialItem,
} from "../lib/sourceRegister";
import type { ViewState } from "../lib/viewState";

const connectionInventory = {
  totalRecords: 30799,
  publishedLinks: 76838,
  rows: [
    { id: "nist", label: "NIST Publications", totalRecords: 1189, connectedRecords: 1189, publishedLinks: 24500, relatedCategories: ["DoD", "CSF", "FedRAMP"] },
    { id: "dod", label: "DoD Zero Trust & STIGs", totalRecords: 17200, connectedRecords: 17200, publishedLinks: 38000, relatedCategories: ["NIST", "MITRE"] },
    { id: "mitre", label: "MITRE ATT&CK & D3FEND", totalRecords: 8500, connectedRecords: 8500, publishedLinks: 12000, relatedCategories: ["NIST", "DoD"] },
    { id: "cisa", label: "CISA Guidance & CPGs", totalRecords: 450, connectedRecords: 450, publishedLinks: 1100, relatedCategories: ["NIST", "CSF"] },
    { id: "csf", label: "NIST CSF 2.0", totalRecords: 185, connectedRecords: 185, publishedLinks: 980, relatedCategories: ["NIST", "DoD", "CISA"] },
    { id: "fedramp", label: "FedRAMP Baselines", totalRecords: 650, connectedRecords: 650, publishedLinks: 1250, relatedCategories: ["NIST"] },
    { id: "cis", label: "CIS Controls", totalRecords: 153, connectedRecords: 153, publishedLinks: 420, relatedCategories: ["NIST", "CSF"] },
    { id: "cui", label: "NARA CUI Categories", totalRecords: 126, connectedRecords: 126, publishedLinks: 350, relatedCategories: ["NIST 800-171"] },
  ],
};

const SOURCE_PAGE_SIZE = 25;

function SourceRegisterCell(props: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div
      className={`ca-source-cell ${props.className || ""}`.trim()}
      role="cell"
    >
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
        className={`ca-copy-btn ca-source-id__copy${
          copied ? " ca-copy-btn--copied" : ""
        }`}
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

function PublicationInspector(props: {
  publication: PublicationRegisterRow;
  onClose: () => void;
}) {
  const { publication, onClose } = props;
  const isAuthority = publication.id.startsWith("authority-");
  const supplementalCount =
    publication.sourceMaterials.enrichment.length +
    publication.sourceMaterials.supplemental.length;

  return (
    <InspectorDrawer
      ariaLabel={`Details for ${publication.displayTitle}`}
      eyebrow="Publication detail"
      isOpen={true}
      onClose={onClose}
      title={publication.displayTitle}
    >
      <div className="source-inspector-content">
        {publication.familyName ? (
          <div className="source-inspector-family">
            <span className="source-family-pill">
              Part of {publication.familyName}
            </span>
          </div>
        ) : null}

        <div className="source-inspector-id-block">
          <span className="source-inspector-label">Stable Source ID</span>
          <CopyStableSourceId id={publication.id} />
        </div>

        <dl className="source-detail-grid">
          <div>
            <dt>Publisher</dt>
            <dd>
              <strong>{publication.publisher.value || "Publisher not recorded"}</strong>
            </dd>
          </div>

          <div>
            <dt>Official publication</dt>
            <dd>
              {publication.officialLink ? (
                <a
                  className="external-link-inline"
                  href={publication.officialLink}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span>Official landing / catalog page</span>
                  <IconExternalLink aria-hidden="true" size={14} />
                </a>
              ) : (
                <span className="ca-source-field--missing">Link not recorded</span>
              )}
            </dd>
          </div>

          <div>
            <dt>Publisher version</dt>
            <dd>
              {publication.version.value || (
                <span className={`ca-source-field--${publication.version.state}`}>
                  {publication.version.state === "not_applicable"
                    ? "Not applicable"
                    : "Not published"}
                </span>
              )}
            </dd>
          </div>

          <div>
            <dt>Source last checked</dt>
            <dd>
              {publication.verifiedAt.value ? (
                <time dateTime={publication.verifiedAt.value}>
                  {publication.verifiedAt.value}
                </time>
              ) : (
                <span className="ca-source-field--missing">Not checked</span>
              )}
            </dd>
          </div>

          <div>
            <dt>Lifecycle status</dt>
            <dd>
              <Badge
                tone={
                  publication.lifecycle.value === "active"
                    ? "success"
                    : "warning"
                }
              >
                {displayNameFor("lifecycle_status", publication.lifecycle.value || "")}
              </Badge>
            </dd>
          </div>

          {publication.reviews.map((review) => (
            <div key={review.catalogId}>
              <dt>
                {publication.reviews.length > 1
                  ? `${review.publicationName} review`
                  : "Publication currentness review"}
              </dt>
              <dd>
                {displayNameFor(
                  "source_currentness_review",
                  review.upstreamCurrentnessReview,
                )} · Reviewed{" "}
                <time dateTime={review.reviewedAt}>{review.reviewedAt}</time>
              </dd>
            </div>
          ))}

          {publication.catalogCounts ? (
            <div>
              <dt>Catalog profile coverage</dt>
              <dd>
                {publication.catalogCounts.normalized_records.toLocaleString()}{" "}
                normalized records indexed in Search & Explore
              </dd>
            </div>
          ) : isAuthority ? (
            <div>
              <dt>Authority citation</dt>
              <dd>Statutory / regulatory reference document</dd>
            </div>
          ) : null}
        </dl>

        {publication.sourceMaterials.primary.length > 0 ? (
          <section className="source-inspector-section">
            <h3>
              Primary source files ({publication.sourceMaterials.primary.length})
            </h3>
            <ul className="source-material-list">
              {publication.sourceMaterials.primary.map((item) => (
                <li className="source-material-item" key={item.id}>
                  <div className="source-material-header">
                    <IconFileText aria-hidden="true" size={16} />
                    <strong className="source-material-title">
                      {item.displayTitle}
                    </strong>
                    <span className="format-badge">
                      {displayNameFor("format", item.format)}
                    </span>
                  </div>
                  <div className="source-material-meta">
                    {item.retrievedAt ? (
                      <span>Retrieved {item.retrievedAt}</span>
                    ) : null}
                    {typeof item.recordCount === "number" && item.recordCount > 0 ? (
                      <span>{item.recordCount.toLocaleString()} records</span>
                    ) : null}
                  </div>
                  {item.url ? (
                    <a
                      className="source-material-link"
                      href={item.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <span>Open source file</span>
                      <IconExternalLink aria-hidden="true" size={14} />
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {supplementalCount > 0 ? (
          <section className="source-inspector-section">
            <h3>
              Supplemental & enrichment documents ({supplementalCount})
            </h3>
            <ul className="source-material-list">
              {[
                ...publication.sourceMaterials.enrichment,
                ...publication.sourceMaterials.supplemental,
              ].map((item) => (
                <li className="source-material-item" key={item.id}>
                  <div className="source-material-header">
                    <IconFileText aria-hidden="true" size={16} />
                    <strong className="source-material-title">
                      {item.displayTitle}
                    </strong>
                    <span className="format-badge">
                      {displayNameFor("format", item.format)}
                    </span>
                  </div>
                  <div className="source-material-meta">
                    {item.retrievedAt ? (
                      <span>Retrieved {item.retrievedAt}</span>
                    ) : null}
                  </div>
                  {item.url ? (
                    <a
                      className="source-material-link"
                      href={item.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <span>Open document</span>
                      <IconExternalLink aria-hidden="true" size={14} />
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {publication.sourceMaterials.reference.length > 0 ? (
          <section className="source-inspector-section">
            <h3>
              Reference pages & community tools (
              {publication.sourceMaterials.reference.length})
            </h3>
            <ul className="source-material-list">
              {publication.sourceMaterials.reference.map((item) => (
                <li className="source-material-item" key={item.id}>
                  <div className="source-material-header">
                    <IconFileText aria-hidden="true" size={16} />
                    <strong className="source-material-title">
                      {item.displayTitle}
                    </strong>
                    <span className="support-badge">Reference only</span>
                  </div>
                  {item.url ? (
                    <a
                      className="source-material-link"
                      href={item.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <span>View reference page</span>
                      <IconExternalLink aria-hidden="true" size={14} />
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {publication.connectionEvidence.length > 0 ? (
          <section className="source-inspector-section">
            <h3>
              Published crosswalks & mapping evidence (
              {publication.connectionEvidence.length})
            </h3>
            <ul className="source-material-list">
              {publication.connectionEvidence.map((item) => (
                <li className="source-material-item" key={item.id}>
                  <div className="source-material-header">
                    <strong className="source-material-title">
                      {item.displayTitle}
                    </strong>
                    <span className="format-badge">
                      {displayNameFor("format", item.format)}
                    </span>
                  </div>
                  <div className="source-material-meta">
                    <span>Published by {item.publisher}</span>
                    {typeof item.relationshipCount === "number" &&
                    item.relationshipCount > 0 ? (
                      <span>
                        {item.relationshipCount.toLocaleString()} published links
                      </span>
                    ) : null}
                  </div>
                  {item.url ? (
                    <a
                      className="source-material-link"
                      href={item.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <span>Open crosswalk file</span>
                      <IconExternalLink aria-hidden="true" size={14} />
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <details className="source-inspector-provenance">
          <summary>Field provenance & usage</summary>
          <div className="source-inspector-provenance-body">
            <p className="source-usage-text">
              {sourceUsageSummary(publication.rawSource)}.
            </p>
            <ul className="source-provenance-list">
              <li>
                <strong>Publisher basis:</strong> {publication.publisher.reason}
              </li>
              <li>
                <strong>Version basis:</strong> {publication.version.reason}
              </li>
              <li>
                <strong>Verification basis:</strong> {publication.verifiedAt.reason}
              </li>
              <li>
                <strong>Lifecycle basis:</strong> {publication.lifecycle.reason}
              </li>
            </ul>
          </div>
        </details>
      </div>
    </InspectorDrawer>
  );
}

export function SourcesPage(props: {
  bundle: RuntimeBundle;
  state: Extract<ViewState, { view: "sources" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  const { bundle, state, onNavigate } = props;
  const [queryDraft, setQueryDraft] = useState(state.query || "");
  const allSources = bundle.runtime.dataset.sources;
  const sourceCatalogs = useMemo(
    () => bundle.runtime.getCatalogs() as CatalogSummary[],
    [bundle.runtime],
  );

  const allPublicationRows = useMemo(
    () => buildPublicationRegister(allSources, sourceCatalogs),
    [allSources, sourceCatalogs],
  );

  const filteredPublicationRows = useMemo(
    () =>
      buildPublicationRegister(allSources, sourceCatalogs, {
        query: state.query,
        publisher: state.publisher,
        lifecycle: state.lifecycle,
      }),
    [allSources, sourceCatalogs, state.lifecycle, state.publisher, state.query],
  );

  const options = useMemo(() => {
    const sortedDistinct = (values: Array<string | null>) =>
      [...new Set(values.filter((v): v is string => Boolean(v)))].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" }),
      );
    return {
      publishers: sortedDistinct(allPublicationRows.map((r) => r.publisher.value)),
      lifecycleStatuses: sortedDistinct(
        allPublicationRows.map((r) => r.lifecycle.value),
      ),
    };
  }, [allPublicationRows]);

  const publisherOptions = options.publishers.map((value) => ({
    value,
    label: value,
  }));
  const statusOptions = options.lifecycleStatuses
    .map((value) => ({
      value,
      label: displayNameFor("lifecycle_status", value),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

  const [visibleLimit, setVisibleLimit] = useState(SOURCE_PAGE_SIZE);
  const firstNewRowRef = useRef<HTMLDivElement | null>(null);
  const activeTriggerRef = useRef<HTMLButtonElement | null>(null);

  const visibleRows = filteredPublicationRows.slice(0, visibleLimit);

  const selectedPublicationRow = useMemo(() => {
    if (!state.source) return null;
    return (
      allPublicationRows.find(
        (pub) =>
          pub.id === state.source ||
          pub.sourceMaterials.primary.some((m) => m.id === state.source) ||
          pub.sourceMaterials.enrichment.some((m) => m.id === state.source) ||
          pub.sourceMaterials.supplemental.some((m) => m.id === state.source) ||
          pub.connectionEvidence.some((e) => e.id === state.source),
      ) || null
    );
  }, [allPublicationRows, state.source]);

  const hasActiveFilters = Boolean(
    state.query || state.publisher || state.lifecycle,
  );

  useEffect(() => {
    setQueryDraft(state.query || "");
  }, [state.query]);

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

  useEffect(() => {
    setVisibleLimit(SOURCE_PAGE_SIZE);
  }, [state.lifecycle, state.publisher, state.query]);

  // Handle Escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && state.source) {
        onNavigate("sources", { ...state, source: "" });
        activeTriggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNavigate, state]);

  const handleSelectPublication = (
    publicationId: string,
    event?: MouseEvent<HTMLButtonElement>,
  ) => {
    if (event) {
      activeTriggerRef.current = event.currentTarget;
    }
    onNavigate("sources", {
      ...state,
      source: publicationId,
    });
  };

  const handleCloseInspector = () => {
    onNavigate("sources", {
      ...state,
      source: "",
    });
    activeTriggerRef.current?.focus();
  };

  const handleResetFilters = () => {
    onNavigate("sources", {
      ...state,
      query: "",
      publisher: "",
      lifecycle: "",
    });
  };

  return (
    <Panel
      className="sources-page"
      data-visual-identity="provenance-ledger"
      overflow="visible"
    >
      <PageHeader
        primary
        summary={SITE_COPY.routes.sources.purpose}
        title={SITE_COPY.routes.sources.title}
      />

      <WorkbenchControlSurface
        className="source-register-control-surface"
        label="Find publications"
        targetId="source-register-results"
      >
        <div className="source-register-controls">
          <form
            className="field source-register-search"
            onSubmit={(event) => {
              event.preventDefault();
              const query = queryDraft.trim();
              if (query !== (state.query || "")) {
                onNavigate("sources", { ...state, query });
              }
            }}
            role="search"
          >
            <label htmlFor="source-search">
              <span>Search publications</span>
              <div className="search-input">
                <IconSearch aria-hidden="true" size={18} stroke={1.8} />
                <input
                  id="source-search"
                  onChange={(event) => {
                    const next = event.target.value;
                    setQueryDraft(next);
                    onNavigate("sources", { ...state, query: next });
                  }}
                  placeholder="Name, publisher, version, ID, or catalog"
                  type="search"
                  value={queryDraft}
                />
              </div>
            </label>
          </form>

          <div className="source-register-filters">
            {publisherOptions.length >= 2 ? (
              <SelectField
                emptyLabel="All publishers"
                label="Publisher"
                onChange={(publisher) =>
                  onNavigate("sources", { ...state, publisher })
                }
                options={publisherOptions}
                value={state.publisher || ""}
              />
            ) : null}

            {statusOptions.length >= 2 ? (
              <SelectField
                emptyLabel="All statuses"
                label="Status"
                onChange={(lifecycle) =>
                  onNavigate("sources", { ...state, lifecycle })
                }
                options={statusOptions}
                value={state.lifecycle || ""}
              />
            ) : null}
          </div>

          <p aria-live="polite" className="source-register-total">
            {filteredPublicationRows.length} of {allPublicationRows.length} publications
          </p>

          {hasActiveFilters ? (
            <Button
              onClick={handleResetFilters}
              type="button"
              variant="secondary-quiet"
            >
              Reset filters
            </Button>
          ) : null}
        </div>
      </WorkbenchControlSurface>

      {state.source && !selectedPublicationRow ? (
        <div className="source-not-found-banner" role="alert">
          <div>
            <strong>Source not found</strong>
            <p>
              Requested source ID <code>{state.source}</code> is not in the
              public publication register.
            </p>
          </div>
          <Button
            onClick={handleCloseInspector}
            type="button"
            variant="secondary"
          >
            Clear selection
          </Button>
        </div>
      ) : null}

      <div
        id="source-register-results"
        role="region"
      >
        <div className="source-results-orientation">
          <strong>Publication register</strong>
          <span aria-live="polite">
            Showing {Math.min(visibleRows.length, filteredPublicationRows.length)} of{" "}
            {filteredPublicationRows.length} publications
          </span>
        </div>

        {filteredPublicationRows.length === 0 ? (
          <EmptyState
            actionLabel="Clear publication filters"
            className="source-register-empty"
            message="Clear the search, publisher, or status filters to return to the full publication register."
            onAction={handleResetFilters}
            title="No publications match these filters."
          />
        ) : (
          <div
            aria-label="Control Atlas publication register"
            className="source-register"
            data-control-results
            role="table"
          >
            <div className="source-register-heading" role="row">
              <span role="columnheader">Publication</span>
              <span role="columnheader">Publisher</span>
              <span role="columnheader">Publisher version</span>
              <span role="columnheader">Source last checked</span>
              <span role="columnheader">Status</span>
              <span role="columnheader">Catalog profile</span>
            </div>

            {visibleRows.map((row, index) => {
              const isSelected =
                state.source === row.id ||
                selectedPublicationRow?.id === row.id;
              const materialCount =
                row.sourceMaterials.primary.length +
                row.sourceMaterials.enrichment.length +
                row.sourceMaterials.supplemental.length;
              const mappingCount = row.connectionEvidence.length;

              return (
                <div
                  className={`source-register-row${
                    isSelected ? " source-register-row--selected" : ""
                  }`}
                  key={row.id}
                  ref={
                    index === Math.max(0, visibleLimit - SOURCE_PAGE_SIZE)
                      ? firstNewRowRef
                      : undefined
                  }
                  role="row"
                  tabIndex={-1}
                >
                  <SourceRegisterCell
                    className="ca-source-cell--identity"
                    label="Publication"
                  >
                    <div className="source-title-row">
                      <button
                        aria-expanded={isSelected}
                        className="source-title-link"
                        onClick={(e) => handleSelectPublication(row.id, e)}
                        type="button"
                      >
                        {row.displayTitle}
                      </button>
                      {materialCount > 0 || mappingCount > 0 ? (
                        <span
                          className="source-attached-pill"
                          title={`${materialCount} source file${
                            materialCount === 1 ? "" : "s"
                          }, ${mappingCount} mapping${
                            mappingCount === 1 ? "" : "s"
                          }`}
                        >
                          {materialCount > 0
                            ? `${materialCount} file${
                                materialCount === 1 ? "" : "s"
                              }`
                            : ""}
                          {materialCount > 0 && mappingCount > 0 ? " · " : ""}
                          {mappingCount > 0
                            ? `${mappingCount} mapping${
                                mappingCount === 1 ? "" : "s"
                              }`
                            : ""}
                        </span>
                      ) : null}
                    </div>
                  </SourceRegisterCell>

                  <SourceRegisterCell label="Publisher">
                    <SourceFieldValue
                      field={row.publisher}
                      missingLabel="Publisher not recorded"
                      notApplicableLabel="Not applicable"
                    />
                  </SourceRegisterCell>

                  <SourceRegisterCell label="Publisher version">
                    <SourceFieldValue
                      field={row.version}
                      missingLabel="Not published"
                      notApplicableLabel="Not applicable"
                    />
                  </SourceRegisterCell>

                  <SourceRegisterCell label="Source last checked">
                    <SourceFieldValue
                      field={row.verifiedAt}
                      missingLabel="Not checked"
                      notApplicableLabel="Not applicable"
                    />
                  </SourceRegisterCell>

                  <SourceRegisterCell label="Status">
                    <Badge
                      tone={
                        row.lifecycle.value === "active"
                          ? "success"
                          : "warning"
                      }
                    >
                      {displayNameFor(
                        "lifecycle_status",
                        row.lifecycle.value || "",
                      )}
                    </Badge>
                  </SourceRegisterCell>

                  <SourceRegisterCell label="Catalog profile">
                    <span className="source-coverage-summary">
                      {row.coverageSummary}
                    </span>
                  </SourceRegisterCell>
                </div>
              );
            })}
          </div>
        )}

        {filteredPublicationRows.length > visibleRows.length ? (
          <div className="source-register-more">
            <Button
              onClick={() => {
                setVisibleLimit((current) =>
                  Math.min(current + SOURCE_PAGE_SIZE, filteredPublicationRows.length),
                );
                window.requestAnimationFrame(() =>
                  firstNewRowRef.current?.focus(),
                );
              }}
              type="button"
              variant="secondary"
            >
              Show{" "}
              {Math.min(
                SOURCE_PAGE_SIZE,
                filteredPublicationRows.length - visibleRows.length,
              )}{" "}
              more publications
            </Button>
          </div>
        ) : null}
      </div>

      {selectedPublicationRow ? (
        <PublicationInspector
          onClose={handleCloseInspector}
          publication={selectedPublicationRow}
        />
      ) : null}

      <p className="sources-resource-boundary">
        Looking for tools or training?{" "}
        <AppLink onNavigate={onNavigate} view="commons">
          Browse Resources
        </AppLink>
      </p>

      <section
        aria-labelledby="source-supporting-evidence"
        className="source-supporting-evidence"
      >
        <h2 id="source-supporting-evidence">Supporting source evidence</h2>

        <details className="canonical-source-links" id="official-source-links">
          <summary>Official primary source links</summary>
          <div className="disclosure-content">
            <p>Direct links to selected public primary authority publications.</p>
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

        <details className="connection-inventory" id="connection-inventory">
          <summary>Connection inventory</summary>
          <div className="disclosure-content">
            <p>
              What's loaded and connected right now — a count of what's built,
              not a score of how complete the picture is.
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
                      {category.connectedRecords.toLocaleString()} records connected
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

        <details className="structure-evidence" id="structure-evidence">
          <summary>Control Atlas structure & organizing methodology</summary>
          <div className="disclosure-content">
            <p>
              Control Atlas's organizing spine connects federal authority,
              Cybersecurity, and its areas. See the Path rail on any record for
              how Control Atlas structure and publisher hierarchy are identified.
            </p>
            <p className="support-meta">
              The 9 primary cybersecurity functional areas organize 47 canonical
              publications and their attached official source files without altering
              official publisher titles or requirement citations.
            </p>
          </div>
        </details>
      </section>
    </Panel>
  );
}

