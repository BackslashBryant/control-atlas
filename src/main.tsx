import {
  BRAND_ROTATION_INTERVAL_MS,
  BRAND_ROTATION_TRANSITION_MS,
  BRAND_WORDS,
} from './shared/brand-rotation';
import {
  ROUTE_COMMITTED_EVENT,
  SEARCH_RESULTS_FOCUS_EVENT,
} from './shared/navigation-events';
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

const rootElement = document.getElementById('root');
const reactRootElement = rootElement?.querySelector<HTMLElement>('[data-react-root]');

if (!rootElement || !reactRootElement) {
  throw new Error('Control Atlas root elements are missing.');
}

let brandRotationInterval = 0;
let brandRotationTransition = 0;
let reactBoot: Promise<void> | null = null;
let reactModules: Promise<
  [
    typeof import('react'),
    typeof import('react-dom/client'),
    typeof import('./ui/App'),
  ]
> | null = null;
let brandMotionMedia: MediaQueryList | null = null;

function isHomeHash() {
  const route = window.location.hash.replace(/^#/, '');
  return route === '' || route === '/' || route.startsWith('/?');
}

function isSearchHash() {
  return window.location.hash.replace(/^#/, '').startsWith('/search');
}

function staticSearchQuery() {
  const hash = window.location.hash.replace(/^#/, '');
  const queryIndex = hash.indexOf('?');
  if (queryIndex === -1) return '';
  return new URLSearchParams(hash.slice(queryIndex + 1)).get('q') || '';
}

function syncStaticRouteShell() {
  const shell = rootElement.querySelector<HTMLElement>('[data-static-route]');
  if (!shell) return;
  const active =
    rootElement.dataset.routeHydrated !== 'true' &&
    !isHomeHash() &&
    !isSearchHash();
  shell.toggleAttribute('hidden', !active);
  if (!active) {
    delete rootElement.dataset.staticRouteActive;
    return;
  }
  rootElement.dataset.staticRouteActive = 'true';
  delete rootElement.dataset.routeHydrated;
  shell.removeAttribute('aria-hidden');
  shell.removeAttribute('inert');
  shell.setAttribute('role', 'status');
}

function observeRouteHydration() {
  let settleTimer = 0;
  const reactRouteOwnsSurface = (app: HTMLElement) =>
    ['true', 'partial', 'error'].includes(app.dataset.appReady || '');
  const markHydrated = () => {
    const app = reactRootElement.querySelector<HTMLElement>('#app');
    if (!app || !reactRouteOwnsSurface(app)) return false;
    if (
      app.dataset.appReady !== 'error' &&
      app.dataset.view === 'atlas-map' &&
      app.dataset.hasSubject === 'true' &&
      !reactRootElement.querySelector('[data-route-content-ready="true"]')
    ) {
      return false;
    }
    rootElement.dataset.routeHydrated = 'true';
    const shell = rootElement.querySelector<HTMLElement>('[data-static-route]');
    shell?.setAttribute('aria-hidden', 'true');
    shell?.setAttribute('inert', '');
    shell?.removeAttribute('role');
    return true;
  };
  const scheduleHydration = () => {
    const app = reactRootElement.querySelector<HTMLElement>('#app');
    if (!app || !reactRouteOwnsSurface(app)) return;
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      if (markHydrated()) observer.disconnect();
    }, 200);
  };
  const observer = new MutationObserver(() => {
    scheduleHydration();
  });
  observer.observe(reactRootElement, {
    attributes: true,
    attributeFilter: ['data-app-ready'],
    childList: true,
    subtree: true,
  });
  scheduleHydration();
  window.setTimeout(() => {
    window.clearTimeout(settleTimer);
    markHydrated();
    observer.disconnect();
  }, 15_000);
}

function stopBrandRotation() {
  window.clearInterval(brandRotationInterval);
  window.clearTimeout(brandRotationTransition);
  brandMotionMedia?.removeEventListener('change', onBrandMotionChange);
  brandMotionMedia = null;
}

function startBrandRotation() {
  const wordElement = rootElement.querySelector<HTMLElement>('[data-brand-word]');
  if (!wordElement) {
    return;
  }

  brandMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  brandMotionMedia.addEventListener('change', onBrandMotionChange);
  if (brandMotionMedia.matches) return;

  let wordIndex = 0;
  brandRotationInterval = window.setInterval(() => {
    wordElement.classList.remove('word-enter');
    wordElement.classList.add('word-exit');
    brandRotationTransition = window.setTimeout(() => {
      wordIndex = (wordIndex + 1) % BRAND_WORDS.length;
      wordElement.textContent = BRAND_WORDS[wordIndex];
      wordElement.classList.remove('word-exit');
      wordElement.classList.add('word-enter');
    }, BRAND_ROTATION_TRANSITION_MS);
  }, BRAND_ROTATION_INTERVAL_MS);
}

function onBrandMotionChange() {
  const wordElement = rootElement.querySelector<HTMLElement>('[data-brand-word]');
  if (!wordElement) return;
  stopBrandRotation();
  wordElement.textContent = BRAND_WORDS[0];
  wordElement.classList.remove('word-exit');
  wordElement.classList.add('word-enter');
  startBrandRotation();
}

function navigateFromStaticHome(target: string) {
  if (window.location.hash !== target) {
    window.location.hash = target.slice(1);
  }
  void bootReactApp();
}

function focusSearchResultsWhenReady() {
  const focusResults = () => {
    const results = reactRootElement.querySelector<HTMLElement>('#library-results');
    if (!results) return false;
    results.focus();
    return true;
  };
  if (focusResults()) return;

  const observer = new MutationObserver(() => {
    if (focusResults()) observer.disconnect();
  });
  observer.observe(reactRootElement, { childList: true, subtree: true });
  window.setTimeout(() => observer.disconnect(), 15_000);
}

function connectStaticSearch() {
  rootElement
    .querySelector<HTMLElement>('[data-static-search-start]')
    ?.addEventListener('click', () => navigateFromStaticHome('#/start'));
  rootElement
    .querySelector<HTMLFormElement>('[data-static-search-form]')
    ?.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = rootElement.querySelector<HTMLInputElement>(
        '[data-static-search-input]',
      );
      const query = input?.value.trim() || '';
      const target = `#/search${query ? `?q=${encodeURIComponent(query)}` : ''}`;
      focusSearchResultsWhenReady();
      navigateFromStaticHome(target);
    });
}

function syncProgressiveShell() {
  const home = isHomeHash();
  const search = isSearchHash();
  rootElement.dataset.reactActive = reactBoot && !home ? 'true' : 'false';
  if (search) {
    rootElement.dataset.staticSearchActive = 'true';
  } else {
    delete rootElement.dataset.staticSearchActive;
  }

  for (const selector of [
    '[data-static-header-reserve]',
    '[data-static-context-reserve]',
  ]) {
    rootElement
      .querySelector<HTMLElement>(selector)
      ?.toggleAttribute('hidden', home);
  }
  rootElement
    .querySelector<HTMLElement>('[data-static-search]')
    ?.toggleAttribute('hidden', !search);
  syncStaticRouteShell();
  const input = rootElement.querySelector<HTMLInputElement>(
    '[data-static-search-input]',
  );
  if (input && document.activeElement !== input) {
    input.value = staticSearchQuery();
  }
}

function connectStaticHome() {
  rootElement.querySelector<HTMLElement>('[data-static-home]')?.removeAttribute('hidden');
  rootElement
    .querySelector<HTMLElement>('[data-skip-workspace]')
    ?.addEventListener('click', (event) => {
      event.preventDefault();
      rootElement.querySelector<HTMLElement>('#workspace')?.focus();
    });

  rootElement.querySelectorAll<HTMLElement>('[data-route]').forEach((control) => {
    control.addEventListener('click', () => {
      const target = control.dataset.route;
      if (target) navigateFromStaticHome(target);
    });
  });

  rootElement
    .querySelector<HTMLFormElement>('[data-home-search]')
    ?.addEventListener('submit', (event) => {
      event.preventDefault();
      const query = new FormData(event.currentTarget as HTMLFormElement).get('query');
      if (typeof query === 'string' && query.trim()) {
        navigateFromStaticHome(`#/search?q=${encodeURIComponent(query.trim())}`);
      }
    });

  startBrandRotation();
  rootElement
    .querySelector<HTMLElement>('.app-shell')
    ?.setAttribute('data-app-ready', 'true');
}

async function bootReactApp() {
  if (reactBoot) return reactBoot;

  stopBrandRotation();
  const staticHome = rootElement.querySelector<HTMLElement>('[data-static-home]');
  staticHome?.setAttribute('hidden', '');
  const staticHomeApp = staticHome?.querySelector<HTMLElement>('#app');
  if (staticHomeApp) staticHomeApp.id = 'static-home-app';
  syncProgressiveShell();
  window.removeEventListener('hashchange', onLocationChange);
  window.removeEventListener('popstate', onLocationChange);

  reactBoot = loadReactModules()
    .then(([react, reactDom, appModule]) => {
      reactDom.createRoot(reactRootElement).render(
        react.createElement(
          react.StrictMode,
          null,
          react.createElement(appModule.App),
        ),
      );
      observeRouteHydration();
    })
    .catch((error: unknown) => {
      reactBoot = null;
      const boundary = rootElement.querySelector<HTMLElement>('.home-trust-boundary');
      if (boundary) {
        boundary.setAttribute('role', 'alert');
        boundary.insertAdjacentText(
          'beforeend',
          ' The interactive workspace could not load. Reload this page to try again.',
        );
      }
      throw error;
    });

  syncProgressiveShell();
  return reactBoot;
}

function loadReactModules() {
  if (reactModules) return reactModules;
  reactModules = Promise.all([
    import('react'),
    import('react-dom/client'),
    import('./ui/App'),
  ]);
  return reactModules;
}

function onLocationChange() {
  if (!isHomeHash()) void bootReactApp();
}

async function start() {
  const hasLegacyQuery =
    window.location.search.length > 1 &&
    !window.location.hash.replace(/^#\/?/, '').length;
  if (hasLegacyQuery) {
    const { applyLegacyQueryRedirect } = await import('./ui/lib/hashRoutes');
    applyLegacyQueryRedirect();
  }

  connectStaticSearch();
  syncProgressiveShell();
  window.addEventListener('hashchange', syncProgressiveShell);
  window.addEventListener('popstate', syncProgressiveShell);
  window.addEventListener(ROUTE_COMMITTED_EVENT, syncProgressiveShell);
  window.addEventListener(
    SEARCH_RESULTS_FOCUS_EVENT,
    focusSearchResultsWhenReady,
  );

  if (isHomeHash()) {
    connectStaticHome();
    window.addEventListener('hashchange', onLocationChange);
    window.addEventListener('popstate', onLocationChange);
  } else {
    // Fetch the route bundle in parallel with the stable server-rendered shell,
    // then mount the interactive workspace after the initial paint. The static
    // Search form works immediately, and any user action still boots at once.
    const bootAfterInitialPaint = () => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          window.setTimeout(() => {
            void bootReactApp();
          }, 0);
        });
      });
    };
    if (document.readyState === 'complete') {
      bootAfterInitialPaint();
    } else {
      window.addEventListener('load', bootAfterInitialPaint, { once: true });
    }
  }
}

void start();
