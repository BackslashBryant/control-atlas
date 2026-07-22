import type {
  StartHereCompareLink,
  StartHereLibraryLink,
  StartHereRecommendations,
} from "../lib/startHereRecommendations.d.ts";
import type { ViewState } from "../lib/viewState";
import { SummaryCard } from "../lib/pagePrimitives";

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

        <div className="stack">
          <div className="card-actions">
            <button
              className="secondary"
              onClick={onRestart}
              type="button"
            >
              Restart questionnaire
            </button>
          </div>

          <SummaryCard title="Your situation" tone="trust">
            <dl className="start-here-recap">
              <div className="start-here-recap-item">
                <dt>System</dt>
                <dd>{situation.answers.systemType}</dd>
              </div>
              <div className="start-here-recap-item">
                <dt>Data sensitivity</dt>
                <dd>{situation.answers.dataSensitivity}</dd>
              </div>
              <div className="start-here-recap-item">
                <dt>Environment</dt>
                <dd>{situation.answers.environment}</dd>
              </div>
            </dl>
            <p className="start-here-path">{situation.pathLabel}</p>
            <p>{situation.narrative}</p>
            {situation.assumptions.length > 0 ? (
              <ul className="start-here-assumptions">
                {situation.assumptions.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}
          </SummaryCard>

          <p className="start-here-disclaimer field-hint">
            This is a reference recommendation, not a compliance determination.
          </p>

          {primaryRecommendation ? (
            <SummaryCard title="Recommended next step">
              <p><strong>{primaryRecommendation.label}</strong></p>
              <p>{primaryRecommendation.rationale}</p>
              <div className="card-actions">
                <button
                  className="primary"
                  onClick={() => onFollowLibraryLink(primaryRecommendation)}
                  type="button"
                >
                  Open {primaryRecommendation.label}
                </button>
              </div>
            </SummaryCard>
          ) : null}

          <details className="start-here-alternatives">
            <summary>Other useful resources ({alternativeCount})</summary>
            <div className="stack start-here-alternative-content">
          {recommendations.library.length > 1 ? (
          <section className="stack">
            <div className="section-header">
              <h3>Other frameworks</h3>
            </div>
            <div className="stack compact">
              {recommendations.library.slice(1).map((link) => (
                <article
                  className="relationship-card"
                  key={`${link.kind}-${link.kind === "library-catalog" ? link.catalogId : link.nodeId}`}
                >
                  <div>
                    <button
                      className="card-title-action"
                      onClick={() => onFollowLibraryLink(link)}
                      type="button"
                    >
                      <strong>{link.label}</strong>
                    </button>
                    <p>{link.rationale}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
          ) : null}

          <section className="stack">
            <div className="section-header">
              <h3>Compare</h3>
              <p>Pre-filled comparison paths based on your answers.</p>
            </div>
            <div className="stack compact">
              {recommendations.compare.map((link) => (
                <article
                  className="relationship-card"
                  key={`compare-${link.workbench}-${link.label}`}
                >
                  <div>
                    <button
                      className="card-title-action"
                      onClick={() => onFollowCompareLink(link)}
                      type="button"
                    >
                      <strong>{link.label}</strong>
                    </button>
                    <p>{link.rationale}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="stack">
            <div className="section-header">
              <h3>Playbooks</h3>
              <p>
                Plain-language guides for concepts that often block progress.
              </p>
            </div>
            <div className="stack compact">
              {recommendations.patterns.map((link) => (
                <article className="relationship-card" key={link.patternId}>
                  <div>
                    <button
                      className="card-title-action"
                      onClick={() =>
                        onNavigate("patterns", { pattern: link.patternId })
                      }
                      type="button"
                    >
                      <strong>{link.label}</strong>
                    </button>
                    <p>{link.rationale}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="stack">
            <div className="section-header">
              <h3>Templates</h3>
              <p>Starter artifacts you can generate locally in your browser.</p>
            </div>
            <div className="stack compact">
              {recommendations.templates.map((link) => (
                <article className="relationship-card" key={link.templateType}>
                  <div>
                    <button
                      className="card-title-action"
                      onClick={() =>
                        onNavigate("templates", {
                          templateType: link.templateType,
                        })
                      }
                      type="button"
                    >
                      <strong>{link.label}</strong>
                    </button>
                    <p>{link.rationale}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
            </div>
          </details>
        </div>
      
  );
}
