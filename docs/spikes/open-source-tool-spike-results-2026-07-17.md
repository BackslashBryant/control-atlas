# Open-source tool spike results

**Date:** July 17, 2026
**Branch:** `agent/muse/v1-0-approved-comp-recovery`
**Release effect:** None. No production dependency or runtime service was added.

## Decision summary

| Candidate | Decision | Evidence |
| --- | --- | --- |
| Crawl4AI 0.9.2 | **Hold as an isolated exception fallback** | It recovered a useful DoD training transcript from a JavaScript-driven page, but its disposable environment and package cache consumed about 1.1 GB and installed 93 packages, including LLM/provider dependencies that the deterministic use case does not need. Reconsider only when at least three active sources cannot be handled by the existing Playwright-based fetch path. |
| Chonkie 1.7.0 | **Hold for future long-document search** | It split 1,216 NIST documents into 2,185 sentence-aware chunks in 0.096 seconds. The current search index is record-oriented, so chunking alone does not solve the release problem. |
| Qdrant client 1.18.0 + FastEmbed | **Reject for the current static stack** | A local semantic index over 1,216 NIST records missed the five-minute stop criterion. A reduced base-control sample also missed a three-minute stop criterion. Both timed-out processes were stopped. The architecture would also require a new index/service or large static artifact. |
| Marker 1.10.2 | **Reject for local integration; hold for external evaluation** | The dry-run resolved 79 packages before any OCR/layout model download, including Torch, Surya OCR, Transformers, OpenCV, SciPy, Anthropic, Google, and OpenAI SDKs. Marker is GPL-3.0 and still needs deliberate license review for the proposed isolated use. No package or model was installed. |

## Search baseline

The checked-in benchmark covers exact IDs, expert titles, plain-language novice questions, and a known no-result case.

| Audience | Current MiniSearch |
| --- | ---: |
| Expert | 3/4 (75.0%) |
| Novice, including no-result guard | 1/6 (16.7%) |

Notable failures:

- `account management` ranked SP 800-53A assessment procedures ahead of the AC-2 control.
- `manage system accounts` did not return AC-2 in the first five results.
- Three natural-language queries returned either irrelevant records or no results.

This proves the search complaint, but it does not prove that a vector database is the right repair. The next release-safe move is to improve deterministic ranking, catalog weighting, aliases, and query handling against this benchmark.

### Release-safe repair result

The deterministic runtime now normalizes five common novice intents and ranks exact IDs, exact titles, NIST controls, and control records ahead of secondary assessment material. The expanded checked-in gate adds paraphrase variants rather than only repeating the original failing phrases.

| Audience | Before repair | After repair |
| --- | ---: | ---: |
| Expert | 3/4 (75.0%) | **4/4 (100%)** |
| Novice, including paraphrases and no-result guard | 1/6 (16.7%) | **11/11 (100%)** |

The repaired benchmark ran against all 11,486 generated search documents. It is now part of `npm run test:runtime`; no vector database, model, runtime service, or new production dependency was required.

## Crawl4AI evidence

| Fixture | Raw HTTP | Crawl4AI deterministic browser extraction |
| --- | --- | --- |
| FedRAMP 2026 source index | 2,275 text characters; both expected signals; 0.28 s | 1,869 Markdown characters; one of two signals; 3.37 s |
| DoD PPSM training page | 29 text characters; no expected signals; 0.26 s | 8,087 Markdown characters; both expected signals; 4.54 s |

The DoD output contained the actual transcript rather than only player controls. Existing Playwright could expose the hidden transcript with a source-specific selector, so Crawl4AI is valuable for generic cleanup but not yet justified as a default dependency.

## Chonkie and Qdrant evidence

- Chonkie chunking was deterministic and fast: 2,185 chunks, 973,800 characters, 0.096 seconds.
- The disposable search environment consumed 176.6 MB; its package cache consumed 189.2 MB; the smallest selected embedding model cache consumed 64.1 MB.
- Full and reduced Qdrant/FastEmbed attempts exceeded their time limits and were terminated. Neither produced a trustworthy ranking result, so no quality claim is made.

The benchmark remains the adoption gate: preserve 100% exact-ID success and improve novice top-five success by at least 20 percentage points with an offline/static deployment path.

## Marker evidence

The dry-run intentionally stopped before installation. Its dependency plan was already disproportionate to Control Atlas's current PDF needs, and the existing source registry primarily uses structured JSON, XML, XLSX, and DOCX artifacts. Marker may be reconsidered in an isolated CI/container experiment only when a named PDF blocks source coverage and lightweight extraction demonstrably fails.

## Reproduction

Committed spike assets:

- `tests/benchmarks/search-quality.json`
- `scripts/spikes/search-baseline.mjs`
- `scripts/spikes/chonkie-qdrant-search.py`
- `scripts/spikes/crawl4ai-ingestion.py`

Disposable environments, caches, and models are not retained. Reproduction must use an isolated environment and the stop criteria in the spike plan.
