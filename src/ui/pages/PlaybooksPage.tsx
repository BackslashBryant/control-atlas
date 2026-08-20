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
import { AppLink } from "../components/AppLink";
import { BucketTag } from "../components/TaxonomyTag";
import { TaxonomyTagLinks } from "../components/ContextualTaxonomyLinks";
import { PageHeader, PageJumpNav } from "../lib/pagePrimitives";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";

const GUIDE_PRESENTATION: Record<
  string,
  { area: string; Icon: typeof IconFlag; tagIds?: string[] }
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
  "cloud-and-shared-responsibility": { area: "Architecture", Icon: IconCloud, tagIds: ["environment.cloud"] },
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
  const selectedPresentation = selected ? GUIDE_PRESENTATION[selected.id] : null;
  const selectedIndex = selected
    ? practitionerGuides.findIndex((article) => article.id === selected.id)
    : -1;

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

  const guideSections = [
    ...(selected.whenItMatters
      ? [{ id: "guide-when-it-matters", label: "When it matters" }]
      : []),
    { id: "guide-what-this-means", label: "What this means" },
    { id: "guide-limitations", label: "Limitations" },
    { id: "guide-references", label: "Official references" },
  ];

  return (
    <section
      className="ca-page guide-article"
      data-page-template="knowledge-base"
      data-visual-identity="practitioner-field-manual"
    >
      <nav aria-label="Guide context" className="card-actions">
        <AppLink onNavigate={onNavigate} patch={{ pattern: "" }} variant="secondary" view="patterns">
          Back to Guides
        </AppLink>
        {selectedIndex >= 0 ? (
          <span className="support-meta">
            Guide {String(selectedIndex + 1).padStart(2, "0")} of {practitionerGuides.length}
            {selectedPresentation ? ` / ${selectedPresentation.area}` : ""}
          </span>
        ) : null}
      </nav>
      <PageHeader
        eyebrow={selected.kind === "practitioner" ? "Practitioner guide" : "Control Atlas explanation"}
        summary={selected.summary}
        title={selected.title}
      />
      <div className="about-layout">
        <article className="learn-article">
          {selected.whenItMatters ? (
            <section id="guide-when-it-matters">
              <h2>When it matters</h2>
              <p>{selected.whenItMatters}</p>
            </section>
          ) : null}
          <section id="guide-what-this-means">
            <h2>What this means</h2>
            <p>{selected.explanation}</p>
          </section>
          <aside aria-labelledby="guide-limitations" className="summary-card tone-warning">
            <h2 className="summary-card-title" id="guide-limitations">Limitations</h2>
            <div><p>{selected.limitations}</p></div>
          </aside>
          <section id="guide-references">
            <h2>Official references</h2>
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
          {selectedPresentation?.tagIds?.length ? (
            <section className="ca-contextual-taxonomy" aria-label={`Related Library tags for ${selected.title}`}>
              <h2>Explore related Library records</h2>
              <p>
                These tags link to related records for this topic. They don't mean every one applies to your system.
              </p>
              <TaxonomyTagLinks onNavigate={onNavigate} tagIds={selectedPresentation.tagIds} />
            </section>
          ) : null}
          <div className="actions">
            <AppLink
              onNavigate={onNavigate}
              patch={selected.nextAction.patch as Partial<ViewState> | undefined}
              variant="primary"
              view={selected.nextAction.view as ViewState["view"]}
            >
              {selected.nextAction.label}
            </AppLink>
          </div>
        </article>

        <aside aria-label="Guide contents and source" className="about-toc">
          <p className="label">On this page</p>
          <PageJumpNav ariaLabel="Jump to guide section" sections={guideSections} />
          {selected.whereItSits ? (
            <>
              <p className="label">Context</p>
              <p>{selected.whereItSits}</p>
            </>
          ) : null}
          <p className="label">Source</p>
          <p>{selected.citations.map((citation) => citation.label).join("; ")}</p>
        </aside>
      </div>
    </section>
  );
}
