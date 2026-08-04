import { IconArrowLeft, IconArrowRight, IconSearch } from "@tabler/icons-react";

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

function publicationName(bundle: RuntimeBundle | null, catalogId: string) {
  return bundle?.runtime?.getCatalogs?.()?.find((entry: any) => entry.id === catalogId)?.name || publicationNameFor(catalogId);
}

function PlanStep(props: {
  role: string;
  catalogId: string;
  bundle: RuntimeBundle | null;
  onOpen: () => void;
}) {
  const name = publicationName(props.bundle, props.catalogId);
  return (
    <button className="start-here-publication" onClick={props.onOpen} type="button">
      <span>
        <small>{props.role}</small>
        <strong>{name}</strong>
        <span>{catalogProfileFor(props.catalogId, name).synopsis}</span>
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
  const step = !state.goal ? 1 : !state.context ? 2 : 3;
  const update = (patch: Partial<StartHereState>) => onNavigate("start-here", { ...state, ...patch });

  return (
    <Panel className="max-w-[70rem] mx-auto start-here-panel" data-visual-identity="task-intake-compass">
      <PageHeader primary summary="Two quick choices produce a source-traceable starting plan. Your answers stay in the URL so Back, Forward, reload, and copied links preserve this step." title="Start here" />

      <ol aria-label="Start Here progress" className="start-here-progress">
        {["Goal", "Context", "Starting plan"].map((label, index) => {
          const number = index + 1;
          return <li aria-current={step === number ? "step" : undefined} className={step >= number ? "is-active" : ""} key={label}><span>{number}</span>{label}</li>;
        })}
      </ol>

      {state.goal ? (
        <div className="start-here-summary" aria-label="Your answers">
          <button onClick={() => update({ goal: "", context: "" })} type="button"><small>Goal</small><strong>{labelForGoal(state.goal)}</strong><span>Change</span></button>
          {state.context ? <button onClick={() => update({ context: "" })} type="button"><small>Context</small><strong>{labelForContext(state.context)}</strong><span>Change</span></button> : null}
        </div>
      ) : null}

      {step === 1 ? (
        <section aria-labelledby="start-here-goal" className="start-here-step">
          <h2 id="start-here-goal">1. What are you trying to do?</h2>
          <p>Choose the work in front of you. Control Atlas does not decide what applies to your system.</p>
          <div className="start-here-choice-grid">
            {START_HERE_GOALS.map((goal: { id: string; label: string }) => <button key={goal.id} onClick={() => update({ goal: goal.id, context: "" })} type="button"><span>{goal.label}</span><IconArrowRight aria-hidden="true" size={17} /></button>)}
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section aria-labelledby="start-here-context" className="start-here-step">
          <h2 id="start-here-context">2. What context do you already know?</h2>
          <p>This selects a sensible publication to open first. It is not a scoping determination.</p>
          <div className="start-here-choice-grid">
            {START_HERE_CONTEXTS.map((context: { id: string; label: string }) => <button key={context.id} onClick={() => update({ context: context.id })} type="button"><span>{context.label}</span><IconArrowRight aria-hidden="true" size={17} /></button>)}
          </div>
          <Button onClick={() => update({ goal: "", context: "" })} type="button" variant="secondary"><IconArrowLeft aria-hidden="true" size={17} />Back to goal</Button>
        </section>
      ) : null}

      {step === 3 && plan ? (
        <section aria-labelledby="start-here-plan" className="start-here-step start-here-plan">
          <p className="eyebrow">Your starting plan</p>
          <h2 id="start-here-plan">Start with {publicationName(bundle, plan.startWith.catalogId)}</h2>
          <p>Because you chose <strong>{labelForGoal(plan.goalId).toLocaleLowerCase()}</strong> for a <strong>{labelForContext(plan.contextId).toLocaleLowerCase()}</strong>, begin with this publication and keep the official source attached.</p>
          <p className="notice-inline">Control Atlas does not decide what applies to your system.</p>
          <div className="start-here-primary-destination">
            <span><small>Next destination</small><strong>{publicationName(bundle, plan.startWith.catalogId)} publication view</strong><span>Publisher structure, records, coverage status, and source links.</span></span>
            <Button onClick={() => onNavigate("catalog-detail", { catalog: plan.startWith.catalogId })} type="button" variant="primary">Open {publicationName(bundle, plan.startWith.catalogId)}<IconArrowRight aria-hidden="true" size={17} /></Button>
          </div>
          <div className="start-here-followups">
            <PlanStep bundle={bundle} catalogId={plan.thenReview.catalogId} onOpen={() => onNavigate("catalog-detail", { catalog: plan.thenReview.catalogId })} role="Then review" />
            <button className="start-here-publication" onClick={() => onNavigate(plan.action.view as ViewState["view"])} type="button"><span><small>Then act</small><strong>{plan.action.label}</strong><span>Continue with the selected goal still visible in this plan.</span></span><IconArrowRight aria-hidden="true" size={18} /></button>
          </div>
          <div className="card-actions">
            <Button onClick={() => update({ context: "" })} type="button" variant="secondary"><IconArrowLeft aria-hidden="true" size={17} />Back to context</Button>
            <Button onClick={() => update({ goal: "", context: "" })} type="button" variant="secondary">Start over</Button>
          </div>
        </section>
      ) : null}

      <div className="start-here-search-link"><Button onClick={() => onNavigate("search", { query: "" })} type="button" variant="secondary"><IconSearch aria-hidden="true" size={18} />Search the Library instead</Button></div>
    </Panel>
  );
}
