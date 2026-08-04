import { useMemo, useState } from "react";

import type { AtlasFrameworkGroup } from "../lib/atlasDrilldown";

type AreaPosition = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  path: string;
};

export const ATLAS_UNIVERSE_POSITIONS: AreaPosition[] = [
  { id: "atlas:LIMB-GOVERNANCE", x: 55, y: 62, width: 220, height: 76, path: "M600 405 L520 330 L410 245 L275 100" },
  { id: "atlas:LIMB-RISK", x: 78, y: 184, width: 220, height: 76, path: "M600 405 L505 370 L390 305 L298 222" },
  { id: "atlas:LIMB-COMPLIANCE", x: 52, y: 318, width: 220, height: 76, path: "M600 405 L480 405 L360 356 L272 356" },
  { id: "atlas:LIMB-ARCHITECTURE", x: 115, y: 466, width: 220, height: 76, path: "M600 405 L505 455 L410 505 L335 504" },
  { id: "atlas:LIMB-IMPLEMENTATION", x: 490, y: 28, width: 220, height: 76, path: "M600 405 L600 104" },
  { id: "atlas:LIMB-ASSESSMENT", x: 920, y: 68, width: 220, height: 76, path: "M600 405 L690 325 L810 236 L920 106" },
  { id: "atlas:LIMB-OPERATIONS", x: 940, y: 214, width: 220, height: 76, path: "M600 405 L705 365 L830 303 L940 252" },
  { id: "atlas:LIMB-THREAT", x: 920, y: 360, width: 240, height: 76, path: "M600 405 L730 405 L840 398 L920 398" },
  { id: "atlas:LIMB-KNOWLEDGE", x: 850, y: 506, width: 220, height: 76, path: "M600 405 L705 455 L790 516 L850 544" },
];

export function atlasUniverseCollisions(
  positions: AreaPosition[] = ATLAS_UNIVERSE_POSITIONS,
  gap = 16,
): Array<[string, string]> {
  const collisions: Array<[string, string]> = [];
  for (let leftIndex = 0; leftIndex < positions.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < positions.length; rightIndex += 1) {
      const left = positions[leftIndex];
      const right = positions[rightIndex];
      const separated =
        left.x + left.width + gap <= right.x ||
        right.x + right.width + gap <= left.x ||
        left.y + left.height + gap <= right.y ||
        right.y + right.height + gap <= left.y;
      if (!separated) collisions.push([left.id, right.id]);
    }
  }
  return collisions;
}

type CatalogSummary = {
  id?: string;
  leaf_record_count?: number;
  node_count?: number;
};

function areaCounts(area: AtlasFrameworkGroup, catalogSummaries: CatalogSummary[]) {
  const summaryById = new Map(catalogSummaries.map((catalog) => [catalog.id, catalog]));
  const records = new Set<string>();
  for (const framework of area.frameworks) {
    for (const unit of framework.units) {
      for (const record of unit.records) records.add(record.id);
    }
  }
  const summarizedRecords = area.frameworks.reduce((total, framework) => {
    const summary = summaryById.get(framework.id);
    return total + (summary?.leaf_record_count ?? summary?.node_count ?? 0);
  }, 0);
  return {
    publications: area.frameworks.length,
    records: records.size || summarizedRecords,
  };
}

export function AtlasUniverse(props: {
  areas: AtlasFrameworkGroup[];
  catalogSummaries: CatalogSummary[];
  nodeCount: number;
  onOpenArea: (area: AtlasFrameworkGroup) => void;
  onOpenProcess: () => void;
}) {
  const { areas, catalogSummaries, nodeCount, onOpenArea, onOpenProcess } = props;
  const [activeArea, setActiveArea] = useState("");
  const byId = useMemo(() => new Map(areas.map((area) => [area.id, area])), [areas]);
  const collisions = atlasUniverseCollisions();

  if (collisions.length > 0) {
    return (
      <div className="atlas-universe-fallback" role="status">
        <p>The Atlas overview could not be laid out safely.</p>
        <div className="atlas-limb-grid">
          {areas.map((area) => (
            <button key={area.id} onClick={() => onOpenArea(area)} type="button">
              {area.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section aria-labelledby="atlas-universe-title" className="atlas-universe">
      <header className="atlas-universe__intro">
        <div>
          <p className="eyebrow">Control Atlas landscape</p>
          <h2 id="atlas-universe-title">Nine areas. One traceable landscape.</h2>
          <p>Open a branch to move from the organizing view into publisher-declared structure.</p>
        </div>
        <dl className="atlas-universe__totals" aria-label="Atlas totals">
          <div><dt>Published records</dt><dd>{nodeCount.toLocaleString()}</dd></div>
          <div><dt>Publications</dt><dd>{catalogSummaries.length.toLocaleString()}</dd></div>
        </dl>
      </header>

      <div className="atlas-universe__stage">
        <svg aria-hidden="true" className="atlas-universe__circuit" viewBox="0 0 1200 640">
          <defs>
            <filter id="atlas-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <path className="atlas-universe__root" d="M600 620 L600 405" />
          <path className="atlas-universe__root atlas-universe__root--left" d="M600 580 L510 620 L380 620" />
          <path className="atlas-universe__root atlas-universe__root--right" d="M600 580 L690 620 L820 620" />
          {ATLAS_UNIVERSE_POSITIONS.map((position, index) => (
            <g className={activeArea === position.id ? "is-active" : ""} key={position.id}>
              <path className="atlas-universe__branch" d={position.path} style={{ animationDelay: `${index * 55}ms` }} />
              <circle className="atlas-universe__terminal" cx={position.x < 600 ? position.x + position.width : position.x} cy={position.y + position.height / 2} r="5" />
            </g>
          ))}
          <g className="atlas-universe__core" filter="url(#atlas-glow)">
            <circle cx="600" cy="405" r="28" />
            <circle cx="600" cy="405" r="9" />
          </g>
        </svg>

        {ATLAS_UNIVERSE_POSITIONS.map((position) => {
          const area = byId.get(position.id);
          if (!area) return null;
          const counts = areaCounts(area, catalogSummaries);
          return (
            <button
              className={activeArea === area.id ? "atlas-universe__area is-active" : "atlas-universe__area"}
              key={area.id}
              onBlur={() => setActiveArea("")}
              onClick={() => onOpenArea(area)}
              onFocus={() => setActiveArea(area.id)}
              onMouseEnter={() => setActiveArea(area.id)}
              onMouseLeave={() => setActiveArea("")}
              style={{
                left: `${(position.x / 1200) * 100}%`,
                top: `${(position.y / 640) * 100}%`,
                width: `${(position.width / 1200) * 100}%`,
                minHeight: `${(position.height / 640) * 100}%`,
              }}
              type="button"
            >
              <strong>{area.label}</strong>
              <span>
                {counts.publications > 0
                  ? `${counts.publications} publication${counts.publications === 1 ? "" : "s"} · ${counts.records.toLocaleString()} records`
                  : "Open the connected work surface"}
              </span>
            </button>
          );
        })}

        <button className="atlas-universe__process" onClick={onOpenProcess} type="button">
          Trace the RMF lifecycle
        </button>
      </div>
    </section>
  );
}
