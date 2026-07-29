import { Button } from "./lsm";
import { BUILD_LANES } from "../lib/buildRouteState";
import type { ViewState } from "../lib/viewState";

type BuildBranch = "tasks" | "documents" | "resources";

export function BuildLocalNav(props: {
  active: BuildBranch;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  const { active, onNavigate } = props;
  const actionFor = (id: BuildBranch) =>
    id === "resources"
      ? () => onNavigate("commons")
      : () =>
          onNavigate("templates", {
            buildSection: id,
            task: "",
            templateType: "",
          });

  return (
    <nav aria-label="Build sections" className="build-local-nav flex flex-wrap gap-[8px] border-b border-[var(--ca-border)] pb-[16px] mb-[24px]">
      {BUILD_LANES.map((item) => (
        <Button aria-current={active === item.id ? "page" : undefined} key={item.id} onClick={actionFor(item.id)} type="button" variant={active === item.id ? "primary" : "secondary"}>
          {item.label}
        </Button>
      ))}
    </nav>
  );
}
