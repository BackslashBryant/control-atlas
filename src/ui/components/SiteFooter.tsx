import { Link } from "react-router-dom";

import { PRIMARY_NAV_ITEMS } from "../lib/navigation";

export function SiteFooter() {
  return (
    <footer className="site-footer ca-page">
      <div className="site-footer-grid">
        <div>
          <strong>Control Atlas</strong>
          <p>The public map for federal cyber compliance.</p>
          <p className="ca-text-muted">
            Open-source. No login. Public data only.
          </p>
        </div>
        <div>
          <strong>Navigation</strong>
          <ul className="site-footer-links">
            {PRIMARY_NAV_ITEMS.map((item) => (
              <li key={item.path}>
                <Link to={item.path}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <strong>Legal</strong>
          <p>Open-source (MIT)</p>
          <p>Not an official government system.</p>
          <p>
            <Link to="/about">About &amp; trust</Link>
          </p>
        </div>
      </div>
      <p className="site-footer-bar ca-text-subtle">
        Control Atlas is an open-source reference tool. It does not replace official guidance. · © Control Atlas contributors · Not an official government system · All mappings are reference aids based on public sources.
      </p>
    </footer>
  );
}
