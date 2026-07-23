export function LibrarySkeleton() {
  return (
    <section aria-busy="true" aria-label="Loading library" className="panel skeleton-container">
      <div className="skeleton-block skeleton-title" />
      <div className="skeleton-block skeleton-line wide" />
      <div className="skeleton-block skeleton-line" />
      <div className="skeleton-search" />
      <div className="stack">
        {[1, 2, 3, 4, 5].map((index) => (
          <article className="result-card skeleton-card" key={index}>
            <div className="skeleton-block skeleton-line wide" />
            <div className="skeleton-block skeleton-line" />
            <div className="skeleton-block skeleton-line short" />
          </article>
        ))}
      </div>
    </section>
  );
}

export function DetailConnectionsSkeleton() {
  return (
    <section aria-busy="true" className="notice">
      <h2>Loading connections</h2>
      <p>
        Search results are ready. Full connection maps and detail views finish
        loading in the background.
      </p>
      <div className="stack">
        {[1, 2].map((index) => (
          <div className="skeleton-card" key={index}>
            <div className="skeleton-block skeleton-line wide" />
            <div className="skeleton-block skeleton-line" />
          </div>
        ))}
      </div>
    </section>
  );
}
