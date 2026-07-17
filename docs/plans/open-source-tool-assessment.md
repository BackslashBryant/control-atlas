# Open-source tool assessment

**Decision date:** July 17, 2026
**Scope:** Post-v1 ingestion, search, and optional model-assisted build tooling. None of these tools is part of the v1.0 release gate.

Control Atlas should remain static-first, deterministic, source-traceable, and usable without an AI service. A tool earns a place only when a measured problem requires it and its output can preserve canonical source URLs, checksums, and reviewable build artifacts.

## Recommendation

| Tool | Decision | Control Atlas fit |
| --- | --- | --- |
| [Crawl4AI](https://docs.crawl4ai.com/) | Pilot after v1 | Best near-term candidate for controlled acquisition of dynamic official pages that current fetchers cannot reliably capture. Compare it against the existing source adapters on two or three difficult sources before adoption. |
| [Chonkie](https://docs.chonkie.ai/oss/quick-start) | Evaluate only after a search benchmark | Its local chunkers could help long-document discovery, but the current search problem was ranking and corpus coverage, not proof that another chunking layer is needed. |
| [Qdrant](https://qdrant.tech/documentation/search/hybrid-queries/) | Conditional experiment | Hybrid lexical/vector search may improve plain-language discovery, but a server-backed vector store would expand the architecture of a static product. Adopt only if a benchmark shows a material gain over deterministic static search and a build-time index is insufficient. |
| [Ollama](https://docs.ollama.com/capabilities/structured-outputs) | Optional local research harness | Useful for private, build-time structured-output experiments. It must not become a runtime dependency or a provenance authority. Test the smallest viable model first and stop if laptop latency or memory is impractical. |
| [Marker](https://github.com/datalab-to/marker) | Hold for license review | Strong document-to-Markdown/JSON capability, but the project is GPL-3.0 and its commercial-use terms require deliberate review before it enters an MIT-licensed product pipeline. Keep it isolated from production until that review is complete. |
| [Instructor](https://github.com/567-labs/instructor) | Preferred structured-output option if needed | If model-assisted extraction is later approved, schema validation and retries fit a reviewable Python ingestion pipeline. Do not add it before a concrete extraction job exists. |
| [Outlines](https://dottxt-ai.github.io/outlines/latest/) | Alternative, not a companion to Instructor | Consider when constrained decoding for a local model is specifically required. Avoid carrying two overlapping structured-output stacks. |
| [Langfuse](https://langfuse.com/docs) | Skip now | Observability, evaluation, and prompt management solve an ongoing LLM-service problem that Control Atlas does not currently have. |
| [LiteLLM](https://docs.litellm.ai/) | Skip now | A multi-provider gateway adds value only after the product has a recurring, approved multi-model workload. |
| [DSPy](https://dspy.ai/) | Skip now | Prompt/program optimization is premature without a stable model-assisted task, labeled evaluation set, and demonstrated need. |

## Proposed sequence

1. Ship v1.0 without any of these dependencies.
2. Create a representative search evaluation set: exact IDs, exact titles, novice topic queries, acronyms, current-resource queries, and known no-result cases.
3. Pilot Crawl4AI on difficult official sources while preserving the current provenance contract.
4. Benchmark current search before considering Chonkie or Qdrant. Require a documented quality gain and acceptable static-build/runtime cost.
5. If a repeatable extraction task remains, evaluate one structured-output path: Instructor for schema validation/retries, or Outlines for constrained local decoding.
6. Revisit Langfuse, LiteLLM, or DSPy only if Control Atlas deliberately becomes an ongoing multi-model system.

## Non-negotiable acceptance criteria

- No generated relationship is presented as published source truth.
- Every ingested claim retains its canonical source, retrieval date, and checksum.
- Model output is an auditable draft or build intermediate, never the only evidence.
- Search quality is measured against a checked-in evaluation set before and after a change.
- New services must have an offline/static fallback and a documented operating cost.
- License compatibility is reviewed before code or generated artifacts enter the release pipeline.
