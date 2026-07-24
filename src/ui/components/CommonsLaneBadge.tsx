import {
  IconArchive,
  IconBuildingStore,
  IconCode,
  IconShieldCheck,
  IconUsers
} from "@tabler/icons-react";
import type { CommonsResourceLane } from "../lib/commonsTypes";

const lanePresentation = {
  official: ["Official", "Official Government Source", "commons-lane--official", IconShieldCheck],
  open_source: ["Open Source", "Open Source Tool / Project", "commons-lane--open-source", IconCode],
  practitioner: ["Practitioner", "Practitioner Knowledge / Template", "commons-lane--practitioner", IconUsers],
  commercial: ["Commercial", "Commercial / Proprietary Resource", "commons-lane--commercial", IconBuildingStore],
  legacy: ["Legacy Record", "Legacy / Historical Record", "commons-lane--legacy", IconArchive]
} satisfies Record<CommonsResourceLane, readonly [string, string, string, typeof IconShieldCheck]>;

export function commonsLaneLabel(lane: CommonsResourceLane) {
  return lanePresentation[lane][0];
}

export function CommonsLaneBadge({ lane, full = false }: { lane: CommonsResourceLane; full?: boolean }) {
  const [shortLabel, fullLabel, tone, LaneIcon] = lanePresentation[lane];
  return (
    <span className={`commons-lane-badge ${tone}`}>
      <LaneIcon size={14} aria-hidden="true" />
      {full ? fullLabel : shortLabel}
    </span>
  );
}
