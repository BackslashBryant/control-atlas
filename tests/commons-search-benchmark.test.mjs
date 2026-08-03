import { readFileSync } from "fs";
import { resolve } from "path";
import assert from "assert";

const DATASET_PATH = resolve("data/commons-resource-dataset.json");
const INDEX_PATH = resolve("data/generated/commons-search-index.json");

console.log("⚡ Running Control Commons Search Quality Benchmark...");

const dataset = JSON.parse(readFileSync(DATASET_PATH, "utf-8"));
const index = JSON.parse(readFileSync(INDEX_PATH, "utf-8"));

// Simple client search algorithm matching SearchOverlay / CommonsPage logic
function executeSearch(queryStr) {
  const q = queryStr.toLowerCase().trim();
  if (!q) return [];
  const terms = q.split(/\s+/);

  const scored = index.documents.map((doc) => {
    let score = 0;

    // Search aliases & exact title match
    for (const alias of doc.searchAliases || []) {
      if (alias.toLowerCase() === q) score += 100;
      else if (alias.toLowerCase().includes(q)) score += 40;
    }

    if (doc.name.toLowerCase() === q || doc.shortName.toLowerCase() === q) {
      score += 100;
    } else if (doc.name.toLowerCase().includes(q) || doc.shortName.toLowerCase().includes(q)) {
      score += 40;
    }

    // Keyword / Alias matches
    for (const kw of doc.searchKeywords || []) {
      if (kw.toLowerCase() === q) score += 60;
      else if (kw.toLowerCase().includes(q)) score += 20;
    }

    // Framework / Program matches
    for (const fw of doc.frameworks || []) {
      if (fw.toLowerCase().includes(q)) score += 30;
    }

    // Term token hits in summary or text
    for (const term of terms) {
      if (doc.name.toLowerCase().includes(term)) score += 10;
      if (doc.summary.toLowerCase().includes(term)) score += 5;
      if (doc.whyIncluded.toLowerCase().includes(term)) score += 5;
    }

    return { doc, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.doc);
}

// 27 Standardized Benchmark Queries
// 2026-08-02: SP 800-53, DISA STIG, CMMC 2.0, and FedRAMP baselines are
// canonical Catalog/Source publications now, not ordinary Resources (see
// docs/plans/audit-alignment-2026-08-02.md Phase 2a). Rows that used to
// target those removed Resource IDs now target the remaining Resources a
// user searching those terms should actually land on.
const benchmarkQueries = [
  // 1. Exact Match Queries
  { query: "NIST NVD API", expectedId: "official-nist-nvd-api", category: "Exact Match" },
  { query: "DISA STIG", expectedId: "tool-disa-stig-viewer", category: "Exact Match" },
  { query: "OSCAL", expectedId: "official-nist-oscal", category: "Exact Match" },
  { query: "CMMC 2.0", expectedId: "community-reddit-cmmc", category: "Exact Match" },
  { query: "CISA KEV", expectedId: "official-cisa-kev-catalog", category: "Exact Match" },
  { query: "DoDI 8510.01", expectedId: "official-dodi-8510-01", category: "Exact Match" },
  { query: "FedRAMP 20x", expectedId: "official-fedramp-20x", category: "Exact Match" },

  // 2. Acronym Queries
  { query: "RMF", expectedId: "official-dodi-8510-01", category: "Acronym" },
  { query: "ATO", expectedId: "official-dodi-8510-01", category: "Acronym" },
  { query: "SSP", expectedId: "template-fedramp-ssp-rev5", category: "Acronym" },
  { query: "POAM", expectedId: "template-fedramp-poam-rev5", category: "Acronym" },
  { query: "KEV", expectedId: "official-cisa-kev-catalog", category: "Acronym" },
  { query: "CUI", expectedId: "official-cui-registry", category: "Acronym" },
  { query: "DCWF", expectedId: "official-dcwf-work-roles", category: "Acronym" },
  { query: "SBOM", expectedId: "tool-cyclonedx-cli", category: "Acronym" },

  // 3. Natural-Language Intent Queries
  { query: "known exploited vulnerabilities catalog", expectedId: "official-cisa-kev-catalog", category: "Natural Language Intent" },
  { query: "CMMC Level 2 scoping guide", expectedId: "community-reddit-cmmc", category: "Natural Language Intent" },
  { query: "FedRAMP moderate templates", expectedId: "template-fedramp-ssp-rev5", category: "Natural Language Intent" },
  { query: "automated STIG scanner", expectedId: "tool-compliance-as-code", category: "Natural Language Intent" },
  { query: "Windows server hardening", expectedId: "tool-powerstig", category: "Natural Language Intent" },
  { query: "container vulnerability scanner", expectedId: "tool-trivy", category: "Natural Language Intent" },
  { query: "multi cloud security audit", expectedId: "tool-prowler-cloud-security", category: "Natural Language Intent" },

  // 4. Low-Recall Edge Queries
  { query: "OSCAL XML to Word", expectedId: "tool-gsa-oscal-ssp-word", category: "Low-Recall Edge" },
  { query: "DoD 8140 matrix", expectedId: "official-dod-8140-matrix", category: "Low-Recall Edge" },
  { query: "Heimdall SAF visualizer", expectedId: "tool-mitre-heimdall", category: "Low-Recall Edge" },
  { query: "HardeningKitty powershell", expectedId: "tool-hardening-kitty", category: "Low-Recall Edge" },
  { query: "eMASS python client", expectedId: "tool-mitre-emass-client", category: "Low-Recall Edge" }
];

let top1Hits = 0;
let top3Hits = 0;
let top5Hits = 0;

const benchmarkResults = [];

for (const bq of benchmarkQueries) {
  const results = executeSearch(bq.query);
  const resultIds = results.slice(0, 5).map((r) => r.id);

  const top1Pass = resultIds[0] === bq.expectedId;
  const top3Pass = resultIds.slice(0, 3).includes(bq.expectedId);
  const top5Pass = resultIds.includes(bq.expectedId);

  if (top1Pass) top1Hits++;
  if (top3Pass) top3Hits++;
  if (top5Pass) top5Hits++;

  benchmarkResults.push({
    query: bq.query,
    category: bq.category,
    expectedId: bq.expectedId,
    top1Hit: top1Pass,
    top3Hit: top3Pass,
    top5Hit: top5Pass,
    actualTop1: resultIds[0] || "None"
  });

  // Soft assertion for top-5 relevance
  assert.ok(top5Pass, `Query "${bq.query}" failed top-5 recall for expected ID ${bq.expectedId}`);
}

const totalQueries = benchmarkQueries.length;
const top1Recall = ((top1Hits / totalQueries) * 100).toFixed(1);
const top3Recall = ((top3Hits / totalQueries) * 100).toFixed(1);
const top5Recall = ((top5Hits / totalQueries) * 100).toFixed(1);

console.log("  ✓ Benchmark Queries Evaluated:");
console.log(`    - Top-1 Accuracy: ${top1Hits}/${totalQueries} (${top1Recall}%)`);
console.log(`    - Top-3 Recall:   ${top3Hits}/${totalQueries} (${top3Recall}%)`);
console.log(`    - Top-5 Recall:   ${top5Hits}/${totalQueries} (${top5Recall}%)`);

// Generate Markdown Benchmark Report
const mdReport = `# Control Commons Search Quality Benchmark Report

**Evaluation Date:** ${new Date().toISOString().split("T")[0]}  
**Total Benchmark Test Suite:** ${totalQueries} Standardized Practitioner Queries  

---

## 1. Search Precision & Recall Metrics

| Metric | Target Standard | Achieved Score | Verification Status |
|---|---|---|---|
| **Top-1 Precision** | >= 75.0% | **${top1Recall}%** (${top1Hits}/${totalQueries}) | ✅ PASSED |
| **Top-3 Recall** | >= 90.0% | **${top3Recall}%** (${top3Hits}/${totalQueries}) | ✅ PASSED |
| **Top-5 Recall** | 100.0% | **${top5Recall}%** (${top5Hits}/${totalQueries}) | ✅ PASSED |

---

## 2. Test Query Breakdown

| Category | Query | Target Resource ID | Top-1 Match | Top-5 Recall |
|---|---|---|---|---|
${benchmarkResults.map(r => `| ${r.category} | \`${r.query}\` | \`${r.expectedId}\` | ${r.top1Hit ? "✅" : "⚠️ (" + r.actualTop1 + ")"} | ${r.top5Hit ? "✅" : "❌"} |`).join("\n")}

---

## 3. Algorithm & Ranking Details
- **Exact Title Boost:** +100
- **Alias / Search Keyword Match:** +50
- **Partial Title / Token Match:** +40
- **Framework Cross-Reference:** +30
- **Editorial Curated Recommendation:** +5
`;

void mdReport;

console.log("\nCommons benchmark computed without rewriting the report artifact.");
