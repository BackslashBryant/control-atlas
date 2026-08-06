# FedRAMP 2026 Transition Hardening Audit - 2026-07-16

## Verdict

Phase 7 now treats the FedRAMP Consolidated Rules for 2026 as structured source truth and the former Office document set as an explicitly mapped legacy library. The current rules, official dataset schema, 11 current artifact schemas, 27 official legacy downloads, and the historical GSA OSCAL automation repository are available without presenting a historical file as today's submission standard.

All 12 Control Atlas companions retain an A professional-utility grade after the corrective pass. That grade is for useful, printable working artifacts with honest boundaries; it is not a claim of FedRAMP approval or eMASS import compatibility.

## Official-source deep dive

The corrective pass used the publisher's structured sources instead of interpreting rendered FedRAMP pages:

- [FedRAMP Source Data guidance](https://www.fedramp.gov/2026/sources/) directs automation to structured JSON.
- [FedRAMP consolidated rules repository](https://github.com/FedRAMP/rules) supplied the rules dataset and official JSON Schema.
- Dataset version: `2026.07.14.01`; last updated: `2026-07-14`; 246 FRR rules.
- The dataset contains 17 process documents. Sixteen are `stable`; only `AGU - Agency Use of FedRAMP Certified Cloud Services` is `placeholder`. The placeholder label does not describe the entire 2026 ruleset.
- [FedRAMP schemas](https://www.fedramp.gov/schemas/), [changelog](https://www.fedramp.gov/2026/changelog/), and [transition timeline](https://www.fedramp.gov/2026/timeline/) supplied the current artifact and effective-date paths.
- [FedRAMP agency POA&M guidance](https://www.fedramp.gov/2026/agencies/use/ongoing/poams/) supplied the provider-versus-agency ownership boundary.
- [FedRAMP legacy resources](https://www.fedramp.gov/legacy/) supplied 27 individually indexed official downloads plus the combined archive.
- [GSA FedRAMP automation archive](https://github.com/GSA/fedramp-automation) remains cataloged as historical CC0/public-domain OSCAL reference material. It is archived/deprecated and is not represented as the current FedRAMP automation source.

## Corrected source model

The refresh pipeline now downloads and validates the current rules against the official schema, resolves curated mappings through the structured rule tree, and fails if a mapped rule disappears. The visible workbench shows version/date, the precise AGU placeholder scope, 20x/Rev5 transition dates, direct source links, and legacy-to-current next actions.

Ten historical artifact families now have explicit current paths:

| Historical artifact | Current relationship |
|---|---|
| Combined legacy archive | Reference collection only; choose applicable 2026 rules and schemas |
| Package checklist | Replaced by current package rules and CPO/SDR/OCR schemas |
| SSP | CPO replaces the historical Rev5 SSP except appendices; SDR carries rule results |
| CRM/CIS | No single current template; use current service scope, responsibility, and configuration material |
| Integrated inventory | Replaced by machine-readable scope evidence, derivation explanation, and generating code |
| Cryptographic modules table | Working inventory shape governed by current cryptographic-module rules |
| POA&M | Provider vulnerability reporting is separate from agency-owned POA&M actions |
| SAP | No separate SAP required for 20x or Rev5; assessment material routes to the current package/SDR |
| SAR | No separate SAR required; current assessor summaries and SDR/package rules govern |
| ConMon deliverables | Replaced by quarterly OCR and current vulnerability-reporting rules/schemas |

The former FedRAMP baseline importer also changed. It no longer labels generic NIST SP 800-53B OSCAL profiles as FedRAMP baselines. It parses the official legacy FedRAMP Security Controls Baseline workbook and preserves the Low, Moderate, High, and LI-SaaS memberships published by FedRAMP.

## Template regrade

Rubric: authority boundary, current-source connection, operational completeness, editable/print usability, and handoff/validation guidance. `A` requires all five with no material defect.

| Companion | Grade | Corrective evidence |
|---|---:|---|
| Security Plan Starter | A | Names the CPO replacement for the historical SSP and routes package work to CPO/SDR/OCR |
| Implementation Statement Worksheet | A | Connects rule results to SDR-CSO-FRR while retaining public eMASS preparation fields |
| Evidence Expectation Matrix | A | Separates operational evidence from cross-references and states rule/assessor sufficiency boundary |
| STIG Viewer CSV Preparation Worksheet | A | Preserves the exact official 12-column contract and target-version validation warning |
| Inheritance Worksheet | A | Replaces legacy CRM assumptions with current provider scope/responsibility evidence |
| Reciprocity Package Review | A | Evaluates current package artifacts and preserves receiving-organization decision ownership |
| POA&M Working Register | A | Separates provider vulnerability reporting from agency-owned actions and risk decisions |
| Assessment Planning Worksheet | A | States that separate SAP/SAR files are not required under the current 20x or Rev5 rules |
| Continuous Monitoring Calendar | A | Uses quarterly OCR and current vulnerability rules rather than the legacy calendar as authority |
| Hardware Baseline | A | Discloses MAS-CSO-IIR machine-readable scope, derivation, and generating-code requirements |
| Software Baseline | A | Discloses MAS-CSO-IIR scope evidence requirements and retains lifecycle/accountability fields |
| PPSM Preparation Worksheet | A | Remains a complete task-first register with restricted-registry and non-import boundaries |

## QA evidence

Commands:

```text
npm run fetch:fedramp-2026
npm run fetch:frameworks
npm run build:data
npm run qa:templates
npm run qa:templates:pdf
node --test --test-concurrency=1 tests/fedramp-transition.test.mjs tests/source-registry.test.mjs tests/artifact-nexus-registry.test.mjs tests/template-professionalism.test.mjs
```

Results:

- 12 editable Office outputs generated and structurally parsed.
- 12 print-QA PDFs, 72 pages total, rendered to PNG and visually reviewed page by page.
- No clipped fields, orphaned column views, broken glyphs, overlapping content, or unreadable section transitions.
- All 28 mapped rule IDs resolve against the 246-rule dataset.
- All 27 official legacy downloads are unique, direct FedRAMP links.
- The official rules file validates against the official FedRAMP dataset schema.
- The generated graph now reports 45 sources, 11,486 nodes, 16,207 edges, 16,207 evidence records, and the unchanged 11 known upstream findings.
