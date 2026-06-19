import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './styles/app.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Control Atlas root element is missing.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
