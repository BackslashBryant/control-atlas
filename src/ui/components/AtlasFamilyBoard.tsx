import { useMemo, type CSSProperties } from "react";
import { IconArrowRight } from "@tabler/icons-react";

import type { AtlasGraphProjection } from "../lib/atlasGraphProjection";
import type { AtlasLensFamily } from "../lib/atlasLensFamilies";
import { areaPresentationForCatalog } from "../lib/areaVisualLanguage";
import { catalogShortNameFor } from "../lib/catalogProfiles";

/**
 * Something the current grouping cannot file, named rather than dropped.
 *
 * The publisher lens has two: the statutes, regulations and directives, which
 * are obligations rather than publishers and which nobody crosswalks to, and
 * any publication issued outside the federal ecosystems. Both were visible in
 * the view this board replaced, and a board that silently held fewer than 28
 * publications would be telling the reader they were looking at everything.
 */
export type AtlasBoardStrip = {
  id: string;
  heading: string;
  note: string;
  entries: {
    id: string;
    label: string;
    count: number;
    /** Present when the entry opens something; absent entries stay read-only. */
    publicationId?: string;
  }[];
};

type AtlasFamilyBoardProps = {
  families: AtlasLensFamily[];
  frameworks: AtlasGraphProjection;
  /** What this grouping answers, shown once above the board. */
  blurb: string;
  /** Landmarks this grouping cannot place. Rendered under the groups. */
  strips?: AtlasBoardStrip[];
  onOpenFamily: (familyId: string) => void;
  onOpenFramework: (publicationId: string) => void;
};

function formatCount(count: number): string {
  return count.toLocaleString("en-US");
}

/**
 * The first screen: five or six groups, not twenty-eight frameworks.
 *
 * Connections between groups are named and counted rather than drawn. Six
 * boxes with lines between every pair that shares a crosswalk is fifteen
 * lines — the same tangle the old landing had, at a smaller scale — and the
 * question a reader has here is "which of these has anything to do with the
 * other" , which a sentence answers better than an arc. Lines come back one
 * level down, where they connect a handful of frameworks inside one group.
 */
export function AtlasFamilyBoard(props: AtlasFamilyBoardProps) {
  const { families, frameworks, blurb, strips, onOpenFamily, onOpenFramework } = props;

  const board = useMemo(() => {
    const nodeByPublication = new Map(
      frameworks.nodes.map((node) => [node.publicationId, node]),
    );
    const familyOfNodeId = new Map<string, string>();
    for (const family of families) {
      for (const catalogId of family.catalogIds) {
        const node = nodeByPublication.get(catalogId);
        if (node) familyOfNodeId.set(node.id, family.id);
      }
    }

    // Every published crosswalk that leaves one group for another, summed.
    const between = new Map<string, Map<string, number>>();
    for (const edge of frameworks.edges) {
      const from = familyOfNodeId.get(edge.source);
      const to = familyOfNodeId.get(edge.target);
      if (!from || !to || from === to) continue;
      for (const [a, b] of [[from, to], [to, from]] as const) {
        const row = between.get(a) || new Map<string, number>();
        row.set(b, (row.get(b) || 0) + edge.relationshipCount);
        between.set(a, row);
      }
    }

    const labelOf = new Map(families.map((family) => [family.id, family.label]));

    return families.map((family) => {
      const members = family.catalogIds
        .map((catalogId) => {
          const node = nodeByPublication.get(catalogId);
          if (!node) return null;
          const area = areaPresentationForCatalog(catalogId);
          return {
            catalogId,
            nodeId: node.id,
            shortName: catalogShortNameFor(catalogId, node.label),
            // The stored count includes the catalog's own root row, which is
            // not a record anyone can open.
            records: Math.max(0, node.canonicalRecordCount - 1),
            areaToken: area?.token || "--ca-area-operations",
          };
        })
        .filter((member): member is NonNullable<typeof member> => member !== null)
        .sort((a, b) => b.records - a.records);

      const links = [...(between.get(family.id) || new Map<string, number>())]
        .map(([id, count]) => ({ id, count, label: labelOf.get(id) || id }))
        .sort((a, b) => b.count - a.count);

      return {
        family,
        members,
        links,
        records: members.reduce((total, member) => total + member.records, 0),
        areaToken: members[0]?.areaToken || "--ca-area-operations",
      };
    });
  }, [families, frameworks]);

  return (
    <section className="atlas-family-board" data-testid="atlas-family-board">
      <p className="atlas-family-board__lede">{blurb}</p>
      <ul className="atlas-family-board__grid">
        {board.map((entry) => (
          <li
            className="atlas-family-board__card"
            key={entry.family.id}
            style={{ "--ca-area-color": `var(${entry.areaToken})` } as CSSProperties}
          >
            <h3>
              <button
                className="atlas-family-board__open"
                onClick={() => onOpenFamily(entry.family.id)}
                type="button"
              >
                {entry.family.label}
                <IconArrowRight aria-hidden="true" size={15} stroke={2} />
              </button>
            </h3>
            <p className="atlas-family-board__blurb">{entry.family.blurb}</p>

            <p className="atlas-family-board__facts">
              <span>
                {entry.members.length}{" "}
                {entry.members.length === 1 ? "publication" : "publications"}
              </span>
              <span>{formatCount(entry.records)} records</span>
            </p>

            {/* Named at rest, so the group is never a mystery box the reader
                has to open to find out what is in it. */}
            <ul className="atlas-family-board__members">
              {entry.members.map((member) => (
                <li key={member.catalogId}>
                  <button
                    onClick={() => onOpenFramework(member.catalogId)}
                    style={
                      { "--ca-area-color": `var(${member.areaToken})` } as CSSProperties
                    }
                    title={`Open ${member.shortName} — ${formatCount(member.records)} records`}
                    type="button"
                  >
                    {member.shortName}
                  </button>
                </li>
              ))}
            </ul>

            {entry.links.length ? (
              <p className="atlas-family-board__links">
                <span>Crosswalks to</span>
                {entry.links.slice(0, 3).map((link) => (
                  <button
                    key={link.id}
                    onClick={() => onOpenFamily(link.id)}
                    type="button"
                  >
                    {link.label}
                    <em>{formatCount(link.count)}</em>
                  </button>
                ))}
              </p>
            ) : (
              <p className="atlas-family-board__links atlas-family-board__links--none">
                No published crosswalks to the other groups yet.
              </p>
            )}
          </li>
        ))}
      </ul>

      {(strips || [])
        .filter((strip) => strip.entries.length > 0)
        .map((strip) => (
          <div className="atlas-family-board__strip" key={strip.id}>
            <p className="atlas-family-board__strip-heading">
              {strip.heading}
              <span>{strip.entries.length}</span>
            </p>
            <p className="atlas-family-board__strip-note">{strip.note}</p>
            <ul>
              {strip.entries.map((entry) => (
                <li key={entry.id}>
                  {/* Read-only where the landmark has nowhere to go. The
                      authority groups have never been openable, and a button
                      that does nothing is worse than a label. */}
                  {entry.publicationId ? (
                    <button
                      onClick={() => onOpenFramework(entry.publicationId as string)}
                      type="button"
                    >
                      {entry.label}
                      <small>{formatCount(entry.count)}</small>
                    </button>
                  ) : (
                    <span>
                      {entry.label}
                      <small>{formatCount(entry.count)}</small>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
    </section>
  );
}
