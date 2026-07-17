import { useMemo } from "react";

import {
  buildStartHereRecommendations,
  hasCompleteStartHereContext,
} from "../lib/startHereRecommendations.mjs";
import type {
  StartHereCompareLink,
  StartHereLibraryLink,
  StartHereRecommendations,
} from "../lib/startHereRecommendations.d.ts";
import type { ViewState } from "../lib/viewState";
import { StartHereResult } from "../components/StartHereResult";
import { GlossaryTermChip } from "../components/GlossaryTermChip";
import { PageHeader, SelectField } from "../lib/pagePrimitives";

export function StartHerePage(props: {
  state: Extract<ViewState, { view: "start-here" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  const { state, onNavigate } = props;
  const hasCompleteContext = hasCompleteStartHereContext(state);
  const showResults = state.step === "results" && hasCompleteContext;
  const activeStep = !state.systemType
    ? 1
    : !state.dataSensitivity
      ? 2
      : 3;

  const recommendations = useMemo(
    () =>
      showResults
        ? (buildStartHereRecommendations({
            systemType: state.systemType,
            dataSensitivity: state.dataSensitivity,
            environment: state.environment,
          }) as StartHereRecommendations | null)
        : null,
    [
      showResults,
      state.dataSensitivity,
      state.environment,
      state.systemType,
    ],
  );

  function followLibraryLink(link: StartHereLibraryLink) {
    if (link.kind === "library-catalog") {
      onNavigate("browse", { framework: link.catalogId });
      return;
    }
    onNavigate("library-detail", { node: link.nodeId, from: "start-here" });
  }

  function followCompareLink(link: StartHereCompareLink) {
    onNavigate("matrix", {
      workbench: link.workbench,
      ...link.patch,
    });
  }

  function restartQuestionnaire() {
    onNavigate("start-here", {
      step: "",
      systemType: "",
      dataSensitivity: "",
      environment: "",
    });
  }

  return (
    <section className="panel">
      <PageHeader
        eyebrow="Start Here"
        summary="Answer three short questions, then get a starting path with the framework, template, and playbook most likely to help first."
        title="Find the best place to start"
      />

      <div className="start-here-steps" aria-label="Start Here progress">
        <div
          className={`start-here-step ${activeStep >= 1 ? "active" : ""} ${state.systemType ? "done" : ""}`}
        >
          <span className="start-here-step-num">1</span>
          <span>System type</span>
        </div>
        <span className="start-here-step-connector" aria-hidden="true" />
        <div
          className={`start-here-step ${activeStep >= 2 ? "active" : ""} ${state.dataSensitivity ? "done" : ""}`}
        >
          <span className="start-here-step-num">2</span>
          <span>Data sensitivity</span>
        </div>
        <span className="start-here-step-connector" aria-hidden="true" />
        <div
          className={`start-here-step ${activeStep >= 3 ? "active" : ""} ${state.environment ? "done" : ""}`}
        >
          <span className="start-here-step-num">3</span>
          <span>Environment</span>
        </div>
      </div>

      <div className="filter-grid">
        <SelectField
          emptyLabel="Choose a system type"
          hint="What kind of system you are authorizing or assessing."
          label="System type"
          onChange={(value) =>
            onNavigate("start-here", { ...state, systemType: value, step: "" })
          }
          options={[
            { value: "Cloud SaaS", label: "Cloud SaaS" },
            { value: "Platform service", label: "Platform service" },
            { value: "On-premises", label: "On-premises" },
            { value: "Hybrid", label: "Hybrid" },
            { value: "Enterprise service", label: "Enterprise service" },
            { value: "Not sure", label: "Not sure" },
          ]}
          value={state.systemType}
        />
        <SelectField
          disabled={!state.systemType}
          emptyLabel="Choose a sensitivity level"
          hint="How sensitive the data handled by the system is."
          label="Data sensitivity"
          onChange={(value) =>
            onNavigate("start-here", {
              ...state,
              dataSensitivity: value,
              step: "",
            })
          }
          options={[
            { value: "Low", label: "Low" },
            { value: "Moderate", label: "Moderate" },
            { value: "High", label: "High" },
            { value: "CUI", label: "CUI" },
            { value: "Not sure", label: "Not sure" },
          ]}
          value={state.dataSensitivity}
        />
        <SelectField
          disabled={!state.dataSensitivity}
          emptyLabel="Choose an environment"
          hint="Who operates the system and under which federal context."
          label="Operational environment"
          onChange={(value) =>
            onNavigate("start-here", { ...state, environment: value, step: "" })
          }
          options={[
            { value: "Federal civilian", label: "Federal civilian" },
            { value: "DoD", label: "DoD" },
            { value: "Contractor", label: "Contractor" },
            { value: "CSP", label: "CSP" },
            { value: "Not sure", label: "Not sure" },
          ]}
          value={state.environment}
        />
      </div>

      <p className="field-hint start-here-glossary-hint">
        Not sure what <GlossaryTermChip termId="cui">CUI</GlossaryTermChip> or{" "}
        <GlossaryTermChip termId="csp">CSP</GlossaryTermChip> means? Focus or
        hover the term for a plain-language definition.
      </p>

      {state.systemType === "Not sure" ||
      state.dataSensitivity === "Not sure" ||
      state.environment === "Not sure" ? (
        <p className="field-hint" role="status">
          "Not sure" is fine — we will use a safe, common default and tell you
          exactly what we assumed in the result.
        </p>
      ) : null}

      {!showResults ? (
        <div className="card-actions">
          <button
            aria-describedby={
              hasCompleteContext ? undefined : "start-here-submit-hint"
            }
            className="primary"
            disabled={!hasCompleteContext}
            onClick={() =>
              onNavigate("start-here", { ...state, step: "results" })
            }
            type="button"
          >
            Show recommendation
          </button>
          {!hasCompleteContext ? (
            <p className="field-hint" id="start-here-submit-hint" role="status">
              Select all three answers to continue.
            </p>
          ) : null}
        </div>
      ) : null}

      {recommendations ? (
        <StartHereResult
          onFollowCompareLink={followCompareLink}
          onFollowLibraryLink={followLibraryLink}
          onNavigate={onNavigate}
          onRestart={restartQuestionnaire}
          recommendations={recommendations}
        />
      ) : !showResults ? (
        <section className="empty-state">
          <h2>Choose your context, then show a recommendation</h2>
          <p>
            Pick the options that best match your system. Click Show
            recommendation when you are ready for the next step.
          </p>
        </section>
      ) : null}
    </section>
  );
}
