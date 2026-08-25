import { ATLAS_SCOPE_METRICS } from "../../shared/atlas-presentation";
import {
  PRODUCT_DECISION_BOUNDARY,
  PRODUCT_DEFINITION,
} from "../../shared/product-identity";
import { SITE_COPY } from "../../shared/site-copy.mjs";
import { PageHeader, PageJumpNav } from "../lib/pagePrimitives";

const SUPPORT_URL = "https://buymeacoffee.com/ram.bulls";

const ABOUT_SECTIONS = [
  { id: "about-why", label: "Why Control Atlas exists" },
  { id: "about-contents", label: "What's in here" },
  { id: "about-practitioners", label: "Built for the people doing the work" },
  { id: "about-sources", label: "Follow it back to the source" },
  { id: "about-project", label: "About the project" },
];

export function AboutPage() {
  return (
    <section className="ca-page about-page" data-page-template="knowledge-base">
      <PageHeader primary summary={SITE_COPY.routes.about.purpose} title={SITE_COPY.routes.about.title} />

      <div className="about-layout">
        <article className="learn-article">
          <section id="about-why">
            <h2>Why Control Atlas exists</h2>
            <p>
              Federal cybersecurity work is scattered everywhere: regulations,
              NIST publications, DISA STIGs and SRGs, assessment procedures,
              spreadsheets, crosswalks, Zero Trust guidance, threat frameworks,
              and dozens of websites.
            </p>
            <p>{PRODUCT_DEFINITION}</p>
            <p>
              It brings those pieces together so you can find what you are looking
              for, understand where it fits, see what connects to it, and get back
              to the work.
            </p>
          </section>

          <section id="about-contents">
            <h2>What's in here</h2>
            {ATLAS_SCOPE_METRICS ? (
              <dl aria-label="Control Atlas scope" className="about-scope-metrics">
                <div>
                  <dt>Searchable records</dt>
                  <dd>{ATLAS_SCOPE_METRICS.records.toLocaleString("en-US")}</dd>
                </div>
                <div>
                  <dt>Connections</dt>
                  <dd>{ATLAS_SCOPE_METRICS.connections.toLocaleString("en-US")}</dd>
                </div>
                <div>
                  <dt>Source publications</dt>
                  <dd>{ATLAS_SCOPE_METRICS.publications.toLocaleString("en-US")}</dd>
                </div>
              </dl>
            ) : null}
            <p>
              Controls and requirements. STIGs and SRGs. Assessment procedures.
              Baselines. CMMC. FedRAMP. CUI. Zero Trust. ATT&amp;CK and D3FEND.
              Practitioner resources and working tools.
            </p>
          </section>

          <section id="about-practitioners">
            <h2>Built for the people doing the work</h2>
            <p>Control Atlas is built for the people who actually have to use this stuff.</p>
            <p>
              The goal is not another compliance platform. It is a free place to
              make sense of the material we already work with, without bouncing
              between twenty tabs, PDFs, spreadsheets, and disconnected sites.
            </p>
          </section>

          <section id="about-sources">
            <h2>Follow it back to the source</h2>
            <p>
              Control Atlas does not replace NIST, DISA, DoD, FedRAMP, MITRE, or
              any other publisher. When something matters, you should be able to
              see where it came from and get back to the official source.
            </p>
            <p>Control Atlas helps connect the dots. It does not make authorization or compliance decisions for you.</p>
            <p>{PRODUCT_DECISION_BOUNDARY}</p>
          </section>

          <section id="about-project">
            <h2>About the project</h2>
            <p>
              Control Atlas is free and open source under the MIT license. It is
              not a government system, no account is required, and document work
              runs locally in your browser without storing organizational data.
            </p>
            <p>
              If Control Atlas saves you time or you want to help keep it growing,
              you can support the project.
            </p>
            <a
              className="about-support-link"
              href={SUPPORT_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span aria-hidden="true">☕</span> Support Control Atlas
            </a>
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
