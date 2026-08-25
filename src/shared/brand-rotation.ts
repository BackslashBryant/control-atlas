import {
  ATLAS_BRAND_SIGNALS,
  type AtlasBrandSignal,
} from "./atlas-presentation";

// Ctrl + Alt + … is a visual Control Atlas signature. The labels are injected
// from generated corpus coverage during the Vite build and never carry routes,
// destinations, or keyboard bindings.
export const BRAND_SIGNALS = ATLAS_BRAND_SIGNALS;
export const BRAND_WORDS = BRAND_SIGNALS.map(({ label }) => label);

export const BRAND_ROTATION_INTERVAL_MS = 2400;
export const BRAND_ROTATION_TRANSITION_MS = 320;
export const BRAND_ROTATION_SETTLE_MS = 8000;

export const LONGEST_BRAND_WORD = BRAND_WORDS.reduce((longest, word) =>
  word.length > longest.length ? word : longest,
);

// One rotation for the whole app. The masthead and any repeated flourish stay
// visually synchronized, while reduced-motion users receive the first stable
// generated signal.
let activeIndex = 0;
let subscriberCount = 0;
let settleTimer = 0;
let rotationTimer = 0;
let motionQuery: MediaQueryList | null = null;
const listeners = new Set<(signal: AtlasBrandSignal) => void>();

function publish() {
  const signal = BRAND_SIGNALS[activeIndex];
  for (const listener of listeners) listener(signal);
}

function showNextWord() {
  activeIndex = (activeIndex + 1) % BRAND_SIGNALS.length;
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
  if (motionQuery?.matches || BRAND_SIGNALS.length < 2) return;
  settleTimer = window.setTimeout(() => {
    showNextWord();
    rotationTimer = window.setInterval(showNextWord, BRAND_ROTATION_INTERVAL_MS);
  }, BRAND_ROTATION_SETTLE_MS);
}

export function subscribeBrandRotation(
  listener: (signal: AtlasBrandSignal) => void,
): () => void {
  listeners.add(listener);
  listener(BRAND_SIGNALS[activeIndex]);
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
