import type { ViewState } from "../lib/viewState";
import { Button, Panel } from "../components/lsm";
import { PageHeader, SummaryCard } from "../lib/pagePrimitives";
import {
  PRODUCT_DECISION_BOUNDARY,
  PRODUCT_DEFINITION,
} from "../../shared/product-identity";

export function AboutPage(props: {
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  const { onNavigate } = props;

  return (
    <Panel>
      <PageHeader
        eyebrow="About"
        summary={PRODUCT_DEFINITION}
        title="About Control Atlas"
      />

      <div className="flex flex-col gap-[24px]">
        <SummaryCard title="Built for public use" tone="trust">
          <p>
            No account. No uploads. The workbench runs in your browser and does
            not store organizational data.
          </p>
        </SummaryCard>

        <SummaryCard title="Where Control Atlas stops" tone="warning">
          <p>{PRODUCT_DECISION_BOUNDARY}</p>
        </SummaryCard>

        <SummaryCard title="How information is organized">
          <ol className="flex flex-col gap-[12px] mt-[8px] pl-[22px]">
            <li>
              <strong>Source stays attached:</strong> every record resolves to
              its publisher and publication. Ingestion is tracked separately.
            </li>
            <li>
              <strong>Structure follows the publisher:</strong> Path shows only
              hierarchy declared by the source.
            </li>
            <li>
              <strong>Connections stay connections:</strong> baselines,
              mappings, applicability, implementation aids, and evidence never
              become structural parents.
            </li>
            <li>
              <strong>Resources stay outside the tree:</strong> external tools,
              templates, training, data, and communities show their owner and
              provenance without becoming part of source structure.
            </li>
            <li>
              <strong>Your selections drive starter documents:</strong> Preview
              and Download use the same selected inputs. If a required choice
              is missing, there is no file.
            </li>
          </ol>
        </SummaryCard>

        <SummaryCard title="Why this exists">
          <p>
            Cybersecurity work rarely lives in one publication or on one
            website. We built Control Atlas to bring source material, structure,
            and published connections together without rewriting the source or
            deciding the work for you.
          </p>
        </SummaryCard>

        <section className="flex flex-col gap-[16px]">
          <div className="border-b border-[var(--ca-border)] pb-[12px]">
            <h2 className="font-display font-semibold text-[18px]">
              Where to go next
            </h2>
            <p className="text-[var(--ca-text-muted)] text-[14px]">
              Search a published record, inspect the source register, or create
              a starter document from explicit inputs.
            </p>
          </div>
          <div className="flex gap-[16px] items-center flex-wrap">
            <Button variant="primary" onClick={() => onNavigate("search")}>
              Search records
            </Button>
            <Button variant="secondary" onClick={() => onNavigate("sources")}>
              Review sources
            </Button>
            <Button variant="secondary" onClick={() => onNavigate("templates", { buildSection: "documents" })}>
              Open starter documents
            </Button>
          </div>
        </section>
      </div>
    </Panel>
  );
}
