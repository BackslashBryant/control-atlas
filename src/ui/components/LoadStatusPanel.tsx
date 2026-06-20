import type { ReactNode } from "react";

export function LoadingStatusPanel(props: {
  slow: boolean;
  children?: ReactNode;
}) {
  return (
    <section aria-live="polite" className="loading-card" role="status">
      <div aria-hidden="true" className="load-progress" />
      <p className="eyebrow">Loading</p>
      <h2>Preparing library data</h2>
      <p>
        Control Atlas is loading the public library, source records, and
        comparison views.
      </p>
      {props.slow ? (
        <p className="load-slow-hint">
          This is taking longer than usual. If it continues, refresh the page or
          check your network connection.
        </p>
      ) : null}
      <p className="load-slow-hint">
        You can still open Patterns or About while data loads using the links
        below.
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
      <h2>Library data unavailable</h2>
      <p>{props.message}</p>
      <p>
        Check your connection, then retry. You can still browse Patterns and
        About without the full library.
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
  onNavigate: (view: "patterns" | "templates" | "about") => void;
}) {
  return (
    <div className="card-actions offline-fallback-actions">
      <button
        className="secondary"
        onClick={() => props.onNavigate("patterns")}
        type="button"
      >
        Explore Patterns
      </button>
      <button
        className="secondary"
        onClick={() => props.onNavigate("templates")}
        type="button"
      >
        Browse templates
      </button>
      <button
        className="secondary"
        onClick={() => props.onNavigate("about")}
        type="button"
      >
        About &amp; trust
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
      <h2>{props.title || "Library data is still loading"}</h2>
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
