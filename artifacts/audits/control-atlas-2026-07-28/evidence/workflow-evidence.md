# Practitioner workflow evidence

Status vocabulary: Pass, Fail, Blocked, or Skipped with reason.

| Workflow | Status | Evidence |
|---|---|---|
| Find known identifier AC-2 | Pass with defect | `#/search?q=AC-2` returned the control and an assessment procedure. It did not directly navigate. The result identity was clear, but Search used an Explore eyebrow and Catalog selected state. |
| Find known identifier DE.AE-08 | Fail | The record exposed only the identifier as title and misattributed CSF text to SP 800-53 Rev. 5. |
| Search an unfamiliar topic | Pass with defect | `encryption` returned eligible matches and a visible count. A legacy FedRAMP resource ranked before the control records, and categories hid most results. |
| Honest zero results | Pass | `zzzz-no-such-control` produced “No matching records found” and did not inject editorial non-matches. |
| Distinguish exact and ambiguous queries | Fail | Search handles both as result lists; exact-identifier direct navigation is not implemented as the stated doctrine permits. |
| Locate official identity, text, source, position, and relationships | Fail | AC-2 is usable but overloaded. DE.AE-08 has no descriptive title and the wrong displayed source identity. |
| Trace a relationship and return | Pass with friction | Record links open related records and browser history returns, but dense repeated provenance and confidence prose obscures the relationship itself. |
| Explore shallow-to-deep with Path, Map, and List | Fail | Path/Map/List appear only after a record is selected. Path is a relationship-stage wizard, Map is a record neighborhood, and no atlas-level overview exists. |
| Preserve Explore state | Pass | Focused record and selected Path/Map/List state serialize in the hash URL. |
| Compare frameworks | Fail | Choosing “Framework to framework” changed the URL to a configured intent but left the same chooser on screen with only an active card. No workbench appeared. |
| Find and evaluate a source | Pass with friction | Sources lists 46 public sources and explains provenance. The page is sparse, filter-heavy, and spends first-screen copy redirecting users to Build. |
| Find a tool, template, dataset, training item, or community | Pass with severe discoverability defect | Resources contains 96 useful records and 12 starter collections, but the defining ecosystem is subordinate to Build, behind task cards, and absent from primary navigation. |
| Start Here source navigation | Fail | Cloud SaaS, Moderate, Federal civilian produced the same seven-source set as every other complete answer combination. The page says “Based on” the answers although they do not affect eligibility or order. |
| Build a starter document | Fail | Code-derived evidence shows an unselected baseline silently defaults to Moderate and enters generated output. Preview can be unavailable while Download remains enabled. |
| Recover from invalid route | Pass | `#/definitely-not-a-route` produced a clear Page not found state. |
| Recover from retired route | Pass with identity defect | `#/retired?from=library` canonicalized to `#/retired` and showed the Search surface with generic retirement copy. |
| Recover from invalid parameters | Pass with gaps | Route parsing discards several invalid values, but recovery explanations are inconsistent and Resources exposes parsed parameters that the surface ignores. |
| Refresh, back, forward, copy links | Fail | Explore focus state survives. Catalog query/family/browse-all, Sources query, Build local filters, and Resources “show all” are local component state. |
| Mobile parity | Fail | Main destinations remain present, but long stacks bury outcomes; Compare remains a dead chooser; tablet Explore Map clips controls; record actions occupy the first mobile screen before official text. |
| Keyboard-only | Pass with friction | AC-2 tab order moved through Skip, global navigation, Search, Sources, Help, Start Here, record back/context controls, and Explore. The full header precedes record tasks. |
| 200% zoom | Blocked | Effective-width proxies found a tablet overflow, but actual 200% browser zoom could not be measured reliably. |
| Human screen-reader and physical device | Skipped with reason | No NVDA, VoiceOver, TalkBack, or physical device was available. Automated and DOM evidence are reported separately. |

## Reproduced high-risk defects

### Source identity conflation

Live route: `#/record/csf-2/DE.AE-08`

Visible:

- `Requirement`
- `DE.AE-08`
- `Official description`
- `Source excerpt from SP 800-53 Rev. 5`
- CSF 2.0 structural trail and CSF-to-800-53 mappings

Code cause:

- `data/csf-subcategories.json` declares `source_key: "nist-oscal"`.
- `scripts/build-framework-data.mjs` assigns `csf-subcategories.json` to `nist-oscal`.
- `data/source-registry.json` displays `nist-oscal` as `SP 800-53 Rev. 5`, despite metadata saying the entry covers several frameworks.
- `ObjectDetailPage.tsx` presents that shared display name as the source of the record excerpt.

This is a Critical product defect because the interface attributes official CSF source text to a different NIST publication.

### Start Here answers do not change the result

Live result URL:

`#/start?step=results&systemType=Cloud+SaaS&dataSensitivity=Moderate&environment=Federal+civilian`

The result says it is based on those answers and lists seven sources. `src/ui/lib/startHereRecommendations.mjs` returns the same seven entries for every complete answer set. This is a questionnaire-shaped false affordance, not a functioning source navigator.

### Compare intent does not open the workbench

From `#/compare`, activating Framework to framework produced:

`#/compare?crosswalk=relationships&workbench=relationships&intent=Framework+to+framework`

The page remained the five-card chooser. The selected card gained an active state, but no mapping workbench, next field, error, or recovery instruction appeared.

### Explore is not an atlas-level map

Focused route:

`#/explore?node=nist-800-53%3AAC-2&relationshipView=map`

The Map view shows AC-2 surrounded by six grouped connection categories. It is a bounded record neighborhood and intentionally requires a selected record. No framework/topic overview is available, so users cannot “open the Atlas” and orient before choosing a record.

