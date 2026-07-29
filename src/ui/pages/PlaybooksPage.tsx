import { IconArrowRight, IconBook2, IconExternalLink } from "@tabler/icons-react";

import {
  learnArticleById,
  learnArticles,
} from "../../app/learn-content.mjs";
import { Button, Panel } from "../components/lsm";
import { PageHeader, SummaryCard } from "../lib/pagePrimitives";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";

export function PlaybooksPage(props: {
  bundle: RuntimeBundle | null;
  state: Extract<ViewState, { view: "patterns" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNodeByItemId: (itemId: string) => void;
  onOpenGlossary: (termId?: string) => void;
  setHelpOpen: (open: boolean) => void;
}) {
  const { state, onNavigate } = props;
  const selected = learnArticleById(state.pattern);

  if (!selected) {
    return (
      <Panel>
        <PageHeader
          eyebrow="Learn"
          summary="Control Atlas explanations for reading source identity, structure, search, mappings, records, and starter documents."
          title="Learn"
        />
        <section aria-label="Learning articles" className="learn-article-grid">
          {learnArticles.map((article) => (
            <button
              key={article.id}
              onClick={() => onNavigate("patterns", { pattern: article.id })}
              type="button"
            >
              <IconBook2 aria-hidden="true" size={20} />
              <span>
                <strong>{article.title}</strong>
                <small>{article.summary}</small>
              </span>
              <IconArrowRight aria-hidden="true" size={18} />
            </button>
          ))}
        </section>
      </Panel>
    );
  }

  return (
    <Panel>
      <PageHeader
        action={
          <Button
            onClick={() => onNavigate("patterns", { pattern: "" })}
            type="button"
            variant="secondary"
          >
            Back to Learn
          </Button>
        }
        eyebrow="Control Atlas explanation"
        summary={selected.summary}
        title={selected.title}
      />
      <div className="learn-article">
        <SummaryCard title="Explanation">
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
        <Button
          onClick={() =>
            onNavigate(
              selected.nextAction.view as ViewState["view"],
              selected.nextAction.patch as Partial<ViewState> | undefined,
            )
          }
          type="button"
          variant="primary"
        >
          {selected.nextAction.label}
        </Button>
      </div>
    </Panel>
  );
}
