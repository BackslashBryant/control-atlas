import { IconArrowRight, IconSearch, IconSourceCode } from "@tabler/icons-react";

import { Panel, Button } from "../components/lsm";
import { SOURCE_STARTING_POINTS } from "../lib/source-navigator.mjs";
import { PageHeader } from "../lib/pagePrimitives";
import type { ViewState } from "../lib/viewState";

export function StartHerePage(props: {
  state: Extract<ViewState, { view: "start-here" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  const { onNavigate } = props;

  return (
    <Panel className="max-w-[70rem] mx-auto">
      <PageHeader
        eyebrow="Source starting points"
        summary="Open a public catalog or program publication already represented in Control Atlas. Each entry says why it is here."
        title="Start with a publication"
      />

      <section aria-labelledby="source-starting-points">
        <h2 id="source-starting-points">Available publications</h2>
        <p className="page-summary">
          Use this list when you already know the source you need. This is a
          source list—not a framework or baseline, and not an applicability
          recommendation.
        </p>
        <div className="catalog-index-list">
          {SOURCE_STARTING_POINTS.map((source) => (
            <button
              className="catalog-index-row"
              key={source.catalogId}
              onClick={() =>
                onNavigate("catalog-detail", { catalog: source.catalogId })
              }
              type="button"
            >
              <span>
                <strong>{source.label}</strong>
                <small>{source.inclusionReason}</small>
              </span>
              <IconArrowRight aria-hidden="true" size={18} />
            </button>
          ))}
        </div>
      </section>

      <div className="card-actions">
        <Button
          variant="primary"
          onClick={() => onNavigate("search", { query: "" })}
          type="button"
        >
          <IconSearch aria-hidden="true" size={18} />
          Search all records
        </Button>
        <Button
          variant="secondary"
          onClick={() => onNavigate("sources")}
          type="button"
        >
          <IconSourceCode aria-hidden="true" size={18} />
          Review the source register
        </Button>
      </div>
    </Panel>
  );
}
