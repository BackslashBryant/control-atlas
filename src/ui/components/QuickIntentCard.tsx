import type { ReactNode } from "react";

export function QuickIntentCard(props: {
  title: string;
  body: string;
  icon: ReactNode;
  actionLabel?: string;
  onClick: () => void;
}) {
  return (
    <button
      className="intent-card intent-card-button"
      onClick={props.onClick}
      type="button"
    >
      <div className="intent-icon">{props.icon}</div>
      <span className="intent-card-title">{props.title}</span>
      <span className="intent-card-body">{props.body}</span>
      {props.actionLabel ? (
        <span className="intent-card-action-hint">{props.actionLabel}</span>
      ) : null}
    </button>
  );
}

export function CompareStepIndicator(props: { step: 1 | 2 | 3; label: string }) {
  const steps = [
    { n: 1, text: "Choose comparison" },
    { n: 2, text: "Set inputs" },
    { n: 3, text: "Review results" },
  ] as const;

  return (
    <nav aria-label={props.label} className="compare-stepper">
      <ol className="compare-stepper-list">
        {steps.map((entry) => (
          <li
            className={
              entry.n === props.step
                ? "compare-step active"
                : entry.n < props.step
                  ? "compare-step complete"
                  : "compare-step"
            }
            key={entry.n}
          >
            <span className="compare-step-number">{entry.n}</span>
            <span>{entry.text}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function CatalogFilterBar(props: {
  category: string;
  categoryOptions: string[];
  countLabel: string;
  onCategoryChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  query: string;
  queryPlaceholder: string;
}) {
  return (
    <div className="catalog-filter-bar">
      <p className="catalog-filter-summary">{props.countLabel}</p>
      <div className="catalog-filter-controls">
        <label className="field grow catalog-search-field">
          <span>Search</span>
          <input
            className="catalog-search-input"
            onChange={(event) => props.onQueryChange(event.target.value)}
            placeholder={props.queryPlaceholder}
            type="search"
            value={props.query}
          />
        </label>
      </div>
      <div
        aria-label="Filter by category"
        className="category-chip-row"
        role="group"
      >
        <button
          className={props.category ? "chip chip-filter" : "chip chip-filter active"}
          onClick={() => props.onCategoryChange("")}
          type="button"
        >
          All categories
        </button>
        {props.categoryOptions.map((option) => (
          <button
            className={
              props.category === option ? "chip chip-filter active" : "chip chip-filter"
            }
            key={option}
            onClick={() => props.onCategoryChange(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
