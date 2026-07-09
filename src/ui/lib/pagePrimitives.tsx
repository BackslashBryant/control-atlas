import * as Accordion from "@radix-ui/react-accordion";
import { IconArrowRight } from "@tabler/icons-react";
import type { ReactNode } from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import { ProvenanceTerm } from "../components/ProvenanceTerm";
import type { ViewState } from "./viewState";

export const PATTERN_RENAMES: Record<string, string> = {
  "csp-inheritance": "Using FedRAMP Inheritance",
  "shared-responsibility": "What Your Cloud Provider Owns vs What You Own",
  "reciprocity-basics": "Reusing Prior Authorization Work",
  "conmon-cadence": "Keeping Authorization Evidence Current",
  "boundary-patterns": "Defining the Right Authorization Boundary",
  "boe-reuse": "Packaging Evidence for Reuse",
};

export function openAtlasMapForNode(
  navigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void,
  nodeId: string,
) {
  navigate("atlas-map", { node: nodeId });
}

export function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(value);
  }
  const area = document.createElement("textarea");
  area.value = value;
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  area.remove();
  return Promise.resolve();
}

export function downloadBlobFile(
  filename: string,
  blob: Blob,
  onDispatch?: () => void,
) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  // Fire confirmation from the real anchor-click dispatch so the toast tracks
  // the actual download, not just a successful generate (CATL-V2/67).
  onDispatch?.();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadTextFile(
  filename: string,
  content: string,
  mimeType: string,
  onDispatch?: () => void,
) {
  downloadBlobFile(
    filename,
    new Blob([content], { type: mimeType }),
    onDispatch,
  );
}

export function sourceTrustSummary(source: any) {
  if (!source) {
    return "Source pending.";
  }
  if (source.provenance_class === "inferred") {
    return "Needs review before relying on it.";
  }
  if (
    source.provenance_class === "federal_published" ||
    source.provenance_class === "official"
  ) {
    return "Official source.";
  }
  if (source.provenance_class?.includes("published")) {
    return "Source-backed.";
  }
  return "Source-backed.";
}

export function sourceUsageSummary(source: any) {
  return source?.graph_eligible && source?.eligibility_status === "eligible"
    ? "Used in map: Yes"
    : "Used in map: No";
}

export function sourceWarnings(source: any) {
  const warnings: string[] = [];
  if (!source) {
    return warnings;
  }
  if (!source.graph_eligible || source.eligibility_status === "excluded") {
    warnings.push("This source is not used in the public map by default.");
  }
  if (
    source.lifecycle_status === "deprecated" ||
    source.lifecycle_status === "draft"
  ) {
    warnings.push(
      "This source is old or draft content. Review it carefully before reusing it.",
    );
  }
  if (source.access_status !== "public") {
    warnings.push(
      "Access restrictions may limit what can be verified from this source.",
    );
  }
  return warnings;
}

export function formatRelationshipLabel(edge: any) {
  return displayNameFor("relationship_type", edge.relationship_type);
}

export function formatConfidence(value: string) {
  return displayNameFor("confidence", value);
}

export function PageHeader(props: {
  eyebrow?: string;
  title: string;
  summary?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header">
      {props.eyebrow ? <p className="eyebrow">{props.eyebrow}</p> : null}
      <div className="page-header-row">
        <div>
          <h1>{props.title}</h1>
          {props.summary ? (
            <p className="page-summary">{props.summary}</p>
          ) : null}
        </div>
        {props.action ? (
          <div className="page-header-action">{props.action}</div>
        ) : null}
      </div>
    </header>
  );
}

export function SummaryCard(props: {
  title: string;
  children: ReactNode;
  tone?: "default" | "trust" | "warning";
}) {
  return (
    <article className={`summary-card tone-${props.tone || "default"}`}>
      <span className="summary-card-title">{props.title}</span>
      <div>{props.children}</div>
    </article>
  );
}

export function Badge(props: {
  children: ReactNode;
  tone?: "default" | "info" | "warning" | "success";
}) {
  return (
    <span className={`badge tone-${props.tone || "default"}`}>
      {props.children}
    </span>
  );
}

export function SourceSummaryCard(props: { source: any; onOpen?: () => void }) {
  const { source, onOpen } = props;
  return (
    <article className="result-card source-card">
      <div className="result-card-header">
        <div>
          <p className="result-meta">Source</p>
          <h3>{source.display_name || source.name}</h3>
        </div>
        <Badge tone={source.graph_eligible ? "success" : "warning"}>
          {sourceUsageSummary(source)}
        </Badge>
      </div>
      <p className="result-summary">
        {source.name} is maintained by {source.owner}.
      </p>
      <div className="source-summary-grid">
        <ProvenanceTerm
          kind="provenance"
          value={source.provenance_class || ""}
        />
        <ProvenanceTerm
          kind="trust"
          label={displayNameFor("lifecycle_status", source.lifecycle_status)}
          value={source.lifecycle_status}
        />
        <ProvenanceTerm
          kind="trust"
          label={displayNameFor("access_status", source.access_status)}
          value={source.access_status}
        />
      </div>
      {sourceWarnings(source).length ? (
        <div className="warning-list">
          {sourceWarnings(source).map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}
      <div className="card-actions">
        {onOpen ? (
          <button className="primary" onClick={onOpen} type="button">
            View source details
          </button>
        ) : null}
        <a
          className="secondary"
          href={source.artifact_url}
          rel="noopener noreferrer"
          target="_blank"
        >
          Open source artifact
        </a>
      </div>
    </article>
  );
}

export function DisclosurePanel(props: {
  value: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Accordion.Item className="accordion-item" value={props.value}>
      <Accordion.Header>
        <Accordion.Trigger className="accordion-trigger">
          <span>{props.title}</span>
          <IconArrowRight size={18} stroke={1.8} />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="accordion-content">
        {props.children}
      </Accordion.Content>
    </Accordion.Item>
  );
}
export function Field(props: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{props.label}</span>
      {props.children}
    </label>
  );
}

export function SelectField(props: {
  emptyLabel?: string;
  hint?: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const fieldId = `field-${props.label.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`;

  return (
    <label className="field" htmlFor={fieldId}>
      <span>{props.label}</span>
      <select
        disabled={props.disabled}
        id={fieldId}
        onChange={(event) => props.onChange(event.target.value)}
        value={props.value}
      >
        <option value="">{props.emptyLabel || "All"}</option>
        {props.options.map((option) => (
          <option key={`${props.label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {props.hint ? <p className="field-hint">{props.hint}</p> : null}
    </label>
  );
}
