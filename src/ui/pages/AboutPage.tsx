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
              <strong>Path has two rails:</strong> Control Atlas structure
              (Cybersecurity, its areas, and each catalog) and publisher hierarchy
              (the ancestors the source itself declares) are shown separately
              and never mixed into one claimed chain.
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

        <SummaryCard title="A tree for hierarchy, a graph for relationships">
          <p>
            Every record has one place it lives — its hierarchy. AC-2 lives
            under SP 800-53&apos;s own Access Control family, and that catalog
            lives under the Compliance area of Control Atlas. That containment
            is the tree, and each record has exactly one path through it.
          </p>
          <p>
            Everything else a record connects to — a baseline that selects it,
            a CCI that correlates it to an assessment requirement, a mapping to
            another framework — is a relationship, not a parent. A record can
            have any number of these, and they are shown separately from Path
            so a mapping is never mistaken for structure.
          </p>
          <p>
            <strong>A compact chain:</strong> NIST publishes SP 800-53, which
            defines control AC-2 (Account Management). AC-2 is selected into
            the FedRAMP Moderate baseline (applicability), correlates to DISA
            CCI-000010 (correlation), and is assessed through an SP 800-53A
            procedure (assessment). Four different facts about one record —
            one hierarchy, three relationships.
          </p>
          <p>
            Relationship classes in plain language: <strong>applicability</strong>{" "}
            selects or scopes a record into a baseline or profile;{" "}
            <strong>correlation</strong> connects records through a mapping
            junction like a CCI without either becoming the other&apos;s
            parent; <strong>implementation and technical requirements</strong>{" "}
            link to published STIGs, SRGs, and rules;{" "}
            <strong>assessment and evidence</strong> link to published
            procedures and the evidence they expect;{" "}
            <strong>cross-framework mappings</strong> connect the same record
            to another published framework.
          </p>
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
            <Button variant="secondary" onClick={() => onNavigate("patterns")}>
              Read Learn guides
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
