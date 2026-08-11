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

      <div className="flex flex-col gap-[24px]">
        <SummaryCard title="What It Is">
          <p>{PRODUCT_DEFINITION}</p>
        </SummaryCard>

        <SummaryCard title="Private by Default" tone="trust">
          <p>
            No account or upload is required. Document work runs in the browser
            and does not store organizational data.
          </p>
        </SummaryCard>

        <SummaryCard title="Limits" tone="warning">
          <p>{PRODUCT_DECISION_BOUNDARY}</p>
        </SummaryCard>

        <SummaryCard title="About the Project">
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
