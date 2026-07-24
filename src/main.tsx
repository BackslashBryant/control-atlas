import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './ui/App';
import { applyLegacyQueryRedirect } from './ui/lib/hashRoutes';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/components.css';
import '../styles/surfaces.css';
import '../styles/tailwind.css';
import '../styles/orbital.css';

// Anti-framing guard (TRUST-002): GitHub Pages cannot send response headers,
// so frame-ancestors/X-Frame-Options are unavailable. Break out of hostile
// frames before doing any other work; a cross-origin top throws on access,
// in which case hide the document instead.
if (window.top !== null && window.self !== window.top) {
  try {
    window.top.location.replace(window.self.location.href);
  } catch {
    document.documentElement.hidden = true;
  }
}

applyLegacyQueryRedirect();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Control Atlas root element is missing.');
}

createRoot(rootElement).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
