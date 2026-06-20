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
      <h2>{props.title}</h2>
      <p>{props.body}</p>
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
        <label className="field grow">
          <span>Search</span>
          <input
            onChange={(event) => props.onQueryChange(event.target.value)}
            placeholder={props.queryPlaceholder}
            type="search"
            value={props.query}
          />
        </label>
        <SelectFieldInline
          label="Category"
          onChange={props.onCategoryChange}
          options={[
            { value: "", label: "All categories" },
            ...props.categoryOptions.map((option) => ({
              value: option,
              label: option,
            })),
          ]}
          value={props.category}
        />
      </div>
    </div>
  );
}

function SelectFieldInline(props: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <select
        onChange={(event) => props.onChange(event.target.value)}
        value={props.value}
      >
        {props.options.map((option) => (
          <option key={`${props.label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
