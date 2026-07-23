import * as Accordion from "@radix-ui/react-accordion";
import { IconArrowRight } from "@tabler/icons-react";
import type { ReactNode } from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import {
  sourceCurrentAsOf,
  sourceFreshness,
  sourceSyncLabel,
} from "../../shared/source-freshness.mjs";
import { ProvenanceTerm } from "../components/ProvenanceTerm";
import type { ViewState } from "./viewState";

export const PATTERN_RENAMES: Record<string, string> = {
  "rmf-lifecycle": "Plan Work Across the RMF Lifecycle",
  "ato-vs-atc": "ATO vs. Network Connection Approval",
  "csp-inheritance": "Using FedRAMP Inheritance",
  "shared-responsibility": "What Your Cloud Provider Owns vs What You Own",
  "reciprocity-basics": "Reusing Prior Authorization Work",
  "reciprocity-failures": "Why Prior Assessments Get Rejected",
  "control-inheritance": "Using Controls Your Provider Already Runs",
  "common-control-provider": "Providing Controls Other Systems Can Inherit",
  "enterprise-inheritance": "Using Agency Identity, Logging, and Monitoring Services",
  "conmon-cadence": "Keeping Authorization Evidence Current",
  "boundary-patterns": "Defining the Right Authorization Boundary",
  "boe-reuse": "Packaging Evidence for Reuse",
  "poam-concepts": "Managing a POA&M and Residual Risk",
  "evidence-patterns": "Choosing Evidence an Assessor Can Use",
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
    return "Published by the named source.";
  }
  return "Supporting source.";
}

export function sourceUsageSummary(source: any) {
  return source?.graph_eligible && source?.eligibility_status === "eligible"
    ? "Its published records and mappings appear in search, comparison, and Atlas connections"
    : "Control Atlas links to this source for reference but does not import its records into Atlas connections";
}

export function sourceWarnings(source: any) {
  const warnings: string[] = [];
  if (!source) {
    return warnings;
  }
  if (!source.graph_eligible || source.eligibility_status === "excluded") {
    warnings.push(
      "This source is linked for reference; its records are not imported into Atlas connections.",
    );
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
  if (sourceFreshness(source).is_stale) {
    warnings.push(sourceCurrentAsOf(source));
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

export function jumpToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) {
    return;
  }
  scrollElementBelowHeader(el);
  el.tabIndex = -1;
  el.focus({ preventScroll: true });
}

export function scrollElementBelowHeader(
  element: HTMLElement,
  behavior: "auto" | "smooth" = "smooth",
) {
  const header = document.querySelector<HTMLElement>(".site-header:not([hidden])");
  const safeOffset = (header?.getBoundingClientRect().height || 0) + 12;
  window.scrollTo({
    behavior,
    top: Math.max(
      0,
      window.scrollY + element.getBoundingClientRect().top - safeOffset,
    ),
  });
}

export function PageJumpNav(props: {
  sections: Array<{ id: string; label: string; count?: number }>;
  ariaLabel?: string;
  onJump?: (id: string) => void;
}) {
  return (
    <nav
      aria-label={props.ariaLabel || "On this page"}
      className="connection-group-nav page-jump-nav"
    >
      <ul>
        {props.sections.map((section) => (
          <li key={section.id}>
            <button
              aria-label={`Jump to ${section.label}`}
              className="connection-group-nav-link"
              onClick={() => (props.onJump || jumpToSection)(section.id)}
              type="button"
            >
              <span>{section.label}</span>
              {section.count != null ? (
                <strong>{section.count.toLocaleString()}</strong>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function CardTitle(props: {
  children: ReactNode;
  id?: string;
  onOpen?: () => void;
  href?: string;
}) {
  if (props.onOpen) {
    return (
      <h3 className="card-title">
        <button
          id={props.id}
          className="card-title-action"
          onClick={props.onOpen}
          type="button"
        >
          {props.children}
        </button>
      </h3>
    );
  }
  if (props.href) {
    return (
      <h3 className="card-title">
        <a
          id={props.id}
          className="card-title-action"
          href={props.href}
          rel="noreferrer"
          target="_blank"
        >
          {props.children}
        </a>
      </h3>
    );
  }
  return <h3 className="card-title" id={props.id}>{props.children}</h3>;
}

export function SourceSummaryCard(props: { source: any; onOpen?: () => void }) {
  const { source, onOpen } = props;
  return (
    <article className="result-card source-card">
      <div className="result-card-header">
        <div>
          <p className="result-meta">Source</p>
          {/* The specific name is the title. `display_name` is a family label
              ("DISA STIG", "SP 800-53 Rev. 5") shared by many records — nine
              sources rendered as identical "DISA STIG" cards when it was used
              as the title, which read as duplicate records. */}
          <CardTitle onOpen={onOpen}>
            {source.name || source.display_name}
          </CardTitle>
        </div>
        {source.display_name && source.display_name !== source.name ? (
          <Badge>{source.display_name}</Badge>
        ) : null}
      </div>
      <p className="result-summary">Maintained by {source.owner}.</p>
      <p className="support-meta">
        {sourceSyncLabel(source.sync_model)} ·{" "}
        {sourceFreshness(source).is_stale
          ? `Last checked ${source.last_checked}`
          : sourceCurrentAsOf(source)}
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
        <a
          className="secondary"
          href={source.artifact_url}
          rel="noopener noreferrer"
          target="_blank"
        >
          Open the original source
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
      <Accordion.Header asChild>
        <h2>
        <Accordion.Trigger className="accordion-trigger">
          <span>{props.title}</span>
          <IconArrowRight size={18} stroke={1.8} />
        </Accordion.Trigger>
        </h2>
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
