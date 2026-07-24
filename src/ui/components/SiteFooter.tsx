import { ALL_NAV_ITEMS } from "../lib/navigation";
import type { ViewState } from "../lib/viewState";

const FOOTER_NOTICE =
  "Control Atlas is an open-source reference tool. It does not replace official guidance. Not an official government system.";

export function SiteFooter(props: {
  minimal?: boolean;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  if (props.minimal) {
    return (
      <footer className="mt-[64px] border-t border-[var(--ca-border-strong)] bg-[var(--ca-surface-raised)] py-[24px] px-[24px] text-center">
        <p className="text-[var(--ca-text-subtle)] text-[12px] max-w-[1280px] mx-auto">{FOOTER_NOTICE}</p>
      </footer>
    );
  }

  return (
    <footer className="mt-[64px] border-t border-[var(--ca-border-strong)] bg-[var(--ca-surface-raised)] py-[48px] px-[24px]">
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-[48px] w-full max-w-[1280px] mx-auto mb-[48px]">
        <div>
          <strong className="block font-mono uppercase tracking-wider text-[11px] mb-[12px] text-[var(--ca-text)]">Control Atlas</strong>
          <p className="text-[var(--ca-text-muted)] text-[13px] max-w-[400px]">See how federal cybersecurity requirements connect.</p>
        </div>
        <div>
          <strong className="block font-mono uppercase tracking-wider text-[11px] mb-[16px] text-[var(--ca-text)]">Navigate</strong>
          <ul className="flex flex-col gap-[12px] p-0 m-0 list-none">
            {ALL_NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <button
                  className="text-[var(--ca-text-muted)] hover:text-[var(--ca-secondary)] text-[13px] bg-transparent border-0 cursor-pointer p-0 transition-colors"
                  onClick={() => props.onNavigate(item.view, item.patch)}
                  role="link"
                  type="button"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <strong className="block font-mono uppercase tracking-wider text-[11px] mb-[16px] text-[var(--ca-text)]">About</strong>
          <p className="text-[var(--ca-text-muted)] text-[13px] mb-[12px]">Open-source (MIT)</p>
          <button
            className="text-[var(--ca-text-muted)] hover:text-[var(--ca-secondary)] text-[13px] bg-transparent border-0 cursor-pointer p-0 transition-colors"
            onClick={() => props.onNavigate("about")}
            role="link"
            type="button"
          >
            About &amp; trust
          </button>
        </div>
      </div>
      <div className="max-w-[1280px] mx-auto border-t border-[var(--ca-border)] pt-[24px]">
        <p className="text-[var(--ca-text-subtle)] text-[12px]">{FOOTER_NOTICE}</p>
      </div>
    </footer>
  );
}
