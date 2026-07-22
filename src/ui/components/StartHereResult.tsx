import type {
  StartHereCompareLink,
  StartHereLibraryLink,
  StartHereRecommendations,
} from "../lib/startHereRecommendations.d.ts";
import type { ViewState } from "../lib/viewState";

type StartHereResultProps = {
  recommendations: StartHereRecommendations;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onFollowLibraryLink: (link: StartHereLibraryLink) => void;
  onFollowCompareLink: (link: StartHereCompareLink) => void;
  onRestart: () => void;
};

export function StartHereResult(props: StartHereResultProps) {
  const {
    recommendations,
    onNavigate,
    onFollowLibraryLink,
    onFollowCompareLink,
    onRestart,
  } = props;
  const { situation } = recommendations;
  const primaryRecommendation = recommendations.library[0];
  const alternativeCount =
    Math.max(0, recommendations.library.length - 1) +
    recommendations.compare.length +
    recommendations.patterns.length +
    recommendations.templates.length;

  return (
    <div className="start-here-result">
      <header className="start-here-result-hero">
        <p className="eyebrow">Your starting point</p>
        <h1>{situation.pathLabel}</h1>
        <p className="start-here-result-summary">{situation.narrative}</p>

        <div className="start-here-based-on">
          <span>Based on</span>
          <strong>{situation.answers.systemType}</strong>
          <strong>{situation.answers.dataSensitivity}</strong>
          <strong>{situation.answers.environment}</strong>
          <button className="link-action" onClick={onRestart} type="button">
            Change answers
          </button>
        </div>

        {situation.assumptions.length ? (
          <ul className="start-here-assumptions">
            {situation.assumptions.map((note) => <li key={note}>{note}</li>)}
          </ul>
        ) : null}
      </header>

      {primaryRecommendation ? (
        <section className="start-here-primary" aria-labelledby="start-here-primary-title">
          <p className="eyebrow">Recommended next step</p>
          <h2 id="start-here-primary-title">{primaryRecommendation.label}</h2>
          <p>{primaryRecommendation.rationale}</p>
          <button className="primary" onClick={() => onFollowLibraryLink(primaryRecommendation)} type="button">
            View {primaryRecommendation.label}
          </button>
          <p className="field-hint">This is a starting reference, not a compliance or applicability determination.</p>
        </section>
      ) : null}

      {alternativeCount ? (
        <details className="start-here-alternatives">
          <summary>Related guides, documents, and comparisons ({alternativeCount})</summary>
          <div className="start-here-resource-list">
            {recommendations.library.slice(1).map((link) => (
              <ResourceAction
                key={`${link.kind}-${link.kind === "library-catalog" ? link.catalogId : link.nodeId}`}
                label={link.label}
                onOpen={() => onFollowLibraryLink(link)}
                rationale={link.rationale}
              />
            ))}
            {recommendations.compare.map((link) => (
              <ResourceAction key={`compare-${link.label}`} label={link.label} onOpen={() => onFollowCompareLink(link)} rationale={link.rationale} />
            ))}
            {recommendations.patterns.map((link) => (
              <ResourceAction key={link.patternId} label={link.label} onOpen={() => onNavigate("patterns", { pattern: link.patternId })} rationale={link.rationale} />
            ))}
            {recommendations.templates.map((link) => (
              <ResourceAction key={link.templateType} label={link.label} onOpen={() => onNavigate("templates", { templateType: link.templateType })} rationale={link.rationale} />
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

function ResourceAction(props: { label: string; rationale: string; onOpen: () => void }) {
  return (
    <article className="start-here-resource-row">
      <button className="card-title-action" onClick={props.onOpen} type="button">
        {props.label}
      </button>
      <p>{props.rationale}</p>
    </article>
  );
}
