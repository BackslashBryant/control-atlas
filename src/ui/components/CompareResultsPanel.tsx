import * as Accordion from "@radix-ui/react-accordion";

import { displayNameFor } from "../../app/display-names.mjs";
import { SourceRefList } from "../lib/compareHelpers";
import { SelectField } from "../lib/pagePrimitives";
import { Button } from "./lsm";
import { RecordLink } from "./RecordLink";

type SelectOption = { value: string; label: string };

type CompareResultsPanelProps = {
  currentPage: number;
  mappingCount: number;
  mappingSourceOptions: SelectOption[];
  onBack: () => void;
  onExport: (format: "csv" | "markdown" | "json") => void;
  onMappingSourceChange: (value: string) => void;
  onOpenNode: (nodeId: string) => void;
  onPageChange: (page: number) => void;
  onRelationshipTypeChange: (value: string) => void;
  pageCount: number;
  pageSize: number;
  relationshipType: string;
  relationshipTypeOptions: SelectOption[];
  rows: any[];
  selectedMappingSource: string;
  sourceLabel: string;
  targetLabel: string;
  totalSourceRows: number;
};

export function CompareResultsPanel(props: CompareResultsPanelProps) {
  const rangeStart = props.totalSourceRows
    ? (props.currentPage - 1) * props.pageSize + 1
    : 0;
  const rangeEnd = Math.min(
    props.currentPage * props.pageSize,
    props.totalSourceRows,
  );
  const singleSource = props.mappingSourceOptions.length === 1
    ? props.mappingSourceOptions[0]
    : null;

  return (
    <section
      className="compare-results-panel"
      data-control-results
      id="compare-results"
    >
      <header className="compare-results-head">
        <div>
          <span className="label">03 / RESULTS</span>
          <h2 id="compare-active-step">
            {props.sourceLabel} <span aria-hidden="true">↔</span>{" "}
            {props.targetLabel}
          </h2>
          <p className="compare-mapping-total">
            {props.mappingCount.toLocaleString()} published mapping
            {props.mappingCount === 1 ? "" : "s"}
          </p>
        </div>
        <Button onClick={props.onBack} type="button" variant="secondary">
          Change target
        </Button>
      </header>

      {singleSource ? (
        <p className="compare-crosswalk-source">
          <span>Crosswalk source</span>
          <strong>{singleSource.label}</strong>
        </p>
      ) : props.mappingSourceOptions.length > 1 ? (
        <div className="compare-crosswalk-filter">
          <SelectField
            emptyLabel="All published sources"
            label="Crosswalk source"
            onChange={props.onMappingSourceChange}
            options={props.mappingSourceOptions}
            value={props.selectedMappingSource}
          />
        </div>
      ) : null}

      {props.rows.length ? (
        <>
          <p aria-live="polite" className="compare-range">
            Showing {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()} of{" "}
            {props.totalSourceRows.toLocaleString()} source records
          </p>
          <div className="compare-table-scroll">
            <table aria-label="Published crosswalk mappings" className="detail-table">
              <thead>
                <tr>
                  <th scope="col">From</th>
                  <th scope="col">Maps to</th>
                </tr>
              </thead>
              <tbody>
                {props.rows.map((row) => (
                  <tr key={row.from_id || row.from_item_id}>
                    <td data-label="From">
                      <RecordLink
                        nodeId={row.from_id}
                        onOpenNode={props.onOpenNode}
                      >
                        <strong>{row.from_item_id}</strong>
                      </RecordLink>
                      <span className="compare-record-title">{row.from_title}</span>
                    </td>
                    <td data-label="Maps to">
                      <ul className="target-mapping-list">
                        {row.targets.map((target: any) => (
                          <li
                            className="target-mapping-item"
                            key={target.edge_id || `${row.from_id}-${target.to_id}`}
                          >
                            <div>
                              <RecordLink
                                nodeId={target.to_id}
                                onOpenNode={props.onOpenNode}
                              >
                                <strong>{target.to_item_id}</strong>
                              </RecordLink>
                              <span className="target-item-title">{target.to_title}</span>
                            </div>
                            {target.relationship_type &&
                            target.relationship_type !== "maps_to" ? (
                              <span className="target-mapping-relationship">
                                {displayNameFor(
                                  "relationship_type",
                                  target.relationship_type,
                                )}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                      <details className="mapping-row-details">
                        <summary>
                          Evidence for {row.targets.length.toLocaleString()} mapping
                          {row.targets.length === 1 ? "" : "s"}
                        </summary>
                        <div className="mapping-evidence-list">
                          {row.targets.map((target: any) => (
                            <section
                              aria-label={`Evidence for ${target.to_item_id}`}
                              key={`evidence-${target.edge_id || target.to_id}`}
                            >
                              <strong>{target.to_item_id}</strong>
                              <SourceRefList refs={target.source_refs} />
                            </section>
                          ))}
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <section className="empty-state compare-results-empty">
          <h3>No published mappings match this results filter.</h3>
          <p>Clear the results filter to return to every published mapping.</p>
          <Button
            onClick={() => props.onRelationshipTypeChange("")}
            type="button"
            variant="primary"
          >
            Clear results filter
          </Button>
        </section>
      )}

      {props.pageCount > 1 ? (
        <nav aria-label="Mapping result pages" className="pagination">
          <Button
            disabled={props.currentPage === 1}
            onClick={() => props.onPageChange(Math.max(1, props.currentPage - 1))}
            type="button"
            variant="secondary"
          >
            Previous
          </Button>
          <span>Page {props.currentPage} of {props.pageCount}</span>
          <Button
            disabled={props.currentPage === props.pageCount}
            onClick={() =>
              props.onPageChange(Math.min(props.pageCount, props.currentPage + 1))
            }
            type="button"
            variant="secondary"
          >
            Next
          </Button>
        </nav>
      ) : null}

      <p className="compare-decision-boundary" role="note">
        A published crosswalk shows a cited relationship; it does not by itself establish equivalence or compliance.
      </p>

      <Accordion.Root className="accordion-root compare-refine" collapsible type="single">
        <Accordion.Item className="disclosure-item" value="refine-results">
          <Accordion.Header className="disclosure-header">
            <Accordion.Trigger className="disclosure-trigger">
              <span aria-hidden="true" className="disclosure-chevron">▾</span>
              <span>Refine results</span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="disclosure-content">
            <div className="compare-refine-fields">
              <SelectField
                emptyLabel="All connection types"
                label="Connection type"
                onChange={props.onRelationshipTypeChange}
                options={props.relationshipTypeOptions}
                value={props.relationshipType}
              />
              <div className="compare-export-actions">
                <span className="field-label">Export</span>
                <div className="actions">
                  <Button onClick={() => props.onExport("csv")} type="button" variant="secondary">
                    CSV
                  </Button>
                  <Button onClick={() => props.onExport("markdown")} type="button" variant="secondary">
                    Markdown
                  </Button>
                  <Button onClick={() => props.onExport("json")} type="button" variant="secondary">
                    JSON
                  </Button>
                </div>
              </div>
            </div>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </section>
  );
}
