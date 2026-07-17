import { ProvenanceTerm } from '../components/ProvenanceTerm';

export function parseCatalogItemIds(value: string, catalogId: string): string[] {
  return [
    ...new Set(
      String(value || '')
        .split(/[\s,]+/)
        .filter(Boolean)
        .map((id) => (id.includes(':') ? id : `${catalogId}:${id}`)),
    ),
  ];
}

export function formatSourceRefLabel(ref: {
  source_name?: string;
  source_version?: string;
  locator?: string;
  evidence_quality?: string;
}): string {
  const version = ref.source_version ? ` v${ref.source_version}` : '';
  const locator = ref.locator ? ` @ ${ref.locator}` : '';
  const quality = ref.evidence_quality ? ` [${ref.evidence_quality}]` : '';
  return `${ref.source_name || 'Unknown source'}${version}${locator}${quality}`;
}

export function isInferredLink(publicationStatus?: string, provenanceClass?: string): boolean {
  return publicationStatus === 'candidate' || provenanceClass === 'inferred';
}

export function PublicationStatusBadge(props: { publicationStatus?: string; provenanceClass?: string }) {
  const inferred = isInferredLink(props.publicationStatus, props.provenanceClass);
  return (
    <span className={`badge tone-${inferred ? 'warning' : 'success'}`}>
      <ProvenanceTerm
        kind="publication"
        label={inferred ? 'Candidate mapping' : 'Published mapping'}
        value={inferred ? 'candidate' : 'published'}
      />
    </span>
  );
}

export function ProvenanceBadge(props: { provenanceClass?: string; publicationStatus?: string }) {
  const inferred = isInferredLink(props.publicationStatus, props.provenanceClass);
  return (
    <div className="badge-row">
      <span className={`badge tone-${inferred ? 'warning' : 'success'}`}>
        <ProvenanceTerm
          kind="provenance"
          value={props.provenanceClass || ''}
        />
      </span>
      <PublicationStatusBadge
        provenanceClass={props.provenanceClass}
        publicationStatus={props.publicationStatus}
      />
    </div>
  );
}

export function SourceRefList(props: { refs?: Array<Record<string, string>> }) {
  const refs = props.refs || [];
  if (!refs.length) {
    return <span className="muted">No source references recorded.</span>;
  }
  return (
    <ul className="source-ref-list">
      {refs.map((ref, index) => (
        <li key={`${ref.source_id || ref.source_name || 'ref'}-${index}`}>{formatSourceRefLabel(ref)}</li>
      ))}
    </ul>
  );
}

export function ChainRelationshipItem(props: {
  node: { id: string; metadata?: { item_id?: string; title?: string }; label?: string };
  relationshipEdge?: { provenance_class?: string; publication_status?: string };
  sourceRefs?: Array<Record<string, string>>;
  onOpenNode: (nodeId: string) => void;
}) {
  const { node, relationshipEdge, sourceRefs, onOpenNode } = props;
  const itemId = node.metadata?.item_id || node.id;
  const title = node.metadata?.title || node.label || itemId;
  return (
    <li className="chain-link-item">
      <button className="link-action" onClick={() => onOpenNode(node.id)} type="button">
        <strong>{itemId}</strong> — {title}
      </button>
      {relationshipEdge ? (
        <ProvenanceBadge
          provenanceClass={relationshipEdge.provenance_class}
          publicationStatus={relationshipEdge.publication_status}
        />
      ) : null}
      <SourceRefList refs={sourceRefs} />
    </li>
  );
}
