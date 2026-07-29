import type {
  CommonsResource,
  CommonsSearchIndexDoc,
} from "./commonsTypes";

export function searchResourceDocuments<T extends CommonsResource | CommonsSearchIndexDoc>(
  documents: T[],
  query: string,
  limit?: number,
): Array<{ document: T; evidence: string[] }>;
