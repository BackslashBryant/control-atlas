// The rotating keycap in the masthead is a real keyboard shortcut, not a
// decoration: whatever word is showing, Ctrl+Alt+<its first letter> goes to the
// surface named here. Every word must therefore earn its place — the list is
// short on purpose, and each word says something this product actually does.
export const BRAND_ACTIONS = [
  { word: "Explore", surface: "atlas" },
  { word: "Trace", surface: "sources" },
  { word: "Crosswalk", surface: "compare" },
  { word: "Browse", surface: "catalogs" },
  { word: "Draft", surface: "build" },
  { word: "Find", surface: "search" },
  { word: "Verify", surface: "sources" },
  { word: "Reconcile", surface: "compare" },
  { word: "Learn", surface: "learn" },
] as const;

export type BrandAction = (typeof BRAND_ACTIONS)[number];

export const BRAND_WORDS = BRAND_ACTIONS.map(({ word }) => word);

// Brand surface -> ViewState["view"]. Kept here beside BRAND_ACTIONS so a new
// word cannot name a surface with nowhere to go; src/ui/App.tsx consumes it.
export const BRAND_SURFACE_VIEWS: Record<BrandAction["surface"], string> = {
  atlas: "atlas-map",
  build: "templates",
  catalogs: "catalog-detail",
  compare: "matrix",
  learn: "patterns",
  search: "search",
  sources: "sources",
};

export const BRAND_ROTATION_INTERVAL_MS = 2400;
export const BRAND_ROTATION_TRANSITION_MS = 320;
export const BRAND_ROTATION_SETTLE_MS = 8000;

export const LONGEST_BRAND_WORD = BRAND_WORDS.reduce((longest, word) =>
  word.length > longest.length ? word : longest,
);

// One rotation for the whole app. The masthead and the home hero both render a
// flourish; if each ran its own timer they would drift apart and the keyboard
// shortcut would be ambiguous. Ref-counted so the timers stop when the last
// flourish unmounts.
let activeIndex = 0;
let subscriberCount = 0;
let settleTimer = 0;
let rotationTimer = 0;
let motionQuery: MediaQueryList | null = null;
const listeners = new Set<(action: BrandAction) => void>();

export function activeBrandAction(): BrandAction {
  return BRAND_ACTIONS[activeIndex];
}

function publish() {
  const action = BRAND_ACTIONS[activeIndex];
  for (const listener of listeners) listener(action);
}

function showNextWord() {
  activeIndex = (activeIndex + 1) % BRAND_ACTIONS.length;
  publish();
}

function stopTimers() {
  window.clearTimeout(settleTimer);
  window.clearInterval(rotationTimer);
  settleTimer = 0;
  rotationTimer = 0;
}

function startRotation() {
  stopTimers();
  activeIndex = 0;
  publish();
  if (motionQuery?.matches) return;
  settleTimer = window.setTimeout(() => {
    showNextWord();
    rotationTimer = window.setInterval(showNextWord, BRAND_ROTATION_INTERVAL_MS);
  }, BRAND_ROTATION_SETTLE_MS);
}

export function subscribeBrandRotation(
  listener: (action: BrandAction) => void,
): () => void {
  listeners.add(listener);
  listener(BRAND_ACTIONS[activeIndex]);
  subscriberCount += 1;
  if (subscriberCount === 1 && typeof window !== "undefined") {
    motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    motionQuery.addEventListener("change", startRotation);
    startRotation();
  }
  return () => {
    listeners.delete(listener);
    subscriberCount -= 1;
    if (subscriberCount === 0 && typeof window !== "undefined") {
      stopTimers();
      motionQuery?.removeEventListener("change", startRotation);
      motionQuery = null;
      activeIndex = 0;
    }
  };
}
