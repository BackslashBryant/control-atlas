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
      <footer className="site-footer">
        <p className="site-footer-bar ca-text-subtle ca-page">{FOOTER_NOTICE}</p>
      </footer>
    );
  }

  return (
    <footer className="site-footer">
      <div className="site-footer-grid ca-page">
        <div className="site-footer-brand">
          <strong>Control Atlas</strong>
          <p>See how federal cybersecurity requirements connect.</p>
        </div>
        <div className="site-footer-nav">
          <strong>Navigate</strong>
          <ul className="site-footer-links">
            {ALL_NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <button
                  className="footer-nav-link"
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
        <div className="site-footer-legal">
          <strong>About</strong>
          <p>Open-source (MIT)</p>
          <button
            className="footer-nav-link"
            onClick={() => props.onNavigate("about")}
            role="link"
            type="button"
          >
            About &amp; trust
          </button>
        </div>
      </div>
      <p className="site-footer-bar ca-text-subtle ca-page">{FOOTER_NOTICE}</p>
    </footer>
  );
}
