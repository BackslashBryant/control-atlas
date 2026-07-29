import { useEffect, useRef } from "react";

import {
  BRAND_ROTATION_INTERVAL_MS,
  BRAND_ROTATION_SETTLE_MS,
  BRAND_WORDS,
  LONGEST_BRAND_WORD,
} from "../../shared/brand-rotation";

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
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="7"
        />
        <path d={ARROW_PATH} fill="currentColor" />
      </svg>
    </span>
  );
}

export function BrandFlourish() {
  const wordRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let wordIndex = 0;
    let settleTimer = 0;
    let rotationTimer = 0;

    const stopRotation = () => {
      window.clearTimeout(settleTimer);
      window.clearInterval(rotationTimer);
    };
    const showNextWord = () => {
      wordIndex = (wordIndex + 1) % BRAND_WORDS.length;
      if (wordRef.current) wordRef.current.textContent = BRAND_WORDS[wordIndex];
    };
    const startRotation = () => {
      stopRotation();
      wordIndex = 0;
      if (wordRef.current) wordRef.current.textContent = BRAND_WORDS[0];
      if (media.matches) return;
      settleTimer = window.setTimeout(() => {
        showNextWord();
        rotationTimer = window.setInterval(
          showNextWord,
          BRAND_ROTATION_INTERVAL_MS,
        );
      }, BRAND_ROTATION_SETTLE_MS);
    };

    media.addEventListener("change", startRotation);
    startRotation();
    return () => {
      stopRotation();
      media.removeEventListener("change", startRotation);
    };
  }, []);

  return (
    <span aria-hidden="true" className="brand-kbd">
      <span className="brand-key">Ctrl</span>
      <span className="brand-plus">+</span>
      <span className="brand-key">Alt</span>
      <span className="brand-plus">+</span>
      <span className="brand-key brand-key--active">
        <span className="brand-key-sizer">{LONGEST_BRAND_WORD}</span>
        <span className="brand-key-word" ref={wordRef}>
          {BRAND_WORDS[0]}
        </span>
      </span>
    </span>
  );
}
