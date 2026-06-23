# Control Atlas Graph References

| Reference | Link | Use |
| --- | --- | --- |
| Cytoscape.js docs | https://js.cytoscape.org/ | Core API, stylesheet, events, layouts |
| Cytoscape.js demos | https://js.cytoscape.org/#demos | Demo patterns |
| fCoSE repo | https://github.com/iVis-at-Bilkent/cytoscape.js-fcose | Dense expanded cluster layout |
| Dagre repo | https://github.com/cytoscape/cytoscape.js-dagre | Left-to-right source/chain layouts |
| Popper repo | https://github.com/cytoscape/cytoscape.js-popper | Tooltip positioning |
| Tippy docs | https://atomiks.github.io/tippyjs/ | Tooltip behavior |
| ATT&CK Matrix | https://attack.mitre.org/ | Good matrix/navigation reference |
| ATT&CK STIX data | https://github.com/mitre-attack/attack-stix-data | Threat data source/reference |
| D3FEND Matrix | https://d3fend.mitre.org/ | Defensive mapping reference |
| D3FEND Resources | https://d3fend.mitre.org/resources/ | D3FEND ontology/mapping/API resources |
| NIST OSCAL content repo | https://github.com/usnistgov/oscal-content | NIST OSCAL source content |
| NIST CSF | https://www.nist.gov/cyberframework | CSF 2.0 and mapping reference |
| NIST OLIR | https://csrc.nist.gov/projects/olir | Crosswalk/informative reference source |

## Layout contract

- Default source hierarchy: dagre, left-to-right.
- Focused control and non-control maps: concentric, control-anchored.
- Expanded dense clusters: fCoSE.
- STIG to CCI to NIST and Threat to Defense to Control chains: dagre.
- Tooltips: cytoscape-popper with Tippy.js.

The map model owns hierarchy, source gating, and graph roles. Layout libraries render that model; they do not infer source authority or product structure.
