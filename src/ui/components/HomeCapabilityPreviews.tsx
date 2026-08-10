import {
  IconArrowRight,
  IconBinaryTree,
  IconChecklist,
  IconRadar,
} from "@tabler/icons-react";

import type { ViewState } from "../lib/viewState";
import { AppLink } from "./AppLink";

type Navigate = (
  view: ViewState["view"],
  patch?: Partial<ViewState>,
) => void;

const PREVIEWS = [
  {
    id: "source-chain",
    eyebrow: "Published chain",
    title: "Trace a supply-chain requirement",
    description:
      "Open SP 800-171 3.17.1 with its publisher, structural path, official text, and cited connections intact.",
    detail: "SP 800-171 · Supply Chain Risk Management · 3.17.1",
    action: "Open the record",
    icon: IconBinaryTree,
    view: "library-detail",
    patch: {
        node: "nist-800-171:3.17.1",
    },
  },
  {
    id: "threat-defense",
    eyebrow: "Threat and defense",
    title: "Follow a software supply-chain technique",
    description:
      "Start with ATT&CK T1195.002, then inspect only the defensive relationships MITRE or another publisher actually records.",
    detail: "ATT&CK · Initial Access · T1195.002",
    action: "Open Atlas map",
    icon: IconRadar,
    view: "atlas-map",
    patch: {
        node: "mitre-attack:T1195.002",
        relationshipView: "map",
    },
  },
  {
    id: "working-output",
    eyebrow: "Working output",
    title: "Prepare an assessment",
    description:
      "Move through the published inputs, readiness checks, and starter documents for assessment planning.",
    detail: "Task · Prepare for a security assessment",
    action: "Open the task",
    icon: IconChecklist,
    view: "templates",
    patch: {
        buildSection: "tasks",
        task: "prepare-security-assessment",
    },
  },
] as const;

export function HomeCapabilityPreviews(props: { onNavigate: Navigate }) {
  return (
    <section
      aria-labelledby="home-capabilities-title"
      className="home-capability-previews"
    >
      <header className="home-capability-header">
        <p className="eyebrow">What you can do here</p>
        <h2 id="home-capabilities-title">Source, connection, next action</h2>
      </header>
      <div className="home-capability-grid">
        {PREVIEWS.map((preview) => {
          const Icon = preview.icon;
          return (
            <article
              className={`home-capability-preview home-capability-preview--${preview.id}`}
              key={preview.id}
            >
              <div className="home-capability-icon" aria-hidden="true">
                <Icon size={22} stroke={1.7} />
              </div>
              <div className="home-capability-copy">
                <p className="home-capability-eyebrow">{preview.eyebrow}</p>
                <h3>{preview.title}</h3>
                <p>{preview.description}</p>
                <small>{preview.detail}</small>
              </div>
              <AppLink
                className="home-capability-action"
                onNavigate={props.onNavigate}
                patch={preview.patch}
                view={preview.view}
              >
                {preview.action}
                <IconArrowRight aria-hidden="true" size={16} stroke={2} />
              </AppLink>
            </article>
          );
        })}
      </div>
    </section>
  );
}
