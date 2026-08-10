import { useEffect, useState } from "react";
import { Button } from "./lsm/Button";

export function StickyDetailBar(props: {
  enabled: boolean;
  itemLabel: string;
  onOpenAtlasMap?: () => void;
  onCompare?: () => void;
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
      <span className="sticky-detail-label">{props.itemLabel}</span>
      {props.onOpenAtlasMap ? (
        <Button variant="primary" onClick={props.onOpenAtlasMap} type="button">
          Open Atlas map
        </Button>
      ) : null}
      {props.onCompare ? (
        <Button variant="secondary" onClick={props.onCompare} type="button">
          Compare
        </Button>
      ) : null}
    </div>
  );
}
