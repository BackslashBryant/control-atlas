import { catalogDisplayNameFor } from "./catalogProfiles";
import {
  recordIdentityPresentationFor,
  recordPublisherName,
  type RecordIdentityPresentation,
} from "./recordTitle";
import type { AtlasNeighborhoodNode, RuntimeBundle } from "./runtimeLoader";

/**
 * Resolve one runtime record through the shared identifier-presentation
 * contract. Callers may supply a neighborhood node because bounded Atlas and
 * Compare payloads can contain records that have not been expanded elsewhere
 * in the runtime yet.
 */
export function runtimeRecordIdentityFor(
  bundle: RuntimeBundle,
  nodeId: string,
  fallbackNode?: AtlasNeighborhoodNode | null,
): RecordIdentityPresentation {
  const node = bundle.runtime.getNode(nodeId) || fallbackNode || null;
  const document = bundle.runtime.getLibraryDocument(nodeId);
  const source = bundle.runtime.getSource(
    document?.source_id || node?.source_id || "",
  );
  const catalogId = document?.catalog_id || node?.metadata?.catalog_id || "";
  const catalog = bundle.runtime
    .getCatalogs()
    .find((entry: any) => entry.id === catalogId);

  return recordIdentityPresentationFor({
    publisher: recordPublisherName(
      document?.publisher_name,
      source?.owner,
      source?.publisher,
    ),
    catalogId,
    publicationName: catalogDisplayNameFor(
      catalogId,
      catalog?.name || document?.catalog_name || "",
    ),
    family: document?.control_family || node?.metadata?.family || "",
    itemId: document?.item_id || node?.metadata?.item_id || node?.label || nodeId,
    title: document?.title || node?.metadata?.title || node?.label || "",
    objectType: document?.object_type || node?.node_type || "",
    metadata: node?.metadata,
  });
}
