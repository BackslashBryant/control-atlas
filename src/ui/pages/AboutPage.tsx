import { Panel } from "../components/lsm";
import { PageHeader, SummaryCard } from "../lib/pagePrimitives";
import {
  PRODUCT_DECISION_BOUNDARY,
  PRODUCT_DEFINITION,
} from "../../shared/product-identity";
import { SITE_COPY } from "../../shared/site-copy.mjs";

export function AboutPage() {
  return (
    <Panel>
      <PageHeader primary summary={SITE_COPY.routes.about.purpose} title={SITE_COPY.routes.about.title} />

      <div className="about-card-grid">
        <SummaryCard headingLevel={2} title="What It Is">
          <p>{PRODUCT_DEFINITION}</p>
        </SummaryCard>

        <SummaryCard headingLevel={2} title="Why It Exists" tone="trust">
          <p>
            Security teams inherit guidance from many publishers, formats, and
            levels of detail. Control Atlas exists to make that guidance
            navigable together: find the source record, see its declared
            structure and evidence-backed connections, then move to the next
            piece of work without rebuilding the map by hand.
          </p>
        </SummaryCard>

        <SummaryCard headingLevel={2} title="How It Works">
          <p>
            The Atlas keeps publisher hierarchy separate from cross-source
            relationships. It preserves official identifiers and locators,
            labels the basis and confidence of each connection, and gives the
            same result as a graph, a record view, and an accessible evidence
            list. Tags and filters narrow the catalog without treating an
            incidental mention in prose as proof that a technology applies.
          </p>
        </SummaryCard>

        <SummaryCard headingLevel={2} title="Built for Shared Work">
          <p>
            This is not a replacement GRC, assessment, ticketing, or document
            repository. It is the connective layer between them: a practical
            place for ISSMs, engineers, assessors, and program teams to orient
            themselves, compare guidance, and get the next action moving.
          </p>
        </SummaryCard>

        <SummaryCard headingLevel={2} title="Private by Default" tone="trust">
          <p>
            No account or upload is required. Document work runs in the browser
            and does not store organizational data.
          </p>
        </SummaryCard>

        <SummaryCard headingLevel={2} title="Limits" tone="warning">
          <p>{PRODUCT_DECISION_BOUNDARY}</p>
        </SummaryCard>

        <SummaryCard headingLevel={2} title="About the Project">
          <p>
            Control Atlas is open source under the MIT license and is not a
            government system. Publication details and update dates are
            available on each record.
          </p>
        </SummaryCard>
      </div>
    </Panel>
  );
}
