import type { ReactNode } from "react";

export function LoadingStatusPanel(props: {
  slow: boolean;
  children?: ReactNode;
}) {
  return (
    <section aria-live="polite" className="loading-card" role="status">
      <div aria-hidden="true" className="load-progress" />
      <p className="eyebrow">Loading</p>
      <h2>Loading records</h2>
      <p>
        Please wait a moment while we load the public records, source registry,
        and comparison views.
      </p>
      {props.slow ? (
        <p className="load-slow-hint">
          This is taking longer than usual. If it continues, refresh the page or
          check your network connection.
        </p>
      ) : null}
      <p className="load-slow-hint">
        You can browse Playbooks, Templates, or About while records finish
        loading.
      </p>
      {props.children}
    </section>
  );
}

export function LoadErrorPanel(props: {
  message: string;
  onRetry: () => void;
  children?: ReactNode;
}) {
  return (
    <section className="notice load-error-panel">
      <h2>Record data unavailable</h2>
      <p>{props.message}</p>
      <p>
        Check your connection, then retry. You can still browse Playbooks and
        About without the full map data.
      </p>
      <div className="card-actions">
        <button className="primary" onClick={props.onRetry} type="button">
          Retry loading
        </button>
      </div>
      {props.children}
    </section>
  );
}

export function OfflineFallbackActions(props: {
  onNavigate: (view: "patterns" | "templates" | "about" | "start-here") => void;
}) {
  return (
    <div className="offline-fallback-grid">
      <button
        className="offline-fallback-card"
        onClick={() => props.onNavigate("patterns")}
        type="button"
      >
        <strong>Explore playbooks</strong>
        <span>Task-focused guides you can read without the full map.</span>
      </button>
      <button
        className="offline-fallback-card"
        onClick={() => props.onNavigate("templates")}
        type="button"
      >
        <strong>Browse templates</strong>
        <span>Blank planning and assessment starters.</span>
      </button>
      <button
        className="offline-fallback-card"
        onClick={() => props.onNavigate("start-here")}
        type="button"
      >
        <strong>Start</strong>
        <span>Answer a few questions for a tailored path.</span>
      </button>
      <button
        className="offline-fallback-card"
        onClick={() => props.onNavigate("about")}
        type="button"
      >
        <strong>About &amp; trust</strong>
        <span>How Control Atlas sources and limits its advice.</span>
      </button>
    </div>
  );
}

export function DataPendingNotice(props: {
  title?: string;
  onRetry?: () => void;
}) {
  return (
    <section className="notice">
      <h2>{props.title || "Connection data is still loading"}</h2>
      <p>
        This page needs the public mapping data. Wait a moment or retry if
        loading failed.
      </p>
      {props.onRetry ? (
        <button className="primary" onClick={props.onRetry} type="button">
          Retry loading
        </button>
      ) : null}
    </section>
  );
}

export function CompareExportDisclosure(props: {
  disabled?: boolean;
  onExport: (format: "csv" | "markdown" | "json") => void;
}) {
  return (
    <details className="export-disclosure">
      <summary>Export results</summary>
      <div className="card-actions">
        <button
          className="secondary"
          disabled={props.disabled}
          onClick={() => props.onExport("csv")}
          type="button"
        >
          Export CSV
        </button>
        <button
          className="secondary"
          disabled={props.disabled}
          onClick={() => props.onExport("markdown")}
          type="button"
        >
          Export Markdown
        </button>
        <button
          className="secondary"
          disabled={props.disabled}
          onClick={() => props.onExport("json")}
          type="button"
        >
          Export JSON
        </button>
      </div>
    </details>
  );
}
