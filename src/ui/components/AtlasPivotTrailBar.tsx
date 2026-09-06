import { IconArrowNarrowRight, IconX } from "@tabler/icons-react";

import type { AtlasPivotLabel } from "../lib/atlasPivotTrail";

type AtlasPivotTrailBarProps = {
  steps: AtlasPivotLabel[];
  /** Where the reader is now, so the trail ends somewhere real. */
  currentLabel: string;
  onReturn: (index: number) => void;
  onClear: () => void;
};

/**
 * The route across frameworks, which the scope breadcrumb cannot show.
 *
 * The breadcrumb below answers "where am I in this framework?" — it walks
 * down from the publisher. This answers the other question a reader has after
 * following two or three crosswalks: "how did I get here, and how do I get
 * back?" Those are different paths, so they are different trails; folding a
 * sideways move into a downward breadcrumb would claim an ancestry that does
 * not exist.
 */
export function AtlasPivotTrailBar(props: AtlasPivotTrailBarProps) {
  const { steps, currentLabel, onReturn, onClear } = props;
  if (!steps.length) return null;

  return (
    <nav aria-label="Frameworks you crossed to get here" className="atlas-pivot-trail">
      <p className="atlas-pivot-trail__lede">Crosswalk route</p>
      <ol>
        {steps.map((step, index) => (
          <li key={`${step.publicationId}:${index}`}>
            <button
              onClick={() => onReturn(index)}
              title={
                step.recordLabel
                  ? `Back to ${step.recordLabel} in ${step.label}`
                  : `Back to ${step.label}`
              }
              type="button"
            >
              <span className="atlas-pivot-trail__name">{step.label}</span>
              {step.recordLabel ? (
                <span className="atlas-pivot-trail__record">{step.recordLabel}</span>
              ) : null}
            </button>
            <IconArrowNarrowRight
              aria-hidden="true"
              className="atlas-pivot-trail__arrow"
              size={15}
              stroke={2}
            />
          </li>
        ))}
        <li>
          <span aria-current="page" className="atlas-pivot-trail__current">
            {currentLabel}
          </span>
        </li>
      </ol>
      <button className="atlas-pivot-trail__clear" onClick={onClear} type="button">
        <IconX aria-hidden="true" size={13} stroke={2.2} />
        Clear route
      </button>
    </nav>
  );
}
