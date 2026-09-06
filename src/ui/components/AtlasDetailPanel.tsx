import { type CSSProperties } from "react";
import { IconArrowRight } from "@tabler/icons-react";

export type AtlasPanelLink = {
  id: string;
  label: string;
  count: number;
  /** Shown under the name when the link needs qualifying. */
  note?: string;
  areaToken?: string;
  onOpen?: () => void;
};

export type AtlasPanelSubject = {
  /** What kind of thing this is, in the reader's words. */
  eyebrow: string;
  title: string;
  blurb: string;
  areaToken: string;
  facts: { label: string; value: string }[];
  /** Named lists — members, crosswalks, whatever the subject actually has. */
  sections: { heading: string; note?: string; links: AtlasPanelLink[] }[];
  action?: { label: string; onOpen: () => void };
};

type AtlasDetailPanelProps = {
  subject: AtlasPanelSubject | null;
  /** Shown when nothing is selected — never an empty column. */
  restingTitle: string;
  restingBlurb: string;
  restingFacts: { label: string; value: string }[];
  /**
   * What the current grouping could not file, named beside the map instead of
   * in small print beneath it. At rest this column was a 129px card in a 574px
   * space; these are the footnotes that belong in it.
   */
  restingSections?: { heading: string; note?: string; links: AtlasPanelLink[] }[];
};

/**
 * What the reader last pointed at, beside the map rather than instead of it.
 *
 * The map carries shape, size and connection; this carries the words. Keeping
 * them in one view is the point — the earlier version put the words on a
 * different screen, so learning what something was cost you the picture you
 * were reading it from. Nothing here navigates: every link changes what the
 * panel is about, and the map stays exactly where it is.
 */
function PanelSection(props: {
  section: { heading: string; note?: string; links: AtlasPanelLink[] };
}) {
  const { section } = props;
  return (
    <section className="atlas-detail__section">
      <h4>{section.heading}</h4>
      {section.note ? <p className="atlas-detail__note">{section.note}</p> : null}
      {section.links.length ? (
        <ul className="atlas-detail__links">
          {section.links.map((link) => (
            <li key={link.id}>
              {link.onOpen ? (
                <button
                  onClick={link.onOpen}
                  style={
                    link.areaToken
                      ? ({ "--ca-area-color": `var(${link.areaToken})` } as CSSProperties)
                      : undefined
                  }
                  type="button"
                >
                  <span aria-hidden="true" className="atlas-detail__dot" />
                  <span className="atlas-detail__link-name">
                    {link.label}
                    {link.note ? <em>{link.note}</em> : null}
                  </span>
                  {link.count > 0 ? (
                    <span className="atlas-detail__link-count">
                      {link.count.toLocaleString("en-US")}
                    </span>
                  ) : null}
                </button>
              ) : (
                <span>
                  <span aria-hidden="true" className="atlas-detail__dot" />
                  <span className="atlas-detail__link-name">
                    {link.label}
                    {link.note ? <em>{link.note}</em> : null}
                  </span>
                  {link.count > 0 ? (
                    <span className="atlas-detail__link-count">
                      {link.count.toLocaleString("en-US")}
                    </span>
                  ) : null}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function AtlasDetailPanel(props: AtlasDetailPanelProps) {
  const {
    subject,
    restingTitle,
    restingBlurb,
    restingFacts,
    restingSections = [],
  } = props;

  if (!subject) {
    return (
      <aside className="atlas-detail" data-resting="true" data-testid="atlas-detail">
        <div className="atlas-detail__rest">
          <h3>{restingTitle}</h3>
          <p>{restingBlurb}</p>
          <dl className="atlas-detail__facts">
            {restingFacts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        {restingSections.map((section) => (
          <PanelSection key={section.heading} section={section} />
        ))}
      </aside>
    );
  }

  return (
    <aside
      className="atlas-detail"
      data-testid="atlas-detail"
      style={{ "--ca-area-color": `var(${subject.areaToken})` } as CSSProperties}
    >
      <p className="atlas-detail__eyebrow">{subject.eyebrow}</p>
      <h3>{subject.title}</h3>
      {subject.blurb ? <p className="atlas-detail__blurb">{subject.blurb}</p> : null}

      {subject.facts.length ? (
        <dl className="atlas-detail__facts">
          {subject.facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {subject.sections.map((section) => (
        <PanelSection key={section.heading} section={section} />
      ))}

      {subject.action ? (
        <button
          className="atlas-detail__open"
          onClick={subject.action.onOpen}
          type="button"
        >
          {subject.action.label}
          <IconArrowRight aria-hidden="true" size={15} stroke={2} />
        </button>
      ) : null}
    </aside>
  );
}
