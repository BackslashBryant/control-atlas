import { Fragment, useState, type ReactNode } from "react";

import { isValidSourceTextPresentation } from "../../shared/source-text-presentation.mjs";
import { Button } from "./lsm";
import { copyText, formatRelationshipLabel } from "../lib/pagePrimitives";

/**
 * Publisher-text rendering, shared by every surface that shows what a record
 * actually says.
 *
 * This used to live inside ObjectDetailPage, which is why the Atlas focused
 * record could only ever show a title and a connection count: the renderer for
 * the published statement was not reachable from there. Both surfaces now read
 * the same presentation contract through the same components, so a record says
 * the same thing wherever you meet it.
 */
const RECORD_FACT_LABELS: Record<string, string> = {
  activity_type: "Activity type",
  architecture_component: "Architecture component",
  benchmark_status_date: "Published status date",
  benchmark_title: "Benchmark",
  benchmark_version: "Version / release",
  child_count: "Contained records",
  collaborator: "Collaborator",
  component_class: "Component class",
  duration: "Duration",
  is_subtechnique: "Sub-technique",
  mapping_count: "Published mappings",
  operational_technology: "Operational technology",
  pillar: "Pillar",
  product: "Product",
  responsibility: "Responsibility",
  rule_id: "Rule ID",
  severity: "Severity",
  severity_distribution: "Severity distribution",
  stig_id: "STIG ID",
  tactic_title: "Tactic",
  vuln_id: "Finding / Vuln ID",
};

const ODP_PATTERN = /\[(?:Assignment|Selection)[^\]]*\]/g;

const PUBLISHER_INLINE_PATTERN = /(`[^`\n]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\)|\(Citation:\s*[^)]+\)|\[(?:Assignment|Selection)[^\]]*\])/g;

function renderOdpText(text: string): ReactNode {
  if (!text) return text;
  const parts = text.split(ODP_PATTERN);
  const matches = text.match(ODP_PATTERN) || [];
  if (matches.length === 0) return text;
  const nodes: ReactNode[] = [];
  parts.forEach((part, index) => {
    if (part) nodes.push(<Fragment key={`t-${index}`}>{part}</Fragment>);
    if (index < matches.length) {
      nodes.push(
        <span className="odp-param" key={`m-${index}`}>
          {matches[index]}
        </span>,
      );
    }
  });
  return nodes;
}

function renderPublisherInlineText(text: string): ReactNode {
  if (!text) return text;
  const parts = text.split(PUBLISHER_INLINE_PATTERN);
  return parts.map((part, index) => {
    if (!part) return null;
    if (/^\[(?:Assignment|Selection)[^\]]*\]$/.test(part)) {
      return <span className="odp-param" key={`odp-${index}`}>{part}</span>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code className="publisher-inline-code" key={`code-${index}`}>{part.slice(1, -1)}</code>;
    }
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (link) {
      return <a href={link[2]} key={`link-${index}`} rel="noopener noreferrer" target="_blank">{link[1]}</a>;
    }
    const citation = part.match(/^\(Citation:\s*([^)]+)\)$/);
    if (citation) {
      return <cite className="publisher-citation" key={`citation-${index}`}>Source: {citation[1]}</cite>;
    }
    return <Fragment key={`text-${index}`}>{part}</Fragment>;
  });
}

function CopyableCodeSnippet(props: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="source-code-snippet" data-source-code-snippet>
      <div className="source-code-snippet__header">
        <span>Command or configuration</span>
        <Button
          onClick={() => {
            void copyText(props.value).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            });
          }}
          type="button"
          variant="secondary"
        >
          {copied ? "Copied" : "Copy"}
        </Button>
        <span aria-live="polite" className="visually-hidden">
          {copied ? "Snippet copied to clipboard" : ""}
        </span>
      </div>
      <pre><code>{props.value}</code></pre>
    </div>
  );
}

function SourceTextBlocks(props: { value: string; presentation?: any }) {
  const text = String(props.value || "");
  const resolvedPresentation = isValidSourceTextPresentation(text, props.presentation)
    ? props.presentation
    : { version: 1, blocks: [{ kind: "paragraph", start: 0, end: text.length }] };
  const blocks = resolvedPresentation.blocks;
  const rendered: ReactNode[] = [];

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block.kind === "code") {
      rendered.push(
        <CopyableCodeSnippet
          key={`code-${block.start}-${index}`}
          value={text.slice(block.start, block.end)}
        />,
      );
      continue;
    }
    if (block.kind === "list") {
      const List = block.ordered ? "ol" : "ul";
      const followingCode = blocks[index + 1]?.kind === "code"
        ? blocks[index + 1]
        : null;
      rendered.push(
        <List
          className={`source-procedure-list${followingCode ? " source-procedure-list--with-code" : ""}`}
          key={`list-${index}`}
        >
          {block.items.map((item: any, itemIndex: number) => {
            const isCodeStep = Boolean(followingCode) && itemIndex === block.items.length - 1;
            return (
              <li className={isCodeStep ? "source-procedure-list__code-step" : undefined} key={`${item.start}-${itemIndex}`}>
                <span>{renderPublisherInlineText(text.slice(item.start, item.end))}</span>
                {isCodeStep && followingCode ? (
                  <CopyableCodeSnippet value={text.slice(followingCode.start, followingCode.end)} />
                ) : null}
              </li>
            );
          })}
        </List>,
      );
      if (followingCode) index += 1;
      continue;
    }
    rendered.push(
      <p key={`paragraph-${block.start}-${index}`}>{renderPublisherInlineText(text.slice(block.start, block.end))}</p>,
    );
  }

  return (
    <div className="source-text-blocks">{rendered}</div>
  );
}

function StructuredPublisherSections(props: { value: any[] }) {
  return (
    <div className="publisher-structured-sections">
      {props.value.map((section, sectionIndex) => (
        <section key={section.id || section.locator || sectionIndex}>
          {section.title ? <h3>{section.title}</h3> : null}
          {(section.structured_content || []).map((block: any, blockIndex: number) => {
            const key = `${section.id || sectionIndex}-${blockIndex}`;
            if (block.type === "ordered_list" || block.type === "unordered_list") {
              const List = block.type === "ordered_list" ? "ol" : "ul";
              return (
                <List className="source-structured-list" key={key}>
                  {(block.items || []).map((item: string, itemIndex: number) => (
                    <li key={`${key}-${itemIndex}`}>{renderPublisherInlineText(item)}</li>
                  ))}
                </List>
              );
            }
            if (block.type === "code") {
              return <CopyableCodeSnippet key={key} value={String(block.text || "")} />;
            }
            return <p key={key}>{renderPublisherInlineText(String(block.text || ""))}</p>;
          })}
        </section>
      ))}
    </div>
  );
}

export function SourceSectionContent(props: { kind: string; value: any; presentation?: any }) {
  if (props.kind === "structured") {
    return <StructuredPublisherSections value={props.value} />;
  }
  if (props.kind === "list") {
    return <ul className="source-structured-list">{props.value.map((item: string) => <li key={item}>{renderPublisherInlineText(item)}</li>)}</ul>;
  }
  if (props.kind === "references") {
    return (
      <ul className="source-structured-list">
        {props.value.map((reference: any, index: number) => {
          const parts = [reference.creator, reference.title, reference.version ? `Version ${reference.version}` : "", reference.index]
            .filter(Boolean);
          const label = parts.join(" · ");
          return (
            <li key={`${label}-${index}`}>
              {reference.location ? (
                <a href={reference.location} rel="noopener noreferrer" target="_blank">{label}</a>
              ) : label}
            </li>
          );
        })}
      </ul>
    );
  }
  if (props.kind === "publisher_mappings") {
    return (
      <ul className="source-structured-list">
        {props.value.map((mapping: any, index: number) => (
          <li key={`${mapping.target_catalog}:${mapping.target_id}:${index}`}>
            <strong>{mapping.target_catalog}</strong>{mapping.target_id ? ` · ${mapping.target_id}` : ""}
            {mapping.relationship_type ? ` · ${formatRelationshipLabel({ relationship_type: mapping.relationship_type })}` : ""}
          </li>
        ))}
      </ul>
    );
  }
  if (props.kind === "mapping_targets") {
    return (
      <ul className="source-structured-list">
        {props.value.map((mapping: any, index: number) => (
          <li key={`${mapping.kind}:${mapping.target_id}:${index}`}>
            <strong>{mapping.kind}</strong>{mapping.target_id ? ` · ${mapping.target_id}` : ""}
          </li>
        ))}
      </ul>
    );
  }
  if (props.kind === "objectives") {
    return (
      <ul className="assessment-objectives">
        {props.value.map((objective: any, index: number) => (
          <li key={objective.id || objective.label || index}>
            {objective.label ? <strong>{objective.label}</strong> : null}{" "}
            {renderOdpText(objective.prose)}
          </li>
        ))}
      </ul>
    );
  }
  if (props.kind === "methods") {
    return (
      <ul className="assessment-methods">
        {props.value.map((method: any, index: number) => (
          <li key={method.id || method.method || index}>
            <strong>{method.method}</strong>
            {method.objects?.length ? `: ${method.objects.join("; ")}` : null}
          </li>
        ))}
      </ul>
    );
  }
  if (props.kind === "countermeasures") {
    return (
      <div className="publisher-structured-sections">
        {props.value.map((group: any, index: number) => (
          <section key={`${(group.actors || []).join("-")}-${index}`}>
            <h3>{(group.actors || ["Unspecified"]).join(" · ")}</h3>
            <ul className="source-structured-list">
              {(group.actions || []).map((action: string, actionIndex: number) => (
                <li key={`${index}-${actionIndex}`}>{renderOdpText(action)}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }
  return <SourceTextBlocks value={String(props.value)} presentation={props.presentation} />;
}

export function RecordNativeFacts(props: { fields: string[]; metadata: Record<string, any>; title: string }) {
  const rows = props.fields.flatMap((field) => {
    const value = props.metadata[field];
    const absenceReason = props.metadata.field_absence_reasons?.[field];
    if ((value == null || value === "" || (Array.isArray(value) && value.length === 0)) && !absenceReason) return [];
    const displayValue = absenceReason
      ? `Not published — ${absenceReason}`
      : typeof value === "object"
      ? Object.entries(value).map(([key, count]) => `${key}: ${count}`).join(" · ")
      : String(value);
    return [{ field, displayValue }];
  });
  if (!rows.length) return null;
  return (
    <section className="record-native-facts" data-record-section="native-facts">
      <h2>{props.title}</h2>
      <dl className="record-source-facts">
        {rows.map(({ field, displayValue }) => (
          <div key={field}>
            <dt>{RECORD_FACT_LABELS[field] || field}</dt>
            <dd>{displayValue}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
