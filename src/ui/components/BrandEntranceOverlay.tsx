import { useEffect, useState } from "react";

const INTRO_STORAGE_KEY = "ca_intro_seen";
const INTRO_DURATION_MS = 1000;

const FLOURISH_WORDS = [
  "Comply",
  "Map",
  "Assess",
  "Crosswalk",
  "Navigate",
  "Inherit",
  "Audit",
  "Authorize",
];

export function shouldShowBrandEntrance() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }
  return window.localStorage.getItem(INTRO_STORAGE_KEY) !== "true";
}

export function BrandEntranceOverlay(props: {
  visible: boolean;
  onDismiss: () => void;
}) {
  const { visible, onDismiss } = props;
  const [wordIndex, setWordIndex] = useState(0);
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const flourishWord = reducedMotion
    ? "Comply"
    : FLOURISH_WORDS[wordIndex % FLOURISH_WORDS.length];

  useEffect(() => {
    if (!visible || reducedMotion) {
      return undefined;
    }
    const interval = window.setInterval(() => {
      setWordIndex((current) => (current + 1) % FLOURISH_WORDS.length);
    }, 300);
    return () => window.clearInterval(interval);
  }, [reducedMotion, visible]);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const dismiss = () => {
      window.localStorage.setItem(INTRO_STORAGE_KEY, "true");
      onDismiss();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === "Escape") {
        dismiss();
      }
    };
    const timer = window.setTimeout(dismiss, INTRO_DURATION_MS);

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onDismiss, visible]);

  if (!visible) {
    return null;
  }

  return (
    <div
      aria-label="Control Atlas introduction"
      className="brand-entrance"
      onClick={() => {
        window.localStorage.setItem(INTRO_STORAGE_KEY, "true");
        onDismiss();
      }}
      role="dialog"
      tabIndex={0}
    >
      <span className="brand-entrance-orbit" aria-hidden="true" />
      <span className="brand-entrance-mark" aria-hidden="true">
        <svg viewBox="0 0 80 80">
          <path d="M 61.2 61.2 A 30 30 0 1 1 61.2 18.8" />
          <path className="ca-mark-arrow" d="M 31 31 L 53 40 L 43 43 L 40 53 Z" />
        </svg>
      </span>
      <strong>Control Atlas</strong>
      <span aria-hidden="true" className="ca-hero-prefix">
        Ctrl + Alt +{" "}
      </span>
      <span className="ca-hero-word brand-entrance-flourish">{flourishWord}</span>
      <span className="visually-hidden">Ctrl + Alt + Comply</span>
      <small>Click, Enter, or Escape to continue</small>
    </div>
  );
}

/** @deprecated Use BrandEntranceOverlay */
