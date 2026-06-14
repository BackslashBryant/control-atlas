# Control Atlas Data Sources

`docs/FEDERAL_SOURCE_POLICY.md` is the canonical inclusion and exclusion policy.

## Adopted Registry

The current `data/source-registry.json` schema `4.0` and its public-source validation remain the adopted baseline. Existing provenance values remain stable until a separately approved data-contract migration.

## Public Data Flow

Public sources are fetched or read at build time, normalized, validated, related, and emitted as static bundles. The browser reads those bundles only. It does not ingest user artifacts or submit generated content.

## Relationship Publication

Every displayable relationship includes semantic `relationship_type`, `provenance_class`, confidence, and evidence references. Inferred candidates remain visibly separate. Blocked relationships remain in graph health.

## Lawful Access

- Import only public official releases or lawful committed artifacts.
- Record access and license/use terms.
- Do not scrape around authentication.
- Do not redistribute restricted content.
- Do not accept runtime user/org/system data.
