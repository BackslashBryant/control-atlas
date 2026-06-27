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

## React Flow / ELK graph implementation resources

| Resource                    | Link                                                                                 | Use                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| **React Flow docs**         | [https://reactflow.dev/](https://reactflow.dev/)                                     | Interactive node-link diagram API, controls, minimap, custom React nodes      |
| **React Flow learning docs** | [https://reactflow.dev/learn](https://reactflow.dev/learn)                           | Implementation patterns for nodes, edges, viewport behavior, and accessibility |
| **React Flow repository**   | [https://github.com/xyflow/xyflow](https://github.com/xyflow/xyflow)                 | Package source and release context                                            |
| **ELK.js repository**       | [https://github.com/kieler/elkjs](https://github.com/kieler/elkjs)                   | Automatic layout for directed node-link diagrams                              |
| **ELK reference examples**  | [https://github.com/kieler/elkjs/tree/master/test](https://github.com/kieler/elkjs/tree/master/test) | Layout graph shape and option examples                                        |

Control Atlas uses React Flow for bounded, curated relationship diagrams and ELK for automatic layout. Tables, search, filters, and detail pages remain the primary way to browse large crosswalks. Do not rebuild the product around one giant graph canvas.

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
| **Cytoscape.js**                                   | Replaced          | Better for open-ended graph/network analysis than guided relationship diagrams     |
| **Sigma.js / Graphology**                          | Reference only    | Better for a future large graph explorer, not current bounded relationship paths    |
| **D3-force**                                       | Do not use now    | Too custom for the current product and agent-maintained implementation             |
| **Mermaid / Graphviz**                             | Docs only         | Useful for static generated diagrams, not the interactive workbench                |

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
