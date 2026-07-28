import { Button } from "./lsm";
import type { ViewState } from "../lib/viewState";

type BuildBranch = "tasks" | "documents" | "resources";

export function BuildLocalNav(props: {
  active: BuildBranch;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  const { active, onNavigate } = props;
  const items: Array<{ id: BuildBranch; label: string; action: () => void }> = [
    { id: "tasks", label: "Tasks", action: () => onNavigate("templates", { buildSection: "tasks", task: "", templateType: "" }) },
    { id: "documents", label: "Starter documents", action: () => onNavigate("templates", { buildSection: "documents", task: "", templateType: "" }) },
    { id: "resources", label: "Resources", action: () => onNavigate("commons") },
  ];

  return (
    <nav aria-label="Build sections" className="build-local-nav flex flex-wrap gap-[8px] border-b border-[var(--ca-border)] pb-[16px] mb-[24px]">
      {items.map((item) => (
        <Button aria-current={active === item.id ? "page" : undefined} key={item.id} onClick={item.action} type="button" variant={active === item.id ? "primary" : "secondary"}>
          {item.label}
        </Button>
      ))}
    </nav>
  );
}
