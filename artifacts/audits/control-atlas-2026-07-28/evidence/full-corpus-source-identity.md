# Full-corpus source-identity report

Date: 2026-07-29
Candidate branch: `agent/forge/control-atlas-holistic-correction`

The generated corpus contains 11,674 nodes across 50 registered sources. Every graph node has:

- one exact publication identity resolved from its catalog root;
- a separately recorded ingestion source when ingestion differs from publication;
- a canonical source identifier present in the source registry; and
- no guessed or synthesized official deep link.

`tests/catalog-publication-identity.test.mjs` checks every generated node and passes with zero missing or mismatched publication identities. Negative fixtures prove that a missing catalog publication, a mismatched publication source, or an ingestion source used as publication identity fails closed.

Publisher-tree doctrine is independently enforced across the full graph:

- each `parent_id` is backed by a published structural edge;
- parent and child remain inside the same native catalog;
- baselines, mappings, applicability, evidence, implementation aids, processes, and Resources cannot become parents;
- the 11 graph-health findings remain blocked and unpublished.

Verified corpus counts:

| Item | Count |
| --- | ---: |
| Sources | 50 |
| Nodes | 11,674 |
| Edges | 22,273 |
| Evidence records | 22,273 |
| Blocked graph-health findings | 11 |
| Published inferred candidate edges | 0 |
