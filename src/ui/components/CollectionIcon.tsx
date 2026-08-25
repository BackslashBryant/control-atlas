import {
  IconBuildingFactory2,
  IconBuildingStore,
  IconCloud,
  IconCode,
  IconFolders,
  IconKey,
  IconMicroscope,
  IconNetwork,
  IconRadar,
  IconRepeat,
  IconSchool,
  IconSearch,
  IconServer,
  IconSettingsCheck,
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
  "vulnerability-management-prioritization": IconShieldLock,
  "detection-soc": IconRadar,
  "threat-intelligence-investigation": IconSearch,
  "dfir-threat-hunting": IconMicroscope,
  "stig-configuration-automation": IconSettingsCheck,
  "network-security-analysis": IconNetwork,
  "devsecops-supply-chain": IconCode,
  "identity-access-security": IconKey,
  "disa-services-capabilities": IconServer,
} as const;

const COLLECTION_TONES: Record<string, string> = {
  "dod-cybersecurity-portals": "governance",
  "reciprocity-authorization-reuse": "governance",
  "implementation-assessment-tools": "implementation",
  "product-assurance-approved-products": "compliance",
  "cloud-devsecops-software-factories": "architecture",
  "cmmc-defense-industrial-base": "risk",
  "cyber-workforce-training": "knowledge",
  "practitioner-communities": "community",
  "vulnerability-management-prioritization": "threats",
  "detection-soc": "operations",
  "threat-intelligence-investigation": "threats",
  "dfir-threat-hunting": "threats",
  "stig-configuration-automation": "implementation",
  "network-security-analysis": "assessment",
  "devsecops-supply-chain": "architecture",
  "identity-access-security": "governance",
  "disa-services-capabilities": "authority",
};

export function CollectionIcon(props: { collectionId: string; size?: number }) {
  const Icon = ICONS[props.collectionId as keyof typeof ICONS] || IconFolders;
  const tone = COLLECTION_TONES[props.collectionId] || "neutral";
  return (
    <span aria-hidden="true" className="collection-icon" data-collection-tone={tone}>
      <Icon size={props.size || 22} stroke={1.8} />
    </span>
  );
}
