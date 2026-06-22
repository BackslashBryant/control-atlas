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

          <div className="summary-grid">
            <SummaryCard title="What this is" tone="trust">
              <p>
                This is a reference recommendation. It is not a compliance
                determination.
              </p>
            </SummaryCard>
          </div>

          <section className="stack">
            <div className="section-header">
              <h2>Explore</h2>
              <p>Framework catalogs and baselines to open first.</p>
            </div>
            <div className="stack compact">
              {recommendations.library.map((link) => (
                <article
                  className="relationship-card"
                  key={`${link.kind}-${link.kind === "library-catalog" ? link.catalogId : link.nodeId}`}
                >
                  <div>
                    <strong>{link.label}</strong>
                    <p>{link.rationale}</p>
                  </div>
                  <button
                    className="secondary"
                    onClick={() => onFollowLibraryLink(link)}
                    type="button"
                  >
                    Open in Explore
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="stack">
            <div className="section-header">
              <h2>Compare</h2>
              <p>Pre-filled comparison paths based on your answers.</p>
            </div>
            <div className="stack compact">
              {recommendations.compare.map((link) => (
                <article
                  className="relationship-card"
                  key={`compare-${link.workbench}-${link.label}`}
                >
                  <div>
                    <strong>{link.label}</strong>
                    <p>{link.rationale}</p>
                  </div>
                  <button
                    className="secondary"
                    onClick={() => onFollowCompareLink(link)}
                    type="button"
                  >
                    Open Compare
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="stack">
            <div className="section-header">
              <h2>Playbooks</h2>
              <p>
                Plain-language guides for concepts that often block progress.
              </p>
            </div>
            <div className="stack compact">
              {recommendations.patterns.map((link) => (
                <article className="relationship-card" key={link.patternId}>
                  <div>
                    <strong>{link.label}</strong>
                    <p>{link.rationale}</p>
                  </div>
                  <button
                    className="secondary"
                    onClick={() =>
                      onNavigate("patterns", { pattern: link.patternId })
                    }
                    type="button"
                  >
                    Read pattern
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="stack">
            <div className="section-header">
              <h2>Templates</h2>
              <p>Blank artifacts you can generate locally in your browser.</p>
            </div>
            <div className="stack compact">
              {recommendations.templates.map((link) => (
                <article className="relationship-card" key={link.templateType}>
                  <div>
                    <strong>{link.label}</strong>
                    <p>{link.rationale}</p>
                  </div>
                  <button
                    className="primary"
                    onClick={() =>
                      onNavigate("templates", {
                        templateType: link.templateType,
                      })
                    }
                    type="button"
                  >
                    Generate {link.label}
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>
      
  );
}
