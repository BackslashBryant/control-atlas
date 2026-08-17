import { Panel } from "../components/lsm";
import { PageHeader, PageJumpNav, SummaryCard } from "../lib/pagePrimitives";
import {
  PRODUCT_DECISION_BOUNDARY,
  PRODUCT_DEFINITION,
} from "../../shared/product-identity";
import { SITE_COPY } from "../../shared/site-copy.mjs";

const ABOUT_SECTIONS = [
  { id: "about-what-it-is", label: "What It Is" },
  { id: "about-why-it-exists", label: "Why It Exists" },
  { id: "about-how-it-works", label: "How It Works" },
  { id: "about-organizing-structure", label: "Organizing Structure" },
  { id: "about-source-trust", label: "Source & Mapping Trust" },
  { id: "about-built-for-shared-work", label: "Built for Shared Work" },
  { id: "about-private-by-default", label: "Private by Default" },
  { id: "about-limits", label: "Limits" },
  { id: "about-the-project", label: "About the Project" },
];

export function AboutPage() {
  return (
    <Panel>
      <PageHeader primary summary={SITE_COPY.routes.about.purpose} title={SITE_COPY.routes.about.title} />

      <div className="about-layout">
        <div className="about-card-grid">
          <div id="about-what-it-is">
            <SummaryCard headingLevel={2} title="What It Is">
              <p>{PRODUCT_DEFINITION}</p>
            </SummaryCard>
          </div>

          <div id="about-why-it-exists">
            <SummaryCard headingLevel={2} title="Why It Exists" tone="trust">
              <p>
                Security teams inherit guidance from many publishers, formats, and
                levels of detail. Control Atlas exists to make that guidance
                navigable together: find the source record, see its declared
                structure and evidence-backed connections, then move to the next
                piece of work without rebuilding the map by hand.
              </p>
            </SummaryCard>
          </div>

          <div id="about-how-it-works">
            <SummaryCard headingLevel={2} title="How It Works">
              <p>
                Control Atlas keeps a publisher's own structure separate from the
                connections it draws between sources, and shows official IDs and
                links for both. A mention in the text alone doesn't mean a
                technology or control applies — you decide that.
              </p>
            </SummaryCard>
          </div>

          <div id="about-organizing-structure">
            <SummaryCard headingLevel={2} title="Organizing Structure">
              <p>
                Nine areas — Governance, Risk, Compliance, Architecture,
                Implementation, Assessment, Operations, Threats &amp; Defense, and
                Knowledge — organize the cybersecurity landscape. Every publisher
                keeps its own real structure underneath; the nine areas are a
                Control Atlas overlay for orientation, not a replacement for how
                NIST, DISA, or any other publisher organizes its own material.
              </p>
            </SummaryCard>
          </div>

          <div id="about-source-trust">
            <SummaryCard headingLevel={2} title="Source & Mapping Trust">
              <p>
                Every publication, mapping, and connection names its publisher,
                cited version, and the date it was last checked. Mappings between
                frameworks show their provenance and confidence rather than
                presenting every connection as equally certain. See Sources for
                the full trust register behind any record.
              </p>
            </SummaryCard>
          </div>

          <div id="about-built-for-shared-work">
            <SummaryCard headingLevel={2} title="Built for Shared Work">
              <p>
                Control Atlas isn't a GRC, assessment, or ticketing system. It's
                where ISSMs, engineers, assessors, and program teams orient
                themselves, compare guidance, and get the next action moving.
              </p>
            </SummaryCard>
          </div>

          <div id="about-private-by-default">
            <SummaryCard headingLevel={2} title="Private by Default" tone="trust">
              <p>
                No account or upload is required. Document work runs in the browser
                and does not store organizational data.
              </p>
            </SummaryCard>
          </div>

          <div id="about-limits">
            <SummaryCard headingLevel={2} title="Limits" tone="warning">
              <p>{PRODUCT_DECISION_BOUNDARY}</p>
            </SummaryCard>
          </div>

          <div id="about-the-project">
            <SummaryCard headingLevel={2} title="About the Project">
              <p>
                Control Atlas is open source under the MIT license and is not a
                government system. Publication details and update dates are
                available on each record.
              </p>
            </SummaryCard>
          </div>
        </div>

        <aside aria-label="On this page" className="about-toc">
          <p className="label">On this page</p>
          <PageJumpNav ariaLabel="Jump to About section" sections={ABOUT_SECTIONS} />
        </aside>
      </div>
    </Panel>
  );
}
