import { Panel } from "../components/lsm";
import { PageHeader, SummaryCard } from "../lib/pagePrimitives";
import {
  PRODUCT_DECISION_BOUNDARY,
  PRODUCT_DEFINITION,
} from "../../shared/product-identity";

export function AboutPage() {
  return (
    <Panel>
      <PageHeader primary summary={PRODUCT_DEFINITION} title="About" />

      <div className="flex flex-col gap-[24px]">
        <SummaryCard title="What it contains">
          <p>
            Public federal cybersecurity publications: control catalogs,
            baselines, implementation and assessment guidance, and the
            published mappings between them. Every record keeps its publisher,
            publication, and retrieval date.
          </p>
        </SummaryCard>

        <SummaryCard title="Built for public use" tone="trust">
          <p>
            No account. No uploads. The workbench runs in your browser and does
            not store organizational data.
          </p>
        </SummaryCard>

        <SummaryCard title="Help using Control Atlas">
          <p>
            Start here turns the work in front of you into a short starting
            plan. Library searches and filters the complete corpus. Guides
            explain how to use public cybersecurity material. Search remains
            available in the header from every route.
          </p>
        </SummaryCard>

        <SummaryCard title="Where Control Atlas stops" tone="warning">
          <p>{PRODUCT_DECISION_BOUNDARY}</p>
        </SummaryCard>

        <SummaryCard title="A tree for hierarchy, a graph for relationships">
          <p>
            Control Atlas keeps hierarchy and relationships separate. Path
            shows where a record sits in Control Atlas structure and in its
            publisher hierarchy on separate rails. Map and List show
            baselines, mappings, assessments, and implementation links without
            treating them as parents.
          </p>
          <p>
            AC-2 lives under SP 800-53&apos;s own Access Control family. It is
            also selected into the FedRAMP Moderate baseline and assessed
            through an SP 800-53A procedure. One place it lives; any number of
            things it connects to.
          </p>
        </SummaryCard>

        <SummaryCard title="Open source and provenance">
          <p>
            Control Atlas is open source under the MIT license and is not a
            government system. Sources lists every publication it holds, who
            published it, and when it was last checked.
          </p>
        </SummaryCard>
      </div>
    </Panel>
  );
}
