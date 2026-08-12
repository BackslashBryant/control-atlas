#!/usr/bin/env python3
"""Deterministically extract page text, located lines, and selected PDF tables."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path
from typing import Iterable

import pdfplumber


def parse_page_ranges(value: str, page_count: int) -> set[int]:
    if not value:
        return set()
    pages: set[int] = set()
    for part in value.split(","):
        token = part.strip()
        if not token:
            continue
        if "-" in token:
            start_text, end_text = token.split("-", 1)
            start, end = int(start_text), int(end_text)
            if start > end:
                raise ValueError(f"Invalid descending page range: {token}")
            pages.update(range(start, end + 1))
        else:
            pages.add(int(token))
    invalid = sorted(page for page in pages if page < 1 or page > page_count)
    if invalid:
        raise ValueError(f"Table page(s) outside 1-{page_count}: {invalid}")
    return pages


def rounded_box(box: Iterable[float] | None) -> list[float] | None:
    return [round(float(value), 3) for value in box] if box else None


def located_lines(page) -> list[dict]:
    lines = []
    for index, line in enumerate(page.extract_text_lines(strip=True, return_chars=False) or [], 1):
        text = str(line.get("text") or "").strip()
        if not text:
            continue
        lines.append({
            "id": f"line-{index}",
            "text": text,
            "bbox": rounded_box((line["x0"], line["top"], line["x1"], line["bottom"])),
        })
    return lines


def located_tables(page) -> list[dict]:
    output = []
    for table_index, table in enumerate(page.find_tables(), 1):
        extracted = table.extract() or []
        rows = []
        for row_index, row in enumerate(table.rows):
            values = extracted[row_index] if row_index < len(extracted) else []
            cells = []
            for column_index, box in enumerate(row.cells):
                value = values[column_index] if column_index < len(values) else None
                cells.append({
                    "row": row_index,
                    "column": column_index,
                    "text": value if value is not None else "",
                    "bbox": rounded_box(box),
                })
            rows.append(cells)
        output.append({
            "id": f"table-{table_index}",
            "bbox": rounded_box(table.bbox),
            "rows": rows,
        })
    return output


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--document-key", required=True)
    parser.add_argument("--source-url", required=True)
    parser.add_argument("--retrieved-at", required=True)
    parser.add_argument("--table-pages", default="")
    args = parser.parse_args()

    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", args.retrieved_at):
        raise ValueError("--retrieved-at must be an ISO date (YYYY-MM-DD)")

    input_path = Path(args.input)
    output_path = Path(args.output)
    source_bytes = input_path.read_bytes()
    source_sha256 = hashlib.sha256(source_bytes).hexdigest()

    with pdfplumber.open(input_path) as document:
        table_pages = parse_page_ranges(args.table_pages, len(document.pages))
        pages = []
        for page_number, page in enumerate(document.pages, 1):
            text = page.extract_text() or ""
            pages.append({
                "page": page_number,
                "width": round(float(page.width), 3),
                "height": round(float(page.height), 3),
                "text": text,
                "text_sha256": f"sha256:{hashlib.sha256(text.encode('utf-8')).hexdigest()}",
                "lines": located_lines(page),
                "tables": located_tables(page) if page_number in table_pages else [],
            })

    output = {
        "schema_version": "1.0",
        "extractor": {"name": "pdfplumber", "version": pdfplumber.__version__},
        "document_key": args.document_key,
        "source": {
            "url": args.source_url,
            "filename": input_path.name,
            "retrieved_at": args.retrieved_at,
            "byte_length": len(source_bytes),
            "sha256": f"sha256:{source_sha256}",
            "pages": len(pages),
        },
        "reconciliation": {
            "pages_discovered": len(pages),
            "pages_extracted": len(pages),
            "pages_with_text": sum(bool(page["text"].strip()) for page in pages),
            "pages_with_tables": sum(bool(page["tables"]) for page in pages),
            "tables_extracted": sum(len(page["tables"]) for page in pages),
        },
        "pages": pages,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    temporary = output_path.with_suffix(output_path.suffix + ".tmp")
    temporary.write_text(json.dumps(output, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    temporary.replace(output_path)
    print(json.dumps({"document_key": args.document_key, **output["reconciliation"]}))


if __name__ == "__main__":
    main()
