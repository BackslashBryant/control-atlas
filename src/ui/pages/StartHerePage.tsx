import { useMemo } from "react";

import { buildStartHereRecommendations } from "../lib/startHereRecommendations.mjs";
import type {
  StartHereCompareLink,
  StartHereLibraryLink,
  StartHereRecommendations,
} from "../lib/startHereRecommendations.d.ts";
import type { ViewState } from "../lib/viewState";
import { StartHereResult } from "../components/StartHereResult";
import { PageHeader, SelectField } from "../lib/pagePrimitives";

export function StartHerePage(props: {
  state: Extract<ViewState, { view: "start-here" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  const { state, onNavigate } = props;
  const showResults = state.step === "results";

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
        summary="Answer three short questions, then get a plain-language starting path with the framework, template, and pattern links most likely to help first."
        title="Find the best place to start"
      />

      <div className="filter-grid">
        <SelectField
          emptyLabel="Any system type"
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
          ]}
          value={state.systemType}
        />
        <SelectField
          emptyLabel="Any sensitivity level"
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
          ]}
          value={state.dataSensitivity}
        />
        <SelectField
          emptyLabel="Any environment"
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
          ]}
          value={state.environment}
        />
      </div>

      {!showResults ? (
        <div className="card-actions">
          <button
            className="primary"
            onClick={() =>
              onNavigate("start-here", { ...state, step: "results" })
            }
            type="button"
          >
            Show recommendation
          </button>
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
            Pick the options that best match your system. Use &quot;Any&quot;
            when you are not sure yet. Click Show recommendation when you are
            ready for the next step.
          </p>
        </section>
      ) : null}
    </section>
  );
}

