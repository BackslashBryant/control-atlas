#!/usr/bin/env node
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  taxonomyTagsForRecord,
  taxonomyTagsForResource,
  taxonomyTagsForTemplate,
  deriveTags,
} from "../src/shared/record-taxonomy.mjs";
import { practitionerGuides } from "../src/app/learn-content.mjs";
import { readGeneratedCollection } from "./lib/generated-graph-artifacts.mjs";
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

const libraryDocuments = readGeneratedCollection(ROOT, "library-search")
  ?.library_search?.documents || [];
const catalogs = JSON.parse(
  readFileSync(join(GENERATED, "catalog-bootstrap.json"), "utf8"),
).catalog_bootstrap?.catalogs || [];

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
    route: `#/resources/${encodeURIComponent(resource.slug || resource.id)}`,
    source_refs: [...new Set(resource.sourceRefs || [])],
    publisher: resource.publisher || "",
    catalog_id: "",
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
    route: `#/build/documents/${encodeURIComponent(template.name)}`,
    template_name: template.name,
    source_refs: [...new Set(template.source_refs || [])],
    publisher: "Control Atlas",
    catalog_id: "",
    direct_tags: directIds,
    derived_tags: derivedIds,
  });
}

const indexedRecordCount = libraryDocuments.filter(
  (document) => (document.taxonomy_tags || []).length > 0,
).length;

for (const catalog of catalogs) {
  const directTags = taxonomyTagsForRecord({ catalog_id: catalog.id });
  if (directTags.length === 0) continue;
  const contentId = `catalog:${catalog.id}`;
  if (seenIds.has(contentId)) continue;
  seenIds.add(contentId);
  entries.push({
    content_id: contentId,
    content_type: "catalog",
    title: catalog.name,
    route: `#/library/publication/${encodeURIComponent(catalog.id)}`,
    source_refs: catalog.source_id ? [catalog.source_id] : [],
    publisher: catalog.publisher || "",
    catalog_id: catalog.id,
    direct_tags: directTags.map((tag) => tag.id),
    derived_tags: [],
  });
}

for (const guide of practitionerGuides) {
  const directTags = [...new Set(guide.taxonomyTagIds || [])];
  if (directTags.length === 0) continue;
  const contentId = `guide:${guide.id}`;
  if (seenIds.has(contentId)) continue;
  seenIds.add(contentId);
  entries.push({
    content_id: contentId,
    content_type: "guide",
    title: guide.title,
    route: `#/guides?pattern=${encodeURIComponent(guide.id)}`,
    source_refs: [...new Set((guide.citations || []).map((citation) => citation.sourceId))],
    publisher: "Control Atlas",
    catalog_id: "",
    direct_tags: directTags,
    derived_tags: [],
  });
}

entries.sort((left, right) =>
  left.content_type.localeCompare(right.content_type) ||
  left.content_id.localeCompare(right.content_id),
);
const entryCounts = Object.fromEntries(
  [...new Set(entries.map((entry) => entry.content_type))]
    .sort()
    .map((type) => [type, entries.filter((entry) => entry.content_type === type).length]),
);
const counts = { ...entryCounts, record: indexedRecordCount };
const collections = [
  {
    content_type: "record",
    source_artifact: "library-search",
    indexed_count: indexedRecordCount,
    query_owner: "runtime-library-search",
    route_template: "#/record/{catalog_id}/{item_id}",
  },
];
const output = {
  schema_version: "1.2",
  generated_at: generatedAt(),
  counts,
  collections,
  entries,
};
writeJsonAtomically(OUT, output);
console.log(`Discovery index: ${entries.length} embedded entries (${Object.entries(counts).map(([type, count]) => `${count} ${type}`).join(", ")})`);
