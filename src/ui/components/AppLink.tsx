import type { AnchorHTMLAttributes, MouseEvent } from "react";

import { serializeHashUrl } from "../lib/hashRoutes";
import { normalizeViewState, type ViewState } from "../lib/viewState";
import { buttonClassName, type ButtonVariant } from "./lsm/Button";

export type AppNavigate = (
  view: ViewState["view"],
  patch?: Partial<ViewState>,
  reset?: boolean,
) => void;

export function appHref(
  view: ViewState["view"],
  patch: Partial<ViewState> = {},
) {
  return serializeHashUrl(normalizeViewState(view, patch));
}

export function shouldInterceptAppLink(
  event: MouseEvent<HTMLAnchorElement>,
) {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    event.currentTarget.target !== "_blank" &&
    !event.currentTarget.hasAttribute("download")
  );
}

type AppLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> & {
  onNavigate: AppNavigate;
  patch?: Partial<ViewState>;
  reset?: boolean;
  variant?: ButtonVariant;
  view: ViewState["view"];
};

/**
 * A canonical application link. Plain primary clicks stay in the SPA; every
 * modified click and native link operation remains owned by the browser.
 */
export function AppLink({
  onClick,
  onNavigate,
  patch,
  reset = true,
  variant,
  view,
  ...anchorProps
}: AppLinkProps) {
  return (
    <a
      {...anchorProps}
      className={variant ? buttonClassName(variant, anchorProps.className) : anchorProps.className}
      href={appHref(view, patch)}
      onClick={(event) => {
        onClick?.(event);
        if (!shouldInterceptAppLink(event)) return;
        event.preventDefault();
        onNavigate(view, patch, reset);
      }}
    />
  );
}
