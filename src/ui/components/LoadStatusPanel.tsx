import type { ReactNode } from "react";
import { Panel, Button } from "./lsm";
import { AppLink } from "./AppLink";

export function LoadingStatusPanel(props: {
  slow: boolean;
  children?: ReactNode;
  suspensePending?: boolean;
}) {
  return (
    <Panel
      className="max-w-[800px] mx-auto mt-[40px]"
      data-route-suspense-pending={props.suspensePending ? "true" : undefined}
      title="Loading Records"
    >
      <div aria-hidden="true" className="load-progress mb-[16px]" />
      <p className="mb-[16px]">
        Loading public records, source information, and comparison tools.
      </p>
      {props.slow ? (
        <p className="text-[var(--ca-warning)] mb-[16px]">
          This is taking longer than usual. If it continues, refresh the page or
          check your network connection.
        </p>
      ) : null}
      <p className="text-[var(--ca-text-muted)] mb-[24px]">
        Guides, Templates, and About are ready now if you would rather start
        there.
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
        Check your connection, then retry. Guides and About still work without
        the record data.
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
      <AppLink
        className="flex flex-col items-start p-[16px] text-left border border-[var(--ca-border-strong)] rounded-[3px] bg-[var(--ca-surface-raised)] hover:border-[var(--ca-secondary)] transition-colors"
        onNavigate={props.onNavigate}
        view="patterns"
      >
        <strong className="text-[var(--ca-text)] font-mono uppercase tracking-wider text-[11px] mb-[4px]">Read the guides</strong>
        <span className="text-[var(--ca-text-muted)] text-[13px]">Short, cited explanations of how federal requirements fit together.</span>
      </AppLink>
      <AppLink
        className="flex flex-col items-start p-[16px] text-left border border-[var(--ca-border-strong)] rounded-[3px] bg-[var(--ca-surface-raised)] hover:border-[var(--ca-secondary)] transition-colors"
        onNavigate={props.onNavigate}
        view="templates"
      >
        <strong className="text-[var(--ca-text)] font-mono uppercase tracking-wider text-[11px] mb-[4px]">Open Templates</strong>
        <span className="text-[var(--ca-text-muted)] text-[13px]">Choose a starter file built from explicit inputs.</span>
      </AppLink>
      <AppLink
        className="flex flex-col items-start p-[16px] text-left border border-[var(--ca-border-strong)] rounded-[3px] bg-[var(--ca-surface-raised)] hover:border-[var(--ca-secondary)] transition-colors"
        onNavigate={props.onNavigate}
        view="start-here"
      >
        <strong className="text-[var(--ca-text)] font-mono uppercase tracking-wider text-[11px] mb-[4px]">Start here</strong>
        <span className="text-[var(--ca-text-muted)] text-[13px]">Answer two questions to find where to begin.</span>
      </AppLink>
      <AppLink
        className="flex flex-col items-start p-[16px] text-left border border-[var(--ca-border-strong)] rounded-[3px] bg-[var(--ca-surface-raised)] hover:border-[var(--ca-secondary)] transition-colors"
        onNavigate={props.onNavigate}
        view="about"
      >
        <strong className="text-[var(--ca-text)] font-mono uppercase tracking-wider text-[11px] mb-[4px]">About Control Atlas</strong>
        <span className="text-[var(--ca-text-muted)] text-[13px]">What this tool is for, and where its answers come from.</span>
      </AppLink>
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
