import type { SourceManifestRecord } from "./sourceManifest.ts";
import { SOURCE_SEED_MANIFEST } from "./sourceSeedManifest.ts";

export function classifySource(sourceId: string): SourceManifestRecord {
  const source = SOURCE_SEED_MANIFEST.find((item) => item.sourceId === sourceId);

  if (!source) {
    throw new Error(`Unknown sourceId: ${sourceId}`);
  }

  return source;
}
