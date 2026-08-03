import { IconArrowRight, IconChevronRight } from "@tabler/icons-react";

import type { ViewState } from "../lib/viewState";

/**
 * A compact, true example of one published record and what connects to it.
 *
 * Home renders before the runtime bundle loads, so this is static markup — but
 * every link in it is a real published edge in data/generated/edges.json:
 *   nist-800-53:FAMILY-AC contains nist-800-53:AC-2   (structural)
 *   fedramp-rev5:MODERATE selects nist-800-53:AC-2    (applicability)
 *   nist-800-53a:AC-2 assesses nist-800-53:AC-2       (correlation)
 *   disa-cci:CCI-* maps_to nist-800-53:AC-2           (correlation, 47 edges)
 * tests/content-review.test.mjs asserts each one still exists.
 */
const AC2_NODE_ID = "nist-800-53:AC-2";

const CONNECTIONS = [
  { relation: "Selected by", target: "FedRAMP Moderate" },
  { relation: "Assessed by", target: "SP 800-53A" },
  { relation: "Connected through", target: "DISA CCIs" },
];

export function HomeChainPreview(props: {
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  // "Trace AC-2" promises connections, so it opens Map — never the default
  // Path view.
  const openRecord = () =>
    props.onNavigate("atlas-map", {
      node: AC2_NODE_ID,
      relationshipView: "map",
    });

  return (
    <section aria-labelledby="home-chain-title" className="home-chain">
      <h2 className="home-chain-title" id="home-chain-title">
        Follow a requirement
      </h2>

      <ol className="home-chain-path">
        <li>SP 800-53</li>
        <li aria-hidden="true">
          <IconChevronRight size={14} stroke={2} />
        </li>
        <li>Access Control</li>
        <li aria-hidden="true">
          <IconChevronRight size={14} stroke={2} />
        </li>
        <li className="home-chain-subject">AC-2 Account Management</li>
      </ol>

      <ul className="home-chain-branches">
        {CONNECTIONS.map((connection) => (
          <li key={connection.target}>
            <span className="home-chain-relation">{connection.relation}</span>
            <span className="home-chain-target">{connection.target}</span>
          </li>
        ))}
      </ul>

      <button className="home-chain-open" onClick={openRecord} type="button">
        Trace AC-2
        <IconArrowRight aria-hidden="true" size={16} stroke={2} />
      </button>
    </section>
  );
}
