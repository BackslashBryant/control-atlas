import type { ReactNode } from "react";
import { Panel, Button, StatusChip } from "./lsm";

export function LoadingStatusPanel(props: {
  slow: boolean;
  children?: ReactNode;
}) {
  return (
    <Panel className="max-w-[800px] mx-auto mt-[40px]" title="Loading Records">
      <div aria-hidden="true" className="load-progress mb-[16px]" />
      <p className="mb-[16px]">
        Please wait a moment while we load the public records, source registry,
        and comparison views.
      </p>
      {props.slow ? (
        <p className="text-[var(--ca-warning)] mb-[16px]">
          This is taking longer than usual. If it continues, refresh the page or
          check your network connection.
        </p>
      ) : null}
      <p className="text-[var(--ca-text-muted)] mb-[24px]">
        You can browse Playbooks, Templates, or About while records finish
        loading.
      </p>
      {props.children}
    </Panel>
  );
}

export function LoadErrorPanel(props: {
  message: string;
  onRetry: () => void;
  children?: ReactNode;
}) {
  return (
    <Panel className="max-w-[800px] mx-auto mt-[40px] border-[var(--ca-danger)]" title="Record data unavailable">
      <p className="mb-[16px] font-bold text-[var(--ca-danger)]">{props.message}</p>
      <p className="mb-[24px]">
        Check your connection, then retry. You can still browse Playbooks and
        About without the full map data.
      </p>
      <div className="flex gap-[8px] mb-[24px]">
        <Button variant="destructive" onClick={props.onRetry}>
          Retry loading
        </Button>
      </div>
      {props.children}
    </Panel>
  );
}

export function OfflineFallbackActions(props: {
  onNavigate: (view: "patterns" | "templates" | "about" | "start-here") => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
      <button
        className="flex flex-col items-start p-[16px] text-left border border-[var(--ca-border-strong)] rounded-[3px] bg-[var(--ca-surface-raised)] hover:border-[var(--ca-secondary)] transition-colors"
        onClick={() => props.onNavigate("patterns")}
        type="button"
      >
        <strong className="text-[var(--ca-text)] font-mono uppercase tracking-wider text-[11px] mb-[4px]">Read explanations</strong>
        <span className="text-[var(--ca-text-muted)] text-[13px]">Cited explanations of source identity, structure, search, mappings, records, and starter documents.</span>
      </button>
      <button
        className="flex flex-col items-start p-[16px] text-left border border-[var(--ca-border-strong)] rounded-[3px] bg-[var(--ca-surface-raised)] hover:border-[var(--ca-secondary)] transition-colors"
        onClick={() => props.onNavigate("templates")}
        type="button"
      >
        <strong className="text-[var(--ca-text)] font-mono uppercase tracking-wider text-[11px] mb-[4px]">Open starter documents</strong>
        <span className="text-[var(--ca-text-muted)] text-[13px]">Create a blank starter file from explicit inputs.</span>
      </button>
      <button
        className="flex flex-col items-start p-[16px] text-left border border-[var(--ca-border-strong)] rounded-[3px] bg-[var(--ca-surface-raised)] hover:border-[var(--ca-secondary)] transition-colors"
        onClick={() => props.onNavigate("start-here")}
        type="button"
      >
        <strong className="text-[var(--ca-text)] font-mono uppercase tracking-wider text-[11px] mb-[4px]">Browse publications</strong>
        <span className="text-[var(--ca-text-muted)] text-[13px]">Open a catalog or program source directly.</span>
      </button>
      <button
        className="flex flex-col items-start p-[16px] text-left border border-[var(--ca-border-strong)] rounded-[3px] bg-[var(--ca-surface-raised)] hover:border-[var(--ca-secondary)] transition-colors"
        onClick={() => props.onNavigate("about")}
        type="button"
      >
        <strong className="text-[var(--ca-text)] font-mono uppercase tracking-wider text-[11px] mb-[4px]">Read the product boundary</strong>
        <span className="text-[var(--ca-text-muted)] text-[13px]">How sources are attributed and which decisions remain with practitioners and responsible authorities.</span>
      </button>
    </div>
  );
}

export function DataPendingNotice(props: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <Panel className="max-w-[800px] mx-auto mt-[40px]" title={props.title || "Connection data is still loading"}>
      <p className="mb-[24px]">
        {props.description ||
          "This page needs the public mapping data. Wait a moment or retry if loading failed."}
      </p>
      {props.onRetry ? (
        <Button variant="primary" onClick={props.onRetry}>
          Retry loading
        </Button>
      ) : null}
    </Panel>
  );
}

export function CompareExportDisclosure(props: {
  disabled?: boolean;
  onExport: (format: "csv" | "markdown" | "json") => void;
}) {
  return (
    <details className="mt-[24px] border border-[var(--ca-border-strong)] rounded-[3px] overflow-hidden group">
      <summary className="p-[12px] bg-[var(--ca-surface-raised)] cursor-pointer hover:bg-[color-mix(in_srgb,var(--ca-surface-raised),white_5%)] list-none font-mono uppercase tracking-wider text-[11px] font-bold">
        Export results
      </summary>
      <div className="p-[16px] bg-[var(--ca-surface)] border-t border-[var(--ca-border-strong)]">
        <div className="flex gap-[8px] mb-[16px] flex-wrap">
          <Button
            variant="secondary"
            disabled={props.disabled}
            onClick={() => props.onExport("csv")}
          >
            Export CSV
          </Button>
          <Button
            variant="secondary"
            disabled={props.disabled}
            onClick={() => props.onExport("markdown")}
          >
            Export Markdown
          </Button>
          <Button
            variant="secondary"
            disabled={props.disabled}
            onClick={() => props.onExport("json")}
          >
            Export JSON
          </Button>
        </div>
        <p className="text-[var(--ca-text-subtle)] text-[11px]">
          Exports preserve source references and the Control Atlas boundary
          included in generated files.
        </p>
      </div>
    </details>
  );
}
