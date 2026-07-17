"""Deterministic Crawl4AI ingestion spike against official source pages."""

from __future__ import annotations

import asyncio
import hashlib
import json
import time

import httpx
from bs4 import BeautifulSoup
from crawl4ai import AsyncWebCrawler, BrowserConfig, CacheMode, CrawlerRunConfig


FIXTURES = [
    {
        "id": "fedramp-2026-sources",
        "url": "https://www.fedramp.gov/2026/sources/",
        "signals": ["Consolidated Rules", "machine-readable"],
    },
    {
        "id": "dod-ppsm-training",
        "url": "https://dl.dod.cyber.mil/wp-content/uploads/trn/cx-player/player/index.html?v=ppsm-registry",
        "signals": ["PPSM", "Ports, Protocols"],
    },
]


def digest(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8", errors="replace")).hexdigest()


def markdown_text(result) -> str:
    markdown = getattr(result, "markdown", "")
    return getattr(markdown, "raw_markdown", None) or str(markdown or "")


async def main() -> None:
    started = time.perf_counter()
    evidence = []
    async with httpx.AsyncClient(
        follow_redirects=True,
        timeout=45,
        headers={"User-Agent": "Control-Atlas-source-spike/1.0"},
    ) as client:
        raw_results = {}
        for fixture in FIXTURES:
            raw_started = time.perf_counter()
            response = await client.get(fixture["url"])
            raw_html = response.text
            raw_text = BeautifulSoup(raw_html, "html.parser").get_text(" ", strip=True)
            raw_results[fixture["id"]] = {
                "status": response.status_code,
                "final_url": str(response.url),
                "html_bytes": len(response.content),
                "text_characters": len(raw_text),
                "text_sha256": digest(raw_text),
                "signals": {
                    signal: signal.lower() in raw_text.lower()
                    for signal in fixture["signals"]
                },
                "elapsed_seconds": round(time.perf_counter() - raw_started, 2),
            }

    browser = BrowserConfig(
        browser_type="chromium",
        chrome_channel="chrome",
        headless=True,
        light_mode=True,
        text_mode=True,
        verbose=False,
    )
    run = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        check_robots_txt=True,
        exclude_all_images=True,
        remove_forms=True,
        remove_overlay_elements=True,
        wait_until="domcontentloaded",
        delay_before_return_html=1.0,
        page_timeout=60_000,
        verbose=False,
    )
    async with AsyncWebCrawler(config=browser) as crawler:
        for fixture in FIXTURES:
            crawl_started = time.perf_counter()
            result = await crawler.arun(url=fixture["url"], config=run)
            markdown = markdown_text(result)
            evidence.append(
                {
                    "id": fixture["id"],
                    "canonical_url": fixture["url"],
                    "raw_http": raw_results[fixture["id"]],
                    "crawl4ai": {
                        "success": bool(getattr(result, "success", False)),
                        "final_url": getattr(result, "url", fixture["url"]),
                        "status": getattr(result, "status_code", None),
                        "markdown_characters": len(markdown),
                        "markdown_sha256": digest(markdown),
                        "markdown_preview": markdown[:500].replace("\n", " "),
                        "signals": {
                            signal: signal.lower() in markdown.lower()
                            for signal in fixture["signals"]
                        },
                        "error": getattr(result, "error_message", None),
                        "elapsed_seconds": round(
                            time.perf_counter() - crawl_started, 2
                        ),
                    },
                }
            )

    print(
        json.dumps(
            {
                "tool": "crawl4ai",
                "mode": "deterministic-no-llm",
                "total_elapsed_seconds": round(time.perf_counter() - started, 2),
                "fixtures": evidence,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    asyncio.run(main())
