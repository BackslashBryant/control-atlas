import { PRIMARY_NAV_ITEMS } from "../lib/navigation";
import type { ViewState } from "../lib/viewState";

export function SiteFooter(props: {
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  return (
    <footer className="site-footer">
      <div className="site-footer-grid ca-page">
        <div className="site-footer-brand">
          <strong>Control Atlas</strong>
          <p>The public map for federal cyber compliance.</p>
          <p className="ca-text-muted">
            Open-source. No login. Public data only.
          </p>
        </div>
        <div className="site-footer-nav">
          <strong>Navigate</strong>
          <ul className="site-footer-links">
            {PRIMARY_NAV_ITEMS.map((item) => (
              <li key={item.view}>
                <button
                  className="footer-nav-link"
                  onClick={() => props.onNavigate(item.view)}
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
          <strong>Legal</strong>
          <p>Open-source (MIT)</p>
          <p>Not an official government system.</p>
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
      <p className="site-footer-bar ca-text-subtle ca-page">
        Control Atlas is an open-source reference tool. It does not replace official guidance. Not an official government system. All mappings are reference aids based on public sources.
      </p>
    </footer>
  );
}
