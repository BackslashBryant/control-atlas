import { useMemo, type CSSProperties } from "react";
import { IconArrowUpRight } from "@tabler/icons-react";

import type {
  AtlasGraphProjection,
  AtlasSharedGroundEdge,
} from "../lib/atlasGraphProjection";
import { areaPresentationForCatalog } from "../lib/areaVisualLanguage";
import { catalogShortNameFor } from "../lib/catalogProfiles";

type AtlasFrameworkLinksProps = {
  /** The framework in scope. */
  publicationId: string;
  frameworks: AtlasGraphProjection;
  sharedGround: AtlasSharedGroundEdge[];
  /** Opens another framework, carrying the reader across. */
  onOpen: (publicationId: string) => void;
};

type Link = {
  publicationId: string;
  label: string;
  areaToken: string;
  count: number;
  /** Only set for a derived overlap. */
  via?: string;
  ratio?: number;
};

function formatCount(count: number): string {
  return count.toLocaleString("en-US");
}

function linkFor(publicationId: string, count: number): Link {
  const area = areaPresentationForCatalog(publicationId);
  return {
    publicationId,
    label: catalogShortNameFor(publicationId),
    areaToken: area?.token || "--ca-area-operations",
    count,
  };
}

/**
 * What this framework connects to, kept on screen while the reader is inside
 * it.
 *
 * The landscape is where the connections are learned, and until now clicking
 * into a framework threw all of them away — the columns show what a
 * publication contains and nothing about what it relates to, so the one thing
 * the reader had just understood disappeared at the moment they acted on it.
 * Published mappings and derived overlaps stay separated here exactly as they
 * are on the map.
 */
export function AtlasFrameworkLinks(props: AtlasFrameworkLinksProps) {
  const { publicationId, frameworks, sharedGround, onOpen } = props;

  const { published, derived } = useMemo(() => {
    const catalogOf = new Map(frameworks.nodes.map((node) => [node.id, node.publicationId]));
    const nodeId = frameworks.nodes.find((node) => node.publicationId === publicationId)?.id || "";
    if (!nodeId) return { published: [] as Link[], derived: [] as Link[] };
    const other = (source: string, target: string) =>
      catalogOf.get(source === nodeId ? target : source) || "";
    return {
      published: frameworks.edges
        .filter((edge) => edge.source === nodeId || edge.target === nodeId)
        .sort((a, b) => b.relationshipCount - a.relationshipCount)
        .map((edge) => linkFor(other(edge.source, edge.target), edge.relationshipCount))
        .filter((link) => link.publicationId),
      derived: sharedGround
        .filter((edge) => edge.source === nodeId || edge.target === nodeId)
        .sort((a, b) => b.overlapRatio - a.overlapRatio || b.sharedCount - a.sharedCount)
        .slice(0, 8)
        .map((edge) => ({
          ...linkFor(other(edge.source, edge.target), edge.sharedCount),
          via: catalogShortNameFor(edge.viaPublicationIds[0] || ""),
          ratio: edge.overlapRatio,
        }))
        .filter((link) => link.publicationId),
    };
  }, [frameworks, sharedGround, publicationId]);

  if (!published.length && !derived.length) return null;

  const row = (link: Link) => (
    <li key={`${link.via ? "d" : "p"}:${link.publicationId}`}>
      <button
        onClick={() => onOpen(link.publicationId)}
        style={{ "--ca-area-color": `var(${link.areaToken})` } as CSSProperties}
        title={
          link.via
            ? `${formatCount(link.count)} records in common, via ${link.via}`
            : `${formatCount(link.count)} published mappings`
        }
        type="button"
      >
        <span aria-hidden="true" className="atlas-constellation__dot" />
        <span className="atlas-constellation__crosswalk-name">
          {link.label}
          {link.via ? (
            <em>
              via {link.via} · {Math.round((link.ratio || 0) * 100)}%
            </em>
          ) : null}
        </span>
        <span className="atlas-constellation__crosswalk-count">
          {formatCount(link.count)}
        </span>
        <IconArrowUpRight aria-hidden="true" size={13} stroke={2} />
      </button>
    </li>
  );

  return (
    <aside aria-label="What this framework connects to" className="atlas-framework-links">
      {published.length ? (
        <>
          <h3>Crosswalks to</h3>
          <ul className="atlas-constellation__crosswalks">{published.map(row)}</ul>
        </>
      ) : null}
      {derived.length ? (
        <>
          <h3>
            Lands on the same records as
            <span title="Derived from published mappings, not a published mapping itself">
              derived
            </span>
          </h3>
          <ul className="atlas-constellation__crosswalks atlas-constellation__crosswalks--shared">
            {derived.map(row)}
          </ul>
        </>
      ) : null}
    </aside>
  );
}
