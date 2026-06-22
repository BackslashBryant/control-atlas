import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './ui/App';
import { applyLegacyQueryRedirect } from './ui/lib/hashRoutes';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/components.css';
import '../styles/surfaces.css';

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
