# Control Commons Guide & Architectural Blueprint

**Navigation Label:** Commons  
**Tagline:** Official sources. Working tools. Practitioner knowledge.  
**Purpose:** The shared public resource hub for government cybersecurity, compliance, authorization, workforce qualification, hardening benchmarks, and compliance automation.

---

## 1. Governance & Inclusion Principles

Control Commons is built around 8 core design principles tailored for government cyber practitioners:

1. **Parallel Discovery Lanes:** Official government sources, open-source tools, practitioner templates, commercial guidance, and legacy records exist in parallel. Authority and practical usefulness are treated as separate dimensions.
2. **Plain Language Purpose:** Every resource explains *What is this?*, *Why does it matter?*, and *What should I do with it?*.
3. **Mandatory Inclusion Justification:** Every indexed entry includes an explicit `whyIncluded` explanation detailing the exact compliance task or workflow it supports.
4. **Official-Plus-Practical Pairings:** Whenever possible, governing requirements are paired with maintained practical tools, templates, explainers, and support communities.
5. **Static-First & Deterministic:** All resource metadata and collections are stored as version-controlled JSON/YAML in the repository. Search indexes are pre-built deterministically.
6. **Transparent Provenance & Integrity:** Data sources for Control Atlas internal graph (`/sources`) are strictly distinguished from external working resources (`/commons`).
7. **Rejection Provenance:** Rejected resource candidates (e.g. paywalled whitepapers, unverified AI content, malware risks, stale baselines) are logged in `data/commons-candidate-manifest.json` with explicit rejection reasons.
8. **Automated Health & Community Tooling:** Monthly link reachability actions and GitHub issue templates support continuous community updates.

---

## 2. Parallel Discovery Lanes

| Lane | ID | Description | Example Resources |
|---|---|---|---|
| **Official** | `official` | Primary government publications, baselines, & regulations | NIST SP 800-53 Rev 5, CMMC 32 CFR Part 170, FedRAMP Rev 5 |
| **Open Source** | `open_source` | Maintained software, SCAP engines, & automation scripts | ComplianceAsCode/content, PowerSTIG, Compliance-Trestle |
| **Practitioner** | `practitioner` | Community templates, guides, explainers, & forums | CMMC SSP Starter Template, Reddit /r/NISTControls |
| **Commercial** | `commercial` | Free tier software, vendor docs, & tool kits | CIS Benchmarks Free Account, AWS GovCloud User Guide |
| **Legacy** | `legacy` | Superseded standards retained for audit continuity | NIST SP 800-53 Rev 4, FedRAMP Rev 4 Baselines |

---

## 3. Data Architecture & Build Integration

- **Dataset Path:** `data/commons-resource-dataset.json`
- **Schema Path:** `data/schemas/commons-resource-schema.json`
- **Research Manifest:** `data/commons-candidate-manifest.json`
- **Generated Index:** `data/generated/commons-search-index.json`
- **Build Generator:** `scripts/build-commons-index.mjs`
- **Health Verification:** `scripts/check-commons-health.mjs`
- **Quality Benchmark:** `tests/commons-quality.test.mjs`

### Build Command Execution:
```bash
# Build the generated search index
node scripts/build-commons-index.mjs

# Run quality & schema tests
node tests/commons-quality.test.mjs

# Full static site build
npm run build:site
```

---

## 4. Community Contribution Workflows

Practitioners can submit new resources or report issues via GitHub Issue Templates:
- **Submit New Resource:** `.github/ISSUE_TEMPLATE/submit-resource.yml`
- **Report Broken Link:** `.github/ISSUE_TEMPLATE/report-broken-link.yml`
