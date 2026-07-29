import assert from "node:assert/strict";
import test from "node:test";

import { learnArticles } from "../src/app/learn-content.mjs";
import sourceRegistry from "../data/source-registry.json" with { type: "json" };

test("every Learn article is a cited Control Atlas explanation with boundaries", () => {
  assert.equal(learnArticles.length, 6);
  for (const article of learnArticles) {
    assert.ok(article.title, article.id);
    assert.ok(article.summary, article.id);
    assert.ok(article.explanation, article.id);
    assert.ok(article.limitations, article.id);
    assert.ok(article.nextAction?.label, article.id);
    assert.ok(article.nextAction?.view, article.id);
    assert.ok(article.citations.length > 0, article.id);
    for (const citation of article.citations) {
      assert.match(citation.url, /^https:\/\/(?:csrc\.nist\.gov|www\.nist\.gov)\//);
      assert.equal(citation.role, "official-subject-source");
      assert.ok(citation.supports, `${article.id} citation needs a support note`);
      const source = sourceRegistry.sources.find(
        (entry) => entry.id === citation.sourceId,
      );
      assert.ok(source, `${article.id} citation source must exist`);
      assert.equal(citation.url, source.artifact_url);
    }
    assert.doesNotMatch(
      `${article.title} ${article.summary} ${article.explanation} ${article.limitations}`,
      /\b(new user|novice|beginner|recommended for)\b/i,
    );
  }
});
