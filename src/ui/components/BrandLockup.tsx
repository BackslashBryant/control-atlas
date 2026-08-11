import { useEffect, useState } from "react";

import {
  BRAND_ACTIONS,
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
  const [word, setWord] = useState(BRAND_ACTIONS[0].word as string);

  // One shared rotation drives every flourish on the page, so the word the
  // keyboard shortcut resolves against is never ambiguous.
  useEffect(() => subscribeBrandRotation((action) => setWord(action.word)), []);

  return (
    <span className="brand-lockup-shortcut">
      <span
        aria-hidden="true"
        className="brand-kbd"
        title={`Press Ctrl + Alt + ${word[0]} to ${word.toLowerCase()}`}
      >
        <span className="brand-key">Ctrl</span>
        <span className="brand-plus">+</span>
        <span className="brand-key">Alt</span>
        <span className="brand-plus">+</span>
        <span className="brand-key brand-key--active">
          <span className="brand-key-word">{word}</span>
        </span>
      </span>
      {/* Static, so a screen reader is not re-read every rotation tick. */}
      <span className="visually-hidden">
        Keyboard shortcut: Control plus Alt plus the first letter of the action
        shown in the header opens that part of Control Atlas.
      </span>
    </span>
  );
}
