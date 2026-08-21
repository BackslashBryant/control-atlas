import {
  IconExternalLink,
  IconFileText,
} from "@tabler/icons-react";
import * as Dialog from "@radix-ui/react-dialog";
import type { MouseEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import { SITE_COPY } from "../../shared/site-copy.mjs";
import { Button, ButtonLink } from "../components/lsm";
import {
  Badge,
  EmptyState,
  MissionPage,
  PageHeader,
  copyText,
  sourceUsageSummary,
} from "../lib/pagePrimitives";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import {
  buildPublicationRegister,
  type CatalogSummary,
  type PublicationRegisterRow,
} from "../lib/sourceRegister";
import type { ViewState } from "../lib/viewState";

const SOURCE_PAGE_SIZE = 25;

/**
 * A recorded check date prints plainly. A date derived from retrieval is
 * labelled as retrieval, so the register never implies a verification that did
 * not happen. The field's reason carries the full sentence in the tooltip.
 */
function VerificationDate(props: { field: { value: string | null; state: string; reason: string } }) {
  const { field } = props;
  if (!field.value) return <>—</>;
  if (field.state === "derived") {
    return (
      <span className="source-checked-derived" title={field.reason}>
        <span className="source-checked-qualifier">Retrieved</span> {field.value}
      </span>
    );
  }
  return <>{field.value}</>;
}

/** Enough to show the register's shape without becoming a second filter list. */
const PUBLISHER_BAND_LIMIT = 8;
/** A chip for two rows is not navigation; the dropdown already covers the tail. */
const PUBLISHER_BAND_MINIMUM = 3;

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

function EmptyPublicationInspector() {
  return (
    <section className="source-inspector-card source-inspector-card--empty panel surface-blueprint">
      <span className="label">SELECTED PUBLICATION</span>
      <h2 className="source-inspector-title">
        Select a publication
      </h2>
      <p className="source-inspector-empty-desc">
        Publisher, version, source files, and published crosswalks will appear here.
      </p>
    </section>
  );
}

function useCompactSourceInspector() {
  const [isCompact, setIsCompact] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 1024 : false,
  );

  useEffect(() => {
    const update = () => setIsCompact(window.innerWidth < 1024);
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return isCompact;
}

function PublicationInspectorContent(props: {
  publication: PublicationRegisterRow;
  heading: ReactNode;
  close?: ReactNode;
}) {
  const { publication, heading, close } = props;
  const isAuthority = publication.id.startsWith("authority-");
  const allSupplemental = [
    ...publication.sourceMaterials.enrichment,
    ...publication.sourceMaterials.supplemental,
  ];
  const historicalItems = allSupplemental.filter((item) => item.isHistorical);
  const supplementalItems = allSupplemental.filter((item) => !item.isHistorical);
  const primaryAndSupplemental = [
    ...publication.sourceMaterials.primary,
    ...supplementalItems,
    ...historicalItems,
  ];
  const sourceFilesCount = primaryAndSupplemental.length;
  const sourceRoles = [
    ["Primary", publication.sourceMaterials.primary.length],
    ["Enrichment", publication.sourceMaterials.enrichment.length],
    ["Supplemental", publication.sourceMaterials.supplemental.length],
    ["Reference", publication.sourceMaterials.reference.length],
  ]
    .filter(([, count]) => typeof count === "number" && count > 0)
    .map(([role]) => String(role))
    .join(", ");

  const coverageText = publication.catalogCounts
    ? `${publication.catalogCounts.normalized_records.toLocaleString()} normalized records indexed in Search & Explore`
    : isAuthority
      ? "Statutory / regulatory reference document"
      : publication.coverageSummary || "—";

  return (
    <>
      <header className="source-inspector-header">
        <div>
          <span className="label">SELECTED PUBLICATION</span>
          {heading}
          <p className="source-inspector-publisher">
            {publication.publisher.value || "—"}
          </p>
        </div>
        {close}
      </header>

      <div className="source-inspector-content">
        <section aria-label="Source status summary" className="source-status-overview">
          <div className="system-stat">
            <span>Version / current through</span>
            <strong>{publication.version.value || "—"}</strong>
          </div>

          <div className="system-stat">
            <span>Status</span>
            <div>
              <Badge
                tone={
                  publication.lifecycle.value === "active"
                    ? "success"
                    : "warning"
                }
              >
                {displayNameFor("lifecycle_status", publication.lifecycle.value || "")}
              </Badge>
            </div>
          </div>

          <div className="system-stat">
            <span>Last checked</span>
            <strong><VerificationDate field={publication.verifiedAt} /></strong>
          </div>

          <div className="system-stat">
            <span>Control Atlas coverage</span>
            <strong>{coverageText}</strong>
          </div>

        </section>

        {publication.officialLink ? (
          <ButtonLink
            className="source-inspector-official-link"
            href={publication.officialLink}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span>Open official publication</span>
            <IconExternalLink aria-hidden="true" size={14} />
          </ButtonLink>
        ) : null}

        {sourceFilesCount > 0 ? (
          <details className="source-inspector-section" open>
            <summary>
              <strong>Source files ({sourceFilesCount})</strong>
            </summary>
            <ul className="source-material-list">
              {primaryAndSupplemental.map((item) => (
                <li className="source-material-item" key={item.id}>
                  <div className="source-material-header">
                    <IconFileText aria-hidden="true" size={16} />
                    <strong className="source-material-title">
                      {item.displayTitle}
                    </strong>
                    <span className="format-badge">
                      {displayNameFor("format", item.format)}
                    </span>
                    {item.isCommunity ? (
                      <span className="support-badge">Community source</span>
                    ) : null}
                    {item.isHistorical ? (
                      <span className="support-badge">Historical, superseded</span>
                    ) : null}
                  </div>
                  <div className="source-material-meta">
                    {item.retrievedAt ? (
                      <span>
                        Retrieved{" "}
                        <time dateTime={item.retrievedAt}>{item.retrievedAt}</time>
                      </span>
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
          </details>
        ) : null}

        {publication.connectionEvidence.length > 0 ? (
          <details className="source-inspector-section" open>
            <summary>
              <strong>
                Published crosswalks ({publication.connectionEvidence.length})
              </strong>
            </summary>
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
          </details>
        ) : null}

        {publication.sourceMaterials.reference.length > 0 ? (
          <details className="source-inspector-section">
            <summary>
              <strong>
                Reference material ({publication.sourceMaterials.reference.length})
              </strong>
            </summary>
            <ul className="source-material-list">
              {publication.sourceMaterials.reference.map((item) => (
                <li className="source-material-item" key={item.id}>
                  <div className="source-material-header">
                    <IconFileText aria-hidden="true" size={16} />
                    <strong className="source-material-title">
                      {item.displayTitle}
                    </strong>
                    <span className="support-badge">Reference only</span>
                    {item.isCommunity ? (
                      <span className="support-badge">Community source</span>
                    ) : null}
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
          </details>
        ) : null}

        <details className="source-inspector-provenance">
          <summary>Technical details</summary>
          <div className="source-inspector-provenance-body">
            <div className="source-inspector-id-block">
              <span className="source-inspector-label">Stable Source ID</span>
              <CopyStableSourceId id={publication.id} />
            </div>
            <p className="source-usage-text">
              {sourceUsageSummary(publication.rawSource || {})}
            </p>
            <ul className="source-provenance-list">
              <li>
                <strong>Source roles:</strong> <span>{sourceRoles || "Not recorded"}</span>
              </li>
              <li>
                <strong>Provenance class:</strong>{" "}
                <span>{publication.provenance || "Official source"}</span>
              </li>
              <li>
                <strong>Eligibility status:</strong>{" "}
                <span>{publication.eligibility || "Eligible"}</span>
              </li>
              <li>
                <strong>Access status:</strong>{" "}
                <span>{publication.access || "Public"}</span>
              </li>
            </ul>
          </div>
        </details>
      </div>
    </>
  );
}

function PublicationInspector(props: {
  publication: PublicationRegisterRow;
  onClose: () => void;
}) {
  const isCompact = useCompactSourceInspector();
  const title = props.publication.officialTitle;

  useEffect(() => {
    if (!isCompact) return undefined;
    const app = document.getElementById("app");
    if (!app) return undefined;
    const wasInert = app.hasAttribute("inert");
    const previousAriaHidden = app.getAttribute("aria-hidden");
    app.setAttribute("inert", "");
    app.setAttribute("aria-hidden", "true");
    return () => {
      if (!wasInert) app.removeAttribute("inert");
      if (previousAriaHidden === null) app.removeAttribute("aria-hidden");
      else app.setAttribute("aria-hidden", previousAriaHidden);
    };
  }, [isCompact]);

  if (isCompact) {
    return (
      <Dialog.Root
        onOpenChange={(open) => {
          if (!open) props.onClose();
        }}
        open
      >
        <Dialog.Portal>
          <Dialog.Overlay className="source-inspector-dialog-backdrop" />
          <Dialog.Content
            aria-describedby={undefined}
            aria-label={`Details for ${title}`}
            aria-modal="true"
            className="source-inspector source-inspector--modal panel surface-blueprint"
            id="source-inspector-detail"
          >
            <PublicationInspectorContent
              close={
                <Dialog.Close aria-label="Close inspector" className="source-inspector-close" type="button">
                  Close
                </Dialog.Close>
              }
              heading={<Dialog.Title className="source-inspector-title">{title}</Dialog.Title>}
              publication={props.publication}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <article
      aria-label={`Details for ${title}`}
      className="source-inspector source-inspector--inline panel surface-blueprint"
      id="source-inspector-detail"
    >
      <PublicationInspectorContent
        heading={<h2 className="source-inspector-title">{title}</h2>}
        publication={props.publication}
      />
    </article>
  );
}

export function SourcesPage(props: {
  bundle: RuntimeBundle;
  state: Extract<ViewState, { view: "sources" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  const { bundle, state, onNavigate } = props;
  const [queryDraft, setQueryDraft] = useState(state.query || "");
  const debounceTimerRef = useRef<number | null>(null);

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

  /**
   * The register is one flat list of 192 entries behind a publisher dropdown,
   * so the shape of it — who publishes what, and how much — was invisible
   * until you opened the select. These bands put the largest publishers up
   * front as one-click filters and keep the dropdown for the long tail.
   */
  const publisherBands = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of allPublicationRows) {
      const name = row.publisher.value;
      if (name) counts.set(name, (counts.get(name) || 0) + 1);
    }
    return [...counts.entries()]
      .map(([value, count]) => ({ count, value }))
      .filter((band) => band.count >= PUBLISHER_BAND_MINIMUM)
      .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value))
      .slice(0, PUBLISHER_BAND_LIMIT);
  }, [allPublicationRows]);
  const statusOptions = options.lifecycleStatuses
    .map((value) => ({
      value,
      label: displayNameFor("lifecycle_status", value),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

  const [visibleLimit, setVisibleLimit] = useState(SOURCE_PAGE_SIZE);
  const firstNewRowRef = useRef<HTMLTableRowElement | null>(null);
  const activeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const activeTriggerIdRef = useRef<string | null>(null);

  const visibleRows = filteredPublicationRows.slice(0, visibleLimit);

  const selectedPublicationRow = useMemo(() => {
    if (!state.source) return null;
    return (
      allPublicationRows.find(
        (pub) =>
          pub.id === state.source ||
          pub.associatedSourceIds?.includes(state.source) ||
          pub.sourceMaterials.primary.some((m) => m.id === state.source) ||
          pub.sourceMaterials.enrichment.some((m) => m.id === state.source) ||
          pub.sourceMaterials.supplemental.some((m) => m.id === state.source) ||
          pub.sourceMaterials.reference.some((m) => m.id === state.source) ||
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

  const handleQueryChange = (nextQuery: string) => {
    setQueryDraft(nextQuery);
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      onNavigate("sources", { ...state, query: nextQuery });
    }, 200);
  };

  const handleQueryCommit = () => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    onNavigate("sources", { ...state, query: queryDraft });
  };

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

  const lastActiveSourceRef = useRef(state.source || "");
  useEffect(() => {
    if (state.source) {
      lastActiveSourceRef.current = state.source;
    } else if (lastActiveSourceRef.current) {
      const triggerId = activeTriggerIdRef.current || lastActiveSourceRef.current;
      window.setTimeout(() => {
        document.getElementById(`source-trigger-${triggerId}`)?.focus();
      }, 50);
      lastActiveSourceRef.current = "";
    }
  }, [state.source]);

  const handleSelectPublication = (
    publicationId: string,
    event?: MouseEvent<HTMLButtonElement>,
  ) => {
    if (event) {
      activeTriggerRef.current = event.currentTarget;
    }
    activeTriggerIdRef.current = publicationId;
    lastActiveSourceRef.current = publicationId;
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
  };

  const handleResetFilters = () => {
    onNavigate("sources", {
      ...state,
      query: "",
      publisher: "",
      lifecycle: "",
    });
  };

  const publicationCount = allPublicationRows.length;
  const eyebrow = `SOURCE REGISTER / ${publicationCount} PUBLICATIONS`;

  return (
    <MissionPage
      className="sources-page"
      data-visual-identity="provenance-ledger"
      maxWidth="workspace"
    >
      <PageHeader
        eyebrow={eyebrow}
        primary
        summary="Verify publisher, version, and source material for publications used in Control Atlas."
        title={SITE_COPY.routes.sources.title}
      />

      {state.source && !selectedPublicationRow ? (
        <div className="source-not-found-banner" role="alert">
          <div>
            <p>That publication is not in the public publication register.</p>
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

      <div className="sources-workspace grid queue-layout">
        <section aria-label="Publication register" className="sources-table-panel panel surface-scanline">
          {/* S2 Toolbar: compact admin toolbar */}
          <div className="admin-tools source-admin-tools">
            <input
              aria-label="Search publications"
              id="source-search"
              onChange={(event) => handleQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleQueryCommit();
              }}
              placeholder="Search title, publisher, version, or ID"
              type="search"
              value={queryDraft}
            />

            {publisherOptions.length >= 2 ? (
              <select
                aria-label="Publisher"
                className="source-filter-select"
                onChange={(event) =>
                  onNavigate("sources", { ...state, publisher: event.target.value })
                }
                value={state.publisher || ""}
              >
                <option value="">All publishers</option>
                {publisherOptions.map((option) => (
                  <option key={`pub-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : null}

            {statusOptions.length >= 2 ? (
              <select
                aria-label="Status"
                className="source-filter-select"
                onChange={(event) =>
                  onNavigate("sources", { ...state, lifecycle: event.target.value })
                }
                value={state.lifecycle || ""}
              >
                <option value="">All statuses</option>
                {statusOptions.map((option) => (
                  <option key={`status-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : null}

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

          {publisherBands.length > 1 ? (
            <nav aria-label="Publishers" className="workspace-result-groups" data-group-count={publisherBands.length}>
              <button
                aria-pressed={!state.publisher}
                className="workspace-result-group"
                onClick={() => onNavigate("sources", { ...state, publisher: "" })}
                type="button"
              >
                All publishers<small>{allPublicationRows.length.toLocaleString()}</small>
              </button>
              {publisherBands.map((band) => (
                <button
                  aria-pressed={state.publisher === band.value}
                  className="workspace-result-group"
                  key={band.value}
                  onClick={() => onNavigate("sources", {
                    ...state,
                    publisher: state.publisher === band.value ? "" : band.value,
                  })}
                  type="button"
                >
                  {band.value}<small>{band.count.toLocaleString()}</small>
                </button>
              ))}
            </nav>
          ) : null}

          {/* S3 Measurement rail */}
          <div aria-live="polite" className="calibration-rail">
            <span>
              SHOWING 1–{Math.min(visibleLimit, filteredPublicationRows.length)} / {filteredPublicationRows.length}
            </span>
          </div>

          {/* S5 & S6 Table */}
          {filteredPublicationRows.length === 0 ? (
            <EmptyState
              actionLabel="Clear publication filters"
              className="source-register-empty"
              message="Clear the search, publisher, or status filters to return to the full publication register."
              onAction={handleResetFilters}
              title="No publications match these filters."
            />
          ) : (
            <div className="table-scroll">
              <table
                aria-label="Control Atlas publication register"
                className="table source-table"
                id="source-register-table"
              >
                <thead>
                  <tr>
                    <th scope="col">Publication</th>
                    <th scope="col">Publisher</th>
                    <th scope="col">Version / current through</th>
                    <th scope="col">Last checked</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
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
                      <tr
                        aria-selected={isSelected ? "true" : undefined}
                        className={`source-register-row${
                          isSelected ? " source-register-row--selected" : ""
                        }`}
                        key={row.id}
                        ref={
                          index === Math.max(0, visibleLimit - SOURCE_PAGE_SIZE)
                            ? firstNewRowRef
                            : undefined
                        }
                      >
                        <td className="source-col-publication">
                          <div className="source-title-cell">
                            <button
                              aria-expanded={isSelected}
                              className="source-title-link"
                              id={`source-trigger-${row.id}`}
                              onClick={(e) => handleSelectPublication(row.id, e)}
                              type="button"
                            >
                              {row.displayTitle}
                            </button>
                            <span className="source-mobile-publisher">
                              {row.publisher.value || "—"}
                            </span>
                            <div className="source-mobile-meta">
                              <span>{row.version.value || "—"}</span>
                              <span> · </span>
                              <span className="source-mobile-status">
                                {displayNameFor(
                                  "lifecycle_status",
                                  row.lifecycle.value || "",
                                )}
                              </span>
                            </div>
                            {materialCount > 0 || mappingCount > 0 ? (
                              <span
                                className="source-attached-pill"
                                title={`${materialCount} source file${
                                  materialCount === 1 ? "" : "s"
                                }, ${mappingCount} crosswalk${
                                  mappingCount === 1 ? "" : "s"
                                }`}
                              >
                                {materialCount > 0 ? (
                                  <>
                                    <span className="source-attachment-count--desktop">
                                      {materialCount} source file{materialCount === 1 ? "" : "s"}
                                    </span>
                                    <span className="source-attachment-count--mobile">
                                      {materialCount} file{materialCount === 1 ? "" : "s"}
                                    </span>
                                  </>
                                ) : null}
                                {materialCount > 0 && mappingCount > 0 ? " · " : ""}
                                {mappingCount > 0
                                  ? `${mappingCount} crosswalk${
                                      mappingCount === 1 ? "" : "s"
                                    }`
                                  : ""}
                              </span>
                            ) : null}
                          </div>
                        </td>

                        <td className="source-col-publisher">
                          {row.publisher.value || "—"}
                        </td>

                        <td className="source-col-version">
                          {row.version.value || "—"}
                        </td>

                        <td className="source-col-checked">
                          <VerificationDate field={row.verifiedAt} />
                        </td>

                        <td className="source-col-status">
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
        </section>

        {/* S4, S7, S8 Scoped Publication Inspector */}
        <aside className="work-stack sources-inspector-pane">
          {selectedPublicationRow ? (
            <PublicationInspector
              onClose={handleCloseInspector}
              publication={selectedPublicationRow}
            />
          ) : (
            <div className="sources-inspector-empty-desktop">
              <EmptyPublicationInspector />
            </div>
          )}
        </aside>
      </div>
    </MissionPage>
  );
}
