# Graph & UI/UX References

## UI/UX resources

| Resource                              | Use for Control Atlas                                                                    |
| ------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Nielsen Norman Group**              | Heuristic evaluation, wayfinding, recognition over recall, error recovery, system status |
| **GoodUI**                            | One primary action, fewer competing choices, clearer CTAs, stronger defaults             |
| **GOV.UK Design Principles**          | Plain language, task-first structure, progressive disclosure, accessible forms           |
| **U.S. Web Design System**            | Federal-style design patterns, accessibility, form behavior, navigation consistency      |
| **Material Design**                   | Component states, motion rules, hierarchy, density, responsive layout                    |
| **Atlassian Design System**           | Dense technical UI, metadata handling, badges, tables, page structure                    |
| **GitHub Primer**                     | Developer-facing UI, compact actions, tabs, labels, code/reference presentation          |
| **Figma design resources**            | Layout, spacing, component system patterns                                               |
| **Contentsquare web design guidance** | Friction reduction, scanning behavior, conversion/task flow                              |
| **Tilda design principles**           | Visual hierarchy, landing page structure, readable content blocks                        |
| **Awwwards**                          | Modern visual inspiration, brand polish, motion/hero concepts                            |
| **Mobbin**                            | Real product patterns for search, filters, cards, navigation, onboarding                 |
| **Webflow Showcase**                  | Modern landing/product page layout inspiration                                           |
| **WCAG 2.2 AA**                       | Keyboard access, contrast, focus states, non-color-only meaning, reduced motion          |

## Cytoscape / graph implementation resources

| Resource                                      | Link                                                                                                           | Use                                                              |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Cytoscape.js docs**                         | [https://js.cytoscape.org/](https://js.cytoscape.org/)                                                         | Core graph API, styling, selectors, events, layouts, performance |
| **Cytoscape.js demos**                        | [https://js.cytoscape.org/#demos](https://js.cytoscape.org/#demos)                                             | Working implementation examples                                  |
| **Cytoscape.js fCoSE**                        | [https://github.com/iVis-at-Bilkent/cytoscape.js-fcose](https://github.com/iVis-at-Bilkent/cytoscape.js-fcose) | Expanded dense cluster layout only                               |
| **Cytoscape.js Dagre**                        | [https://github.com/cytoscape/cytoscape.js-dagre](https://github.com/cytoscape/cytoscape.js-dagre)             | Left-to-right hierarchy and chain graphs                         |
| **Cytoscape.js Popper**                       | [https://github.com/cytoscape/cytoscape.js-popper](https://github.com/cytoscape/cytoscape.js-popper)           | Tooltip/popover positioning                                      |
| **Tippy.js**                                  | [https://atomiks.github.io/tippyjs/](https://atomiks.github.io/tippyjs/)                                       | Tooltip UI wrapper                                               |
| **Cytoscape.js Labels demo**                  | [https://js.cytoscape.org/#demos](https://js.cytoscape.org/#demos)                                             | Label behavior and zoom-aware label ideas                        |
| **Cytoscape.js Node Types demo**              | [https://js.cytoscape.org/#demos](https://js.cytoscape.org/#demos)                                             | Shape/type visual language                                       |
| **Cytoscape.js Edge Types demo**              | [https://js.cytoscape.org/#demos](https://js.cytoscape.org/#demos)                                             | Edge styling conventions                                         |
| **Cytoscape.js Compound Nodes demo**          | [https://js.cytoscape.org/#demos](https://js.cytoscape.org/#demos)                                             | Grouping/cluster visual reference                                |
| **Cytoscape.js Popper/Tippy demo**            | [https://js.cytoscape.org/#demos](https://js.cytoscape.org/#demos)                                             | On-demand node previews                                          |
| **Cytoscape.js Dagre demo**                   | [https://js.cytoscape.org/#demos](https://js.cytoscape.org/#demos)                                             | Directional layout example                                       |
| **Cytoscape.js fCoSE demo**                   | [https://js.cytoscape.org/#demos](https://js.cytoscape.org/#demos)                                             | Dense graph layout example                                       |
| **Cytoscape.js Tokyo Railways demo**          | [https://js.cytoscape.org/#demos](https://js.cytoscape.org/#demos)                                             | Real-world network map inspiration                               |
| **Cytoscape.js Wine & Cheese demo**           | [https://js.cytoscape.org/#demos](https://js.cytoscape.org/#demos)                                             | Relationship exploration inspiration                             |
| **Cytoscape.js PathwayCommons/SBGN examples** | [https://js.cytoscape.org/#demos](https://js.cytoscape.org/#demos)                                             | Dense scientific graph styling inspiration                       |

## Useful graph/data visualization references

| Resource                         | Link                                                                                                 | Use                                                       |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **MITRE ATT&CK Matrix**          | [https://attack.mitre.org/](https://attack.mitre.org/)                                               | Great example of complex domain navigation made scannable |
| **MITRE ATT&CK STIX data**       | [https://github.com/mitre-attack/attack-stix-data](https://github.com/mitre-attack/attack-stix-data) | Open threat data reference                                |
| **MITRE D3FEND Matrix**          | [https://d3fend.mitre.org/](https://d3fend.mitre.org/)                                               | Defensive technique relationship model                    |
| **D3FEND Resources**             | [https://d3fend.mitre.org/resources/](https://d3fend.mitre.org/resources/)                           | D3FEND ontology/mapping/API resources                     |
| **D3FEND GitHub**                | [https://github.com/d3fend](https://github.com/d3fend)                                               | Open defensive ontology reference                         |
| **NIST OSCAL Content**           | [https://github.com/usnistgov/oscal-content](https://github.com/usnistgov/oscal-content)             | Open control/catalog source data                          |
| **NIST Cybersecurity Framework** | [https://www.nist.gov/cyberframework](https://www.nist.gov/cyberframework)                           | Framework structure and public source model               |
| **NIST OLIR**                    | [https://csrc.nist.gov/projects/olir](https://csrc.nist.gov/projects/olir)                           | Crosswalk/informative-reference source                    |

## Considered but rejected / reference-only

| Resource                                           | Use status        | Reason                                                                             |
| -------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------- |
| **yFiles Layout Algorithms for Cytoscape desktop** | Reference only    | Useful layout inspiration, but it is for desktop Cytoscape, not the browser app    |
| **yFiles for HTML**                                | Rejected          | Good fit technically, but not free                                                 |
| **cytoscape-navigator**                            | Not for this pass | Only add later if users need minimap orientation                                   |
| **cytoscape-expand-collapse**                      | Do not use        | Useful conceptually, but not needed and should not become another dependency       |
| **cytoscape-cola / cose-bilkent / elk**            | Do not use        | Adds layout decision sprawl; current plan already has concentric, Dagre, and fCoSE |
| **custom force layout / web worker layout**        | Do not use now    | Premature. Fix graph model and layout triggers first                               |

## Control Atlas source hierarchy/reference set

The source hierarchy and inventory we locked in should be treated as the map foundation, not just reference material. It defines the nine top-level categories, dispositions, and default-map gating model: Authority, Governance/Risk Framework, Control Catalog/Requirement Set, Baseline/Overlay/Profile, Assessment/Scoping, Implementation/Configuration, Control Mapping/Crosswalk, Threat/Defensive Mapping, and Supporting Reference. 

Key source families from that manifest:

| Family                                   | Examples                                                                                                          |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Authority**                            | FISMA, OMB A-130, 32 CFR Part 2002, FIPS 199, FIPS 200, CNSSI 1253, DoDI 8500.01, DoDI 8510.01, FAR/DFARS clauses |
| **Governance / Risk Framework**          | NIST RMF, NIST CSF 2.0, AI RMF, DoD RAI, DoD Zero Trust                                                           |
| **Control Catalog / Requirement Set**    | SP 800-53, SP 800-171, SP 800-172, SSDF                                                                           |
| **Baseline / Overlay / Program Profile** | SP 800-53B, FedRAMP Rev. 5, CMMC, DoD Zero Trust overlays                                                         |
| **Assessment / Scoping**                 | SP 800-53A, SP 800-171A, SP 800-172A, CMMC assessment/scoping guides, FedRAMP artifacts                           |
| **Implementation / Configuration**       | DISA SRGs, DISA STIGs, STIG/SRG CCI references                                                                    |
| **Control Mapping / Crosswalk**          | DISA CCI, CCI-to-NIST mappings, CSF mappings, OLIR                                                                |
| **Threat / Defensive Mapping**           | ATT&CK Enterprise, ATT&CK ICS, D3FEND                                                                             |
| **Supporting Reference**                 | NARA CUI Registry, STIG Viewer, STIG Manager                                                                      |
