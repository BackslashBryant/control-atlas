export type ConnectionInventoryRow = {
  id: string;
  label: string;
  totalRecords: number;
  connectedRecords: number;
  publishedLinks: number;
  relatedCategories: string[];
};

export type ConnectionInventory = {
  totalRecords: number;
  publishedLinks: number;
  rows: ConnectionInventoryRow[];
};

export function buildConnectionInventory(
  nodes: Array<{ id: string; node_type: string }>,
  edges: Array<{
    source_node_id: string;
    target_node_id: string;
    publication_status: string;
  }>,
): ConnectionInventory;
