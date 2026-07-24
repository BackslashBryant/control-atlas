import { Panel } from "./lsm";

export function LibrarySkeleton() {
  return (
    <Panel aria-busy="true" aria-label="Loading library" className="skeleton-container">
      <div className="skeleton-block skeleton-title" />
      <div className="skeleton-block skeleton-line wide" />
      <div className="skeleton-block skeleton-line" />
      <div className="skeleton-search" />
      <div className="grid gap-[16px]">
        {[1, 2, 3, 4, 5].map((index) => (
          <article className="p-[16px] border border-[var(--ca-border)] rounded-[3px] bg-[var(--ca-surface)] skeleton-card" key={index}>
            <div className="skeleton-block skeleton-line wide" />
            <div className="skeleton-block skeleton-line" />
            <div className="skeleton-block skeleton-line short" />
          </article>
        ))}
      </div>
    </Panel>
  );
}

export function DetailConnectionsSkeleton() {
  return (
    <Panel aria-busy="true" title="Loading connections">
      <p className="mb-[24px]">
        Search results are ready. Full connection maps and detail views finish
        loading in the background.
      </p>
      <div className="grid gap-[16px]">
        {[1, 2].map((index) => (
          <div className="p-[16px] border border-[var(--ca-border)] rounded-[3px] bg-[var(--ca-surface)] skeleton-card" key={index}>
            <div className="skeleton-block skeleton-line wide" />
            <div className="skeleton-block skeleton-line" />
          </div>
        ))}
      </div>
    </Panel>
  );
}
