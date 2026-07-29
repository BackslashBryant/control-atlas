"""Isolated build-time spike. Requires only the disposable spike environment."""

from __future__ import annotations

import json
import platform
import time
import uuid
from pathlib import Path

import chonkie
import qdrant_client
from chonkie import SentenceChunker
from qdrant_client import QdrantClient


ROOT = Path(__file__).resolve().parents[2]
MODEL = "BAAI/bge-small-en-v1.5"
MIN_SCORE = 0.48


def load_documents() -> list[dict]:
    search_payload = json.loads(
        (ROOT / "data" / "generated" / "library-search.json").read_text(
            encoding="utf-8"
        )
    )
    graph_payload = json.loads(
        (ROOT / "data" / "generated" / "nodes.json").read_text(encoding="utf-8")
    )
    description_by_id = {
        node["id"]: node.get("metadata", {}).get("description", "")
        for node in graph_payload["nodes"]
    }
    return [
        {**document, "description": description_by_id.get(document["id"], "")}
        for document in search_payload["library_search"]["documents"]
    ]


def normalize_control_notation(value: str) -> str:
    return (
        value.strip()
        .upper()
        .replace(" ", "")
        .replace("(", ".")
        .replace(")", "")
    )


started = time.perf_counter()
all_documents = load_documents()
nist_documents = [
    document for document in all_documents if document["catalog_id"] == "nist-800-53"
]
cci_documents = [
    document for document in all_documents if document["catalog_id"] == "disa-cci"
]
benchmark = json.loads(
    (ROOT / "tests" / "benchmarks" / "search-quality.json").read_text(
        encoding="utf-8"
    )
)
semantic_expected_ids = {
    expected_id
    for fixture in benchmark["queries"]
    for expected_id in fixture["expected_ids"]
}
semantic_documents = [
    document
    for document in nist_documents
    if document.get("object_type") == "control"
    or document["id"] in semantic_expected_ids
]
all_exact_documents = nist_documents + cci_documents
exact_by_item_id = {
    normalize_control_notation(document["item_id"]): document
    for document in all_exact_documents
}

chunker = SentenceChunker(
    tokenizer="character",
    chunk_size=700,
    chunk_overlap=100,
    min_characters_per_sentence=8,
)
chunk_texts: list[str] = []
chunk_metadata: list[dict] = []
chunk_ids: list[str] = []
for document in semantic_documents:
    record_text = "\n".join(
        value
        for value in [
            f'{document["item_id"]} — {document["title"]}',
            document.get("plain_language_summary", ""),
            document.get("description", ""),
        ]
        if value
    )
    chunks = chunker.chunk(record_text) or []
    for index, chunk in enumerate(chunks):
        chunk_texts.append(
            f'{document["item_id"]} — {document["title"]}\n{chunk.text}'
        )
        chunk_metadata.append(
            {
                "document_id": document["id"],
                "item_id": document["item_id"],
                "title": document["title"],
                "chunk_index": index,
            }
        )
        chunk_ids.append(
            str(uuid.uuid5(uuid.NAMESPACE_URL, f'{document["id"]}#{index}'))
        )

cache_dir = ROOT / ".spike" / "fastembed-cache"
cache_dir.mkdir(parents=True, exist_ok=True)
client = QdrantClient(":memory:")
client.set_model(MODEL, cache_dir=str(cache_dir), threads=4)
index_started = time.perf_counter()
client.add(
    collection_name="control-atlas-search-spike",
    documents=chunk_texts,
    metadata=chunk_metadata,
    ids=chunk_ids,
    batch_size=64,
)
index_elapsed = time.perf_counter() - index_started


def retrieve(query: str, top_k: int) -> tuple[list[str], list[dict]]:
    exact = exact_by_item_id.get(normalize_control_notation(query))
    if exact:
        return [exact["id"]], [
            {"document_id": exact["id"], "score": 1.0, "route": "exact-id"}
        ]

    raw = client.query(
        collection_name="control-atlas-search-spike",
        query_text=query,
        limit=max(50, top_k * 10),
    )
    best_by_document: dict[str, dict] = {}
    for result in raw:
        metadata = result.metadata or {}
        document_id = metadata.get("document_id")
        if not document_id or result.score < MIN_SCORE:
            continue
        previous = best_by_document.get(document_id)
        if previous is None or result.score > previous["score"]:
            best_by_document[document_id] = {
                "document_id": document_id,
                "score": round(float(result.score), 4),
                "title": metadata.get("title"),
                "chunk_index": metadata.get("chunk_index"),
                "route": "semantic-chunk",
            }
    ranked = sorted(
        best_by_document.values(), key=lambda result: result["score"], reverse=True
    )[:top_k]
    return [result["document_id"] for result in ranked], ranked


results = []
for fixture in benchmark["queries"]:
    query_started = time.perf_counter()
    ids, details = retrieve(fixture["query"], fixture["top_k"])
    passed = (
        len(ids) == 0
        if not fixture["expected_ids"]
        else any(expected in ids for expected in fixture["expected_ids"])
    )
    results.append(
        {
            **fixture,
            "passed": passed,
            "result_ids": ids,
            "result_details": details,
            "elapsed_ms": round((time.perf_counter() - query_started) * 1000, 2),
        }
    )


def audience_summary(audience: str) -> dict:
    relevant = [result for result in results if result["audience"] == audience]
    passed = sum(1 for result in relevant if result["passed"])
    return {
        "passed": passed,
        "total": len(relevant),
        "pass_rate": round(passed / len(relevant), 3) if relevant else 0,
    }


print(
    json.dumps(
        {
            "engine": "chonkie-qdrant-fastembed-local",
            "python": platform.python_version(),
            "versions": {
                "chonkie": getattr(chonkie, "__version__", "unknown"),
                "qdrant_client": getattr(qdrant_client, "__version__", "unknown"),
            },
            "model": MODEL,
            "minimum_score": MIN_SCORE,
            "corpus_documents": len(semantic_documents),
            "full_nist_documents": len(nist_documents),
            "chunks": len(chunk_texts),
            "index_elapsed_seconds": round(index_elapsed, 2),
            "total_elapsed_seconds": round(time.perf_counter() - started, 2),
            "summary": {
                "expert": audience_summary("expert"),
                "novice": audience_summary("novice"),
            },
            "results": results,
        },
        indent=2,
    )
)
