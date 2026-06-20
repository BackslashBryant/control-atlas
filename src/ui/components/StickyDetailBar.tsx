import { useEffect, useState } from "react";

export function StickyDetailBar(props: {
  enabled: boolean;
  itemLabel: string;
  onBack: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!props.enabled) {
      setVisible(false);
      return undefined;
    }

    function onScroll() {
      setVisible(window.scrollY > 200);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [props.enabled]);

  if (!props.enabled || !visible) {
    return null;
  }

  return (
    <div
      aria-label="Page navigation"
      className="sticky-detail-bar"
      role="navigation"
    >
      <button className="primary" onClick={props.onBack} type="button">
        Back to results
      </button>
      <span className="sticky-detail-label">{props.itemLabel}</span>
    </div>
  );
}
