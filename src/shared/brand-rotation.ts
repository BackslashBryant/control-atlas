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
export const BRAND_ROTATION_SETTLE_MS = 2400;

export const LONGEST_BRAND_WORD = BRAND_WORDS.reduce((longest, word) =>
  word.length > longest.length ? word : longest,
);

/**
 * Returns every eligible signal once in a shuffled order, then reshuffles.
 * The boundary guard prevents an immediate repeat between completed bags.
 */
export function createBrandSignalPicker(
  signals: readonly AtlasBrandSignal[] = BRAND_SIGNALS,
  random: () => number = Math.random,
): () => AtlasBrandSignal {
  if (signals.length === 0) {
    throw new Error("Brand signal rotation requires at least one signal.");
  }

  let bag: AtlasBrandSignal[] = [];
  let previousId = "";

  return () => {
    if (bag.length === 0) {
      bag = [...signals];
      for (let index = bag.length - 1; index > 0; index -= 1) {
        const target = Math.floor(random() * (index + 1));
        [bag[index], bag[target]] = [bag[target], bag[index]];
      }
      if (bag.length > 1 && bag.at(-1)?.id === previousId) {
        [bag[0], bag[bag.length - 1]] = [bag.at(-1)!, bag[0]];
      }
    }

    const signal = bag.pop()!;
    previousId = signal.id;
    return signal;
  };
}

// One randomized rotation for the whole hydrated app. The masthead and any
// repeated flourish stay visually synchronized. Reduced-motion users receive
// one randomly selected stable signal.
let activeSignal = BRAND_SIGNALS[0];
let pickSignal = createBrandSignalPicker();
let subscriberCount = 0;
let settleTimer = 0;
let rotationTimer = 0;
let motionQuery: MediaQueryList | null = null;
const listeners = new Set<(signal: AtlasBrandSignal) => void>();

function publish() {
  for (const listener of listeners) listener(activeSignal);
}

function showNextWord() {
  activeSignal = pickSignal();
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
  pickSignal = createBrandSignalPicker();
  showNextWord();
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
  subscriberCount += 1;
  if (subscriberCount === 1 && typeof window !== "undefined") {
    motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    motionQuery.addEventListener("change", startRotation);
    startRotation();
  } else {
    listener(activeSignal);
  }
  return () => {
    listeners.delete(listener);
    subscriberCount -= 1;
    if (subscriberCount === 0 && typeof window !== "undefined") {
      stopTimers();
      motionQuery?.removeEventListener("change", startRotation);
      motionQuery = null;
      activeSignal = BRAND_SIGNALS[0];
      pickSignal = createBrandSignalPicker();
    }
  };
}
