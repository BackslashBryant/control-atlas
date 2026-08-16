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
            Control Atlas keeps a publisher's own structure separate from the
            connections it draws between sources, and shows official IDs and
            links for both. A mention in the text alone doesn't mean a
            technology or control applies — you decide that.
          </p>
        </SummaryCard>

        <SummaryCard headingLevel={2} title="Built for Shared Work">
          <p>
            Control Atlas isn't a GRC, assessment, or ticketing system. It's
            where ISSMs, engineers, assessors, and program teams orient
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
