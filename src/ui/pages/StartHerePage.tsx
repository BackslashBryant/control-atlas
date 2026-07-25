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
import { PageHeader } from "../lib/pagePrimitives";
import { Panel, Button, Select } from "../components/lsm";

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
      onNavigate("catalog-detail", { catalog: link.catalogId });
      return;
    }
    onNavigate("library-detail", { node: link.nodeId, from: "start-here" });
  }

  function followCompareLink(link: StartHereCompareLink) {
    onNavigate("matrix", {
      crosswalk: link.crosswalk,
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

  if (recommendations) {
    return (
      <Panel className="start-here-result-page">
        <StartHereResult
          onFollowCompareLink={followCompareLink}
          onFollowLibraryLink={followLibraryLink}
          onNavigate={onNavigate}
          onRestart={restartQuestionnaire}
          recommendations={recommendations}
        />
      </Panel>
    );
  }

  return (
    <Panel className="max-w-[70rem] mx-auto">
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

      <div className="start-here-question">
        {state.systemType && activeStep > 1 ? (
          <div className="flex justify-between items-center py-[12px] border-b border-[var(--ca-border)] mb-[16px]">
            <span className="text-[var(--ca-text-muted)] font-mono uppercase tracking-[0.06em] text-[11px]">System type</span>
            <strong className="text-[var(--ca-text)] font-medium text-[14px]">{state.systemType}</strong>
            <Button
              variant="secondary"
              className="!min-h-[32px] !text-[10px] !px-[8px]"
              onClick={() =>
                onNavigate("start-here", {
                  systemType: "",
                  dataSensitivity: "",
                  environment: "",
                  step: "",
                })
              }
            >
              Change
            </Button>
          </div>
        ) : null}
        {activeStep === 1 ? (
        <div className="start-here-step-body mb-[24px]">
        <Select
          label="System type"
          onChange={(event) =>
            onNavigate("start-here", { systemType: event.target.value, step: "" })
          }
          options={[
            { value: "", label: "Choose a system type" },
            { value: "Cloud SaaS", label: "Cloud SaaS" },
            { value: "Platform service", label: "Platform service" },
            { value: "On-premises", label: "On-premises" },
            { value: "Hybrid", label: "Hybrid" },
            { value: "Enterprise service", label: "Enterprise service" },
            { value: "Not sure", label: "Not sure" },
          ]}
          value={state.systemType || ""}
        />
        <div className="text-[var(--ca-text)] text-[12px] leading-relaxed p-[16px] bg-[var(--ca-surface-raised)] border border-[var(--ca-border-strong)] rounded-[3px]">
          <strong className="text-[var(--ca-text)]">Cloud SaaS:</strong> Fully hosted software (e.g., Salesforce, Google Workspace).<br/>
          <strong className="text-[var(--ca-text)]">Platform service:</strong> Cloud hosting environment (e.g., AWS EC2, Azure).<br/>
          <strong className="text-[var(--ca-text)]">On-premises:</strong> Servers in a datacenter you physically control.<br/>
          <strong className="text-[var(--ca-text)]">Enterprise service:</strong> Internal shared service (e.g., agency Active Directory).
        </div>
        </div>
        ) : null}
        {state.dataSensitivity && activeStep > 2 ? (
          <div className="flex justify-between items-center py-[12px] border-b border-[var(--ca-border)] mb-[16px]">
            <span className="text-[var(--ca-text-muted)] font-mono uppercase tracking-[0.06em] text-[11px]">Data sensitivity</span>
            <strong className="text-[var(--ca-text)] font-medium text-[14px]">{state.dataSensitivity}</strong>
            <Button
              variant="secondary"
              className="!min-h-[32px] !text-[10px] !px-[8px]"
              onClick={() =>
                onNavigate("start-here", {
                  dataSensitivity: "",
                  environment: "",
                  step: "",
                })
              }
            >
              Change
            </Button>
          </div>
        ) : null}
        {activeStep === 2 ? (
        <div className="start-here-step-body mb-[24px]">
        <Select
          label="Data sensitivity"
          onChange={(event) =>
            onNavigate("start-here", {
              dataSensitivity: event.target.value,
              step: "",
            })
          }
          options={[
            { value: "", label: "Choose a sensitivity level" },
            { value: "Low", label: "Low (Public data)" },
            { value: "Moderate", label: "Moderate (Internal data)" },
            { value: "High", label: "High (Mission critical/PII)" },
            { value: "CUI", label: "CUI (Controlled Unclassified Information)" },
            { value: "Not sure", label: "Not sure" },
          ]}
          value={state.dataSensitivity || ""}
        />
        <p className="text-[var(--ca-text-muted)] text-[12px]">How sensitive the data handled by the system is.</p>
        </div>
        ) : null}
        {activeStep === 3 ? (
        <div className="start-here-step-body mb-[24px]">
        <Select
          label="Operational environment"
          onChange={(event) =>
            onNavigate("start-here", { environment: event.target.value, step: "" })
          }
          options={[
            { value: "", label: "Choose an environment" },
            { value: "Federal civilian", label: "Federal civilian (FCEB)" },
            { value: "DoD", label: "DoD (Department of Defense)" },
            { value: "Contractor", label: "Contractor (Internal network)" },
            { value: "CSP", label: "CSP (Cloud Service Provider)" },
            { value: "Not sure", label: "Not sure" },
          ]}
          value={state.environment || ""}
        />
        <p className="text-[var(--ca-text-muted)] text-[12px]">Who operates the system and under which federal context.</p>
        </div>
        ) : null}
      </div>

      <p className="text-[var(--ca-text-muted)] text-[13px] mt-[24px]">
        Not sure what <GlossaryTermChip termId="cui">CUI</GlossaryTermChip> or{" "}
        <GlossaryTermChip termId="csp">CSP</GlossaryTermChip> means? Focus or
        hover the term for a plain-language definition.
      </p>

      {state.systemType === "Not sure" ||
      state.dataSensitivity === "Not sure" ||
      state.environment === "Not sure" ? (
        <p className="p-[12px] bg-[color-mix(in_srgb,var(--ca-warning)_20%,transparent)] border border-[color-mix(in_srgb,var(--ca-warning)_50%,transparent)] text-[var(--ca-text)] rounded-[3px] mt-[16px] text-[13px]" role="status">
          "Not sure" is fine — we will use a safe, common default and tell you
          exactly what we assumed in the result.
        </p>
      ) : null}

      {!showResults && state.environment ? (
        <div className="mt-[32px] pt-[24px] border-t border-[var(--ca-border)] flex justify-end">
          <Button
            variant="primary"
            onClick={() =>
              onNavigate("start-here", { step: "results" })
            }
          >
            Show recommendation
          </Button>
        </div>
      ) : null}

    </Panel>
  );
}
