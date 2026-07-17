# Open-source tool assessment

**Decision date:** July 17, 2026
**Scope:** Post-v1 ingestion, search, and optional model-assisted build tooling. None of these tools is part of the v1.0 release gate. Results from the July 17 bounded spike are recorded in [`../spikes/open-source-tool-spike-results-2026-07-17.md`](../spikes/open-source-tool-spike-results-2026-07-17.md).

The broader UI/UX, copy, build, data aggregation, OSCAL, and supply-chain review is recorded in [`open-source-platform-strengthening-assessment-2026-07-17.md`](open-source-platform-strengthening-assessment-2026-07-17.md).

Control Atlas should remain static-first, deterministic, source-traceable, and usable without an AI service. A tool earns a place only when a measured problem requires it and its output can preserve canonical source URLs, checksums, and reviewable build artifacts.

## Recommendation

| Tool | Decision | Control Atlas fit |
| --- | --- | --- |
| [Crawl4AI](https://docs.crawl4ai.com/) | Hold as an isolated exception fallback | It recovered a JavaScript-driven DoD transcript, but the spike environment and cache exceeded 1.1 GB and pulled 93 packages. Revisit only after three active sources defeat the existing Playwright path. |
| [Chonkie](https://docs.chonkie.ai/oss/quick-start) | Hold for long-document search | Sentence chunking was fast (2,185 chunks from 1,216 records in 0.096 s), but chunking alone does not repair today's record ranking. |
| [Qdrant](https://qdrant.tech/documentation/search/hybrid-queries/) | Reject for the current static stack | Both full and reduced local semantic-index trials exceeded their time limits. It also lacks a credible static deployment path for this product today. |
| [Ollama](https://docs.ollama.com/capabilities/structured-outputs) | Optional local research harness | Useful for private, build-time structured-output experiments. It must not become a runtime dependency or a provenance authority. Test the smallest viable model first and stop if laptop latency or memory is impractical. |
| [Marker](https://github.com/datalab-to/marker) | Reject locally; hold for external evaluation | The dry-run resolved 79 packages including Torch, Surya OCR, and Transformers before model download. Keep it out of the laptop and product; reconsider only for a named blocking PDF after license review. |
| [Instructor](https://github.com/567-labs/instructor) | Preferred structured-output option if needed | If model-assisted extraction is later approved, schema validation and retries fit a reviewable Python ingestion pipeline. Do not add it before a concrete extraction job exists. |
| [Outlines](https://dottxt-ai.github.io/outlines/latest/) | Alternative, not a companion to Instructor | Consider when constrained decoding for a local model is specifically required. Avoid carrying two overlapping structured-output stacks. |
| [Langfuse](https://langfuse.com/docs) | Skip now | Observability, evaluation, and prompt management solve an ongoing LLM-service problem that Control Atlas does not currently have. |
| [LiteLLM](https://docs.litellm.ai/) | Skip now | A multi-provider gateway adds value only after the product has a recurring, approved multi-model workload. |
| [DSPy](https://dspy.ai/) | Skip now | Prompt/program optimization is premature without a stable model-assisted task, labeled evaluation set, and demonstrated need. |

## Proposed sequence

1. Ship v1.0 without any of these dependencies.
2. Create a representative search evaluation set: exact IDs, exact titles, novice topic queries, acronyms, current-resource queries, and known no-result cases.
3. Use the existing Playwright path for dynamic sources. Reconsider isolated Crawl4AI only after three active sources defeat that path.
4. Improve deterministic search against the checked-in benchmark. Do not add Qdrant to the current static architecture; retain Chonkie only as a future long-document option.
5. If a repeatable extraction task remains, evaluate one structured-output path: Instructor for schema validation/retries, or Outlines for constrained local decoding.
6. Revisit Langfuse, LiteLLM, or DSPy only if Control Atlas deliberately becomes an ongoing multi-model system.

## Non-negotiable acceptance criteria

- No generated relationship is presented as published source truth.
- Every ingested claim retains its canonical source, retrieval date, and checksum.
- Model output is an auditable draft or build intermediate, never the only evidence.
- Search quality is measured against a checked-in evaluation set before and after a change.
- New services must have an offline/static fallback and a documented operating cost.
- License compatibility is reviewed before code or generated artifacts enter the release pipeline.
