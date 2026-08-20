import { PageHeader, PageJumpNav } from "../lib/pagePrimitives";
import {
  PRODUCT_DECISION_BOUNDARY,
  PRODUCT_DEFINITION,
} from "../../shared/product-identity";
import { SITE_COPY } from "../../shared/site-copy.mjs";

const ABOUT_SECTIONS = [
  { id: "about-what-it-is", label: "What Control Atlas is" },
  { id: "about-organization", label: "How it is organized" },
  { id: "about-sources", label: "How sources and crosswalks work" },
  { id: "about-boundary", label: "What Control Atlas does not decide" },
  { id: "about-project", label: "About the project" },
];

export function AboutPage() {
  return (
    <section className="ca-page about-page" data-page-template="knowledge-base">
      <PageHeader primary summary={SITE_COPY.routes.about.purpose} title={SITE_COPY.routes.about.title} />

      <div className="about-layout">
        <article className="learn-article">
          <section id="about-what-it-is">
            <h2>What Control Atlas is</h2>
            <p>{PRODUCT_DEFINITION}</p>
            <p>
              It brings federal cybersecurity publications into one public place so
              practitioners can find the official record, understand its context,
              and continue to the next piece of work.
            </p>
          </section>

          <section id="about-organization">
            <h2>How it is organized</h2>
            <p>
              Nine areas — Governance, Risk, Compliance, Architecture,
              Implementation, Assessment, Operations, Threats &amp; Defense, and
              Knowledge — describe how Control Atlas organizes topics for browsing.
            </p>
            <p>
              This navigation layer never replaces a source's own structure. NIST,
              DISA, and every other publisher keep their original publication order,
              headings, identifiers, and relationships.
            </p>
          </section>

          <section id="about-sources">
            <h2>How sources and crosswalks work</h2>
            <p>
              Each publication and connection names its publisher, cited version,
              official link, and last-checked date. Crosswalks remain separate from
              the publisher's original structure.
            </p>
            <p>
              Connection details state the source and how the connection was
              established, so an official crosswalk is distinguishable from a
              normalized or inferred link. Sources contains the supporting source
              details for each record.
            </p>
          </section>

          <section id="about-boundary">
            <h2>What Control Atlas does not decide</h2>
            <p>{PRODUCT_DECISION_BOUNDARY}</p>
            <p>
              A publication, tag, or connection can support research. It does not
              determine applicability, satisfy a control, or replace an assessor or
              authorizing official.
            </p>
          </section>

          <section id="about-project">
            <h2>About the project</h2>
            <p>
              Control Atlas is open source under the MIT license and is not a
              government system. No account or upload is required; document work
              runs in the browser and does not store organizational data.
            </p>
          </section>
        </article>

        <aside aria-label="On this page" className="about-toc">
          <p className="label">On this page</p>
          <PageJumpNav ariaLabel="Jump to About section" sections={ABOUT_SECTIONS} />
        </aside>
      </div>
    </section>
  );
}
