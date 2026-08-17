import {
  IconBuildingFactory2,
  IconBuildingStore,
  IconCloud,
  IconFolders,
  IconRepeat,
  IconSchool,
  IconShieldLock,
  IconTool,
  IconUsers,
} from "@tabler/icons-react";

const ICONS = {
  "dod-cybersecurity-portals": IconShieldLock,
  "reciprocity-authorization-reuse": IconRepeat,
  "implementation-assessment-tools": IconTool,
  "product-assurance-approved-products": IconBuildingStore,
  "cloud-devsecops-software-factories": IconCloud,
  "cmmc-defense-industrial-base": IconBuildingFactory2,
  "cyber-workforce-training": IconSchool,
  "practitioner-communities": IconUsers,
} as const;

export function CollectionIcon(props: { collectionId: string; size?: number }) {
  const Icon = ICONS[props.collectionId as keyof typeof ICONS] || IconFolders;
  return <Icon aria-hidden="true" size={props.size || 22} stroke={1.8} />;
}
