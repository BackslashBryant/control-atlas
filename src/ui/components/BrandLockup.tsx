import { useEffect, useState } from "react";

import {
  BRAND_SIGNALS,
  LONGEST_BRAND_WORD,
  subscribeBrandRotation,
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
  const [word, setWord] = useState(BRAND_SIGNALS[0].label as string);

  useEffect(() => subscribeBrandRotation((signal) => setWord(signal.label)), []);

  return (
    <span aria-hidden="true" className="brand-lockup-flourish">
      <span className="brand-kbd">
        <span className="brand-key">Ctrl</span>
        <span className="brand-plus">+</span>
        <span className="brand-key">Alt</span>
        <span className="brand-plus">+</span>
        <span className="brand-key brand-key--active">
          {/* Reserves the width of the longest word so rotation never shifts
              the masthead and never clips a longer word. */}
          <span className="brand-key-sizer">{LONGEST_BRAND_WORD}</span>
          <span className="brand-key-word" key={word}>{word}</span>
        </span>
      </span>
    </span>
  );
}
