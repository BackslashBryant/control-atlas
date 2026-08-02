import { IconArrowRight, IconSearch, IconSourceCode } from "@tabler/icons-react";

import treeSpine from "../../../data/curated/tree-spine.json";
import { Panel, Button } from "../components/lsm";
import { SOURCE_STARTING_POINTS } from "../lib/source-navigator.mjs";
import { PageHeader } from "../lib/pagePrimitives";
import type { ViewState } from "../lib/viewState";

// Navigation, not intake. Each row says where in the tree that kind of question
// lives and opens that limb — it does not classify the visitor's system, decide
// what applies to them, or imply an authorization outcome.
const SITUATIONS: { prompt: string; limbLabel: string; limbId: string }[] = [
  {
    prompt: "I need to know who signs, and under what authority.",
    limbLabel: "Governance",
    limbId: "atlas:LIMB-GOVERNANCE",
  },
  {
    prompt: "I need the control set my program is measured against.",
    limbLabel: "Compliance",
    limbId: "atlas:LIMB-COMPLIANCE",
  },
  {
    prompt: "I need the actual settings for a box, a server, or a service.",
    limbLabel: "Implementation",
    limbId: "atlas:LIMB-IMPLEMENTATION",
  },
  {
    prompt: "I need to know how impact levels are decided.",
    limbLabel: "Risk",
    limbId: "atlas:LIMB-RISK",
  },
  {
    prompt: "I need to know how the system is supposed to be built.",
    limbLabel: "Architecture",
    limbId: "atlas:LIMB-ARCHITECTURE",
  },
  {
    prompt: "I need to know what the adversary does, and what stops it.",
    limbLabel: "Threats & Defense",
    limbId: "atlas:LIMB-THREAT",
  },
];

const LIMB_IDS = new Set(treeSpine.limbs.map((limb) => limb.id));

export function StartHerePage(props: {
  state: Extract<ViewState, { view: "start-here" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  const { onNavigate } = props;
  const situations = SITUATIONS.filter((situation) =>
    LIMB_IDS.has(situation.limbId),
  );

  return (
    <Panel className="max-w-[70rem] mx-auto start-here-panel">
      <PageHeader
        eyebrow="Start here"
        summary="Pick the sentence closest to what you need. Each one opens the part of Control Atlas that covers it."
        title="What are you trying to work out?"
      />

      <section aria-labelledby="start-here-situations">
        <h2 id="start-here-situations">Common starting points</h2>
        <div className="catalog-index-list">
          {situations.map((situation) => (
            <button
              className="catalog-index-row"
              key={situation.limbId}
              onClick={() =>
                // atlasAxis must come too: the limb board only shows a limb's
                // catalogs on the framework axis, so without it the link lands
                // back on the full nine-limb board.
                onNavigate("atlas-map", {
                  atlasLimb: situation.limbId,
                  atlasAxis: "framework",
                })
              }
              type="button"
            >
              <span>
                <strong>{situation.prompt}</strong>
                <small>Opens {situation.limbLabel}.</small>
              </span>
              <IconArrowRight aria-hidden="true" size={18} />
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="source-starting-points">
        <h2 id="source-starting-points">Find the publication you need</h2>
        <p className="page-summary">
          Already know the publisher? Each link opens the
          records and relationships loaded from that publisher.
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
