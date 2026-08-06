# Open-source tool spike plan

**Date:** July 17, 2026
**Scope:** Crawl4AI, Chonkie, Qdrant, and Marker only.
**Boundary:** Build-time experiments only. No application dependency, runtime service, generated relationship, or release claim may result from these spikes.

## Questions

1. **Crawl4AI:** Can deterministic, non-LLM extraction recover useful, traceable content from official pages that are awkward for the current fetchers?
2. **Chonkie + Qdrant:** Does chunked hybrid retrieval materially improve novice search without weakening exact-ID and expert-query results?
3. **Marker:** Does its PDF extraction preserve headings and tables materially better than the current lightweight PDF path at an acceptable installation and resource cost?

## Fixtures

- Crawl two official pages: the FedRAMP 2026 source index and the DoD PPSM training page already present in the artifact registry.
- Search the generated Control Atlas library with the checked-in novice/expert benchmark in `tests/benchmarks/search-quality.json`.
- Extract one official DCSA PDF from the artifact registry, starting with a small form. Escalate to the larger process manual only if the small trial is viable.

## Stop criteria

- Stop an installation that requires a production dependency change or privileged/system mutation.
- Stop a local model or document pipeline if the smallest viable trial is already impractical in download size, memory, or latency.
- Stop Marker before model download if Python compatibility or the dependency plan is unreasonable for an isolated build tool.
- Do not retain downloaded models, containers, PDFs, caches, or virtual environments after evidence is recorded.

## Adoption gates

- **Crawl4AI:** Must preserve canonical URL, retrieval time, content hash, and deterministic selector configuration; extracted content must beat the current HTTP/HTML fallback on at least one fixture.
- **Chonkie + Qdrant:** Must retain 100% exact-ID success and improve novice top-5 success by at least 20 percentage points over current MiniSearch. The result must have a credible static/offline deployment path.
- **Marker:** Must preserve materially more useful structure than `pdf-parse`, finish within five minutes on the small fixture, and pass license review for the proposed isolated use.

The decision record will be adopt, hold, or reject for each candidate, with commands, versions, timings, resource observations, and output hashes.
