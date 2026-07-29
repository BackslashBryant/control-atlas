import { useEffect, useState } from "react";

import {
  BRAND_ROTATION_INTERVAL_MS,
  BRAND_ROTATION_TRANSITION_MS,
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
  const [reduceMotion, setReduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [wordIndex, setWordIndex] = useState(0);
  const [wordPhase, setWordPhase] = useState<"enter" | "exit">("enter");

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduceMotion(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setWordIndex(0);
      setWordPhase("enter");
      return;
    }

    let transitionTimer = 0;
    const rotationTimer = window.setInterval(() => {
      setWordPhase("exit");
      transitionTimer = window.setTimeout(() => {
        setWordIndex((current) => (current + 1) % BRAND_WORDS.length);
        setWordPhase("enter");
      }, BRAND_ROTATION_TRANSITION_MS);
    }, BRAND_ROTATION_INTERVAL_MS);

    return () => {
      window.clearInterval(rotationTimer);
      window.clearTimeout(transitionTimer);
    };
  }, [reduceMotion]);

  return (
    <span aria-hidden="true" className="brand-kbd">
      <span className="brand-key">Ctrl</span>
      <span className="brand-plus">+</span>
      <span className="brand-key">Alt</span>
      <span className="brand-plus">+</span>
      <span className="brand-key brand-key--active">
        <span className="brand-key-sizer">{LONGEST_BRAND_WORD}</span>
        <span className={`brand-key-word word-${wordPhase}`}>
          {BRAND_WORDS[wordIndex]}
        </span>
      </span>
    </span>
  );
}
