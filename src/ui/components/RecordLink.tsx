import type { ComponentProps } from "react";

import { AppLink } from "./AppLink";

type RecordLinkProps = Omit<
  ComponentProps<typeof AppLink>,
  "onNavigate" | "patch" | "view"
> & {
  nodeId: string;
  onOpenNode: (nodeId: string) => void;
};

/** A canonical record destination with native link and SPA click behavior. */
export function RecordLink({ nodeId, onOpenNode, ...anchorProps }: RecordLinkProps) {
  return (
    <AppLink
      {...anchorProps}
      onNavigate={() => onOpenNode(nodeId)}
      patch={{ node: nodeId }}
      view="library-detail"
    />
  );
}
