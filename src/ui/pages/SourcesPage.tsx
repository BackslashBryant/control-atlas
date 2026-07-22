import * as Accordion from "@radix-ui/react-accordion";
import {
  IconArrowRight,
  IconBook2,
  IconClipboardList,
  IconCompass,
  IconExternalLink,
  IconFileDescription,
  IconGitCompare,
  IconInfoCircle,
  IconLink,
  IconMap,
  IconSearch,
  IconShieldCheck,
  IconSourceCode,
} from "@tabler/icons-react";
import { useMemo, useState, type ReactNode } from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import { buildConnectionInventory } from "../lib/connectionInventory.mjs";
import { patternsData } from "../../app/patterns-data.mjs";
import { groupRelationships } from "../../app/relationship-groups.mjs";
import { generateTemplate } from "../../app/template-engine.mjs";
import { sourceSyncLabel } from "../../shared/source-freshness.mjs";
import { sourceLinkFor } from "../graph/sourceLinks.ts";
import {
  ExpandableChipList,
  RelationshipGroupsSection,
} from "../components/ExpandableRelationshipGroup";
import { RelationshipExplorer } from "../components/RelationshipExplorer";
import { StickyDetailBar } from "../components/StickyDetailBar";
import { ProvenanceTerm } from "../components/ProvenanceTerm";
import { StartHereResult } from "../components/StartHereResult";
import {
  CatalogFilterBar,
  QuickIntentCard,
} from "../components/QuickIntentCard";
import {
  filterByCategoryAndQuery,
  groupItemsByCategory,
  PATTERN_CATEGORIES,
  RECOMMENDED_PATTERN_IDS,
  TEMPLATE_CATEGORIES,
} from "../lib/catalogGroups.mjs";
import {
  glossaryTermsForDocument,
  glossaryTermsForPattern,
  templatesForPatterns,
} from "../lib/glossarySearch.mjs";
import { buildStartHereRecommendations } from "../lib/startHereRecommendations.mjs";
import type {
  StartHereCompareLink,
  StartHereLibraryLink,
  StartHereRecommendations,
} from "../lib/startHereRecommendations.d.ts";
import { serializeHashUrl } from "../lib/hashRoutes";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";
import {
  DisclosurePanel,
  PageHeader,
  PageJumpNav,
  SelectField,
  SourceSummaryCard,
  SummaryCard,
  copyText,
  downloadTextFile,
  formatConfidence,
  formatRelationshipLabel,
  openAtlasMapForNode,
  sourceUsageSummary,
  sourceWarnings,
  PATTERN_RENAMES,
} from "../lib/pagePrimitives";

export function SourcesPage(props: {
  bundle: RuntimeBundle;
  state: Extract<ViewState, { view: "sources" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  const { bundle, state, onNavigate } = props;
  const [sourceQuery, setSourceQuery] = useState("");
  const sources = bundle.runtime.getSources({
    provenance_class: state.provenance || undefined,
    eligibility_status: state.eligibility || undefined,
    lifecycle_status: state.lifecycle || undefined,
    access_status: state.access || undefined,
  });
  const selectedSource = state.source
    ? bundle.runtime.getSource(state.source)
    : null;

  const distinct = (key: string) =>
    [
      ...new Set(
        bundle.runtime.dataset.sources
          .map((source: any) => source[key])
          .filter(Boolean),
      ),
    ] as string[];

  const groupedSources = useMemo(() => {
    const groups = new Map<string, any[]>();
    const normalizedQuery = sourceQuery.trim().toLowerCase();
    for (const source of sources.filter((entry: any) =>
      !normalizedQuery ||
      [entry.name, entry.display_name, entry.owner, entry.id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
    )) {
      const key = displayNameFor("provenance_class", source.provenance_class);
      const bucket = groups.get(key) || [];
      bucket.push(source);
      groups.set(key, bucket);
    }
    return [...groups.entries()].sort(([left], [right]) =>
      left.localeCompare(right),
    );
  }, [sourceQuery, sources]);

  const connectionInventory = useMemo(
    () =>
      buildConnectionInventory(
        bundle.runtime.dataset.nodes,
        bundle.runtime.dataset.edges,
      ),
    [bundle.runtime],
  );

  const knownGaps = useMemo(() => {
    const findings = bundle.runtime.getGraphHealth();
    const bySource = new Map<string, number>();
    for (const finding of findings) {
      bySource.set(finding.source_id, (bySource.get(finding.source_id) || 0) + 1);
    }
    return {
      total: findings.length,
      bySource: [...bySource.entries()].map(([sourceId, count]) => ({
        count,
        name: bundle.runtime.getSource(sourceId)?.name || sourceId,
      })),
    };
  }, [bundle.runtime]);

  return (
    <section className="panel">
      <PageHeader
        eyebrow="Sources"
        summary="Review what a source is, how Control Atlas uses it, and how much trust to place in the resulting public mapping."
        title="Review sources before you rely on a match"
      />

      {selectedSource ? (
        <section aria-labelledby="selected-source-heading" className="stack selected-source-focus" id="source-detail">
          <button className="link-action" onClick={() => onNavigate("sources", { ...state, source: "" })} type="button">
            ← Back to all sources
          </button>
          <div>
            <p className="eyebrow">Selected source</p>
            <h2 id="selected-source-heading">{selectedSource.name}</h2>
          </div>
          <SourceSummaryCard source={selectedSource} />
          <div className="card-actions">
            <a className="primary" href={selectedSource.artifact_url} rel="noopener noreferrer" target="_blank">
              Open the official source
            </a>
            <button className="secondary" onClick={() => onNavigate("atlas-map")} type="button">
              View in Atlas Map
            </button>
          </div>
          <SummaryCard title="How Control Atlas uses it">
            <p>{sourceUsageSummary(selectedSource)}.</p>
          </SummaryCard>
          <SummaryCard title="Trust and status" tone="trust">
            <p><ProvenanceTerm kind="provenance" value={selectedSource.provenance_class || "federal_published"} /></p>
            <p>{displayNameFor("lifecycle_status", selectedSource.lifecycle_status)} · {displayNameFor("access_status", selectedSource.access_status)}</p>
          </SummaryCard>
          <Accordion.Root className="accordion-root" collapsible type="single">
            <DisclosurePanel title="Advanced metadata" value="metadata">
              <div className="advanced-list">
                <div><span>Owner</span><strong>{selectedSource.owner}</strong></div>
                <div><span>Version</span><strong>{selectedSource.version}</strong></div>
                <div><span>Current as of</span><strong>{selectedSource.last_checked}</strong></div>
                <div><span>Update model</span><strong>{sourceSyncLabel(selectedSource.sync_model)}</strong></div>
                <div><span>Last imported</span><strong>{selectedSource.sync_model === "link_out" ? "Official link only — not hosted by Control Atlas" : selectedSource.last_imported}</strong></div>
                <div><span>Parser</span><strong>{selectedSource.metadata?.parser || "Not recorded"}</strong></div>
              </div>
            </DisclosurePanel>
          </Accordion.Root>
        </section>
      ) : (
      <div className="detail-grid">
      <div className="stack">
      <label className="field" htmlFor="source-search">
        <span>Search sources</span>
        <div className="search-input">
          <IconSearch aria-hidden="true" size={18} stroke={1.8} />
          <input id="source-search" onChange={(event) => setSourceQuery(event.target.value)} placeholder="NIST, FedRAMP, DISA, MITRE…" type="search" value={sourceQuery} />
        </div>
      </label>
      <details
        className="canonical-source-links"
        id="official-source-links"
      >
        <summary>Official source links</summary>
        <div className="disclosure-content">
        <p>
          Open the official source before relying on a control, mapping, threat
          technique, or defensive reference.
        </p>
        <ul>
          {[
            "fisma-44-usc-3551",
            "nist-sp-800-53-r5",
            "mitre-attack-enterprise",
            "mitre-d3fend",
          ].map((sourceId) => {
            const source = sourceLinkFor(sourceId);
            return (
              <li key={source.sourceId}>
                <a
                  href={source.canonicalUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {source.displayName}
                </a>
              </li>
            );
          })}
        </ul>
        </div>
      </details>

      <details
        className="connection-inventory"
        id="connection-inventory"
      >
        <summary>Connection inventory</summary>
        <div className="disclosure-content">
        <p>
          What Control Atlas currently loads and connects. These are build
          counts, not completeness scores.
        </p>
        <p className="connection-inventory-summary">
          <strong>{connectionInventory.totalRecords.toLocaleString()}</strong>{" "}
          records across {connectionInventory.rows.length} practical categories
          with{" "}
          <strong>
            {connectionInventory.publishedLinks.toLocaleString()}
          </strong>{" "}
          published links.
        </p>
        {/* Shallow: the one-line total above. Wading: the seven per-category
            rows, on request — five data points times seven categories was a
            wall of numbers as the page's default state. */}
        <details className="connection-inventory-details">
          <summary>
            Per-category counts ({connectionInventory.rows.length})
          </summary>
          <ul className="connection-inventory-list">
            {connectionInventory.rows.map((category) => (
              <li className="connection-inventory-row" key={category.id}>
                <strong>{category.label}</strong>
                <span>{category.totalRecords.toLocaleString()} records loaded</span>
                <span>
                  {category.connectedRecords.toLocaleString()} records connected
                </span>
                <span>
                  {category.publishedLinks.toLocaleString()} published links
                </span>
                <span className="connection-inventory-related">
                  Connects to: {category.relatedCategories.join(", ") || "none yet"}
                </span>
              </li>
            ))}
          </ul>
          {knownGaps.total > 0 ? (
            <p className="support-meta">
              <strong>{knownGaps.total} known upstream gaps:</strong>{" "}
              {knownGaps.bySource
                .map((entry) => `${entry.count} from ${entry.name}`)
                .join(", ")}
              . These rows cite an identifier the official data does not
              resolve yet. The gap is upstream, not an error on this site.
            </p>
          ) : null}
        </details>
        </div>
      </details>

      <section id="refine-sources">
      <Accordion.Root className="accordion-root" collapsible type="single">
        <DisclosurePanel title="Refine sources" value="filters">
          <div className="filter-grid">
            <SelectField
              emptyLabel="All source types"
              label="Source type"
              onChange={(value) =>
                onNavigate("sources", { ...state, provenance: value })
              }
              options={distinct("provenance_class").map((value) => ({
                value,
                label: displayNameFor("provenance_class", value),
              }))}
              value={state.provenance}
            />
            <SelectField
              emptyLabel="All map inclusion states"
              label="Included in map"
              onChange={(value) =>
                onNavigate("sources", { ...state, eligibility: value })
              }
              options={distinct("eligibility_status").map((value) => ({
                value,
                label: displayNameFor("eligibility_status", value),
              }))}
              value={state.eligibility}
            />
            <SelectField
              emptyLabel="All statuses"
              label="Status"
              onChange={(value) =>
                onNavigate("sources", { ...state, lifecycle: value })
              }
              options={distinct("lifecycle_status").map((value) => ({
                value,
                label: displayNameFor("lifecycle_status", value),
              }))}
              value={state.lifecycle}
            />
            <SelectField
              emptyLabel="All access levels"
              label="Access"
              onChange={(value) =>
                onNavigate("sources", { ...state, access: value })
              }
              options={distinct("access_status").map((value) => ({
                value,
                label: displayNameFor("access_status", value),
              }))}
              value={state.access}
            />
          </div>
        </DisclosurePanel>
      </Accordion.Root>
      </section>

      {groupedSources.length ? (
        <Accordion.Root
          className="accordion-root source-groups"
          collapsible
          defaultValue={groupedSources[0]?.[0] || ""}
          id="source-groups"
          type="single"
        >
          {groupedSources.map(([groupLabel, groupSources]) => (
            <DisclosurePanel
              key={groupLabel}
              title={`${groupLabel} (${groupSources.length})`}
              value={groupLabel}
            >
              <div className="stack">
                {groupSources.map((source: any) => (
                  <SourceSummaryCard
                    key={source.id}
                    onOpen={() =>
                      onNavigate("sources", { ...state, source: source.id })
                    }
                    source={source}
                  />
                ))}
              </div>
            </DisclosurePanel>
          ))}
        </Accordion.Root>
      ) : (
        <section className="empty-state">
          <h2>No sources match your search.</h2>
          <p>Try a publisher name such as NIST, DISA, FedRAMP, or MITRE.</p>
          <button className="primary" onClick={() => setSourceQuery("")} type="button">Clear source search</button>
        </section>
      )}
      </div>
      <aside className="detail-sidebar page-sidebar">
        <SummaryCard title="On this page">
          <PageJumpNav
            sections={[
              { id: "official-source-links", label: "Official source links" },
              {
                id: "connection-inventory",
                label: "Connection inventory",
                count: connectionInventory.rows.length,
              },
              { id: "refine-sources", label: "Refine sources" },
              selectedSource
                ? { id: "source-detail", label: "Source detail" }
                : {
                    id: "source-groups",
                    label: "All sources",
                    count: sources.length,
                  },
            ]}
          />
        </SummaryCard>
      </aside>
      </div>
      )}
    </section>
  );
}
