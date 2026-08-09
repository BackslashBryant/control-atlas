import { ALL_NAV_ITEMS } from "../lib/navigation";
import sourceRegistry from "../../../data/source-registry.json";
import { PRODUCT_FOOTER_NOTICE } from "../../shared/product-identity";
import type { ViewState } from "../lib/viewState";
import { AppLink } from "./AppLink";

const LAST_UPDATED = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
}).format(new Date(sourceRegistry.generated_at));

export function SiteFooter(props: {
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  return (
    <footer className="site-footer mt-[64px] border-t border-[var(--ca-border-strong)] bg-[var(--ca-surface-raised)] py-[48px] px-[24px]">
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-[48px] w-full max-w-[1280px] mx-auto mb-[48px]">
        <div>
          <strong className="block font-mono uppercase tracking-wider text-[11px] mb-[12px] text-[var(--ca-text)]">Control Atlas</strong>
          <p className="text-[var(--ca-text-muted)] text-[13px] max-w-[400px]">Public federal cybersecurity records, source text, and published relationships.</p>
        </div>
        <div>
          <strong className="block font-mono uppercase tracking-wider text-[11px] mb-[16px] text-[var(--ca-text)]">Navigate</strong>
          <ul className="flex flex-col gap-[12px] p-0 m-0 list-none">
            {ALL_NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <AppLink
                  className="footer-link text-[var(--ca-text-muted)] hover:text-[var(--ca-secondary)] text-[13px] transition-colors"
                  onNavigate={props.onNavigate}
                  patch={item.patch}
                  view={item.view}
                >
                  {item.label}
                </AppLink>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <strong className="block font-mono uppercase tracking-wider text-[11px] mb-[16px] text-[var(--ca-text)]">About</strong>
          <p className="text-[var(--ca-text-muted)] text-[13px] mb-[12px]">Open source under the MIT license.</p>
          <AppLink
            className="footer-link text-[var(--ca-text-muted)] hover:text-[var(--ca-secondary)] text-[13px] transition-colors"
            onNavigate={props.onNavigate}
            view="about"
          >
            About
          </AppLink>
          <a className="footer-link block mt-[12px] text-[var(--ca-text-muted)] hover:text-[var(--ca-secondary)] text-[13px]" href="https://github.com/BackslashBryant/control-atlas/issues/new?template=submit-resource.yml" rel="noopener noreferrer" target="_blank">Submit resource</a>
          <a className="footer-link block mt-[12px] text-[var(--ca-text-muted)] hover:text-[var(--ca-secondary)] text-[13px]" href="https://github.com/BackslashBryant/control-atlas/issues/new?template=report-broken-link.yml" rel="noopener noreferrer" target="_blank">Report a problem</a>
        </div>
      </div>
      <div className="max-w-[1280px] mx-auto border-t border-[var(--ca-border)] pt-[24px] flex flex-wrap gap-x-[24px] gap-y-[8px]">
        <p className="text-[var(--ca-text-subtle)] text-[12px]">{PRODUCT_FOOTER_NOTICE}</p>
        <p className="text-[var(--ca-text-subtle)] text-[12px]">Last updated {LAST_UPDATED}.</p>
        <AppLink className="footer-link text-[var(--ca-text-subtle)] hover:text-[var(--ca-secondary)] text-[12px]" onNavigate={props.onNavigate} view="sources">Source attribution</AppLink>
      </div>
    </footer>
  );
}
