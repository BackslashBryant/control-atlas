import { IconArrowRight, IconSearch } from "@tabler/icons-react";

import {
  START_HERE_CONTEXTS,
  START_HERE_GOALS,
  labelForContext,
  labelForGoal,
  publicationNameFor,
  startingPlanFor,
} from "../../app/start-here-guide.mjs";
import { Panel, Button } from "../components/lsm";
import { catalogProfileFor } from "../lib/catalogProfiles";
import { PageHeader } from "../lib/pagePrimitives";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";

type StartHereState = Extract<ViewState, { view: "start-here" }>;

function PlanStep(props: {
  role: string;
  catalogId: string;
  bundle: RuntimeBundle | null;
  onOpen: () => void;
}) {
  const { role, catalogId, bundle, onOpen } = props;
  // Start here renders before the runtime bundle exists, so the static name
  // table is the source of truth and the bundle only refines it.
  const catalog = bundle?.runtime
    ?.getCatalogs?.()
    ?.find((entry: any) => entry.id === catalogId);
  const name = catalog?.name || publicationNameFor(catalogId);
  return (
    <button className="catalog-index-row" onClick={onOpen} type="button">
      <span>
        <small className="start-here-plan-role">{role}</small>
        <strong>{name}</strong>
        <small>{catalogProfileFor(catalogId, name).synopsis}</small>
      </span>
      <IconArrowRight aria-hidden="true" size={18} />
    </button>
  );
}

export function StartHerePage(props: {
  bundle?: RuntimeBundle | null;
  state: StartHereState;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  const { bundle = null, state, onNavigate } = props;
  const plan = startingPlanFor(state.goal, state.context);

  const update = (patch: Partial<StartHereState>) =>
    onNavigate("start-here", { ...state, ...patch });

  return (
    <Panel className="max-w-[70rem] mx-auto start-here-panel" data-visual-identity="task-intake-compass">
      <PageHeader
        primary
        summary="Answer two questions to get a starting point in the public material."
        title="Start here"
      />

      <section aria-labelledby="start-here-goal">
        <h2 id="start-here-goal">1. What are you trying to do?</h2>
        <div className="start-here-choices">
          {START_HERE_GOALS.map((goal: { id: string; label: string }) => (
            <button
              aria-pressed={state.goal === goal.id}
              className={
                state.goal === goal.id
                  ? "start-here-choice is-selected"
                  : "start-here-choice"
              }
              key={goal.id}
              onClick={() => update({ goal: goal.id })}
              type="button"
            >
              {goal.label}
            </button>
          ))}
        </div>
      </section>

      {state.goal ? (
        <section aria-labelledby="start-here-context">
          <h2 id="start-here-context">2. What context do you already know?</h2>
          <div className="start-here-choices">
            {START_HERE_CONTEXTS.map((context: { id: string; label: string }) => (
              <button
                aria-pressed={state.context === context.id}
                className={
                  state.context === context.id
                    ? "start-here-choice is-selected"
                    : "start-here-choice"
                }
                key={context.id}
                onClick={() => update({ context: context.id })}
                type="button"
              >
                {context.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {plan ? (
        <section aria-labelledby="start-here-plan" className="start-here-plan">
          <h2 id="start-here-plan">
            {labelForGoal(plan.goalId)} · {labelForContext(plan.contextId)}
          </h2>
          <p className="page-summary">
            These are places to start reading. Control Atlas does not decide
            what applies to your system.
          </p>
          <div className="catalog-index-list">
            <PlanStep
              bundle={bundle}
              catalogId={plan.startWith.catalogId}
              onOpen={() =>
                onNavigate("catalog-detail", {
                  catalog: plan.startWith.catalogId,
                })
              }
              role="Start with"
            />
            <PlanStep
              bundle={bundle}
              catalogId={plan.thenReview.catalogId}
              onOpen={() =>
                onNavigate("catalog-detail", {
                  catalog: plan.thenReview.catalogId,
                })
              }
              role="Then review"
            />
          </div>
          <div className="card-actions">
            <Button
              onClick={() =>
                onNavigate(plan.action.view as ViewState["view"])
              }
              type="button"
              variant="primary"
            >
              {plan.action.label}
            </Button>
            <Button
              onClick={() => update({ goal: "", context: "" })}
              type="button"
              variant="secondary"
            >
              Start over
            </Button>
          </div>
        </section>
      ) : null}

      <div className="card-actions">
        <Button
          onClick={() => onNavigate("search", { query: "" })}
          type="button"
          variant="secondary"
        >
          <IconSearch aria-hidden="true" size={18} />
          Search the Library
        </Button>
      </div>
    </Panel>
  );
}
