#!/usr/bin/env node
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  taxonomyTagsForResource,
  taxonomyTagsForTemplate,
  deriveTags,
} from "../src/shared/record-taxonomy.mjs";
import { generatedAt } from "./lib/stable-generated-at.mjs";
import { writeJsonAtomically } from "./lib/write-json-atomically.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const GENERATED = join(ROOT, "data", "generated");
const OUT = join(GENERATED, "discovery-index.json");

const resources = JSON.parse(
  readFileSync(join(ROOT, "data", "commons-resource-dataset.json"), "utf8"),
).resources;

const templates = JSON.parse(
  readFileSync(join(ROOT, "data", "template-registry.json"), "utf8"),
).templates;

mkdirSync(GENERATED, { recursive: true });

const entries = [];
const seenIds = new Set();

for (const resource of resources) {
  const directTags = taxonomyTagsForResource(resource);
  const derived = deriveTags(directTags);
  const directIds = directTags.map((t) => t.id);
  const derivedIds = derived.map((t) => t.id);
  if (directIds.length === 0 && derivedIds.length === 0) continue;
  if (seenIds.has(resource.id)) continue;
  seenIds.add(resource.id);
  entries.push({
    content_id: resource.id,
    content_type: "resource",
    title: resource.shortName || resource.name,
    route: `#/commons?resource=${encodeURIComponent(resource.slug || resource.id)}`,
    direct_tags: directIds,
    derived_tags: derivedIds,
  });
}

for (const template of templates) {
  const directTags = taxonomyTagsForTemplate(template);
  const derived = deriveTags(directTags);
  const directIds = directTags.map((t) => t.id);
  const derivedIds = derived.map((t) => t.id);
  if (seenIds.has(template.template_id)) continue;
  seenIds.add(template.template_id);
  entries.push({
    content_id: template.template_id,
    content_type: "template",
    title: template.display_name,
    route: `#/templates?template=${encodeURIComponent(template.name)}`,
    direct_tags: directIds,
    derived_tags: derivedIds,
  });
}

const output = { schema_version: "1.0", generated_at: generatedAt(), entries };
writeJsonAtomically(OUT, output);
console.log(`Discovery index: ${entries.length} entries (${entries.filter((e) => e.content_type === "resource").length} resources, ${entries.filter((e) => e.content_type === "template").length} templates)`);
