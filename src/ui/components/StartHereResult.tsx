import type { StartHereLibraryLink, StartHereRecommendations } from "../lib/startHereRecommendations.d.ts";

type StartHereResultProps = {
  recommendations: StartHereRecommendations;
  onFollowLibraryLink: (link: StartHereLibraryLink) => void;
  onRestart: () => void;
};

export function StartHereResult(props: StartHereResultProps) {
  const {
    recommendations,
    onFollowLibraryLink,
    onRestart,
  } = props;
  const { situation } = recommendations;
  return (
    <div className="start-here-result">
      <header className="start-here-result-hero">
        <p className="eyebrow">Source navigator</p>
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

      {recommendations.library.length ? (
        <section className="start-here-alternatives" aria-labelledby="source-catalogs-title">
          <h2 id="source-catalogs-title">Public sources to browse</h2>
          <div className="start-here-resource-list">
            {recommendations.library.map((link) => (
              <ResourceAction
                key={`${link.kind}-${link.kind === "library-catalog" ? link.catalogId : link.nodeId}`}
                label={link.label}
                onOpen={() => onFollowLibraryLink(link)}
                rationale={link.rationale}
              />
            ))}
          </div>
        </section>
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
