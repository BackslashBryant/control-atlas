# Record Type Fidelity Audit

- **Owner:** Forge and Pixel
- **Status:** Canonical record-presentation fidelity baseline
- **Last reviewed:** 2026-08-24
- **Supersession:** A source, importer, normalized schema, runtime contract, or page-role change must update the affected row and its executable fixture in the same pull request.

## Purpose and method

This audit traces every supported record form through the complete Control Atlas pipeline. It distinguishes publisher content from derived classification, Control Atlas navigation, source metadata, and relationships. A blank upstream field is never inferred.

Pipeline shorthand used below:

- `source` is the official artifact registered in `data/source-registry.json`.
- `adapter` is the source-specific extractor or normalizer.
- `normalized` is the committed catalog JSON under `data/`.
- `runtime` is the generated node and Library document.
- `contract` is the explicit `catalog_id:record_type` presentation contract.
- `page` is the role composer rendered by `ObjectDetailPage`.

Status precedence is `MODEL GAP` → `DATA LOSS` → `PRESENTATION LOSS` → `PASS`. “Hidden” means a declared, justified disposition; it does not mean an unexplained omission.

## End-to-end record-type matrix

| Catalog | Native record type | Current runtime type | Representative record | Source artifact | Source fields available | Importer fields captured | Normalized fields retained | Runtime fields retained | Fields rendered | Lost fields | Hidden fields | Synthetic fields | Hierarchy | Relationship classes | Current page role | Recommended page role | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NIST SP 800-53A | assessment procedure | `assessment_procedure` | AC-1 | SP 800-53 OSCAL assessment parts | procedure, objectives, methods, objects | all named fields | all | all | procedure, objectives, methods | none | duplicate method/object summaries | presentation offsets | catalog → family → procedure | structural, correlation | assessment | assessment/question | PASS |
| MITRE ATT&CK | technique/sub-technique | `attack_technique` | T1001 / T1001.001 | Enterprise ATT&CK STIX | ID, title, description, tactics, platforms, parent | all | all | description, tactic and parent metadata | description, hierarchy facts | none | platform search metadata | presentation offsets | catalog → tactic → technique → sub-technique | structural, correlation | atomic | atomic record | PASS |
| NIST/FedRAMP | baseline | `baseline` | NIST HIGH | SP 800-53B OSCAL | title, description, selected controls | all | all | description; selections as edges | summary, contained inventory | none | raw selection arrays | counts | catalog → baseline | structural, applicability | generic atomic | container | MODEL GAP → remediated |
| DISA STIG | XCCDF Benchmark | `benchmark` | VMW vSphere PostgreSQL STIG | official XCCDF Benchmark | title, description, version/release, status date, rules | all on member records | all | summary, version, date, count, severity distribution | summary, facts, child rules | version/date/count previously absent at runtime builder | raw benchmark ID | count and severity distribution from children | catalog → benchmark → rule | structural, correlation | generic atomic | container | DATA LOSS → remediated |
| All publications | publication/catalog | `catalog` | CSF 2.0 Catalog | official publication identity and artifacts | publisher, title, version/status where registered | registry and builder | registry retained | source identity and catalog summary | publication identity, summary, contained objects | none | internal artifact IDs | catalog summary node | publication root | structural, organizing | generic atomic | publication/document | MODEL GAP → remediated |
| NIST CSF 2.0 | category group | `category` | PR.AA | CSF OSCAL group | ID and title; no separate description published in the ingested group | ID, title, parent Function | carried on subcategories | generated category identity and ancestry | title, honest description absence, parent, children, counts | none | none | generated container node | catalog → Function → Category | structural, correlation | generic required-text page | container | MODEL GAP → remediated |
| NIST SP 800-53 | control | `control` | AC-2 | SP 800-53 OSCAL | statement, discussion, related controls, parameters, assessment and baseline context | all named fields | all | all | statement, discussion, assessment support, hierarchy | none | duplicate relationship arrays | presentation offsets | catalog → family → control | structural, applicability, correlation | atomic | atomic record | PASS |
| NIST SP 800-53 | enhancement | `control_enhancement` | AC-2.1 | SP 800-53 OSCAL | enhancement statement, discussion, parent, assessment and baseline context | all named fields | all | all | statement, discussion, parent hierarchy | none | duplicate relationship arrays | presentation offsets | catalog → family → control → enhancement | structural, applicability, correlation | atomic | atomic record | PASS |
| MITRE D3FEND | countermeasure | `defend_countermeasure` | D3-AA | D3FEND ontology | ID, title, definition, tactic, synonym | all | all | description and tactic | description and hierarchy | none | ontology matching slug | presentation offsets | catalog → tactic → countermeasure | structural, correlation | atomic | atomic record | PASS |
| NIST control catalogs | family/group | `family` | AC family | official OSCAL group | family ID/title and child membership | all | carried on children | generated family and ancestry | identity, children, counts | no separate prose where upstream omits it | none | generated container node | catalog → family | structural | generic required-text page | container | MODEL GAP → remediated |
| NIST CSF 2.0 | function group | `function` | PROTECT | CSF OSCAL group | ID and title; no separate description published in the ingested group | ID/title | carried on subcategories | generated Function and ancestry | identity, categories, counts | none | none | generated container node | catalog → Function | structural | generic required-text page | container | MODEL GAP → remediated |
| AI RMF, SSDF, DoD RAI | publisher group | `group` | SSDF Prepare the Organization | publisher group structure | ID/title and child membership | all | carried on children | generated group and ancestry | identity, children, counts | no separate prose where absent | none | generated container node | catalog → group | structural | generic atomic | container | MODEL GAP → remediated |
| FIPS 199 | impact category | `impact_category` | HIGH | FIPS 199 source | title and impact definition | all | all | all | definition and related selections | none | none | presentation offsets | catalog → impact category | structural, correlation | atomic | container | MODEL GAP → remediated |
| NIST IoT | capability domain | `iot_capability_domain` | Non-Technical Manufacturer Capabilities | NIST IoT requirement workbook/pages | title, description, parent, fragments | all | all | all | description, hierarchy, children | none | source fragments | stable generated ID | catalog → domain | structural | atomic | container | MODEL GAP → remediated |
| NIST IoT | capability | `iot_capability` | Documentation from the Manufacturer | same | title, description, parent, fragments | all | all | all | description, hierarchy, children | none | source fragments | stable generated ID | domain → capability | structural | atomic | container | MODEL GAP → remediated |
| NIST IoT | sub-capability | `iot_subcapability` | representative sub-capability | same | title, description, parent, fragments | all | all | all | description, hierarchy, children | none | source fragments | stable generated ID | capability → sub-capability | structural | atomic | container | MODEL GAP → remediated |
| NIST IoT | capability element | `iot_capability_element` | representative element | same | text, status, publisher mappings, parent | all | all | all | source text and mappings | none | source fragments | stable generated ID | sub-capability → element | structural, correlation | atomic | atomic record | PASS |
| NIST IoT | capability sub-element | `iot_capability_subelement` | representative sub-element | same | text, status, publisher mappings, parent | all | all | all | source text and mappings | none | source fragments | stable generated ID | element → sub-element | structural, correlation | atomic | atomic record | PASS |
| NIST Mobile | threat category | `mobile_threat_category` | Application-based | NIST Mobile Threat Catalogue | title, description, child membership | all | all | all | description and children | none | source fragments | stable generated ID | catalog → category | structural | atomic | container | MODEL GAP → remediated |
| NIST Mobile | threat | `mobile_threat` | APP-0 | same | origin, exploit/CVE examples, countermeasures | all | all | all | all published fields | none | source fragments | explicit field-availability notice for title-only records | category → threat | structural | atomic | atomic record | PASS |
| NARA CUI | policy/category | `policy` | Accident Investigation | NARA CUI Registry / regulation | title, description, designation, parent | all | all | all | policy text and hierarchy | none | registry matching metadata | presentation offsets | catalog → designation → category | structural, correlation | atomic | atomic record | PASS |
| CMMC | level | `program` | Level 1 | 32 CFR CMMC rule | level title, definition, requirement references | all | all | all | definition, children/dependencies summary | none | relationship arrays | presentation offsets | catalog → level | structural, applicability | atomic | container | MODEL GAP → remediated |
| Requirement catalogs | requirement/practice/action/outcome | `requirement` | CSF PR.AA-01 | respective official structured artifacts | statement plus catalog-specific source fields | all declared adapter fields | all | all | contract-specific sections | none after remediation | relationship arrays and navigation tags | presentation offsets | publisher-specific hierarchy | structural, applicability, correlation | atomic | atomic record | PASS |
| NIST RMF | RMF step | `rmf_step` | ASSESS | SP 800-37 | step title and description | all | all | all | step content and hierarchy | none | relationship arrays | presentation offsets | catalog → step | structural, correlation | atomic | atomic record | PASS |
| DISA SRG | XCCDF Group/Rule | `srg_requirement` | V-202013 | official XCCDF | Vuln, Rule and STIG IDs; severity; benchmark; Discussion; Check; Fix; CCIs | all | all | all after builder correction | Overview, Discussion, Check, Fix, CCIs | IDs/version/date previously lost at normalized → runtime builder | raw XCCDF locator | source-text offsets | catalog → benchmark → requirement | structural, correlation | partial atomic | atomic record | DATA LOSS → remediated |
| DISA STIG | XCCDF Group/Rule | `stig_rule` | V-256609 | official XCCDF | Vuln, Rule and STIG IDs; severity; benchmark; Discussion; Check; Fix; CCIs | all | all | all after builder correction | Overview, Discussion, Check, Fix, CCIs | IDs/version/date previously lost at normalized → runtime builder | raw XCCDF locator | source-text offsets | catalog → benchmark → rule | structural, correlation | partial atomic | atomic record | DATA LOSS → remediated |
| MITRE ATT&CK/D3FEND | tactic | `tactic` | Initial Access | STIX/ontology tactic taxonomy | ID/title and member techniques | all | carried on members | generated tactic and ancestry | identity, children, counts | none | source matching metadata | generated container node | catalog → tactic | structural | generic atomic | container | MODEL GAP → remediated |
| DoD Zero Trust | activity | `zt_activity` | ACT-1-1-1 | DoD ZT strategy/roadmap | description, outcomes, end state, predecessors, successors | all | all | all | all published activity fields | none | source fragments | stable ID | pillar → capability → activity | structural, correlation | atomic | atomic record | PASS |
| Microsoft ZT | maturity question | `zt_assessment_question` | MSZT-1-1 | official workbook | question, answer options, default, pillar | all | all | all | question and options | none | source fragments | stable ID | catalog → pillar → question | structural | assessment | assessment/question | PASS |
| NIST ZT | implementation build | `zt_build` | SP180035-E1B1 | SP 1800-35 | summary, architecture and implementation sections | all | all | all | all source sections | none | source fragments/media routing | stable ID | publication → build | structural, correlation | atomic | implementation artifact | MODEL GAP → remediated |
| DoD ZT | capability | `zt_capability` | CAP-1-1 | DoD ZT roadmap | description, pillar, activities | all | all | all | description, hierarchy, children | none | source fragments | stable ID | pillar → capability | structural, correlation | atomic | container | MODEL GAP → remediated |
| NIST ZT | collaborator | `zt_collaborator` | Appgate | SP 1800-35 | name and participation context | all | all | all | identity and context | none | matching metadata | stable ID | publication → collaborator | structural, correlation | atomic | entity/contributor | MODEL GAP → remediated |
| NIST ZT | cloud-native requirement | `zt_cloud_native_requirement` | ID-SEG-REC-1 | SP 800-207A | requirement and parent publication | all | all | all | requirement and hierarchy | none | source fragments | stable ID | publication → requirement | structural, correlation | atomic | atomic record | PASS |
| DoD ZT | document | `zt_document` | DOC-OVERLAYS | official DoD ZT documents | summary and ordered document sections | all | all | all | summary and document sections | none | source fragments | stable ID | catalog → document | structural, correlation | atomic | publication/document | MODEL GAP → remediated |
| NIST ZT | logical component | `zt_logical_component` | Policy Engine | SP 800-207 | component description and publication | all | all | all | component function and hierarchy | none | source fragments | stable ID | publication → component | structural | atomic | implementation artifact | MODEL GAP → remediated |
| NIST ZT | mapping document | `zt_mapping_document` | NISTCSSMMapping | official mapping workbook | document identity and description | all | all | all | publication identity and summary | none | workbook routing metadata | stable ID | publication → mapping document | structural, correlation | atomic | publication/document | MODEL GAP → remediated |
| NIST ZT | mapping contributor | `zt_mapping_contributor` | Appgate | official mapping workbook | contributor label and publisher field | all | all | all | identity and publisher field | none | matching metadata | stable ID | mapping publication → contributor | structural, correlation | atomic | entity/contributor | MODEL GAP → remediated |
| DoD/Microsoft ZT | pillar | `zt_pillar` | DoD User | official roadmap/workbook | title, optional description, members | all | all | all | description when published, hierarchy, children | none | source fragments | generated/stable ID | catalog → pillar | structural | atomic | container | MODEL GAP → remediated |
| NIST ZT | product component | `zt_product_component` | Appgate Headless Client | SP 1800-35 workbook | collaborator, product, function, mapping targets | all | all | all | function, identity context, mappings | none | matching metadata | stable ID | contributor → component | structural, correlation | atomic | implementation artifact | MODEL GAP → remediated |
| NIST ZT | publication | `zt_publication` | SP 800-207 | official NIST publication | title, summary, source/version | all | all | all | publication identity, summary, contents | none | source fragments | stable ID | catalog → publication | structural | atomic | publication/document | MODEL GAP → remediated |
| NIST ZT | reference component | `zt_reference_component` | Data Access Protection | SP 1800-35 reference architecture | component name, function, parent | all | all | all | function and hierarchy | none | source fragments | stable ID | publication → component | structural, correlation | atomic | implementation artifact | MODEL GAP → remediated |
| NIST/DoD ZT | tenet | `zt_tenet` | SP800207-TENET-1 | official Zero Trust publication | tenet statement and publication | all | all | all | statement and hierarchy | none | source fragments | stable ID | publication/catalog → tenet | structural | atomic | atomic record | PASS |
| DoD ZT | overlay section | `zt_overlay_section` | none | overlay pages retained inside `DOC-OVERLAYS.document_sections` | nested page sections, not standalone publisher objects | obsolete adapter loop expected empty curated array | no records | no runtime nodes | nested document sections | none | none | prior adapter would have fabricated “Overlay section for …” prose | document section, not graph node | none | unsupported phantom | remove from supported registry | MODEL GAP → removed |

## Explicit catalog/type coverage

The executable registry contains 89 final combinations and has no generic fallback:

| Catalog | Explicit runtime types |
| --- | --- |
| cmmc-2 | catalog, program |
| csf-2 | catalog, category, function, requirement |
| cui-policy | catalog, policy |
| disa-cci | catalog, requirement |
| disa-srg | benchmark, catalog, srg_requirement |
| disa-stig | benchmark, catalog, stig_rule |
| dod-rai | catalog, group, requirement |
| dod-zt | catalog, zt_activity, zt_capability, zt_document, zt_pillar, zt_tenet |
| fedramp-rev5 | baseline, catalog |
| fips-199 | catalog, impact_category |
| fips-200 | catalog, requirement |
| microsoft-zt-maturity | catalog, zt_assessment_question, zt_pillar |
| mitre-attack | attack_technique, catalog, tactic |
| mitre-attack-ics | attack_technique, catalog, tactic |
| mitre-d3fend | catalog, defend_countermeasure, tactic |
| nist-800-171 | catalog, family, requirement |
| nist-800-171-rev2 | catalog, family, requirement |
| nist-800-172 | catalog, family, requirement |
| nist-800-37 | catalog, rmf_step |
| nist-800-53 | catalog, control, control_enhancement, family |
| nist-800-53a | assessment_procedure, catalog, family |
| nist-800-53b | baseline, catalog |
| nist-ai-rmf | catalog, group, requirement |
| nist-iot-cybersecurity | catalog, iot_capability_domain, iot_capability, iot_subcapability, iot_capability_element, iot_capability_subelement |
| nist-mobile-threats | catalog, mobile_threat_category, mobile_threat |
| nist-ssdf | catalog, group, requirement |
| nist-zt | catalog, zt_publication, zt_tenet, zt_logical_component, zt_cloud_native_requirement, zt_build, zt_reference_component, zt_mapping_document, zt_collaborator, zt_mapping_contributor, zt_product_component |

## Confirmed acceptance findings

- **PR.AA-01:** normalized and runtime data already retained Implementation Examples and Informative References; the CSF override omitted them. The contract now renders all three source sections and the native Function → Category → Subcategory path.
- **PR.AA:** NIST’s ingested CSF group supplies identity and structure but no separate description. The former required-description profile produced “Record data unavailable.” The container contract treats prose as optional and leads with parent/children/counts.
- **V-256609:** the importer and normalized record retained native IDs and benchmark source metadata. `build-framework-data.mjs` dropped those fields before runtime. The builder now retains them and the atomic contract renders an Overview before Discussion, Check, and Fix.
- **STIG benchmark:** the existing structural tier was correct, but the page treated it as a sparse atomic record. Benchmark version/date/count/severity are now source-backed or directly derived from contained rules, and children remain structural rather than generic related records.
- **Relationship prose:** the sentence assigning importance from neighbor count was Control Atlas-generated and unsupported. It is removed. Relationship treatment affects only the detail page; the graph and evidence sets remain authoritative and exhaustive.

## Fidelity invariants

1. Every final catalog/type key resolves explicitly or the build fails.
2. Every required publisher field survives into runtime or the build fails.
3. Every rendered source section has a declared field disposition.
4. Structural edges provide hierarchy and child inventory; correlation edges never become ancestry.
5. `ATLAS_ONLY` changes presentation only. It never deletes or weakens an edge or its evidence.
6. Intentionally hidden fields require a reason in the contract.
7. Publisher strings remain unchanged; presentation metadata may structure exact ranges but may not rewrite them.
