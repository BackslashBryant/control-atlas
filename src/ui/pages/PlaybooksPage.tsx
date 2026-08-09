import { IconArrowRight, IconBook2, IconExternalLink } from "@tabler/icons-react";

import {
  learnArticleById,
  practitionerGuides,
} from "../../app/learn-content.mjs";
import { Panel } from "../components/lsm";
import { AppLink } from "../components/AppLink";
import { PageHeader, SummaryCard } from "../lib/pagePrimitives";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";

export function PlaybooksPage(props: {
  bundle: RuntimeBundle | null;
  state: Extract<ViewState, { view: "patterns" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNodeByItemId: (itemId: string) => void;
  onOpenGlossary: (termId?: string) => void;
}) {
  const { state, onNavigate } = props;
  const selected = learnArticleById(state.pattern);

  if (!selected) {
    return (
      <Panel data-visual-identity="practitioner-field-manual">
        <PageHeader
          primary
          summary="Practitioner guides for authorization, control selection, assessment, findings, and monitoring."
          title="Guides"
        />
        <section aria-label="Practitioner guides" className="learn-article-grid">
          {practitionerGuides.map((article) => (
            <AppLink
              key={article.id}
              onNavigate={onNavigate}
              patch={{ pattern: article.id }}
              view="patterns"
            >
              <IconBook2 aria-hidden="true" size={20} />
              <span>
                <strong>{article.title}</strong>
                <small>{article.summary}</small>
              </span>
              <IconArrowRight aria-hidden="true" size={18} />
            </AppLink>
          ))}
        </section>

        <div className="card-actions">
          <AppLink onNavigate={onNavigate} variant="secondary" view="about">
            How to use Control Atlas
          </AppLink>
        </div>
      </Panel>
    );
  }

  return (
    <Panel data-visual-identity="practitioner-field-manual">
      <PageHeader
        action={
          <AppLink onNavigate={onNavigate} patch={{ pattern: "" }} variant="secondary" view="patterns">
            Back to Guides
          </AppLink>
        }
        eyebrow={selected.kind === "practitioner" ? "Practitioner guide" : "Control Atlas explanation"}
        summary={selected.summary}
        title={selected.title}
      />
      <div className="learn-article">
        {selected.whereItSits ? (
          <SummaryCard title="Where it sits">
            <p>{selected.whereItSits}</p>
          </SummaryCard>
        ) : null}
        {selected.whenItMatters ? (
          <SummaryCard title="When it matters">
            <p>{selected.whenItMatters}</p>
          </SummaryCard>
        ) : null}
        <SummaryCard title="What this means">
          <p>{selected.explanation}</p>
        </SummaryCard>
        <SummaryCard title="Limitations" tone="warning">
          <p>{selected.limitations}</p>
        </SummaryCard>
        <section aria-labelledby="learn-citations">
          <h2 id="learn-citations">Official references</h2>
          <ul>
            {selected.citations.map((citation) => (
              <li key={citation.url}>
                <a href={citation.url} rel="noopener noreferrer" target="_blank">
                  {citation.label}
                  <IconExternalLink aria-hidden="true" size={14} />
                </a>
                <p>
                  <strong>Supports:</strong> {citation.supports}
                </p>
              </li>
            ))}
          </ul>
        </section>
        <AppLink
          onNavigate={onNavigate}
          patch={selected.nextAction.patch as Partial<ViewState> | undefined}
          variant="primary"
          view={selected.nextAction.view as ViewState["view"]}
        >
          {selected.nextAction.label}
        </AppLink>
      </div>
    </Panel>
  );
}
