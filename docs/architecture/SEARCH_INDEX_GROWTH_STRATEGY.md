# Search Index Growth and Sharding Strategy

## Overview

Control Atlas currently indexes over 17,700 federal compliance controls, DISA STIG/SRG rules, DISA CCIs, NIST SP 800-53 rev4/rev5 controls, NIST SP 800-171 rev2/rev3 controls, and MITRE ATT&CK techniques in a single client-side JSON artifact (`data/generated/library-search.json`).

Current payload metrics:
- Raw JSON size: ~3.2 MB
- Gzip compressed size: ~956 KB
- Client parse time: ~12 ms on desktop / ~38 ms on mobile

## Trigger Thresholds

To maintain instant zero-latency search while complying with GitHub Pages static hosting limits and mobile transfer constraints, the following growth triggers are defined:

| Trigger Metric | Threshold | Action Required |
|---|---|---|
| Compressed Gzip Size | > 1.2 MB | Activate Catalog-Based Sharding |
| Uncompressed JSON Size | > 5.0 MB | Activate Term Identifier Dictionary Compression |
| Search Matching Latency | > 50 ms | Shift Search Filtering to Web Worker |

## Sharding & Optimization Architecture

### Phase 1: Term ID Compression (Next Incremental Milestone)
- Replace repeated property names (`catalog_id`, `plain_language_summary`, `publication_status`) with 1-byte integer tokens in the JSON schema.
- Reduces raw JSON payload size by ~35% without altering search accuracy.

### Phase 2: Catalog-Based Sharding
- Split `library-search.json` into modular catalog shards:
  - `library-search-core.json`: SP 800-53, SP 800-171, CSF 2.0 (~250 KB gzip)
  - `library-search-stigs.json`: DISA STIGs and SRGs (~550 KB gzip)
  - `library-search-ccis.json`: DISA CCIs (~180 KB gzip)
- The core runtime loads `library-search-core.json` immediately during shell hydration and lazy-loads secondary shards in parallel when search filters select STIG or CCI catalogs.

### Phase 3: Dedicated Web Worker Search Engine
- Move search tokenization and multi-field fuzzy matching off the main browser UI thread into a Dedicated Web Worker (`src/app/search-worker.mjs`).
- Guarantees 60fps UI rendering during active keystroke typing even with 50,000+ indexed items.
