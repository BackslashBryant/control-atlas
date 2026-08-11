import {
  IconBook2,
  IconBuildingStore,
  IconDatabase,
  IconFileText,
  IconHierarchy3,
  IconLock,
  IconSchool,
  IconTool,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react";

import { resourceTypeLabel } from "../lib/resourceBrands.mjs";

const ICONS = {
  catalog: IconDatabase,
  community_forum: IconUsers,
  dataset: IconDatabase,
  documentation: IconBook2,
  ecosystem: IconHierarchy3,
  government_portal: IconWorld,
  historical_reference: IconBook2,
  instruction: IconSchool,
  marketplace: IconBuildingStore,
  matrix: IconDatabase,
  product_directory: IconBuildingStore,
  restricted_service: IconLock,
  service_portal: IconWorld,
  specification: IconFileText,
  template: IconFileText,
  tool: IconTool,
  training: IconSchool,
} as const;

export function ResourceTypeIcon(props: { resourceType: string; size?: number }) {
  const Icon = ICONS[props.resourceType as keyof typeof ICONS] || IconWorld;
  const label = resourceTypeLabel(props.resourceType);
  return (
    <span aria-label={`${label} resource`} className="resource-type-icon" role="img">
      <Icon aria-hidden="true" size={props.size || 20} stroke={1.8} />
    </span>
  );
}
