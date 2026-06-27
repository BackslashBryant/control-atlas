import { useEffect, useRef, useState } from "react";

import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";

type AtlasPullTabProps = {
  contextNodeId: string | null;
  bundle: RuntimeBundle | null;
  view: ViewState["view"];
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
};

/**
 * Persistent, context-aware access to the Atlas from any workbench. Hidden on
 * the Atlas page itself (where it would be redundant). Opens a slide-in panel
 * that jumps into the full Atlas centered on the current page context.
 */
export function AtlasPullTab(props: AtlasPullTabProps) {
  const { contextNodeId, bundle, view, onNavigate } = props;
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const tabRef = useRef<HTMLButtonElement | null>(null);

  const hidden = view === "atlas-map";

  useEffect(() => {
    if (hidden) setOpen(false);
  }, [hidden]);

  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        tabRef.current &&
        !tabRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  if (hidden) return null;

  let contextLabel: string | null = null;
  if (contextNodeId && bundle) {
    const node = bundle.runtime.getNode(contextNodeId);
    contextLabel = node?.metadata?.item_id || node?.label || contextNodeId;
  }

  function openAtlas() {
    setOpen(false);
    onNavigate("atlas-map", contextNodeId ? { node: contextNodeId } : {});
  }

  return (
    <>
      <button
        aria-expanded={open}
        aria-label="Open Atlas panel"
        className="atlas-pull-tab"
        onClick={() => setOpen((value) => !value)}
        ref={tabRef}
        type="button"
      >
        ATLAS
      </button>
      {open ? (
        <div
          aria-label="Atlas panel"
          className="atlas-pull-panel"
          ref={panelRef}
          role="dialog"
        >
          <div className="atlas-pull-panel-header">
            <strong>Atlas</strong>
            <button
              aria-label="Close Atlas panel"
              className="secondary quiet"
              onClick={() => setOpen(false)}
              type="button"
            >
              Close
            </button>
          </div>
          <div className="atlas-pull-panel-body">
            {contextLabel ? (
              <p>
                Open the Atlas centered on <strong>{contextLabel}</strong> to see
                how it connects across frameworks.
              </p>
            ) : (
              <p>
                Explore how controls, baselines, assessments, and frameworks
                connect in one map.
              </p>
            )}
            <button className="primary" onClick={openAtlas} type="button">
              View full Atlas →
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
