import { useEffect } from "react";

const INTRO_STORAGE_KEY = "ca_intro_seen";
const INTRO_DURATION_MS = 1000;

export function shouldShowBrandEntrance() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }
  return window.localStorage.getItem(INTRO_STORAGE_KEY) !== "true";
}

export function BrandEntrance(props: {
  visible: boolean;
  onDismiss: () => void;
}) {
  const { visible, onDismiss } = props;

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
        <svg viewBox="0 0 220 96">
          <path d="M26 48h48M50 24v48" />
          <path d="M98 24h42v48H98z" />
          <path d="M166 25v46M143 48h46" />
        </svg>
      </span>
      <strong>Control Atlas</strong>
      <span>Ctrl + Alt + Comply</span>
      <small>Click, Enter, or Escape to continue</small>
    </div>
  );
}
