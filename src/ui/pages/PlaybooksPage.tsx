import {
  IconActivityHeartbeat,
  IconAlertTriangle,
  IconArrowRight,
  IconArrowsExchange,
  IconChecklist,
  IconCloud,
  IconExternalLink,
  IconFiles,
  IconFlag,
  IconHierarchy3,
  IconRoute,
  IconSearch,
  IconSettings,
  IconShieldCheck,
} from "@tabler/icons-react";

import {
  learnArticleById,
  practitionerGuides,
} from "../../app/learn-content.mjs";
import { SITE_COPY } from "../../shared/site-copy.mjs";
import { Panel } from "../components/lsm";
import { AppLink } from "../components/AppLink";
import { BucketTag } from "../components/TaxonomyTag";
import { PageHeader, SummaryCard } from "../lib/pagePrimitives";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";

const GUIDE_PRESENTATION: Record<
  string,
  { area: string; Icon: typeof IconFlag }
> = Object.freeze({
  "starting-an-authorization": { area: "Governance", Icon: IconFlag },
  "understanding-rmf": { area: "Governance", Icon: IconRoute },
  "selecting-controls": { area: "Compliance", Icon: IconChecklist },
  "implementing-controls": { area: "Implementation", Icon: IconSettings },
  "preparing-evidence": { area: "Assessment", Icon: IconFiles },
  "conducting-assessments": { area: "Assessment", Icon: IconSearch },
  "managing-findings": { area: "Operations", Icon: IconAlertTriangle },
  "continuous-monitoring": { area: "Operations", Icon: IconActivityHeartbeat },
  "inheritance-and-common-controls": { area: "Architecture", Icon: IconHierarchy3 },
  reciprocity: { area: "Governance", Icon: IconArrowsExchange },
  "cloud-and-shared-responsibility": { area: "Architecture", Icon: IconCloud },
  "stig-lifecycle": { area: "Implementation", Icon: IconShieldCheck },
});

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
      <section
        aria-labelledby="guides-title"
        className="ca-page guides-directory"
        data-page-template="directory"
        data-template="F"
        data-visual-identity="practitioner-field-manual"
      >
        <PageHeader
          primary
          summary={SITE_COPY.routes.guides.purpose}
          title={<span id="guides-title">Guides</span>}
        />
        <section aria-label="Practitioner guides" className="learn-article-grid">
          {practitionerGuides.map((article, index) => {
            const presentation = GUIDE_PRESENTATION[article.id];
            if (!presentation) {
              throw new Error(`Missing Guide presentation for ${article.id}.`);
            }
            const { Icon } = presentation;
            return (
              <AppLink
                className="guide-card"
                data-guide-area={presentation.area}
                data-guide-step={index + 1}
                key={article.id}
                onNavigate={onNavigate}
                patch={{ pattern: article.id }}
                view="patterns"
              >
                <span aria-hidden="true" className="guide-card__icon">
                  <Icon size={22} stroke={1.8} />
                </span>
                <span className="guide-card__body">
                  <span className="guide-card__meta">
                    <span className="guide-card__step">Step {String(index + 1).padStart(2, "0")}</span>
                    <BucketTag area={presentation.area}>{presentation.area}</BucketTag>
                  </span>
                  <strong>{article.title}</strong>
                  <small>{article.summary}</small>
                </span>
                <IconArrowRight aria-hidden="true" className="guide-card__arrow" size={18} />
              </AppLink>
            );
          })}
        </section>

        <div className="card-actions">
          <AppLink onNavigate={onNavigate} variant="secondary" view="about">
            How to use Control Atlas
          </AppLink>
        </div>
      </section>
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
