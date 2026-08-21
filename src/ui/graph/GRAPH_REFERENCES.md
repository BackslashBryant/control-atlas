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

Control Atlas uses React Flow for bounded, curated relationship diagrams and ELK for automatic layout in focused hierarchy/provenance views. The global Atlas map is not a node-link diagram at all: the canonical data is a complete containment tree, so it renders as a decomposition map of labelled rows (`src/ui/components/AtlasDecompositionMap.tsx`), one column per level, with counts and proportional magnitude. Tables, search, filters, and detail pages remain the primary way to browse large crosswalks. Do not rebuild the product around one giant graph canvas.

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
| **Graphology**                                     | In use            | Builds the in-memory projection model (`src/ui/lib/atlasGraphModel.ts`). The Atlas map renders from that model as labelled DOM rows                     |
| **Sigma.js**                                       | Removed           | Rendered the previous canvas Atlas. Every node was an unlabelled mark whose only affordance was hover, so the surface was rebuilt as a decomposition map |
| **D3-force**                                       | Do not use now    | Too custom for the current product and agent-maintained implementation             |
| **Mermaid / Graphviz**                             | Docs only         | Useful for static generated diagrams, not the interactive workbench                |

## Control Atlas source hierarchy/reference set

The source inventory is one model with three views. Purpose is the canonical hierarchy and defines nine top-level categories, dispositions, and the default-map gating model: Rules, Frameworks, Controls, Baselines, Implementation, Assessment, Mappings, Threat / Defense, and Supporting Sources. The default Atlas interface groups the same records by the question a reader arrives with; the RMF lifecycle is an alternate guided view. Managerial, Operational, and Technical are control tags, not document categories.

Key source families from that manifest:

| Family                                   | Examples                                                                                                          |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Rules**                                | FISMA, OMB A-130, 32 CFR Part 2002, FIPS 199, FIPS 200, CNSSI 1253, DoDI 8500.01, DoDI 8510.01, FAR/DFARS clauses |
| **Frameworks**                           | NIST RMF, NIST CSF 2.0, AI RMF, DoD AI Assurance, DoD Zero Trust                                                  |
| **Controls**                             | SP 800-53, SP 800-171, SP 800-172, SSDF                                                                           |
| **Baselines**                            | SP 800-53B, FedRAMP Rev. 5, CMMC, DoD Zero Trust overlays                                                         |
| **Implementation**                       | DISA SRGs, DISA STIGs, STIG/SRG CCI references                                                                    |
| **Assessment**                           | SP 800-53A, SP 800-171A, SP 800-172A, CMMC assessment/scoping guides, FedRAMP artifacts                           |
| **Mappings**                             | DISA CCI, CCI-to-NIST mappings, CSF mappings, OLIR                                                                |
| **Threat / Defense**                     | ATT&CK Enterprise, ATT&CK ICS, D3FEND                                                                             |
| **Supporting Sources**                   | NARA CUI Registry, STIG Viewer, STIG Manager                                                                      |
