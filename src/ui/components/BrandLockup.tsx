import { useEffect, useState } from "react";

const BRAND_WORDS = ["Comply", "Map", "Navigate", "Audit"];

// Real logo geometry from the user's brand asset export (components/logo/logo-icon.tsx):
// a 270° "C" arc (gap on the east side) with a navigation-arrow dart centered on it.
const ARC_PATH = "M 61.2 61.2 A 30 30 0 1 1 61.2 18.8";
const ARROW_PATH = "M 31 31 L 53 40 L 43 43 L 40 53 Z";

export function BrandMark() {
  return (
    <span aria-hidden="true" className="brand-icon-mark">
      <svg fill="none" viewBox="0 0 80 80">
        <path
          d={ARC_PATH}
          fill="none"
          stroke="#FFFFFF"
          strokeLinecap="round"
          strokeWidth="7"
        />
        <path d={ARROW_PATH} fill="#FFFFFF" />
      </svg>
    </span>
  );
}

export function BrandFlourish() {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [wordIdx, setWordIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) return;
    let swapTimer: number | undefined;
    const interval = window.setInterval(() => {
      setFading(true);
      swapTimer = window.setTimeout(() => {
        setWordIdx((i) => (i + 1) % BRAND_WORDS.length);
        setFading(false);
      }, 200);
    }, 2500);
    return () => {
      window.clearInterval(interval);
      if (swapTimer !== undefined) window.clearTimeout(swapTimer);
    };
  }, [prefersReducedMotion]);

  const rotatingWord = BRAND_WORDS[wordIdx];
  const longestBrandWord = BRAND_WORDS.reduce(
    (longest, word) => (word.length > longest.length ? word : longest),
    "",
  );

  return (
    <span aria-hidden="true" className="brand-kbd">
      <span className="brand-key">Ctrl</span>
      <span className="brand-plus">+</span>
      <span className="brand-key">Alt</span>
      <span className="brand-plus">+</span>
      <span className="brand-key brand-key--active">
        <span aria-hidden="true" className="brand-key-sizer">
          {longestBrandWord}
        </span>
        <span className={`brand-key-word${fading ? " fading" : ""}`}>
          {rotatingWord}
        </span>
      </span>
    </span>
  );
}
